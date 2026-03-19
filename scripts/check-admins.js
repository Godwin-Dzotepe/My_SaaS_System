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
    await pool.end();
  });
