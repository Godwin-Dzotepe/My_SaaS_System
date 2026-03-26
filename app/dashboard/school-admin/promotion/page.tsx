'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Users } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

type ClassItem = {
  id: string;
  class_name: string;
};

type StudentItem = {
  id: string;
  name: string;
  student_number: string | null;
};

export default function PromotionPage() {
  const [schoolId, setSchoolId] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [repeatStudentIds, setRepeatStudentIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const toClassOptions = useMemo(
    () => classes.filter((item) => item.id !== fromClassId),
    [classes, fromClassId]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        (student.student_number || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const promotedCount = Math.max(0, students.length - repeatStudentIds.length);
  const repeatedCount = repeatStudentIds.length;

  const fetchClasses = async (sId: string) => {
    const res = await fetch(`/api/promote-students?school_id=${sId}`);
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.error || 'Failed to load classes.');
    }
    setClasses(Array.isArray(payload?.classes) ? payload.classes : []);
  };

  const fetchStudentsForClass = async (sId: string, classId: string) => {
    if (!classId) {
      setStudents([]);
      setRepeatStudentIds([]);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/promote-students?school_id=${sId}&from_class_id=${classId}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to load students.');
      }

      const nextStudents: StudentItem[] = Array.isArray(payload?.students) ? payload.students : [];
      setStudents(nextStudents);
      setRepeatStudentIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const mePayload = await meRes.json().catch(() => null);
        const sId = mePayload?.user?.school_id;
        if (!sId) {
          setError('Could not resolve school for this admin account.');
          return;
        }

        setSchoolId(sId);
        await fetchClasses(sId);
      } catch {
        setError('Failed to initialize promotion screen.');
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!schoolId || !fromClassId) return;
    fetchStudentsForClass(schoolId, fromClassId);
  }, [schoolId, fromClassId]);

  const toggleRepeat = (studentId: string) => {
    setRepeatStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const markAllRepeat = () => {
    setRepeatStudentIds(students.map((student) => student.id));
  };

  const clearRepeat = () => {
    setRepeatStudentIds([]);
  };

  const handlePromote = async () => {
    if (!schoolId || !fromClassId || !toClassId) {
      setError('Select source class and destination class first.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/promote-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          from_class_id: fromClassId,
          to_class_id: toClassId,
          repeated_student_ids: repeatStudentIds,
          note: note.trim() || null,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || 'Promotion failed.');
      }

      setMessage(
        `Done: ${payload?.promoted_count ?? 0} promoted, ${payload?.repeated_count ?? 0} repeated.`
      );
      await fetchStudentsForClass(schoolId, fromClassId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <div className="flex-1 p-4 md:p-8 lg:ml-64 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Promotion</CardTitle>
            <CardDescription>
              Select a class to promote, select the destination class, mark repeat students, then confirm promotion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}
            {message ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {message}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">From Class</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={fromClassId}
                  onChange={(e) => {
                    setFromClassId(e.target.value);
                    setToClassId('');
                  }}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">To Class</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={toClassId}
                  onChange={(e) => setToClassId(e.target.value)}
                  disabled={!fromClassId}
                >
                  <option value="">Select destination class</option>
                  {toClassOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.class_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              placeholder="Optional note for this promotion cycle"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              Students checked as repeat will stay in the current class. All unchecked students will move to the destination class.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                <div className="text-blue-700">Total in class</div>
                <div className="text-xl font-bold text-blue-900">{students.length}</div>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
                <div className="text-green-700">Will be promoted</div>
                <div className="text-xl font-bold text-green-900">{promotedCount}</div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
                <div className="text-amber-700">Will repeat</div>
                <div className="text-xl font-bold text-amber-900">{repeatedCount}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search by name or student number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
              <Button variant="outline" onClick={markAllRepeat} disabled={students.length === 0}>Mark All Repeat</Button>
              <Button variant="outline" onClick={clearRepeat} disabled={repeatStudentIds.length === 0}>Clear Repeat</Button>
            </div>

            <div className="border rounded-lg max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No students found for this class/filter.</div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => {
                    const isRepeat = repeatStudentIds.includes(student.id);
                    return (
                      <label key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.student_number || 'No ID'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${isRepeat ? 'text-amber-700' : 'text-green-700'}`}>
                            {isRepeat ? 'Repeat' : 'Promote'}
                          </span>
                          <input
                            type="checkbox"
                            checked={isRepeat}
                            onChange={() => toggleRepeat(student.id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePromote}
                disabled={submitting || !fromClassId || !toClassId || students.length === 0}
                className="min-w-44"
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Promoting...</span>
                ) : (
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Promote</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
