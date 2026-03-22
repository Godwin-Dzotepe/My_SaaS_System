import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: teacherId } = await params;

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'teacher' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        school_id: true,
        created_at: true,
        school: {
          select: {
            id: true,
            school_name: true,
            address: true,
            phone: true,
          },
        },
        subjects: {
          select: {
            id: true,
            subject_name: true,
          },
        },
        classes: {
          select: {
            id: true,
            class_name: true,
            students: {
              where: {
                status: 'active',
              },
              select: {
                id: true,
                name: true,
              },
            },
          }
        },
        homework: {
          select: {
            id: true,
            title: true,
            due_date: true,
            created_at: true,
            class: {
              select: {
                id: true,
                class_name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        teacherAttendance: {
          select: {
            id: true,
            date: true,
            status: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!validateSchool(user, teacher.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(teacher);

  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: teacherId } = await params;
    const body = await req.json();
    const { name, email, phone } = body;

    // Verify teacher exists and belongs to user's school
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'teacher' }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!validateSchool(user, teacher.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update teacher
    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        name: name || teacher.name,
        email: email || teacher.email,
        phone: phone || teacher.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        classes: {
          select: {
            id: true,
            class_name: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTeacher);

  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: teacherId } = await params;

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'teacher' }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!validateSchool(user, teacher.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: teacherId }
    });

    return NextResponse.json({ message: 'Teacher deleted successfully' });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
