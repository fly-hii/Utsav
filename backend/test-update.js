require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  const [rows] = await pool.execute('SELECT id, name, avatar, avatarUrl FROM users LIMIT 1;');
  console.log('Before update:', rows[0]);
  
  if (rows.length > 0) {
    const user = rows[0];
    await pool.execute(
      `UPDATE users
       SET name = COALESCE(?, name),
           avatar = COALESCE(?, avatar),
           avatarUrl = COALESCE(?, avatarUrl)
       WHERE id = ?`,
       ['Test Name', 'test_key', 'https://test.url', user.id]
    );
    const [updated] = await pool.execute('SELECT id, name, avatar, avatarUrl FROM users WHERE id = ?;', [user.id]);
    console.log('After update:', updated[0]);
  }
  process.exit(0);
}

test().catch(console.error);
