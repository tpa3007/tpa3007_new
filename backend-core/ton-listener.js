require('dotenv').config();
const { TonClient, Address, beginCell } = require("@ton/ton");
const { createClient } = require('@supabase/supabase-js');

// --- КОНФИГУРАЦИЯ ---
// Официальный адрес контракта USDT на TON
const USDT_MASTER_ADDRESS = Address.parse(process.env.USDT_MASTER_ADDRESS);
const CHECK_INTERVAL = 5000; // Проверяем каждые 5 секунд

// Инициализация клиентов
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const client = new TonClient({
    endpoint: process.env.TON_ENDPOINT,
    apiKey: process.env.TON_API_KEY,
});

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Вычисляем адрес USDT-кошелька для конкретного пользователя
async function getJettonWalletAddress(userAddress) {
    const { stack } = await client.runMethod(USDT_MASTER_ADDRESS, 'get_wallet_address', [
        { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }
    ]);
    return stack.readAddress();
}

// Узнаем баланс USDT (возвращаем число)
async function getJettonBalance(jettonWalletAddress) {
    try {
        const { stack } = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
        const balance = stack.readBigNumber();
        return Number(balance) / 1000000; // Делим на 10^6, так как у USDT 6 знаков
    } catch (e) {
        // Если кошелек не активен или ошибка сети — считаем баланс 0
        return 0; 
    }
}

// --- ГЛАВНАЯ ЛОГИКА ---

async function checkPendingPayments() {
    // 1. Запрашиваем из базы платежи со статусом 'pending'
    // И сразу подтягиваем данные связанного кошелька (wallets)
    const { data: payments, error } = await supabase
        .from('payments')
        .select(`
            id,
            amount,
            status,
            wallets (
                id,
                address
            )
        `)
        .eq('status', 'pending');

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    if (!payments || payments.length === 0) {
        // Нет ожидающих платежей — тихо выходим
        return;
    }

    console.log(`🔎 Found ${payments.length} pending orders.`);

    // 2. Проверяем каждый найденный платеж
    for (const payment of payments) {
        
        // --- ЗАЩИТА ОТ ОШИБОК (FIX) ---
        // Если у платежа нет привязанного кошелька (ошибка базы или ручного ввода)
        if (!payment.wallets) {
            console.error(`⚠️ [SKIP] Payment ${payment.id} is broken (no linked wallet). Check DB!`);
            continue; // Пропускаем и идем к следующему
        }
        // -----------------------------

        const walletAddress = Address.parse(payment.wallets.address);
        const expectedAmount = Number(payment.amount);

        // Проверяем реальный баланс в блокчейне
        const jettonWallet = await getJettonWalletAddress(walletAddress);
        const currentBalance = await getJettonBalance(jettonWallet);

        console.log(`   Order ...${payment.id.slice(-4)}: Waiting $${expectedAmount} | Found: $${currentBalance}`);

        // 3. Если денег достаточно — подтверждаем
        if (currentBalance >= expectedAmount) {
            console.log(`   ✅ PAYMENT CONFIRMED! Updating DB...`);

            const { error: updateError } = await supabase
                .from('payments')
                .update({ status: 'confirmed' })
                .eq('id', payment.id);

            if (updateError) {
                console.error("   ❌ Failed to update status:", updateError.message);
            } else {
                console.log("   ✨ DB Updated successfully.");
            }
        }
    }
}

// --- ЗАПУСК БЕСКОНЕЧНОГО ЦИКЛА ---
async function start() {
    console.log("👁 THYSS Listener v1.1 (Stable) Started...");
    
    while (true) {
        try {
            await checkPendingPayments();
        } catch (e) {
            console.error("🔥 Critical Listener Error (Loop):", e.message);
        }
        // Пауза перед следующей проверкой
        await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
}

start();