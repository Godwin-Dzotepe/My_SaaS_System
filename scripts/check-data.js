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
  console.log('--- Schools ---');
  const schools = await prisma.school.findMany();
  console.log(schools);

  console.log('--- Users ---');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true, school_id: true }
  });
  console.log(users);

  console.log('--- Classes ---');
  const classes = await prisma.class.findMany();
  console.log(classes);

  console.log('--- Students ---');
  const students = await prisma.student.findMany();
  console.log(students);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect().then(() => pool.end()));
