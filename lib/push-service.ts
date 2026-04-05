import { listPushSubscriptionsByUserIds, removePushSubscription } from '@/lib/push-subscriptions-store';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

type WebPushModule = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<void>;
};

let cachedWebPush: WebPushModule | null = null;
let initialized = false;

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  return { publicKey, privateKey, subject };
}

async function getWebPushModule() {
  if (cachedWebPush) return cachedWebPush;

  try {
    const mod = (await import('web-push')) as unknown as WebPushModule;
    cachedWebPush = mod;
    return mod;
  } catch {
    return null;
  }
}

async function ensureWebPushConfigured() {
  if (initialized) return true;

  const webPush = await getWebPushModule();
  if (!webPush) return false;

  const { publicKey, privateKey, subject } = getVapidConfig();
  if (!publicKey || !privateKey) return false;

  webPush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
  return true;
}

function isPushEnabled() {
  const { publicKey, privateKey } = getVapidConfig();
  return Boolean(publicKey && privateKey);
}

export function getPushPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!isPushEnabled()) return;

  const configured = await ensureWebPushConfigured();
  const webPush = await getWebPushModule();
  if (!configured || !webPush) return;

  const subs = await listPushSubscriptionsByUserIds(userIds);
  if (subs.length === 0) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/dashboard',
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          message
        );
      } catch (error) {
        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription({ endpoint: sub.endpoint });
        }
      }
    })
  );
}

