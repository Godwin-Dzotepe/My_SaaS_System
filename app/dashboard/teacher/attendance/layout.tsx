import React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}
