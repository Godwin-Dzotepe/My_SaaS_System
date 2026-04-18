'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  school_id: string | null;
  school?: { id: string; school_name: string } | null;
}

interface School {
  id: string;
  school_name: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    school_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user details
        const userResponse = await fetch(`/api/super-admin/users?id=${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          setFormData({
            name: userData.name,
            email: userData.email || '',
            phone: userData.phone,
            role: userData.role,
            school_id: userData.school_id || '',
          });
        } else {
          setError('Failed to load user data');
        }

        // Fetch schools for dropdown
        const schoolsResponse = await fetch('/api/super-admin/schools');
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json();
          setSchools(schoolsData.schools || []);
        }
      } catch (err) {
        setError('Error loading data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

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
      const response = await fetch(`/api/super-admin/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setSuccess('User updated successfully');
      setTimeout(() => {
        router.push('/dashboard/super-admin/users');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-500">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />

      <motion.div
        className="flex-1 lg:ml-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/super-admin/users">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information</p>
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
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Enter user's full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a role</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="school_admin">School Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="secretary">Secretary</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>

                  {/* School */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School {formData.role !== 'super_admin' && '*'}
                    </label>
                    <select
                      name="school_id"
                      value={formData.school_id}
                      onChange={handleChange}
                      required={formData.role !== 'super_admin'}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a school (Optional for Super Admin)</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>
                          {school.school_name}
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
