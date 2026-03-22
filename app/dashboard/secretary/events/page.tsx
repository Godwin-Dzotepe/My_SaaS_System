'use client';

import * as React from 'react';
import {
  PlusCircle,
  Trash2,
  Loader2,
  XCircle,
  School,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function SecretaryEventsPage() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [userName, setUserName] = React.useState('Secretary');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(meData => {
      if (meData.user) setUserName(meData.user.name);
    }).catch(e => {});
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) return;
      const user = meData.user;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, school_id: user.school_id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setSuccess('Event created successfully!');
      setFormData({ title: '', description: '', start_date: '', end_date: '' });
      setShowAddModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(events.filter(e => e.id !== id));
      }
    } catch (err) {}
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Events</h1>
            <p className="text-gray-500">Manage school calendar and activities.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="w-4 h-4" /> Add New Event
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
          ) : events.length === 0 ? (
            <Card className="p-20 text-center text-gray-500">
               No events found. Start by adding one.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                  <div className="h-2 w-full bg-blue-600"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">{new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description || 'No description'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                       <span>Starts: {new Date(event.start_date).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95">
            <CardHeader className="bg-blue-600 text-white flex flex-row items-center justify-between">
              <CardTitle>Add New Event</CardTitle>
              <button onClick={() => setShowAddModal(false)}><XCircle className="w-6 h-6" /></button>
            </CardHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Event Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Sports Day" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief details about the event" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start Date & Time</label>
                  <Input required type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">End Date & Time</label>
                  <Input required type="datetime-local" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Create Event</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
