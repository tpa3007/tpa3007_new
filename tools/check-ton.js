// check-ton.js
const { TonClient, Address } = require('@ton/ton');
require('dotenv').config(); // Загружаем переменные окружения из .env

// Твой тестовый кошелек в Testnet (замените на свой реальный адрес)
// Пример: 'EQDummyAddressForNow' - это заглушка, нужен реальный адрес
const rawWalletAddress = '0QBrQfMZZlVOnaPhmrDkP1V7o3FKBj4lPrc4wmStRJ-hfFc0'; // <-- ВСТАВЬТЕ СЮДА СВОЙ РЕАЛЬНЫЙ АДРЕС КОШЕЛЬКА В TESTNET

let walletAddress;
try {
  // Преобразуем адрес в формат, понятный TonClient (EQ...)
  walletAddress = Address.parse(rawWalletAddress).toString();
  console.log(`Адрес кошелька (EQ...): ${walletAddress}`);
} catch (e) {
  console.error('❌ Ошибка при парсинге адреса:', e.message);
  process.exit(1); // Завершаем скрипт, если адрес невалиден
}

async function checkBalance() {
    const client = new TonClient({
        endpoint: process.env.TON_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY // Используем API-ключ из .env
    });

    try {
        const balance = await client.getBalance(walletAddress);
        // BigInt balance нужно преобразовать к числу перед делением
        const balanceInTON = Number(balance) / 1e9;
        console.log(`✅ Баланс: ${balanceInTON.toFixed(2)} TON`);
    } catch (error) {
        console.error('❌ Ошибка при проверке баланса:', error.message);
    }
}

checkBalance();