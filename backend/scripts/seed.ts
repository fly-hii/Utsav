import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding AWS RDS MySQL database...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'utsav',
  });

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@utsav.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
    const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '9999999999';

    // Check if Super Admin exists
    const [existing]: any = await connection.execute(
      'SELECT id, phone FROM users WHERE role = ? LIMIT 1',
      ['SUPER_ADMIN']
    );

    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      const id = uuidv4();

      await connection.execute(
        `INSERT INTO users (id, name, phone, email, password, role, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, 'Super Admin', superAdminPhone, superAdminEmail, hashedPassword, 'SUPER_ADMIN', true]
      );
      console.log(`✅ Super Admin created: ${superAdminEmail} / Phone: ${superAdminPhone}`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${existing[0].phone}`);
    }

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
