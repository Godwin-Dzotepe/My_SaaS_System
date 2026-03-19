const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const client = new Client({
    connectionString: "postgresql://postgres:2004@localhost:5432/school_management?schema=public"
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const schoolId = 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a';

    // 1. School
    await client.query(`
      INSERT INTO "School" (id, school_name, address, phone)
      VALUES ($1, 'Lincoln High School', '123 Education St, Accra', '0240000000')
      ON CONFLICT (id) DO NOTHING
    `, [schoolId]);

    // 2. School Admin
    await client.query(`
      INSERT INTO "User" (id, name, phone, email, password, role, school_id)
      VALUES (gen_random_uuid(), 'Admin User', '0241112222', 'admin@lincoln.edu', $1, 'school_admin', $2)
      ON CONFLICT (phone) DO NOTHING
    `, [hashedPassword, schoolId]);

    // 3. Teachers
    const t1Id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
    const t2Id = 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2';

    await client.query(`
      INSERT INTO "User" (id, name, phone, email, password, role, school_id)
      VALUES ($1, 'Sarah Wilson', '0551234567', 'sarah.w@lincoln.edu', $3, 'teacher', $4),
             ($2, 'James Mensah', '0557654321', 'james.m@lincoln.edu', $3, 'teacher', $4)
      ON CONFLICT (phone) DO NOTHING
    `, [t1Id, t2Id, hashedPassword, schoolId]);

    // 4. Classes
    const c1Id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
    const c2Id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2e2e2e2e2';

    await client.query(`
      INSERT INTO "Class" (id, class_name, school_id, teacher_id)
      VALUES ($1, 'Class 5 - Blue', $3, $4),
             ($2, 'JHS 2 - Gold', $3, $5)
      ON CONFLICT (id) DO NOTHING
    `, [c1Id, c2Id, schoolId, t1Id, t2Id]);

    // 5. Parent
    await client.query(`
      INSERT INTO "User" (id, name, phone, password, role)
      VALUES (gen_random_uuid(), 'Robert Doe', '0209998888', $1, 'parent')
      ON CONFLICT (phone) DO NOTHING
    `, [hashedPassword]);

    // 6. Students
    const s1Id = 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1';
    const s2Id = 's2s2s2s2-s2s2-s2s2-s2s2-s2s2s2s2s2s2';

    await client.query(`
      INSERT INTO "Student" (id, name, class_id, school_id, parent_phone, status)
      VALUES ($1, 'John Doe', $3, $5, '0209998888', 'active'),
             ($2, 'Alice Smith', $4, $5, '0209998888', 'active')
      ON CONFLICT (id) DO NOTHING
    `, [s1Id, s2Id, c1Id, c2Id, schoolId]);

    // 7. Fees
    await client.query(`
      INSERT INTO "Fee" (id, student_id, amount, status, payment_date)
      VALUES (gen_random_uuid(), $1, 500, 'paid', NOW()),
             (gen_random_uuid(), $2, 500, 'pending', NULL)
    `, [s1Id, s2Id]);

    console.log('Seed raw: Done!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.end();
  }
}

seed();
