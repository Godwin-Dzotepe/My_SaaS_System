const fs = require('fs');
let file = fs.readFileSync('app/api/teachers/route.ts', 'utf8');

file = file.replace(
  '          }\n        },\n        created_at: true,',
  '          }\n        },\n        subjects: {\n          select: {\n            id: true,\n            subject_name: true\n          }\n        },\n        created_at: true,'
);

fs.writeFileSync('app/api/teachers/route.ts', file);
