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
      ALTER TABLE otps MODIFY COLUMN purpose ENUM('LOGIN', 'FORGOT_PASSWORD', 'REGISTER') NOT NULL;
    `);
    console.log('otps table altered successfully');
  } catch(e) {
    console.error('Error altering table:', e);
  }
  process.exit(0);
}

migrate();
