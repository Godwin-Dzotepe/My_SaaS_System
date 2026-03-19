import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const classes = await prisma.class.findMany({
      where: {
        school_id: user.schoolId || undefined,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            students: true,
          }
        }
      },
      orderBy: {
        class_name: 'asc',
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School information not found' }, { status: 400 });
    }

    const body = await req.json();
    const { class_name, teacher_id } = body;

    if (!class_name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        class_name,
        teacher_id: teacher_id || null,
        school_id: user.schoolId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    console.error('Error creating class:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A class with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
