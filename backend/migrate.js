const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  try {
    console.log('Adding columns to committees...');
    await connection.execute('ALTER TABLE committees ADD COLUMN qrCodeS3Key VARCHAR(255) NULL, ADD COLUMN qrCodeS3Url TEXT NULL, ADD COLUMN upiId VARCHAR(255) NULL;');
    console.log('Committees updated.');
  } catch (err) {
    console.log(err.message);
  }

  try {
    console.log('Adding columns to donations...');
    await connection.execute("ALTER TABLE donations ADD COLUMN screenshotS3Key VARCHAR(255) NULL, ADD COLUMN screenshotS3Url TEXT NULL, ADD COLUMN status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'VERIFIED';");
    console.log('Donations updated.');
  } catch (err) {
    console.log(err.message);
  }

  await connection.end();
}
run();
