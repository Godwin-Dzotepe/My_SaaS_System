'use client';

import { Bell, Search, Settings, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SchoolMark } from '@/components/branding/school-mark';
import { Badge } from '@/components/ui/badge';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  created_at?: string;
}

type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'teacher'
  | 'parent'
  | 'secretary'
  | 'finance_admin';

function formatNotificationBody(body: string) {
  const trimmed = body.trim();
  if (!trimmed) return 'You have a new notification.';

  if (trimmed.startsWith('{"type":"RESULT_PUBLISHED"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.message) return String(parsed.message);
    } catch {
      return 'Results are now available. Open your dashboard to review.';
    }
  }

  return body;
}

function getAnnouncementRoute(role: UserRole | null) {
  switch (role) {
    case 'super_admin':
      return '/dashboard/super-admin/announcements';
    case 'school_admin':
      return '/dashboard/school-admin/announcements';
    case 'teacher':
      return '/dashboard/teacher/announcements';
    case 'parent':
      return '/dashboard/parent/announcements';
    case 'secretary':
      return '/dashboard/secretary/announcements';
    case 'finance_admin':
      return '/dashboard/finance-admin';
    default:
      return '/dashboard';
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function Navbar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [brandName, setBrandName] = useState('FutureLink');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const lastSeenTimestampRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const announcementsRoute = useMemo(() => getAnnouncementRoute(role), [role]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (audioContextRef.current) return audioContextRef.current;

    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;

    try {
      audioContextRef.current = new AudioCtor();
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  const playNotificationTone = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      // Keep UI stable if audio is unavailable.
    }
  }, [ensureAudioContext]);

  const maybeShowBrowserNotification = useCallback((item: NotificationItem) => {
    if (typeof window === 'undefined') return;
    if (document.visibilityState === 'visible') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(item.title || 'New Notification', {
        body: formatNotificationBody(item.body || ''),
      });
    } catch {
      // Ignore browser notification failures.
    }
  }, []);

  const registerPushSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!userId) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const keyResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
      if (!keyResponse.ok) return;
      const keyData = await keyResponse.json();
      if (!keyData?.enabled || !keyData?.publicKey) return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          appServerKey: urlBase64ToUint8Array(String(keyData.publicKey)),
        });
      }

      const payload = subscription.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Push subscription setup failed:', error);
    }
  }, [userId]);

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
        setRole((sessionUser?.role as UserRole) || null);
        setUserId(sessionUser?.id || null);
      } catch (error) {
        console.error('Failed to load navbar brand name:', error);
      }
    };

    loadBrandName();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlockSound = () => {
      const ctx = ensureAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => null);
      }
    };

    window.addEventListener('pointerdown', unlockSound, { once: true });
    return () => window.removeEventListener('pointerdown', unlockSound);
  }, [ensureAudioContext]);

  const syncNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) return;

      const data = await response.json();
      const notifications: NotificationItem[] = Array.isArray(data?.notifications) ? data.notifications : [];
      setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);

      const latestCreatedAt = notifications[0]?.created_at || null;
      const storageKey = `dashboard-last-notification-ts-${userId}`;

      if (!lastSeenTimestampRef.current) {
        lastSeenTimestampRef.current = window.localStorage.getItem(storageKey);
      }

      if (!lastSeenTimestampRef.current) {
        if (latestCreatedAt) {
          window.localStorage.setItem(storageKey, latestCreatedAt);
          lastSeenTimestampRef.current = latestCreatedAt;
        }
        notifications.forEach((item) => seenIdsRef.current.add(item.id));
        return;
      }

      const prevTs = new Date(lastSeenTimestampRef.current).getTime();
      const newItems = notifications
        .filter((item) => {
          const created = item.created_at ? new Date(item.created_at).getTime() : 0;
          return created > prevTs && !seenIdsRef.current.has(item.id);
        })
        .reverse();

      if (newItems.length > 0) {
        const newest = newItems[newItems.length - 1];
        setToast(newest);
        playNotificationTone();
        maybeShowBrowserNotification(newest);
      }

      notifications.forEach((item) => seenIdsRef.current.add(item.id));
      if (latestCreatedAt) {
        window.localStorage.setItem(storageKey, latestCreatedAt);
        lastSeenTimestampRef.current = latestCreatedAt;
      }
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  }, [maybeShowBrowserNotification, playNotificationTone, userId]);

  useEffect(() => {
    if (!userId) return;

    syncNotifications();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      registerPushSubscription();
    }

    const handleOnline = () => {
      syncNotifications();
    };

    const handleFocus = () => {
      syncNotifications();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    pollerRef.current = setInterval(() => {
      syncNotifications();
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [registerPushSubscription, syncNotifications, userId]);

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

  const handleOpenNotifications = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            registerPushSubscription();
          }
        })
        .catch(() => null);
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      registerPushSubscription();
    }
    router.push(announcementsRoute);
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
          <Button variant="ghost" size="icon" className="relative" onClick={handleOpenNotifications} title="Notifications">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1 text-[10px] leading-4">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
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

      {toast ? (
        <div className="pointer-events-none fixed right-3 top-20 z-50 w-[min(92vw,360px)]">
          <div className="pointer-events-auto rounded-xl border border-blue-100 bg-white p-3 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{toast.title || 'New Notification'}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{formatNotificationBody(toast.body || '')}</p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setToast(null)}>
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setToast(null);
                  handleOpenNotifications();
                }}
              >
                Open
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
