'use client';

import * as React from 'react';
import {
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PARENT_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import Link from 'next/link';



export default function ParentResultsPage() {
  const [children, setChildren] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userName, setUserName] = React.useState('Parent');

  React.useEffect(() => {
    const fetchChildren = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
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
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#212529]">Academic Results</h1>
            <p className="text-[#646464] text-sm">View and download your children&apos;s terminal reports.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : children.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
             No student results found.
          </Card>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <Card key={child.id} className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-xs text-gray-500">{child.class?.class_name}</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/parent/children/${child.id}/results`}>
                        <Button variant="outline" size="sm" className="gap-2 border-blue-600 text-blue-600">
                           Full Report <FileText className="w-4 h-4" />
                        </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#fcfdfe] text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left">Subject</th>
                          <th className="px-6 py-3 text-left">Score</th>
                          <th className="px-6 py-3 text-left">Grade</th>
                          <th className="px-6 py-3 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {child.scores && child.scores.length > 0 ? (
                            child.scores.map((score: any) => (
                                <tr key={score.id}>
                                    <td className="px-6 py-4 font-medium">{score.subject_name || 'Subject'}</td>
                                    <td className="px-6 py-4">{score.score}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={score.score >= 80 ? 'success' : score.score >= 50 ? 'secondary' : 'destructive'}>
                                            {score.score >= 80 ? 'A' : score.score >= 70 ? 'B' : score.score >= 60 ? 'C' : score.score >= 50 ? 'D' : 'F'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 italic">
                                        {score.score >= 80 ? 'Excellent' : score.score >= 50 ? 'Keep it up' : 'Needs improvement'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                    No recent scores available for this student.
                                </td>
                            </tr>
                        )}
                      </tbody>
                    </table>
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
