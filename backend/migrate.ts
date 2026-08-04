import { pool } from './src/config/database';

async function migrate() {
  try {
    console.log('Running migration...');
    await pool.query('DROP TABLE IF EXISTS otps;');
    
    await pool.query(`
      CREATE TABLE otps (
        id VARCHAR(36) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        purpose ENUM('LOGIN', 'REGISTER', 'FORGOT_PASSWORD') NOT NULL,
        isUsed BOOLEAN DEFAULT FALSE,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Migration successful: otps table recreated with correct schema.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
