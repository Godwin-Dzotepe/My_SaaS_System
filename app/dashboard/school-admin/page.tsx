'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  School, 
  CreditCard, 
  Plus,
  Upload,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Calendar,
  Loader
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { formatGhanaCedis } from '@/lib/currency';

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

export default function SchoolAdminDashboard() {
  const [userName, setUserName] = React.useState('Admin User');
  const [stats, setStats] = React.useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0
  });
  const [recentStudents, setRecentStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(true);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [aiError, setAiError] = React.useState('');

  const enrollmentData = [
    { name: 'Mon', students: stats.totalStudents * 0.15, teachers: stats.totalTeachers * 0.18 },
    { name: 'Tue', students: stats.totalStudents * 0.18, teachers: stats.totalTeachers * 0.22 },
    { name: 'Wed', students: stats.totalStudents * 0.20, teachers: stats.totalTeachers * 0.20 },
    { name: 'Thu', students: stats.totalStudents * 0.16, teachers: stats.totalTeachers * 0.26 },
    { name: 'Fri', students: stats.totalStudents * 0.22, teachers: stats.totalTeachers * 0.23 },
    { name: 'Sat', students: stats.totalStudents * 0.12, teachers: stats.totalTeachers * 0.18 },
    { name: 'Sun', students: stats.totalStudents * 0.09, teachers: stats.totalTeachers * 0.15 },
  ];

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
  }, []);

  React.useEffect(() => {
    const fetchAiOverview = async () => {
      try {
        setAiLoading(true);
        const response = await fetch('/api/dashboard/ai/overview');
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setAiEnabled(false);
          setAiError(data?.error || 'Unable to load AI status.');
          return;
        }

        setAiEnabled(Boolean(data?.aiEnabled));
        setAiError('');
      } catch (err) {
        console.error('Error fetching AI overview:', err);
        setAiEnabled(false);
        setAiError('Unable to load AI status.');
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiOverview();
  }, []);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null); throw new Error(`Failed to fetch stats: ${errorData?.error || response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data.stats);
        setRecentStudents(data.recentStudents);
        setError('');
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-xl font-bold text-[#212529]">Admin Dashboard</h1>
              <nav className="flex text-xs text-[#646464] mt-1 gap-1">
                <span className="hover:text-[#3f7afc] cursor-pointer">Home</span>
                <span>/</span>
                <span className="text-[#3f7afc]">Admin</span>
              </nav>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/school-admin/students/new">
                <Button className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] transition-all">
                  <Plus className="w-4 h-4" />
                  Add Student
                </Button>
              </Link>
              <Button variant="outline" className="gap-2 border-gray-200 text-[#646464]">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </motion.div>

          {error && (
            <motion.div 
              variants={itemVariants}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {!aiLoading && aiError ? (
            <motion.div
              variants={itemVariants}
              className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg"
            >
              {aiError}
            </motion.div>
          ) : null}

          {/* Stats Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e1f1ff] flex items-center justify-center text-[#3f7afc] group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Students</p>
                    <h3 className="text-2xl font-bold text-[#212529]">
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : stats.totalStudents}
                    </h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#fff2d8] flex items-center justify-center text-[#ffa001] group-hover:bg-[#ffa001] group-hover:text-white transition-colors">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Teachers</p>
                    <h3 className="text-2xl font-bold text-[#212529]">
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : stats.totalTeachers}
                    </h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ffeaea] flex items-center justify-center text-[#ff0000] group-hover:bg-[#ff0000] group-hover:text-white transition-colors">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Classes</p>
                    <h3 className="text-2xl font-bold text-[#212529]">
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : stats.totalClasses}
                    </h3>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-shadow">
               <div className="flex items-center p-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#e7ffdf] flex items-center justify-center text-[#1d9d00] group-hover:bg-[#1d9d00] group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">Revenue</p>
                    <h3 className="text-2xl font-bold text-[#212529]">
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : formatGhanaCedis(stats.totalRevenue)}
                    </h3>
                  </div>
               </div>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">Student Growth</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={enrollmentData}>
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3f7afc" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3f7afc" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#646464', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#646464', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="students" stroke="#3f7afc" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">Daily Attendance</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={enrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#646464', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#646464', fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f8f9fb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="students" fill="#3f7afc" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="teachers" fill="#ffa001" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">New Students</CardTitle>
                  <Link href="/dashboard/school-admin/students" className="text-sm font-bold text-[#3f7afc] hover:underline">
                    View All
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f8f9fb]">
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Student</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Class</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Roll No</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Status</th>
                          <th className="text-right py-4 px-6 text-xs font-bold text-[#646464] uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[#646464]">
                              <Loader className="w-5 h-5 animate-spin inline-block" />
                            </td>
                          </tr>
                        ) : recentStudents.length > 0 ? (
                          recentStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-[#f8f9fb] transition-colors group">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#3f7afc] font-bold text-sm border border-gray-100 group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                                    {student.avatar}
                                  </div>
                                  <span className="font-bold text-[#212529]">{student.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-[#646464] font-medium">{student.class}</td>
                              <td className="py-4 px-6 text-[#646464] font-medium">#{student.roll}</td>
                              <td className="py-4 px-6">
                                <Badge className={student.status === 'active' ? 'bg-[#e7ffdf] text-[#1d9d00] border-none' : 'bg-[#ffeaea] text-[#ff0000] border-none'}>
                                  {student.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button variant="ghost" size="icon" className="hover:bg-[#e1f1ff] hover:text-[#3f7afc]">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[#646464]">
                              No students found
                            </td>  
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Link href="/dashboard/school-admin/messaging" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#3f7afc]/10 bg-[#e1f1ff]/30 text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white border-none transition-all py-6">
                         <MessageSquare className="w-5 h-5" />
                         Send Announcement
                      </Button>
                    </Link>
                    <Link href="/dashboard/school-admin/students/upload" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#ffa001]/10 bg-[#fff2d8]/30 text-[#ffa001] hover:bg-[#ffa001] hover:text-white border-none transition-all py-6">
                         <Upload className="w-5 h-5" />
                         Bulk Student Upload
                      </Button>
                    </Link>
                    <Link href="/dashboard/school-admin/grading" className="block">
                      <Button variant="outline" className="w-full justify-start gap-3 border-[#ff0000]/10 bg-[#ffeaea]/30 text-[#ff0000] hover:bg-[#ff0000] hover:text-white border-none transition-all py-6">
                         <Settings className="w-5 h-5" />
                         Configure System
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[#3f7afc] to-[#2d6ae0] text-white">
                <CardContent className="p-6">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white border-none uppercase text-[10px]">Upcoming</Badge>
                   </div>
                   <h4 className="font-bold text-lg leading-tight">Staff Meeting Tomorrow</h4>
                   <p className="text-blue-100 text-xs mt-1">10:00 AM  Main Conference Hall</p>
                   <Button variant="outline" className="w-full mt-4 bg-white/10 text-white border-none hover:bg-white/20 text-xs">
                     View Calendar
                   </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}



