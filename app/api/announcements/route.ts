import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const announcementSchema = z.object({
  school_id: z.string().uuid(),
  message: z.string().min(5),
  created_by: z.string().uuid(), // ID of the user (admin) sending it
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = announcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { school_id, message, created_by } = validation.data;

    // Verify user exists and belongs to the school
    const user = await prisma.user.findUnique({
        where: { id: created_by }
    });

    if (!user || user.school_id !== school_id) {
        return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        school_id,
        message,
        created_by
      }
    });

    // TODO: Trigger SMS/Email API here (e.g. Twilio, SendGrid) to parents linked to this school

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
