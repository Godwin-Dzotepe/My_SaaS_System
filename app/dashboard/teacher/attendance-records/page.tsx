'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  teacher_name: string;
  status: 'Present' | 'Absent';
  date: string;
}

export default function TeacherAttendanceRecordsPage() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const fetchRecords = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const response = await fetch(`/api/attendance/teachers/records${params.toString() ? `?${params.toString()}` : ''}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch your attendance records.');
      }

      setRecords(Array.isArray(data?.records) ? data.records : []);
    } catch (fetchError) {
      console.error(fetchError);
      setRecords([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch your attendance records.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher User" />
      <div className="flex-1 space-y-6 p-4 lg:ml-64 lg:p-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">My Attendance Records</h1>
          <p className="mt-1 text-sm text-gray-500">Review only your own marked attendance history.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Button onClick={fetchRecords}>Filter</Button>
          </CardContent>
        </Card>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teacher</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{record.teacher_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                          No attendance records found for the selected range.
                        </td>
                      </tr>
                    ) : null}
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
