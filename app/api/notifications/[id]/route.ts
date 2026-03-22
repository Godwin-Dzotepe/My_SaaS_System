import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(
  async ({ session, params }) => {
    try {
      const notificationId = params?.id;
      if (!notificationId) {
        return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
      }

      const existing = await prisma.appNotification.findUnique({
        where: { id: notificationId },
      });

      if (!existing || existing.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
      }

      const updated = await prisma.appNotification.update({
        where: { id: notificationId },
        data: {
          is_read: true,
        },
      });

      return NextResponse.json({ success: true, notification: updated });
    } catch (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],
  }
);
