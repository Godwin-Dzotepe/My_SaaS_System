'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, CheckCircle2, Loader2, Save, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  class_name: string;
  teacher_id: string;
}

interface Student {
  id: string;
  name: string;
  student_number?: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent';
}

export default function MarkAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch school ID from user session
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if ((d.user?.school_id || d.school_id)) {
          setSchoolId((d.user?.school_id || d.school_id));
        } else {
          setError('School ID not found. Please ensure you are logged in as a teacher and assigned to a school.');
          setLoading(false);
        }
      })
      .catch(e => {
        console.error('Error fetching user school ID:', e);
        setError('Failed to fetch user school ID. Please try again.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!schoolId) return;

    // Fetch classes assigned to the teacher
    const fetchClasses = async () => {
      try {
        const res = await fetch(`/api/teacher/classes?school_id=${schoolId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch classes');
        }
        const data: Class[] = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id); // Select the first class by default
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    const fetchStudentsAndAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch students for the selected class
        const studentsRes = await fetch(`/api/teacher/class-students?class_id=${selectedClassId}&school_id=${schoolId}`);
        if (!studentsRes.ok) {
          throw new Error('Failed to fetch students');
        }
        const studentsData: Student[] = await studentsRes.json();
        setStudents(studentsData);

        // Fetch existing attendance for the selected date and class
        const attendanceRes = await fetch(`/api/teacher/attendance/summary?class_id=${selectedClassId}&date=${selectedDate}`);
        if (!attendanceRes.ok) {
          throw new Error('Failed to fetch existing attendance');
        }
        const attendanceData: AttendanceRecord[] = await attendanceRes.json();
        
        const initialAttendance: Record<string, 'present' | 'absent'> = {};
        studentsData.forEach(student => {
          const record = attendanceData.find(ar => ar.student_id === student.id);
          initialAttendance[student.id] = record ? record.status : 'present'; // Default to present if no record is found for the day
        });
        setAttendance(initialAttendance);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndAttendance();
  }, [selectedClassId, selectedDate]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const recordsToSubmit: AttendanceRecord[] = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'absent', // Ensure status is set, default to absent if somehow missing
      }));

      const res = await fetch('/api/teacher/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: selectedClassId,
          date: selectedDate,
          attendance_records: recordsToSubmit,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit attendance');
      }

      setSuccess('Attendance submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !schoolId) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        <p>{error}</p>
        <Button onClick={() => router.refresh()} className="mt-4">Reload Page</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" /> Mark Daily Attendance
          </CardTitle>
          <CardDescription>Select a class and date to record student attendance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                Select Class
              </label>
              <select
                id="class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                disabled={classes.length === 0}
              >
                {classes.length === 0 ? (
                  <option value="">No classes assigned</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {selectedClassId && students.length === 0 && !loading && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              No students found for this class.
            </div>
          )}

          {selectedClassId && students.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" /> Students in {classes.find(c => c.id === selectedClassId)?.class_name}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name} {student.student_number && <Badge variant="outline" className="ml-2">{student.student_number}</Badge>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-3">
                            <Button
                              variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                            >
                              Present
                            </Button>
                            <Button
                              variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                            >
                              Absent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500 text-white rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> {success}
            </div>
          )}

          {selectedClassId && students.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSubmitAttendance} disabled={saving || loading} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Attendance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
