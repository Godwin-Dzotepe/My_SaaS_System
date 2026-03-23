'use client';

import React, { useEffect, useState } from 'react';
import {
  Phone
} from 'lucide-react';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';



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

interface Student {
  id: string;
  name: string;
  parent_phone: string;
  status: string;
}

interface TeacherClass {
  id: string;
  class_name: string;
  students: Student[];
}

export default function MyClassPage() {
  const [teacherClass, setTeacherClass] = useState<TeacherClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClass() {
      try {
        const response = await fetch('/api/teacher/my-class');
        
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
        } else {
          throw new Error(`Server returned non-JSON response: ${response.status}`);
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }
        setTeacherClass(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClass();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="space-y-6 p-4 lg:p-8">
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Class</h1>
              <p className="text-gray-600">
                {teacherClass ? `${teacherClass.class_name} • ${teacherClass.students.length} students` : 'Loading...'}
              </p>
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-10">Loading class details...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[680px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Parent Phone</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherClass?.students.map((student, idx) => (
                          <motion.tr 
                            key={student.id} 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="font-medium text-gray-900">{student.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {student.parent_phone}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                                {student.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                View Profile
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {teacherClass?.students.map((student, idx) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                              <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                                {student.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="break-all">{student.parent_phone}</span>
                            </div>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              View Profile
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
