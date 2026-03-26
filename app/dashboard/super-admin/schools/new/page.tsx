'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Save,
  Loader2,
  ImagePlus,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { SchoolMark } from '@/components/branding/school-mark';

export default function NewSchool() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/super-admin/schools', {
        method: 'POST',
        body: formData,
      });

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create school');
      }

      router.push('/dashboard/super-admin/schools');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />

      <div className="flex-1 space-y-6 p-4 lg:ml-64 lg:p-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/super-admin/schools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New School</h1>
            <p className="text-gray-600">Register a new school, upload its logo, and save its SMS username.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    School Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">School Name *</label>
                    <Input name="schoolName" placeholder="e.g. Lincoln High School" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Address *</label>
                    <Input name="address" placeholder="e.g. 123 Education Ave, City" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                    <Input name="phone" placeholder="e.g. +233240000000" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">School SMS Username</label>
                    <Input name="smsUsername" placeholder="Provider username for this school" />
                    <p className="text-xs text-gray-500">Used by the SMS provider when this school sends messages.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    School Administrator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name *</label>
                    <Input name="adminName" placeholder="e.g. John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <Input name="adminEmail" type="email" placeholder="e.g. admin@school.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                    <Input name="adminPhone" placeholder="e.g. +233240000001" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password *</label>
                    <Input name="adminPassword" type="password" placeholder="Create a secure password" required />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <ImagePlus className="w-5 h-5 text-violet-600" />
                  Branding Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <SchoolMark
                      logoUrl={logoPreview}
                      schoolName="School preview"
                      className="h-28 w-28 rounded-[30px] border border-gray-200"
                      imageClassName="object-contain p-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">School logo</p>
                      <p className="text-sm text-gray-500">This logo will appear in the preloader, sidebar, and mobile navbar.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      <ImagePlus className="h-4 w-4" />
                      Upload Logo
                      <input
                        name="schoolLogo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            setLogoPreview(null);
                            return;
                          }
                          setLogoPreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-4 w-4" />
                    SMS setup note
                  </div>
                  <p>The platform API key stays on the server. Each school can still have its own SMS username saved here for provider-side routing.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/super-admin/schools">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create School & Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
