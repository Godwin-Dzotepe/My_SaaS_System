import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const updateMessageSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  body: z.string().min(1, 'Message body is required.'),
});

export const PATCH = withAuth(
  async ({ req, session, params }) => {
    try {
      const messageId = params?.id;
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID is required.' }, { status: 400 });
      }

      const body = await req.json();
      const validation = updateMessageSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input.', details: validation.error.format() }, { status: 400 });
      }

      const existing = await prisma.appMessage.findUnique({
        where: { id: messageId },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }

      if (existing.sender_id !== session.user.id) {
        return NextResponse.json({ error: 'Only the sender can edit this message.' }, { status: 403 });
      }

      const updated = await prisma.appMessage.update({
        where: { id: messageId },
        data: {
          title: validation.data.title.trim(),
          body: validation.data.body.trim(),
          is_edited: true,
          edited_at: new Date(),
        },
      });

      await prisma.appNotification.updateMany({
        where: {
          message_id: messageId,
        },
        data: {
          title: updated.title,
          body: updated.body,
        },
      });

      return NextResponse.json({ success: true, message: updated });
    } catch (error) {
      console.error('Error editing message:', error);
      return NextResponse.json({ error: 'Failed to edit message.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent'],
  }
);

export const DELETE = withAuth(
  async ({ session, params }) => {
    try {
      const messageId = params?.id;
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID is required.' }, { status: 400 });
      }

      const existing = await prisma.appMessage.findUnique({
        where: { id: messageId },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }

      if (existing.sender_id !== session.user.id) {
        return NextResponse.json({ error: 'Only the sender can delete this message.' }, { status: 403 });
      }

      await prisma.$transaction([
        prisma.appNotification.deleteMany({
          where: {
            message_id: messageId,
          },
        }),
        prisma.appMessage.delete({
          where: { id: messageId },
        }),
      ]);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: 'Failed to delete message.' }, { status: 500 });
    }
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent'],
  }
);
