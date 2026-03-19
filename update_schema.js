const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  '    classes       Class[] // A teacher can manage multiple classes (or one)',
  '    classes       Class[] // A teacher can manage multiple classes (or one)\n    subjects      Subject[] @relation("TeacherSubjects")'
);

schema = schema.replace(
  'scores Score[]',
  'scores Score[]\n    teachers     User[]    @relation("TeacherSubjects")'
);

fs.writeFileSync('prisma/schema.prisma', schema);
