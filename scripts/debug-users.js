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
    await pool.end();
  });
