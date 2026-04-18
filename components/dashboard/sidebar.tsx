'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SchoolMark } from '@/components/branding/school-mark';
import { AiFloatChat } from '@/components/dashboard/ai-float-chat';
import type { SidebarItem } from '@/lib/sidebar-configs';

function getSettingsHref(role: string) {
  if (role === 'school-admin' || role === 'school_admin') return '/dashboard/school-admin/settings';
  if (role === 'teacher')    return '/dashboard/teacher/settings';
  if (role === 'parent')     return '/dashboard/parent/settings';
  if (role === 'secretary')  return '/dashboard/secretary/settings';
  if (role === 'super-admin' || role === 'super_admin') return '/dashboard/super-admin/settings';
  return '#';
}

interface SidebarProps {
  items: SidebarItem[];
  userRole: string;
  userName: string;
}

interface SidebarNotification {
  id: string;
  title: string;
  body: string;
  school_name?: string | null;
  source_name?: string | null;
  source_role?: string | null;
  is_read: boolean;
  created_at: string;
}

function formatTimeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Sidebar({ items, userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(() => {
    // Auto-open any group whose child matches the current path
    const open = new Set<string>();
    for (const item of items) {
      if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        open.add(item.label);
      }
    }
    return open;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };
  const [brandName, setBrandName] = React.useState('FutureLink');
  const [brandLogoUrl, setBrandLogoUrl] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState<SidebarNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notificationError, setNotificationError] = React.useState('');
  const [notificationPermission, setNotificationPermission] = React.useState<'default' | 'denied' | 'granted' | 'unsupported'>('unsupported');
  const [schoolAdminAiEnabled, setSchoolAdminAiEnabled] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadBrandName = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();
        const sessionUser = data?.user;
        const schoolName = sessionUser?.schoolName;
        const schoolLogoUrl = sessionUser?.schoolLogoUrl || null;
        const role = sessionUser?.role || userRole;

        if (!isMounted) return;

        const resolvedBrandName = role !== 'super_admin' && schoolName ? schoolName : 'FutureLink';
        setBrandName(resolvedBrandName);
        setBrandLogoUrl(role !== 'super_admin' ? schoolLogoUrl : null);
      } catch (error) {
        console.error('Failed to load dashboard brand name:', error);
      }
    };

    loadBrandName();

    return () => {
      isMounted = false;
    };
  }, [userRole]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);

    if (Notification.permission === 'default') {
      Notification.requestPermission()
        .then((permission) => setNotificationPermission(permission))
        .catch(() => setNotificationPermission('default'));
    }
  }, []);

  const fetchNotifications = React.useCallback(async (allowBrowserAlert: boolean) => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        setNotificationError('');
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch notifications.');
      }

      const nextNotifications = Array.isArray(data?.notifications) ? data.notifications : [];
      const nextUnreadCount = typeof data?.unreadCount === 'number'
        ? data.unreadCount
        : nextNotifications.filter((notification: SidebarNotification) => !notification.is_read).length;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      setNotificationError('');

      if (typeof window === 'undefined') {
        return;
      }

      const sessionKey = `seen-notifications-${userRole}`;
      const storedRaw = window.sessionStorage.getItem(sessionKey);
      const storedIds = storedRaw ? new Set<string>(JSON.parse(storedRaw) as string[]) : null;
      const currentIds = nextNotifications.map((notification: SidebarNotification) => notification.id);

      if (storedIds && allowBrowserAlert && 'Notification' in window && Notification.permission === 'granted') {
        nextNotifications
          .filter((notification: SidebarNotification) => !storedIds.has(notification.id) && !notification.is_read)
          .slice()
          .reverse()
          .forEach((notification: SidebarNotification) => {
            const title = `${notification.school_name || brandName}: ${notification.title}`;
            const body = notification.source_name
              ? `${notification.source_name} - ${notification.body}`
              : notification.body;

            new Notification(title, {
              body,
            });
          });
      }

      window.sessionStorage.setItem(sessionKey, JSON.stringify(currentIds.slice(0, 100)));
    } catch (error) {
      console.error('Failed to fetch sidebar notifications:', error);
      setNotificationError(error instanceof Error ? error.message : 'Failed to fetch notifications.');
    }
  }, [brandName, userRole]);

  React.useEffect(() => {
    fetchNotifications(false);
    const intervalId = window.setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications, pathname]);

  React.useEffect(() => {
    let mounted = true;

    const fetchSchoolAdminAiStatus = async () => {
      if (userRole !== 'school-admin') return;

      try {
        const response = await fetch('/api/dashboard/ai/overview', { cache: 'no-store' });
        const data = await response.json().catch(() => null);

        if (!mounted) return;
        if (!response.ok) {
          setSchoolAdminAiEnabled(false);
          return;
        }

        setSchoolAdminAiEnabled(Boolean(data?.aiEnabled));
      } catch (error) {
        console.error('Failed to fetch school admin AI status:', error);
        if (mounted) {
          setSchoolAdminAiEnabled(false);
        }
      }
    };

    fetchSchoolAdminAiStatus();

    return () => {
      mounted = false;
    };
  }, [userRole, pathname]);

  const showSuperAdminAi = userRole === 'super-admin';
  const showSchoolAdminAi = userRole === 'school-admin' && schoolAdminAiEnabled;

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update notification.');
      }

      setNotifications((currentNotifications) => currentNotifications.map((notification) => (
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-md lg:hidden"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-blue-800 bg-blue-700 text-white transition-transform duration-200 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex min-h-16 items-center border-b border-blue-600 px-6 py-3">
            <div className="flex items-center gap-3">
              <SchoolMark
                logoUrl={brandLogoUrl}
                schoolName={brandName}
                className="h-11 w-11 rounded-2xl border border-blue-100/30 bg-white"
                imageClassName="object-contain p-1.5"
              />
              <div className="min-w-0">
                <span className="block truncate text-base font-bold text-white">{brandName}</span>
                <span className="block text-[11px] uppercase tracking-[0.25em] text-blue-200">
                  {userRole === 'super_admin' ? 'Platform' : 'School Portal'}
                </span>
              </div>
            </div>
          </div>

          <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {items.map((item, idx) => {
              // ── Category header ─────────────────────────────────────────
              if (item.category) {
                return (
                  <p key={`cat-${idx}`} className="mt-4 mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-blue-300/70 first:mt-0">
                    {item.label}
                  </p>
                );
              }

              // ── Dropdown group ───────────────────────────────────────────
              if (item.children) {
                const isGroupActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
                const isOpen = openGroups.has(item.label) || isGroupActive;
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isGroupActive
                          ? 'bg-blue-600/80 text-white'
                          : 'text-blue-100 hover:bg-blue-600/60 hover:text-white'
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="ml-3 mt-0.5 border-l border-blue-500/40 pl-3 space-y-0.5">
                        {item.children.map(child => {
                          const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                                isChildActive
                                  ? 'bg-blue-500 text-white font-semibold'
                                  : 'text-blue-200 hover:bg-blue-600/50 hover:text-white'
                              )}
                            >
                              {child.icon && <span className="shrink-0 opacity-80">{child.icon}</span>}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Regular link ─────────────────────────────────────────────
              const isActive = pathname === item.href || (item.href ? pathname.startsWith(item.href + '/') : false);
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-100 hover:bg-blue-600/60 hover:text-white'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-blue-600 px-4 py-3">
            <button
              onClick={() => setIsNotificationsOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-lg bg-blue-600/60 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-blue-900">{unreadCount}</span>
              ) : (
                <span className="text-xs text-blue-100">View</span>
              )}
            </button>

            {isNotificationsOpen ? (
              <div className="mt-3 space-y-3 rounded-xl border border-blue-500 bg-blue-800/70 p-3 shadow-lg">
                {notificationPermission === 'default' ? (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'Notification' in window) {
                        Notification.requestPermission()
                          .then((permission) => setNotificationPermission(permission))
                          .catch(() => setNotificationPermission('default'));
                      }
                    }}
                    className="w-full rounded-lg border border-blue-400 bg-blue-700 px-3 py-2 text-left text-xs text-blue-50 hover:bg-blue-600"
                  >
                    Allow browser alerts so new messages can appear like app notifications.
                  </button>
                ) : null}

                {notificationError ? (
                  <div className="rounded-lg border border-rose-300 bg-rose-500/20 px-3 py-2 text-xs text-rose-100">{notificationError}</div>
                ) : null}

                {notifications.length === 0 ? (
                  <div className="rounded-lg border border-blue-500 bg-blue-700/40 px-3 py-4 text-center text-sm text-blue-100">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          if (!notification.is_read) {
                            markNotificationAsRead(notification.id);
                          }
                        }}
                        className={cn(
                          'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                          notification.is_read
                            ? 'border-blue-500 bg-blue-700/40 text-blue-100'
                            : 'border-amber-300/50 bg-amber-400/15 text-white'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold">{notification.title}</p>
                            <p className="line-clamp-2 text-xs text-blue-100/90">{notification.body}</p>
                            <p className="text-[11px] text-blue-200">
                              {[notification.school_name, notification.source_name].filter(Boolean).join(' - ') || 'System message'}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-blue-200">{formatTimeAgo(notification.created_at)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="bg-blue-800/30 p-4">
            <Link
              href={getSettingsHref(userRole)}
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-blue-600/60 bg-blue-900/15 px-3 py-3 hover:bg-blue-700/40 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-blue-700 shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{userName}</p>
                <p className="truncate text-xs capitalize text-blue-200">{userRole.replace('_', ' ')}</p>
              </div>
              <Settings className="w-4 h-4 text-blue-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </aside>

      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      {showSuperAdminAi ? (
        <AiFloatChat
          title="Super Admin AI"
          askEndpoint="/api/super-admin/ai/ask"
          placeholder="Ask about schools, users, revenue, or system health"
          allowTelegram
        />
      ) : null}

      {showSchoolAdminAi ? (
        <AiFloatChat
          title="School AI Assistant"
          askEndpoint="/api/dashboard/ai/ask"
          placeholder="Ask about attendance, fees, or operations"
        />
      ) : null}
    </>
  );
}

