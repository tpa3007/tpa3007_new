// server.js
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
const { createClient } = require('redis');
const { WalletContractV4 } = require('@ton/ton');
const { mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fastifyCors = require('@fastify/cors');
const axios = require('axios');

// --- Конфигурация ---
const PORT = 3000;
const USDT_JETTON_MASTER = process.env.USDT_JETTON_MASTER_ADDRESS;

// --- DB Connection ---
const pgPool = new Pool({
  user: process.env.DB_USER || 'thyss_user',
  host: process.env.DB_HOST || 'thyss_db',
  database: process.env.DB_NAME || 'thyss',
  password: process.env.DB_PASSWORD || 'secure_pass',
  port: process.env.DB_PORT || 5432,
});

// --- Redis Connection ---
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'thyss_redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  }
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
(async () => { await redisClient.connect(); })();

// --- CORS ---
fastify.register(fastifyCors, {
  origin: '*', 
  methods: ['GET', 'POST']
});

// ==========================================================
// УТИЛИТЫ БЕЗОПАСНОСТИ
// ==========================================================

// Генерация API-ключа (Key + Prefix + Hash)
async function createApiKeyData() {
    const key = crypto.randomBytes(32).toString('hex');
    const prefix = key.substring(0, 8);
    const hash = await bcrypt.hash(key, 10);
    return { key, prefix, hash };
}

// Поиск бренда по ключу (Безопасный метод)
async function getBrandIdByApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) return null;
    
    const prefix = apiKey.substring(0, 8);
    
    // 1. Быстрый поиск по префиксу
    const query = 'SELECT brand_id, key_hash FROM api_keys WHERE prefix = $1 AND is_active = true';
    const result = await pgPool.query(query, [prefix]);

    // 2. Сверка хеша
    for (const row of result.rows) {
        const match = await bcrypt.compare(apiKey, row.key_hash);
        if (match) return row.brand_id;
    }
    return null;
}

// Шифрование AES-GCM
function encryptAESGCM(text, keyBuffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        encrypted_data: encrypted,
        iv: iv,
        tag: cipher.getAuthTag()
    };
}

// Получение курса (Кеширование 2 мин)
async function getFiatRate(currency) {
    const pair = `USDT/${currency.toUpperCase()}`;
    const cacheKey = `thyss:rate:${pair}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return parseFloat(cached);

    try {
        let rate = 1; 
        if (currency.toLowerCase() === 'rub') {
            const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub');
            rate = res.data.tether.rub;
        }
        await redisClient.setEx(cacheKey, 120, rate.toString());
        return rate;
    } catch (e) {
        console.error('[THYSS-SERVER] Rate Error:', e.message);
        return currency.toLowerCase() === 'rub' ? 95.0 : 1; // Fallback
    }
}

// ==========================================================
// API ЭНДПОИНТЫ
// ==========================================================

// 1. Создание платежа
fastify.post('/create-payment', async (req, reply) => {
    const apiKey = req.headers['x-api-key'];
    const brandId = await getBrandIdByApiKey(apiKey);
    
    if (!brandId) return reply.code(401).send({ error: 'Invalid API Key' });

    const { order_id, amount_usdt, amount_rub } = req.body;

    // Конвертация
    let finalAmountUSDT = 0;
    let originalAmount = null;
    let originalCurrency = null;

    if (amount_usdt) {
        finalAmountUSDT = parseFloat(amount_usdt);
    } else if (amount_rub) {
        const rate = await getFiatRate('rub');
        // +2% маржа на волатильность
        finalAmountUSDT = (parseFloat(amount_rub) / rate) * 1.02;
        finalAmountUSDT = parseFloat(finalAmountUSDT.toFixed(2));
        originalAmount = amount_rub;
        originalCurrency = 'RUB';
    } else {
        return reply.code(400).send({ error: 'Provide amount_usdt or amount_rub' });
    }

    if (finalAmountUSDT <= 0) return reply.code(400).send({ error: 'Invalid amount' });

    try {
        // Генерация кошелька
        const mnemonic = await mnemonicNew();
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const address = wallet.address.toString();

        // Шифрование данных (генерируем уникальный ключ для этой транзакции)
        const kmsKey = crypto.randomBytes(32); 
        const { encrypted_data, iv, tag } = encryptAESGCM(mnemonic.join(' '), kmsKey);

        const client = await pgPool.connect();
        try {
            await client.query('BEGIN');
            
            // Вставка платежа
            const paymentRes = await client.query(`
                INSERT INTO payments (brand_id, order_id, amount_usdt, amount_original, currency_original, expires_at)
                VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '15 minutes')
                RETURNING id, expires_at
            `, [brandId, order_id, finalAmountUSDT, originalAmount, originalCurrency]);
            
            const paymentId = paymentRes.rows[0].id;
            const expiresAt = paymentRes.rows[0].expires_at;

            // Вставка адреса и ключей
            await client.query(`
                INSERT INTO payment_addresses (payment_id, address, encrypted_mnemonic, aes_key, aes_iv, aes_tag)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [paymentId, address, Buffer.from(encrypted_data, 'hex'), kmsKey, iv, tag]);

            await client.query('COMMIT');

            // QR Code Data (USDT transfer link)
            const amountNano = BigInt(Math.round(finalAmountUSDT * 1000000)); // USDT = 6 decimals
            const qrData = `ton://transfer/${address}?amount=${amountNano.toString()}&jetton=${USDT_JETTON_MASTER}`;

            console.log(`[THYSS] Created payment ${paymentId} for ${finalAmountUSDT} USDT`);

            reply.send({
                payment_id: paymentId,
                order_id: order_id,
                amount_usdt: finalAmountUSDT,
                currency: 'USDT',
                rate_applied: originalAmount ? (originalAmount / finalAmountUSDT).toFixed(2) : null,
                address: address,
                qr_data: qrData,
                expires_at: expiresAt
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        req.log.error(err);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
});

// 2. Проверка статуса
fastify.get('/invoice/:id', async (req, reply) => {
    const { id } = req.params;
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) return reply.code(400).send({ error: 'Invalid ID' });

    const res = await pgPool.query(`
        SELECT status, amount_usdt, created_at, expires_at, paid_at 
        FROM payments WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    reply.send(res.rows[0]);
});

// 3. (Dev) Создание бренда и ключа
fastify.post('/admin/create-brand', async (req, reply) => {
    const { name } = req.body;
    const client = await pgPool.connect();
    try {
        const brandRes = await client.query('INSERT INTO brands (name) VALUES ($1) RETURNING id', [name]);
        const brandId = brandRes.rows[0].id;
        
        const { key, prefix, hash } = await createApiKeyData();
        await client.query('INSERT INTO api_keys (brand_id, prefix, key_hash) VALUES ($1, $2, $3)', [brandId, prefix, hash]);
        
        reply.send({ brand_id: brandId, api_key: key, msg: "SAVE THIS KEY SECURELY" });
    } finally {
        client.release();
    }
});

// Запуск
const start = async () => {
    try {
        await fastify.listen({ host: '0.0.0.0', port: PORT });
        console.log(`[THYSS] Server listening on http://0.0.0.0:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();