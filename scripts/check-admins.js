const { createPrismaClient } = require('./prisma-client');
require('dotenv').config();

const prisma = createPrismaClient();

async function main() {
  console.log('--- Checking for Admin Users ---');
  const admins = await prisma.user.findMany({
    where: { role: 'school_admin' },
    select: { id: true, name: true, phone: true, school_id: true }
  });
  console.log(admins);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });


