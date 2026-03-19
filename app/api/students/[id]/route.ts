import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  student_number: z.string().optional(),
  class_id: z.string().uuid().optional(),
  parent_phone: z.string().min(10).optional(),
  status: z.enum(['active', 'completed']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            id: true,
            class_name: true,
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!validateSchool(user, student.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(student);

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: studentId } = await params;
    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    // 1. Fetch student to check school ownership
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!validateSchool(user, student.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Update Student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: validation.data
    });

    return NextResponse.json(updatedStudent);

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
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

    const { id: studentId } = await params;
    const body = await req.json();

    // 1. Fetch student to check school ownership
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!validateSchool(user, student.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Update Student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name: body.name || student.name,
        parent_phone: body.parent_phone || student.parent_phone,
        student_number: body.student_number || student.student_number,
        class_id: body.class_id || student.class_id,
        status: body.status || student.status,
      }
    });

    return NextResponse.json(updatedStudent);

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!validateSchool(user, student.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.student.delete({
      where: { id: studentId }
    });

    return NextResponse.json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
