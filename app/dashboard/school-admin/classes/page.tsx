'use client';

import React, { useState, useEffect } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Users,
  User,
  ArrowLeft,
  Loader2,
  School
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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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
        throw new Error('Failed to delete class');
      }
      
      await fetchClasses();

    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
                <p className="text-gray-600">Overview of all active school classes</p>
              </div>
            </div>
            <Link href="/dashboard/school-admin/classes/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Class
              </Button>
            </Link>
          </motion.div>

          {/* Filters & Search */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by class name or class teacher..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Sections</option>
              <option>Primary</option>
              <option>JHS</option>
              <option>SHS</option>
            </select>
          </motion.div>

          {/* Classes Grid/Table */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Class Teacher</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Student Count</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                              <p className="text-gray-500">Loading school classes...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredClasses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <School className="w-12 h-12 text-gray-200" />
                              <p className="text-gray-500 font-medium">No classes found</p>
                              <p className="text-sm text-gray-400">Try adjusting your search or create a new class</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredClasses.map((cls, idx) => (
                          <motion.tr 
                            key={cls.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                  {cls.class_name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-900">{cls.class_name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className={cls.teacher ? 'text-gray-700' : 'text-gray-400 italic'}>
                                  {cls.teacher?.name || 'Unassigned'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{cls._count.students} Students</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="success" className="bg-green-100 text-green-700">
                                Active
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <ActionMenu
                                entityId={cls.id}
                                editPath="/dashboard/school-admin/classes"
                                onDelete={handleDeleteClass}
                                actions={[]}
                              />
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
