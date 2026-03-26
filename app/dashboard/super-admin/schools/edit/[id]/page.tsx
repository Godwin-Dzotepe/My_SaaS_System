'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save, ImagePlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { SchoolMark } from '@/components/branding/school-mark';

interface School {
  id: string;
  school_name: string;
  address: string;
  phone: string;
  sms_username?: string | null;
  logo_url?: string | null;
}

export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clearLogo, setClearLogo] = useState(false);

  const [formData, setFormData] = useState({
    school_name: '',
    address: '',
    phone: '',
    sms_username: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolResponse = await fetch(`/api/schools/${schoolId}`);
        if (schoolResponse.ok) {
          const schoolInfo = await schoolResponse.json();
          setSchool(schoolInfo);
          setLogoPreview(schoolInfo.logo_url || null);
          setFormData({
            school_name: schoolInfo.school_name,
            address: schoolInfo.address,
            phone: schoolInfo.phone,
            sms_username: schoolInfo.sms_username || '',
          });
        } else {
          setError('Failed to load school data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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
      const payload = new FormData();
      payload.append('school_name', formData.school_name);
      payload.append('address', formData.address);
      payload.append('phone', formData.phone);
      payload.append('sms_username', formData.sms_username);
      payload.append('clearLogo', clearLogo ? 'true' : 'false');
      if (logoFile) {
        payload.append('schoolLogo', logoFile);
      }

      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'PUT',
        body: payload,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update school');
      }

      setSuccess('School updated successfully');
      setTimeout(() => {
        router.push('/dashboard/super-admin/schools');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving school');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
        <div className="flex flex-1 items-center justify-center lg:ml-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Loading school data...</p>
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
        <div className="space-y-6 p-4 lg:p-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/super-admin/schools">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
              <p className="text-gray-600">Update school branding, SMS username, and contact information.</p>
            </div>
          </div>

          {error ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              {error}
            </motion.div>
          ) : null}

          {success ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              {success}
            </motion.div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">School Name *</label>
                    <input
                      type="text"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter school name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter school address"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">School SMS Username</label>
                    <input
                      type="text"
                      name="sms_username"
                      value={formData.sms_username}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      placeholder="Provider username for this school"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t pt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
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

            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Branding</p>
                  <p className="text-sm text-gray-500">This logo will be used in the branded preloader and dashboard header areas.</p>
                </div>

                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6">
                  <div className="flex flex-col items-center gap-4">
                    <SchoolMark
                      logoUrl={clearLogo ? null : logoPreview}
                      schoolName={formData.school_name || school?.school_name}
                      className="h-28 w-28 rounded-[30px] border border-gray-200"
                      imageClassName="object-contain p-3"
                    />
                    <div className="flex flex-wrap justify-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <ImagePlus className="h-4 w-4" />
                        Upload New Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setLogoFile(file);
                            setClearLogo(false);
                            if (file) {
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      {(logoPreview || school?.logo_url) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                            setClearLogo(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Logo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
