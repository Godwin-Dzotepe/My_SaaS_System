'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Settings } from 'lucide-react';

export default function SecretarySettingsPage() {
  const [userName, setUserName] = React.useState('Secretary');

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUserName(d.user.name); }).catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            Settings
          </h1>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Settings configuration module coming soon...
        </div>
      </div>
    </div>
  );
}