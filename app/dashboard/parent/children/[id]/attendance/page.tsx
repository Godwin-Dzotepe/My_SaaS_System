'use client';

import * as React from 'react';
import {
  Loader2,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  School,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';

interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent';
  date: string;
}

interface AttendanceResponse {
  child: {
    id: string;
    name: string;
    class_name: string;
    school_name: string;
  };
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: string;
  };
  records: AttendanceRecord[];
}

export default function ChildAttendancePage() {
  const params = useParams();
  const id = params.id as string;
  const [attendance, setAttendance] = React.useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const attendanceRes = await fetch(`/api/parent/children/${id}/attendance`);
        const attendanceData = await attendanceRes.json();
        if (!attendanceRes.ok) {
          throw new Error(attendanceData.error || 'Failed to fetch child attendance.');
        }

        setAttendance(attendanceData);
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch child attendance.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAttendance();
    }
  }, [id]);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName="Parent" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex items-center gap-4">
          <Link href="/dashboard/parent/children">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#212529]">Attendance Record</h1>
            <p className="text-[#646464] text-sm">Detailed history for {attendance?.child.name || 'your child'}.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <Card className="p-10 text-center text-red-600">{error}</Card>
        ) : !attendance ? (
          <Card className="p-10 text-center text-gray-500">Child information not found.</Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-[#3f7afc] to-[#2d6ae0] text-white">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">{attendance.child.name}</h2>
                    <p className="text-blue-100 flex items-center gap-2 mt-2">
                      <School className="w-4 h-4" />
                      {attendance.child.school_name}
                    </p>
                    <div className="mt-3">
                      <Badge className="bg-white/20 hover:bg-white/20 border-none text-white">
                        {attendance.child.class_name}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Attendance Rate</p>
                    <p className="text-3xl font-bold">{attendance.summary.attendanceRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-none shadow-sm text-center p-6">
                <p className="text-sm font-bold text-gray-400 uppercase mb-2">Total Days</p>
                <h3 className="text-3xl font-bold">{attendance.summary.totalDays}</h3>
              </Card>
              <Card className="bg-white border-none shadow-sm text-center p-6">
                <p className="text-sm font-bold text-gray-400 uppercase mb-2">Present</p>
                <h3 className="text-3xl font-bold text-green-600">{attendance.summary.presentDays}</h3>
              </Card>
              <Card className="bg-white border-none shadow-sm text-center p-6">
                <p className="text-sm font-bold text-gray-400 uppercase mb-2">Absent</p>
                <h3 className="text-3xl font-bold text-red-600">{attendance.summary.absentDays}</h3>
              </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Day</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendance.records.length > 0 ? attendance.records.map((record) => {
                        const recordDate = new Date(record.date);
                        return (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{recordDate.toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-gray-600">{recordDate.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                {record.status === 'present' ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Present
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Absent
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-xs italic">
                              {record.status === 'present' ? 'Recorded as present.' : 'Recorded as absent.'}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                            No attendance records available for this child yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
