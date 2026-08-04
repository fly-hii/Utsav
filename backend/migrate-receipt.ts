import { pool } from './src/config/database';

async function migrate() {
  try {
    console.log('Running migration to add receiptHtml columns...');
    await pool.query(`
      ALTER TABLE donations
      ADD COLUMN receiptHtmlS3Key VARCHAR(255) NULL,
      ADD COLUMN receiptHtmlS3Url VARCHAR(512) NULL
    `);
    console.log('Migration successful: receipt columns added.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
