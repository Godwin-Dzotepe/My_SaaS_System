'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  Phone,
  User,
  School,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';

interface Class {
  id: string;
  class_name: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function NewStudentPage() {
  const [loading, setLoading] = React.useState(false);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [saved, setSaved] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    class_id: '',
    parent_phone: '',
    parent_name: '',
    parent_relation: 'Guardian',
    school_id: 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a'
  });

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, class_id: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.class_id) {
        alert('Please select a class');
        return;
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSaved(true);

        setFormData({
          name: '',
          class_id: classes[0]?.id || '',
          parent_phone: '',
          parent_name: '',
          parent_relation: 'Guardian',
          school_id: 'd9e8f7a6-b5c4-4d3e-2f1a-0b9c8d7e6f5a'
        });

        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setLoading(false);
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
        <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin/students">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
                <p className="text-gray-600">Register a new student and link to a parent account</p>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>Basic enrollment details</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Student Full Name
                    </label>
                    <Input
                      placeholder="e.g. John Doe"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <School className="w-4 h-4 text-gray-400" /> Assigned Class
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                      value={formData.class_id}
                      onChange={(e) => setFormData((prev) => ({ ...prev, class_id: e.target.value }))}
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Parent/Guardian Information</CardTitle>
                  <CardDescription>Primary contact for school updates and billing</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Parent Full Name
                    </label>
                    <Input
                      placeholder="e.g. Robert Doe"
                      value={formData.parent_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parent_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Phone Number (Username)
                    </label>
                    <Input
                      placeholder="e.g. 0500000000"
                      required
                      value={formData.parent_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parent_phone: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 italic">This will be the parent's login username.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Relationship
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                      value={formData.parent_relation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parent_relation: e.target.value }))}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end gap-4">
              <Link href="/dashboard/school-admin/students">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>

              <Button type="submit" className="gap-2 px-8" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Register Student
              </Button>
            </motion.div>
          </form>

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
                  <p className="font-medium">Student Registered Successfully!</p>
                  <p className="text-sm text-green-100">Parent account has been created/linked.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
