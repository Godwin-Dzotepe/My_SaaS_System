import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken } from '@/lib/auth';

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { identifier, password } = validation.data;

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { phone: identifier }
            ]
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
        userId: user.id,
        email: user.email || '',
        role: user.role,
        schoolId: user.school_id || '',
        phone: user.phone
    });

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token: token
    });

    // Optionally, set token in a HTTP-only cookie
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
