const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// remove old broken fields if any
schema = schema.replace(/teachers\s+User\[\]\s+@relation\(\"TeacherSubjects\"\)/g, '');
schema = schema.replace(/subjects\s+Subject\[\]\s+@relation\(\"TeacherSubjects\"\)/g, '');

schema = schema.replace('created_at DateTime @default(now())', '  subjects      Subject[] @relation("TeacherSubjects")\n\n  created_at DateTime @default(now())');

schema = schema.replace('scores Score[]', 'scores Score[]\n  teachers User[] @relation("TeacherSubjects")');

fs.writeFileSync('prisma/schema.prisma', schema);
