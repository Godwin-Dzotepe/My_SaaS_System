import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { removePushSubscription, upsertPushSubscription } from '@/lib/push-subscriptions-store';

interface SubscriptionBody {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      const body = (await req.json()) as SubscriptionBody;
      if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
        return NextResponse.json({ error: 'Invalid subscription payload.' }, { status: 400 });
      }

      await upsertPushSubscription({
        userId: session.user.id,
        endpoint: body.endpoint,
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to save push subscription:', error);
      return NextResponse.json({ error: 'Failed to save push subscription.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],
  }
);

export const DELETE = withAuth(
  async ({ req, session }) => {
    try {
      const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
      await removePushSubscription({
        userId: session.user.id,
        endpoint: body?.endpoint,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
      return NextResponse.json({ error: 'Failed to remove push subscription.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],
  }
);

