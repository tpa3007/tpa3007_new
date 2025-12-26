// wallet-access-tool.js
// require('dotenv').config(); // УБРАТЬ эту строку, если переменные передаются через docker-compose.yml

const { Pool } = require('pg');
const { mnemonicToPrivateKey, keyToWalletAddress } = require('@ton/crypto');
const { TonClient, WalletContractV4 } = require('@ton/ton');
const { internal } = require('@ton/core');
// const bcrypt = require('bcrypt'); // Закомментировано или удалено
const bcrypt = require('bcryptjs'); // Используем bcryptjs

// --- Подключение к PostgreSQL ---
const pgPool = new Pool({
  user: process.env.DB_USER || 'tpa_user',
  host: process.env.DB_HOST || 'tpa3007_db_new', // Имя сервиса в docker-compose.yml
  database: process.env.DB_NAME || 'tpa',
  password: process.env.DB_PASSWORD || 'secure_passports',
  port: process.env.DB_PORT || 5432,
  // ssl: false // Убрано для md5 аутентификации
});

// --- Функция для получения brand_id по api_key (аналогично server.js и dashboard.js) ---
async function getBrandIdByApiKey(apiKey) {
  const hashedApiKey = await bcrypt.hash(apiKey, 10); // Хешируем переданный ключ
  const query = 'SELECT id FROM brands WHERE api_key_hash = $1';
  const result = await pgPool.query(query, [hashedApiKey]);
  return result.rows[0]?.id || null; // Возвращаем id или null
}

// --- Функция для получения зашифрованного мнемоника по payment_id ---
async function getEncryptedMnemonicByPaymentId(paymentId) {
  const query = `
    SELECT encrypted_mnemonic, aes_key, aes_iv, aes_tag, brand_id
    FROM payment_addresses
    WHERE id = $1;`;
  const result = await pgPool.query(query, [paymentId]);
  return result.rows[0]; // Возвращает объект с полями или undefined
}

// --- Функция расшифровки AES-GCM ---
function decryptAESGCM(encryptedDataHex, keyBuffer, ivBuffer, tagBuffer) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
  decipher.setAuthTag(tagBuffer);
  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// --- Пример использования ---
async function main() {
  const args = process.argv.slice(2); // Получаем аргументы командной строки
  const apiKey = args[0];
  const paymentId = args[1];

  if (!apiKey || !paymentId) {
    console.error('Usage: node wallet-access-tool.js <api_key> <payment_id>');
    process.exit(1);
  }

  console.log(`Checking API Key for Payment ID: ${paymentId}`);

  // 1. Проверяем API Key
  const brandId = await getBrandIdByApiKey(apiKey);
  if (!brandId) {
    console.error('Invalid API Key');
    process.exit(1);
  }
  console.log(`API Key is valid for Brand ID: ${brandId}`);

  // 2. Получаем зашифрованные данные
  const walletData = await getEncryptedMnemonicByPaymentId(paymentId);
  if (!walletData) {
    console.error(`Payment ID ${paymentId} not found or no encrypted mnemonic.`);
    process.exit(1);
  }

  // Проверяем, принадлежит ли payment_id запрошенному brand_id
  if (walletData.brand_id !== brandId) {
    console.error(`Payment ID ${paymentId} does not belong to the brand associated with the provided API Key.`);
    process.exit(1);
  }

  console.log(`Found encrypted mnemonic data for Payment ID: ${paymentId}`);

  // 3. Получаем переменные из результата
  const { encrypted_mnemonic, aes_key, aes_iv, aes_tag } = walletData;

  // 4. Преобразуем данные из БД в Buffer (если они хранятся как BYTEA)
  // Предполагаем, что типы в БД: encrypted_mnemonic - BYTEA (Buffer), aes_key - BYTEA (Buffer), aes_iv - BYTEA (Buffer), aes_tag - BYTEA (Buffer)
  const encryptedDataBuffer = Buffer.from(encrypted_mnemonic); // Из BYTEA в Buffer
  const keyBuffer = Buffer.from(aes_key); // Из BYTEA в Buffer
  const ivBuffer = Buffer.from(aes_iv); // Из BYTEA в Buffer
  const tagBuffer = Buffer.from(aes_tag); // Из BYTEA в Buffer

  // 5. Конвертируем Buffer в hex строку для decryptAESGCM (предполагая, что она принимает hex)
  const encryptedDataHex = encryptedDataBuffer.toString('hex');
  const ivHex = ivBuffer.toString('hex');
  const tagHex = tagBuffer.toString('hex');

  // 6. Расшифровываем мнемонику
  try {
    const mnemonicString = decryptAESGCM(encryptedDataHex, keyBuffer, ivBuffer, tagBuffer);
    console.log(`Decrypted Mnemonic Phrase: ${mnemonicString}`);

    // 7. Получаем приватный ключ из мнемоники
    const keyPair = await mnemonicToPrivateKey(mnemonicString.split(' ')); // mnemonicString.split(' ') -> array
    console.log(`Private Key (hex): ${keyPair.secretKey.toString('hex')}`);

    // 8. Создаем кошелёк
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    console.log(`Wallet Address: ${wallet.address.toString()}`);

    // 9. (Опционально) Взаимодействие с кошельком (например, проверка баланса)
    const client = new TonClient({ endpoint: process.env.TON_API_URL || 'https://mainnet.tonapi.io' });
    const balance = await client.getContractState(wallet.address);
    console.log(`Wallet Balance: ${balance.balance} TON`); // Баланс в nanoTON

  } catch (decryptError) {
    console.error('Decryption failed:', decryptError);
    process.exit(1);
  }
}

// Запуск основной функции
main();