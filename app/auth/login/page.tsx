'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, GraduationCap, Loader2, Phone, ShieldCheck } from 'lucide-react';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'kobby.dev';

function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = host.slice(0, -(BASE_DOMAIN.length + 1));
    return sub && sub !== 'www' ? sub : null;
  }
  return null;
}

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/dashboard/super-admin',
  school_admin: '/dashboard/school-admin',
  finance_admin: '/dashboard/finance-admin',
  teacher: '/dashboard/teacher',
  parent: '/dashboard/parent',
  secretary: '/dashboard/secretary',
};

const showcaseSlides = [
  {
    image: '/image/login-school-campus.jpg',
    eyebrow: 'Connected Learning',
    title: 'Keep every classroom, parent, and school team in one rhythm.',
    description: 'Track attendance, publish results, and communicate with families from one trusted school hub.',
  },
  {
    image: '/image/login-parents-meeting.jpg',
    eyebrow: 'Parent Visibility',
    title: 'Give families a clear view of progress without the usual confusion.',
    description: 'Results, updates, and messages arrive in one place so parents stay informed and involved.',
  },
  {
    image: '/image/login-teacher-classroom.jpg',
    eyebrow: 'Teacher Focus',
    title: 'Help your staff spend less time chasing records and more time teaching.',
    description: 'From scoring to attendance and announcements, the daily school flow stays organized and fast.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const [systemError, setSystemError] = useState('');
  const [helperMessage, setHelperMessage] = useState('');
  const [firstTimeLoading, setFirstTimeLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [requires2fa, setRequires2fa] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [subdomainSchool, setSubdomainSchool] = useState<{ id: string; school_name: string; logo_url: string | null } | null>(null);

  useEffect(() => {
    const sub = getSubdomain();
    if (sub) {
      fetch(`/api/school/by-subdomain?slug=${sub}`)
        .then(r => r.json())
        .then(data => { if (data?.id) setSubdomainSchool(data); })
        .catch(() => null);
    }
  }, []);

  useEffect(() => {
    const checkDatabaseHealth = async () => {
      try {
        const res = await fetch('/api/health/db', { cache: 'no-store' });
        if (res.ok) {
          setSystemError('');
          return;
        }

        const data = await res.json().catch(() => null);
        setSystemError(data?.details || data?.error || 'Database is unavailable right now.');
      } catch {
        setSystemError('Database health check failed. Please try again later.');
      }
    };

    checkDatabaseHealth();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.user?.role) {
          const redirect = ROLE_REDIRECTS[data.user.role] || '/dashboard';
          router.replace(redirect);
          return;
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % showcaseSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, ...(subdomainSchool ? { schoolId: subdomainSchool.id } : {}) }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json().catch(() => null)
        : null;

      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }

      if (data?.requires2fa) {
        setPendingToken(data.pending_token);
        setRequires2fa(true);
        return;
      }

      const redirect = ROLE_REDIRECTS[data.user.role] || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', pending_token: pendingToken, totp_token: totpCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Invalid code');
      const redirect = ROLE_REDIRECTS[data.user.role] || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParentFirstTimePassword = async () => {
    if (!identifier.trim()) {
      setError('Enter the parent phone number first.');
      return;
    }

    try {
      setFirstTimeLoading(true);
      setError('');
      setHelperMessage('');

      const res = await fetch('/api/auth/parent-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier.trim() }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 409 && data?.message) {
          setHelperMessage(data.message);
          return;
        }
        throw new Error(data?.error || data?.message || 'Failed to send first-time password.');
      }

      setHelperMessage(data?.message || 'Password sent successfully.');
    } catch (firstTimeError: any) {
      setError(firstTimeError.message || 'Failed to send first-time password.');
    } finally {
      setFirstTimeLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#3f7afc,_#dfe9ff_55%,_#f0f1f3_100%)] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#3f7afc]/10 bg-white px-6 py-4 text-[#212529] shadow-lg shadow-[#3f7afc]/10">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking your session...</span>
        </div>
      </div>
    );
  }

  const currentSlide = showcaseSlides[activeSlide];

  return (
    <div className="min-h-screen bg-[#f0f1f3] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_#f8f9fb_0%,_#eef2f9_100%)] px-5 py-10 sm:px-8 lg:px-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-[#3f7afc]/16 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#ffa001]/12 blur-3xl" />
          </div>

          <motion.div
            className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_25px_80px_rgba(63,122,252,0.12)] backdrop-blur-xl sm:p-8"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                {subdomainSchool ? (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 overflow-hidden">
                      {subdomainSchool.logo_url
                        ? <Image src={subdomainSchool.logo_url} alt="logo" width={56} height={56} className="object-cover" />
                        : <GraduationCap className="h-8 w-8" />}
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">{subdomainSchool.school_name}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#212529] sm:text-4xl">Welcome back</h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-[#646464]">Sign in to access {subdomainSchool.school_name}.</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3f7afc] text-white shadow-lg shadow-[#3f7afc]/25">
                      <GraduationCap className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#3f7afc]">FutureLink</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#212529] sm:text-4xl">
                      Welcome back
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-[#646464] sm:text-base">
                      Sign in to manage classes, attendance, scores, and parent communication from one place.
                    </p>
                  </>
                )}
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8deea] bg-white px-4 py-2 text-sm font-medium text-[#646464] transition hover:border-[#3f7afc]/30 hover:text-[#3f7afc]"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#e1f1ff]/60 px-4 py-3">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3f7afc]/12 text-[#3f7afc]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#212529]">Secure school access</p>
                <p className="mt-1 text-xs leading-5 text-[#646464]">One login for admins, teachers, finance teams, and parents.</p>
              </div>
              <div className="rounded-2xl bg-[#fff2d8]/55 px-4 py-3">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ffa001]/16 text-[#ffa001]">
                  <Phone className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#212529]">Parent first-time access</p>
                <p className="mt-1 text-xs leading-5 text-[#646464]">Use the phone number linked to the student to receive the first password.</p>
              </div>
            </div>

            {requires2fa ? (
              <form onSubmit={handle2faSubmit} className="space-y-5">
                <div className="rounded-2xl border border-[#3f7afc]/20 bg-[#e1f1ff]/40 px-4 py-3 text-sm text-[#3f7afc]">
                  <strong className="block">2-Step Verification</strong>
                  <span className="mt-1 block text-[#646464]">Enter the 6-digit code from your authenticator app.</span>
                </div>
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#646464]">Authenticator Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full rounded-2xl border border-[#d8deea] bg-white px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#212529] outline-none transition focus:border-[#3f7afc] focus:ring-4 focus:ring-[#3f7afc]/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="w-full rounded-2xl bg-[#3f7afc] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#3f7afc]/25 transition hover:bg-[#2e6aeb] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Verify & Sign in'}
                </button>
                <button type="button" onClick={() => { setRequires2fa(false); setError(''); setTotpCode(''); }} className="w-full text-sm text-[#646464] hover:text-[#3f7afc]">
                  Back to login
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {systemError ? (
                <motion.div
                  className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong className="block text-amber-900">System unavailable</strong>
                  <span className="mt-1 block">{systemError}</span>
                </motion.div>
              ) : null}

              {error ? (
                <motion.div
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error.startsWith('SCHOOL_DEACTIVATED:') ? (
                    <div>
                      <strong className="block text-rose-800">Account Access Disabled</strong>
                      <span className="mt-1 block">{error.split('SCHOOL_DEACTIVATED:')[1]}</span>
                    </div>
                  ) : (
                    error
                  )}
                </motion.div>
              ) : null}

              {helperMessage ? (
                <motion.div
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {helperMessage}
                </motion.div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#646464]">Email or Phone</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter your email or phone"
                  required
                  className="w-full rounded-2xl border border-[#d8deea] bg-white px-4 py-3 text-sm text-[#212529] outline-none transition placeholder:text-slate-400 focus:border-[#3f7afc] focus:ring-4 focus:ring-[#3f7afc]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#646464]">Password</label>
                <div className="relative">
                  <input
                    key={showPassword ? 'text' : 'password'}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-[#d8deea] bg-white px-4 py-3 pr-12 text-sm text-[#212529] outline-none transition placeholder:text-slate-400 focus:border-[#3f7afc] focus:ring-4 focus:ring-[#3f7afc]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-[#f8f9fb] hover:text-[#3f7afc]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || Boolean(systemError)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f7afc] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d6ae0] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleParentFirstTimePassword}
                  disabled={firstTimeLoading || Boolean(systemError)}
                  className="w-full rounded-2xl border border-[#d8deea] bg-white px-4 py-3.5 text-sm font-semibold text-[#646464] transition hover:border-[#3f7afc]/30 hover:bg-[#f8f9fb] hover:text-[#3f7afc] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {firstTimeLoading ? 'Sending parent password...' : 'Parent First-Time Password'}
                </button>
              </div>
            </form>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-[#646464] sm:text-sm">
              Contact your school administrator if you need access or your parent phone number is not linked yet.
            </p>
          </motion.div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.image}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Image
                src={currentSlide.image}
                alt={currentSlide.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(63,122,252,0.12),rgba(33,37,41,0.78))]" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(63,122,252,0.25),transparent_35%)]" />

          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">
                {currentSlide.eyebrow}
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-5xl">
                {currentSlide.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
                {currentSlide.description}
              </p>
            </motion.div>

            <div className="mt-8 flex items-center gap-3">
              {showcaseSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide ? 'w-12 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
                  }`}
                  aria-label={`View slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
