COPY (SELECT id, name, phone, role, school_id FROM "User") TO 'C:\xampp\htdocs\my-school-saas\users_debug.csv' WITH CSV HEADER;
COPY (SELECT id, school_name FROM "School") TO 'C:\xampp\htdocs\my-school-saas\schools_debug.csv' WITH CSV HEADER;
COPY (SELECT id, class_name, school_id, teacher_id FROM "Class") TO 'C:\xampp\htdocs\my-school-saas\classes_debug.csv' WITH CSV HEADER;
COPY (SELECT id, name, class_id, school_id, parent_phone FROM "Student") TO 'C:\xampp\htdocs\my-school-saas\students_debug.csv' WITH CSV HEADER;
