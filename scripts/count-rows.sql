SELECT 'Schools', COUNT(*) FROM "School"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Classes', COUNT(*) FROM "Class"
UNION ALL
SELECT 'Students', COUNT(*) FROM "Student";
