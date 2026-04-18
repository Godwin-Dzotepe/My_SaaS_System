import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { z } from 'zod';

const entrySchema = z.object({
  class_id:     z.string().uuid(),
  subject_id:   z.string().uuid(),
  teacher_id:   z.string().uuid().nullable().optional(),
  day_of_week:  z.number().int().min(1).max(5),
  period_number:z.number().int().min(1).max(12),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  room:         z.string().trim().optional().nullable(),
});

// GET /api/timetable?class_id=xxx  OR  ?teacher_id=xxx
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'teacher', 'secretary', 'parent', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const class_id   = searchParams.get('class_id');
    const teacher_id = searchParams.get('teacher_id');

    if (!class_id && !teacher_id) {
      return NextResponse.json({ error: 'Provide class_id or teacher_id' }, { status: 400 });
    }

    const entries = await prisma.timetableEntry.findMany({
      where: {
        ...(class_id   ? { class_id }   : {}),
        ...(teacher_id ? { teacher_id } : {}),
        school_id: user.school_id ?? undefined,
      },
      include: {
        subject: { select: { id: true, subject_name: true } },
        teacher: { select: { id: true, name: true } },
        class:   { select: { id: true, class_name: true } },
      },
      orderBy: [{ day_of_week: 'asc' }, { period_number: 'asc' }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('GET /api/timetable:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

// POST /api/timetable — upsert (insert or replace) an entry
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = entrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const { class_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room } = validation.data;

    // Verify class belongs to this school
    const cls = await prisma.class.findFirst({ where: { id: class_id, school_id: user.school_id ?? undefined } });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const entry = await prisma.timetableEntry.upsert({
      where: { class_id_day_of_week_period_number: { class_id, day_of_week, period_number } },
      create: {
        school_id: user.school_id!,
        class_id, subject_id, teacher_id: teacher_id ?? null,
        day_of_week, period_number, start_time, end_time, room: room ?? null,
      },
      update: { subject_id, teacher_id: teacher_id ?? null, start_time, end_time, room: room ?? null },
      include: {
        subject: { select: { id: true, subject_name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('POST /api/timetable:', error);
    return NextResponse.json({ error: 'Failed to save timetable entry' }, { status: 500 });
  }
}
