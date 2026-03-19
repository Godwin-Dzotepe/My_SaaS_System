'use client';

import React, { useState, useEffect } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teachers?id=${teacherId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }
      
      await fetchTeachers();

    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone.includes(searchTerm)
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
                <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
                <p className="text-gray-600">View and manage school teachers</p>
              </div>
            </div>
            <Link href="/dashboard/school-admin/teachers/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Teacher
              </Button>
            </Link>
          </motion.div>

          {/* Filters & Search */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, email or phone..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="px-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Subjects</option>
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
            </select>
          </motion.div>

          {/* Teachers List */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Assigned Classes</th>
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
                              <p className="text-gray-500">Loading faculty members...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <GraduationCap className="w-12 h-12 text-gray-200" />
                              <p className="text-gray-500 font-medium">No teachers found</p>
                              <p className="text-sm text-gray-400">Try adjusting your search or add a new teacher</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher, idx) => (
                          <motion.tr 
                            key={teacher.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                  {teacher.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{teacher.name}</p>
                                  <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Senior Teacher</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  {teacher.email || 'No email'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  {teacher.phone}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1.5">
                                {teacher.classes.length > 0 ? (
                                  teacher.classes.map(cls => (
                                    <Badge key={cls.id} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                                      {cls.class_name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="success" className="bg-green-100 text-green-700">
                                Active
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <ActionMenu
                                entityId={teacher.id}
                                editPath="/dashboard/school-admin/teachers"
                                onDelete={handleDeleteTeacher}
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
