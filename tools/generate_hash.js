const bcrypt = require('bcrypt');

const rawApiKey = 'tpa3007'; // Замени на свой
const saltRounds = 10; // Стандартное значение

bcrypt.hash(rawApiKey, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing:', err);
        return;
    }
    console.log('Generated hash:', hash);
    // Скопируй этот хеш
});