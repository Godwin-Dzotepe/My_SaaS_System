'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { CalendarWidget } from '@/components/dashboard/calendar-widget';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/dashboard-card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

interface DashboardData {
  className?: string;
  stats: {
    students: number;
    presentToday: number;
    assignmentsDue: number;
  };
  recentStudents: any[];
  error?: string;
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/teacher/dashboard');
        
        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          result = await response.json();
        } else {
          throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
        }
        setData(result);
        if (result.error) setError(result.error);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      
      <motion.div 
        className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
        >
          <header>
            <h1 className="text-2xl font-bold text-[#212529]">Teacher Dashboard</h1>
            <p className="text-[#646464] text-sm">
              {loading ? 'Loading class info...' : data?.className ? `${data.className} • ${data.stats.students} students` : 'No class assigned'}
            </p>
          </header>
        </motion.div>
        
        {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
               {error}. Please contact admin if this is unexpected.
            </div>
          )}

        {/* Call to Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4">
           <Link href="/dashboard/teacher/attendance">
              <Button className="bg-[#3f7afc] hover:bg-[#2d6ae0] text-white">Mark Attendance</Button>
           </Link>
           <Link href="/dashboard/teacher/scores">
              <Button variant="outline" className="border-[#3f7afc] text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white">Record Scores</Button>
           </Link>
        </motion.div>


          {/* Stats */}
        <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            <DashboardCard
              title="Total Students"
              value={loading ? '...' : data?.stats.students.toString() || '0'}
              icon={<Users className="w-6 h-6 text-white" />}
              iconBg="bg-blue-500"
              description="In your assigned class"
            />
            <DashboardCard
              title="Present Today"
              value={loading ? '...' : data?.stats.presentToday.toString() || '0'}
              icon={<CheckCircle2 className="w-6 h-6 text-white" />}
              iconBg="bg-green-500"
              description="Attendance marked today"
            />
            <DashboardCard
              title="Assignments Due"
              value={loading ? '...' : data?.stats.assignmentsDue.toString() || '0'}
              icon={<FileText className="w-6 h-6 text-white" />}
              iconBg="bg-yellow-500"
              description="Upcoming deadlines"
            />
        </motion.div>


          {/* Main Content */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all group">
              <div className="h-2 w-full bg-[#3f7afc]"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Recent Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-center py-4 text-gray-500">Loading students...</p>
                  ) : data?.recentStudents.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No students found</p>
                  ) : (
                    data?.recentStudents.map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3f7afc] flex items-center justify-center text-white font-medium">
                            {student.name.split(' ').map((n: any) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">Parent: {student.parent_phone}</p>
                          </div>
                        </div>
                        <Link href="/dashboard/teacher/class">
                           <Button variant="ghost" size="sm" className="text-[#3f7afc] hover:bg-blue-100">View</Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <CalendarWidget />
        </motion.div>
      </motion.div>
    </div>
  );
}
