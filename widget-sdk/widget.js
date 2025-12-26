(function() {
    // --- КОНФИГУРАЦИЯ ---
    const DEFAULT_CONFIG = {
        // Указываем адрес твоего Next.js API (локально порт 3001)
        API_BASE: 'http://localhost:3001/api', 
        POLL_INTERVAL: 3000 // Опрос каждые 3 секунды
    };

    // --- ГЛОБАЛЬНЫЙ ОБЪЕКТ THYSS ---
    window.THYSS = {
        checkInterval: null,
        currentWallet: null,
        config: {},

        // Инициализация (вызывается из HTML для настройки ключа)
        init: function(userConfig) {
            this.config = { ...DEFAULT_CONFIG, ...userConfig };
            console.log("THYSS Widget Initialized with Key:", this.config.apiKey);
        },

        // 1. Открыть виджет (Создать платеж)
        open: async function(amount, currency = 'USDT') {
            // Если конфиг не был инициализирован через init(), пробуем найти глобальный объект
            if (!this.config.apiKey) {
                if (window.THYSS_CONFIG && window.THYSS_CONFIG.apiKey) {
                    this.config = { ...DEFAULT_CONFIG, ...window.THYSS_CONFIG };
                } else {
                    alert("Error: API Key is missing. Please set window.THYSS_CONFIG = { apiKey: '...' }");
                    return;
                }
            }

            const overlay = document.getElementById('thyss-overlay');
            const qrImg = document.getElementById('thyss-qr-img');
            const addrText = document.getElementById('thyss-address-text');
            const amountVal = document.getElementById('thyss-amount-val');
            const statusText = document.getElementById('thyss-status-text'); // Можно добавить элемент для статуса

            // Сброс UI перед открытием
            this.resetUI();
            
            // Показываем оверлей
            overlay.style.display = 'flex';
            amountVal.innerText = amount;
            addrText.innerText = "GENERATING...";
            
            try {
                // Запрос к Next.js API
                const response = await fetch(`${this.config.API_BASE}/payment/create`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-api-key': this.config.apiKey // <-- ВАЖНО: Передаем ключ
                    },
                    body: JSON.stringify({ amount, currency })
                });

                const data = await response.json();

                if (data.success) {
                    this.currentWallet = data.address;
                    addrText.innerText = this.shortenAddress(data.address);
                    
                    // Генерируем ссылку для кошелька (Deep Link)
                    // Для Mainnet USDT используем правильный формат, если нужно.
                    // Пока простая передача TON/Comment, но для Jetton (USDT) лучше указывать адрес контракта.
                    // Для MVP ссылка на трансфер TON подойдет, но пользователь должен сам выбрать USDT в кошельке.
                    // Либо используем формат ton://transfer/<address>?amount=...&bin=... (для body транзакции), но это сложно.
                    // Оставим простую ссылку, современные кошельки понимают.
                    const tonkeeperLink = `ton://transfer/${data.address}?amount=${data.amount * 1000000}`; // amount в нано-единицах (примерно)
                    
                    // Генерируем QR код через внешний сервис (для простоты)
                    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tonkeeperLink)}`;

                    // Запускаем проверку статуса
                    this.startPolling(data.address);
                } else {
                    console.error(data);
                    alert("Error creating payment: " + (data.error || "Unknown error"));
                    this.close();
                }
            } catch (e) {
                console.error(e);
                alert("Connection error. Check console.");
                this.close();
            }
        },

        // 2. Проверка статуса
        startPolling: function(address) {
            if (this.checkInterval) clearInterval(this.checkInterval);
            
            console.log("Started polling for address:", address);

            this.checkInterval = setInterval(async () => {
                try {
                    const res = await fetch(`${this.config.API_BASE}/payment/status?address=${address}`);
                    const data = await res.json();

                    if (data.status === 'confirmed') {
                        this.onSuccess();
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, this.config.POLL_INTERVAL);
        },

        // 3. Успех
        onSuccess: function() {
            clearInterval(this.checkInterval);
            const body = document.querySelector('.thyss-body');
            // Заменяем контент на успех
            body.innerHTML = `
                <div style="padding:40px 0; animation: thyss-fade-in 0.5s;">
                    <div style="font-size:60px;">✅</div>
                    <h2 style="margin-top:20px; font-weight:900; letter-spacing: -1px;">PAID!</h2>
                    <p style="margin-top:10px; font-size: 12px; opacity: 0.6;">Redirecting...</p>
                </div>
            `;
            setTimeout(() => {
                this.close();
                // window.location.reload(); // Или редирект
            }, 3000);
        },

        // 4. Утилиты
        close: function() {
            document.getElementById('thyss-overlay').style.display = 'none';
            if (this.checkInterval) clearInterval(this.checkInterval);
            // Возвращаем исходный HTML (чтобы можно было открыть снова без перезагрузки)
            // Но проще просто перезагрузить страницу или пересоздать DOM при следующем open
            // Для MVP оставим как есть, при повторном open() html не сбросится полностью без reload, 
            // поэтому добавим метод resetUI
        },

        resetUI: function() {
             // Восстанавливаем внутренности .thyss-body, если они были заменены на "PAID"
             const body = document.querySelector('.thyss-body');
             if(!document.getElementById('thyss-qr-img')) {
                 // Если элементов нет (было сообщение об успехе), восстанавливаем HTML
                 body.innerHTML = window.THYSS_INITIAL_BODY_HTML;
             }
        },

        copyAddress: function() {
            if(!this.currentWallet) return;
            navigator.clipboard.writeText(this.currentWallet);
            // Визуальный фидбек
            const btn = document.querySelector('.thyss-address-box');
            const originalBg = btn.style.background;
            btn.style.background = '#00FF00'; // Flash green
            setTimeout(() => { btn.style.background = originalBg; }, 200);
        },

        openWallet: function() {
            if(!this.currentWallet) return;
            window.location.href = `ton://transfer/${this.currentWallet}`;
        },

        shortenAddress: function(addr) {
            return addr.slice(0, 4) + '...' + addr.slice(-4);
        }
    };

    // --- 1. CSS STYLES (BRUTALISM & LIQUID MASCOT) ---
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        #thyss-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); backdrop-filter: grayscale(100%);
            display: none; justify-content: center; align-items: center; z-index: 2147483647;
        }

        #thyss-terminal {
            background: #F3F3F3;
            border: 3px solid black;
            width: 380px;
            box-shadow: 12px 12px 0px 0px #000; /* Brutalist Shadow */
            position: relative;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            color: black;
            display: flex;
            flex-direction: column;
            animation: thyss-slide-up 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        @keyframes thyss-slide-up {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes thyss-fade-in {
            from { opacity: 0; } to { opacity: 1; }
        }

        /* Header */
        .thyss-header {
            background: black;
            color: white; padding: 12px 16px;
            font-weight: 700; font-size: 14px; letter-spacing: 1px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 3px solid black;
        }
        .thyss-close { cursor: pointer; transition: opacity 0.2s; }
        .thyss-close:hover { opacity: 0.6; }

        /* Body */
        .thyss-body { padding: 24px; text-align: center; position: relative; min-height: 400px; display: flex; flex-direction: column; justify-content: center; }

        /* MASCOT (Liquid Blob) */
        .thyss-mascot-wrapper {
            width: 60px; height: 60px; margin: 0 auto 15px auto;
            position: relative;
        }
        .thyss-blob {
            width: 100%; height: 100%;
            background: black;
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            animation: thyss-morph 4s ease-in-out infinite;
        }
        @keyframes thyss-morph {
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.1); }
            100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); }
        }

        /* Amount */
        .thyss-amount-box {
            font-size: 32px; font-weight: 700; margin-bottom: 20px;
            border-bottom: 2px dashed black; padding-bottom: 15px;
        }
        .thyss-currency { font-size: 16px; vertical-align: top; margin-left: 5px; }

        /* QR Code */
        .thyss-qr-container {
            width: 180px; height: 180px; margin: 0 auto;
            border: 2px solid black; padding: 5px; background: white;
            position: relative;
        }
        .thyss-qr-img { width: 100%; height: 100%; image-rendering: pixelated; }

        /* Address & Copy */
        .thyss-address-box {
            margin-top: 20px; font-size: 11px; background: #E5E5E5;
            padding: 8px; border: 1px solid black; cursor: pointer;
            display: flex; justify-content: space-between; align-items: center;
            transition: background 0.2s;
        }
        .thyss-address-box:hover { background: #d4d4d4; }
        .thyss-address-box:active { background: black; color: white; }
        .thyss-copy-icon { font-weight: bold; font-size: 10px; text-transform: uppercase; }

        /* Button */
        .thyss-btn {
            background: black; color: white; border: none; padding: 16px; width: 100%;
            font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
            margin-top: 24px; text-transform: uppercase; letter-spacing: 0.5px;
            transition: all 0.1s; border: 2px solid black;
        }
        .thyss-btn:hover { background: white; color: black; box-shadow: 4px 4px 0px 0px black; transform: translate(-2px, -2px); }
        .thyss-btn:active { transform: translate(0, 0); box-shadow: none; }
    `;
    document.head.appendChild(style);

    // --- 2. HTML STRUCTURE ---
    // Сохраняем шаблон тела для восстановления после успеха
    window.THYSS_INITIAL_BODY_HTML = `
        <div class="thyss-mascot-wrapper"><div class="thyss-blob"></div></div>
        <div class="thyss-amount-box">
            <span id="thyss-amount-val">...</span><span class="thyss-currency">USDT</span>
        </div>
        <div class="thyss-qr-container">
            <img id="thyss-qr-img" class="thyss-qr-img" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Loading..." />
        </div>
        <div class="thyss-address-box" onclick="THYSS.copyAddress()">
            <span id="thyss-address-text">GENERATING...</span>
            <span class="thyss-copy-icon">[COPY]</span>
        </div>
        <button class="thyss-btn" id="thyss-action-btn" onclick="THYSS.openWallet()">
            Open Wallet App
        </button>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'thyss-overlay';
    overlay.innerHTML = `
        <div id="thyss-terminal">
            <div class="thyss-header">
                <span>// THYSS_PAYMENT_V1</span>
                <span class="thyss-close" onclick="THYSS.close()">[ESC]</span>
            </div>
            <div class="thyss-body">
                ${window.THYSS_INITIAL_BODY_HTML}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
})();