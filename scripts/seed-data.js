const { createPrismaClient } = require('./prisma-client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = createPrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const schoolId = 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a';

  const school = await prisma.school.upsert({
    where: { id: schoolId },
    update: {},
    create: {
      id: schoolId,
      school_name: 'Lincoln High School',
      address: '123 Education St, Accra',
      phone: '0240000000',
    },
  });

  const parent = await prisma.user.upsert({
    where: { phone: '0209998888' },
    update: {},
    create: {
      name: 'Robert Doe',
      phone: '0209998888',
      password: hashedPassword,
      role: 'parent',
      school_id: school.id,
    },
  });

  console.log('Seed JS ready. Parent:', parent.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


