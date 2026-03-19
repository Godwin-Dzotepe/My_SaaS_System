'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Loader2,
  School,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function AttendancePage() {
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        if (Array.isArray(data)) setClasses(data);
      } catch (err) {}
    };
    fetchClasses();
  }, []);

  const fetchAttendance = async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/attendance?class_id=${selectedClassId}&date=${selectedDate}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setStudents(data.map((s: any) => ({ ...s, status: s.status || 'present' })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAttendance();
  }, [selectedClassId, selectedDate]);

  const toggleStatus = (studentId: string) => {
    setStudents(students.map(s => 
      s.student_id === studentId ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          date: selectedDate,
          records: students.map(s => ({ student_id: s.student_id, status: s.status }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Attendance saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-500">Record daily attendance for students.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || students.length === 0} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Attendance
          </Button>
        </header>

        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
            <div className="flex flex-1 items-center gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Class</label>
                <select 
                  className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 w-48"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                <Input 
                  type="date" 
                  className="h-10 w-48"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm">{error}</div>}
            {success && <div className="p-4 bg-green-50 text-green-600 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
            
            {!selectedClassId ? (
              <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                 <School className="w-12 h-12 mb-2 opacity-20" />
                 <p>Please select a class to view students.</p>
              </div>
            ) : loading ? (
              <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-gray-500">No students found in this class.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Student Name</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 flex justify-center">
                           <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                             <button 
                               onClick={() => toggleStatus(student.student_id)}
                               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                student.status === 'present' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                               }`}
                             >
                               PRESENT
                             </button>
                             <button 
                               onClick={() => toggleStatus(student.student_id)}
                               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                student.status === 'absent' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                               }`}
                             >
                               ABSENT
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
