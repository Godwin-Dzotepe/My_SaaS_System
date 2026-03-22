'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Loader2, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

export default function AbsentStudentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [error, setError] = useState<string | null>(null);
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

    const fetchAbsentStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teacher/attendance/absent?class_id=${selectedClassId}&date=${selectedDate}`);
        if (!res.ok) {
          throw new Error('Failed to fetch absent students');
        }
        const data: Student[] = await res.json();
        setAbsentStudents(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAbsentStudents();
  }, [selectedClassId, selectedDate]);

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
            <XCircle className="w-6 h-6 text-red-500" /> Absent Students
          </CardTitle>
          <CardDescription>View students marked as absent for a specific class and date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {selectedClassId && absentStudents.length === 0 && !loading && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              No students marked as absent for this class and date.
            </div>
          )}

          {selectedClassId && absentStudents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" /> Absent Students in {classes.find(c => c.id === selectedClassId)?.class_name} on {selectedDate}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {absentStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_number || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
