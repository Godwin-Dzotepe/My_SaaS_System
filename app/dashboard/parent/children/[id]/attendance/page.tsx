'use client';

import * as React from 'react';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';



export default function ChildAttendancePage() {
  const params = useParams();
  const id = params.id;
  const [child, setChild] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchChildDetails = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setUserName(user.name);

      try {
        const res = await fetch(`/api/parent/children?phone=${user.phone}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            const found = data.find(c => c.id === id);
            setChild(found);
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    fetchChildDetails();
  }, [id]);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={PARENT_SIDEBAR_ITEMS} userRole="parent" userName={userName} />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <header className="flex items-center gap-4">
          <Link href="/dashboard/parent/children">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white">
                <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#212529]">Attendance Record</h1>
            <p className="text-[#646464] text-sm">Detailed history for {child?.name || 'your child'}.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : !child ? (
          <Card className="p-10 text-center text-gray-500">
             Child information not found.
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-none shadow-sm text-center p-6">
                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Total Days</p>
                    <h3 className="text-3xl font-bold">45</h3>
                </Card>
                <Card className="bg-white border-none shadow-sm text-center p-6">
                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Present</p>
                    <h3 className="text-3xl font-bold text-green-600">42</h3>
                </Card>
                <Card className="bg-white border-none shadow-sm text-center p-6">
                    <p className="text-sm font-bold text-gray-400 uppercase mb-2">Absent</p>
                    <h3 className="text-3xl font-bold text-red-600">03</h3>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                    <CardTitle>March 2024</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Day</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    { date: 'Mar 12, 2024', day: 'Tuesday', status: 'present' },
                                    { date: 'Mar 11, 2024', day: 'Monday', status: 'present' },
                                    { date: 'Mar 08, 2024', day: 'Friday', status: 'absent' },
                                    { date: 'Mar 07, 2024', day: 'Thursday', status: 'present' },
                                    { date: 'Mar 06, 2024', day: 'Wednesday', status: 'present' },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{row.date}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.day}</td>
                                        <td className="px-6 py-4 flex justify-center">
                                            {row.status === 'present' ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Present
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Absent
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs italic">
                                            {row.status === 'present' ? '-' : 'Sick Leave'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
