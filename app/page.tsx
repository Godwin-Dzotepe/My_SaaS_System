'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Users,
  School,
  CreditCard,
  Bell,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  BookOpenCheck,
  UserCog,
  Smartphone,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const showcaseItems = [
  {
    title: 'Admin Dashboard',
    image: '/landing/admin-dashboard-main.svg',
    description: 'School admins get live counts for students, teachers, classes, revenue, attendance, and quick actions from one dashboard.',
  },
  {
    title: 'Student Directory',
    image: '/landing/student-directory.svg',
    description: 'Search and manage enrolled students, parent contacts, status, and class placement without switching between tools.',
  },
  {
    title: 'Teacher Detail',
    image: '/landing/teacher-detail.svg',
    description: 'Review teacher workload, subject load, attendance history, and profile records in one structured view.',
  },
  {
    title: 'Parent Dashboard',
    image: '/landing/parent-dashboard.svg',
    description: 'Parents can track attendance, results, fee balances, notifications, and each child&apos;s latest academic progress.',
  },
  {
    title: 'Analytics View',
    image: '/landing/admin-dashboard-alt.svg',
    description: 'Growth charts and attendance trends help schools spot issues early and make decisions with real data.',
  },
];

const workflowSteps = [
  {
    title: '1. Set up your school',
    icon: <UserCog className="w-5 h-5" />,
    text: 'Admins create classes, add teachers and secretaries, configure fees, and upload or register students into the database.',
  },
  {
    title: '2. Run daily operations',
    icon: <BookOpenCheck className="w-5 h-5" />,
    text: 'Teachers mark attendance, enter scores, publish homework, and update classroom activity while admins monitor everything in real time.',
  },
  {
    title: '3. Keep parents informed',
    icon: <Bell className="w-5 h-5" />,
    text: 'Parents log in to see fees, results, attendance, announcements, and events without needing paper reports or manual follow-up.',
  },
];

export default function LandingPage() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHint, setInstallHint] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = window.localStorage.getItem('landing-install-dismissed');
    const installed = window.matchMedia('(display-mode: standalone)').matches;

    if (!dismissed && !installed) {
      const timer = window.setTimeout(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(ua);
        setInstallHint(
          isIos
            ? 'On iPhone or iPad, tap Share and choose "Add to Home Screen".'
            : 'Install this app for faster access from your home screen or desktop.'
        );
        setShowInstallPrompt(true);
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      window.localStorage.setItem('landing-install-dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissInstallPrompt = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('landing-install-dismissed', 'true');
    }
    setShowInstallPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (typeof window !== 'undefined') {
        window.alert(installHint || 'Use your browser menu and choose "Add to Home Screen" or "Install App".');
      }
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      dismissInstallPrompt();
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fc]">
      {showInstallPrompt ? (
        <div className="fixed bottom-5 right-5 z-[70] w-[calc(100%-2rem)] max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2550d7]">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Add FutureLink to your home screen</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {installHint || 'Install this app so it opens faster and feels like a native web app on your device.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissInstallPrompt}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close install prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={handleInstall} className="bg-[#2550d7] hover:bg-[#1d43bb]">
                  {deferredPrompt ? 'Install App' : 'How to Install'}
                </Button>
                <Button variant="outline" onClick={dismissInstallPrompt}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2550d7] shadow-[0_12px_24px_rgba(37,80,215,0.25)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">FutureLink</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">School SaaS</p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#2550d7]" href="#how-it-works">
              How It Works
            </Link>
            <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#2550d7]" href="#showcase">
              Screens
            </Link>
            <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#2550d7]" href="#features">
              Features
            </Link>
          </nav>

          <div className="ml-4 flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-[#2550d7] hover:bg-[#1d43bb]">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,80,215,0.18),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef4ff_100%)] py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-sm font-medium text-[#2550d7] shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                Built for schools that want one reliable system
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Manage students, teachers, parents, fees, and attendance in one platform.
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                FutureLink helps schools run daily operations from a single database. Admins manage records, teachers update classroom activity, and parents follow progress in real time.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 bg-[#2550d7] px-8 text-base hover:bg-[#1d43bb]">
                    Start Free Trial
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#showcase">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    View Product Screens
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Roles Supported" value="Admins, Teachers, Parents" />
                <StatCard label="Core Modules" value="Attendance, Results, Fees" />
                <StatCard label="Data Source" value="Live database records" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-10 h-40 rounded-full bg-blue-200/60 blur-3xl" />
              <div className="relative rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
                <Image
                  src="/landing/admin-dashboard-main.svg"
                  alt="Admin dashboard preview"
                  width={1600}
                  height={980}
                  className="h-auto w-full rounded-[24px] border border-slate-200 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2550d7]">How It Works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                One system, three clear workflows
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                The platform is designed so each role works from the same school data, which keeps attendance, results, fees, and communication consistent across the whole institution.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {workflowSteps.map((step) => (
                <div key={step.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2550d7]">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="showcase" className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2550d7]">Product Screens</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  A quick look at the system in action
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  These views show the main experience across school administration, staff management, parent access, and operational reporting.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Screenshot slots are ready for your final exported dashboard images.
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {showcaseItems.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#fbfcff] shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-950 px-5 py-3 text-sm font-medium text-slate-200">
                    {item.title}
                  </div>
                  <div className="p-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1600}
                      height={980}
                      className="h-auto w-full rounded-[20px] border border-slate-200 object-cover shadow-sm"
                    />
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2550d7]">Key Features</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Everything needed to run day-to-day school operations</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[
                { title: 'Multi-role dashboards', icon: <School className="w-6 h-6" />, desc: 'Different experiences for super admins, school admins, teachers, parents, finance staff, and secretaries.' },
                { title: 'Student and parent records', icon: <Users className="w-6 h-6" />, desc: 'Maintain student profiles, class placement, parent contacts, and school-wide directories from one place.' },
                { title: 'Attendance and scoring', icon: <GraduationCap className="w-6 h-6" />, desc: 'Teachers mark attendance and save scores directly into the database so reports stay current.' },
                { title: 'Fees and finance', icon: <CreditCard className="w-6 h-6" />, desc: 'Track pending payments, payment instructions, finance summaries, and school fee configuration.' },
                { title: 'Announcements and events', icon: <Bell className="w-6 h-6" />, desc: 'Publish updates once and let parents or staff see the same information across their dashboards.' },
                { title: 'Operational reporting', icon: <BarChart3 className="w-6 h-6" />, desc: 'Use summaries, growth charts, recent records, and dashboards to make decisions faster.' },
              ].map((feature) => (
                <div key={feature.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2550d7]">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#2550d7] py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ready to run your school with one connected system?
            </h2>
            <p className="mt-4 text-lg leading-8 text-blue-100">
              Start with student records, then grow into attendance, results, fees, staff management, and parent communication.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white px-8 text-[#2550d7] hover:bg-slate-100">
                  Create Account
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-white bg-transparent px-8 text-white hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2550d7]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">FutureLink</p>
              <p>Modern school management software</p>
            </div>
          </div>
          <p>© 2026 FutureLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
