import { PrismaClient, UserRole, CommitteeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Utsav database...');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@utsav.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '9999999999';

  // Check if Super Admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superAdminEmail,
        phone: superAdminPhone,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Super Admin created: ${superAdmin.email} / Phone: ${superAdmin.phone}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existingSuperAdmin.phone}`);
  }

  console.log('✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
