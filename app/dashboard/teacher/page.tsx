'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Users,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { CalendarWidget } from '@/components/dashboard/calendar-widget';        
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardAlertBanner, useDashboardAlertBanner } from '@/components/dashboard/dashboard-alert-banner';
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
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
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
  
  // Teacher Attendance State
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [canMarkAttendance, setCanMarkAttendance] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | null>(null);
  const [attendanceWindowLabel, setAttendanceWindowLabel] = useState('6:00 AM - 8:30 AM (Ghana time)');
  const { banner, dismissBanner } = useDashboardAlertBanner('teacher');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch existing dashboard data
        const response = await fetch('/api/teacher/dashboard');
        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {    
          result = await response.json();
        } else {
          throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
          throw new Error(result.error || 'Error');
        }
        setData(result);
        if (result.error) setError(result.error);

        // Fetch my attendance status
        const attResp = await fetch('/api/teacher/my-attendance');
        if (attResp.ok) {
          const attData = await attResp.json();
          setAttendanceMarked(attData.isMarkedToday);
          setAttendanceStatus(attData.status || null);
          setCanMarkAttendance(Boolean(attData.canMarkPresent));
          if (attData.markWindow) {
            setAttendanceWindowLabel(attData.markWindow);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleMarkAttendance = async () => {
    try {
      setIsMarkingAttendance(true);
      const res = await fetch('/api/teacher/my-attendance', {
        method: 'POST',
      });
      const resData = await res.json().catch(() => null);
      if (!res.ok) throw new Error(resData.error || "Failed to mark attendance");
      
      setAttendanceMarked(true);
      setAttendanceStatus('present');
      setCanMarkAttendance(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      <DashboardAlertBanner banner={banner} onClose={dismissBanner} />
      <motion.div
        className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <header>
            <h1 className="text-3xl font-bold text-[#212529] tracking-tight">Teacher Dashboard</h1>
            <p className="text-[#646464] text-sm mt-1">
              {loading ? 'Loading class info...' : data?.className ? data.className + ' - ' + data.stats.students + ' students' : 'No class assigned'}
            </p>
          </header>

          {/* Animated Teacher Attendance Button */}
          <div>
            {!loading && (
              <motion.div 
                whileHover={!attendanceMarked ? { scale: 1.05 } : {}}
                whileTap={!attendanceMarked ? { scale: 0.95 } : {}}
              >
                <Button 
                  onClick={handleMarkAttendance}
                  disabled={attendanceMarked || isMarkingAttendance || !canMarkAttendance}
                  className={'relative overflow-hidden shadow-lg transition-all duration-300 px-6 py-6 rounded-xl font-semibold text-lg flex items-center gap-3 ' + (attendanceMarked ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white cursor-not-allowed opacity-90' : 'bg-gradient-to-r from-blue-600 to-[#3f7afc] hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-blue-500/25')}
                >
                    {isMarkingAttendance ? (
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Marking...
                        </div>
                    ) : attendanceMarked ? (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="flex items-center gap-2"
                        >
                            <UserCheck className="w-6 h-6" />
                            {attendanceStatus === 'absent' ? 'Marked Absent' : 'Attendance Marked'}
                        </motion.div>
                    ) : !canMarkAttendance ? (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Mark Present Closed
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Mark Present
                        </div>
                    )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
        {!loading && !attendanceMarked && !canMarkAttendance ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Teacher attendance can only be marked present between {attendanceWindowLabel}.
          </div>
        ) : null}

        {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative shadow-sm">
               {error}. Please contact admin if this is unexpected.
            </div>
        )}

        {/* Call to Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
           <Link href="/dashboard/teacher/attendance">
              <Button className="bg-[#3f7afc] hover:bg-[#2d6ae0] text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">Mark Student Attendance</Button>
           </Link>
           <Link href="/dashboard/teacher/scoring">
              <Button variant="outline" className="border-[#3f7afc] text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">Record Scores</Button>
           </Link>
           <Link href="/dashboard/teacher/scores">
              <Button variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">View Scores</Button>
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
              iconBg="bg-emerald-500"
              description="Student Attendance marked today"
            />
            <DashboardCard
              title="Assignments Due"
              value={loading ? '...' : data?.stats.assignmentsDue.toString() || '0'}
              icon={<FileText className="w-6 h-6 text-white" />}
              iconBg="bg-amber-500"
              description="Upcoming deadlines"
            />
        </motion.div>

          {/* Main Content */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 group rounded-xl">
              <div className="h-2 w-full bg-gradient-to-r from-[#3f7afc] to-blue-400"></div>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">Recent Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f7afc]"></div>
                    </div>
                  ) : data?.recentStudents.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">No students found</p>
                  ) : (
                    data?.recentStudents.map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3f7afc] to-blue-500 flex items-center justify-center text-white font-bold shadow-inner">
                             {student.name.split(' ').map((n: any) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">Parent: <span className="font-medium text-gray-700">{student.parent_phone}</span></p>
                          </div>
                        </div>
                        <Link href="/dashboard/teacher/class">
                           <Button variant="ghost" size="sm" className="text-[#3f7afc] hover:bg-blue-50 rounded-lg font-medium">View</Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 rounded-xl bg-white shadow-sm border-none overflow-hidden">
               <CalendarWidget />
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
