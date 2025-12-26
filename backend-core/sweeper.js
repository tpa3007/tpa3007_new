require('dotenv').config();
const { TonClient, WalletContractV4, internal, fromNano, toNano, Address, beginCell } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const { createClient } = require('@supabase/supabase-js');

// --- КОНФИГУРАЦИЯ ---
const MIN_TON_FOR_GAS = toNano("0.08"); // Если меньше этого, заправляем
const GAS_TO_SEND = toNano("0.15");     // Сколько заправляем
const USDT_MASTER = Address.parse(process.env.USDT_MASTER_ADDRESS);

// Инициализация
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const client = new TonClient({
    endpoint: process.env.TON_ENDPOINT,
    apiKey: process.env.TON_API_KEY,
});

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Получаем адрес жетон-кошелька USDT для конкретного пользователя
async function getJettonWalletAddress(userAddress) {
    const { stack } = await client.runMethod(USDT_MASTER, 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }
    ]);
    return stack.readAddress();
}

// Узнаем баланс USDT
async function getJettonBalance(jettonWalletAddress) {
    try {
        const { stack } = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
        const balance = stack.readBigNumber();
        return balance;
    } catch (e) {
        return 0n; // Если кошелек не активирован, баланс 0
    }
}

// Утилита паузы
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- ОСНОВНАЯ ЛОГИКА ---

// 1. Проверка и пополнение газа (Gas Pump)
async function ensureGas(userAddress, masterKeyPair) {
    const balance = await client.getBalance(userAddress);
    console.log(`   ⛽ [GAS] Balance: ${fromNano(balance)} TON`);

    if (balance >= MIN_TON_FOR_GAS) {
        return true; // Газа хватает
    }

    console.log(`   ⛽ [GAS] Low balance. Refueling from Master...`);

    // Подключаем Мастер-кошелек
    const masterWallet = client.open(WalletContractV4.create({ workchain: 0, publicKey: masterKeyPair.publicKey }));
    const seqno = await masterWallet.getSeqno();

    // Шлем TON
    await masterWallet.sendTransfer({
        seqno,
        secretKey: masterKeyPair.secretKey,
        messages: [
            internal({
                to: userAddress,
                value: GAS_TO_SEND,
                bounce: false,
                body: "THYSS Gas Refuel",
            })
        ]
    });

    console.log(`   ⏳ [GAS] Refuel sent. Waiting 15s for blockchain...`);
    await sleep(15000); // Ждем подтверждения блока
    return true;
}

// 2. Вывод USDT (Sweep)
async function sweepWallet(walletRecord, masterKeyPair) {
    console.log(`🔎 Checking wallet: ${walletRecord.address}`);
    
    const userAddress = Address.parse(walletRecord.address);
    const destinationAddress = Address.parse(walletRecord.destination_address);
    const userKeyPair = await mnemonicToPrivateKey(walletRecord.mnemonic.split(" "));

    // A. Проверяем баланс USDT
    const jettonWalletAddress = await getJettonWalletAddress(userAddress);
    const usdtBalance = await getJettonBalance(jettonWalletAddress);

    if (usdtBalance === 0n) {
        console.log(`   ❌ No USDT found. Skipping.`);
        return;
    }

    console.log(`   💰 Found ${(Number(usdtBalance) / 1000000).toFixed(2)} USDT!`);

    // B. Обеспечиваем Газ
    await ensureGas(userAddress, masterKeyPair);

    // C. Формируем транзакцию вывода
    const userWallet = client.open(WalletContractV4.create({ workchain: 0, publicKey: userKeyPair.publicKey }));
    const seqno = await userWallet.getSeqno();

    // Тело транзакции (Token Transfer)
    const transferBody = beginCell()
        .storeUint(0xf8a7ea5, 32)             // OpCode: transfer
        .storeUint(0, 64)                     // query_id
        .storeCoins(usdtBalance)              // amount (ВСЁ что есть)
        .storeAddress(destinationAddress)     // destination (Бренд)
        .storeAddress(destinationAddress)     // response_destination (Сдача TON тоже Бренду)
        .storeBit(0)                          // custom_payload (null)
        .storeCoins(toNano("0.01"))           // forward_ton_amount (уведомление)
        .storeBit(0)                          // forward_payload (null)
        .endCell();

    // Отправка
    await userWallet.sendTransfer({
        seqno,
        secretKey: userKeyPair.secretKey,
        messages: [
            internal({
                to: jettonWalletAddress, // Шлем команду контракту USDT
                value: toNano("0.06"),   // Платим за процессинг перевода
                bounce: true,
                body: transferBody,
            })
        ]
    });

    console.log(`   ✅ [SUCCESS] Swept to ${walletRecord.destination_address}`);
    
    // D. Можно пометить в базе, что деньги собраны (опционально)
    // await supabase.from('wallets').update({ last_check: new Date() }).eq('id', walletRecord.id);
}

// --- ГЛАВНЫЙ ЦИКЛ ---
async function main() {
    console.log("🚀 THYSS Sweeper v2.0 (Supabase Edition) Started...");
    
    // Загружаем мастер-ключ один раз при старте
    try {
        if (!process.env.MASTER_MNEMONIC) throw new Error("MASTER_MNEMONIC is missing in .env");
        var masterKeyPair = await mnemonicToPrivateKey(process.env.MASTER_MNEMONIC.split(" "));
    } catch (e) {
        console.error("❌ Init Error:", e.message);
        return;
    }

    while (true) {
        try {
            // 1. Берем кошельки из базы
            const { data: wallets, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('status', 'active'); // Берем все активные

            if (error) throw error;

            if (!wallets || wallets.length === 0) {
                console.log("💤 Database empty or no active wallets. Sleeping...");
            } else {
                // 2. Проходимся по каждому
                for (const wallet of wallets) {
                    await sweepWallet(wallet, masterKeyPair);
                    await sleep(1000); // Пауза 1 сек между кошельками
                }
            }

        } catch (error) {
            console.error("🔥 Error in loop:", error.message);
        }
        
        console.log("💤 Sleeping 30s...");
        await sleep(30000); // Проверяем раз в 30 секунд
    }
}

main();