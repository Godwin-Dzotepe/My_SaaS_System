'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Secretary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  created_at: string;
}

export default function SecretaryManagementPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSecretaries = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/secretaries', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch secretaries.');
      }

      setSecretaries(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error(fetchError);
      setSecretaries([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch secretaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const filteredSecretaries = useMemo(
    () =>
      secretaries.filter((secretary) => {
        const search = searchTerm.toLowerCase();
        return (
          secretary.name.toLowerCase().includes(search) ||
          (secretary.email || '').toLowerCase().includes(search) ||
          secretary.phone.includes(searchTerm)
        );
      }),
    [searchTerm, secretaries]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/secretaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create secretary');
      }

      setSuccess('Secretary created successfully.');
      setFormData({ name: '', email: '', phone: '', password: '' });
      setShowAddModal(false);
      await fetchSecretaries();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create secretary');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />

      <div className="flex-1 p-4 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secretary Management</h1>
              <p className="text-gray-500">Manage administrative staff who handle school data.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 md:w-auto">
              <UserPlus className="h-4 w-4" /> Add New Secretary
            </Button>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-none bg-white shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Secretaries</p>
                  <h3 className="text-2xl font-bold">{secretaries.length}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <p>{error}</p>
                <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchSecretaries}>
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {success ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 text-sm text-emerald-700">{success}</CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-none bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Staff List</CardTitle>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, email or phone..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="gap-2" onClick={fetchSecretaries}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  Loading secretaries...
                </div>
              ) : filteredSecretaries.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-500">No secretaries found.</div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 md:hidden">
                    {filteredSecretaries.map((secretary) => (
                      <div key={secretary.id} className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                              {secretary.name[0]}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{secretary.name}</span>
                              <p className="text-sm text-gray-500">
                                Joined {new Date(secretary.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className="border-none bg-blue-100 text-blue-700">Secretary</Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> {secretary.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" /> {secretary.phone}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-100 bg-gray-50 font-medium text-gray-500">
                        <tr>
                          <th className="px-6 py-4 text-left">Name</th>
                          <th className="px-6 py-4 text-left">Contact</th>
                          <th className="px-6 py-4 text-left">Role</th>
                          <th className="px-6 py-4 text-left">Joined Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredSecretaries.map((secretary) => (
                          <tr key={secretary.id} className="transition-colors hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                  {secretary.name[0]}
                                </div>
                                <span className="font-medium text-gray-900">{secretary.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Mail className="h-3 w-3" /> {secretary.email || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Phone className="h-3 w-3" /> {secretary.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="border-none bg-blue-100 text-blue-700">Secretary</Badge>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(secretary.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold">Add New Secretary</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 hover:bg-white/10">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error ? (
                <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <XCircle className="h-4 w-4" /> {error}
                </div>
              ) : null}
              {success ? (
                <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> {success}
                </div>
              ) : null}

              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email (Optional)</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0240000000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Login Password</label>
                <Input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
