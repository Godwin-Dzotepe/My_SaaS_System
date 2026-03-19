const fs = require('fs');
let file = fs.readFileSync('app/api/teachers/route.ts', 'utf8');

file = file.replace(
  'const { name, email, phone, password } = body;',
  'const { name, email, phone, password, subjectIds } = body;'
);

const oldCreate = '    const newTeacher = await prisma.user.create({\n      data: {\n        name,\n        email,\n        phone,\n        password: hashedPassword,\n        role: \'teacher\',\n        school_id: user.schoolId,\n      },\n    });';

const newCreate = '    let dataObj: any = {\n      name,\n      email,\n      phone,\n      password: hashedPassword,\n      role: \'teacher\',\n      school_id: user.schoolId,\n    };\n\n    if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {\n      dataObj.subjects = {\n        connect: subjectIds.map((id: string) => ({ id }))\n      };\n    }\n\n    const newTeacher = await prisma.user.create({\n      data: dataObj,\n    });';

file = file.replace(oldCreate, newCreate);

fs.writeFileSync('app/api/teachers/route.ts', file);
