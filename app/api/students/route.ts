import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const studentSchema = z.object({
  name: z.string().min(2),
  student_number: z.string().optional(),
  class_id: z.string().uuid(),
  school_id: z.string().uuid(),
  parent_phone: z.string().min(10),
  parent_name: z.string().optional(),
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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const {
      name,
      student_number,
      class_id,
      school_id,
      parent_phone,
      parent_name,
      parent_relation
    } = validation.data;

    // 2. Check user belongs to school
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'You are not authorized for this school' }, { status: 403 });
    }

    // 3. Ensure class belongs to same school ✅
    const classExists = await prisma.class.findFirst({
      where: {
        id: class_id,
        school_id
      }
    });

    if (!classExists) {
      return NextResponse.json({ error: 'Invalid class for this school' }, { status: 400 });
    }

    // 4. Check duplicate student number (FIXED)
    if (student_number) {
      const existingStudent = await prisma.student.findFirst({
        where: { student_number }
      });

      if (existingStudent) {
        return NextResponse.json({ error: 'Student number already exists' }, { status: 400 });
      }
    }

    // 5. Create student
    const studentData: any = {
      name,
      class_id,
      school_id,
      parent_phone,
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
      data: studentData
    });

    return NextResponse.json(newStudent, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 });
  }
}