'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  Users,
  DoorOpen,
  User,
  School,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function NewClassPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState({
    class_name: '',
    teacher_id: ''
  });

  React.useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
        if (response.ok) {
          const data = await response.json();
          setTeachers(data);
        }
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          class_name: formData.class_name,
          teacher_id: formData.teacher_id || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      setSuccess('Class created successfully!');
      setTimeout(() => {
        router.push('/dashboard/school-admin/classes');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
      setSaving(false);
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
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Link href="/dashboard/school-admin/classes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
              <p className="text-gray-600">Set up a new academic class and assign a teacher</p>
            </div>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </motion.div>
          )}

          {/* Success Alert */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex gap-2"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{success}</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                  <CardDescription>Basic configuration for the new class</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <School className="w-4 h-4 text-gray-400" /> Class Name *
                    </label>
                    <Input
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      placeholder="e.g. Class 5"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Class Teacher
                    </label>
                    <select
                      name="teacher_id"
                      value={formData.teacher_id}
                      onChange={handleChange}
                      disabled={saving || teachers.length === 0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Teacher (Optional)</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end gap-4">
              <Link href="/dashboard/school-admin/classes">
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || !formData.class_name}
                className="gap-2 px-8 bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Class
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
