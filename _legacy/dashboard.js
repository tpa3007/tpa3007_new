// dashboard.js
// require('dotenv').config(); // УБРАТЬ эту строку, если переменные передаются через docker-compose.yml

const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
// const { createClient } = require('redis'); // Импортируем createClient, если нужно
const fastifyView = require('@fastify/view');
const path = require('path');
const Eos = require('eosjs'); // Импортируем eosjs
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

// --- Регистрация плагина для шаблонов EJS ---
fastify.register(fastifyView, {
  engine: {
    ejs: require('ejs')
  },
  root: path.join(__dirname, 'views'), // Указываем папку views
  layout: 'layout.ejs' // Указываем общий шаблон (если есть)
});

// --- Подключение статических файлов (CSS, JS, изображения) ---
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // URL-префикс для доступа к файлам
});

// --- Функция для получения brand_id по api_key (аналогично server.js) ---
async function getBrandIdByApiKey(apiKey) {
  const hashedApiKey = await bcrypt.hash(apiKey, 10); // Хешируем переданный ключ
  const query = 'SELECT id FROM brands WHERE api_key_hash = $1';
  const result = await pgPool.query(query, [hashedApiKey]);
  return result.rows[0]?.id || null; // Возвращаем id или null
}

// --- Главная страница дашборда (требует аутентификацию) ---
fastify.get('/', async (req, reply) => {
  // 1. Проверяем наличие сессии (предполагаем, что сессия устанавливается при логине)
  const sessionBrandId = req.session?.brandId; // Пример получения brandId из сессии
  if (!sessionBrandId) {
    // Если сессии нет, перенаправляем на страницу логина
    return reply.redirect('/login');
  }

  // 2. Получаем данные о бренде из БД по sessionBrandId
  const brandQuery = 'SELECT name FROM brands WHERE id = $1';
  const brandResult = await pgPool.query(brandQuery, [sessionBrandId]);
  const brandName = brandResult.rows[0]?.name;

  if (!brandName) {
    // Если бренд не найден, перенаправляем на логин (ошибка сессии)
    return reply.redirect('/login');
  }

  // 3. Получаем список платежей для этого бренда из БД
  const paymentsQuery = `
    SELECT id, order_id, status, amount_usdt, created_at, expires_at, completed_at
    FROM payments
    WHERE brand_id = $1
    ORDER BY created_at DESC;`; // Сортировка по дате создания, новые первыми
  const paymentsResult = await pgPool.query(paymentsQuery, [sessionBrandId]);
  const payments = paymentsResult.rows;

  // 4. Рендерим шаблон 'dashboard.ejs', передавая данные
  reply.view('dashboard.ejs', { brandName, payments });
});

// --- Страница логина ---
fastify.get('/login', async (req, reply) => {
  // Рендерим шаблон 'login.ejs'
  reply.view('login.ejs');
});

// --- Обработка POST-запроса на логин ---
fastify.post('/login', async (req, reply) => {
  const { api_key } = req.body; // Получаем api_key из формы

  if (!api_key) {
    // Если api_key не передан, возвращаем ошибку
    return reply.code(400).send({ error: 'API Key is required' });
  }

  try {
    // Проверяем api_key с помощью БД (аналогично server.js)
    const brandId = await getBrandIdByApiKey(apiKey);
    if (!brandId) {
      // Если api_key не найден, возвращаем ошибку
      return reply.code(401).send({ error: 'Invalid API Key' });
    }

    // 5. Если всё ок, устанавливаем сессию (простой пример, используйте secure-session плагин для продакшена)
    req.session = req.session || {}; // Инициализируем сессию, если её нет
    req.session.brandId = brandId; // Сохраняем brandId в сессии

    // Перенаправляем на главную страницу дашборда
    return reply.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    return reply.code(500).send({ error: 'Internal server error during login' });
  }
});

// --- Эндпоинт для получения данных о платежах (опционально, для AJAX) ---
fastify.get('/api/payments', async (req, reply) => {
  const sessionBrandId = req.session?.brandId;
  if (!sessionBrandId) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const paymentsQuery = `
    SELECT id, order_id, status, amount_usdt, created_at, expires_at, completed_at
    FROM payments
    WHERE brand_id = $1
    ORDER BY created_at DESC;`;
  const paymentsResult = await pgPool.query(paymentsQuery, [sessionBrandId]);
  reply.send(paymentsResult.rows);
});

// --- Эндпоинт для получения статуса платежа по ID (опционально) ---
fastify.get('/api/invoice/:id', async (req, reply) => {
  const sessionBrandId = req.session?.brandId;
  if (!sessionBrandId) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return reply.code(400).send({ error: 'Invalid payment ID format' });
  }

  const query = `
    SELECT p.status, p.amount_usdt, p.created_at, p.expires_at, p.completed_at
    FROM payments p
    WHERE p.id = $1 AND p.brand_id = $2;`; // Добавляем проверку по brand_id
  const result = await pgPool.query(query, [id, sessionBrandId]);

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: 'Invoice not found' });
  }

  reply.send(result.rows[0]);
});

// Запуск сервера
const start = async () => {
  try {
    await fastify.listen({ host: '0.0.0.0', port: 3002 }); // Слушаем на 0.0.0.0:3002
    console.log('Dashboard listening on http://0.0.0.0:3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();