'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MessageDialog } from '@/components/ui/message-dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

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
  behavior: string | null;
  teacherAdvice: string | null;
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

interface StudentReviewGroup {
  studentId: string;
  studentName: string;
  studentNumber: string | null;
  className: string;
  behavior: string;
  teacherAdvice: string;
  scores: ScoreRow[];
}

interface ScoreEditDraft {
  classScore: string;
  examScore: string;
}

const toScoreInput = (value: number | null) => (value === null || value === undefined ? '' : String(value));

const computeTotal = (classScore: string, examScore: string) => {
  const classNum = classScore.trim() === '' ? null : Number(classScore);
  const examNum = examScore.trim() === '' ? null : Number(examScore);
  const hasClass = classNum !== null && !Number.isNaN(classNum);
  const hasExam = examNum !== null && !Number.isNaN(examNum);
  if (!hasClass && !hasExam) return 'N/A';
  return String((hasClass ? classNum! : 0) + (hasExam ? examNum! : 0));
};

export default function TeacherScoreReviewPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingScores, setIsFetchingScores] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [scores, setScores] = React.useState<ScoreRow[]>([]);
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState('');
  const [selectedClass, setSelectedClass] = React.useState('');
  const [selectedYear, setSelectedYear] = React.useState('');
  const [selectedTerm, setSelectedTerm] = React.useState('');
  const [editingStudentId, setEditingStudentId] = React.useState<string | null>(null);
  const [scoreDrafts, setScoreDrafts] = React.useState<Record<string, ScoreEditDraft>>({});
  const [behaviorDraft, setBehaviorDraft] = React.useState('');
  const [teacherAdviceDraft, setTeacherAdviceDraft] = React.useState('');
  const [openSaveConfirm, setOpenSaveConfirm] = React.useState(false);
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

  const groupedStudents = React.useMemo<StudentReviewGroup[]>(() => {
    const map = new Map<string, StudentReviewGroup>();
    for (const row of scores) {
      const existing = map.get(row.student.id);
      if (existing) {
        existing.scores.push(row);
        continue;
      }

      map.set(row.student.id, {
        studentId: row.student.id,
        studentName: row.student.name,
        studentNumber: row.student.student_number,
        className: row.student.class?.class_name || 'N/A',
        behavior: row.behavior || '',
        teacherAdvice: row.teacherAdvice || '',
        scores: [row],
      });
    }

    return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [scores]);

  const editingStudent = React.useMemo(
    () => groupedStudents.find((student) => student.studentId === editingStudentId) || null,
    [groupedStudents, editingStudentId]
  );

  const fetchScores = React.useCallback(async () => {
    setIsFetchingScores(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.set('class_id', selectedClass);
      if (selectedYear) params.set('academic_year', selectedYear);
      if (selectedTerm) params.set('term', selectedTerm);

      const response = await fetch(`/api/scores?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || 'Failed to fetch scores.');
      }

      setScores(payload?.scores || []);
      setEditingStudentId(null);
    } catch (error) {
      setDialogState({
        open: true,
        title: 'Unable to Load Score Review',
        message: error instanceof Error ? error.message : 'Failed to fetch scores.',
        tone: 'error',
      });
    } finally {
      setIsFetchingScores(false);
    }
  }, [selectedClass, selectedTerm, selectedYear]);

  React.useEffect(() => {
    const fetchFilters = async () => {
      setIsLoading(true);
      try {
        const [classRes, periodsRes] = await Promise.all([
          fetch('/api/teacher/my-class'),
          fetch('/api/teacher/periods'),
        ]);

        if (!classRes.ok || !periodsRes.ok) {
          throw new Error('Failed to load review filters.');
        }

        const classData = await classRes.json();
        const periodsData = await periodsRes.json();
        const nextPeriods = Array.isArray(periodsData?.periods) ? periodsData.periods : [];

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
          message: error instanceof Error ? error.message : 'Failed to load score review page.',
          tone: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilters();
  }, []);

  React.useEffect(() => {
    if (!isLoading) fetchScores();
  }, [fetchScores, isLoading]);

  const startEdit = (student: StudentReviewGroup) => {
    if (!selectedYear || !selectedTerm) {
      setDialogState({
        open: true,
        title: 'Select Period',
        message: 'Please select academic year and term before editing student scores.',
        tone: 'warning',
      });
      return;
    }

    setEditingStudentId(student.studentId);
    setBehaviorDraft(student.behavior);
    setTeacherAdviceDraft(student.teacherAdvice);
    setScoreDrafts(
      Object.fromEntries(
        student.scores.map((score) => [
          score.id,
          {
            classScore: toScoreInput(score.classScore),
            examScore: toScoreInput(score.examScore),
          },
        ])
      )
    );
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setBehaviorDraft('');
    setTeacherAdviceDraft('');
    setScoreDrafts({});
    setOpenSaveConfirm(false);
  };

  const updateScoreDraft = (scoreId: string, field: keyof ScoreEditDraft, value: string) => {
    setScoreDrafts((current) => ({
      ...current,
      [scoreId]: {
        classScore: current[scoreId]?.classScore || '',
        examScore: current[scoreId]?.examScore || '',
        [field]: value,
      },
    }));
  };

  const saveChanges = async () => {
    if (!editingStudent || !selectedYear || !selectedTerm) return;

    try {
      setIsSaving(true);
      const saveResponses = await Promise.all(
        editingStudent.scores.map(async (score) => {
          const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: editingStudent.studentId,
              subject_id: score.subject.id,
              academic_year: selectedYear,
              term: selectedTerm,
              classScore: (scoreDrafts[score.id]?.classScore ?? toScoreInput(score.classScore)).trim() === ''
                ? null
                : Number(scoreDrafts[score.id]?.classScore ?? toScoreInput(score.classScore)),
              examScore: (scoreDrafts[score.id]?.examScore ?? toScoreInput(score.examScore)).trim() === ''
                ? null
                : Number(scoreDrafts[score.id]?.examScore ?? toScoreInput(score.examScore)),
              behavior: behaviorDraft.trim() || null,
              teacherAdvice: teacherAdviceDraft.trim() || null,
            }),
          });
          const payload = await response.json().catch(() => null);
          return { ok: response.ok, payload };
        })
      );

      const failed = saveResponses.find((item) => !item.ok);
      if (failed) {
        throw new Error(failed.payload?.error || failed.payload?.details || 'Failed to save student review.');
      }

      setDialogState({
        open: true,
        title: 'Saved',
        message: `Changes saved for ${editingStudent.studentName}.`,
        tone: 'success',
      });
      setOpenSaveConfirm(false);
      await fetchScores();
      cancelEdit();
    } catch (error) {
      setDialogState({
        open: true,
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save student review.',
        tone: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      <div className="flex-1 p-4 md:p-8 lg:ml-64 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Score Review</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Open a student to edit all subjects and scores, then save with behavior and teacher advice.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/teacher/scoring">
                <Button variant="outline">Back to Scoring</Button>
              </Link>
              <Button onClick={fetchScores} disabled={isFetchingScores}>
                {isFetchingScores ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={isLoading}>
                <option value="">All Classes</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name}
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
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
              <Select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} disabled={isLoading}>
                <option value="">Select Term</option>
                {availableTerms.map((period) => (
                  <option key={`${period.academic_year}-${period.term}`} value={period.term}>
                    {period.term}
                  </option>
                ))}
              </Select>
            </div>

            {!editingStudent ? (
              groupedStudents.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">No saved results found for the selected filters.</p>
              ) : (
                <div className="space-y-3">
                  {groupedStudents.map((student) => (
                    <div key={student.studentId} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{student.studentName}</p>
                          <p className="text-sm text-gray-500">
                            {student.className} | {student.studentNumber || 'No student ID'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.scores.length} subject{student.scores.length === 1 ? '' : 's'} in selected period
                          </p>
                        </div>
                        <Button onClick={() => startEdit(student)}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{editingStudent.studentName}</p>
                    <p className="text-sm text-gray-600">
                      {editingStudent.className} | {editingStudent.studentNumber || 'No student ID'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={() => setOpenSaveConfirm(true)} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {editingStudent.scores.map((score) => (
                    <div key={score.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Subject
                          </label>
                          <Input value={score.subject.subject_name} disabled />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Class Score
                          </label>
                          <Input
                            type="number"
                            value={scoreDrafts[score.id]?.classScore ?? toScoreInput(score.classScore)}
                            onChange={(e) => updateScoreDraft(score.id, 'classScore', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Exam Score
                          </label>
                          <Input
                            type="number"
                            value={scoreDrafts[score.id]?.examScore ?? toScoreInput(score.examScore)}
                            onChange={(e) => updateScoreDraft(score.id, 'examScore', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total
                          </label>
                          <Input
                            disabled
                            value={computeTotal(
                              scoreDrafts[score.id]?.classScore ?? toScoreInput(score.classScore),
                              scoreDrafts[score.id]?.examScore ?? toScoreInput(score.examScore)
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Behavior (student-level)
                    </label>
                    <Input
                      value={behaviorDraft}
                      onChange={(e) => setBehaviorDraft(e.target.value)}
                      placeholder="e.g. Respectful, focused, collaborative"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Teacher Advice (student-level)
                    </label>
                    <Input
                      value={teacherAdviceDraft}
                      onChange={(e) => setTeacherAdviceDraft(e.target.value)}
                      placeholder="e.g. Keep daily revision and practice"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={openSaveConfirm}
        onClose={() => setOpenSaveConfirm(false)}
        onConfirm={saveChanges}
        title="Save Student Score Changes?"
        message="Do you want to save the edited scores, behavior, and teacher advice for this student?"
        confirmText="Yes, Save"
        cancelText="No"
        isLoading={isSaving}
      />

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
