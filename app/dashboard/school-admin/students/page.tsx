'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Plus,
  Search,
  Phone,
  Eye,
  ArrowLeft,
  Loader2,
  Users,
  RefreshCcw,
  Trash2,
  MoveRight,
  ChevronDown,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Sidebar } from '@/components/dashboard/sidebar';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  parent_phone: string | null;
  status: string;
  class: { id: string; class_name: string };
  created_at: string;
}

interface ClassOption {
  id: string;
  class_name: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [targetClassId, setTargetClassId] = useState('');
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      setSelected(new Set());

      const response = await fetch('/api/students/list', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch students.');
      }

      setStudents(Array.isArray(data) ? data : (data?.students ?? []));
    } catch (fetchError) {
      setStudents([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data)) setClasses(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close bulk menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete student');
      }
      await fetchStudents();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete student.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} student(s)? This action cannot be undone easily.`)) return;
    setBulkLoading(true);
    setBulkMenuOpen(false);
    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', studentIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Bulk delete failed');
      }
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkMove = async () => {
    if (!targetClassId) return;
    setBulkLoading(true);
    setShowMoveModal(false);
    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_class', studentIds: Array.from(selected), class_id: targetClassId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Bulk move failed');
      }
      setTargetClassId('');
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk move failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/students/export?format=csv';
  };

  const filteredStudents = students.filter((student) => {
    const searchMatches =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.parent_phone || '').includes(searchTerm) ||
      student.class.class_name.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatches =
      statusFilter === 'all' || student.status.toLowerCase() === statusFilter.toLowerCase();

    return searchMatches && statusMatches;
  });

  const allSelected = filteredStudents.length > 0 && selected.size === filteredStudents.length;
  const someSelected = selected.size > 0 && selected.size < filteredStudents.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div className="flex-1 lg:ml-64" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="space-y-6 p-4 lg:p-8">
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard/school-admin">
                <Button variant="ghost" size="sm" className="w-fit gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
                <p className="text-gray-600">Manage all students enrolled in the school</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Link href="/dashboard/school-admin/students/upload" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  Bulk Upload
                </Button>
              </Link>
              <Link href="/dashboard/school-admin/students/new" className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, parent phone or class..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:w-auto">
              <select
                className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="outline" className="gap-2" onClick={fetchStudents}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Bulk actions toolbar */}
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-blue-700">{selected.size} student(s) selected</span>
              <div className="ml-auto flex items-center gap-2" ref={bulkMenuRef}>
                {bulkLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                <div className="relative">
                  <button
                    onClick={() => setBulkMenuOpen(v => !v)}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    Bulk Actions <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {bulkMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
                      <button
                        onClick={() => { setBulkMenuOpen(false); setShowMoveModal(true); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                      >
                        <MoveRight className="h-4 w-4 text-blue-500" />
                        Move to class
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete selected
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}

          {error ? (
            <motion.div variants={itemVariants}>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{error}</p>
                  <Button variant="outline" className="gap-2 border-red-200 bg-white" onClick={fetchStudents}>
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-500">Loading student directory...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-200" />
                    <p className="font-medium text-gray-500">No students found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or add a new student</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="divide-y divide-gray-100 md:hidden">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selected.has(student.id)}
                                onChange={() => toggleSelect(student.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                {student.name.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{student.name}</p>
                                <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-700">
                                  {student.class.class_name}
                                </Badge>
                              </div>
                            </div>
                            <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                              {student.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {student.parent_phone || 'No phone on file'}
                          </div>
                          <div className="flex justify-end">
                            <ActionMenu
                              entityId={student.id}
                              editPath="/dashboard/school-admin/students"
                              onDelete={handleDeleteStudent}
                              actions={[
                                {
                                  label: 'View',
                                  onClick: () => router.push(`/dashboard/school-admin/students/view/${student.id}`),
                                  icon: <Eye size={16} />,
                                },
                              ]}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="w-12 px-4 py-4">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = someSelected; }}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Student Name
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Class
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Parent Contact
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                              Status
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-medium uppercase tracking-wider text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, idx) => (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80 ${selected.has(student.id) ? 'bg-blue-50/40' : ''}`}
                            >
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selected.has(student.id)}
                                  onChange={() => toggleSelect(student.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                    {student.name.split(' ').map((n) => n[0]).join('')}
                                  </div>
                                  <span className="font-semibold text-gray-900">{student.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {student.class.class_name}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  {student.parent_phone || 'No phone on file'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                                  {student.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <ActionMenu
                                  entityId={student.id}
                                  editPath="/dashboard/school-admin/students"
                                  onDelete={handleDeleteStudent}
                                  actions={[
                                    {
                                      label: 'View',
                                      onClick: () => router.push(`/dashboard/school-admin/students/view/${student.id}`),
                                      icon: <Eye size={16} />,
                                    },
                                  ]}
                                />
                              </td>
                            </motion.tr>
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

      {/* Move to class modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Move to Class</h2>
            <p className="mb-4 text-sm text-gray-500">Move {selected.size} student(s) to a different class.</p>
            <select
              value={targetClassId}
              onChange={e => setTargetClassId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleBulkMove}
                disabled={!targetClassId}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Move Students
              </button>
              <button
                onClick={() => { setShowMoveModal(false); setTargetClassId(''); }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
