'use client';

import * as React from 'react';
import {
  Loader2,
  ChevronLeft,
  School
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';



export default function ChildResultsPage() {
  const params = useParams();
  const id = params.id;
  const [child, setChild] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchChildDetails = async () => {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) return;
      const user = meData.user;
      setUserName(user.name);

      try {
        // Reuse the children API but filter or create a specific one
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
            <h1 className="text-2xl font-bold text-[#212529]">Academic Report</h1>
            <p className="text-[#646464] text-sm">Detailed term performance report.</p>
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
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6 bg-gradient-to-br from-[#3f7afc] to-[#2d6ae0] text-white">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-3xl">
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{child.name}</h2>
                                <p className="text-blue-100 flex items-center gap-2 mt-1">
                                    <School className="w-4 h-4" /> {child.school?.school_name}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                                        {child.class?.class_name}
                                    </Badge>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                                        2024 Academic Year
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Average</p>
                                <p className="text-3xl font-bold">84.5%</p>
                            </div>
                            <div className="text-center border-l border-white/20 pl-6">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Position</p>
                                <p className="text-3xl font-bold">4th</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                    <CardTitle>Subject Performance</CardTitle>
                    <Badge variant="secondary">First Term Report</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 text-left">Subject</th>
                                    <th className="px-6 py-4 text-center">Class Score (30%)</th>
                                    <th className="px-6 py-4 text-center">Exam Score (70%)</th>
                                    <th className="px-6 py-4 text-center">Total (100%)</th>
                                    <th className="px-6 py-4 text-center">Grade</th>
                                    <th className="px-6 py-4 text-left">Teacher&apos;s Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {child.scores && child.scores.length > 0 ? (
                                    child.scores.map((score: any) => (
                                        <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{score.subject_name || 'Mathematics'}</td>
                                            <td className="px-6 py-4 text-center">25.5</td>
                                            <td className="px-6 py-4 text-center">58.0</td>
                                            <td className="px-6 py-4 text-center font-bold">{score.score}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className={score.score >= 80 ? 'bg-green-600' : 'bg-blue-600'}>
                                                    {score.score >= 80 ? 'A' : score.score >= 70 ? 'B' : 'C'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs italic">
                                                {score.score >= 80 ? 'Exceptional performance.' : 'Good work, can improve.'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                            No detailed performance records available for this term yet.
                                        </td>
                                    </tr>
                                )}
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
