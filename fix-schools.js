const fs = require('fs');
let content = fs.readFileSync('app/dashboard/super-admin/schools/page.tsx', 'utf8');

// Insert State
content = content.replace(
  /const \[searchQuery, setSearchQuery\] = React\.useState\(''\);/,
  \const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSchoolId, setSelectedSchoolId] = React.useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(false);
  const [schoolToToggle, setSchoolToToggle] = React.useState<any>(null);

  const handleToggleStatus = async () => {
    if (!schoolToToggle) return;
    setIsLoadingStatus(true);
    const newStatus = !schoolToToggle.isActive;
    
    try {
      const response = await fetch('/api/super-admin/schools/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           schoolId: schoolToToggle.id,
           isActive: newStatus,
           deactivationMessage: newStatus ? null : statusMessage || 'Your school account has been deactivated by the system administrator.'
        })
      });
      
      const data = await response.json();
      if(response.ok) {
         setSchools(schools.map(s => s.id === schoolToToggle.id ? { ...s, isActive: newStatus, deactivationMessage: newStatus ? null : statusMessage } : s));
         alert(\School successfully \\);
         setShowStatusModal(false);
         setStatusMessage('');
      } else {
         alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsLoadingStatus(false);
      setSchoolToToggle(null);
    }
  };\
);

// Inject visual status badge and handle action menu
content = content.replace(
  /actions=\{\[\]\}/,
  \ctions={[{
    label: school.isActive === false ? 'Activate School' : 'Deactivate School',
    onClick: () => {
       setSchoolToToggle(school);
       if (school.isActive === false) { // Activating doesn't strictly need a message, just confirm
           if(confirm('Are you sure you want to activate this school?')) {
               setSchoolToToggle(school);
               // Trigger effect
               setTimeout(() => {
                 document.getElementById('hidden-trigger-btn')?.click(); // Hacky but works for now, or just do it inline
               }, 100);
           }
       } else {
           setShowStatusModal(true);
       }
    }
  }]}\
);

content = content.replace(
    /\<h3 className="text-xl font-bold text-gray-900 mb-2">\{school\.school_name\}<\/h3>/,
    \<h3 className="text-xl font-bold text-gray-900 mb-2">
      {school.school_name}
      {school.isActive === false && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full align-middle">Deactivated</span>}
    </h3>\
);

// Add Modal
content = content.replace(
    /<\/div>\s*\)\s*\}\s*<\/div>\s*\)\s*\}/,
    \</div>
        )}

        {/* hidden trigger */}
        <button id="hidden-trigger-btn" className="hidden" onClick={handleToggleStatus}></button>

        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
                 <h2 className="text-xl font-bold text-gray-900">Deactivate {schoolToToggle?.school_name}</h2>
                 <p className="text-gray-600 text-sm">Please provide a reason for deactivation. This message will be shown to the school administrators when they try to log in.</p>
                 <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                    placeholder="E.g., Your account is disabled due to unpaid subscription fees."
                    value={statusMessage}
                    onChange={e => setStatusMessage(e.target.value)}
                 ></textarea>
                 <div className="flex gap-3 justify-end mt-4">
                     <Button variant="outline" onClick={() => { setShowStatusModal(false); setSchoolToToggle(null); }}>Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleToggleStatus} disabled={isLoadingStatus}>
                         {isLoadingStatus ? 'Processing...' : 'Deactivate School'}
                     </Button>
                 </div>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}\
);


fs.writeFileSync('app/dashboard/super-admin/schools/page.tsx', content);
console.log('Fixed page!');
