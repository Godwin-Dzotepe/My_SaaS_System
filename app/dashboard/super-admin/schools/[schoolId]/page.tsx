'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Users,
  GraduationCap,
  Phone,
  Mail,
  ArrowLeft,
  Loader
} from 'lucide-react';

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [school, setSchool] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const response = await fetch(
        `/api/super-admin/schools/${schoolId}?${params.toString()}`
      );

      if (response.status === 401) {
        window.location.href = '/auth/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch school data');
      }

      const data = await response.json();
      setSchool(data.school);
      setUsers(data.users);
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching school data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchoolData();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [schoolId, searchQuery, roleFilter]);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      school_admin: 'bg-blue-100 text-blue-800',
      teacher: 'bg-green-100 text-green-800',
      secretary: 'bg-yellow-100 text-yellow-800',
      finance_admin: 'bg-red-100 text-red-800',
      parent: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        items={SUPER_ADMIN_SIDEBAR_ITEMS}
        userRole="super-admin"
        userName="System Administrator"
      />

      <motion.div
        className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header with Back Button */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/super-admin/schools">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading...' : school?.school_name}
            </h1>
            <p className="text-gray-600">{school?.address}</p>
          </div>
        </motion.div>

        {/* School Info Cards */}
        {school && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <h3 className="text-2xl font-bold text-gray-900">{users.length}</h3>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <h3 className="text-2xl font-bold text-gray-900">{students.length}</h3>
                  </div>
                  <GraduationCap className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{school?.phone}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search and Filter */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="parent">Parents</option>
                <option value="teacher">Teachers</option>
                <option value="school_admin">Admins</option>
                <option value="secretary">Secretaries</option>
                <option value="finance_admin">Finance Admins</option>
              </select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs: Users and Students */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Users Table */}
          <Card className="bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-bold text-gray-900">
                Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {user.email}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${getRoleBadgeColor(user.role)} border-none`}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-600">No users found</div>
              )}
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-bold text-gray-900">
                Students ({students.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Student #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Parent Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.student_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.class?.class_name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div>
                              <p>{student.parent_name || '-'}</p>
                              {student.parent_relation && (
                                <p className="text-xs text-gray-500">
                                  ({student.parent_relation})
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.parent_phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {student.parent_phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-600">No students found</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
