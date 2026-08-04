require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(36) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        purpose ENUM('LOGIN', 'FORGOT_PASSWORD') NOT NULL,
        expiresAt DATETIME NOT NULL,
        isUsed BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone_purpose (phone, purpose)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('otps table created successfully');
  } catch(e) {
    console.error('Error creating table:', e);
  }
  process.exit(0);
}

migrate();
