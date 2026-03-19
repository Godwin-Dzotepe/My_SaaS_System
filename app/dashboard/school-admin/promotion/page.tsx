'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  School,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Search,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const promotionMap = [
  { from: 'Class 1', to: 'Class 2', students: 45 },
  { from: 'Class 2', to: 'Class 3', students: 42 },
  { from: 'Class 3', to: 'Class 4', students: 38 },
  { from: 'Class 4', to: 'Class 5', students: 41 },
  { from: 'Class 5', to: 'Class 6', students: 39 },
  { from: 'Class 6', to: 'JHS 1', students: 37 },
  { from: 'JHS 1', to: 'JHS 2', students: 35 },
  { from: 'JHS 2', to: 'JHS 3', students: 33 },
  { from: 'JHS 3', to: 'Completed', students: 31, isFinal: true },
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

export default function PromotionPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promotionComplete, setPromotionComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promotionData, setPromotionData] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [stats, setStats] = useState({ totalStudents: 0, graduatingStudents: 0, classesAffected: 0 });
  
  // Individual promotion state
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [studentsForPromotion, setStudentsForPromotion] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [promotingStudent, setPromotingStudent] = useState<string | null>(null);
  const [promotionSuccess, setPromotionSuccess] = useState('');

  useEffect(() => {
    // Get school ID from user session/localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.school_id) {
          setSchoolId(user.school_id);
          // Load promotion preview from API
          loadPromotionPreview(user.school_id);
        }
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
  }, []);

  const loadPromotionPreview = async (sId: string) => {
    try {
      // Fetch current class data to build promotion preview
      const res = await fetch(`/api/classes?school_id=${sId}`);
      if (res.ok) {
        const classes = await res.json();
        // Build promotion preview from actual class data
        const preview = [];
        let totalStudents = 0;
        let graduatingStudents = 0;
        
        for (let i = 0; i < classes.length; i++) {
          const currentClass = classes[i];
          const nextClass = classes[i + 1];
          
          // Get student count for this class
          const studentsRes = await fetch(`/api/students/list?class_id=${currentClass.id}&school_id=${sId}`);
          const students = studentsRes.ok ? await studentsRes.json() : [];
          const count = Array.isArray(students) ? students.length : 0;
          
          totalStudents += count;
          
          if (currentClass.class_name === 'JHS 3') {
            graduatingStudents = count;
            preview.push({ from: currentClass.class_name, to: 'Completed', students: count, isFinal: true });
          } else if (nextClass) {
            preview.push({ from: currentClass.class_name, to: nextClass.class_name, students: count, isFinal: false });
          }
        }
        
        setPromotionData(preview);
        setStats({ totalStudents, graduatingStudents, classesAffected: preview.length });
      }
    } catch (error) {
      console.error('Error loading promotion preview:', error);
      // Fall back to mock data
      setPromotionData(promotionMap);
    }
  };

  const handlePromote = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      const res = await fetch('/api/promote-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: schoolId })
      });
      
      if (res.ok) {
        const result = await res.json();
        setPromotionComplete(true);
        setTimeout(() => {
          setPromotionComplete(false);
          // Reload preview
          loadPromotionPreview(schoolId);
        }, 3000);
      } else {
        alert('Promotion failed. Please try again.');
      }
    } catch (error) {
      console.error('Error promoting students:', error);
      alert('An error occurred during promotion.');
    } finally {
      setLoading(false);
    }
  };

  // Load students for individual promotion
  const loadStudentsForPromotion = async () => {
    if (!schoolId) return;
    try {
      const url = `/api/promote-students/individual?school_id=${schoolId}${selectedClass ? `&class_id=${selectedClass}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudentsForPromotion(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Open individual promotion modal
  const handleOpenIndividual = async () => {
    // Load classes first
    try {
      const res = await fetch(`/api/classes?school_id=${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
    await loadStudentsForPromotion();
    setShowIndividualModal(true);
  };

  // Promote single student
  const handlePromoteIndividual = async (studentId: string, targetClassId?: string) => {
    setPromotingStudent(studentId);
    try {
      const res = await fetch('/api/promote-students/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          target_class_id: targetClassId || '',
          school_id: schoolId
        })
      });
      if (res.ok) {
        const result = await res.json();
        setPromotionSuccess(`${result.student?.name || 'Student'} promoted!`);
        setTimeout(() => setPromotionSuccess(''), 3000);
        await loadStudentsForPromotion();
        loadPromotionPreview(schoolId);
      } else {
        const error = await res.json();
        alert(error.error || 'Promotion failed');
      }
    } catch (error) {
      console.error('Error promoting student:', error);
    } finally {
      setPromotingStudent(null);
    }
  };

  // Filter students based on search
  const filteredStudents = studentsForPromotion.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = promotionData.length > 0 ? promotionData.reduce((acc, curr) => acc + curr.students, 0) : stats.totalStudents;
  const graduatingStudents = promotionData.find(p => p.isFinal)?.students || stats.graduatingStudents;

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
              <h1 className="text-2xl font-bold text-gray-900">Student Promotion</h1>
              <p className="text-gray-600">End of academic year student promotion</p>
            </div>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
              Promote All
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={handleOpenIndividual}
            >
              <UserCheck className="w-5 h-5" />
              Individual
            </Button>
          </motion.div>

          {/* Warning Banner */}
          <motion.div 
            variants={itemVariants}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Important Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This action will promote all eligible students to their next class. 
                Students with outstanding fees or academic probation will be excluded. 
                This action cannot be undone.
              </p>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Promotions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Graduating (JHS 3)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{graduatingStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Classes Affected</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{promotionMap.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <School className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Promotion Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Promotion Preview</CardTitle>
                <CardDescription>Review the promotion mapping before proceeding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {promotionData.length > 0 ? (
                    promotionData.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          item.isFinal ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.isFinal ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="font-bold">{item.students}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{item.from}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${item.isFinal ? 'text-green-700' : 'text-gray-900'}`}>
                              {item.to}
                            </span>
                            {item.isFinal && (
                              <Badge variant="success" className="ml-2">Graduation</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.isFinal ? 'Completing' : 'Promoting'}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    promotionMap.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          item.isFinal ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.isFinal ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="font-bold">{item.students}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{item.from}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${item.isFinal ? 'text-green-700' : 'text-gray-900'}`}>
                              {item.to}
                            </span>
                            {item.isFinal && (
                              <Badge variant="success" className="ml-2">Graduation</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.isFinal ? 'Completing' : 'Promoting'}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {promotionComplete && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Promotion Complete!</p>
                  <p className="text-sm text-green-100">All students have been successfully promoted.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Modal */}
          <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title="Confirm Student Promotion"
            description="Are you sure you want to promote all students? This action cannot be undone."
            footer={
              <>
                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePromote} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Yes, Promote Students
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• {totalStudents} students will be promoted</li>
                  <li>• {graduatingStudents} students will graduate</li>
                  <li>• {promotionMap.length} classes will be updated</li>
                  <li>• Parent notifications will be sent automatically</li>
                </ul>
              </div>
                <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Students with pending fees or academic holds will be excluded from this promotion.</p>
              </div>
            </div>
          </Modal>

          {/* Individual Promotion Modal */}
          <Modal
            isOpen={showIndividualModal}
            onClose={() => setShowIndividualModal(false)}
            title="Individual Student Promotion"
            description="Select a student to promote or repeat"
            footer={
              <Button variant="outline" onClick={() => setShowIndividualModal(false)}>
                Close
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search students..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    loadStudentsForPromotion();
                  }}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>

              {/* Success Message */}
              {promotionSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {promotionSuccess}
                </div>
              )}

              {/* Students List */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No students found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.class?.class_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {student.isGraduating ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handlePromoteIndividual(student.id)}
                              disabled={promotingStudent === student.id}
                            >
                              {promotingStudent === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <GraduationCap className="w-4 h-4 mr-1" />
                                  Complete
                                </>
                              )}
                            </Button>
                          ) : student.canPromote ? (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handlePromoteIndividual(student.id, student.targetClassId)}
                              disabled={promotingStudent === student.id}
                            >
                              {promotingStudent === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>→ {student.nextClassName}</>
                              )}
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </div>
      </motion.div>
    </div>
  );
}
