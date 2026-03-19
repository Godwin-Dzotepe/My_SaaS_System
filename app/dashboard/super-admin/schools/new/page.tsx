'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function NewSchool() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
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
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/super-admin/schools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New School</h1>
            <p className="text-gray-600">Register a new school and its administrator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
                  <Input name="phone" placeholder="e.g. +1234567890" required />
                </div>
              </CardContent>
            </Card>

            {/* Admin Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
                  <Input name="adminPhone" placeholder="e.g. +1234567891" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <Input name="adminPassword" type="password" placeholder="••••••••" required />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/super-admin/schools">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create School & Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
