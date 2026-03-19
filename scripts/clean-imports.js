const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/school-admin/teachers/page.tsx',
  'app/dashboard/school-admin/teachers/new/page.tsx',
  'app/dashboard/school-admin/students/upload/page.tsx',
  'app/dashboard/school-admin/students/page.tsx',
  'app/dashboard/school-admin/students/new/page.tsx',
  'app/dashboard/school-admin/secretaries/page.tsx',
  'app/dashboard/school-admin/promotion/page.tsx',
  'app/dashboard/school-admin/messaging/page.tsx',
  'app/dashboard/school-admin/grading/page.tsx',
  'app/dashboard/school-admin/finance-admins/new/page.tsx',
  'app/dashboard/school-admin/finance/page.tsx',
  'app/dashboard/school-admin/completed/page.tsx',
  'app/dashboard/school-admin/classes/page.tsx',
  'app/dashboard/school-admin/classes/new/page.tsx',
  'app/dashboard/secretary/teachers/page.tsx',
  'app/dashboard/secretary/students/upload/page.tsx',
  'app/dashboard/secretary/students/page.tsx',
  'app/dashboard/secretary/students/new/page.tsx',
  'app/dashboard/secretary/messaging/page.tsx',
  'app/dashboard/secretary/events/page.tsx',
  'app/dashboard/secretary/classes/page.tsx',
  'app/dashboard/secretary/attendance/page.tsx',
  'app/dashboard/secretary/page.tsx',
  'app/dashboard/teacher/settings/page.tsx',
  'app/dashboard/teacher/scores/page.tsx',
  'app/dashboard/teacher/page.tsx',
  'app/dashboard/teacher/homework/page.tsx',
  'app/dashboard/teacher/class/page.tsx',
  'app/dashboard/teacher/attendance/page.tsx',
  'app/dashboard/teacher/events/page.tsx',
  'app/dashboard/parent/results/page.tsx',
  'app/dashboard/parent/page.tsx',
  'app/dashboard/parent/attendance/page.tsx',
  'app/dashboard/parent/children/page.tsx',
  'app/dashboard/parent/announcements/page.tsx',
  'app/dashboard/parent/events/page.tsx',
  'app/dashboard/parent/children/[id]/results/page.tsx',
  'app/dashboard/parent/children/[id]/attendance/page.tsx',
  'app/dashboard/super-admin/users/page.tsx',
  'app/dashboard/super-admin/schools/page.tsx',
  'app/dashboard/super-admin/schools/new/page.tsx',
  'app/dashboard/super-admin/page.tsx',
  'app/dashboard/super-admin/announcements/page.tsx',
];

files.forEach(filePathRel => {
  const filePath = path.join(process.cwd(), filePathRel);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find lucide-react import
  const lucideImportRegex = /import\s+\{([\s\S]*?)\}\s+from\s+'lucide-react';/g;
  let match;
  let newContent = content;

  while ((match = lucideImportRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const iconsStr = match[1];
    const icons = iconsStr.split(',').map(s => s.trim()).filter(s => s !== '');
    
    const usedIcons = icons.filter(icon => {
      // Check if icon is used in the content (excluding the import itself)
      // We look for the icon name as a whole word, followed by some non-alphanumeric char
      // e.g. <IconName or IconName. or IconName, or IconName)
      const contentWithoutThisImport = content.replace(fullImport, '');
      const iconUsageRegex = new RegExp(`\\b${icon}\\b`, 'g');
      return iconUsageRegex.test(contentWithoutThisImport);
    });

    if (usedIcons.length === 0) {
      newContent = newContent.replace(fullImport, '');
    } else {
      const newIconsStr = usedIcons.join(', ');
      // Try to preserve some formatting if it was multiline
      if (iconsStr.includes('\n')) {
        const indentedIcons = usedIcons.map(icon => `  ${icon}`).join(',\n');
        newContent = newContent.replace(fullImport, `import {\n${indentedIcons}\n} from 'lucide-react';`);
      } else {
        newContent = newContent.replace(fullImport, `import { ${newIconsStr} } from 'lucide-react';`);
      }
    }
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Cleaned imports in ${filePathRel}`);
  }
});
