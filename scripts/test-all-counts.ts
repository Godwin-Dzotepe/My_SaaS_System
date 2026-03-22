import { prisma } from '../lib/prisma';

async function checkAll() {
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
    console.log('\n=== Database Connection Successful ===');
    console.log('\n--- Table Row Counts ---');
    console.table(counts);

    console.log('\n--- Sample Data: Schools (First 3) ---');
    const schools = await prisma.school.findMany({ 
      take: 3, 
      select: { id: true, school_name: true, phone: true } 
    });
    console.table(schools);

    console.log('\n--- Sample Data: Users (First 5) ---');
    const users = await prisma.user.findMany({ 
      take: 5, 
      select: { name: true, role: true, phone: true } 
    });
    console.table(users);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

checkAll();
