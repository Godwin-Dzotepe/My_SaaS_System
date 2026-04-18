'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatGhanaCedis } from '@/lib/currency';
import { downloadPdfFromElement } from '@/lib/client-pdf';

interface StudentDetail {
  id: string;
  student_number: string | null;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  admission_date: string | null;
  previous_school: string | null;
  residential_address: string | null;
  digital_address: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_profession: string | null;
  father_status: string | null;
  father_residential_address: string | null;
  father_digital_address: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  mother_profession: string | null;
  mother_status: string | null;
  mother_residential_address: string | null;
  mother_digital_address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_profession: string | null;
  guardian_residential_address: string | null;
  guardian_digital_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  profile_image: string | null;
  parent_phone: string | null;
  parent_name: string | null;
  parent_relation: string | null;
  status: 'active' | 'completed';
  created_at: string;
  class: {
    id: string;
    class_name: string;
    teacher: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
    } | null;
    schoolFees: Array<{
      id: string;
      fee_type: string;
      amount: number;
      academic_year: string;
      term: string | null;
      description: string | null;
      due_date: string | null;
      is_active: boolean;
    }>;
  };
  parent: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    image: string | null;
    created_at: string;
  } | null;
  school: {
    id: string;
    school_name: string;
    address: string;
    phone: string;
  };
  scores: Array<{
    id: string;
    classScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
    remark: string | null;
    term: string;
    academic_year: string;
    created_at: string;
    subject: {
      id: string;
      subject_name: string;
    };
  }>;
  attendance: Array<{
    id: string;
    date: string;
    status: 'present' | 'absent';
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
    paymentMethod: 'MOMO' | 'BANK_TRANSFER' | 'CARD' | 'CASH';
    referralName: string;
    transactionId: string | null;
    paidAt: string | null;
    created_at: string;
    parent: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
  }>;
  completed_records: {
    id: string;
    graduation_year: number;
    created_at: string;
  } | null;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pdfContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/students/${studentId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load student details');
        }

        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Loading student profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />
        <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="font-semibold text-red-800">{error || 'Student record not found.'}</p>
              <div className="mt-4">
                <Link href="/dashboard/school-admin/students">
                  <Button variant="outline">Back to students</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const presentDays = student.attendance.filter((entry) => entry.status === 'present').length;
  const absentDays = student.attendance.filter((entry) => entry.status === 'absent').length;
  const attendanceRate = student.attendance.length
    ? Math.round((presentDays / student.attendance.length) * 100)
    : 0;

  const paidPayments = student.payments.filter((payment) => payment.status === 'PAID');
  const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAssignedFees = student.class.schoolFees.reduce((sum, fee) => sum + fee.amount, 0);
  const outstandingFees = Math.max(totalAssignedFees - totalPaid, 0);

  const gradedScores = student.scores.filter((score) => typeof score.totalScore === 'number');
  const averageScore = gradedScores.length
    ? Math.round(
        gradedScores.reduce((sum, score) => sum + (score.totalScore || 0), 0) / gradedScores.length
      )
    : null;
  const primaryContactPhone =
    student.father_phone ||
    student.mother_phone ||
    student.guardian_phone ||
    student.parent_phone ||
    student.parent?.phone;
  const handleDownloadPdf = async () => {
    try {
      await downloadPdfFromElement(`student-profile-${student.name}`, pdfContentRef.current, {
        ignoreSelectors: ['[data-pdf-ignore="true"]'],
        imageType: 'PNG',
        imageQuality: 1,
        showHeaderFooter: false,
        deliveryMode: 'download',
      });
    } catch (error) {
      console.error('[student.pdf] Failed to generate PDF:', error);
      window.print();
    }
  };

  return (
    <div className="student-pdf-page flex min-h-screen bg-gray-50">
      <Sidebar items={ADMIN_SIDEBAR_ITEMS} userRole="school-admin" userName="Admin User" />

      <motion.div
        className="student-pdf-shell flex-1 lg:ml-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div ref={pdfContentRef} className="student-pdf-content space-y-6 p-4 md:p-6 lg:p-8">
          <div data-pdf-ignore="true" className="student-pdf-toolbar flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/school-admin/students">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Detail</h1>
                <p className="text-gray-600">Complete student profile, records, and activity</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadPdf} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                Print
              </Button>
              <Link href={`/dashboard/school-admin/students/edit/${student.id}`}>
                <Button>Edit Student</Button>
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 p-6 text-white lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  {student.profile_image ? (
                    <Image
                      src={student.profile_image}
                      alt={student.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-3xl font-bold backdrop-blur">
                      {initials || 'ST'}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-3xl font-bold">{student.name}</h2>
                      <Badge variant={student.status === 'active' ? 'success' : 'secondary'} className="bg-white/15 text-white">
                        {student.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-blue-50">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Student No: {student.student_number || 'Not assigned'}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Class: {student.class.class_name}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Joined: {formatDate(student.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-blue-50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {student.school.school_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {primaryContactPhone || 'No parent phone'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {student.parent?.email || 'No linked parent email'}
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
                    <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{attendanceRate}%</p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {presentDays} present and {absentDays} absent records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Score</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {averageScore !== null ? `${averageScore}%` : 'N/A'}
                    </p>
                  </div>
                  <GraduationCap className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Based on {gradedScores.length} graded academic entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payments Received</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{formatGhanaCedis(totalPaid)}</p>
                  </div>
                  <CreditCard className="h-10 w-10 text-amber-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {paidPayments.length} confirmed payment transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Outstanding Fees</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{formatGhanaCedis(outstandingFees)}</p>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-rose-600" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Estimated from active class fee setup minus paid records
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-blue-600" />
                  Personal Records
                </CardTitle>
                <CardDescription>Core identity and enrollment information</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Full Name" value={student.name} />
                <InfoRow label="Student Number" value={student.student_number} />
                <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Status" value={<Badge variant={student.status === 'active' ? 'success' : 'secondary'}>{student.status}</Badge>} />
                <InfoRow label="Class" value={student.class.class_name} />
                <InfoRow label="School" value={student.school.school_name} />
                <InfoRow label="Admission Date" value={formatDate(student.admission_date || student.created_at)} />
                <InfoRow label="Previous School" value={student.previous_school} />
                <InfoRow label="Residential Address" value={student.residential_address} />
                <InfoRow label="Digital Address" value={student.digital_address} />
                <InfoRow label="School Phone" value={student.school.phone} />
                <InfoRow label="School Address" value={student.school.address} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Father Records
                </CardTitle>
                <CardDescription>Father details and login contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Father Name" value={student.father_name} />
                <InfoRow label="Father Phone" value={student.father_phone} />
                <InfoRow label="Profession" value={student.father_profession} />
                <InfoRow label="Status" value={student.father_status} />
                <InfoRow label="Residential Address" value={student.father_residential_address} />
                <InfoRow label="Digital Address" value={student.father_digital_address} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BadgeCheck className="h-5 w-5 text-violet-600" />
                  Mother Records
                </CardTitle>
                <CardDescription>Mother details and login contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Mother Name" value={student.mother_name} />
                <InfoRow label="Mother Phone" value={student.mother_phone} />
                <InfoRow label="Profession" value={student.mother_profession} />
                <InfoRow label="Status" value={student.mother_status} />
                <InfoRow label="Residential Address" value={student.mother_residential_address} />
                <InfoRow label="Digital Address" value={student.mother_digital_address} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                  Guardian Records
                </CardTitle>
                <CardDescription>Guardian details and login contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Guardian Name" value={student.guardian_name} />
                <InfoRow label="Guardian Phone" value={student.guardian_phone} />
                <InfoRow label="Profession" value={student.guardian_profession} />
                <InfoRow label="Residential Address" value={student.guardian_residential_address} />
                <InfoRow label="Digital Address" value={student.guardian_digital_address} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BadgeCheck className="h-5 w-5 text-violet-600" />
                  Welfare Snapshot
                </CardTitle>
                <CardDescription>Emergency contacts, medical notes, and support data</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Emergency Contact" value={student.emergency_contact_name} />
                <InfoRow label="Emergency Phone" value={student.emergency_contact_phone} />
                <InfoRow label="Medical Notes" value={student.medical_notes} />
                <InfoRow label="Class Teacher" value={student.class.teacher?.name || 'Not assigned'} />
                <InfoRow label="Linked Parent Account" value={student.parent ? 'Yes' : 'No'} />
                <InfoRow label="Parent Account Created" value={student.parent ? formatDate(student.parent.created_at) : 'Not linked'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BadgeCheck className="h-5 w-5 text-sky-600" />
                  Completion Snapshot
                </CardTitle>
                <CardDescription>Current standing and completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Current Status" value={<Badge variant={student.status === 'active' ? 'success' : 'secondary'}>{student.status}</Badge>} />
                <InfoRow label="Graduation Year" value={student.completed_records?.graduation_year?.toString() || 'Not completed'} />
                <InfoRow label="Completion Record Added" value={student.completed_records ? formatDate(student.completed_records.created_at) : 'Not available'} />
                <InfoRow label="Academic Records" value={`${student.scores.length} score entries`} />
                <InfoRow label="Attendance Records" value={`${student.attendance.length} entries`} />
                <InfoRow label="Payment Records" value={`${student.payments.length} transactions`} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Academic Records
                </CardTitle>
                <CardDescription>Subject scores, term results, and remarks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.scores.length === 0 ? (
                  <p className="text-sm text-gray-500">No academic records available yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                          <th className="pb-3 pr-4 font-medium">Subject</th>
                          <th className="pb-3 pr-4 font-medium">Term</th>
                          <th className="pb-3 pr-4 font-medium">Year</th>
                          <th className="pb-3 pr-4 font-medium">Class</th>
                          <th className="pb-3 pr-4 font-medium">Exam</th>
                          <th className="pb-3 pr-4 font-medium">Total</th>
                          <th className="pb-3 pr-4 font-medium">Grade</th>
                          <th className="pb-3 font-medium">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.scores.map((score) => (
                          <tr key={score.id} className="border-b border-gray-50 last:border-b-0">
                            <td className="py-3 pr-4 font-medium text-gray-900">{score.subject.subject_name}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.term}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.academic_year}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.classScore ?? '-'}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.examScore ?? '-'}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.totalScore ?? '-'}</td>
                            <td className="py-3 pr-4 text-gray-600">{score.grade || '-'}</td>
                            <td className="py-3 text-gray-600">{score.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Attendance Records
                </CardTitle>
                <CardDescription>Presence history and latest attendance activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-700">Present</p>
                    <p className="mt-1 text-2xl font-bold text-green-900">{presentDays}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">Absent</p>
                    <p className="mt-1 text-2xl font-bold text-red-900">{absentDays}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700">Rate</p>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{attendanceRate}%</p>
                  </div>
                </div>

                {student.attendance.length === 0 ? (
                  <p className="text-sm text-gray-500">No attendance records available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {student.attendance.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(entry.date)}</p>
                          <p className="text-sm text-gray-500">Recorded attendance entry</p>
                        </div>
                        <Badge variant={entry.status === 'present' ? 'success' : 'destructive'}>
                          {entry.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Fee Records
                </CardTitle>
                <CardDescription>Configured school fees tied to the student&apos;s class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.class.schoolFees.length === 0 ? (
                  <p className="text-sm text-gray-500">No fee structure configured for this class.</p>
                ) : (
                  student.class.schoolFees.map((fee) => (
                    <div key={fee.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{fee.fee_type}</p>
                          <p className="text-sm text-gray-500">
                            {fee.academic_year}{fee.term ? ` | ${fee.term}` : ''}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatGhanaCedis(fee.amount)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>Due: {formatDate(fee.due_date)}</span>
                        <span>{fee.description || 'No description provided'}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Payment Records
                </CardTitle>
                <CardDescription>Student payment history and transaction trail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.payments.length === 0 ? (
                  <p className="text-sm text-gray-500">No payment records available yet.</p>
                ) : (
                  student.payments.map((payment) => (
                    <div key={payment.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{payment.referralName}</p>
                          <p className="text-sm text-gray-500">
                            {payment.paymentMethod.replace('_', ' ')} | Created {formatDate(payment.created_at)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Parent: {payment.parent?.name || 'Not available'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Transaction ID: {payment.transactionId || 'Not available'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatGhanaCedis(payment.amount)}</p>
                          <Badge
                            variant={
                              payment.status === 'PAID'
                                ? 'success'
                                : payment.status === 'FAILED' || payment.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="mt-2"
                          >
                            {payment.status}
                          </Badge>
                          <p className="mt-2 text-xs text-gray-500">Paid at: {formatDateTime(payment.paidAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
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

          .student-pdf-page,
          .student-pdf-page * {
            visibility: visible;
          }

          .student-pdf-page {
            display: block !important;
            min-height: auto !important;
            background: #ffffff !important;
          }

          .student-pdf-shell {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .student-pdf-toolbar,
          aside {
            display: none !important;
          }

          .student-pdf-content {
            padding: 0 !important;
            gap: 16px !important;
          }

          .student-pdf-content,
          .student-pdf-content * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .student-pdf-content .shadow-md,
          .student-pdf-content .shadow-lg,
          .student-pdf-content .shadow-sm {
            box-shadow: none !important;
          }

          .student-pdf-content .rounded-3xl,
          .student-pdf-content .rounded-xl,
          .student-pdf-content .rounded-2xl {
            overflow: hidden !important;
          }

          .student-pdf-content table,
          .student-pdf-content tr,
          .student-pdf-content td,
          .student-pdf-content th,
          .student-pdf-content .rounded-xl,
          .student-pdf-content .border,
          .student-pdf-content .card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
