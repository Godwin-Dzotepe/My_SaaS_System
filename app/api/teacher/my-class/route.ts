import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['teacher']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId) {
        return NextResponse.json({ error: 'School ID missing from token' }, { status: 400 });
    }

    const teacherClass = await prisma.class.findFirst({
      where: {
        teacher_id: user.userId,
        school_id: user.schoolId
      },
      include: {
        students: {
          where: { status: 'active' },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!teacherClass) {
      return NextResponse.json({ error: 'No class assigned to this teacher' }, { status: 404 });
    }

    return NextResponse.json(teacherClass);
  } catch (error: any) {
    console.error('My Class fetch error:', error);
    return NextResponse.json({ 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
