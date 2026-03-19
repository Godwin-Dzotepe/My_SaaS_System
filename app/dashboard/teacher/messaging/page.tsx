'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

export default function TeacherMessagingPage() {
  const [userName, setUserName] = React.useState('Teacher');

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUserName(JSON.parse(userStr).name);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={userName} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messaging</h1>
        
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
          <p className="text-gray-500">Messaging module coming soon...</p>
        </div>
      </div>
    </div>
  );
}