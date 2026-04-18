'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Class {
  id: string;
  class_name: string;
  teacher_id: string | null;
}

interface Teacher {
  id: string;
  name: string;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    class_name: '',
    teacher_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch class details
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (classResponse.ok) {
          const classInfo = await classResponse.json();
          setClassData(classInfo);
          setFormData({
            class_name: classInfo.class_name,
            teacher_id: classInfo.teacher_id || '',
          });
        } else {
          setError('Failed to load class data');
        }

        // Fetch teachers for dropdown
        const teachersResponse = await fetch('/api/teachers');
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          setTeachers(teachersData);
        }
      } catch (err) {
        setError('Error loading data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update class');
      }

      setSuccess('Class updated successfully');
      setTimeout(() => {
        router.push('/dashboard/school-admin/classes');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving class');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-500">Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div
        className="flex-1 lg:ml-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/school-admin/classes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Class</h1>
              <p className="text-gray-600">Update class information</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
            >
              {error}
            </motion.div>
          )}

          {/* Success Alert */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
            >
              {success}
            </motion.div>
          )}

          {/* Form Card */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Enter class name"
                    />
                  </div>

                  {/* Teacher Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Teacher
                    </label>
                    <select
                      name="teacher_id"
                      value={formData.teacher_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a teacher (Optional)</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 justify-end pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
