'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, MessageSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type BannerKind = 'message' | 'notification' | 'event';

interface DashboardBannerItem {
  id: string;
  kind: BannerKind;
  title: string;
  body: string;
  href: string;
}

interface MessageItem {
  id: string;
  title: string;
  body: string;
  sender_role: string;
  direction: 'sent' | 'received';
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  source_role: string | null;
}

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
}

const BANNER_DELAY_MS = 3000;

function readSeenMap(role: 'teacher' | 'parent') {
  if (typeof window === 'undefined') {
    return { message: new Set<string>(), notification: new Set<string>(), event: new Set<string>() };
  }

  const parse = (kind: BannerKind) => {
    try {
      const raw = window.sessionStorage.getItem(`dashboard-banner-seen-${role}-${kind}`);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(ids);
    } catch {
      return new Set<string>();
    }
  };

  return {
    message: parse('message'),
    notification: parse('notification'),
    event: parse('event'),
  };
}

function persistSeen(role: 'teacher' | 'parent', kind: BannerKind, id: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const key = `dashboard-banner-seen-${role}-${kind}`;
  const seen = readSeenMap(role)[kind];
  seen.add(id);
  window.sessionStorage.setItem(key, JSON.stringify(Array.from(seen)));
}

export function useDashboardAlertBanner(role: 'teacher' | 'parent') {
  const [banner, setBanner] = React.useState<DashboardBannerItem | null>(null);
  const [queue, setQueue] = React.useState<DashboardBannerItem[]>([]);
  const revealTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const [messagesResponse, notificationsResponse, eventsResponse] = await Promise.all([
          fetch('/api/messages', { cache: 'no-store' }),
          fetch('/api/notifications', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
        ]);

        const [messagesData, notificationsData, eventsData] = await Promise.all([
          messagesResponse.json().catch(() => null),
          notificationsResponse.json().catch(() => null),
          eventsResponse.json().catch(() => null),
        ]);

        const messages: MessageItem[] = Array.isArray(messagesData?.messages) ? messagesData.messages : [];
        const notifications: NotificationItem[] = Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : [];
        const events: EventItem[] = Array.isArray(eventsData) ? eventsData : [];

        const seen = readSeenMap(role);

        const latestIncomingMessage = messages.find(
          (message) =>
            message.direction === 'received' &&
            (message.sender_role === 'school_admin' || message.sender_role === 'super_admin') &&
            !seen.message.has(message.id)
        );

        const latestIncomingNotification = notifications.find(
          (notification) =>
            (notification.source_role === 'school_admin' || notification.source_role === 'super_admin') &&
            !seen.notification.has(notification.id)
        );

        const latestIncomingEvent = events.find((event) => !seen.event.has(event.id));

        const nextQueue: DashboardBannerItem[] = [];

        if (latestIncomingMessage) {
          nextQueue.push({
            id: latestIncomingMessage.id,
            kind: 'message',
            title: latestIncomingMessage.title || 'New Message',
            body: latestIncomingMessage.body || 'You have a new message from your admin.',
            href: `/dashboard/${role}/messaging`,
          });
        }

        if (latestIncomingNotification) {
          nextQueue.push({
            id: latestIncomingNotification.id,
            kind: 'notification',
            title: latestIncomingNotification.title || 'New Notification',
            body: latestIncomingNotification.body || 'You have a new notification from your admin.',
            href: `/dashboard/${role}/announcements`,
          });
        }

        if (latestIncomingEvent) {
          nextQueue.push({
            id: latestIncomingEvent.id,
            kind: 'event',
            title: latestIncomingEvent.title || 'New Event',
            body: latestIncomingEvent.description || 'A new school event has been posted.',
            href: `/dashboard/${role}/events`,
          });
        }

        if (!cancelled && nextQueue.length > 0) {
          setQueue(nextQueue);
          revealTimerRef.current = setTimeout(() => {
            if (!cancelled) {
              setBanner(nextQueue[0]);
            }
          }, BANNER_DELAY_MS);
        }
      } catch (error) {
        console.error('Failed to load dashboard alert banner:', error);
      }
    };

    loadBanner();

    return () => {
      cancelled = true;
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [role]);

  const dismissBanner = React.useCallback(() => {
    setBanner((current) => {
      if (current) {
        persistSeen(role, current.kind, current.id);
      }
      return null;
    });
    setQueue((currentQueue) => {
      if (currentQueue.length <= 1) {
        return [];
      }

      const [, ...rest] = currentQueue;
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
      revealTimerRef.current = setTimeout(() => {
        setBanner(rest[0] || null);
      }, 250);

      return rest;
    });
  }, [role]);

  return {
    banner,
    dismissBanner,
  };
}

export function DashboardAlertBanner({
  banner,
  onClose,
}: {
  banner: DashboardBannerItem | null;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleView = () => {
    if (!banner) {
      return;
    }
    onClose();
    router.push(banner.href);
  };

  const Icon = banner?.kind === 'message' ? MessageSquare : banner?.kind === 'event' ? Calendar : Bell;
  const chipLabel = banner?.kind === 'message' ? 'Message' : banner?.kind === 'event' ? 'Event' : 'Notification';

  return (
    <AnimatePresence>
      {banner ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-5 right-5 z-50 w-[min(92vw,420px)] rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">{chipLabel}</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900">{banner.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{banner.body}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
            <Button type="button" size="sm" onClick={handleView}>
              View
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
