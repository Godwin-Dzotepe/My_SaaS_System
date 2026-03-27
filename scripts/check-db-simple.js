const { createPrismaClient } = require('./prisma-client');
require('dotenv').config();

const prisma = createPrismaClient();

async function main() {
  console.log('--- Checking DB Simple ---');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Query result:', result);
    console.log('DB connection successful!');
  } catch (error) {
    console.error('DB connection failed:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());


