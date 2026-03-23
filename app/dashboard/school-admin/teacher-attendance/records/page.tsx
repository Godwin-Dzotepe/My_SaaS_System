'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_email: string | null;
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
        throw new Error(data?.error || 'Failed to fetch teacher attendance records.');
      }

      setRecords(Array.isArray(data?.records) ? data.records : []);
    } catch (fetchError) {
      console.error(fetchError);
      setRecords([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch teacher attendance records.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDownload = () => {
    const csvRows = [
      ['Teacher Name', 'Phone', 'Email', 'Status', 'Date'],
      ...records.map((record) => [
        record.teacher_name,
        record.teacher_phone,
        record.teacher_email || '',
        record.status,
        new Date(record.date).toLocaleDateString(),
      ]),
    ];

    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-attendance-records-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />
      <div className="flex-1 space-y-6 p-4 lg:ml-64 lg:p-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Attendance Records</h1>
            <p className="mt-1 text-sm text-gray-500">Review historical attendance and download the record.</p>
          </div>
          <Button onClick={handleDownload} disabled={records.length === 0} className="w-full gap-2 sm:w-auto">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full" />
            <Button onClick={fetchRecords} className="w-full md:w-auto">Filter</Button>
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
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teacher</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{record.teacher_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.teacher_phone}</td>
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
                          <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                            No attendance records found for the selected range.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 md:hidden">
                  {records.map((record) => (
                    <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">{record.teacher_name}</p>
                        <p className="text-sm text-gray-600">{record.teacher_phone}</p>
                        <p className="break-all text-sm text-gray-500">{record.teacher_email || 'No email'}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {record.status}
                          </span>
                          <span className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {records.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-500 shadow-sm">
                      No attendance records found for the selected range.
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
