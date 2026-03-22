'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Eye,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  GraduationCap,
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

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  classes: { id: string; class_name: string }[];
  subjects: { id: string; subject_name: string }[];
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

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/teachers', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch teachers.');
      }

      setTeachers(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Error fetching teachers:', fetchError);
      setTeachers([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete teacher');
      }

      await fetchTeachers();
    } catch (deleteError) {
      console.error('Error deleting teacher:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete teacher.');
    }
  };

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          teachers.flatMap((teacher) =>
            teacher.subjects.map((subject) => subject.subject_name).filter(Boolean)
          )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [teachers]
  );

  const filteredTeachers = teachers.filter((teacher) => {
    const searchMatches =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.includes(searchTerm);

    const subjectMatches =
      subjectFilter === 'all' ||
      teacher.subjects.some((subject) => subject.subject_name === subjectFilter);

    return searchMatches && subjectMatches;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
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
                <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
                <p className="text-gray-600">View and manage school teachers</p>
              </div>
            </div>
            <Link href="/dashboard/school-admin/teachers/new" className="w-full md:w-auto">
              <Button className="w-full gap-2 md:w-auto">
                <Plus className="h-4 w-4" />
                Add New Teacher
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 lg:w-64"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </motion.div>

          {error ? (
            <motion.div variants={itemVariants}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{error}</p>
                  <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchTeachers}>
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
                    <p className="text-gray-500">Loading faculty members...</p>
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <GraduationCap className="h-12 w-12 text-gray-200" />
                    <p className="font-medium text-gray-500">No teachers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or add a new teacher</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                {teacher.name
                                  .split(' ')
                                  .map((name) => name[0])
                                  .join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{teacher.name}</p>
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Senior Teacher
                                </p>
                              </div>
                            </div>
                            <Badge variant="success" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {teacher.email || 'No email'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {teacher.phone}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Assigned Classes
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.classes.length > 0 ? (
                                teacher.classes.map((cls) => (
                                  <Badge key={cls.id} variant="secondary" className="bg-gray-100 text-gray-700">
                                    {cls.class_name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm italic text-gray-400">Unassigned</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subjects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.subjects.length > 0 ? (
                                teacher.subjects.map((subject) => (
                                  <Badge key={subject.id} variant="outline">
                                    {subject.subject_name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm italic text-gray-400">No subject assigned</span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <ActionMenu
                              entityId={teacher.id}
                              editPath="/dashboard/school-admin/teachers"
                              onDelete={handleDeleteTeacher}
                              actions={[
                                {
                                  label: 'View',
                                  onClick: () => router.push(`/dashboard/school-admin/teachers/view/${teacher.id}`),
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
                              Teacher
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Assigned Classes
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
                          {filteredTeachers.map((teacher, idx) => (
                            <motion.tr
                              key={teacher.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                    {teacher.name
                                      .split(' ')
                                      .map((name) => name[0])
                                      .join('')}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{teacher.name}</p>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                      Senior Teacher
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    {teacher.email || 'No email'}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {teacher.phone}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {teacher.classes.length > 0 ? (
                                    teacher.classes.map((cls) => (
                                      <Badge key={cls.id} variant="secondary" className="bg-gray-100 text-gray-700">
                                        {cls.class_name}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm italic text-gray-400">Unassigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="success" className="bg-green-100 text-green-700">
                                  Active
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <ActionMenu
                                  entityId={teacher.id}
                                  editPath="/dashboard/school-admin/teachers"
                                  onDelete={handleDeleteTeacher}
                                  actions={[
                                    {
                                      label: 'View',
                                      onClick: () => router.push(`/dashboard/school-admin/teachers/view/${teacher.id}`),
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
