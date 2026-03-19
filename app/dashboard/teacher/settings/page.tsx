'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  User
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEACHER_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/teacher/profile');
        
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
        } else {
          throw new Error(`Server returned non-JSON response: ${response.status}`);
        }

        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }
        setProfile(data);
        setName(data.name);
        setEmail(data.email || '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={TEACHER_SIDEBAR_ITEMS} userRole="teacher" userName={name || 'Teacher'} />
      
      <motion.div 
        className="flex-1 lg:ml-64"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-4 lg:p-8 space-y-6">
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile and account settings</p>
            </div>
          </motion.div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">Loading profile...</div>
          ) : (
            <div className="max-w-2xl">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={updateProfile} className="space-y-6">
                      <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-12 h-12 text-blue-600" />
                        </div>
                        <Button variant="outline" size="sm" type="button">
                          Change Profile Photo
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          <Input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Phone (Login ID)</label>
                          <Input 
                            value={profile?.phone}
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500">Phone number cannot be changed as it is your login ID.</p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">Email Address</label>
                          <Input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={saving} className="gap-2">
                          {saving ? 'Saving...' : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
