"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define types for our data
interface AppSession {
    id: string;
    role: string;
    school_id: string | null;
    name?: string;
}
interface TeacherClass {
  id: string;
  class_name: string;
  students?: Student[];
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Period {
  academic_year: string;
  term: string;
}

interface Student {
  id: string;
  name: string;
  student_number?: string;
}

interface ScoreInput {
  classScore: number | '';
  examScore: number | '';
}

export default function TeacherScoringPage() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreInput>>({});

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch session, classes, and subjects on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sessionRes, classesRes, subjectsRes, periodsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/teacher/my-class'),
          fetch('/api/teacher/subjects'),
          fetch('/api/teacher/periods'),
        ]);

        if (!sessionRes.ok) {
            throw new Error('Failed to fetch user session. Please log in again.');
        }
        if (!classesRes.ok || !subjectsRes.ok || !periodsRes.ok) {
          throw new Error('Failed to fetch classes, subjects, or periods');
        }

        const sessionData = await sessionRes.json();
        const classesData = await classesRes.json();
        const subjectsData = await subjectsRes.json();
        const periodsData = await periodsRes.json();

        setSession(sessionData.user || sessionData);
        if (classesData?.id) {
          setClasses([{ id: classesData.id, class_name: classesData.class_name }]);
          setSelectedClass(classesData.id);
        } else {
          setClasses([]);
        }
        setSubjects(subjectsData);
        const nextPeriods = Array.isArray(periodsData?.periods) ? periodsData.periods : [];
        setPeriods(nextPeriods);
        if (nextPeriods.length > 0) {
          setSelectedYear(nextPeriods[0].academic_year);
          setSelectedTerm(nextPeriods[0].term);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch students when class selection changes
  useEffect(() => {
    if (!selectedClass || !session?.school_id) return;

    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teacher/class-students?class_id=${selectedClass}&school_id=${session.school_id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch students');
        }
        const studentsData = await res.json();
        setStudents(studentsData);
        setScores({}); // Reset scores when students change
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, session]);

  const handleScoreChange = (studentId: string, field: 'classScore' | 'examScore', value: string) => {
    const numericValue = value === '' ? '' : Number(value);
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numericValue,
      },
    }));
  };

  const academicYears = Array.from(new Set(periods.map((period) => period.academic_year)));
  const availableTerms = periods.filter((period) => period.academic_year === selectedYear);

  const handleSaveScores = async () => {
    if (!selectedSubject || !selectedYear || !selectedTerm) {
      setError('Please select a subject, year, and term.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const scorePromises = Object.entries(scores).map(([student_id, score]) => {
      if ((score.classScore === '' || score.classScore === null) && (score.examScore === '' || score.examScore === null)) return null;

      return fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id,
          subject_id: selectedSubject,
          academic_year: selectedYear,
          term: selectedTerm,
          classScore: score.classScore === '' ? null : score.classScore,
          examScore: score.examScore === '' ? null : score.examScore,
        }),
      });
    }).filter(p => p !== null);

    if (scorePromises.length === 0) {
        setError("No scores entered to save.");
        setIsLoading(false);
        return;
    }

    try {
      const results = await Promise.all(scorePromises as Promise<Response>[]);
      const failedResponses = await Promise.all(
        results
          .filter((res) => !res.ok)
          .map(async (res) => {
            const payload = await res.json().catch(() => null);
            return {
              status: res.status,
              error: payload?.error || res.statusText || 'Unknown error',
            };
          })
      );

      if (failedResponses.length > 0) {
        const errorMsg = failedResponses.map((r) => r.error).join(', ');
        throw new Error(`${failedResponses.length} scores failed to save. Errors: ${errorMsg}`);
      }

      setSuccessMessage('All scores saved successfully!');
      setScores({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !students.length) {
      return <div className="p-8">Loading...</div>
  }

  if (error) {
      return (
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={session?.name || 'Teacher User'} />
          <div className="flex-1 lg:ml-64 p-8 text-red-500">
            Error: {error}
          </div>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={session?.name || 'Teacher User'} />
      <div className="flex-1 lg:ml-64 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Enter Student Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </Select>
            <Select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </Select>
            <Select
              value={selectedYear}
              onChange={e => {
                const nextYear = e.target.value;
                setSelectedYear(nextYear);
                const firstTerm = periods.find((period) => period.academic_year === nextYear)?.term || '';
                setSelectedTerm(firstTerm);
              }}
              disabled={isLoading}
            >
              <option value="">{academicYears.length === 0 ? 'No academic years found' : 'Select academic year'}</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              disabled={isLoading}
            >
              <option value="">{availableTerms.length === 0 ? 'No terms found' : 'Select term'}</option>
              {availableTerms.map((period) => <option key={`${period.academic_year}-${period.term}`} value={period.term}>{period.term}</option>)}
            </Select>
          </div>

          {successMessage && <p className="text-green-500">{successMessage}</p>}
          {!successMessage && !students.length && selectedClass && !isLoading ? (
            <p className="text-amber-600 text-sm">
              This class currently has no active students available for scoring.
            </p>
          ) : null}

          {selectedClass && students.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="w-32">Class Score</TableHead>
                    <TableHead className="w-32">Exam Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.student_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.classScore ?? ''}
                          onChange={e => handleScoreChange(student.id, 'classScore', e.target.value)}
                          placeholder="e.g., 40"
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={scores[student.id]?.examScore ?? ''}
                          onChange={e => handleScoreChange(student.id, 'examScore', e.target.value)}
                          placeholder="e.g., 60"
                          disabled={isLoading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleSaveScores} disabled={isLoading || Object.keys(scores).length === 0}>
                {isLoading ? 'Saving...' : 'Save All Scores'}
              </Button>
            </>
          )}
           {selectedClass && students.length === 0 && !isLoading && (
              <p className="text-gray-500 mt-4">No students found in the selected class.</p>
           )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

