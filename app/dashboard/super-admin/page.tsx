'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  School,
  CreditCard,
  Plus,
  Building2,
  ShieldCheck,
  MoreHorizontal,
  Users,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { motion } from 'framer-motion';

function DashboardCard({ title, value, icon, trend, color }: { title: string; value: number; icon: React.ReactNode; trend: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
    green: 'bg-green-50 border-green-100',
  };
  return (
    <Card className={`border ${colorMap[color] || 'bg-white'} shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
        </div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</h3>
        <p className="text-xs text-gray-400 mt-2">{trend}</p>
      </CardContent>
    </Card>
  );
}



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

export default function SuperAdminDashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [recentSchools, setRecentSchools] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiMessage, setAiMessage] = React.useState('');
  const [aiReports, setAiReports] = React.useState<any[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [clearingAll, setClearingAll] = React.useState(false);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/super-admin/stats');

        if (response.status === 401) {
          window.location.href = '/auth/login';
          return;
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          if (data.stats) {
            setStats(data.stats);
            setRecentSchools(data.recentSchools);
          }
        } else {
          const text = await response.text();
          console.error('Server returned non-JSON response:', response.status, text);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  React.useEffect(() => {
    async function fetchAiReports() {
      try {
        const response = await fetch('/api/super-admin/ai/report');
        if (!response.ok) return;

        const data = await response.json();
        setAiReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching AI reports:', error);
      }
    }

    fetchAiReports();
  }, []);

  const handleGenerateAiReport = async () => {
    setAiBusy(true);
    setAiMessage('');

    try {
      const response = await fetch('/api/super-admin/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'due' }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setAiMessage(data?.error || 'Failed to generate AI report.');
        return;
      }

      setAiMessage(data?.message || 'AI report run completed.');
      setAiReports(data?.reports || []);
    } catch (error) {
      console.error('AI report error:', error);
      setAiMessage('Unable to generate AI report right now.');
    } finally {
      setAiBusy(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/super-admin/ai/report?id=${id}`, { method: 'DELETE' });
      setAiReports(prev => prev.filter(r => r.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllReports = async () => {
    setClearingAll(true);
    try {
      await fetch('/api/super-admin/ai/report', { method: 'DELETE' });
      setAiReports([]);
      setAiMessage('');
    } catch {
      // ignore
    } finally {
      setClearingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
      
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
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Manage the entire school ecosystem</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateAiReport}
                disabled={aiBusy}
              >
                {aiBusy ? 'Running AI Reports...' : 'Run Due AI Reports'}
              </Button>
              <Link href="/dashboard/super-admin/schools/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add New School
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={itemVariants}>
              <DashboardCard
                title="Total Schools"
                value={stats?.totalSchools || 0}
                icon={<Building2 className="w-6 h-6 text-blue-600" />}
                trend="+2 this month"
                color="blue"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DashboardCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={<Users className="w-6 h-6 text-purple-600" />}
                trend="+150 this month"
                color="purple"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DashboardCard
                title="Total Teachers"
                value={stats?.totalTeachers || 0}
                icon={<GraduationCap className="w-6 h-6 text-orange-600" />}
                trend="+12 this month"
                color="orange"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DashboardCard
                title="System Users"
                value={stats?.totalUsers || 0}
                icon={<ShieldCheck className="w-6 h-6 text-green-600" />}
                trend="Active"
                color="green"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Schools */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recently Registered Schools</CardTitle>
                  <Link href="/dashboard/super-admin/schools" className="text-sm text-blue-600 hover:underline font-medium">
                    View All
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="px-4 py-3 font-medium text-gray-600">School Name</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Students</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Users</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Registered On</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentSchools.map((school) => (
                          <tr key={school.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">{school.name}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{school.students}</td>
                            <td className="px-4 py-3 text-gray-600">{school.teachers}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(school.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900">AI Report Center</CardTitle>
                  {aiReports.length > 0 && (
                    <button
                      onClick={handleClearAllReports}
                      disabled={clearingAll}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                      title="Mark all as read (clear all)"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {clearingAll ? 'Clearing...' : 'Mark all read'}
                    </button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Generates per-school prioritized reports for AI-enabled schools and sends Telegram updates.
                  </p>
                  {aiMessage ? (
                    <p className="text-sm font-medium text-gray-800">{aiMessage}</p>
                  ) : null}
                  <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    {aiReports.length > 0 ? (
                      aiReports.slice(0, 8).map((report) => (
                        <div key={report.id} className="group relative rounded-md border border-gray-200 bg-white p-2">
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            disabled={deletingId === report.id}
                            className="absolute right-1.5 top-1.5 rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                            title="Delete report"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <p className="font-semibold text-gray-900 pr-5">{report.schoolName}</p>
                          <p className="text-[11px] text-gray-500">
                            {new Date(report.createdAt).toLocaleString()} {report.sentToTelegram ? '• Telegram sent' : '• Telegram failed'}
                          </p>
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11px] text-gray-700">{report.reportBody}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-500">No AI reports yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100 text-green-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Database Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100 text-green-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Auth System Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100 text-green-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">API Endpoints Online</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Subscription Revenue</p>
                      <h3 className="text-2xl font-bold mt-1">$45,290</h3>
                      <p className="text-blue-200 text-xs mt-2">+12.5% from last month</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-200 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
