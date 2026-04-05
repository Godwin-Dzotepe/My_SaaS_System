from pathlib import Path 
p = Path(r'app/dashboard/school-admin/students/view/[id]/page.tsx') 
s = p.read_text(encoding='utf-8') 
s = s.replace('  Phone,\n  ShieldCheck,', '  Phone,\n  Printer,\n  ShieldCheck,') 
s = s.replace(\"import { formatGhanaCedis } from '@/lib/currency';\", \"import { formatGhanaCedis } from '@/lib/currency';\nimport { downloadPdfFromLines } from '@/lib/client-pdf';\") 
s = s.replace('    window.print();', \"    const lines = [\n      'Student Profile Report',\n      '',\n      `Name: ${student.name}`,\n      `Student Number: ${student.student_number ?? \\\"Not assigned\\\"}`,\n      `Status: ${student.status}`,\n      `Class: ${student.class.class_name}`,\n      `School: ${student.school.school_name}`,\n      `Attendance Rate: ${attendanceRate}%`,\n      `Average Score: ${averageScore !== null ? `${averageScore}%` : \\\"N/A\\\"}`,\n      `Payments Received: ${formatGhanaCedis(totalPaid)}`,\n      `Outstanding Fees: ${formatGhanaCedis(outstandingFees)}`,\n      `Primary Contact: ${primaryContactPhone ? primaryContactPhone : \\\"No parent phone\\\"}`,\n      `Generated On: ${new Date().toLocaleString(\\\"en-US\\\")}`,\n    ];\n\n    downloadPdfFromLines(`student-profile-${student.name}`, lines);\") 
s = s.replace('  return (', '  const handlePrint = function () {\n    window.print();\n  };\n\n  return (', 1) 
gt = chr(62) 
