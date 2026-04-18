'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageDialog } from '@/components/ui/message-dialog';

interface SubjectOption {
  id: string;
  subject_name: string;
}

interface ClassOption {
  id: string;
  class_name: string;
}

interface Period {
  academic_year: string;
  term: string;
}

interface ScoreRow {
  id: string;
  academic_year: string;
  term: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
  behavior: string | null;
  teacherAdvice: string | null;
  updated_at: string;
  subject: {
    id: string;
    subject_name: string;
  };
  student: {
    id: string;
    name: string;
    student_number: string | null;
    class: {
      id: string;
      class_name: string;
    } | null;
  };
}

export default function TeacherViewScoresPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingScores, setIsFetchingScores] = React.useState(false);
  const [scores, setScores] = React.useState<ScoreRow[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState('');
  const [selectedClass, setSelectedClass] = React.useState('');
  const [selectedYear, setSelectedYear] = React.useState('');
  const [selectedTerm, setSelectedTerm] = React.useState('');
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    tone: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const academicYears = React.useMemo(
    () => Array.from(new Set(periods.map((period) => period.academic_year))),
    [periods]
  );

  const availableTerms = React.useMemo(
    () => periods.filter((period) => period.academic_year === selectedYear),
    [periods, selectedYear]
  );

  const fetchScores = React.useCallback(async () => {
    setIsFetchingScores(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.set('class_id', selectedClass);
      if (selectedSubject) params.set('subject_id', selectedSubject);
      if (selectedYear) params.set('academic_year', selectedYear);
      if (selectedTerm) params.set('term', selectedTerm);

      const response = await fetch(`/api/scores?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || 'Failed to fetch scores.');
      }
      setScores(payload?.scores || []);
    } catch (error) {
      setDialogState({
        open: true,
        title: 'Unable to Load Scores',
        message: error instanceof Error ? error.message : 'Failed to fetch scores.',
        tone: 'error',
      });
    } finally {
      setIsFetchingScores(false);
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear]);

  React.useEffect(() => {
    const fetchFilters = async () => {
      setIsLoading(true);
      try {
        const [subjectsRes, classRes, periodsRes] = await Promise.all([
          fetch('/api/teacher/subjects'),
          fetch('/api/teacher/my-class'),
          fetch('/api/teacher/periods'),
        ]);

        if (!subjectsRes.ok || !classRes.ok || !periodsRes.ok) {
          throw new Error('Failed to load score filters.');
        }

        const subjectsData = await subjectsRes.json();
        const classData = await classRes.json();
        const periodsData = await periodsRes.json();
        const nextPeriods = Array.isArray(periodsData?.periods) ? periodsData.periods : [];

        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setClasses(classData?.id ? [{ id: classData.id, class_name: classData.class_name }] : []);
        setPeriods(nextPeriods);
        if (classData?.id) setSelectedClass(classData.id);
        if (nextPeriods.length > 0) {
          setSelectedYear(nextPeriods[0].academic_year);
          setSelectedTerm(nextPeriods[0].term);
        }
      } catch (error) {
        setDialogState({
          open: true,
          title: 'Loading Problem',
          message: error instanceof Error ? error.message : 'Failed to load score page.',
          tone: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilters();
  }, []);

  React.useEffect(() => {
    if (!isLoading) {
      fetchScores();
    }
  }, [fetchScores, isLoading]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      <div className="flex-1 p-4 md:p-8 lg:ml-64 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>View Saved Scores</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Review the scores, attitude, and teacher advice already saved for your students.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/teacher/scoring">
                <Button variant="outline">Go to Scoring</Button>
              </Link>
              <Link href="/dashboard/teacher/score-review">
                <Button>Go to Score Review</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={isLoading}>
                <option value="">All Classes</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name}
                  </option>
                ))}
              </Select>
              <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={isLoading}>
                <option value="">All Subjects</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subject_name}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={(e) => {
                  const nextYear = e.target.value;
                  setSelectedYear(nextYear);
                  const nextTerm = periods.find((period) => period.academic_year === nextYear)?.term || '';
                  setSelectedTerm(nextTerm);
                }}
                disabled={isLoading}
              >
                <option value="">All Years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
              <Select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} disabled={isLoading}>
                <option value="">All Terms</option>
                {availableTerms.map((period) => (
                  <option key={`${period.academic_year}-${period.term}`} value={period.term}>
                    {period.term}
                  </option>
                ))}
              </Select>
              <Button onClick={fetchScores} disabled={isFetchingScores}>
                {isFetchingScores ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {scores.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No saved scores found for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Behavior</TableHead>
                      <TableHead>Teacher Advice</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.student.name}</div>
                          <div className="text-xs text-gray-500">{item.student.student_number || 'No student ID'}</div>
                        </TableCell>
                        <TableCell>{item.student.class?.class_name || 'N/A'}</TableCell>
                        <TableCell>{item.subject.subject_name}</TableCell>
                        <TableCell>{item.term} {item.academic_year}</TableCell>
                        <TableCell>{item.totalScore ?? 'N/A'}</TableCell>
                        <TableCell>{item.grade ?? 'N/A'}</TableCell>
                        <TableCell>{item.behavior || 'N/A'}</TableCell>
                        <TableCell>{item.teacherAdvice || 'N/A'}</TableCell>
                        <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MessageDialog
        isOpen={dialogState.open}
        onClose={() => setDialogState((current) => ({ ...current, open: false }))}
        title={dialogState.title}
        message={dialogState.message}
        tone={dialogState.tone}
      />
    </div>
  );
}
