from pathlib import Path 
p = Path(r'app/dashboard/school-admin/students/view/[id]/page.tsx') 
text = p.read_text(encoding='utf-8') 
lines = text.splitlines() 
gt = chr(62) 
if '  Printer,' not in text: 
    t = [] 
    for ln in lines: 
        t.append(ln) 
        if ln.strip() == 'Phone,': 
            t.append('  Printer,') 
    lines = t 
if 'downloadPdfFromLines' not in '\n'.join(lines): 
    t = [] 
    for ln in lines: 
        t.append(ln) 
        if ln.strip() == \"import { formatGhanaCedis } from '@/lib/currency';\": 
            t.append(\"import { downloadPdfFromLines } from '@/lib/client-pdf';\") 
    lines = t 
out = [] 
replaced = False 
while i < len(lines): 
    ln = lines[i] 
    if (not replaced) and ln.startswith('  const handleDownloadPdf = ()'): 
        out.append('  const handleDownloadPdf = () =' + gt + ' {') 
        out.append('    const lines = [') 
        out.append(\"      'Student Profile Report',\") 
        out.append(\"      '',\") 
        out.append('      `Name: ${student.name}`,') 
        out.append('      `Student Number: ${student.student_number ?? \"Not assigned\"}`,') 
        out.append('      `Status: ${student.status}`,') 
        out.append('      `Class: ${student.class.class_name}`,') 
        out.append('      `School: ${student.school.school_name}`,') 
        out.append('      `Attendance Rate: ${attendanceRate}%`,') 
        out.append('      `Average Score: ${averageScore !== null ? `${averageScore}%` : \"N/A\"}`,') 
        out.append('      `Payments Received: ${formatGhanaCedis(totalPaid)}`,') 
        out.append('      `Outstanding Fees: ${formatGhanaCedis(outstandingFees)}`,') 
        out.append('      `Primary Contact: ${primaryContactPhone ? primaryContactPhone : \"No parent phone\"}`,') 
        out.append('      `Generated On: ${new Date().toLocaleString(\"en-US\")}`,') 
        out.append('    ];') 
        out.append('') 
        out.append('    downloadPdfFromLines(`student-profile-${student.name}`, lines);') 
        out.append('  };') 
        out.append('') 
        out.append('  const handlePrint = () =' + gt + ' {') 
        out.append('    window.print();') 
        out.append('  };') 
        replaced = True 
        i +=  
        while i < len(lines) and lines[i].strip() != '};': 
            i +=  
        i +=  
        continue 
    out.append(ln) 
    i +=  
if 'onClick={handlePrint}' not in '\n'.join(out): 
    t = [] 
    done = False 
    for ln in out: 
