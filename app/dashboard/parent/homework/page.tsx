'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { BookOpen, Calendar, Clock, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  due_date: string | null;
  created_at: string;
  class: { class_name: string };
  teacher: { name: string };
  children_in_class: { id: string; name: string }[];
}

function daysUntil(dueDateStr: string | null) {
  if (!dueDateStr) return null;
  const diff = new Date(dueDateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return days;
}

function dueBadge(dueDateStr: string | null) {
  const days = daysUntil(dueDateStr);
  if (days === null) return null;
  if (days < 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past due</span>;
  if (days === 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Due today</span>;
  if (days <= 2) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Due in {days}d</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Due in {days}d</span>;
}

export default function ParentHomeworkPage() {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Parent');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.name) setUserName(d.user.name); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/parent/homework')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setHomework(data);
        else setError(data?.error ?? 'Failed to load homework');
      })
      .catch(() => setError('Failed to load homework'))
      .finally(() => setLoading(false));
  }, []);

  // Group by class
  const byClass = homework.reduce<Record<string, HomeworkItem[]>>((acc, hw) => {
    const key = hw.class.class_name;
    acc[key] = [...(acc[key] ?? []), hw];
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/dashboard/parent" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-3">
            <ChevronLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Homework & Assignments
          </h1>
          <p className="text-sm text-gray-500 mt-1">Recent assignments set by your children's teachers</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : homework.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            <BookOpen className="mx-auto w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No homework assignments yet</p>
            <p className="text-sm mt-1">Teachers haven't posted any assignments for your children's classes</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byClass).map(([className, items]) => (
              <div key={className}>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <h2 className="text-base font-bold text-gray-800">{className}</h2>
                  <span className="text-xs text-gray-400">— {items[0]?.children_in_class.map(c => c.name).join(', ')}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map(hw => (
                    <div key={hw.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900 leading-snug">{hw.title}</h3>
                        {dueBadge(hw.due_date)}
                      </div>

                      {hw.description && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{hw.description}</p>
                      )}

                      <div className="flex flex-col gap-1.5 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Set by {hw.teacher.name}
                        </div>
                        {hw.due_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {new Date(hw.due_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        )}
                        {hw.file_url && (
                          <a href={hw.file_url} target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                            <BookOpen className="w-3.5 h-3.5" /> View attachment
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
