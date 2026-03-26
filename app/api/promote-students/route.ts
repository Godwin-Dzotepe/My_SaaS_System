import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const promoteByClassSchema = z.object({
  school_id: z.string().uuid(),
  from_class_id: z.string().uuid(),
  to_class_id: z.string().uuid(),
  repeated_student_ids: z.array(z.string().uuid()).default([]),
  note: z.string().trim().max(300).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id');
    const fromClassId = searchParams.get('from_class_id');
    const school_id = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    if (!school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 });
    }

    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const classes = await prisma.class.findMany({
      where: { school_id },
      select: { id: true, class_name: true },
      orderBy: { class_name: 'asc' },
    });

    if (!fromClassId) {
      return NextResponse.json({ classes, students: [] });
    }

    const fromClass = classes.find((item) => item.id === fromClassId);
    if (!fromClass) {
      return NextResponse.json({ error: 'Invalid from class.' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        school_id,
        class_id: fromClassId,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        student_number: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      classes,
      students,
      from_class: fromClass,
    });
  } catch (error) {
    console.error('Error loading promotion data:', error);
    return NextResponse.json({ error: 'Failed to load promotion data.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = promoteByClassSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const { school_id: requestedSchoolId, from_class_id, to_class_id, repeated_student_ids, note } = validation.data;
    const school_id = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    if (!school_id) {
      return NextResponse.json({ error: 'School not found for this user.' }, { status: 400 });
    }

    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (from_class_id === to_class_id) {
      return NextResponse.json({ error: 'From class and to class cannot be the same.' }, { status: 400 });
    }

    const [fromClass, toClass] = await Promise.all([
      prisma.class.findUnique({ where: { id: from_class_id }, select: { id: true, class_name: true, school_id: true } }),
      prisma.class.findUnique({ where: { id: to_class_id }, select: { id: true, class_name: true, school_id: true } }),
    ]);

    if (!fromClass || fromClass.school_id !== school_id) {
      return NextResponse.json({ error: 'Invalid source class.' }, { status: 400 });
    }

    if (!toClass || toClass.school_id !== school_id) {
      return NextResponse.json({ error: 'Invalid destination class.' }, { status: 400 });
    }

    const studentsInFromClass = await prisma.student.findMany({
      where: {
        school_id,
        class_id: from_class_id,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (studentsInFromClass.length === 0) {
      return NextResponse.json({ error: 'No active students found in selected class.' }, { status: 400 });
    }

    const studentIdSet = new Set(studentsInFromClass.map((student) => student.id));
    const repeatSet = new Set(repeated_student_ids.filter((id) => studentIdSet.has(id)));

    const promotedStudents = studentsInFromClass.filter((student) => !repeatSet.has(student.id));
    const repeatedStudents = studentsInFromClass.filter((student) => repeatSet.has(student.id));

    await prisma.$transaction(async (tx: Tx) => {
      if (promotedStudents.length > 0) {
        await tx.student.updateMany({
          where: {
            id: { in: promotedStudents.map((student) => student.id) },
            school_id,
            class_id: from_class_id,
            status: 'active',
          },
          data: {
            class_id: to_class_id,
          },
        });
      }

      const historyRows = [
        ...promotedStudents.map((student) => ({
          school_id,
          student_id: student.id,
          from_class_id,
          to_class_id,
          action: 'PROMOTED' as const,
          note: note || `Class promotion from ${fromClass.class_name} to ${toClass.class_name}.`,
          performed_by: user.id,
        })),
        ...repeatedStudents.map((student) => ({
          school_id,
          student_id: student.id,
          from_class_id,
          to_class_id: from_class_id,
          action: 'REPEATED' as const,
          note: note || `Marked to repeat ${fromClass.class_name}.`,
          performed_by: user.id,
        })),
      ];

      if (historyRows.length > 0) {
        await tx.studentPromotionHistory.createMany({
          data: historyRows,
        });
      }
    });

    return NextResponse.json({
      message: 'Promotion completed successfully.',
      from_class: fromClass.class_name,
      to_class: toClass.class_name,
      promoted_count: promotedStudents.length,
      repeated_count: repeatedStudents.length,
      total_processed: studentsInFromClass.length,
    });
  } catch (error) {
    console.error('Error promoting students by class:', error);
    return NextResponse.json({ error: 'Promotion failed' }, { status: 500 });
  }
}
