'use client';

import * as React from 'react';
import {
  Bell,
  Loader2,
  Megaphone,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function ParentAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchAnnouncements = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setUserName(user.name);

      try {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (Array.isArray(data)) setAnnouncements(data);
        else if (data.announcements) setAnnouncements(data.announcements);
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[#212529]">Announcements</h1>
          <p className="text-[#646464] text-sm">Stay updated with the latest news from the school.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : announcements.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
             <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p>No announcements at this time.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {announcements.map((ann, idx) => (
              <Card key={ann.id} className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900">School Update</h3>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {ann.message}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
                         <span>Posted by:</span>
                         <span className="font-medium text-gray-600">{ann.creator?.name || 'School Admin'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
