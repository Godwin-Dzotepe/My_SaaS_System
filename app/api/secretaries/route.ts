import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const secretarySchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10),
  password: z.string().min(6),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const secretaries = await prisma.user.findMany({
      where: {
        role: 'secretary',
        school_id: user.schoolId || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(secretaries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch secretaries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School information not found' }, { status: 400 });
    }

    const body = await req.json();
    const validation = secretarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, email, phone, password } = validation.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const secretary = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone,
        password: hashedPassword,
        role: 'secretary',
        school_id: user.schoolId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
      }
    });

    return NextResponse.json(secretary, { status: 201 });
  } catch (error: any) {
    console.error('Error creating secretary:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone number or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
