'use client';

import * as React from 'react';
import { SchoolMark } from '@/components/branding/school-mark';

export function DashboardBrandShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [schoolName, setSchoolName] = React.useState('FutureLink');
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadBranding = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        const user = data?.user;

        if (!isMounted) return;

        setSchoolName(user?.role !== 'super_admin' && user?.schoolName ? user.schoolName : 'FutureLink');
        setLogoUrl(user?.role !== 'super_admin' ? user?.schoolLogoUrl || null : null);
      } catch (error) {
        console.error('Failed to load dashboard branding:', error);
      } finally {
        window.setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 700);
      }
    };

    loadBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),linear-gradient(135deg,#eff6ff,#dbeafe_55%,#bfdbfe)]">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/75 px-10 py-8 shadow-2xl backdrop-blur-xl">
          <SchoolMark
            logoUrl={logoUrl}
            schoolName={schoolName}
            className="h-24 w-24 rounded-[28px]"
            imageClassName="object-contain p-3"
            fallbackClassName="bg-white"
          />
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">{schoolName}</p>
            <p className="text-sm text-slate-500">Preparing your workspace...</p>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
