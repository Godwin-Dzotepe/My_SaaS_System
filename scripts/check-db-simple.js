const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter: adapter,
  omit: {}
});

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
  .finally(() => prisma.$disconnect().then(() => pool.end()));
