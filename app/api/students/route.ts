import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import bcrypt from 'bcrypt';

const studentSchema = z.object({
  name: z.string().min(2),
  student_number: z.string().optional(),
  class_id: z.string().uuid(),
  school_id: z.string().uuid(),
  parent_phone: z.string().min(10),
  parent_name: z.string().min(2),
  parent_email: z.string().email().optional(),
  parent_password: z.string().min(6).optional(),
  parent_relation: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and check role
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const {
      name,
      student_number,
      class_id,
      school_id,
      parent_phone,
      parent_name,
      parent_email,
      parent_password,
      parent_relation
    } = validation.data;

    // 2. Check user belongs to school
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'You are not authorized for this school' }, { status: 403 });
    }

    // 3. Ensure class belongs to same school
    const classExists = await prisma.class.findFirst({
      where: {
        id: class_id,
        school_id
      }
    });

    if (!classExists) {
      return NextResponse.json({ error: 'Invalid class for this school' }, { status: 400 });
    }

    // 4. Check duplicate student number
    if (student_number) {
      const existingStudent = await prisma.student.findFirst({
        where: { student_number }
      });

      if (existingStudent) {
        return NextResponse.json({ error: 'Student number already exists' }, { status: 400 });
      }
    }

    // 5. Check if parent already exists by phone
    let parentUser = await prisma.user.findFirst({
      where: { phone: parent_phone }
    });

    // 6. If parent doesn't exist, create one
    if (!parentUser) {
      // Password is required if creating new parent
      if (!parent_password) {
        return NextResponse.json({ error: 'Parent password is required for new parent registration' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(parent_password, 10);

      parentUser = await prisma.user.create({
        data: {
          name: parent_name,
          phone: parent_phone,
          email: parent_email || undefined,
          password: hashedPassword,
          role: 'parent',
          school_id: school_id
        }
      });
    } else {
      // Parent already exists, verify it's a parent role
      if (parentUser.role !== 'parent') {
        return NextResponse.json({ error: 'This phone number is already registered with a different role' }, { status: 400 });
      }
    }

    // 7. Create student and link to parent
    const studentData: any = {
      name,
      class_id,
      school_id,
      parent_phone,
      parent_id: parentUser.id,
      status: 'active'
    };

    // Only include optional fields if they have values
    if (student_number) {
      studentData.student_number = student_number;
    }
    if (parent_name) {
      studentData.parent_name = parent_name;
    }
    if (parent_relation) {
      studentData.parent_relation = parent_relation;
    }

    const newStudent = await prisma.student.create({
      data: studentData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        class: true
      }
    });

    return NextResponse.json(
      {
        message: 'Student and parent registered successfully',
        student: newStudent,
        parent: newStudent.parent
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating student and parent:', error);
    return NextResponse.json({ error: 'Failed to register student and parent' }, { status: 500 });
  }
}