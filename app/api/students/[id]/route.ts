import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limiter';
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
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin', 'teacher']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: studentId } = await params;

    const student = await prisma.student.findFirst({
      where: { id: studentId, deleted_at: null },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            schoolFees: {
              where: {
                is_active: true,
              },
              orderBy: [
                { academic_year: 'desc' },
                { term: 'desc' },
                { due_date: 'asc' },
              ],
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            image: true,
            created_at: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
            address: true,
            phone: true,
          },
        },
        scores: {
          include: {
            subject: {
              select: {
                id: true,
                subject_name: true,
              },
            },
          },
          orderBy: [
            { academic_year: 'desc' },
            { term: 'desc' },
            { created_at: 'desc' },
          ],
        },
        attendance: {
          orderBy: {
            date: 'desc',
          },
        },
        payments: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        completed_records: true,
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

    logAudit({
      prismaClient: prisma,
      schoolId:     user.school_id ?? undefined,
      performedBy:  user.id,
      actorRole:    user.role,
      action:       'UPDATE',
      entityType:   'Student',
      entityId:     studentId,
      changes:      { before: student as Record<string, unknown>, after: validation.data as Record<string, unknown> },
      ipAddress:    getClientIp(req),
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

    const str = (v: unknown) => (typeof v === 'string' ? v.trim() || null : undefined);
    const dateOrUndef = (v: unknown) => (typeof v === 'string' && v ? new Date(v) : undefined);

    // 2. Update Student — all editable fields
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        // Core
        name:                         body.name?.trim()   || student.name,
        student_number:               str(body.student_number)  ?? student.student_number,
        class_id:                     body.class_id       || student.class_id,
        status:                       body.status         || student.status,
        // Personal
        date_of_birth:                dateOrUndef(body.date_of_birth) ?? student.date_of_birth,
        gender:                       str(body.gender),
        nationality:                  str(body.nationality),
        admission_date:               dateOrUndef(body.admission_date) ?? student.admission_date,
        previous_school:              str(body.previous_school),
        residential_address:          str(body.residential_address),
        digital_address:              str(body.digital_address),
        // Father
        father_name:                  str(body.father_name),
        father_phone:                 str(body.father_phone),
        father_profession:            str(body.father_profession),
        father_status:                str(body.father_status),
        father_residential_address:   str(body.father_residential_address),
        father_digital_address:       str(body.father_digital_address),
        // Mother
        mother_name:                  str(body.mother_name),
        mother_phone:                 str(body.mother_phone),
        mother_profession:            str(body.mother_profession),
        mother_status:                str(body.mother_status),
        mother_residential_address:   str(body.mother_residential_address),
        mother_digital_address:       str(body.mother_digital_address),
        // Guardian
        guardian_name:                str(body.guardian_name),
        guardian_phone:               str(body.guardian_phone),
        guardian_profession:          str(body.guardian_profession),
        guardian_residential_address: str(body.guardian_residential_address),
        guardian_digital_address:     str(body.guardian_digital_address),
        // Emergency
        emergency_contact_name:       str(body.emergency_contact_name),
        emergency_contact_phone:      str(body.emergency_contact_phone),
        // Medical
        medical_notes:                str(body.medical_notes),
        // Parent contact
        parent_phone:                 str(body.parent_phone),
        parent_name:                  str(body.parent_name),
        parent_relation:              str(body.parent_relation),
      },
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

    // Soft delete — preserves referential integrity
    await prisma.student.update({
      where: { id: studentId },
      data:  { deleted_at: new Date() },
    });

    logAudit({
      prismaClient: prisma,
      schoolId:     user.school_id ?? undefined,
      performedBy:  user.id,
      actorRole:    user.role,
      action:       'DELETE',
      entityType:   'Student',
      entityId:     studentId,
      changes:      { before: { name: student.name, student_number: student.student_number } },
      ipAddress:    getClientIp(req),
    });

    return NextResponse.json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
