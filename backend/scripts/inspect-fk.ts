import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectForeignKeys() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinayaka_db',
  });

  try {
    const [rows]: any = await connection.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'vinayaka_db'}'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    `);
    console.log('Active Foreign Keys in vinayaka_db:');
    console.table(rows);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

inspectForeignKeys();
