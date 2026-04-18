import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const teacherUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().min(1).optional(),
  password: z.string().min(6).optional(),
  oldPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().min(6).optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
  classIds: z.array(z.string().uuid()).optional(),
});

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
      where: { id: teacherId, role: 'teacher', deleted_at: null },
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
    const validation = teacherUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      password,
      oldPassword,
      newPassword,
      confirmPassword,
      subjectIds,
      classIds,
    } = validation.data;

    // Verify teacher exists and belongs to user's school
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'teacher', deleted_at: null }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!validateSchool(user, teacher.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof name === 'string') updateData.name = name;
    if (typeof email === 'string') updateData.email = email.trim() === '' ? null : email.trim();
    if (typeof phone === 'string') updateData.phone = phone;
    const legacyPassword = typeof password === 'string' && password.trim() !== '' ? password : undefined;
    const hasPasswordFlowFields =
      typeof oldPassword === 'string' ||
      typeof newPassword === 'string' ||
      typeof confirmPassword === 'string';

    if (hasPasswordFlowFields) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'Old password, new password, and confirm password are all required.' },
          { status: 400 }
        );
      }

      const oldMatches = await bcrypt.compare(oldPassword, teacher.password);
      if (!oldMatches) {
        return NextResponse.json({ error: 'Old password does not match.' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New password and confirm password do not match.' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    } else if (legacyPassword) {
      updateData.password = await bcrypt.hash(legacyPassword, 10);
    }

    const teacherSchoolId = teacher.school_id;
    if (!teacherSchoolId) {
      return NextResponse.json({ error: 'Teacher is not linked to a school.' }, { status: 400 });
    }

    if (subjectIds) {
      const validSubjects = await prisma.subject.findMany({
        where: {
          id: { in: subjectIds },
          school_id: teacherSchoolId,
        },
        select: { id: true },
      });

      if (validSubjects.length !== subjectIds.length) {
        return NextResponse.json({ error: 'One or more selected subjects are invalid for this school.' }, { status: 400 });
      }

      updateData.subjects = {
        set: subjectIds.map((id) => ({ id })),
      };
    }

    if (classIds) {
      const validClasses = await prisma.class.findMany({
        where: {
          id: { in: classIds },
          school_id: teacherSchoolId,
        },
        select: { id: true },
      });

      if (validClasses.length !== classIds.length) {
        return NextResponse.json({ error: 'One or more selected classes are invalid for this school.' }, { status: 400 });
      }
    }

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: teacherId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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
            },
          },
        },
      });

      if (classIds) {
        await tx.class.updateMany({
          where: {
            teacher_id: teacherId,
            school_id: teacherSchoolId,
          },
          data: { teacher_id: null },
        });

        if (classIds.length > 0) {
          await tx.class.updateMany({
            where: {
              id: { in: classIds },
              school_id: teacherSchoolId,
            },
            data: { teacher_id: teacherId },
          });
        }
      }

      if (!classIds) return updated;

      return tx.user.findUniqueOrThrow({
        where: { id: teacherId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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
            },
          },
        },
      });
    });

    return NextResponse.json(updatedTeacher);

  } catch (error: any) {
    console.error('Error updating teacher:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Phone or email already exists.' }, { status: 400 });
    }
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
      where: { id: teacherId, role: 'teacher', deleted_at: null }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!validateSchool(user, teacher.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: teacherId },
      data: { deleted_at: new Date() },
    });

    logAudit({
      prismaClient: prisma,
      schoolId: teacher.school_id ?? undefined,
      performedBy: user.id,
      actorRole: user.role,
      action: 'DELETE',
      entityType: 'Teacher',
      entityId: teacherId,
      ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    });

    return NextResponse.json({ message: 'Teacher deleted successfully' });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
