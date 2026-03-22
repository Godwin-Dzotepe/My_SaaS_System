'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

export default function AdminAttendanceView() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin User');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/attendance?date=' + date);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      <div className="flex-1 lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">School Attendance Overview</h1>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {loading ? (
            <p>Loading attendance data...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{c.class_name}</CardTitle>
                    <p className="text-sm text-gray-500">Teacher: {c.teacher}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>Total Students:</span>
                      <span className="font-semibold">{c.total_students}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-green-600">Present:</span>
                      <span className="font-semibold text-green-600">{c.present}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-red-600">Absent:</span>
                      <span className="font-semibold text-red-600">{c.absent}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Unmarked:</span>
                      <span className="font-semibold text-gray-500">{c.unmarked}</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: (c.total_students === 0 ? 0 : (c.present / c.total_students) * 100) + '%' }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {data.length === 0 && <p>No classes found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




