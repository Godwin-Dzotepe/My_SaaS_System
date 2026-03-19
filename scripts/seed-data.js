const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('Seed JS: Initializing Prisma with PG adapter...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const schoolId = 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a';

  console.log('Seed JS: Creating School...');
  const school = await prisma.school.upsert({
    where: { id: schoolId },
    update: {},
    create: {
      id: schoolId,
      school_name: 'Lincoln High School',
      address: '123 Education St, Accra',
      phone: '0240000000',
    },
  });

  console.log('Seed JS: Creating School Admin...');
  await prisma.user.upsert({
    where: { phone: '0241112222' },
    update: {},
    create: {
      name: 'Admin User',
      phone: '0241112222',
      email: 'admin@lincoln.edu',
      password: hashedPassword,
      role: 'school_admin',
      school_id: school.id,
    },
  });

  console.log('Seed JS: Creating Teachers...');
  const teacher1 = await prisma.user.upsert({
    where: { phone: '0551234567' },
    update: { school_id: school.id },
    create: {
      name: 'Sarah Wilson',
      phone: '0551234567',
      email: 'sarah.w@lincoln.edu',
      password: hashedPassword,
      role: 'teacher',
      school_id: school.id,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { phone: '0557654321' },
    update: { school_id: school.id },
    create: {
      name: 'James Mensah',
      phone: '0557654321',
      email: 'james.m@lincoln.edu',
      password: hashedPassword,
      role: 'teacher',
      school_id: school.id,
    },
  });

  console.log('Seed JS: Creating Classes...');
  const class1 = await prisma.class.create({
    data: {
      class_name: 'Class 5 - Blue',
      school_id: school.id,
      teacher_id: teacher1.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      class_name: 'JHS 2 - Gold',
      school_id: school.id,
      teacher_id: teacher2.id,
    },
  });

  console.log('Seed JS: Creating Parents & Students...');
  const parent1Phone = '0209998888';
  await prisma.user.upsert({
    where: { phone: parent1Phone },
    update: {},
    create: {
      name: 'Robert Doe',
      phone: parent1Phone,
      password: hashedPassword,
      role: 'parent',
    },
  });

  const student1 = await prisma.student.create({
    data: {
      name: 'John Doe',
      class_id: class1.id,
      school_id: school.id,
      parent_phone: parent1Phone,
      status: 'active',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Alice Smith',
      class_id: class1.id,
      school_id: school.id,
      parent_phone: parent1Phone,
      status: 'active',
    },
  });

  console.log('Seed JS: Creating Fees...');
  await prisma.fee.createMany({
    data: [
      { student_id: student1.id, amount: 500, status: 'paid', payment_date: new Date() },
      { student_id: student2.id, amount: 500, status: 'pending' },
    ],
  });

  console.log('Seed JS: Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
