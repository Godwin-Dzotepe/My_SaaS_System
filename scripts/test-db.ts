import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({
  adapter: adapter as any,
  omit: {}
});

async function main() {
  console.log('--- Checking Schools ---');
  const schools = await prisma.school.findMany();
  console.log(JSON.stringify(schools, null, 2));

  console.log('--- Checking Teachers ---');
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' },
    select: { id: true, name: true, phone: true, role: true, school_id: true }
  });
  console.log(JSON.stringify(teachers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
