import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

const getMariaDbConfig = () => {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const parsed = new URL(databaseUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password || ''),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
  };
};

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(getMariaDbConfig()),
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
  });

