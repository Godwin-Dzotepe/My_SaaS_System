import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const individualPromotionSchema = z.object({
  student_id: z.string().uuid(),
  target_class_id: z.string().uuid(),
  school_id: z.string().uuid(),
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

    const { student_id, target_class_id } = validation.data;

    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { class: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!validateSchool(user, student.school_id)) {
      return NextResponse.json({ error: 'Unauthorized: Student does not belong to this school' }, { status: 403 });
    }

    if (student.class_id === target_class_id) {
      return NextResponse.json({ error: 'Student is already in this class' }, { status: 400 });
    }

    const targetClass = await prisma.class.findUnique({
      where: { id: target_class_id }
    });

    if (!targetClass || targetClass.school_id !== student.school_id) {
      return NextResponse.json({ error: 'Invalid target class' }, { status: 400 });
    }

    if (student.class.class_name === 'JHS 3') {
      await prisma.student.update({
        where: { id: student_id },
        data: { status: 'completed' }
      });

      await prisma.completedStudent.createMany({
        data: [{
          student_id,
          graduation_year: new Date().getFullYear()
        }],
        skipDuplicates: true
      });

      return NextResponse.json({
        message: 'Student has been marked as completed/graduated',
        status: 'graduated'
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: student_id },
      data: { class_id: target_class_id },
      include: { class: true }
    });

    return NextResponse.json({
      message: 'Student promoted successfully',
      student: updatedStudent,
      status: 'promoted'
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
        targetClassId: targetClass?.id
      };
    });

    return NextResponse.json(studentsWithOptions);
  } catch (error) {
    console.error('Error fetching students for promotion:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
