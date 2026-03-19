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

    const { id: classId } = await params;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
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
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (!validateSchool(user, classData.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(classData);

  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
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

    const { id: classId } = await params;
    const body = await req.json();
    const { class_name, teacher_id } = body;

    // Verify class exists and belongs to user's school
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (!validateSchool(user, classData.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        class_name: class_name || classData.class_name,
        teacher_id: teacher_id || null,
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
      }
    });

    return NextResponse.json(updatedClass);

  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
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

    const { id: classId } = await params;

    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (!validateSchool(user, classData.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.class.delete({
      where: { id: classId }
    });

    return NextResponse.json({ message: 'Class deleted successfully' });

  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
