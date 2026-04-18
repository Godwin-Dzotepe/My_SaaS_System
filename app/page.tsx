'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  PlayCircle,
  Smartphone,
  Sparkles,
  UserCog,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-landing-heading',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-landing-body',
});

const dashboardPreviewItems = [
  {
    title: 'Admin Dashboard',
    type: 'image' as const,
    src: '/demo/admin-dashboard-screen.jpg',
    description:
      'Main admin command center with student growth, daily attendance, quick access actions, and school-wide summary cards.',
  },
  {
    title: 'Student Detailed Page',
    type: 'image' as const,
    src: '/demo/student-detail-screen.jpg',
    description:
      'Full student profile page showing personal records, parent records, attendance metrics, payment status, and score summary.',
  },
  {
    title: 'Finance Overview',
    type: 'image' as const,
    src: '/demo/finance-overview-screen.jpg',
    description:
      'Comprehensive fee and finance analytics showing expected totals, paid amounts, pending balances, and collection snapshot.',
  },
];

const workflowSteps = [
  {
    title: 'Set up school data once',
    icon: <UserCog className="h-5 w-5" />,
    text: 'Create classes, assign staff, register students, and configure fee structures from a central admin space.',
  },
  {
    title: 'Run daily teaching workflows',
    icon: <BookOpenCheck className="h-5 w-5" />,
    text: 'Teachers mark attendance, post assignments, and record continuous assessment without spreadsheet switching.',
  },
  {
    title: 'Keep parents continuously informed',
    icon: <Bell className="h-5 w-5" />,
    text: 'Parents check updates any time and receive school communication from the same connected platform.',
  },
];

const heroBackgroundSlides = [
  '/image/login-school-campus.jpg',
  '/image/login-teacher-classroom.jpg',
  '/image/login-parents-meeting.jpg',
];

const featureMarqueeCards = [
  {
    title: 'Admin Dashboard Control',
    image: '/demo/admin-dashboard-screen.jpg',
    description: 'Monitor students, teachers, classes, and daily activity from one unified workspace.',
  },
  {
    title: 'Student Profile Insights',
    image: '/demo/student-detail-screen.jpg',
    description: 'Get complete student details including attendance, parent records, and fee status.',
  },
  {
    title: 'Finance Visibility',
    image: '/demo/finance-overview-screen.jpg',
    description: 'Track expected totals, paid amounts, and pending balances with clear finance snapshots.',
  },
  {
    title: 'Parent-School Connection',
    image: '/image/login-parents-meeting.jpg',
    description: 'Keep families informed with updates, records, and communication in one place.',
  },
  {
    title: 'Teacher Productivity',
    image: '/image/login-teacher-classroom.jpg',
    description: 'Support teaching workflows with streamlined attendance, grading, and classroom data.',
  },
  {
    title: 'Campus Operations',
    image: '/image/login-school-campus.jpg',
    description: 'Coordinate school-wide operations with connected data across every role.',
  },
];

const featureTickerItems = [
  'Attendance and scoring in one flow',
  'Fee tracking with live balances',
  'Admin, teacher, and parent dashboards',
  'Real-time academic visibility',
  'Secure school-wide role permissions',
  'One platform for daily operations',
];

const WATCH_DEMO_VIDEO_SRC = '/demo/futurelink-demo.mp4';

export default function LandingPage() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHint, setInstallHint] = useState('');

  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeHeroBackground, setActiveHeroBackground] = useState(0);
  const showcaseScrollerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroBackground((current) => (current + 1) % heroBackgroundSlides.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDemoOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
  }, [isDemoOpen]);

  useEffect(() => {
    const scroller = showcaseScrollerRef.current;
    if (!scroller) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      if (maxScrollLeft <= 0) return;

      const isScrollingForward = event.deltaY > 0;
      const atStart = scroller.scrollLeft <= 0;
      const atEnd = scroller.scrollLeft >= maxScrollLeft - 1;

      if ((isScrollingForward && atEnd) || (!isScrollingForward && atStart)) {
        return;
      }

      event.preventDefault();
      scroller.scrollBy({ left: event.deltaY, behavior: 'smooth' });
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      scroller.removeEventListener('wheel', onWheel);
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
      setShowInstallPrompt(true);
      setInstallHint(installHint || 'Use your browser menu and choose "Add to Home Screen" or "Install App".');
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      dismissInstallPrompt();
    }

    setDeferredPrompt(null);
  };

  const openDemo = () => {
    setIsDemoOpen(true);
  };

  const closeDemo = () => {
    setIsDemoOpen(false);
  };

  return (
    <div
      className={`${headingFont.variable} ${bodyFont.variable} flex min-h-screen flex-col overflow-x-hidden bg-[linear-gradient(180deg,#f3f8ff_0%,#eef6ff_32%,#ffffff_100%)] [font-family:var(--font-landing-body)]`}
    >
      {showInstallPrompt ? (
        <div className="fixed inset-x-4 bottom-4 z-[70] max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] md:inset-x-auto md:right-5 md:w-[calc(100%-2rem)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1f5dd7]">
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
                <Button onClick={handleInstall} className="bg-[#1f5dd7] hover:bg-[#184db3]">
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

      {isDemoOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-[24px] border border-slate-700 bg-slate-900 shadow-[0_40px_90px_rgba(0,0,0,0.55)] sm:rounded-[32px]">
            <button
              type="button"
              onClick={closeDemo}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close demo"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-slate-900 p-4 sm:p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Watch Demo</p>
              <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl [font-family:var(--font-landing-heading)]">
                FutureLink Product Walkthrough
              </h3>

              <video
                key={WATCH_DEMO_VIDEO_SRC}
                className="max-h-[70vh] w-full rounded-2xl border border-slate-700 bg-black object-contain"
                src={WATCH_DEMO_VIDEO_SRC}
                controls
                autoPlay
                playsInline
                preload="metadata"
              >
                Your browser does not support the demo video.
              </video>

              <p className="mt-4 text-sm text-slate-300">
                If the video does not start, refresh the page and tap Watch Demo again.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f5dd7] shadow-[0_12px_24px_rgba(31,93,215,0.3)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950 [font-family:var(--font-landing-heading)]">FutureLink</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">School SaaS</p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <Link className="text-sm font-medium text-slate-700 transition-colors hover:text-[#1f5dd7]" href="#showcase">
              Screens
            </Link>
            <Link className="text-sm font-medium text-slate-700 transition-colors hover:text-[#1f5dd7]" href="#features">
              Features
            </Link>
          </nav>

          <div className="ml-4 flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={openDemo} className="hidden sm:inline-flex">
              Watch Demo
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-[#1f5dd7] hover:bg-[#184db3]">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-blue-100/70 py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0">
            {heroBackgroundSlides.map((image, index) => (
              <Image
                key={image}
                src={image}
                alt="FutureLink school showcase"
                fill
                sizes="100vw"
                quality={100}
                priority={index === 0}
                className={`object-cover transition-opacity duration-1000 ${
                  index === activeHeroBackground ? 'opacity-40' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.94)_0%,rgba(247,252,255,0.9)_46%,rgba(15,39,79,0.55)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,131,255,0.25),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.18),transparent_34%)]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-semibold text-[#1f5dd7] shadow-sm">
                <Sparkles className="h-4 w-4" />
                Trusted system for modern school management
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl [font-family:var(--font-landing-heading)]">
                Run your entire school from one beautiful and connected dashboard.
              </h1>
              <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                FutureLink gives admins, teachers, and parents one shared source of truth for operations, attendance, fee tracking, and performance.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/book-demo">
                  <Button size="lg" className="h-12 w-full bg-[#1f5dd7] px-8 text-base hover:bg-[#184db3] sm:w-auto">
                    Book a Free Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <Button
                  type="button"
                  onClick={openDemo}
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-8 text-base sm:w-auto"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">No setup confusion</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Fast onboarding for teams</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Mobile-friendly parent access</span>
              </div>

              <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Roles Covered" value="Admin, Teacher, Parent" />
                <StatCard label="Key Modules" value="Attendance, Results, Fees" />
                <StatCard label="Live Visibility" value="Real-time school updates" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white p-3 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
                <Image
                  src="/landing/admin-dashboard-main.svg"
                  alt="FutureLink admin dashboard"
                  width={1800}
                  height={1100}
                  priority
                  unoptimized
                  className="h-auto w-full rounded-[20px] border border-slate-200 bg-white object-contain"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
                  <Image
                    src="/image/login-teacher-classroom.jpg"
                    alt="Teacher using classroom tools"
                    width={900}
                    height={680}
                    quality={100}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-900">Teacher-first productivity</p>
                    <p className="mt-1 text-xs text-slate-600">Attendance and score updates in seconds.</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
                  <Image
                    src="/image/login-parents-meeting.jpg"
                    alt="Parents reviewing school progress"
                    width={900}
                    height={680}
                    quality={100}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-900">Parent confidence</p>
                    <p className="mt-1 text-xs text-slate-600">Clear updates without paper follow-ups.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[30px] border border-blue-100 bg-[#0f274f] p-7 text-white sm:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">How it works</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight [font-family:var(--font-landing-heading)]">
                    One connected workflow for the full school team
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100">
                    Your staff and parents stay aligned because every dashboard is driven by one secure data source.
                  </p>
                </div>
                <Link href="/auth/register">
                  <Button className="bg-white text-[#0f274f] hover:bg-blue-50">Start in Minutes</Button>
                </Link>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {workflowSteps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-white/20 bg-white/10 p-5">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      {step.icon}
                    </div>
                    <p className="text-base font-semibold">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="border-y border-blue-100 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1f5dd7]">Product Screens</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl [font-family:var(--font-landing-heading)]">
                  Admin and student dashboards from your live product
                </h2>
                <p className="mt-4 text-base text-slate-600 sm:text-lg">
                  Cards are arranged vertically and presented in a horizontal scroll strip so users can swipe through each major dashboard view.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                Vertical cards + horizontal scrolling.
              </div>
            </div>

            <div
              ref={showcaseScrollerRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
            >
              {dashboardPreviewItems.map((item) => (
                <article
                  key={item.title}
                  className="min-w-[96vw] snap-start overflow-hidden rounded-[24px] border border-blue-100 bg-[#fbfdff] shadow-sm sm:min-w-[860px] sm:rounded-[28px] xl:min-w-[1120px]"
                >
                  <div className="border-b border-blue-100 bg-[#0f274f] px-5 py-3 text-sm font-semibold text-blue-100">
                    {item.title}
                  </div>
                  <div className="flex flex-col gap-4 p-4">
                    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-900">
                      {item.type === 'image' ? (
                        <Image
                          src={item.src}
                          alt={item.title}
                          width={1920}
                          height={1032}
                          quality={100}
                          className="h-[300px] w-full object-contain sm:h-[430px] lg:h-[560px]"
                        />
                      ) : (
                        <video
                          className="h-[300px] w-full object-cover sm:h-[430px] lg:h-[560px]"
                          src={item.src}
                          controls
                          muted
                          playsInline
                          preload="metadata"
                        >
                          Your browser does not support preview video playback.
                        </video>
                      )}
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1f5dd7]">Key Features</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl [font-family:var(--font-landing-heading)]">
                Built for daily school operations at scale
              </h2>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
              <div className="features-cards-track">
                {[...featureMarqueeCards, ...featureMarqueeCards].map((feature, index) => (
                  <article
                    key={`${feature.title}-${index}`}
                    className="w-[88vw] max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:w-[560px]"
                  >
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={1920}
                      height={1032}
                      quality={100}
                      className="h-56 w-full object-cover sm:h-64"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-slate-900 [font-family:var(--font-landing-heading)]">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
              <div className="features-text-track">
                {[...featureTickerItems, ...featureTickerItems].map((item, index) => (
                  <span key={`${item}-${index}`} className="whitespace-nowrap rounded-full bg-white px-4 py-2 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1f5dd7] py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl [font-family:var(--font-landing-heading)]">
              Ready to launch your school on one connected platform?
            </h2>
            <p className="mt-4 text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
              Book a free demo or watch the walkthrough now to experience the product before signup.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white px-8 text-[#1f5dd7] hover:bg-slate-100">
                  Create Account
                </Button>
              </Link>

              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={openDemo}
                className="border-white bg-transparent px-8 text-white hover:bg-blue-700"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f5dd7]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">FutureLink</p>
              <p>Modern school management software</p>
            </div>
          </div>
          <p>Copyright 2026 FutureLink. All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        .features-cards-track {
          display: flex;
          width: max-content;
          min-width: max-content;
          align-items: stretch;
          gap: 1.25rem;
          animation: features-cards-right 45s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }

        .features-text-track {
          display: flex;
          width: max-content;
          min-width: max-content;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e40af;
          animation: features-text-right 30s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }

        @keyframes features-cards-right {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes features-text-right {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (max-width: 640px) {
          .features-cards-track {
            animation-duration: 34s;
          }

          .features-text-track {
            animation-duration: 24s;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
