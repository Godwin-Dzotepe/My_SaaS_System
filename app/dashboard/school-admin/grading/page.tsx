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

interface AcademicPeriod {
  id: string;
  academic_year: string;
  term: string;
}

interface SchoolClass {
  id: string;
  class_name: string;
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
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [periodForm, setPeriodForm] = useState({ academic_year: '', term: 'Term 1' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [publishForm, setPublishForm] = useState({ class_id: '', academic_year: '', term: '' });
  const [publishingResults, setPublishingResults] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await fetch('/api/auth/me');
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch user session.');
        }

        const sId = data.user?.school_id || '';
        if (!sId) {
          throw new Error('Could not retrieve school ID for your account.');
        }

        setSchoolId(sId);
        await Promise.all([loadGradingConfig(sId), loadAcademicPeriods(), loadClasses()]);
      } catch (error) {
        console.error('Error initializing grading page:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load grading configuration.');
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const loadGradingConfig = async (sId: string) => {
    try {
      setErrorMessage('');
      const res = await fetch(`/api/grading?school_id=${sId}`);
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
      } else {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to load grading configuration.');
      }
    } catch (error) {
      console.error('Error loading grading config:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load grading configuration.');
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicPeriods = async () => {
    try {
      const res = await fetch('/api/academic-periods');
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load academic periods.');
      }

      const periods = Array.isArray(data?.configuredPeriods) ? data.configuredPeriods : [];
      setAcademicPeriods(periods);
      setPeriodForm((current) => ({
        academic_year: current.academic_year || periods[0]?.academic_year || '',
        term: current.term || periods[0]?.term || 'Term 1',
      }));
      setPublishForm((current) => ({
        class_id: current.class_id,
        academic_year: current.academic_year || periods[0]?.academic_year || '',
        term: current.term || periods[0]?.term || 'Term 1',
      }));
    } catch (error) {
      console.error('Error loading academic periods:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load academic periods.');
    }
  };

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load classes.');
      }

      const nextClasses = Array.isArray(data) ? data : [];
      setClasses(nextClasses);
      setPublishForm((current) => ({
        ...current,
        class_id: current.class_id || nextClasses[0]?.id || '',
      }));
    } catch (error) {
      console.error('Error loading classes:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load classes.');
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
      setErrorMessage('School ID not available. Please refresh the page.');
      return;
    }
    
    setSaving(true);
    setErrorMessage('');
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
        setErrorMessage(`Error clearing old grades: ${errorMessage}`);
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
          setErrorMessage(`Error saving grade ${grade.grade}: ${errorMessage}`);
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
      setErrorMessage('An unexpected error occurred while saving grading configurations.');
      allSucceeded = false;
    } finally {
      setSaving(false);
      if (allSucceeded) {
        // Reload configs to ensure UI reflects saved state, especially new IDs from DB
        loadGradingConfig(schoolId);
      }
    }
  };

  const handleAddAcademicPeriod = async () => {
    if (!periodForm.academic_year || !periodForm.term) {
      setErrorMessage('Academic year and term are required.');
      return;
    }

    try {
      setSavingPeriod(true);
      setErrorMessage('');

      const response = await fetch('/api/academic-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodForm),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save academic period.');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadAcademicPeriods();
    } catch (error) {
      console.error('Error saving academic period:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save academic period.');
    } finally {
      setSavingPeriod(false);
    }
  };

  const handlePublishResults = async () => {
    if (!publishForm.class_id || !publishForm.academic_year || !publishForm.term) {
      setErrorMessage('Select a class, academic year, and term before publishing results.');
      return;
    }

    try {
      setPublishingResults(true);
      setErrorMessage('');
      setPublishFeedback('');

      const response = await fetch('/api/scores/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishForm),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to publish results.');
      }

      setPublishFeedback(`Published ${data?.term || publishForm.term} ${data?.academic_year || publishForm.academic_year} results for ${data?.class_name || 'the selected class'}.`);
    } catch (error) {
      console.error('Error publishing results:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to publish results.');
    } finally {
      setPublishingResults(false);
    }
  };

  const handleDeleteAcademicPeriod = async (periodId: string) => {
    try {
      setDeletingPeriodId(periodId);
      setErrorMessage('');

      const response = await fetch(`/api/academic-periods/${periodId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete academic period.');
      }

      await loadAcademicPeriods();
    } catch (error) {
      console.error('Error deleting academic period:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete academic period.');
    } finally {
      setDeletingPeriodId(null);
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
            <Button onClick={handleSave} className="gap-2 px-8" disabled={saving || loading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Grading System'}
            </Button>
          </motion.div>

          {errorMessage ? (
            <motion.div variants={itemVariants} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </motion.div>
          ) : null}

          {publishFeedback ? (
            <motion.div variants={itemVariants}>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-sm text-emerald-700">{publishFeedback}</CardContent>
              </Card>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Publish Results</CardTitle>
                <CardDescription>Notify parents when a class result set is ready. Parents will only see published result periods.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={publishForm.class_id}
                  onChange={(e) => setPublishForm((current) => ({ ...current, class_id: e.target.value }))}
                >
                  <option value="">Select class</option>
                  {classes.map((classRoom) => (
                    <option key={classRoom.id} value={classRoom.id}>
                      {classRoom.class_name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={publishForm.academic_year}
                  onChange={(e) => setPublishForm((current) => ({ ...current, academic_year: e.target.value }))}
                >
                  <option value="">Select academic year</option>
                  {academicPeriods.map((period) => (
                    <option key={`${period.id}-year`} value={period.academic_year}>
                      {period.academic_year}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={publishForm.term}
                  onChange={(e) => setPublishForm((current) => ({ ...current, term: e.target.value }))}
                >
                  <option value="">Select term</option>
                  {[...new Set(academicPeriods.map((period) => period.term))].map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                <Button onClick={handlePublishResults} disabled={publishingResults} className="gap-2">
                  {publishingResults ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publish Results
                </Button>
              </CardContent>
            </Card>
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
                      {gradeRanges.map((range) => (
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
                    <CardTitle>Academic Periods</CardTitle>
                    <CardDescription>Add the academic years and terms the school should use across scoring, reports, and fees.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
                      <Input
                        value={periodForm.academic_year}
                        onChange={(e) => setPeriodForm((current) => ({ ...current, academic_year: e.target.value }))}
                        placeholder="e.g. 2026-2027"
                      />
                      <select
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={periodForm.term}
                        onChange={(e) => setPeriodForm((current) => ({ ...current, term: e.target.value }))}
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                      <Button onClick={handleAddAcademicPeriod} disabled={savingPeriod} className="gap-2">
                        {savingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {academicPeriods.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                          No academic periods have been added yet.
                        </div>
                      ) : (
                        academicPeriods.map((period) => (
                          <div key={period.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{period.academic_year}</p>
                              <p className="text-sm text-gray-500">{period.term}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAcademicPeriod(period.id)}
                              disabled={deletingPeriodId === period.id}
                              className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            >
                              {deletingPeriodId === period.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

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
                      <span className="text-gray-600 text-sm">Configured Periods</span>
                      <span className="font-bold text-gray-900">{academicPeriods.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Pass Threshold</span>
                      <span className="font-bold text-blue-600">
                        {gradeRanges.filter(r => r.grade !== 'F').length > 0
                          ? `${Math.min(...gradeRanges.filter(r => r.grade !== 'F').map(r => r.minScore))}%`
                          : 'N/A'}
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

