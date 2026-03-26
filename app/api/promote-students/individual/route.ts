import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const individualPromotionSchema = z.object({
  student_id: z.string().uuid(),
  target_class_id: z.string().uuid().optional().nullable(),
  school_id: z.string().uuid(),
  action: z.enum(['promote', 'repeat', 'graduate']).default('promote'),
  note: z.string().trim().max(300).optional().nullable(),
});

const CLASS_PROGRESSION: Record<string, string> = {
  'Class 1': 'Class 2',
  'Class 2': 'Class 3',
  'Class 3': 'Class 4',
  'Class 4': 'Class 5',
  'Class 5': 'Class 6',
  'Class 6': 'JHS 1',
  'JHS 1': 'JHS 2',
  'JHS 2': 'JHS 3',
};

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = individualPromotionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { student_id, target_class_id, school_id: requestedSchoolId, action, note } = validation.data;

    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const effectiveSchoolId = user.role === 'super_admin' ? requestedSchoolId : user.school_id;
    if (!effectiveSchoolId || !validateSchool(user, effectiveSchoolId) || student.school_id !== effectiveSchoolId) {
      return NextResponse.json({ error: 'Unauthorized: Student does not belong to this school' }, { status: 403 });
    }

    if (action === 'repeat') {
      await prisma.studentPromotionHistory.create({
        data: {
          school_id: student.school_id,
          student_id: student.id,
          from_class_id: student.class_id,
          to_class_id: student.class_id,
          action: 'REPEATED',
          note: note || 'Admin marked student to repeat current class.',
          performed_by: user.id,
        },
      });

      return NextResponse.json({
        message: `${student.name} marked to repeat ${student.class.class_name}.`,
        student,
        status: 'repeated',
      });
    }

    if (action === 'graduate') {
      if (student.class.class_name !== 'JHS 3') {
        return NextResponse.json(
          { error: 'Only final-class students can be graduated.' },
          { status: 400 }
        );
      }

      const graduationYear = new Date().getFullYear();

      await prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: { id: student_id },
          data: { status: 'completed' },
        });

        await tx.completedStudent.createMany({
          data: [
            {
              student_id,
              graduation_year: graduationYear,
            },
          ],
          skipDuplicates: true,
        });

        await tx.studentPromotionHistory.create({
          data: {
            school_id: student.school_id,
            student_id: student.id,
            from_class_id: student.class_id,
            to_class_id: null,
            action: 'GRADUATED',
            note: note || 'Admin graduated student.',
            performed_by: user.id,
          },
        });
      });

      return NextResponse.json({
        message: `${student.name} has been marked as completed/graduated.`,
        status: 'graduated',
      });
    }

    const nextClassName = CLASS_PROGRESSION[student.class.class_name];
    const resolvedTargetClassId = target_class_id || null;

    if (!resolvedTargetClassId && !nextClassName) {
      return NextResponse.json(
        { error: 'No next class found for this student. Use graduate or repeat.' },
        { status: 400 }
      );
    }

    const targetClass = resolvedTargetClassId
      ? await prisma.class.findUnique({
          where: { id: resolvedTargetClassId },
        })
      : await prisma.class.findFirst({
          where: {
            school_id: student.school_id,
            class_name: nextClassName,
          },
        });

    if (!targetClass || targetClass.school_id !== student.school_id) {
      return NextResponse.json({ error: 'Invalid target class' }, { status: 400 });
    }

    if (student.class_id === targetClass.id) {
      return NextResponse.json({ error: 'Student is already in this class' }, { status: 400 });
    }

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const result = await tx.student.update({
        where: { id: student_id },
        data: { class_id: targetClass.id },
        include: { class: true },
      });

      await tx.studentPromotionHistory.create({
        data: {
          school_id: student.school_id,
          student_id: student.id,
          from_class_id: student.class_id,
          to_class_id: targetClass.id,
          action: 'PROMOTED',
          note: note || `Admin promoted student to ${targetClass.class_name}.`,
          performed_by: user.id,
        },
      });

      return result;
    });

    return NextResponse.json({
      message: `${student.name} promoted to ${updatedStudent.class.class_name}.`,
      student: updatedStudent,
      status: 'promoted',
    });
  } catch (error) {
    console.error('Error promoting individual student:', error);
    return NextResponse.json({ error: 'Promotion failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id');
    const class_id = searchParams.get('class_id');
    const school_id = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    if (!school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 });
    }

    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        school_id,
        status: 'active',
        ...(class_id ? { class_id } : {})
      },
      include: {
        class: true
      },
      orderBy: { name: 'asc' }
    });

    const classes = await prisma.class.findMany({
      where: { school_id },
      orderBy: { class_name: 'asc' }
    });

    const studentsWithOptions = students.map((student) => {
      const currentClassName = student.class.class_name;
      const nextClassName = CLASS_PROGRESSION[currentClassName];
      const targetClass = classes.find((schoolClass) => schoolClass.class_name === nextClassName);

      return {
        ...student,
        canPromote: !!nextClassName || currentClassName === 'JHS 3',
        isGraduating: currentClassName === 'JHS 3',
        nextClassName: nextClassName || 'Completed',
        targetClassId: targetClass?.id,
        canRepeat: true,
        currentClassId: student.class_id,
      };
    });

    return NextResponse.json(studentsWithOptions);
  } catch (error) {
    console.error('Error fetching students for promotion:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
