import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import bcrypt from 'bcrypt';
import { generateRandomPassword } from '@/lib/password-utils';
import { sendSMS } from '@/lib/sms-service';

const studentSchema = z.object({
  name: z.string().min(2),
  student_number: z.string().optional(),
  class_id: z.string().uuid(),
  school_id: z.string().uuid(),
  parent_phone: z.string().min(10).optional(),
  parent_name: z.string().min(2).optional(),
  parent_email: z.string().email().optional(),
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

    // 5. Handle Parent Account (OPTIONAL) - AUTO PASSWORD + SMS
    let parentUser: any = null;
    let generatedPassword: string | null = null;

    // Only process parent if parent_name AND parent_phone are provided
    if (parent_name && parent_phone) {
      // Check if parent already exists by phone
      parentUser = await prisma.user.findFirst({
        where: { phone: parent_phone }
      });

      // If parent doesn't exist, create one with auto-generated password
      if (!parentUser) {
        // Generate random password for new parent
        generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        try {
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

          // Send SMS with auto-generated password
          try {
            await sendSMS({
              phone: parent_phone,
              message: `Welcome! Your account has been created. Password: ${generatedPassword}. Use this to login at the parent portal.`
            });
          } catch (smsError) {
            console.warn('SMS sending failed (non-blocking):', smsError);
            // Don't fail the request if SMS fails - log and continue
          }
        } catch (err: any) {
          // Handle unique constraint errors
          if (err.code === 'P2002') {
            return NextResponse.json(
              { error: 'Parent with this phone/email already exists' },
              { status: 400 }
            );
          }
          throw err;
        }
      } else {
        // Reusing existing parent - verify it's a parent role
        if (parentUser.role !== 'parent') {
          return NextResponse.json(
            { error: 'This phone is registered with a different role' },
            { status: 400 }
          );
        }
      }
    }

    // 6. Create Student and link to Parent (if parent exists)
    const studentData: any = {
      name,
      class_id,
      school_id,
      status: 'active'
    };

    // Link parent if one was created/found
    if (parentUser) {
      studentData.parent_id = parentUser.id;
    }

    // Store parent contact info
    if (parent_phone) {
      studentData.parent_phone = parent_phone;
    }

    if (parent_name) {
      studentData.parent_name = parent_name;
    }

    if (parent_relation) {
      studentData.parent_relation = parent_relation;
    }

    // Only include optional fields if they have values
    if (student_number) {
      studentData.student_number = student_number;
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

    // 7. Return Success Response
    const response: any = {
      message: 'Student registered successfully',
      student: newStudent
    };

    // Include parent info in response if parent was linked
    if (newStudent.parent) {
      response.parent = newStudent.parent;
      response.parentLinked = true;
    } else {
      response.parentLinked = false;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 });
  }
}