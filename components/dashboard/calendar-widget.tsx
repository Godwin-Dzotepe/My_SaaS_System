'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CalendarWidget() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [userRole, setUserRole] = React.useState('parent');

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) setUserRole(user.role);
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

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const hasEvent = (day: number) => {
    return events.some(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="p-4 border-b border-gray-50 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          School Calendar
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-xs font-bold min-w-[100px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={`header-${i}`} className="text-[10px] font-bold text-gray-400">{day}</span>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate() && 
                                currentDate.getMonth() === new Date().getMonth() && 
                                currentDate.getFullYear() === new Date().getFullYear();
                const eventDay = hasEvent(day);
                
                return (
                  <div 
                    key={day} 
                    className={`h-8 flex items-center justify-center text-xs rounded-lg relative cursor-default ${
                      isToday ? 'bg-blue-600 text-white font-bold' : 
                      eventDay ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600'
                    }`}
                  >
                    {day}
                    {eventDay && !isToday && (
                      <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-2 mt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upcoming Events</p>
                {events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 3).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No upcoming events.</p>
                ) : (
                    events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 3).map(event => (
                        <div key={event.id} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-blue-600 uppercase">
                                    {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                                </span>
                                <span className="text-sm font-bold text-blue-900 leading-none">
                                    {new Date(event.start_date).getDate()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{event.title}</p>
                                <p className="text-[10px] text-gray-500 truncate">{event.description || 'No description'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Link href={`/dashboard/${userRole}/events`} className="block w-full">
                <Button variant="outline" className="w-full text-xs h-8 border-dashed">View All Events</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
