// verify_key_by_id.js
const bcrypt = require('bcrypt');

// СКОПИРОВАННЫЙ UUID ИЗ БД КАК "rawid"
const rawId = 'f890214c-4be0-4ee0-80ab-2481442d26f6'; // <-- ЗАМЕНИ НА ТОТ UUID, КОТОРЫЙ ТЫ СКОПИРОВАЛ ИЗ БД
console.log(`Проверяем UUID: ${rawId}`);

// СКОПИРОВАННЫЙ ХЕШ ИЗ БД
const storedHash = '$2b$10$06AMailbwTQf6NP7eprFE.geZ5/PpXDu/JkRzi573p9IeVM/kWI9Ong'; // <-- ЗАМЕНИ НА ТОЧНОЕ ЗНАЧЕНИЕ ИЗ ТАБЛИЦЫ api_keys.key_hash

async function check() {
    const isMatch = await bcrypt.compare(rawId, storedHash);
    if (isMatch) {
        console.log(`Найден совпадающий rawid (UUID): ${rawId}`);
    } else {
        console.log('Совпадений не найдено для UUID.');
    }
}

check();