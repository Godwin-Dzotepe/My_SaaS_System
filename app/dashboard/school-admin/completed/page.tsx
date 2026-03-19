'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Eye,
  Calendar,
  Award,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';



const completedStudents = [
  { 
    id: 1, 
    name: 'John Smith', 
    graduationYear: 2024, 
    finalClass: 'JHS 3',
    averageScore: 87.5,
    status: 'graduated'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    graduationYear: 2024, 
    finalClass: 'JHS 3',
    averageScore: 92.3,
    status: 'graduated'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    graduationYear: 2023, 
    finalClass: 'JHS 3',
    averageScore: 78.9,
    status: 'graduated'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    graduationYear: 2023, 
    finalClass: 'JHS 3',
    averageScore: 95.1,
    status: 'graduated'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    graduationYear: 2024, 
    finalClass: 'JHS 3',
    averageScore: 84.2,
    status: 'graduated'
  },
];

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

export default function CompletedStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [stats, setStats] = useState({ total: 0, byYear: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.school_id) {
          setSchoolId(user.school_id);
          loadCompletedStudents(user.school_id);
        }
      } catch (e) {
        console.error('Error parsing user', e);
        setLoading(false);
      }
    }
  }, []);

  const loadCompletedStudents = async (sId: string, year?: string) => {
    try {
      const url = `/api/completed-students?school_id=${sId}${year ? `&graduation_year=${year}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setStats(data.stats || { total: 0, byYear: [] });
      }
    } catch (error) {
      console.error('Error loading completed students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.student.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Completed Students</h1>
              <p className="text-gray-600">Alumni and graduated students</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export List
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Graduates</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">156</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Class of 2024</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">48</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">85.4%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search graduates..." className="pl-10" />
                  </div>
                  <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Years</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Graduates Table */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Graduate Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Final Class</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Graduation Year</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Avg. Score</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedStudents.map((student, idx) => (
                        <motion.tr 
                          key={student.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">ID: GRD-{student.graduationYear}-{String(student.id).padStart(3, '0')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{student.finalClass}</td>
                          <td className="py-4 px-4 text-gray-600">{student.graduationYear}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${student.averageScore}%` }}
                                  transition={{ duration: 1, delay: 0.5 + idx * 0.05 }}
                                  className="h-full bg-blue-500" 
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{student.averageScore}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="success">Graduated</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View Profile
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
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
