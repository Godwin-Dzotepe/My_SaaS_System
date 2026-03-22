import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendPasswordSMS } from '@/lib/sms-service';

/**
 * Input validation schema
 */
const schema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  schoolId: z.string().optional(), // Optional schoolId for multi-tenant
});

/**
 * POST /api/auth/parent-first-login
 * 
 * Creates or updates a parent account based on their phone number
 * and links them to students in the system
 * 
 * SECURITY MEASURES:
 * - Multi-tenant scoping (school_id)
 * - Password hashed with bcrypt
 * - Non-critical SMS (doesn't break flow on failure)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number' }, 
        { status: 400 }
      );
    }

    const { phone, schoolId } = validation.data;

    // 1. Build query with multi-tenant scoping
    // SECURITY: Always scope students by school_id when provided
    const studentWhere: Record<string, unknown> = {
      parent_phone: phone,
    };
    
    if (schoolId) {
      studentWhere.school_id = schoolId;
    }

    // 2. Check if there are any students associated with this parent phone
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: { 
        school: {
          select: {
            school_name: true,
          }
        }
      },
      take: 1, // Only need first student to get school info
    });

    if (students.length === 0) {
      return NextResponse.json({ 
        error: 'No students found linked to this phone number. Please contact the school.' 
      }, { status: 404 });
    }

    // Get school info from first student
    const school = students[0].school;
    const studentSchoolId = students[0].school_id;

    // 3. Generate a random 6-digit password
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(rawPassword, 12); // Cost factor 12 for extra security

    // 4. Find or Create the Parent User
    // SECURITY: Always associate with the correct school
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user) {
      // Update existing user with new password and ensure school_id is set
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          school_id: studentSchoolId, // Ensure correct school association
        },
      });
    } else {
      // Create new parent user
      user = await prisma.user.create({
        data: {
          name: 'Parent', // Default name, can be updated later
          phone,
          password: hashedPassword,
          role: 'parent',
          school_id: studentSchoolId,
        },
      });
    }

    // 5. Send password via SMS (non-critical - don't break flow on failure)
    // SECURITY: Use try-catch to ensure this doesn't break the main flow
    try {
      const smsResult = await sendPasswordSMS(phone, rawPassword, school.school_name);
      
      // Log SMS failure but don't fail the request
      if (!smsResult.success) {
        console.warn('[Parent First Login] Password SMS failed:', smsResult.error);
      }
    } catch (smsError) {
      console.error('[Parent First Login] SMS error:', smsError);
      // Non-critical - continue with flow
    }

    return NextResponse.json({ 
      message: 'Account created successfully. Check your phone for the login password.' 
    });

  } catch (error) {
    console.error('[Parent First Login Error]:', error instanceof Error ? error.message : 'Unknown error');
    
    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
