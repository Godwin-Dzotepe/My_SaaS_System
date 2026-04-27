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
import { PrintableReportSheet } from '@/components/printable-report-sheet';

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
  summary: {
    averageScore: number | null;
    position: number | null;
  };
  scores: ReportScore[];
}

function getGradeTone(grade: string | null) {
  if (!grade) return 'bg-gray-100 text-gray-600';
  if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
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
  const reportTemplateRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!reportTemplateRef.current || !report) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(reportTemplateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgAspect = canvas.height / canvas.width;
      const imgHeight = pageWidth * imgAspect;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      } else {
        // Scale to fit one page
        const scaledWidth = pageHeight / imgAspect;
        const offsetX = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', offsetX, 0, scaledWidth, pageHeight);
      }

      const fileName = `${report.child.name.replace(/\s+/g, '_')}_${selectedYear}_${selectedTerm}.pdf`;
      pdf.save(fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchReport = React.useCallback(async (academicYear?: string, term?: string) => {
    const firstLoad = academicYear === undefined && term === undefined;
    if (firstLoad) {
      setLoading(true);
    } else {
      setFetchingReport(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/parent/children/${id}/report${academicYear && term ? `?academic_year=${encodeURIComponent(academicYear)}&term=${encodeURIComponent(term)}` : ''}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch child report.');
      }

      setReport(data);
      setSelectedYear(data.selectedPeriod?.academic_year || '');
      setSelectedTerm(data.selectedPeriod?.term || '');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch child report.');
    } finally {
      setLoading(false);
      setFetchingReport(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    fetchReport();
  }, [fetchReport, id]);

  const handleFetchScores = async () => {
    if (!selectedYear || !selectedTerm) {
      setError('Please select a year and term.');
      return;
    }

    await fetchReport(selectedYear, selectedTerm);
  };

  const averageScore = report?.summary.averageScore ?? 'N/A';
  const passingSubjects = report?.scores.filter((score) => (score.totalScore ?? 0) >= 50).length ?? 0;
  const academicYears = Array.from(new Set(report?.availablePeriods.map((period) => period.academic_year) || []));
  const availableTerms = report?.availablePeriods.filter((period) => period.academic_year === selectedYear) || [];

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName="Parent" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#3f7afc]" />
          </div>
        ) : (
          <div className="mx-auto w-full space-y-6 max-w-7xl">
            <section className="rounded-[28px] bg-[linear-gradient(135deg,#0f2f66_0%,#1f61c3_50%,#8fc6ff_100%)] p-6 lg:p-8 text-white shadow-[0_20px_60px_rgba(20,83,183,0.24)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <Link
                    data-pdf-ignore="true"
                    href="/dashboard/parent/children"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to children
                  </Link>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Individual Report
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">{report?.child.name || 'Student Report'}</h1>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    A focused academic view for one child, built in the same report style as the parent-wide results center.
                  </p>
                </div>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={!report || isDownloading}
                  className="gap-2 bg-white text-[#1f61c3] hover:bg-blue-50"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </section>

            {error ? (
              <Card className="border-none bg-white shadow-sm">
                <CardContent className="px-6 py-10 text-center text-rose-600">{error}</CardContent>
              </Card>
            ) : report ? (
              <>
                <Card data-pdf-ignore="true" className="border-none bg-white shadow-sm">
                  <CardContent className="p-5 lg:p-6">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_auto] xl:items-end">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Student</label>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <div className="font-medium text-gray-900">{report.child.name}</div>
                          <div className="text-sm text-gray-500">
                            {report.child.school?.school_name || 'School not assigned'} - {report.child.class?.class_name || 'Class not assigned'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Academic Year</label>
                        <Select 
                          value={selectedYear} 
                          onChange={(e) => {
                            const nextYear = e.target.value;
                            setSelectedYear(nextYear);
                            const firstTerm = report?.availablePeriods.find(p => p.academic_year === nextYear)?.term || '';
                            setSelectedTerm(firstTerm);
                          }}
                        >
                          <option value="">
                            {academicYears.length > 0 ? 'Select academic year' : 'No academic years available'}
                          </option>
                          {academicYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Term</label>
                        <Select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                          <option value="">
                            {availableTerms.length > 0 ? 'Select term' : 'No terms available'}
                          </option>
                          {availableTerms.map((period) => (
                              <option key={`${period.academic_year}-${period.term}`} value={period.term}>{period.term}</option>
                          ))}
                        </Select>
                      </div>
                      <Button onClick={handleFetchScores} disabled={fetchingReport || !selectedYear || !selectedTerm} className="h-10 bg-[#1f61c3] hover:bg-[#184f9d]">
                        {fetchingReport ? 'Loading...' : 'Load Report'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Student Number</p>
                      <h2 className="mt-3 text-xl font-bold text-gray-900">{report.child.student_number || 'Not assigned'}</h2>
                      <p className="mt-2 text-sm text-gray-500">{report.child.class?.class_name || 'Class not assigned'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Average Score</p>
                      <h3 className="mt-3 text-3xl font-bold text-[#1f61c3]">{averageScore}</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedYear || 'Academic year pending'}, {selectedTerm || 'Term pending'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Passing Subjects</p>
                      <h3 className="mt-3 text-3xl font-bold text-emerald-600">{passingSubjects}</h3>
                      <p className="mt-2 text-sm text-gray-500">{report.scores.length} subjects in this report</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="overflow-hidden border-none bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                      <FileText className="w-5 h-5 text-[#1f61c3]" />
                      Subject Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {report.scores.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Class Score</TableHead>
                              <TableHead>Exam Score</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Remark</TableHead>
                              <TableHead>Behavior</TableHead>
                              <TableHead>Teacher Advice</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.scores.map((score) => (
                              <TableRow key={score.id}>
                                <TableCell className="font-semibold text-gray-900">{score.subject.subject_name}</TableCell>
                                <TableCell>{score.classScore ?? 'N/A'}</TableCell>
                                <TableCell>{score.examScore ?? 'N/A'}</TableCell>
                                <TableCell className="font-semibold">{score.totalScore ?? 'N/A'}</TableCell>
                                <TableCell>
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

      {/* Hidden report template used for PDF generation */}
      {report && (
        <div
          ref={reportTemplateRef}
          style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, background: 'white' }}
          aria-hidden="true"
        >
          <PrintableReportSheet
            report={report}
            selectedYear={selectedYear}
            selectedTerm={selectedTerm}
          />
        </div>
      )}
    </div>
  );
}
