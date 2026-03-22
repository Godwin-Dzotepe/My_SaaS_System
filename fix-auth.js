const fs = require('fs');
let content = fs.readFileSync('lib/auth.ts', 'utf8');
content = content.replace(
    /(if \(!user\.school_id\) \{\s*throw new Error\('Super Admin user incorrectly configured without a school ID\.'\);\s*\})/g,
    "\\n\n        // Check if school is active (allow super_admin regardless)\n        if (user.role !== 'super_admin' && user.school_id) {\n          const school = await prisma.school.findUnique({ where: { id: user.school_id }});\n          if (school && !school.isActive) {\n            throw new Error('SCHOOL_DEACTIVATED:' + (school.deactivationMessage || 'Your school account has been deactivated by the system administrator.'));\n          }\n        }"
);
fs.writeFileSync('lib/auth.ts', content);
console.log('Fixed lib/auth.ts');
