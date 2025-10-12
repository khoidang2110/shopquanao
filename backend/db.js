const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Small helper to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry until Postgres is ready. Default: 15 attempts, 2s interval => ~30s max wait
const waitForPostgres = async (attempts = 15, intervalMs = 2000) => {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      // simple query to check connection
      await pool.query('SELECT 1');
      console.log('\u2705 Connected to Postgres');
      return;
    } catch (err) {
      lastErr = err;
      console.log(`\u23f3 Waiting for Postgres (attempt ${i}/${attempts}) - ${err.code || err.message}`);
      await wait(intervalMs);
    }
  }
  // if we get here, all attempts failed
  throw lastErr || new Error('Unable to connect to Postgres');
};

// Tạo bảng khi khởi động
const initDB = async () => {
  try {
    // Đợi Postgres sẵn sàng trước khi thực hiện DDL
    await waitForPostgres();

    // Tạo bảng categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);

    // Tạo bảng products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price INTEGER NOT NULL,
        image VARCHAR(500),
        category VARCHAR(50) REFERENCES categories(id),
        description TEXT
      )
    `);

    // Tạo bảng users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        note TEXT,
        items JSONB NOT NULL,
        total INTEGER NOT NULL,
        order_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Thêm dữ liệu mẫu categories
    await pool.query(`
      INSERT INTO categories (id, name) VALUES 
      ('ao-nam', '\u00c1o Nam'),
      ('ao-nu', '\u00c1o N\u1eef'),
      ('quan-nam', 'Qu\u1ea7n Nam'),
      ('quan-nu', 'Qu\u1ea7n N\u1eef'),
      ('vay-dam', 'V\u00e1y & \u0110\u1ea7m')
      ON CONFLICT (id) DO NOTHING
    `);

    // Thêm dữ liệu mẫu products với hình ảnh mới
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, price, image, category, description) VALUES 
        ('\u00c1o thun nam basic', 299000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop', 'ao-nam', '\u00c1o thun nam ch\u1ea5t li\u1ec7u cotton 100%'),
        ('Qu\u1ea7n jean n\u1eef skinny', 599000, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=400&fit=crop', 'quan-nu', 'Qu\u1ea7n jean n\u1eef form skinny th\u1eddi trang'),
        ('V\u00e1y midi hoa', 450000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop', 'vay-dam', 'V\u00e1y midi h\u1ecda ti\u1ebft hoa xinh x\u1eafn'),
        ('\u00c1o s\u01a1 mi tr\u1eafng', 399000, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&h=400&fit=crop', 'ao-nu', '\u00c1o s\u01a1 mi tr\u1eafng c\u00f4ng s\u1edf thanh l\u1ecb')
      `);
      console.log('\u2705 Sample products added with new images');
    }

    console.log('\u2705 Database initialized successfully');
  } catch (error) {
    console.error('\u274c Database initialization error:', error);
  }
};

module.exports = { pool, initDB, waitForPostgres };