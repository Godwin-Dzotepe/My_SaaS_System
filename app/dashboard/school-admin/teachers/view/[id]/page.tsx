'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  School,
  UserCircle2,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { downloadPdfFromElement } from '@/lib/client-pdf';

interface TeacherDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  image: string | null;
  role: string;
  created_at: string;
  school: {
    id: string;
    school_name: string;
    address: string;
    phone: string;
  } | null;
  subjects: Array<{
    id: string;
    subject_name: string;
  }>;
  classes: Array<{
    id: string;
    class_name: string;
    students: Array<{
      id: string;
      name: string;
    }>;
  }>;
  homework: Array<{
    id: string;
    title: string;
    due_date: string | null;
    created_at: string;
    class: {
      id: string;
      class_name: string;
    };
  }>;
  teacherAttendance: Array<{
    id: string;
    date: string;
    status: 'present' | 'absent';
  }>;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-900">{value || 'Not available'}</span>
    </div>
  );
}

export default function TeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pdfContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teachers/${teacherId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load teacher details');
        }

        setTeacher(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teacher details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Loading teacher profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="font-semibold text-red-800">{error || 'Teacher record not found.'}</p>
              <div className="mt-4">
                <Link href="/dashboard/school-admin/teachers">
                  <Button variant="outline">Back to teachers</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = teacher.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const totalStudents = teacher.classes.reduce((sum, currentClass) => sum + currentClass.students.length, 0);
  const presentDays = teacher.teacherAttendance.filter((entry) => entry.status === 'present').length;
  const attendanceRate = teacher.teacherAttendance.length
    ? Math.round((presentDays / teacher.teacherAttendance.length) * 100)
    : 0;
  const handleDownloadPdf = async () => {
    try {
      await downloadPdfFromElement(`teacher-profile-${teacher.name}`, pdfContentRef.current, {
        ignoreSelectors: ['[data-pdf-ignore="true"]'],
      });
    } catch (error) {
      console.error('[teacher.pdf] Failed to generate PDF:', error);
      window.print();
    }
  };

  return (
    <div className="teacher-pdf-page flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div
        className="teacher-pdf-shell flex-1 lg:ml-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div ref={pdfContentRef} className="teacher-pdf-content space-y-6 p-4 md:p-6 lg:p-8">
          <div data-pdf-ignore="true" className="teacher-pdf-toolbar flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin/teachers">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Detail</h1>
                <p className="text-gray-600">Complete teacher profile, workload, and activity</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadPdf} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Link href={`/dashboard/school-admin/teachers/edit/${teacher.id}`}>
                <Button>Edit Teacher</Button>
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-slate-800 via-blue-700 to-cyan-600 p-6 text-white lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  {teacher.image ? (
                    <img
                      src={teacher.image}
                      alt={teacher.name}
                      className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-3xl font-bold backdrop-blur">
                      {initials || 'TR'}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-3xl font-bold">{teacher.name}</h2>
                      <Badge variant="success" className="bg-white/15 text-white">
                        Active
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-blue-50">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Role: {teacher.role.replace('_', ' ')}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Joined: {formatDate(teacher.created_at)}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Classes: {teacher.classes.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-blue-50">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {teacher.email || 'No email address'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {teacher.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    {teacher.school?.school_name || 'School not available'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned Classes</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{teacher.classes.length}</p>
                  </div>
                  <GraduationCap className="h-10 w-10 text-blue-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">Current class leadership load</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{totalStudents}</p>
                  </div>
                  <Users className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">Students across assigned classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subjects</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{teacher.subjects.length}</p>
                  </div>
                  <BookOpen className="h-10 w-10 text-amber-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">Subjects assigned to this teacher</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{attendanceRate}%</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-rose-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Based on {teacher.teacherAttendance.length} teacher attendance records
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-blue-600" />
                  Profile Records
                </CardTitle>
                <CardDescription>Core identity and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Full Name" value={teacher.name} />
                <InfoRow label="Email" value={teacher.email} />
                <InfoRow label="Phone" value={teacher.phone} />
                <InfoRow label="Role" value={teacher.role.replace('_', ' ')} />
                <InfoRow label="Joined On" value={formatDate(teacher.created_at)} />
                <InfoRow label="School" value={teacher.school?.school_name} />
                <InfoRow label="School Phone" value={teacher.school?.phone} />
                <InfoRow label="School Address" value={teacher.school?.address} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Subject Load
                </CardTitle>
                <CardDescription>Subjects currently taught by this teacher</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacher.subjects.length === 0 ? (
                  <p className="text-sm text-gray-500">No subjects assigned yet.</p>
                ) : (
                  teacher.subjects.map((subject) => (
                    <div key={subject.id} className="rounded-xl border border-gray-100 px-4 py-3">
                      <p className="font-medium text-gray-900">{subject.subject_name}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-violet-600" />
                  Work Snapshot
                </CardTitle>
                <CardDescription>Quick summary of teacher activity and allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Assigned Classes" value={`${teacher.classes.length}`} />
                <InfoRow label="Total Students" value={`${totalStudents}`} />
                <InfoRow label="Homework Published" value={`${teacher.homework.length}`} />
                <InfoRow label="Attendance Entries" value={`${teacher.teacherAttendance.length}`} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Assigned Classes
                </CardTitle>
                <CardDescription>Classes under this teacher and enrolled students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacher.classes.length === 0 ? (
                  <p className="text-sm text-gray-500">No class assignments yet.</p>
                ) : (
                  teacher.classes.map((assignedClass) => (
                    <div key={assignedClass.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{assignedClass.class_name}</p>
                          <p className="text-sm text-gray-500">{assignedClass.students.length} active students</p>
                        </div>
                        <Badge variant="secondary">{assignedClass.students.length} students</Badge>
                      </div>
                      {assignedClass.students.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignedClass.students.slice(0, 8).map((student) => (
                            <span
                              key={student.id}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                            >
                              {student.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Attendance Records
                </CardTitle>
                <CardDescription>Recent teacher attendance history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacher.teacherAttendance.length === 0 ? (
                  <p className="text-sm text-gray-500">No teacher attendance records available yet.</p>
                ) : (
                  teacher.teacherAttendance.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(entry.date)}</p>
                        <p className="text-sm text-gray-500">Teacher attendance entry</p>
                      </div>
                      <Badge variant={entry.status === 'present' ? 'success' : 'destructive'}>
                        {entry.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Homework and Teaching Activity
              </CardTitle>
              <CardDescription>Recently created homework and instructional output</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teacher.homework.length === 0 ? (
                <p className="text-sm text-gray-500">No homework records available yet.</p>
              ) : (
                teacher.homework.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.class.class_name} | Created {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Due {formatDate(item.due_date)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden;
          }

          .teacher-pdf-page,
          .teacher-pdf-page * {
            visibility: visible;
          }

          .teacher-pdf-page {
            display: block !important;
            min-height: auto !important;
            background: #ffffff !important;
          }

          .teacher-pdf-shell {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .teacher-pdf-toolbar,
          aside {
            display: none !important;
          }

          .teacher-pdf-content {
            padding: 0 !important;
            gap: 16px !important;
          }

          .teacher-pdf-content,
          .teacher-pdf-content * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .teacher-pdf-content .shadow-md,
          .teacher-pdf-content .shadow-lg,
          .teacher-pdf-content .shadow-sm {
            box-shadow: none !important;
          }

          .teacher-pdf-content .rounded-3xl,
          .teacher-pdf-content .rounded-xl,
          .teacher-pdf-content .rounded-2xl {
            overflow: hidden !important;
          }

          .teacher-pdf-content table,
          .teacher-pdf-content tr,
          .teacher-pdf-content td,
          .teacher-pdf-content th,
          .teacher-pdf-content .rounded-xl,
          .teacher-pdf-content .border,
          .teacher-pdf-content .card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
