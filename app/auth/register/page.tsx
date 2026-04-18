'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, GraduationCap, School, Users } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    number: '',
    totalStudents: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          school: formData.school,
          email: formData.email,
          number: formData.number,
          totalStudents: Number(formData.totalStudents),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit registration request.');
      }

      setSuccessMessage(
        data?.message ||
          'Registration received. You will be called or receive a WhatsApp message once we approve it.'
      );
      setFormData({
        name: '',
        school: '',
        email: '',
        number: '',
        totalStudents: '',
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit registration request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-900">
      <Image
        src="/image/login-school-campus.jpg"
        alt="School campus background"
        fill
        sizes="100vw"
        priority
        quality={100}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(15,23,42,0.76)_0%,rgba(15,23,42,0.55)_45%,rgba(37,99,235,0.48)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.4),transparent_35%),radial-gradient(circle_at_86%_80%,rgba(16,185,129,0.28),transparent_30%)]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="hidden rounded-[2rem] border border-white/20 bg-white/10 p-7 text-white shadow-2xl shadow-slate-900/30 backdrop-blur-md lg:block">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">FutureLink</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Grow your school with one modern management platform.
          </h1>
          <p className="mt-5 text-sm leading-7 text-blue-100">
            Submit your registration request and our team will approve your account quickly, then reach out with your onboarding steps.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <School className="mt-0.5 h-5 w-5 text-blue-100" />
              <p className="text-sm text-white">School onboarding is tailored to your institution size and workflow.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <Users className="mt-0.5 h-5 w-5 text-blue-100" />
              <p className="text-sm text-white">We prepare your setup based on your student population and staff structure.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-100" />
              <p className="text-sm text-white">You will be called or sent a WhatsApp message once approval is complete.</p>
            </div>
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </section>

        <Card className="w-full rounded-[2rem] border-white/70 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader className="space-y-2 pb-2 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Request Registration</CardTitle>
            <CardDescription className="text-slate-600">
              Share your details and our team will contact you after approval.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMessage ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                  className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">School</label>
                <Input
                  placeholder="FutureLink International School"
                  value={formData.school}
                  onChange={handleChange('school')}
                  required
                  className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <Input
                  type="email"
                  placeholder="you@school.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                  className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Number</label>
                  <Input
                    type="tel"
                    placeholder="0240963964"
                    value={formData.number}
                    onChange={handleChange('number')}
                    required
                    className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Total Students</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="500"
                    value={formData.totalStudents}
                    onChange={handleChange('totalStudents')}
                    required
                    className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <Button className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already approved?{' '}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}