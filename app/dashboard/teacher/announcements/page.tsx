'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Bell, Loader2, Megaphone, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Announcement {
  id: string;
  message: string;
  created_at: string;
  creator?: {
    name?: string;
  };
}

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch announcements.');
        }

        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch announcements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />

      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-gray-600" />
            Announcements
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center text-red-600 bg-white border border-red-100">
            {error}
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 bg-white border border-gray-200">
            No announcements available yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="border-none shadow-sm bg-white overflow-hidden">
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
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
                        <span>Posted by:</span>
                        <span className="font-medium text-gray-600">{announcement.creator?.name || 'School Admin'}</span>
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
