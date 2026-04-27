'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReportScore {
  id: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  behavior: string | null;
  teacherAdvice: string | null;
  grade: string | null;
  remark: string | null;
  subject: { subject_name: string };
}

interface ReportPeriod {
  academic_year: string;
  term: string;
}

interface ReportResponse {
  child: {
    id: string;
    name: string;
    student_number: string | null;
    class: { class_name: string } | null;
    school: { school_name: string } | null;
  };
  availablePeriods: ReportPeriod[];
  selectedPeriod: ReportPeriod;
  summary: { averageScore: number | null; position: number | null };
  scores: ReportScore[];
}

function getGradeTone(grade: string | null) {
  if (!grade) return 'bg-gray-100 text-gray-600';
  if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

async function generateReportPdf(report: ReportResponse, selectedYear: string, selectedTerm: string) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const ml = 14;
  const mr = 14;
  const cw = PW - ml - mr; // 182mm
  let y = 12;

  const cx = (text: string, fy: number) => doc.text(text, PW / 2, fy, { align: 'center' });
  const hline = (fy: number, x1 = ml, x2 = PW - mr) => doc.line(x1, fy, x2, fy);
  const dline = (x1: number, fy: number, x2: number) => {
    doc.setLineDashPattern([0.4, 0.8], 0);
    doc.line(x1, fy, x2, fy);
    doc.setLineDashPattern([], 0);
  };

  // ── LOGO BOX ───────────────────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.roundedRect(ml, y, 22, 26, 7, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GLIS', ml + 11, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text('Knowledge  Discipline', ml + 11, y + 18, { align: 'center' });
  doc.text('Moral Excellence', ml + 11, y + 22, { align: 'center' });

  // ── SCHOOL HEADER ──────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  cx('GRACE LIFE INTERNATIONAL SCHOOL', y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  cx('P.O. BOX MD 1144, MADINA-ACCRA', y + 15);
  cx('OFFICE LINE: 0508742714  |  E-mail: gracelife261@gmail.com', y + 20);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  cx('JUNIOR HIGH SCHOOL', y + 28);

  doc.setFontSize(10.5);
  cx("STUDENT'S REPORT SHEET", y + 35);
  const shW = doc.getTextWidth("STUDENT'S REPORT SHEET");
  doc.setLineWidth(0.5);
  hline(y + 36.5, PW / 2 - shW / 2, PW / 2 + shW / 2);

  y += 46;

  // ── STUDENT INFO ───────────────────────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setLineWidth(0.3);

  // Row 1: Name
  doc.text('Name:', ml, y);
  dline(ml + 13, y + 1, PW - mr);
  doc.setFont('times', 'bold');
  doc.text(report.child.name, ml + 15, y);
  doc.setFont('times', 'normal');
  y += 7;

  // Row 2: No. on Roll | Term
  doc.text('No. on Roll:', ml, y);
  dline(ml + 23, y + 1, ml + 82);
  doc.text(report.child.student_number || '', ml + 25, y);
  doc.text('Term:', ml + 85, y);
  dline(ml + 96, y + 1, PW - mr);
  doc.text(selectedTerm, ml + 98, y);
  y += 7;

  // Row 3: Class | Year | Date
  doc.text('Class:', ml, y);
  dline(ml + 12, y + 1, ml + 75);
  doc.text(report.child.class?.class_name || '', ml + 14, y);
  doc.text('Year:', ml + 78, y);
  dline(ml + 89, y + 1, ml + 122);
  doc.text(selectedYear, ml + 91, y);
  doc.text('Date:', ml + 125, y);
  dline(ml + 135, y + 1, PW - mr);
  doc.text(new Date().toLocaleDateString('en-GB'), ml + 137, y);
  y += 7;

  // Row 4: Next Term | Attendance | Promoted
  doc.text('Next Term Begins:', ml, y);
  dline(ml + 36, y + 1, ml + 82);
  doc.text('Attendance:', ml + 85, y);
  dline(ml + 103, y + 1, ml + 135);
  doc.text('Promoted:', ml + 138, y);
  dline(ml + 155, y + 1, PW - mr);
  y += 11;

  // ── SCORES TABLE ───────────────────────────────────────────────────────
  // col widths sum = 182mm
  const cols = [65, 21, 21, 21, 18, 36];
  const colHdrs = [['SUBJECTS'], ['CLASS', 'SCORE', '50%'], ['EXAMS', 'SCORE', '50%'], ['TOTAL', 'SCORE', '100%'], ['GRADE'], ['REMARK']];
  const hdrH = 13;
  const rowH = 7;

  // Header bg
  doc.setFillColor(230, 230, 230);
  doc.rect(ml, y, cw, hdrH, 'FD');

  // Header vertical dividers + text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  let colX = ml;
  cols.forEach((colW, i) => {
    const lines = colHdrs[i];
    const lineH = 3.2;
    const blockH = lines.length * lineH;
    const startY = y + (hdrH - blockH) / 2 + lineH;
    lines.forEach((ln, li) => doc.text(ln, colX + colW / 2, startY + li * lineH, { align: 'center' }));
    if (i < cols.length - 1) {
      doc.setLineWidth(0.4);
      doc.line(colX + colW, y, colX + colW, y + hdrH);
    }
    colX += colW;
  });
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(ml, y, cw, hdrH, 'S');
  y += hdrH;

  // Data rows
  const display = [...report.scores];
  while (display.length < 10) {
    display.push({ id: `e-${display.length}`, subject: { subject_name: '' }, classScore: null, examScore: null, totalScore: null, grade: null, remark: null, behavior: null, teacherAdvice: null });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  display.forEach((score, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(ml, y, cw, rowH, 'F');
    }
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(ml, y, cw, rowH, 'S');

    colX = ml;
    cols.forEach((colW, i) => {
      if (i < cols.length - 1) doc.line(colX + colW, y, colX + colW, y + rowH);
      colX += colW;
    });

    const ty = y + rowH / 2 + 1.5;
    colX = ml;
    const vals = [
      score.subject.subject_name.toUpperCase(),
      score.classScore != null ? String(score.classScore) : '',
      score.examScore != null ? String(score.examScore) : '',
      score.totalScore != null ? String(score.totalScore) : '',
      score.grade || '',
      score.remark || '',
    ];
    vals.forEach((v, i) => {
      if (i === 0) doc.text(v, colX + 2, ty);
      else doc.text(v, colX + cols[i] / 2, ty, { align: 'center' });
      colX += cols[i];
    });

    y += rowH;
  });

  y += 9;

  // ── CONDUCT ────────────────────────────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setLineWidth(0.3);

  const validScore = report.scores.find(s => s.behavior || s.teacherAdvice);
  const conductRows: [string, string][] = [
    ['Conduct / Character:', validScore?.behavior || ''],
    ['Attitude:', ''],
    ['Interest:', ''],
    ["Class Teacher's Remarks:", validScore?.teacherAdvice || ''],
  ];

  conductRows.forEach(([label, value]) => {
    doc.text(label, ml, y);
    const lw = doc.getTextWidth(label);
    dline(ml + lw + 2, y + 1, PW - mr);
    if (value) doc.text(value, ml + lw + 4, y);
    y += 7;
  });

  y += 8;

  // ── SIGNATURES ─────────────────────────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text("Class Teacher's Signature:", ml, y);
  dline(ml + 51, y + 1, ml + 85);
  doc.text("Head Master's Signature:", ml + 95, y);
  dline(ml + 145, y + 1, PW - mr);

  y += 13;

  // ── FEES BOXES ─────────────────────────────────────────────────────────
  doc.setLineWidth(0.5);
  const fBoxW = 88;
  const fBoxH = 52;

  // School Fees
  doc.rect(ml, y, fBoxW, fBoxH, 'S');
  doc.setFillColor(242, 242, 242);
  doc.rect(ml, y, fBoxW, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCHOOL FEES', ml + fBoxW / 2, y + 5, { align: 'center' });

  const feeItems = ['Tuition:', 'Feeding:', 'Areas:', 'P.T.A.:', 'Books:', 'Building Material:', 'Graduation:', 'Others:'];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let fy2 = y + 11;
  feeItems.forEach(item => {
    doc.text(item, ml + 3, fy2);
    dline(ml + 28, fy2 + 1, ml + fBoxW - 3);
    fy2 += 5;
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GRAND TOTAL GH¢:', ml + 3, fy2 + 1);
  doc.setLineWidth(0.4);
  hline(fy2 + 2, ml + 40, ml + fBoxW - 3);

  // Maintenance Fees
  const mBoxX = ml + fBoxW + 6;
  const mBoxW = cw - fBoxW - 6;
  doc.setLineWidth(0.5);
  doc.rect(mBoxX, y, mBoxW, 36, 'S');
  doc.setFillColor(242, 242, 242);
  doc.rect(mBoxX, y, mBoxW, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MAINTENANCE FEES', mBoxX + mBoxW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Library Fee:', mBoxX + 3, y + 14);
  dline(mBoxX + 24, y + 15, mBoxX + mBoxW - 3);
  doc.text('Computer Fee:', mBoxX + 3, y + 21);
  dline(mBoxX + 27, y + 22, mBoxX + mBoxW - 3);

  y += fBoxH + 8;

  // ── OFFICIAL GRADING ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL GRADING', ml, y);
  doc.setLineWidth(0.3);
  hline(y + 1.5, ml, ml + doc.getTextWidth('OFFICIAL GRADING'));
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const gradeRows = [
    ['80 - 100 = 1 - Excellent', '60 - 64 = 4 - Credit', '44 - 49 = 7 - Pass'],
    ['70 - 79  = 2 - Very Good', '55 - 59 = 5 - Above Average', '40 - 43 = 8 - Weak Pass'],
    ['65 - 69  = 3 - Good', '50 - 54 = 6 - Average', '0  - 39  = 9 - Fail'],
  ];
  const gColW = cw / 3;
  gradeRows.forEach(row => {
    row.forEach((g, i) => doc.text(g, ml + i * gColW, y));
    y += 6;
  });

  // ── SAVE ───────────────────────────────────────────────────────────────
  const fileName = `${report.child.name.replace(/\s+/g, '_')}_${selectedYear}_${selectedTerm}.pdf`;
  doc.save(fileName);
}

export default function ChildResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = React.useState<ReportResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchingReport, setFetchingReport] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedYear, setSelectedYear] = React.useState('');
  const [selectedTerm, setSelectedTerm] = React.useState('');

  const fetchReport = React.useCallback(async (academicYear?: string, term?: string) => {
    if (academicYear === undefined && term === undefined) {
      setLoading(true);
    } else {
      setFetchingReport(true);
    }
    setError(null);

    try {
      const url = `/api/parent/children/${id}/report${academicYear && term ? `?academic_year=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch child report.');

      setReport(data);
      setSelectedYear(data.selectedPeriod?.academic_year || '');
      setSelectedTerm(data.selectedPeriod?.term || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch child report.');
    } finally {
      setLoading(false);
      setFetchingReport(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) fetchReport();
  }, [fetchReport, id]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      await generateReportPdf(report, selectedYear, selectedTerm);
    } finally {
      setIsDownloading(false);
    }
  };

  const averageScore = report?.summary.averageScore ?? 'N/A';
  const passingSubjects = report?.scores.filter(s => (s.totalScore ?? 0) >= 50).length ?? 0;
  const academicYears = Array.from(new Set(report?.availablePeriods.map(p => p.academic_year) ?? []));
  const availableTerms = report?.availablePeriods.filter(p => p.academic_year === selectedYear) ?? [];

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName="Parent" />

      <div className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#3f7afc]" />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">

            {/* ── HERO ── */}
            <section className="rounded-2xl sm:rounded-[28px] bg-[linear-gradient(135deg,#0f2f66_0%,#1f61c3_50%,#8fc6ff_100%)] p-5 sm:p-6 lg:p-8 text-white shadow-[0_20px_60px_rgba(20,83,183,0.24)]">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div>
                  <Link
                    href="/dashboard/parent/children"
                    className="mb-3 inline-flex items-center gap-1.5 text-sm text-blue-100 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to children
                  </Link>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Individual Report
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {report?.child.name || 'Student Report'}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    View and download this student's academic report card for any term.
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={!report || isDownloading}
                    className="w-full sm:w-auto gap-2 bg-white text-[#1f61c3] hover:bg-blue-50"
                  >
                    {isDownloading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    {isDownloading ? 'Generating PDF...' : 'Download Report Card'}
                  </Button>
                </div>
              </div>
            </section>

            {error ? (
              <Card className="border-none bg-white shadow-sm">
                <CardContent className="px-6 py-10 text-center text-rose-600">{error}</CardContent>
              </Card>
            ) : report ? (
              <>
                {/* ── FILTER ── */}
                <Card className="border-none bg-white shadow-sm">
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto] xl:items-end">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Student</label>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                          <div className="font-medium text-gray-900 text-sm">{report.child.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {report.child.school?.school_name || 'School not assigned'} · {report.child.class?.class_name || 'Class not assigned'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Academic Year</label>
                        <Select
                          value={selectedYear}
                          onChange={e => {
                            const next = e.target.value;
                            setSelectedYear(next);
                            setSelectedTerm(report.availablePeriods.find(p => p.academic_year === next)?.term || '');
                          }}
                        >
                          <option value="">{academicYears.length > 0 ? 'Select year' : 'No years available'}</option>
                          {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Term</label>
                        <Select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                          <option value="">{availableTerms.length > 0 ? 'Select term' : 'No terms available'}</option>
                          {availableTerms.map(p => <option key={`${p.academic_year}-${p.term}`} value={p.term}>{p.term}</option>)}
                        </Select>
                      </div>
                      <Button
                        onClick={() => fetchReport(selectedYear, selectedTerm)}
                        disabled={fetchingReport || !selectedYear || !selectedTerm}
                        className="h-10 w-full sm:w-auto bg-[#1f61c3] hover:bg-[#184f9d]"
                      >
                        {fetchingReport ? 'Loading...' : 'Load Report'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* ── STAT CARDS ── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Student Number</p>
                      <h2 className="mt-2 text-lg sm:text-xl font-bold text-gray-900">{report.child.student_number || 'Not assigned'}</h2>
                      <p className="mt-1 text-sm text-gray-500">{report.child.class?.class_name || 'Class not assigned'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Average Score</p>
                      <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f61c3]">{averageScore}</h3>
                      <p className="mt-1 text-sm text-gray-500">{selectedYear || '—'} · {selectedTerm || '—'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Passing Subjects</p>
                      <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600">{passingSubjects}</h3>
                      <p className="mt-1 text-sm text-gray-500">{report.scores.length} subjects total</p>
                    </CardContent>
                  </Card>
                </div>

                {/* ── SCORES ── */}
                <Card className="overflow-hidden border-none bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900">
                      <FileText className="w-5 h-5 text-[#1f61c3]" />
                      Subject Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {report.scores.length > 0 ? (
                      <>
                        {/* Mobile cards */}
                        <div className="block md:hidden divide-y divide-slate-100">
                          {report.scores.map(score => (
                            <div key={score.id} className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm leading-tight">{score.subject.subject_name}</span>
                                <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGradeTone(score.grade)}`}>
                                  {score.grade ?? 'N/A'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Class</p>
                                  <p className="text-sm font-bold text-gray-800 mt-0.5">{score.classScore ?? '—'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Exam</p>
                                  <p className="text-sm font-bold text-gray-800 mt-0.5">{score.examScore ?? '—'}</p>
                                </div>
                                <div className="bg-[#1f61c3]/8 rounded-lg p-2">
                                  <p className="text-[10px] text-[#1f61c3] font-bold uppercase tracking-wide">Total</p>
                                  <p className="text-sm font-bold text-[#1f61c3] mt-0.5">{score.totalScore ?? '—'}</p>
                                </div>
                              </div>
                              {(score.remark || score.behavior || score.teacherAdvice) && (
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  {score.remark && <p><span className="font-medium text-gray-600">Remark:</span> {score.remark}</p>}
                                  {score.behavior && <p><span className="font-medium text-gray-600">Behavior:</span> {score.behavior}</p>}
                                  {score.teacherAdvice && <p><span className="font-medium text-gray-600">Teacher:</span> {score.teacherAdvice}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">Class Score</TableHead>
                                <TableHead className="text-center">Exam Score</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                                <TableHead>Remark</TableHead>
                                <TableHead>Behavior</TableHead>
                                <TableHead>Teacher Advice</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.scores.map(score => (
                                <TableRow key={score.id}>
                                  <TableCell className="font-semibold text-gray-900">{score.subject.subject_name}</TableCell>
                                  <TableCell className="text-center">{score.classScore ?? 'N/A'}</TableCell>
                                  <TableCell className="text-center">{score.examScore ?? 'N/A'}</TableCell>
                                  <TableCell className="text-center font-semibold">{score.totalScore ?? 'N/A'}</TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getGradeTone(score.grade)}`}>
                                      {score.grade ?? 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-gray-500">{score.remark ?? 'N/A'}</TableCell>
                                  <TableCell className="text-gray-500">{score.behavior ?? 'N/A'}</TableCell>
                                  <TableCell className="text-gray-500">{score.teacherAdvice ?? 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="px-6 py-16 text-center text-gray-500">
                        No scores found for the selected period.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-none bg-white shadow-sm">
                <CardContent className="px-6 py-16 text-center text-gray-500">
                  Child information not found.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
