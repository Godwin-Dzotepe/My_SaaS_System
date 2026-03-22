'use client';

import React, { useEffect, useState } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Phone,
  Eye,
  ArrowLeft,
  Loader2,
  Users,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  parent_phone: string | null;
  status: string;
  class: { id: string; class_name: string };
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/students/list', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch students.');
      }

      setStudents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Error fetching students:', fetchError);
      setStudents([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete student');
      }

      await fetchStudents();
    } catch (deleteError) {
      console.error('Error deleting student:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete student.');
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchMatches =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.parent_phone || '').includes(searchTerm) ||
      student.class.class_name.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatches =
      statusFilter === 'all' || student.status.toLowerCase() === statusFilter.toLowerCase();

    return searchMatches && statusMatches;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div className="flex-1 lg:ml-64" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="space-y-6 p-4 lg:p-8">
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard/school-admin">
                <Button variant="ghost" size="sm" className="w-fit gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
                <p className="text-gray-600">Manage all students enrolled in the school</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/dashboard/school-admin/students/upload" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  Bulk Upload
                </Button>
              </Link>
              <Link href="/dashboard/school-admin/students/new" className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, parent phone or class..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:w-auto">
              <select
                className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="outline" className="gap-2" onClick={fetchStudents}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {error ? (
            <motion.div variants={itemVariants}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{error}</p>
                  <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchStudents}>
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-500">Loading student directory...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-200" />
                    <p className="font-medium text-gray-500">No students found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or add a new student</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                {student.name
                                  .split(' ')
                                  .map((name) => name[0])
                                  .join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{student.name}</p>
                                <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-700">
                                  {student.class.class_name}
                                </Badge>
                              </div>
                            </div>
                            <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                              {student.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {student.parent_phone || 'No phone on file'}
                          </div>

                          <div className="flex justify-end">
                            <ActionMenu
                              entityId={student.id}
                              editPath="/dashboard/school-admin/students"
                              onDelete={handleDeleteStudent}
                              actions={[
                                {
                                  label: 'View',
                                  onClick: () => router.push(`/dashboard/school-admin/students/view/${student.id}`),
                                  icon: <Eye size={16} />,
                                },
                              ]}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Student Name
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Class
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Parent Contact
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Status
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, idx) => (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                    {student.name
                                      .split(' ')
                                      .map((name) => name[0])
                                      .join('')}
                                  </div>
                                  <span className="font-semibold text-gray-900">{student.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {student.class.class_name}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  {student.parent_phone || 'No phone on file'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                                  {student.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <ActionMenu
                                  entityId={student.id}
                                  editPath="/dashboard/school-admin/students"
                                  onDelete={handleDeleteStudent}
                                  actions={[
                                    {
                                      label: 'View',
                                      onClick: () => router.push(`/dashboard/school-admin/students/view/${student.id}`),
                                      icon: <Eye size={16} />,
                                    },
                                  ]}
                                />
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
