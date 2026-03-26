'use client';

import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SchoolMark } from '@/components/branding/school-mark';

export function Navbar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [brandName, setBrandName] = useState('FutureLink');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBrandName = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        const sessionUser = data?.user;

        if (!isMounted) return;

        setBrandName(
          sessionUser?.role !== 'super_admin' && sessionUser?.schoolName
            ? sessionUser.schoolName
            : 'FutureLink'
        );
        setBrandLogoUrl(sessionUser?.role !== 'super_admin' ? sessionUser?.schoolLogoUrl || null : null);
      } catch (error) {
        console.error('Failed to load navbar brand name:', error);
      }
    };

    loadBrandName();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/auth/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 z-20 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all lg:pl-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4 lg:hidden">
          <div className="ml-12 flex items-center gap-3 truncate">
            <SchoolMark
              logoUrl={brandLogoUrl}
              schoolName={brandName}
              className="h-9 w-9 rounded-2xl border border-gray-200"
              imageClassName="object-contain p-1"
            />
            <span className="max-w-40 truncate text-lg font-bold text-gray-900">{brandName}</span>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 items-center lg:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50/50 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            className="hover:text-red-600"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
