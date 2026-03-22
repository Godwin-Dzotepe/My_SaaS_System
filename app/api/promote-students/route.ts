import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const promotionSchema = z.object({
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
    const validation = promotionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const requestedSchoolId = validation.data.school_id;
    const school_id = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    if (!school_id) {
      return NextResponse.json({ error: 'School not found for this user' }, { status: 400 });
    }

    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        school_id,
        status: 'active'
      },
      include: {
        class: true
      }
    });

    const completions: string[] = [];
    const allClasses = await prisma.class.findMany({
      where: { school_id }
    });
    const classMap = new Map(allClasses.map((schoolClass) => [schoolClass.class_name, schoolClass.id]));

    for (const student of students) {
      const currentClassName = student.class.class_name;
      if (currentClassName === 'JHS 3') {
        completions.push(student.id);
      }
    }

    await prisma.$transaction(async (tx) => {
      if (completions.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: completions } },
          data: { status: 'completed' }
        });

        await tx.completedStudent.createMany({
          data: completions.map((id) => ({
            student_id: id,
            graduation_year: new Date().getFullYear()
          })),
          skipDuplicates: true
        });
      }

      for (const [current, next] of Object.entries(CLASS_PROGRESSION)) {
        const targetClassId = classMap.get(next);
        const sourceClassId = classMap.get(current);

        if (targetClassId && sourceClassId) {
          await tx.student.updateMany({
            where: {
              school_id,
              class_id: sourceClassId,
              status: 'active'
            },
            data: {
              class_id: targetClassId
            }
          });
        }
      }
    });

    return NextResponse.json({
      message: 'Promotion cycle completed',
      graduated: completions.length,
      promoted_batches: Object.keys(CLASS_PROGRESSION).length
    });
  } catch (error) {
    console.error('Error promoting students:', error);
    return NextResponse.json({ error: 'Promotion failed' }, { status: 500 });
  }
}
