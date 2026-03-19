const fs = require('fs');
const path = require('path');

const files = [
  { path: 'app/dashboard/school-admin/teachers/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/teachers/new/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/students/upload/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/students/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/students/new/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/secretaries/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/promotion/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/messaging/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/grading/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/finance-admins/new/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/finance/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/completed/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/classes/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/school-admin/classes/new/page.tsx', role: 'ADMIN' },
  { path: 'app/dashboard/secretary/teachers/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/students/upload/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/students/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/students/new/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/messaging/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/events/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/classes/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/attendance/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/secretary/page.tsx', role: 'SECRETARY' },
  { path: 'app/dashboard/teacher/settings/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/scores/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/homework/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/class/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/attendance/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/teacher/events/page.tsx', role: 'TEACHER' },
  { path: 'app/dashboard/parent/results/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/attendance/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/children/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/announcements/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/events/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/children/[id]/results/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/parent/children/[id]/attendance/page.tsx', role: 'PARENT' },
  { path: 'app/dashboard/super-admin/users/page.tsx', role: 'SUPER_ADMIN' },
  { path: 'app/dashboard/super-admin/schools/page.tsx', role: 'SUPER_ADMIN' },
  { path: 'app/dashboard/super-admin/schools/new/page.tsx', role: 'SUPER_ADMIN' },
  { path: 'app/dashboard/super-admin/page.tsx', role: 'SUPER_ADMIN' },
  { path: 'app/dashboard/super-admin/announcements/page.tsx', role: 'SUPER_ADMIN' },
];

const roleToImport = {
  ADMIN: 'ADMIN_SIDEBAR_ITEMS',
  SECRETARY: 'SECRETARY_SIDEBAR_ITEMS',
  TEACHER: 'TEACHER_SIDEBAR_ITEMS',
  PARENT: 'PARENT_SIDEBAR_ITEMS',
  SUPER_ADMIN: 'SUPER_ADMIN_SIDEBAR_ITEMS',
};

files.forEach(fileInfo => {
  const filePath = path.join(process.cwd(), fileInfo.path);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileInfo.path}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const importName = roleToImport[fileInfo.role];

  // 1. Remove sidebarItems array
  // This regex matches "const sidebarItems = [ ... ];" even with multiline
  const sidebarItemsRegex = /const sidebarItems = \s*\[[\s\S]*?\];/;
  if (content.match(sidebarItemsRegex)) {
    content = content.replace(sidebarItemsRegex, '');
  }

  // 2. Add import
  if (!content.includes(importName)) {
    // Try to add it after other imports or at the top
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf(';', lastImportIndex) + 1;
    const importStatement = `\nimport { ${importName} } from '@/lib/sidebar-configs';`;
    
    if (lastImportIndex !== -1) {
      content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);
    } else {
      content = importStatement + '\n' + content;
    }
  }

  // 3. Update <Sidebar items={sidebarItems} ... />
  content = content.replace(/<Sidebar\s+items=\{sidebarItems\}/g, `<Sidebar items={${importName}}`);

  // 4. Note: Removing unused lucide-react imports is harder with simple regex,
  // but I can try to find the lucide-react import and clean it up if I knew what's used.
  // Given the complexity, I'll focus on the primary task first and then maybe do a second pass for cleanup.
  // Actually, I can check if the icons are still used in the content.

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${fileInfo.path}`);
});
