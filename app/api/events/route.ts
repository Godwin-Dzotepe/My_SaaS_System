import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { z } from 'zod';
import { sendSchoolBroadcastToParents } from '@/lib/school-broadcast';

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  school_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin', 'teacher', 'parent', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || user.school_id;

    if (!schoolId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: {
        school_id: schoolId || undefined,
      },
      include: {
        creator: {
          select: { name: true }
        }
      },
      orderBy: {
        start_date: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const resolvedSchoolId = user.role === 'super_admin'
      ? validation.data.school_id
      : user.school_id;
    const { title, description, start_date, end_date } = validation.data;

    if (!resolvedSchoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 });
    }

    if (!validateSchool(user, resolvedSchoolId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        school_id: resolvedSchoolId,
        created_by: user.id,
      },
    });

    const smsMessage = [
      `Event: ${title}`,
      description?.trim() || null,
      `Starts: ${new Date(start_date).toLocaleString()}`,
      `Ends: ${new Date(end_date).toLocaleString()}`,
    ].filter(Boolean).join('\n');

    const smsResult = await sendSchoolBroadcastToParents(resolvedSchoolId, smsMessage);

    return NextResponse.json({ ...event, sms: smsResult }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
