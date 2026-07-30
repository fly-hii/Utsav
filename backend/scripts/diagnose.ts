import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinayaka_db',
  });

  try {
    const [tables]: any = await connection.query('SHOW TABLES;');
    console.log('Existing tables in vinayaka_db:', tables.map((t: any) => Object.values(t)[0]));
  } catch (err: any) {
    console.error('Error fetching tables:', err.message);
  } finally {
    await connection.end();
  }
}

diagnose();
