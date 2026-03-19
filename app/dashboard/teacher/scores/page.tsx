'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';



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
  score: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

export default function ScoresPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes, subjectsRes] = await Promise.all([
          fetch('/api/teacher/my-class'),
          fetch('/api/subjects')
        ]);

        let classData, subjectsData;

        const classContentType = classRes.headers.get("content-type");
        if (classContentType && classContentType.indexOf("application/json") !== -1) {
          classData = await classRes.json();
        } else {
          throw new Error(`Server returned non-JSON for class: ${classRes.status}`);
        }

        const subjectsContentType = subjectsRes.headers.get("content-type");
        if (subjectsContentType && subjectsContentType.indexOf("application/json") !== -1) {
          subjectsData = await subjectsRes.json();
        } else {
          throw new Error(`Server returned non-JSON for subjects: ${subjectsRes.status}`);
        }

        if (!classRes.ok) {
          throw new Error(classData.error || `Error ${classRes.status}`);
        }
        if (!subjectsRes.ok) {
          throw new Error(subjectsData.error || `Error ${subjectsRes.status}`);
        }

        setStudents(classData.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          score: ''
        })));
        setSubjects(subjectsData);
        if (subjectsData.length > 0) setSelectedSubject(subjectsData[0].id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleScoreChange = (id: string, value: string) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, score: value } : s
    ));
  };

  const saveScores = async () => {
    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      const promises = students.map(s => {
        if (!s.score) return null;
        return fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: s.id,
            subject_id: selectedSubject,
            score: parseFloat(s.score),
            term,
            academic_year: academicYear
          })
        });
      }).filter(p => p !== null);

      if (promises.length === 0) {
          setError('No scores to save');
          setSaving(false);
          return;
      }

      const results = await Promise.all(promises);
      const allOk = results.every(r => r?.ok);

      if (!allOk) {
        throw new Error('Some scores failed to save');
      }

      setMessage('Scores saved successfully!');
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
              <h1 className="text-2xl font-bold text-gray-900">Enter Scores</h1>
              <p className="text-gray-600">Record student marks for subjects</p>
            </div>
            <Button 
              onClick={saveScores} 
              disabled={saving || loading}
              className="gap-2 px-6"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Scores
                </>
              )}
            </Button>
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

          {loading ? (
            <div className="text-center py-10">Loading data...</div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Subject</label>
                      <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.subject_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Term</label>
                      <select 
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      >
                        <option>Term 1</option>
                        <option>Term 2</option>
                        <option>Term 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Academic Year</label>
                      <Input 
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="e.g. 2025/2026"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Score (0-100)</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
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
                            <td className="py-3 px-4">
                              <Input 
                                type="number" 
                                value={student.score}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                className="w-24 focus:ring-2 focus:ring-blue-500"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              {student.score && (
                                <Badge variant={parseFloat(student.score) >= 80 ? 'success' : parseFloat(student.score) >= 60 ? 'default' : 'destructive'}>
                                  {parseFloat(student.score) >= 80 ? 'A' : parseFloat(student.score) >= 70 ? 'B' : parseFloat(student.score) >= 60 ? 'C' : 'D'}
                                </Badge>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
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
