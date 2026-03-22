'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Bell } from 'lucide-react';

export default function TeacherAnnouncementsPage() {
  const [userName, setUserName] = React.useState('Teacher');

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUserName(d.user.name); }).catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-gray-600" />
            Announcements
          </h1>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No announcements available yet.
        </div>
      </div>
    </div>
  );
}