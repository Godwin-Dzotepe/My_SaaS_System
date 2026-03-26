'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Phone,
  User,
  School,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MessageDialog } from '@/components/ui/message-dialog';

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
  const [schoolIdLoading, setSchoolIdLoading] = React.useState(true);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [saved, setSaved] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState('');
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = React.useState(0);
  const [generatedParentLogins, setGeneratedParentLogins] = React.useState<Array<{ name: string; phone: string; temporary_password: string | null }>>([]);
  const [dialogState, setDialogState] = React.useState<{ open: boolean; title: string; message: string; tone: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const [formData, setFormData] = React.useState({
    name: '',
    student_number: '',
    class_id: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    admission_date: new Date().toISOString().slice(0, 10),
    previous_school: '',
    residential_address: '',
    digital_address: '',
    father_name: '',
    father_phone: '',
    father_profession: '',
    father_status: 'Alive',
    father_residential_address: '',
    father_digital_address: '',
    mother_name: '',
    mother_phone: '',
    mother_profession: '',
    mother_status: 'Alive',
    mother_residential_address: '',
    mother_digital_address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_profession: '',
    guardian_residential_address: '',
    guardian_digital_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    school_id: ''
  });

  // Fetch school_id from current user session
  React.useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({ ...prev, school_id: data.user?.school_id || '' }));
        } else {
          const errorText = await response.text();
          console.error('Error fetching user school_id', errorText);
          // Handle error, maybe redirect to login or show an error message
        }
      } catch (error) {
        console.error('Error fetching user school_id:', error);
      } finally {
        setSchoolIdLoading(false);
      }
    };
    fetchSchoolId();
  }, []);

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!formData.school_id) return; // Wait for school_id to be loaded

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
  }, [formData.school_id]);

  React.useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.school_id) {
      setDialogState({ open: true, title: 'School Not Ready', message: 'School ID not loaded. Please try again.', tone: 'warning' });
      setLoading(false);
      return;
    }

    try {
      if (!formData.class_id) {
        setDialogState({ open: true, title: 'Class Required', message: 'Please select a class.', tone: 'warning' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        body: (() => {
          const payload = new FormData();
          Object.entries(formData).forEach(([key, value]) => {
            payload.append(key, value);
          });
          if (profileImage) {
            payload.append('profile_image', profileImage);
          }
          return payload;
        })()
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedParentLogins(result.parentAccounts || []);
        setSaved(true);

        setFormData({
          name: '',
          student_number: '',
          class_id: classes[0]?.id || '',
          date_of_birth: '',
          gender: '',
          nationality: '',
          admission_date: new Date().toISOString().slice(0, 10),
          previous_school: '',
          residential_address: '',
          digital_address: '',
          father_name: '',
          father_phone: '',
          father_profession: '',
          father_status: 'Alive',
          father_residential_address: '',
          father_digital_address: '',
          mother_name: '',
          mother_phone: '',
          mother_profession: '',
          mother_status: 'Alive',
          mother_residential_address: '',
          mother_digital_address: '',
          guardian_name: '',
          guardian_phone: '',
          guardian_profession: '',
          guardian_residential_address: '',
          guardian_digital_address: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          medical_notes: '',
          school_id: formData.school_id // Keep current school_id
        });
        setProfileImage(null);
        setPhotoPreview('');
        setFileInputKey((prev) => prev + 1);

        if ((result.parentAccounts || []).length > 0) {
          setDialogState({
            open: true,
            title: 'Parent Login Details',
            message: result.parentAccounts
              .map((account: { name: string; phone: string; temporary_password: string | null }) =>
                `${account.name} - ${account.phone} - ${account.temporary_password || 'Existing password kept'}`
              )
              .join('\n'),
            tone: 'success',
          });
        }

        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to add student';
        if (error.details && Array.isArray(error.details)) {
          const detailMessages = error.details.map((detail: any) => `${detail.path.join('.')}: ${detail.message}`).join('\n');
          setDialogState({ open: true, title: 'Student Save Failed', message: `${errorMessage}\n\nDetails:\n${detailMessages}`, tone: 'error' });
        } else {
          setDialogState({ open: true, title: 'Student Save Failed', message: errorMessage, tone: 'error' });
        }
      }
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || schoolIdLoading || !formData.school_id;

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
                  <CardDescription>Identity, admission, and profile details</CardDescription>
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
                      <School className="w-4 h-4 text-gray-400" /> Student Number
                    </label>
                    <Input
                      placeholder="e.g. ADM-2026-001"
                      value={formData.student_number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, student_number: e.target.value }))}
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
                    </label>
                    <Input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Gender
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.gender}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Nationality
                    </label>
                    <Input
                      placeholder="e.g. Ghanaian"
                      value={formData.nationality}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" /> Admission Date
                    </label>
                    <Input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, admission_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <School className="w-4 h-4 text-gray-400" /> Previous School
                    </label>
                    <Input
                      placeholder="Enter previous school attended"
                      value={formData.previous_school}
                      onChange={(e) => setFormData((prev) => ({ ...prev, previous_school: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Residential Address
                    </label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter home or residential address"
                      value={formData.residential_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, residential_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Digital Address
                    </label>
                    <Input
                      placeholder="e.g. GA-123-4567"
                      value={formData.digital_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, digital_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-gray-400" /> Profile Picture
                    </label>
                    <Input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (photoPreview) {
                          URL.revokeObjectURL(photoPreview);
                        }
                        setProfileImage(file);
                        setPhotoPreview(file ? URL.createObjectURL(file) : '');
                      }}
                    />
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Student profile preview"
                        className="h-24 w-24 rounded-2xl object-cover border border-gray-200"
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Parent Information</CardTitle>
                  <CardDescription>Both parents can have their own login numbers for the system</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Father&apos;s Name
                    </label>
                    <Input
                      placeholder="e.g. Robert Doe"
                      value={formData.father_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Father&apos;s Number
                    </label>
                    <Input
                      placeholder="e.g. 0500000000"
                      value={formData.father_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_phone: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 italic">If provided, this number becomes the father&apos;s login credential.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Father&apos;s Profession
                    </label>
                    <Input
                      placeholder="e.g. Engineer"
                      value={formData.father_profession}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_profession: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Father&apos;s Status
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.father_status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_status: e.target.value }))}
                    >
                      <option value="Alive">Alive</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Father&apos;s Residential Address
                    </label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter father&apos;s residential address"
                      value={formData.father_residential_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_residential_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Father&apos;s Digital Address
                    </label>
                    <Input
                      placeholder="e.g. GA-123-4567"
                      value={formData.father_digital_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, father_digital_address: e.target.value }))}
                    />
                  </div>

                  <div className="border-t pt-6 md:col-span-2" />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Mother&apos;s Name
                    </label>
                    <Input
                      placeholder="e.g. Jane Doe"
                      value={formData.mother_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> Mother&apos;s Number
                    </label>
                    <Input
                      placeholder="e.g. 0200000000"
                      value={formData.mother_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_phone: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 italic">If provided, this number becomes the mother&apos;s login credential.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Mother&apos;s Profession
                    </label>
                    <Input
                      placeholder="e.g. Nurse"
                      value={formData.mother_profession}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_profession: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> Mother&apos;s Status
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.mother_status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_status: e.target.value }))}
                    >
                      <option value="Alive">Alive</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Mother&apos;s Residential Address
                    </label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter mother&apos;s residential address"
                      value={formData.mother_residential_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_residential_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Mother&apos;s Digital Address
                    </label>
                    <Input
                      placeholder="e.g. GC-222-9081"
                      value={formData.mother_digital_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mother_digital_address: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Guardian Information</CardTitle>
                  <CardDescription>Record guardian details separately when applicable</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Guardian Name</label>
                    <Input
                      placeholder="e.g. Aunt Mary Doe"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guardian_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Guardian Number</label>
                    <Input
                      placeholder="e.g. 0200000000"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guardian_phone: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 italic">If provided, this number becomes the guardian&apos;s login credential.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Guardian Profession</label>
                    <Input
                      placeholder="e.g. Business Owner"
                      value={formData.guardian_profession}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guardian_profession: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Guardian Residential Address</label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter guardian&apos;s residential address"
                      value={formData.guardian_residential_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guardian_residential_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Guardian Digital Address</label>
                    <Input
                      placeholder="e.g. GS-500-2020"
                      value={formData.guardian_digital_address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, guardian_digital_address: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Emergency and Welfare Information</CardTitle>
                  <CardDescription>Important care and safety information for the student</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <Input
                      placeholder="e.g. Uncle Kofi Mensah"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <Input
                      placeholder="e.g. 0240000000"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Medical Notes / Allergies</label>
                    <textarea
                      className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Record allergies, chronic conditions, medications, or special care notes"
                      value={formData.medical_notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, medical_notes: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end gap-4">
              <Link href="/dashboard/school-admin/students">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>

              <Button type="submit" className="gap-2 px-8" disabled={isSubmitDisabled}>
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
                  <p className="text-sm text-green-100">
                    Parent account has been created/linked. {generatedParentLogins.length > 0 ? 'Login details were generated.' : 'Check the Parents panel for login details.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <MessageDialog
            isOpen={dialogState.open}
            onClose={() => setDialogState((current) => ({ ...current, open: false }))}
            title={dialogState.title}
            message={<div className="whitespace-pre-wrap">{dialogState.message}</div>}
            tone={dialogState.tone}
          />
        </div>
      </motion.div>
    </div>
  );
}
