const fs = require('fs');
let content = fs.readFileSync('app/dashboard/teacher/page.tsx', 'utf8');

// Fix paragraph template literal
content = content.replace(
  /\{loading \? 'Loading class info\.\.\.' \: data\?\.className \? \$\{data\.className\}   students \: 'No class assigned'\}/,
  \{loading ? 'Loading class info...' : data?.className ? \\\\  \ students\\\ : 'No class assigned'}\
);

// Fix className string
content = content.replace(
  /className=\{(?:\r\n|\n)elative overflow-hidden shadow-lg transition-all duration-300 px-6 py-6 rounded-xl font-semibold text-lg flex items-center gap-3 \\\}(?:\r\n|\n)/,
  \className={\\\elative overflow-hidden shadow-lg transition-all duration-300 px-6 py-6 rounded-xl font-semibold text-lg flex items-center gap-3 \\\\}\
);

// Fix link href
content = content.replace(
  /\<Link href=\{.*dashboard\/teacher\/class\}\>/,
  \<Link href={\\\/dashboard/teacher/class\\\}>\
);

fs.writeFileSync('app/dashboard/teacher/page.tsx', content);
console.log('Fixed app/dashboard/teacher/page.tsx');
