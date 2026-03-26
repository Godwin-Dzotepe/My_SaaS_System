import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken } from '@/lib/auth';
import { findUserWithSchoolBranding } from '@/lib/school-branding';

/**
 * Input validation schema
 */
const loginSchema = z.object({
  identifier: z.string().min(3, 'Identifier must be at least 3 characters'),    
  password: z.string().min(6, 'Password must be at least 6 characters'),        
  schoolId: z.string().optional(), // Optional schoolId for multi-tenant        
});

async function findLoginUser(where: Record<string, unknown>) {
  try {
    return await findUserWithSchoolBranding(where);
  } catch (error) {
    console.warn('[Login] Branding-aware lookup failed, falling back to base school lookup:', error);

    return prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });
  }
}

/**
 * POST /api/auth/login
 *
 * Standard login route for all user types
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const { identifier, password, schoolId } = validation.data;

    const userWhere: Record<string, unknown> = {
      OR: [
        { email: identifier },
        { phone: identifier },
      ],
    };

    if (schoolId) {
      userWhere.school_id = schoolId;
    }

    const user = await findLoginUser(userWhere);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // CHECK IF SCHOOL HAS BEEN DEACTIVATED BY SUPER ADMIN (Unless they themselves are a super_admin logging in)
    if (user.role !== 'super_admin' && user.school && user.school.isActive === false) {
      const msg = user.school.deactivationMessage || "This school's account has been deactivated by the system administrator.";
      return NextResponse.json(
        { error: `SCHOOL_DEACTIVATED:${msg}` },
        { status: 403 }
      );
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Generate JWT token with minimal payload
    const token = generateToken({
      userId: user.id,
      email: user.email || '',
      role: user.role,
      schoolId: user.school_id || '',
      phone: user.phone,
    });

    // 4. Remove sensitive data from response
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        schoolName: user.school?.school_name,
        schoolLogoUrl: 'logo_url' in (user.school || {}) ? user.school?.logo_url : null,
      },
      token,
    });

    // 5. Set secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[Login Error]:', error instanceof Error ? error.message : 'Unknown error');                                                                      
    if (error instanceof Error && error.message.includes('prisma')) {
      return NextResponse.json(
        { error: 'Database error. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
