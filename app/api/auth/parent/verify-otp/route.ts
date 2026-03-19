import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * POST /api/auth/parent/verify-otp
 * 
 * Verifies OTP and logs parent in
 * Returns JWT token for authenticated requests
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const { phone, otp } = validation.data;

    // 1. Find parent by phone
    const user = await prisma.user.findFirst({
      where: {
        phone,
        role: 'parent'
      },
      include: {
        students: {
          include: {
            class: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 401 }
      );
    }

    // 2. Check if OTP exists and not expired
    if (!user.otp || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new one.' },
        { status: 401 }
      );
    }

    // 3. Check if OTP is expired
    if (new Date() > user.otpExpiresAt) {
      // Clear expired OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otpExpiresAt: null
        }
      });

      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // 4. Verify OTP matches
    if (user.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // 5. OTP is valid - clear it and create session
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiresAt: null
      }
    });

    // 6. Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        schoolId: user.school_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // 7. Return success with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          studentCount: user.students.length,
          students: user.students.map(s => ({
            id: s.id,
            name: s.name,
            className: s.class.class_name,
            studentNumber: s.student_number,
            status: s.status
          }))
        }
      },
      { status: 200 }
    );

    // 8. Set JWT in HTTP-only cookie for web clients
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
