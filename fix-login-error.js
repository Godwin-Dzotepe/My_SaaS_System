const fs = require('fs');
let content = fs.readFileSync('app/auth/login/page.tsx', 'utf8');

content = content.replace(
    /\{error\}\s*<\/motion\.div>/g,
    \{error.startsWith('SCHOOL_DEACTIVATED:') ? (
                  <div>
                    <strong className="block text-red-100">Account Access Disabled</strong>
                    <span className="mt-1 block">{error.split('SCHOOL_DEACTIVATED:')[1]}</span>
                  </div>
                ) : (
                  error
                )}
              </motion.div>\
);
fs.writeFileSync('app/auth/login/page.tsx', content);
console.log('Fixed app/auth/login/page.tsx');
