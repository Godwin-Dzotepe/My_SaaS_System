'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';



export default function SecretaryManagementPage() {
  const [secretaries, setSecretaries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const fetchSecretaries = async () => {
    try {
      const res = await fetch('/api/secretaries');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSecretaries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSecretaries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/secretaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create secretary');

      setSuccess('Secretary created successfully!');
      setFormData({ name: '', email: '', phone: '', password: '' });
      setShowAddModal(false);
      fetchSecretaries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secretary Management</h1>
              <p className="text-gray-500">Manage administrative staff who handle school data.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4" /> Add New Secretary
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Secretaries</p>
                        <h3 className="text-2xl font-bold">{secretaries.length}</h3>
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle>Staff List</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by name..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Contact</th>
                      <th className="px-6 py-4 text-left">Role</th>
                      <th className="px-6 py-4 text-left">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading secretaries...</td></tr>
                    ) : secretaries.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No secretaries found.</td></tr>
                    ) : secretaries.map((sec) => (
                      <tr key={sec.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {sec.name[0]}
                            </div>
                            <span className="font-medium text-gray-900">{sec.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Mail className="w-3 h-3" /> {sec.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Phone className="w-3 h-3" /> {sec.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-blue-100 text-blue-700 border-none">Secretary</Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(sec.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Secretary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Add New Secretary</h2>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-1 rounded">
                 <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2"><XCircle className="w-4 h-4" /> {error}</div>}
              {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jane Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email (Optional)</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone Number</label>
                <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 0240000000" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Login Password</label>
                <Input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Create Account</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
