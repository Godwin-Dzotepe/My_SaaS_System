'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { BookOpen, Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: { subject_name: string };
  class: { class_name: string };
}

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Teacher');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUserName(d.user.name);
          setTeacherId(d.user.id);
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    fetch(`/api/timetable?teacher_id=${teacherId}`)
      .then(r => r.json())
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const entryAt = (day: number, period: number) =>
    entries.find(e => e.day_of_week === day && e.period_number === period);

  const hasAnyEntry = entries.length > 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={userName} />

      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> My Timetable
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your weekly teaching schedule</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !hasAnyEntry ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            <BookOpen className="mx-auto w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No timetable assigned yet</p>
            <p className="text-sm mt-1">Your school admin will set up your schedule</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-16">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => {
                  const rowHasContent = [1,2,3,4,5].some(day => entryAt(day, period));
                  if (!rowHasContent) return null;
                  return (
                    <tr key={period} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-xs font-bold text-gray-400">P{period}</td>
                      {[1,2,3,4,5].map(day => {
                        const entry = entryAt(day, period);
                        return (
                          <td key={day} className="px-2 py-2">
                            {entry ? (
                              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 min-h-[52px]">
                                <p className="font-semibold text-blue-700 text-xs">{entry.subject.subject_name}</p>
                                <p className="text-gray-500 text-xs">{entry.class.class_name}</p>
                                <p className="text-gray-400 text-[10px]">{entry.start_time}–{entry.end_time}{entry.room ? ` · ${entry.room}` : ''}</p>
                              </div>
                            ) : (
                              <div className="min-h-[52px]" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
