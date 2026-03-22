'use client';

import * as React from 'react';
import {
  Loader2,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import Link from 'next/link';



export default function ParentAttendancePage() {
  const [children, setChildren] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchChildren = async () => {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) return;
      const user = meData.user;
      setUserName(user.name);

      try {
        const res = await fetch(`/api/parent/children?phone=${user.phone}`);
        const data = await res.json();
        if (Array.isArray(data)) setChildren(data);
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[#212529]">Attendance Summary</h1>
          <p className="text-[#646464] text-sm">Monitor your children&apos;s daily presence and punctuality.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : children.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
             No attendance data found.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {children.map((child) => (
              <Card key={child.id} className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{child.name}</h3>
                        <p className="text-sm text-gray-500">{child.class?.class_name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 md:flex-none">
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-[10px] font-bold text-green-700 uppercase">Attendance</p>
                        <p className="text-xl font-bold text-green-700">95%</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-[10px] font-bold text-blue-700 uppercase">Status</p>
                        <Badge variant="success" className="mt-1">Present Today</Badge>
                      </div>
                      <div className="hidden sm:block">
                        <Link href={`/dashboard/parent/children/${child.id}/attendance`}>
                            <Button variant="outline" className="h-full w-full gap-2 border-blue-600 text-blue-600">
                                View Details <TrendingUp className="w-4 h-4" />
                            </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:hidden">
                    <Link href={`/dashboard/parent/children/${child.id}/attendance`}>
                        <Button variant="outline" className="w-full gap-2 border-blue-600 text-blue-600">
                            View Details <TrendingUp className="w-4 h-4" />
                        </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#ffa001]" />
                        Recent Absences
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center py-6 text-gray-400 text-sm italic">No recent absences recorded.</p>
                </CardContent>
            </Card>
            <Card className="bg-[#3f7afc] text-white border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-white text-sm font-bold">Attendance Policy</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-blue-50 leading-relaxed">
                        Students are required to maintain at least 85% attendance for each term. Please contact the school office if your child will be absent.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
