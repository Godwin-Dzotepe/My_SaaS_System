import * as React from 'react';

interface ReportScore {
  id: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  behavior: string | null;
  teacherAdvice: string | null;
  grade: string | null;
  remark: string | null;
  subject: {
    subject_name: string;
  };
}

interface PrintableReportSheetProps {
  report: {
    child: {
      name: string;
      student_number: string | null;
      class: { class_name: string } | null;
    };
    scores: ReportScore[];
  };
  selectedYear: string;
  selectedTerm: string;
}

export function PrintableReportSheet({ report, selectedYear, selectedTerm }: PrintableReportSheetProps) {
  // Ensure we have at least 10 rows for the table to look like a full sheet
  const displayScores = [...report.scores];
  while (displayScores.length < 10) {
    displayScores.push({
      id: `empty-${displayScores.length}`,
      subject: { subject_name: '' },
      classScore: null,
      examScore: null,
      totalScore: null,
      grade: '',
      remark: '',
      behavior: '',
      teacherAdvice: ''
    });
  }

  // Get common remarks/behavior from the first valid score
  const validScore = report.scores.find(s => s.behavior || s.teacherAdvice);
  const behavior = validScore?.behavior || '';
  const teacherAdvice = validScore?.teacherAdvice || '';

  return (
    <div className="bg-white text-black p-8 mx-auto w-[800px] font-serif overflow-hidden">
      <div className="flex flex-col items-center justify-center pt-4 pb-4 relative">
        {/* Logo Placeholder - You can optionally put a real image here later if needed */}
        <div className="absolute left-0 top-0 w-[100px] h-[110px] border-[1.5px] border-black rounded-[50px_50px_10px_10px] flex flex-col items-center justify-center pt-2">
           <div className="font-bold text-[18px] tracking-widest mt-2">GLIS</div>
           <div className="flex-1 w-full mt-2 relative overflow-hidden">
              <div className="absolute top-[20%] left-[20%] w-[20px] h-[30px] border-l-[1.5px] border-black rounded-[20px_0_0_0]"></div>
              <div className="absolute top-[20%] right-[20%] w-[20px] h-[30px] border-r-[1.5px] border-black rounded-[0_20px_0_0]"></div>
              <div className="w-full flex justify-center mt-2">
                 <div className="w-[1px] h-[25px] bg-black"></div>
                 <div className="w-[40px] h-[1px] bg-black mt-2"></div>
              </div>
           </div>
           <div className="text-[6px] tracking-tighter w-full text-center mb-1 max-w-[80%] leading-[0.8] uppercase font-bold">Knowledge Discipline Moral Excellence</div>
        </div>
        
        <h1 className="text-[26px] font-extrabold uppercase tracking-widest text-[#111] mb-1 font-serif text-center" style={{ textShadow: "0px 0px 1px rgba(0,0,0,0.5)"}}>
          GRACE LIFE INTERNATIONAL SCHOOL
        </h1>
        <div className="text-[13px] uppercase text-gray-800 font-bold mb-0.5 tracking-wide">
          P .O. BOX MD 1144, MADINA-ACCRA
        </div>
        <div className="text-[13px] uppercase text-gray-800 font-bold tracking-wide">
          OFFICE LINE: 0508742714 | E-mail:gracelife261@gmail.com
        </div>
        <h2 className="mt-5 text-[22px] font-bold uppercase tracking-widest text-[#111]">
          JUNIOR HIGH SCHOOL
        </h2>
        <h3 className="text-[17px] font-bold uppercase underline decoration-2 underline-offset-4 mt-0.5 text-[#111] tracking-wide">
          STUDENT'S REPORT SHEET
        </h3>
      </div>

      <div className="mt-8 px-2 flex flex-col gap-[14px] text-[15px] font-serif font-medium text-gray-900 tracking-tight">
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap">Name:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0 opacity-90">{report.child.name}</span>
        </div>
        <div className="flex gap-4 items-end">
          <span className="whitespace-nowrap">No. on Roll:</span>
          <span className="flex-[1.5] border-b-[1.5px] border-dotted border-black px-2 pb-0 opacity-90">{report.child.student_number || ''}</span>
          <span className="whitespace-nowrap">Term:</span>
          <span className="border-b-[1.5px] border-dotted border-black px-2 pb-0 w-32 content-center text-center opacity-90">{selectedTerm}</span>
        </div>
        <div className="flex gap-4 items-end">
          <span className="whitespace-nowrap">Class:</span>
          <span className="flex-[2.5] border-b-[1.5px] border-dotted border-black px-2 pb-0 opacity-90">{report.child.class?.class_name || ''}</span>
          <span className="whitespace-nowrap">Year:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0 text-center opacity-90">{selectedYear}</span>
          <span className="whitespace-nowrap">Date:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0 text-center opacity-90">{new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap">Next Term Begins:</span>
          <span className="flex-[2] border-b-[1.5px] border-dotted border-black px-2 pb-0"></span>
          <span className="whitespace-nowrap">Attendance:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0"></span>
          <span className="whitespace-nowrap">Promoted:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0"></span>
        </div>
      </div>

      <div className="mt-[22px] font-serif">
        <table className="w-full border-collapse border-[1.5px] border-black text-[13px] tracking-tight">
          <thead>
            <tr className="border-b-[1.5px] border-black font-extrabold text-center uppercase tracking-wider">
              <th className="border-r-[1.5px] border-black p-0 h-[45px] px-2 text-left w-[32%] align-middle font-extrabold text-[#111]">SUBJECTS</th>
              <th className="border-r-[1.5px] border-black p-0 h-[45px] leading-[1.1] w-[80px] align-middle font-extrabold text-[#111]">CLASS<br/>SCORE<br/>50%</th>
              <th className="border-r-[1.5px] border-black p-0 h-[45px] leading-[1.1] w-[80px] align-middle font-extrabold text-[#111]">EXAMS<br/>SCORE<br/>50%</th>
              <th className="border-r-[1.5px] border-black p-0 h-[45px] leading-[1.1] w-[80px] align-middle bg-gray-50/50 font-extrabold text-[#111]">TOTAL<br/>SCORE<br/>100%</th>
              <th className="border-r-[1.5px] border-black p-0 h-[45px] w-[70px] align-middle bg-gray-50/50 font-extrabold text-[#111]">GRADE</th>
              <th className="p-0 h-[45px] w-[25%] align-middle bg-gray-50/50 font-extrabold text-[#111]">REMARK</th>
            </tr>
          </thead>
          <tbody>
            {displayScores.map((s, i) => (
              <tr key={s.id} className="border-b-[1.5px] border-black text-center font-bold text-[#222]">
                <td className="border-r-[1.5px] border-black p-0 px-2 text-left uppercase text-[12px] h-[28px] overflow-hidden whitespace-nowrap">
                  {s.subject.subject_name}
                </td>
                <td className="border-r-[1.5px] border-black h-[28px] align-middle">{s.classScore ?? ''}</td>
                <td className="border-r-[1.5px] border-black h-[28px] align-middle">{s.examScore ?? ''}</td>
                <td className="border-r-[1.5px] border-black h-[28px] align-middle bg-gray-50/10">{s.totalScore ?? ''}</td>
                <td className="border-r-[1.5px] border-black h-[28px] align-middle bg-gray-50/10">{s.grade ?? ''}</td>
                <td className="h-[28px] align-middle text-left px-2 uppercase text-[11px] bg-gray-50/10 tracking-widest">{s.remark ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 px-2 flex flex-col gap-3 font-serif text-[15px] text-gray-900 tracking-tight font-medium">
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap w-[200px] text-left">Conduct / Character:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0 opacity-90">{behavior}</span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap w-[200px] text-left">Attitude:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0"></span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap w-[200px] text-left">Interest:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0"></span>
        </div>
        <div className="flex gap-2 items-end">
          <span className="whitespace-nowrap w-[200px] text-left">Class Teacher's Remarks:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black px-2 pb-0 opacity-90">{teacherAdvice}</span>
        </div>
      </div>

      <div className="mt-8 px-2 flex justify-between font-serif text-[15px] text-gray-900 tracking-tight font-medium">
        <div className="flex items-end flex-1 max-w-[45%]">
          <span className="whitespace-nowrap mr-2">Class Teacher's Signature:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black pb-0"></span>
        </div>
        <div className="flex items-end flex-1 max-w-[45%]">
          <span className="whitespace-nowrap mr-2">Head Master's Signature:</span>
          <span className="flex-1 border-b-[1.5px] border-dotted border-black pb-0"></span>
        </div>
      </div>

      <div className="mt-8 px-6 flex gap-10 font-serif text-[12px] font-bold text-gray-900 tracking-tight">
        <div className="w-[45%] border-[1.5px] border-black pb-2">
          <div className="border-b-[1.5px] border-black text-center font-extrabold italic p-0.5 tracking-wider">
            SCHOOL FEES
          </div>
          <div className="px-4 py-1.5 flex flex-col gap-1">
             <div className="flex"><span className="w-[120px] text-left">Tuition:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Feeding:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Areas:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">P.T.A.:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Books:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Building Material:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Graduation:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-1"><span className="w-[120px] text-left">Others:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
             <div className="flex mt-2 items-end"><span className="w-[130px] text-[13px] text-left font-extrabold tracking-wide">GRAND TOTAL GH¢:</span><span className="flex-1 border-b-[1.5px] border-black"></span></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col pt-0">
          <div className="border-[1.5px] border-black w-full ml-auto">
            <div className="border-b-[1.5px] border-black text-center font-extrabold italic p-0.5 tracking-wider">
              MAINTENANCE FEES
            </div>
            <div className="px-5 pt-3 pb-8 flex flex-col gap-2">
              <div className="flex mt-1"><span className="w-[100px] text-left">Library Fee:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
              <div className="flex mt-1.5"><span className="w-[100px] text-left">Computer Fee:</span><span className="flex-1 border-b-[1.5px] border-dotted border-black"></span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 px-6 pb-4 font-serif text-[12px] font-bold text-[#111] tracking-tight">
        <div className="underline decoration-1 underline-offset-[3px] text-[14px] mb-3 uppercase tracking-wider text-black">
          OFFICIAL GRADING
        </div>
        <div className="grid grid-cols-3 gap-y-2 gap-x-2 w-full text-black">
          <div className="whitespace-nowrap">80 - 100 = 1 - Excellent</div>
          <div className="whitespace-nowrap">60 - 64 = 4 - Credit</div>
          <div className="whitespace-nowrap">44 - 49 = 7 - Pass</div>
          
          <div className="whitespace-nowrap">70 - 79 = 2 - Very Good</div>
          <div className="whitespace-nowrap">55 - 59 = 5 - Above Average</div>
          <div className="whitespace-nowrap">40 - 43 = 8 - Week Pass</div>
          
          <div className="whitespace-nowrap">65 - 69 = 3 - Good</div>
          <div className="whitespace-nowrap">50 - 54 = 4 - Average</div>
          <div className="whitespace-nowrap">0 - 39  = 9 - Fail</div>
        </div>
      </div>
    </div>
  );
}
