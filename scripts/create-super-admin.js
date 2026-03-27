const { createPrismaClient } = require('./prisma-client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('Creating Super Admin...');

const prisma = createPrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Godwin2004', 10);
  const superAdminPhone = '0240963964';

  console.log('Creating Super Admin user...');
  
  const superAdmin = await prisma.user.upsert({
    where: { phone: superAdminPhone },
    update: {
      password: hashedPassword,
    },
    create: {
      name: 'Super Admin',
      phone: superAdminPhone,
      email: 'superadmin@myschool.com',
      password: hashedPassword,
      role: 'super_admin',
    },
  });

  console.log('Super Admin created successfully!');
  console.log(`Phone: ${superAdminPhone}`);
  console.log('Password: Godwin2004');
  console.log('Role: super_admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


