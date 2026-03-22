'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Download, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

type PreviewRow = {
  teacher_id: string;
  teacher_name: string;
  phone: string;
  email: string | null;
  status: 'Present' | 'Absent';
  hasMarkedSelf: boolean;
  record_id: string | null;
  recorded_at: string | null;
};

type PreviewResponse = {
  date: string;
  preview: PreviewRow[];
  summary: {
    total_teachers: number;
    present: number;
    absent: number;
  };
};

export default function TeacherAttendancePage() {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPreview = async (selectedDate: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/attendance/teachers/preview?date=${selectedDate}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load attendance preview.');
      }

      setPreview(data);
    } catch (fetchError) {
      console.error(fetchError);
      setPreview(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load attendance preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(date);
  }, [date]);

  const handleFinalize = async () => {
    try {
      setSaving(true);
      setError('');

      const res = await fetch('/api/attendance/teachers/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to finalize teacher attendance.');
      }

      await fetchPreview(date);
      alert('Teacher attendance saved successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to finalize teacher attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />
      <motion.div className="flex-1 space-y-6 p-4 lg:ml-64 lg:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Teacher Attendance Preview</h1>
            <p className="mt-1 text-sm text-gray-500">
              Teachers who marked themselves show as present. Everyone else previews as absent until you save the day.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/school-admin/teacher-attendance/records">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                View Records
              </Button>
            </Link>
            <Button onClick={handleFinalize} disabled={saving || !preview} className="bg-blue-600 text-white hover:bg-blue-700">
              {saving ? 'Saving...' : 'Save Daily Attendance'}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Teachers</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{preview?.summary.total_teachers ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Present</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{preview?.summary.present ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Absent</p>
                <p className="mt-2 text-3xl font-bold text-rose-600">{preview?.summary.absent ?? 0}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Teacher</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Preview Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Marked Self</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview?.preview.map((teacher) => (
                    <tr key={teacher.teacher_id} className="transition-colors hover:bg-gray-50/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{teacher.teacher_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{teacher.phone}</div>
                        <div>{teacher.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                            teacher.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {teacher.status === 'Present' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {teacher.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {teacher.hasMarkedSelf ? (
                          <span className="font-medium text-emerald-700">Yes</span>
                        ) : (
                          <span className="font-medium text-rose-700">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {preview && preview.preview.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No teachers found in the system.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
