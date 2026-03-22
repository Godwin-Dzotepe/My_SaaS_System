'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, BookOpen, Trash2, Edit2, X, Check } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

interface Subject {
  id: string;
  subject_name: string;
}

export default function SubjectsPage() {
  const [userName, setUserName] = useState('Admin User');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user && d.user.name) setUserName(d.user.name); }).catch(console.error);
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Error fetching subjects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setAdding(true);
    setError('');

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_name: newSubject }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add subject');
      }

      setNewSubject('');
      await fetchSubjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/subjects/' + id, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      await fetchSubjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.subject_name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/subjects/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_name: editName }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }
      
      setEditingId(null);
      await fetchSubjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      
      <motion.div
        className="flex-1 lg:ml-64 p-4 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div variants={itemVariants} className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Subjects</h1>
              <p className="text-gray-600">Add, edit, and remove school subjects</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-[#3f7afc]">
              <BookOpen className="w-6 h-6" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Add Subject</CardTitle>
                  <CardDescription>Create a new subject for your school</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSubject} className="space-y-4">
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Subject Name</label>
                      <Input
                        placeholder="e.g. Mathematics"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        required
                        disabled={adding}
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0]" disabled={adding}>
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {adding ? 'Adding...' : 'Add Subject'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3f7afc]" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No subjects added yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:border-[#3f7afc] transition-colors">
                          {editingId === subject.id ? (
                            <div className="flex flex-1 items-center gap-2 mr-2">
                              <Input 
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9"
                                disabled={isProcessing}
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => saveEdit(subject.id)}
                                disabled={isProcessing}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                onClick={cancelEdit}
                                disabled={isProcessing}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-[#e1f1ff] flex items-center justify-center text-[#3f7afc] mr-4">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-900">{subject.subject_name}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-gray-500 hover:text-[#3f7afc] hover:bg-[#e1f1ff]"
                                  onClick={() => startEdit(subject)}
                                  disabled={isProcessing || editingId !== null}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(subject.id)}
                                  disabled={isProcessing || editingId !== null}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
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
