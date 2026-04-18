'use client';

import * as React from 'react';
import {
  School,
  Calendar,
  Bell,
  PlusCircle,
  Upload,
  ChevronRight,
  Clock,
  MessageSquare,
  UserPlus,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

interface RecentStudent {
  id: string;
  name: string;
  class: { class_name: string };
  created_at: string;
  status: string;
}

interface Stats {
  students: number;
  classes: number;
  notifications: number;
  todayAttendancePct: number | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function SecretaryDashboard() {
  const [userName, setUserName] = React.useState('Secretary');
  const [stats, setStats] = React.useState<Stats>({ students: 0, classes: 0, notifications: 0, todayAttendancePct: null });
  const [recentStudents, setRecentStudents] = React.useState<RecentStudent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.name) setUserName(d.user.name); }).catch(() => {});
  }, []);

  React.useEffect(() => {
    async function load() {
      try {
        const [studentsRes, classesRes, notifsRes] = await Promise.all([
          fetch('/api/students/list', { credentials: 'include' }),
          fetch('/api/classes', { credentials: 'include' }),
          fetch('/api/notifications', { credentials: 'include' }),
        ]);

        const [studentsData, classesData, notifsData] = await Promise.all([
          studentsRes.json().catch(() => []),
          classesRes.json().catch(() => []),
          notifsRes.json().catch(() => []),
        ]);

        const students: RecentStudent[] = Array.isArray(studentsData)
          ? studentsData
          : (studentsData?.students ?? []);
        const classes = Array.isArray(classesData) ? classesData : [];
        const notifs = Array.isArray(notifsData) ? notifsData : [];

        setStats({
          students: students.length,
          classes: classes.length,
          notifications: notifs.filter((n: { is_read?: boolean }) => !n.is_read).length,
          todayAttendancePct: null,
        });

        setRecentStudents(
          [...students]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      } catch {
        // silently ignore, show zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    {
      label: 'Students',
      value: loading ? '—' : stats.students.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      bg: 'bg-[#e1f1ff]', color: 'text-[#3f7afc]', hoverBg: 'group-hover:bg-[#3f7afc]',
    },
    {
      label: 'Attendance Today',
      value: loading ? '—' : stats.todayAttendancePct !== null ? `${stats.todayAttendancePct}%` : '—',
      icon: <Calendar className="w-6 h-6" />,
      bg: 'bg-[#fff2d8]', color: 'text-[#ffa001]', hoverBg: 'group-hover:bg-[#ffa001]',
    },
    {
      label: 'Classes',
      value: loading ? '—' : stats.classes.toLocaleString(),
      icon: <School className="w-6 h-6" />,
      bg: 'bg-[#e7ffdf]', color: 'text-[#1d9d00]', hoverBg: 'group-hover:bg-[#1d9d00]',
    },
    {
      label: 'Unread Alerts',
      value: loading ? '—' : stats.notifications.toLocaleString(),
      icon: <Bell className="w-6 h-6" />,
      bg: 'bg-[#ffeaea]', color: 'text-[#ff0000]', hoverBg: 'group-hover:bg-[#ff0000]',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName={userName} />

      <motion.div className="flex-1 lg:ml-64" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">

          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-xl font-bold text-[#212529]">Secretary Dashboard</h1>
              <p className="text-xs text-[#646464] mt-1">Welcome back, {userName}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/secretary/students/new">
                <Button className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0]">
                  <PlusCircle className="w-4 h-4" /> Add Student
                </Button>
              </Link>
              <Link href="/dashboard/secretary/students/upload">
                <Button variant="outline" className="gap-2 border-gray-200 text-[#646464]">
                  <Upload className="w-4 h-4" /> Bulk Upload
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(card => (
              <Card key={card.label} className="border-none shadow-sm bg-white group hover:shadow-md transition-shadow">
                <div className="flex items-center p-6 gap-4">
                  <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center ${card.color} ${card.hoverBg} group-hover:text-white transition-colors`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#646464] uppercase tracking-wider">{card.label}</p>
                    {loading
                      ? <Loader2 className="w-5 h-5 mt-1 animate-spin text-gray-300" />
                      : <h3 className="text-2xl font-bold text-[#212529]">{card.value}</h3>
                    }
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent students */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4 px-6">
                  <CardTitle className="text-lg font-bold text-[#212529]">Recently Enrolled Students</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    </div>
                  ) : recentStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No students yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {recentStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-4 px-6 hover:bg-[#f8f9fb] transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#3f7afc] font-bold text-sm border border-gray-100 group-hover:bg-[#3f7afc] group-hover:text-white transition-colors">
                              {initials(student.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#212529]">{student.name}</p>
                              <p className="text-xs text-[#646464]">{student.class?.class_name ?? 'No class'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={student.status === 'active' ? 'success' : 'secondary'} className="text-[10px]">
                              {student.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-[#646464]">
                              <Clock className="w-3 h-3 text-[#ffa001]" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">{timeAgo(student.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 bg-gray-50/50 text-center">
                    <Link href="/dashboard/secretary/students">
                      <Button variant="ghost" size="sm" className="text-[#3f7afc] font-bold hover:bg-[#e1f1ff]">
                        View All Students <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick access */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-bold text-[#212529]">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Link href="/dashboard/secretary/attendance" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-none bg-[#e1f1ff]/30 text-[#3f7afc] hover:bg-[#3f7afc] hover:text-white transition-all py-6">
                      <Calendar className="w-5 h-5" /> Take Daily Attendance
                    </Button>
                  </Link>
                  <Link href="/dashboard/secretary/announcements" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-none bg-[#fff2d8]/30 text-[#ffa001] hover:bg-[#ffa001] hover:text-white transition-all py-6">
                      <MessageSquare className="w-5 h-5" /> Send Announcement
                    </Button>
                  </Link>
                  <Link href="/dashboard/secretary/students/new" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-none bg-[#e7ffdf]/30 text-[#1d9d00] hover:bg-[#1d9d00] hover:text-white transition-all py-6">
                      <UserPlus className="w-5 h-5" /> Register New Student
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[#3f7afc] to-[#2d6ae0] text-white overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="relative z-10">
                    <h4 className="text-white font-bold text-lg mb-2">Help Center</h4>
                    <p className="text-blue-100 text-xs mb-4 leading-relaxed">Need help managing student records or school data?</p>
                    <Button className="w-full bg-white text-[#3f7afc] hover:bg-blue-50 font-bold text-xs py-5 shadow-lg">
                      Contact Administrator
                    </Button>
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
