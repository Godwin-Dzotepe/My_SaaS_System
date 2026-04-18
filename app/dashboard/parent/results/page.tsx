'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Child {
  id: string;
  name: string;
  class: { class_name: string };
  school: { school_name: string };
}

interface Score {
  id: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
  behavior: string | null;
  teacherAdvice: string | null;
  subject: {
    subject_name: string;
  };
}

interface ReportPeriod {
  academic_year: string;
  term: string;
}

function getGradeTone(grade: string | null) {
  if (!grade) return 'bg-gray-100 text-gray-600';
  if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
  if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

export default function ParentResultsPage() {
  const [children, setChildren] = React.useState<Child[]>([]);
  const [scores, setScores] = React.useState<Score[]>([]);
  const [availablePeriods, setAvailablePeriods] = React.useState<ReportPeriod[]>([]);
  const [selectedChild, setSelectedChild] = React.useState('');
  const [selectedYear, setSelectedYear] = React.useState('');
  const [selectedTerm, setSelectedTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingScores, setIsFetchingScores] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchChildren = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/parent/children');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch your children.');
        }

        setChildren(data);
        if (data.length > 0) {
          setSelectedChild(data[0].id);
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch your children.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  React.useEffect(() => {
    if (!selectedChild) return;

    const initializePeriods = async () => {
      try {
        const res = await fetch(`/api/parent/children/${selectedChild}/report`);
        const data = await res.json();
        if (!res.ok) return;

        setAvailablePeriods(data.availablePeriods || []);
        setSelectedYear(data.selectedPeriod?.academic_year || '');
        setSelectedTerm(data.selectedPeriod?.term || '');
        setScores(data.scores || []);
      } catch (fetchError) {
        console.error(fetchError);
      }
    };

    initializePeriods();
  }, [selectedChild]);

  const handleFetchScores = async () => {
    if (!selectedChild || !selectedYear || !selectedTerm) {
      setError('Please select a child, year, and term.');
      return;
    }

    setIsFetchingScores(true);
    setError(null);

    try {
      const res = await fetch(`/api/parent/children/${selectedChild}/scores?academic_year=${encodeURIComponent(selectedYear)}&term=${encodeURIComponent(selectedTerm)}`);
      if (!res.ok) {
        const errorData = await res.json();
        // Handle specific "not published" error from the API
        if (res.status === 403 && errorData.error?.includes('not published')) {
          setError('Results for this period are not published yet. Please check back later.');
        } else {
          throw new Error(errorData.error || 'Failed to fetch scores.');
        }
        setScores([]); // Clear scores on error
        return; // Stop execution
      }
      const data = await res.json();

      setScores(data);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch scores.');
      setScores([]);
    } finally {
      setIsFetchingScores(false);
    }
  };

  const selectedChildData = children.find((child) => child.id === selectedChild);
  const academicYears = Array.from(new Set(availablePeriods.map((period) => period.academic_year)));
  const availableTerms = availablePeriods.filter((period) => period.academic_year === selectedYear);
  const scoredTotals = scores.map((score) => score.totalScore).filter((value): value is number => value !== null);
  const averageScore = scoredTotals.length > 0
    ? (scoredTotals.reduce((sum, value) => sum + value, 0) / scoredTotals.length).toFixed(1)
    : 'N/A';
  const passingSubjects = scores.filter((score) => (score.totalScore ?? 0) >= 50).length;

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName="Parent" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#3f7afc]" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            <section className="rounded-[28px] bg-[linear-gradient(135deg,#103a7a_0%,#1f61c3_45%,#8ec5ff_100%)] p-6 lg:p-8 text-white shadow-[0_20px_60px_rgba(31,97,195,0.22)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Results Center
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">Academic reports for every child</h1>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    Review term performance, compare subject scores, and jump into a child-specific printable report when you need a cleaner handoff.
                  </p>
                </div>
                {selectedChildData ? (
                  <Link href={`/dashboard/parent/children/${selectedChildData.id}/results`}>
                    <Button className="gap-2 bg-white text-[#1f61c3] hover:bg-blue-50">
                      Open Child Report
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </section>

            <Card className="border-none bg-white shadow-sm">
              <CardContent className="p-5 lg:p-6">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_auto] xl:items-end">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Child</label>
                    <Select value={selectedChild} onChange={(e) => {
                      setSelectedChild(e.target.value);
                      setAvailablePeriods([]);
                      setSelectedYear('');
                      setSelectedTerm('');
                      setScores([]);
                    }} disabled={children.length === 0}>
                      <option value="">{children.length === 0 ? 'No children found' : 'Select Child'}</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Academic Year</label>
                    <Select value={selectedYear} onChange={(e) => {
                      const nextYear = e.target.value;
                      setSelectedYear(nextYear);
                      const firstTerm = availablePeriods.find((period) => period.academic_year === nextYear)?.term || '';
                      setSelectedTerm(firstTerm);
                    }}>
                      <option value="">{academicYears.length === 0 ? 'No academic years found' : 'Select year'}</option>
                      {academicYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Term</label>
                    <Select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                      <option value="">{availableTerms.length === 0 ? 'No terms found' : 'Select term'}</option>
                      {availableTerms.map((period) => (
                        <option key={`${period.academic_year}-${period.term}`} value={period.term}>{period.term}</option>
                      ))}
                    </Select>
                  </div>
                  <Button onClick={handleFetchScores} disabled={isFetchingScores || !selectedChild} className="h-10 bg-[#1f61c3] hover:bg-[#184f9d]">
                    {isFetchingScores ? 'Loading...' : 'Load Report'}
                  </Button>
                </div>
                {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
              </CardContent>
            </Card>

            {selectedChildData ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Student</p>
                      <h2 className="mt-3 text-xl font-bold text-gray-900">{selectedChildData.name}</h2>
                      <p className="mt-2 text-sm text-gray-500">{selectedChildData.school.school_name}</p>
                      <p className="text-sm text-gray-500">{selectedChildData.class.class_name}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Average Score</p>
                      <h3 className="mt-3 text-3xl font-bold text-[#1f61c3]">{averageScore}</h3>
                      <p className="mt-2 text-sm text-gray-500">{selectedYear || 'Academic year pending'}, {selectedTerm || 'Term pending'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Passing Subjects</p>
                      <h3 className="mt-3 text-3xl font-bold text-emerald-600">{passingSubjects}</h3>
                      <p className="mt-2 text-sm text-gray-500">{scores.length} subjects in this report</p>
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
                    {scores.length > 0 ? (
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
                            {scores.map((score) => (
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
                  No child is linked to this parent account yet.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
