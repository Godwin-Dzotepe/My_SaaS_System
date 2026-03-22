'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Settings,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



interface GradeRange {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function GradingConfigurationPage() {
  const [gradeRanges, setGradeRanges] = useState<GradeRange[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    // Get school ID from user session
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        console.log('API Auth Me Response:', d); // Log the full response
        const sId = d.user?.school_id || d.school_id; // Access school_id directly from the response as per app/api/auth/me/route.ts
        console.log('Extracted School ID:', sId); // Log the extracted school_id

        if (sId) {
          setSchoolId(sId);
          loadGradingConfig(sId);
        } else {
          alert('Could not retrieve school ID for your account. Please ensure you are logged in as a school administrator and your account is assigned to a school.');
          setLoading(false); // If no schoolId, we are done loading but no config can be loaded
        }
      }).catch(e => {
        console.error('Error fetching user school ID:', e);
        alert('Error fetching user school ID. Please check your network connection and try again.');
        setLoading(false);
      });
  }, []);

  const loadGradingConfig = async (sId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/grading?school_id=${sId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setGradeRanges(data.map((g: any) => ({
            id: g.id,
            grade: g.grade,
            minScore: g.min_score,
            maxScore: g.max_score,
            remark: g.remark
          })));
        } else {
          // Set defaults if no config exists
          setGradeRanges([
            { id: '1', grade: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
            { id: '2', grade: 'B', minScore: 70, maxScore: 79, remark: 'Very Good' },
            { id: '3', grade: 'C', minScore: 60, maxScore: 69, remark: 'Good' },
            { id: '4', grade: 'D', minScore: 50, maxScore: 59, remark: 'Pass' },
            { id: '5', grade: 'F', minScore: 0, maxScore: 49, remark: 'Fail' },
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading grading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRange = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setGradeRanges([...gradeRanges, { id: newId, grade: '', minScore: 0, maxScore: 0, remark: '' }]);
  };

  const removeRange = (id: string) => {
    setGradeRanges(gradeRanges.filter(range => range.id !== id));
  };

  const updateRange = (id: string, field: keyof GradeRange, value: string | number) => {
    setGradeRanges(gradeRanges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));
  };

  const handleSave = async () => {
    if (!schoolId) {
      alert('School ID not available. Please refresh the page.');
      return;
    }
    
    setSaving(true);
    let allSucceeded = true;
    try {
      // Clear existing grading configs for this school
      // This is a simpler approach than updating individual grades and handling deletions
      const deleteRes = await fetch(`/api/grading?school_id=${schoolId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!deleteRes.ok) {
        const errorData = await deleteRes.json();
        const errorMessage = errorData.error || 'Failed to clear existing grading configurations.';
        alert(`Error clearing old grades: ${errorMessage}`);
        allSucceeded = false;
        return;
      }

      // Save each grade config
      for (const grade of gradeRanges) {
        const response = await fetch('/api/grading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            school_id: schoolId,
            grade: grade.grade,
            min_score: grade.minScore,
            max_score: grade.maxScore,
            remark: grade.remark
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Failed to save a grade range.';
          alert(`Error saving grade ${grade.grade}: ${errorMessage}`);
          allSucceeded = false;
          // Optionally, break the loop if one fails to prevent further issues
          break;
        }
      }

      if (allSucceeded) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving grading config:', error);
      alert('An unexpected error occurred while saving grading configurations.');
      allSucceeded = false;
    } finally {
      setSaving(false);
      if (allSucceeded) {
        // Reload configs to ensure UI reflects saved state, especially new IDs from DB
        loadGradingConfig(schoolId);
      }
    }
  };

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grading System Configuration</h1>
              <p className="text-gray-600">Define grade boundaries and remarks for your school</p>
            </div>
            <Button onClick={handleSave} className="gap-2 px-8">
              <Save className="w-4 h-4" />
              Save Grading System
            </Button>
          </motion.div>

          {/* Info Banner */}
          <motion.div variants={itemVariants} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Dynamic Grading</h3>
              <p className="text-sm text-blue-700 mt-1">
                The changes you make here will automatically update report cards, teacher score entries, and student performance analytics across the entire school.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Editor */}
            <motion.div variants={itemVariants} className="xl:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Grade Ranges</CardTitle>
                    <CardDescription>Customize score brackets for each grade</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addRange} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Grade
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-2 text-sm font-semibold text-gray-500 mb-2">
                      <div className="col-span-2">Grade</div>
                      <div className="col-span-2">Min %</div>
                      <div className="col-span-2">Max %</div>
                      <div className="col-span-4">Remark</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    
                    <AnimatePresence initial={false}>
                      {gradeRanges.map((range, index) => (
                        <motion.div 
                          key={range.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="col-span-2">
                            <Input 
                              value={range.grade} 
                              onChange={(e) => updateRange(range.id, 'grade', e.target.value)}
                              placeholder="e.g. A"
                              className="font-bold text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              value={isNaN(range.minScore) ? '' : range.minScore} 
                              onChange={(e) => updateRange(range.id, 'minScore', parseInt(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={isNaN(range.maxScore) ? '' : range.maxScore}
                              onChange={(e) => updateRange(range.id, 'maxScore', parseInt(e.target.value))}
                              placeholder="100"
                            />                          </div>
                          <div className="col-span-4">
                            <Input 
                              value={range.remark} 
                              onChange={(e) => updateRange(range.id, 'remark', e.target.value)}
                              placeholder="e.g. Excellent"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeRange(range.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview & Stats */}
            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Active Grades</span>
                      <span className="font-bold text-gray-900">{gradeRanges.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Pass Threshold</span>
                      <span className="font-bold text-blue-600">
                        {Math.min(...gradeRanges.filter(r => r.grade !== 'F').map(r => r.minScore))}%
                      </span>
                    </div>
                    <div className="p-4 border border-dashed border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 leading-relaxed italic">
                        &quot;Grades provide a standardized way to communicate student achievement to parents and educational authorities.&quot;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                  <CardContent className="p-6">
                    <Settings className="w-8 h-8 opacity-50 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Automated Rules</h3>
                    <p className="text-sm text-blue-100">
                      Students falling below the Fail threshold will be automatically flagged for academic probation in the Promotion portal.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Success Notification */}
          <AnimatePresence>
            {saved && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Grading System Updated!</p>
                  <p className="text-sm text-green-100">All student records will reflect these changes.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

