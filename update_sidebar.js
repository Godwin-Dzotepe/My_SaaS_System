const fs = require('fs');
let content = fs.readFileSync('lib/sidebar-configs.tsx', 'utf8');

content = content.replace(
  "{ label: 'Classes', href: '/dashboard/school-admin/classes', icon: <School className=\"w-5 h-5\" /> },",
  "{ label: 'Classes', href: '/dashboard/school-admin/classes', icon: <School className=\"w-5 h-5\" /> },\n  { label: 'Subjects', href: '/dashboard/school-admin/subjects', icon: <BookOpen className=\"w-5 h-5\" /> },"
);

fs.writeFileSync('lib/sidebar-configs.tsx', content);
