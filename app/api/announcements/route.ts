import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import { sendSchoolBroadcastToParents } from '@/lib/school-broadcast';

const announcementSchema = z.object({
  school_id: z.string().uuid().optional(),
  message: z.string().min(5),
  created_by: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'teacher', 'parent', 'finance_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id');
    const schoolId = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    const announcements = await prisma.announcement.findMany({
      where: user.role === 'super_admin' && !schoolId
        ? { school_id: null }
        : {
            OR: [
              { school_id: schoolId || undefined },
              { school_id: null },
            ],
          },
      include: {
        creator: {
          select: { name: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = announcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const resolvedSchoolId = user.role === 'super_admin'
      ? validation.data.school_id
      : user.school_id;
    const { message } = validation.data;

    if (!resolvedSchoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    if (!validateSchool(user, resolvedSchoolId)) {
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    const sender = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, school_id: true },
    });

    if (!sender || !validateSchool(user, sender.school_id) || sender.school_id !== resolvedSchoolId) {
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        school_id: resolvedSchoolId,
        message,
        created_by: sender.id,
      }
    });

    const smsResult = await sendSchoolBroadcastToParents(resolvedSchoolId, message);

    return NextResponse.json({ ...newAnnouncement, sms: smsResult }, { status: 201 });
  } catch (error) {
    console.error('Error sending announcement:', error);
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 });
  }
}
