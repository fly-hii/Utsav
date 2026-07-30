import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  const dbName = process.env.DB_NAME || 'vinayaka_db';
  console.log(`🚀 Initializing AWS RDS MySQL database schema on DB '${dbName}'...`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    let rawSql = fs.readFileSync(sqlPath, 'utf8');

    // Clean comments
    const cleanLines = rawSql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const fullBatch = `
      SET FOREIGN_KEY_CHECKS = 0;
      ${cleanLines}
      SET FOREIGN_KEY_CHECKS = 1;
    `;

    console.log('Sending full schema batch to AWS RDS MySQL...');
    await connection.query(fullBatch);

    console.log('✅ AWS RDS MySQL Database schema initialized successfully!');
  } catch (error: any) {
    console.error('❌ Error executing database initialization:', error.message);
  } finally {
    await connection.end();
  }
}

initDatabase();
