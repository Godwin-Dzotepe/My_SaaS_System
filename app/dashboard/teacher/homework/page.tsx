'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';



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

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes, homeworkRes] = await Promise.all([
          fetch('/api/teacher/my-class'),
          fetch('/api/teacher/homework')
        ]);

        let classData, homeworkData;

        const classContentType = classRes.headers.get("content-type");
        if (classContentType && classContentType.indexOf("application/json") !== -1) {
          classData = await classRes.json();
        } else {
          throw new Error(`Server returned non-JSON for class: ${classRes.status}`);
        }

        const homeworkContentType = homeworkRes.headers.get("content-type");
        if (homeworkContentType && homeworkContentType.indexOf("application/json") !== -1) {
          homeworkData = await homeworkRes.json();
        } else {
          throw new Error(`Server returned non-JSON for homework: ${homeworkRes.status}`);
        }

        if (!classRes.ok) {
          throw new Error(classData.error || `Error ${classRes.status}`);
        }
        if (!homeworkRes.ok) {
          throw new Error(homeworkData.error || `Error ${homeworkRes.status}`);
        }

        setClassId(classData.id);
        setHomeworks(homeworkData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const createHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/teacher/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          due_date: dueDate,
          class_id: classId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create homework');
      }

      const newHomework = await response.json();
      setHomeworks([newHomework, ...homeworks]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setMessage('Homework created successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName="Teacher" />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
              <p className="text-gray-600">Assign and manage class homework</p>
            </div>
          </motion.div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create Homework</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createHomework} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Homework Title"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        rows={4}
                        placeholder="Instructions for students..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Due Date</label>
                      <Input 
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={saving || !classId}>
                      {saving ? 'Creating...' : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Assignment
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-10">Loading assignments...</div>
                  ) : homeworks.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No assignments created yet</div>
                  ) : (
                    <div className="space-y-4">
                      {homeworks.map((hw) => (
                        <div key={hw.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900">{hw.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
                              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No date'}
                                </span>
                                <span>Created: {new Date(hw.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
