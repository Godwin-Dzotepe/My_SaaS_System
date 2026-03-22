import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { verifyOTP } from '@/lib/sms-service';

/**
 * Security constants
 */
const MAX_OTP_ATTEMPTS = 5;
const TOKEN_EXPIRY_DAYS = 7;

/**
 * Input validation schema for OTP verification
 */
const verifyOTPSchema = z.object({
  schoolId: z.string().optional(), // Optional for multi-tenant support
  phone: z.string().min(10, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * Type for user query
 */
interface UserQuery {
  phone: string;
  role: 'parent';
  school_id?: string;
}

/**
 * POST /api/auth/parent/verify-otp
 * 
 * Verifies OTP and logs parent in
 * Returns JWT token for authenticated requests
 * 
 * SECURITY MEASURES:
 * - OTP is hashed (bcrypt) - NEVER stored in plain text
 * - OTP expiration handling (10 minutes)
 * - Attempt limiting (max 5 attempts)
 * - Multi-tenant scoping (school_id)
 * - Minimal JWT payload
 * - Secure cookie configuration
 */
export async function POST(req: NextRequest) {
  try {
    // Validate JWT_SECRET exists at runtime
    if (!process.env.JWT_SECRET) {
      console.error('[OTP Verify] JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Authentication service misconfigured. Please contact support.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { schoolId, phone, otp } = validation.data;

    // 1. Build query with multi-tenant scoping
    const userQuery: UserQuery = {
      phone,
      role: 'parent',
    };
    
    // Only add school_id if provided - prevents cross-school access
    if (schoolId) {
      userQuery.school_id = schoolId;
    }

    // 2. Find parent by phone (scoped by schoolId if provided)
    const user = await prisma.user.findFirst({
      where: userQuery,
      include: {
        students: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!user) {
      // Generic error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Invalid credentials or OTP' },
        { status: 401 }
      );
    }

    // 3. Multi-Tenant Security check: ensure user belongs to a school
    if (!user.school_id) {
      return NextResponse.json(
        { error: 'Account misconfiguration. No school assigned.' },
        { status: 403 }
      );
    }

    // 4. Check if OTP is expired or missing
    // SECURITY: Clear expired OTP to ensure clean state
    if (!user.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      // Clear expired OTP
      if (user.otp) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            otp: null, 
            otpExpiresAt: null, 
            otpAttempts: 0 
          },
        });
      }

      return NextResponse.json(
        { error: 'OTP is expired or invalid. Please request a new one.' },
        { status: 401 }
      );
    }

    // 5. Check attempt limit
    const currentAttempts = user.otpAttempts || 0;
    
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Maximum OTP attempts reached. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // 6. Verify OTP using bcrypt comparison
    // SECURITY: OTP was hashed using bcrypt before storage
    const isOtpValid = await verifyOTP(otp, user.otp);

    if (!isOtpValid) {
      // Increment attempt counter on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: currentAttempts + 1 },
      });

      const remainingAttempts = MAX_OTP_ATTEMPTS - currentAttempts - 1;
      
      return NextResponse.json(
        { 
          error: 'Invalid OTP. Please try again.',
          attemptsRemaining: remainingAttempts
        },
        { status: 401 }
      );
    }

    // 7. OTP is valid - clear it, reset attempts, and create session
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });

    // 8. Create secure JWT token with minimal payload
    // SECURITY: Minimal payload - only include necessary claims
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        schoolId: user.school_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: `${TOKEN_EXPIRY_DAYS}d`, algorithm: 'HS256' }
    );

    // 9. Determine production status
    const isProd = process.env.NODE_ENV === 'production';

    // 10. Return comprehensive success response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        parentLinked: user.students.length > 0,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          studentCount: user.students.length,
          students: user.students.map((s) => ({
            id: s.id,
            name: s.name,
            className: s.class?.class_name || 'Unassigned',
            studentNumber: s.student_number,
            status: s.status,
          })),
        },
      },
      { status: 200 }
    );

    // 11. Set secure HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[OTP Verify Error]:', error instanceof Error ? error.message : 'Unknown error');
    // Avoid leaking internal errors
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 500 }
    );
  }
}
