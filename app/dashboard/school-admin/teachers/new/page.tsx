'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, Mail, User, Phone, Lock, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';

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

export default function NewTeacherPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Admin User');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setUserName(user.name);
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
    
    // Fetch subjects available to the school
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
        }
      } catch (err) {
        console.error('Failed to fetch subjects', err);
      }
    };
    fetchSubjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        subjectIds: selectedSubjects
      };

      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add teacher');
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.push('/dashboard/school-admin/teachers');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName={userName} />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin/teachers">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
                <p className="text-gray-600">Onboard a new faculty member</p>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={itemVariants} className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
               {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Full Name
                    </label>
                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Sarah Wilson" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" /> Email Address (Optional)
                    </label>
                    <Input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="sarah.wilson@school.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                    </label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+233 20 000 0000" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" /> Password
                    </label>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Secure password" required />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Assign Subjects</CardTitle>
                  <CardDescription>Select the subjects this teacher will handle</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                      No subjects available. Please add subjects in the settings first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {subjects.map(subject => (
                        <label 
                          key={subject.id} 
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedSubjects.includes(subject.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'}`}
                        >
                          <input 
                            type="checkbox" 
                            className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                            checked={selectedSubjects.includes(subject.id)}
                            onChange={() => handleSubjectToggle(subject.id)}
                          />
                          <BookOpen className="w-4 h-4 mr-2" />
                          <span className={selectedSubjects.includes(subject.id) ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                            {subject.subject_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end gap-4">
              <Link href="/dashboard/school-admin/teachers">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="gap-2 px-8" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Teacher Account'}
              </Button>
            </motion.div>
          </form>

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
                  <p className="font-medium">Teacher Registered!</p>
                  <p className="text-sm text-green-100">Teacher has been added to the database.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
