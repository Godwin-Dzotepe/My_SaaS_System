'use client';

import * as React from 'react';
import {
  Loader2,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function ParentEventsPage() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      } catch (e) {}
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[#212529]">School Calendar & Events</h1>
          <p className="text-[#646464] text-sm">Stay informed about upcoming school activities and important dates.</p>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : events.length === 0 ? (
          <Card className="p-20 text-center text-gray-500">
             <Calendar className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p>No upcoming events scheduled.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <Card key={event.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-blue-600 text-white p-6 flex flex-col items-center justify-center min-w-[120px]">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                        {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-4xl font-bold">
                        {new Date(event.start_date).getDate()}
                      </span>
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                          Upcoming
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{event.description || 'No description available for this event.'}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          School Campus
                        </div>
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
