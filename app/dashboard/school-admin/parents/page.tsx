'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Plus,
  UserCircle,
  Phone,
  KeyRound,
  RotateCcw,
  Copy,
  RefreshCcw,
  Search,
  Eye,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PromptModal } from '@/components/ui/prompt-modal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

interface Parent {
  parent_id: string | null;
  parent_name: string;
  parent_phone: string;
  parent_relation: string;
  temporary_password: string | null;
  password_generated_at: string | null;
  children: { id: string; name: string; class_name: string }[];
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string | null>>({});
  const [revealTarget, setRevealTarget] = useState<Parent | null>(null);
  const [revealingPassword, setRevealingPassword] = useState(false);

  const fetchParents = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/parents', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch parents.');
      }

      setParents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Error fetching parents', fetchError);
      setParents([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch parents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const filteredParents = useMemo(
    () =>
      parents.filter((parent) => {
        const search = searchTerm.toLowerCase();
        return (
          parent.parent_name.toLowerCase().includes(search) ||
          parent.parent_phone.includes(searchTerm) ||
          parent.parent_relation.toLowerCase().includes(search) ||
          parent.children.some(
            (child) =>
              child.name.toLowerCase().includes(search) ||
              child.class_name.toLowerCase().includes(search)
          )
        );
      }),
    [parents, searchTerm]
  );

  const copyLoginDetails = async (parent: Parent) => {
    if (!parent.parent_id) {
      setError('This parent account is not linked yet.');
      return;
    }

    const revealedPassword = revealedPasswords[parent.parent_id];
    if (!revealedPassword) {
      setError('Reveal the parent password first before copying login details.');
      return;
    }

    const text = `${parent.parent_name}\nPhone: ${parent.parent_phone}\nPassword: ${
      revealedPassword
    }`;
    await navigator.clipboard.writeText(text);
    setFeedback(`Login details copied for ${parent.parent_name}.`);
  };

  const handleRevealPassword = async (parent: Parent) => {
    if (!parent.parent_id) {
      setError('This parent account is not linked yet.');
      return;
    }
    setRevealTarget(parent);
  };

  const submitRevealPassword = async (adminPassword: string) => {
    if (!revealTarget?.parent_id) return;
    try {
      setRevealingPassword(true);
      setError('');
      setFeedback('');

      const response = await fetch('/api/parents/reveal-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: revealTarget.parent_id,
          adminPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to reveal parent password');
      }

      setRevealedPasswords((current) => ({
        ...current,
        [revealTarget.parent_id!]: data?.temporary_password || null,
      }));
      setFeedback(`Password revealed for ${revealTarget.parent_name}.`);
      setRevealTarget(null);
    } catch (revealError) {
      console.error(revealError);
      setError(revealError instanceof Error ? revealError.message : 'Failed to reveal parent password');
    } finally {
      setRevealingPassword(false);
    }
  };

  const handleResetPassword = async (parent: Parent) => {
    if (!parent.parent_id) {
      setError('This parent account is not linked yet. Create or re-add the student details first.');
      return;
    }

    try {
      setResettingId(parent.parent_id);
      setError('');
      setFeedback('');

      const response = await fetch('/api/parents/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: parent.parent_id }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to reset parent password');
      }

      await fetchParents();
      setRevealedPasswords((current) => {
        const next = { ...current };
        delete next[parent.parent_id!];
        return next;
      });
      setFeedback(`Temporary password reset for ${parent.parent_name}. The parent will receive it by SMS.`);
    } catch (resetError) {
      console.error(resetError);
      setError(resetError instanceof Error ? resetError.message : 'Failed to reset parent password');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f1f3]">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div
        className="flex-1 p-4 lg:ml-64 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Parents</h1>
              <p className="text-gray-600">
                View parent accounts, phone numbers, and temporary login passwords
              </p>
            </div>
            <Link href="/dashboard/school-admin/students/new" className="w-full md:w-auto">
              <Button className="w-full gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0] md:w-auto">
                <Plus className="h-4 w-4" />
                Add Student & Parent
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by parent, phone, child or class..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 lg:w-auto" onClick={fetchParents}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </motion.div>

          {error ? (
            <motion.div variants={itemVariants}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{error}</p>
                  <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchParents}>
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {feedback ? (
            <motion.div variants={itemVariants}>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-sm text-emerald-700">{feedback}</CardContent>
              </Card>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <Card className="border-none bg-white shadow-sm">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3f7afc]" />
                  </div>
                ) : filteredParents.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <UserCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    No parents found. Parents are automatically added when you create students or bulk upload them.
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {filteredParents.map((parent, idx) => (
                        <div key={`${parent.parent_phone}-${idx}`} className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e1f1ff] text-[#3f7afc]">
                                <UserCircle className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="block font-bold text-[#212529]">{parent.parent_name}</span>
                                <span className="text-xs text-gray-500">
                                  {parent.parent_id ? 'Account ready' : 'Account link missing'}
                                </span>
                              </div>
                            </div>
                            <Badge
                              className={
                                parent.parent_relation.toLowerCase() === 'mother'
                                  ? 'border-none bg-pink-100 text-pink-700 hover:bg-pink-100'
                                  : parent.parent_relation.toLowerCase() === 'father'
                                    ? 'border-none bg-blue-100 text-blue-700 hover:bg-blue-100'
                                    : 'border-none bg-purple-100 text-purple-700 hover:bg-purple-100'
                              }
                            >
                              {parent.parent_relation}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-[#646464]">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {parent.parent_phone}
                            </div>
                            <div className="flex items-center gap-2 font-mono text-gray-800">
                              <KeyRound className="h-4 w-4 text-gray-400" />
                              <span>{parent.parent_id ? (revealedPasswords[parent.parent_id] || '••••••••') : 'Reset password to generate'}</span>
                              {parent.parent_id ? (
                                <button type="button" className="text-blue-600 hover:text-blue-800" onClick={() => handleRevealPassword(parent)}>
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                            {parent.password_generated_at ? (
                              <div className="text-xs text-gray-400">
                                Generated {new Date(parent.password_generated_at).toLocaleString()}
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Associated Students
                            </p>
                            <div className="flex flex-col gap-1">
                              {parent.children.map((child, childIndex) => (
                                <div key={`${child.id}-${parent.parent_phone}-${childIndex}`} className="text-sm">
                                  <span className="font-medium text-gray-800">{child.name}</span>
                                  <span className="ml-2 text-gray-500">({child.class_name})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => copyLoginDetails(parent)}>
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0]"
                              onClick={() => handleResetPassword(parent)}
                              disabled={!parent.parent_id || resettingId === parent.parent_id}
                            >
                              {resettingId === parent.parent_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Reset Password
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-[#f8f9fb]">
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#646464]">
                              Parent Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#646464]">
                              Login Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#646464]">
                              Relationship
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#646464]">
                              Associated Students
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#646464]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredParents.map((parent, idx) => (
                            <tr
                              key={`${parent.parent_phone}-${idx}`}
                              className="group align-top transition-colors hover:bg-[#f8f9fb]"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e1f1ff] text-[#3f7afc]">
                                    <UserCircle className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <span className="block font-bold text-[#212529]">{parent.parent_name}</span>
                                    <span className="text-xs text-gray-500">
                                      {parent.parent_id ? 'Account ready' : 'Account link missing'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2 text-sm text-[#646464]">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {parent.parent_phone}
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-gray-800">
                                    <KeyRound className="h-4 w-4 text-gray-400" />
                                    <span>{parent.parent_id ? (revealedPasswords[parent.parent_id] || '••••••••') : 'Reset password to generate'}</span>
                                    {parent.parent_id ? (
                                      <button type="button" className="text-blue-600 hover:text-blue-800" onClick={() => handleRevealPassword(parent)}>
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                  {parent.password_generated_at ? (
                                    <div className="text-xs text-gray-400">
                                      Generated {new Date(parent.password_generated_at).toLocaleString()}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={
                                    parent.parent_relation.toLowerCase() === 'mother'
                                      ? 'border-none bg-pink-100 text-pink-700 hover:bg-pink-100'
                                      : parent.parent_relation.toLowerCase() === 'father'
                                        ? 'border-none bg-blue-100 text-blue-700 hover:bg-blue-100'
                                        : 'border-none bg-purple-100 text-purple-700 hover:bg-purple-100'
                                  }
                                >
                                  {parent.parent_relation}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  {parent.children.map((child, childIndex) => (
                                    <div key={`${child.id}-${parent.parent_phone}-${childIndex}`} className="text-sm">
                                      <span className="font-medium text-gray-800">{child.name}</span>
                                      <span className="ml-2 text-gray-500">({child.class_name})</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyLoginDetails(parent)}>
                                    <Copy className="h-4 w-4" /> Copy
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-[#3f7afc] hover:bg-[#2d6ae0]"
                                    onClick={() => handleResetPassword(parent)}
                                    disabled={!parent.parent_id || resettingId === parent.parent_id}
                                  >
                                    {resettingId === parent.parent_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                    Reset Password
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
          </motion.div>
        </div>
      </motion.div>
      <PromptModal
        isOpen={Boolean(revealTarget)}
        onClose={() => setRevealTarget(null)}
        onSubmit={submitRevealPassword}
        title="Verify Admin Password"
        description={revealTarget ? `Enter your admin password to view ${revealTarget.parent_name}'s login password.` : undefined}
        label="Admin Password"
        placeholder="Enter your current password"
        confirmText="Reveal Password"
        type="password"
        isLoading={revealingPassword}
      />
    </div>
  );
}
