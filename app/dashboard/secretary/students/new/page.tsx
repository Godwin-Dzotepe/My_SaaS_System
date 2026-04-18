'use client';

import * as React from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SECRETARY_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function NewStudentPage() {
  const [formData, setFormData] = React.useState({
    name: '',
    class_id: '',
    parent_phone: '',
    student_number: '',
  });
  const [classes, setClasses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to fetch classes');
        }
        if (Array.isArray(data)) setClasses(data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = await meRes.json().catch(() => null);
      const user = meData?.user;

      if (!meRes.ok || !user?.school_id) {
        throw new Error('Unable to load your account. Please sign in again.');
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, school_id: user.school_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student');

      setSuccess('Student registered successfully!');
      setFormData({ name: '', class_id: '', parent_phone: '', student_number: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={SECRETARY_SIDEBAR_ITEMS} userRole="secretary" userName="Secretary" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Register New Student</h1>
            <Link href="/dashboard/secretary/students">
              <Button variant="ghost" className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back to List
              </Button>
            </Link>
          </div>

          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2"><XCircle className="w-4 h-4" /> {error}</div>}
                {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input required placeholder="Enter student full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Class</label>
                  <select 
                    required
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.class_id}
                    onChange={e => setFormData({...formData, class_id: e.target.value})}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Parent Phone Number</label>
                  <Input required placeholder="e.g. 0240000000" value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} />
                  <p className="text-[10px] text-gray-400">This number will be used for the parent to log in.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Student Number (Optional)</label>
                  <Input placeholder="e.g. SCH-001" value={formData.student_number} onChange={e => setFormData({...formData, student_number: e.target.value})} />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Register Student'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
