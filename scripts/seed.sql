-- 1. School
INSERT INTO "School" (id, school_name, address, phone)
VALUES ('d9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a', 'Lincoln High School', '123 Education St, Accra', '0240000000')
ON CONFLICT (id) DO NOTHING;

-- 2. School Admin
-- Password 'password123'
INSERT INTO "User" (id, name, phone, email, password, role, school_id)
VALUES ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Admin User', '0241112222', 'admin@lincoln.edu', '$2b$10$P0paKTl4KfYmSpqFGjXMue48HBemvqqOpOINOOyc/1HFaq4d2Qxsq', 'school_admin', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a')
ON CONFLICT (phone) DO UPDATE SET password = EXCLUDED.password, school_id = EXCLUDED.school_id;

-- 3. Teachers
INSERT INTO "User" (id, name, phone, email, password, role, school_id)
VALUES ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Sarah Wilson', '0551234567', 'sarah.w@lincoln.edu', '$2b$10$P0paKTl4KfYmSpqFGjXMue48HBemvqqOpOINOOyc/1HFaq4d2Qxsq', 'teacher', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a'),
       ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'James Mensah', '0557654321', 'james.m@lincoln.edu', '$2b$10$P0paKTl4KfYmSpqFGjXMue48HBemvqqOpOINOOyc/1HFaq4d2Qxsq', 'teacher', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a')
ON CONFLICT (phone) DO UPDATE SET password = EXCLUDED.password, school_id = EXCLUDED.school_id;

-- 4. Classes
INSERT INTO "Class" (id, class_name, school_id, teacher_id)
VALUES ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Class 5 - Blue', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'),
       ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2e2e2e2e2', 'JHS 2 - Gold', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2')
ON CONFLICT (id) DO UPDATE SET school_id = EXCLUDED.school_id, teacher_id = EXCLUDED.teacher_id;

-- 5. Parent
INSERT INTO "User" (id, name, phone, password, role)
VALUES ('p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', 'Robert Doe', '0209998888', '$2b$10$P0paKTl4KfYmSpqFGjXMue48HBemvqqOpOINOOyc/1HFaq4d2Qxsq', 'parent')
ON CONFLICT (phone) DO UPDATE SET password = EXCLUDED.password;

-- 6. Students
INSERT INTO "Student" (id, name, class_id, school_id, parent_phone, status)
VALUES ('s1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1', 'John Doe', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a', '0209998888', 'active'),
       ('s2s2s2s2-s2s2-s2s2-s2s2-s2s2s2s2s2s2', 'Alice Smith', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a', '0209998888', 'active')
ON CONFLICT (id) DO UPDATE SET class_id = EXCLUDED.class_id, school_id = EXCLUDED.school_id;

-- 7. Fees
INSERT INTO "Fee" (id, student_id, amount, status, payment_date)
VALUES ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 's1s1s1s1-s1s1-s1s1-s1s1-s1s1s1s1s1s1', 500, 'paid', NOW()),
       ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 's2s2s2s2-s2s2-s2s2-s2s2-s2s2s2s2s2s2', 500, 'pending', NULL)
ON CONFLICT (id) DO NOTHING;
