import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const alterDb = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.query("ALTER TABLE users ADD COLUMN push_token VARCHAR(255) NULL AFTER role;");
    console.log("Successfully added push_token column to users table.");
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column push_token already exists.");
    } else {
      console.error("Error altering table:", err);
    }
  } finally {
    await connection.end();
  }
};

alterDb();
