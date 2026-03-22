import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(
  async ({ session }) => {
    try {
      const [notifications, unreadCount] = await Promise.all([
        prisma.appNotification.findMany({
          where: {
            user_id: session.user.id,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 20,
        }),
        prisma.appNotification.count({
          where: {
            user_id: session.user.id,
            is_read: false,
          },
        }),
      ]);

      return NextResponse.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],
  }
);
