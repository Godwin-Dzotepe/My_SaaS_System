'use client';

import * as React from 'react';
import {
  Bell,
  Send,
  Loader2,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

export default function SchoolAdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch announcements');
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
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
    setError('');
    setSuccess('');
    setSending(true);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send announcement');

      setMessage('');
      setSuccess('Announcement sent successfully!');
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />

      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1">Send announcements to all parents in your school (They will receive an SMS notification!).</p>
        </header>

        {/* Compose */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
              )}
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Write your announcement here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={sending} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Announcement History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
            ) : announcements.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No announcements sent yet.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-800">{ann.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(ann.created_at).toLocaleString()}
                      {ann.creator?.name && ` · by ${ann.creator.name}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
