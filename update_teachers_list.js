const fs = require('fs');
let file = fs.readFileSync('app/dashboard/school-admin/teachers/page.tsx', 'utf8');

file = file.replace(
  'classes: { id: string; class_name: string }[];',
  'classes: { id: string; class_name: string }[];\n  subjects: { id: string; subject_name: string }[];'
);

file = file.replace(
  '<h3 className="font-semibold text-gray-900 group-hover:text-[#3f7afc] transition-colors">{teacher.name}</h3>',
  '<h3 className="font-semibold text-gray-900 group-hover:text-[#3f7afc] transition-colors">{teacher.name}</h3>\n                            <div className="flex flex-wrap gap-1 mt-1">\n                              {teacher.subjects && teacher.subjects.map(sub => (\n                                <span key={sub.id} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">\n                                  {sub.subject_name}\n                                </span>\n                              ))}\n                            </div>'
);

fs.writeFileSync('app/dashboard/school-admin/teachers/page.tsx', file);
