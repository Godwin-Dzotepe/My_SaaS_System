'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Eye, EyeOff, Loader2, Lock, Mail, Phone, Save, User } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface Subject {
  id: string;
  subject_name: string;
}

interface SchoolClass {
  id: string;
  class_name: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  subjects: Subject[];
  classes: SchoolClass[];
}

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [teacherResponse, classesResponse, subjectsResponse] = await Promise.all([
          fetch(`/api/teachers/${teacherId}`, { cache: 'no-store', credentials: 'include' }),
          fetch('/api/classes', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/subjects', { cache: 'no-store', credentials: 'include' }),
        ]);

        const [teacherData, classesData, subjectsData] = await Promise.all([
          teacherResponse.json().catch(() => null),
          classesResponse.json().catch(() => null),
          subjectsResponse.json().catch(() => null),
        ]);

        if (!teacherResponse.ok) {
          throw new Error(teacherData?.error || 'Failed to load teacher data.');
        }

        if (!classesResponse.ok) {
          throw new Error(classesData?.error || 'Failed to load classes.');
        }

        if (!subjectsResponse.ok) {
          throw new Error(subjectsData?.error || 'Failed to load subjects.');
        }

        setTeacher(teacherData);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setFormData({
          name: teacherData.name || '',
          email: teacherData.email || '',
          phone: teacherData.phone || '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSelectedClassIds(Array.isArray(teacherData.classes) ? teacherData.classes.map((cls: SchoolClass) => cls.id) : []);
        setSelectedSubjectIds(
          Array.isArray(teacherData.subjects) ? teacherData.subjects.map((subject: Subject) => subject.id) : []
        );
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Error loading teacher data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const assignedClassNames = useMemo(
    () => classes.filter((cls) => selectedClassIds.includes(cls.id)).map((cls) => cls.class_name),
    [classes, selectedClassIds]
  );

  const assignedSubjectNames = useMemo(
    () => subjects.filter((subject) => selectedSubjectIds.includes(subject.id)).map((subject) => subject.subject_name),
    [subjects, selectedSubjectIds]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const hasPasswordInput =
        formData.oldPassword.trim() !== '' ||
        formData.newPassword.trim() !== '' ||
        formData.confirmPassword.trim() !== '';

      if (hasPasswordInput) {
        if (!formData.oldPassword.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim()) {
          throw new Error('Enter old password, new password, and confirm password to change password.');
        }

        if (formData.newPassword.trim() !== formData.confirmPassword.trim()) {
          throw new Error('New password and confirm password do not match.');
        }
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        oldPassword: formData.oldPassword.trim() || undefined,
        newPassword: formData.newPassword.trim() || undefined,
        confirmPassword: formData.confirmPassword.trim() || undefined,
        classIds: selectedClassIds,
        subjectIds: selectedSubjectIds,
      };

      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update teacher.');
      }

      setSuccess('Teacher details updated successfully.');
      setFormData((prev) => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTeacher(data);

      setTimeout(() => {
        router.push('/dashboard/school-admin/teachers');
      }, 1200);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Error saving teacher.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex flex-1 items-center justify-center lg:ml-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Loading teacher data...</p>
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
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/school-admin/teachers">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Teacher</h1>
              <p className="text-gray-600">Update full teacher profile, classes, and subjects</p>
            </div>
          </div>

          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {error}
            </motion.div>
          ) : null}

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
            >
              {success}
            </motion.div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    Full Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Teacher name"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="teacher@school.com"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+233 20 000 0000"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Old Password (optional)
                  </label>
                  <div className="relative">
                    <Input
                      name="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      placeholder="Enter old password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4 text-gray-400" />
                    New Password (optional)
                  </label>
                  <div className="relative">
                    <Input
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Confirm New Password (optional)
                  </label>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Assign Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <p className="text-sm text-gray-500">No subjects found for this school.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {subjects.map((subject) => (
                        <label
                          key={subject.id}
                          className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                            selectedSubjectIds.includes(subject.id)
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubjectIds.includes(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                            className="mr-3 h-4 w-4 rounded text-blue-600"
                          />
                          <span
                            className={
                              selectedSubjectIds.includes(subject.id) ? 'font-medium text-blue-700' : 'text-gray-700'
                            }
                          >
                            {subject.subject_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assign Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="text-sm text-gray-500">No classes found for this school.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {classes.map((schoolClass) => (
                        <label
                          key={schoolClass.id}
                          className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                            selectedClassIds.includes(schoolClass.id)
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedClassIds.includes(schoolClass.id)}
                            onChange={() => toggleClass(schoolClass.id)}
                            className="mr-3 h-4 w-4 rounded text-blue-600"
                          />
                          <span
                            className={
                              selectedClassIds.includes(schoolClass.id) ? 'font-medium text-blue-700' : 'text-gray-700'
                            }
                          >
                            {schoolClass.class_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-800">Teacher:</span> {teacher?.name || formData.name}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Assigned Classes:</span>{' '}
                  {assignedClassNames.length > 0 ? assignedClassNames.join(', ') : 'None'}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Assigned Subjects:</span>{' '}
                  {assignedSubjectNames.length > 0 ? assignedSubjectNames.join(', ') : 'None'}
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
