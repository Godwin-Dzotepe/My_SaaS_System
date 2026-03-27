const { createPrismaClient } = require('./prisma-client');
require('dotenv').config();

const prisma = createPrismaClient();

async function main() {
  console.log('--- Users ---');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true, school_id: true }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('--- Schools ---');
  const schools = await prisma.school.findMany();
  console.log(JSON.stringify(schools, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });


