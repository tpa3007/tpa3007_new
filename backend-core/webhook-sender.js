require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Инициализация (используем Service Role Key для доступа к БД)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Функция отправки одного вебхука
async function sendWebhook(payment) {
    try {
        // 1. Получаем URL вебхука бренда, к которому относится платеж
        const { data: brand, error } = await supabase
            .from('brands')
            .select('webhook_url')
            .eq('id', payment.brand_id) // В таблице payments должен быть brand_id (мы берем его через wallet, но для упрощения считаем, что он там есть или джойним)
            // УПРОЩЕНИЕ: Если в payments нет brand_id, нужно сделать join через wallets -> brands. 
            // Но для MVP давай предположим, что URL мы знаем или захардкодим для теста, 
            // либо ты добавишь brand_id в таблицу payments при создании.
            .single();

        // Если brand_id нет в payments, давай достанем его через wallet
        let webhookUrl = brand?.webhook_url;
        
        if (!webhookUrl) {
             // Попробуем достать через кошелек, если прямой связи нет
             const { data: wallet } = await supabase.from('wallets').select('id, brand_id').eq('id', payment.wallet_id).single();
             if (wallet && wallet.brand_id) {
                 const { data: b } = await supabase.from('brands').select('webhook_url').eq('id', wallet.brand_id).single();
                 webhookUrl = b?.webhook_url;
             }
        }

        if (!webhookUrl) {
            console.error(`[SKIP] No webhook URL found for payment ${payment.order_id}`);
            return { success: false, error: 'No URL configured' };
        }

        console.log(`🚀 Sending webhook to ${webhookUrl} for order ${payment.order_id}`);

        const payload = {
            event: 'payment.succeeded',
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: 'confirmed',
            tx_hash: null // Можно добавить, если сохраняем
        };

        // Отправляем POST запрос
        await axios.post(webhookUrl, payload, { timeout: 10000 });
        return { success: true };

    } catch (err) {
        console.error(`❌ Webhook Failed for ${payment.order_id}:`, err.message);
        return { success: false, error: err.message };
    }
}

// Главный цикл
async function processWebhooks() {
    // Ищем платежи: статус 'confirmed', но флаг webhook_sent = false
    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'confirmed')
        .eq('webhook_sent', false); 

    if (error) {
        console.error("DB Error:", error.message);
        return;
    }

    if (!payments || payments.length === 0) return;

    console.log(`Found ${payments.length} confirmed payments to notify.`);

    for (const payment of payments) {
        const result = await sendWebhook(payment);

        if (result.success) {
            // Помечаем как отправленный, чтобы не слать вечно
            await supabase
                .from('payments')
                .update({ webhook_sent: true })
                .eq('id', payment.id);
            
            console.log(`✅ Webhook sent & marked for order ${payment.order_id}`);
        }
    }
}

async function start() {
    console.log("📡 Webhook Sender v2.0 (Supabase) Started...");
    while (true) {
        try {
            await processWebhooks();
        } catch (e) {
            console.error("Critical Loop Error:", e.message);
        }
        await new Promise(r => setTimeout(r, 10000)); // Проверка каждые 10 сек
    }
}

start();