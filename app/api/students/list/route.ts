import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin', 'teacher', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        school_id: user.school_id || undefined,
      },
      include: {
        class: {
          select: {
            id: true,
            class_name: true,
          }
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
