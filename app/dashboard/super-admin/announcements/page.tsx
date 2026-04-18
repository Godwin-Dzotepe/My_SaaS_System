'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Send,
  Loader2,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function GlobalAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/super-admin/announcements');

      if (response.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/super-admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        setMessage('');
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Announcements</h1>
          <p className="text-gray-600">Broadcast messages to all schools and users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Announcement */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Create Broadcast</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to All
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Previous Announcements */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Broadcasts</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : announcements.length === 0 ? (
              <Card className="p-10 text-center text-gray-500">
                No announcements sent yet.
              </Card>
            ) : (
              announcements.map((ann) => (
                <Card key={ann.id} className="overflow-hidden">
                  <div className="p-4 border-l-4 border-l-blue-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ann.creator.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(ann.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{ann.message}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
