'use client';

import React, { useEffect, useState } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Users,
  User,
  ArrowLeft,
  Loader2,
  School,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Class {
  id: string;
  class_name: string;
  teacher: { id: string; name: string } | null;
  _count: {
    students: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/classes', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch classes.');
      }

      setClasses(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Error fetching classes:', fetchError);
      setClasses([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDeleteClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/classes?id=${classId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete class');
      }

      await fetchClasses();
    } catch (deleteError) {
      console.error('Error deleting class:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete class.');
    }
  };

  const filteredClasses = classes.filter(
    (schoolClass) =>
      schoolClass.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schoolClass.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div className="flex-1 lg:ml-64" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
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
                <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
                <p className="text-gray-600">Overview of all active school classes</p>
              </div>
            </div>
            <Link href="/dashboard/school-admin/classes/new" className="w-full md:w-auto">
              <Button className="w-full gap-2 md:w-auto">
                <Plus className="h-4 w-4" />
                Create New Class
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by class name or class teacher..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 lg:w-auto" onClick={fetchClasses}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </motion.div>

          {error ? (
            <motion.div variants={itemVariants}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{error}</p>
                  <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchClasses}>
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
                    <p className="text-gray-500">Loading school classes...</p>
                  </div>
                ) : filteredClasses.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <School className="h-12 w-12 text-gray-200" />
                    <p className="font-medium text-gray-500">No classes found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or create a new class</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {filteredClasses.map((schoolClass) => (
                        <div key={schoolClass.id} className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                                {schoolClass.class_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{schoolClass.class_name}</p>
                                <Badge variant="success" className="mt-1 bg-green-100 text-green-700">
                                  Active
                                </Badge>
                              </div>
                            </div>
                            <ActionMenu
                              entityId={schoolClass.id}
                              editPath="/dashboard/school-admin/classes"
                              onDelete={handleDeleteClass}
                              actions={[]}
                            />
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className={schoolClass.teacher ? 'text-gray-700' : 'italic text-gray-400'}>
                                {schoolClass.teacher?.name || 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{schoolClass._count.students} Students</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Class Name
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Class Teacher
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Student Count
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
                          {filteredClasses.map((schoolClass, idx) => (
                            <motion.tr
                              key={schoolClass.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                                    {schoolClass.class_name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-gray-900">{schoolClass.class_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className={schoolClass.teacher ? 'text-gray-700' : 'italic text-gray-400'}>
                                    {schoolClass.teacher?.name || 'Unassigned'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span>{schoolClass._count.students} Students</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="success" className="bg-green-100 text-green-700">
                                  Active
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <ActionMenu
                                  entityId={schoolClass.id}
                                  editPath="/dashboard/school-admin/classes"
                                  onDelete={handleDeleteClass}
                                  actions={[]}
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
