const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const counts = {
      users: await prisma.user.count(),
      schools: await prisma.school.count(),
      students: await prisma.student.count(),
      classes: await prisma.class.count(),
      subjects: await prisma.subject.count(),
      teachers: await prisma.user.count({ where: { role: 'teacher' } }),
      parents: await prisma.user.count({ where: { role: 'parent' } })
    };
    console.log('Database connection successful!');
    console.log('=== Table Row Counts ===');
    console.table(counts);

    console.log('\n=== Sample Data (First 3 Schools) ===');
    const schools = await prisma.school.findMany({ take: 3, select: { id: true, name: true, domain: true } });
    console.table(schools);

    console.log('\n=== Sample Data (First 3 Users) ===');
    const users = await prisma.user.findMany({ take: 3, select: { name: true, role: true, email: true } });
    console.table(users);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
