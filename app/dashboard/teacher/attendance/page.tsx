'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Loader2,
  Clock,
  Save,
  Bell,
  Users
} from 'lucide-react';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';



export default function TeacherAttendancePage() {
  const [myClasses, setMyClasses] = React.useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [userName, setUserName] = React.useState('Teacher');

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(meData => {
      if (meData.user) setUserName(meData.user.name);
    }).catch(e => {});

    // Fetch classes assigned to this teacher
    const fetchMyClasses = async () => {
        try {
            const res = await fetch('/api/teacher/my-class');
            const data = await res.json();
            // The API might return a single class or an array depending on your implementation
            const classArray = Array.isArray(data) ? data : (data.id ? [data] : []);
            setMyClasses(classArray);
            if (classArray.length > 0) setSelectedClassId(classArray[0].id);
        } catch (err) {}
    };
    fetchMyClasses();
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
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#212529]">Mark Attendance</h1>
            <p className="text-[#646464] text-sm">Keep track of your students&apos; daily presence.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || students.length === 0} 
            className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] text-white shadow-md transition-all hover:translate-y-[-2px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-white border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class</label>
                            <select 
                                className="block w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-[#3f7afc] transition-all"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {myClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Date</label>
                            <Input 
                                type="date" 
                                className="h-10 bg-gray-50 border-gray-100"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <Badge className="bg-[#e7ffdf] text-[#1d9d00] border-none">
                        {students.length} Students
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {error && <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>}
                    {success && <div className="p-4 bg-green-50 text-green-600 text-sm flex gap-2 border-b border-green-100"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
                    
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3f7afc]" /></div>
                    ) : students.length === 0 ? (
                        <div className="py-20 text-center text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p>No students assigned to this class.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#fcfdfe] text-[#646464] text-xs font-bold uppercase tracking-wider border-b border-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Student Name</th>
                                        <th className="px-6 py-4 text-center">Attendance Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {students.map((student) => (
                                        <tr key={student.student_id} className="hover:bg-[#f8f9fb] transition-colors group">
                                            <td className="px-6 py-4 font-bold text-[#212529]">{student.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                                                        <button 
                                                            onClick={() => toggleStatus(student.student_id)}
                                                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                                                                student.status === 'present' 
                                                                ? 'bg-[#1d9d00] text-white shadow-md scale-105' 
                                                                : 'text-gray-500 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            PRESENT
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleStatus(student.student_id)}
                                                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                                                                student.status === 'absent' 
                                                                ? 'bg-[#ff0000] text-white shadow-md scale-105' 
                                                                : 'text-gray-500 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            ABSENT
                                                        </button>
                                                    </div>
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

            <div className="space-y-6">
                <Card className="bg-white border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#ffa001]" />
                            Attendance Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm text-green-700 font-medium">Present</span>
                            <span className="text-lg font-bold text-green-700">{students.filter(s => s.status === 'present').length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <span className="text-sm text-red-700 font-medium">Absent</span>
                            <span className="text-lg font-bold text-red-700">{students.filter(s => s.status === 'absent').length}</span>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Completion Rate</span>
                                <span>{students.length > 0 ? Math.round((students.filter(s => s.status).length / students.length) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-[#3f7afc] h-full transition-all duration-500" 
                                    style={{ width: `${students.length > 0 ? (students.filter(s => s.status).length / students.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#ffa001] to-[#ff9d01] text-white border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Reminder
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-amber-50 leading-relaxed">
                            Daily attendance must be recorded before 10:00 AM. Attendance data is instantly shared with parents through their portal.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
