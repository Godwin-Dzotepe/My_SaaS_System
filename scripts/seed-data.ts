// @ts-nocheck
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';

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
  const hashedPassword = await bcrypt.hash('password123', 10);
  const schoolId = 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a';

  console.log('Seed: Creating School...');
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

  console.log('Seed: Creating School Admin...');
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

  console.log('Seed: Creating Teachers...');
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

  console.log('Seed: Creating Classes...');
  const existingClasses = await prisma.class.findMany({ where: { school_id: school.id } });
  let class1;

  if (existingClasses.length === 0) {
    class1 = await prisma.class.create({
      data: {
        class_name: 'Class 5 - Blue',
        school_id: school.id,
        teacher_id: teacher1.id,
      },
    });

    await prisma.class.create({
      data: {
        class_name: 'JHS 2 - Gold',
        school_id: school.id,
        teacher_id: teacher2.id,
      },
    });
  } else {
    class1 = existingClasses[0];
  }

  console.log('Seed: Creating Parent & Students...');
  const parent = await prisma.user.upsert({
    where: { phone: '0209998888' },
    update: {},
    create: {
      name: 'Robert Doe',
      phone: '0209998888',
      password: hashedPassword,
      role: 'parent',
      school_id: school.id,
    },
  });

  const student1 = await prisma.student.upsert({
    where: { school_id_student_number: { school_id: school.id, student_number: 'STU-001' } },
    update: { parent_id: parent.id, class_id: class1.id },
    create: {
      student_number: 'STU-001',
      name: 'John Doe',
      class_id: class1.id,
      school_id: school.id,
      parent_id: parent.id,
      parent_phone: parent.phone,
      status: 'active',
    },
  });

  const student2 = await prisma.student.upsert({
    where: { school_id_student_number: { school_id: school.id, student_number: 'STU-002' } },
    update: { parent_id: parent.id, class_id: class1.id },
    create: {
      student_number: 'STU-002',
      name: 'Alice Smith',
      class_id: class1.id,
      school_id: school.id,
      parent_id: parent.id,
      parent_phone: parent.phone,
      status: 'active',
    },
  });

  console.log('Seed: Creating School Fee and Payments...');
  const fee = await prisma.schoolFee.upsert({
    where: { id: 'fee-lincoln-tuition-term1' },
    update: { amount: 500 },
    create: {
      id: 'fee-lincoln-tuition-term1',
      school_id: school.id,
      class_id: class1.id,
      fee_type: 'TUITION',
      amount: 500,
      academic_year: '2025-2026',
      term: 'Term 1',
      description: 'Term 1 Tuition',
      is_active: true,
    },
  });

  await prisma.studentFeeBalance.upsert({
    where: { student_id_school_fee_id: { student_id: student1.id, school_fee_id: fee.id } },
    update: { amount_paid: 500 },
    create: {
      school_id: school.id,
      student_id: student1.id,
      school_fee_id: fee.id,
      amount_paid: 500,
    },
  });

  await prisma.studentFeeBalance.upsert({
    where: { student_id_school_fee_id: { student_id: student2.id, school_fee_id: fee.id } },
    update: { amount_paid: 0 },
    create: {
      school_id: school.id,
      student_id: student2.id,
      school_fee_id: fee.id,
      amount_paid: 0,
    },
  });

  await prisma.payment.create({
    data: {
      student_id: student1.id,
      parent_id: parent.id,
      school_id: school.id,
      amount: 500,
      status: 'PAID',
      paymentMethod: 'CASH',
      referralName: student1.name,
      paidAt: new Date(),
    },
  });

  console.log('Seed: Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

