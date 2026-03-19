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
  Users
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
