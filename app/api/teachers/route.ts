import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: 'teacher',
        school_id: user.schoolId || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        classes: {
          select: {
            id: true,
            class_name: true,
          }
        },
        subjects: {
          select: {
            id: true,
            subject_name: true
          }
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, password, subjectIds } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, phone and password are required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let dataObj: any = {
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'teacher',
      school_id: user.schoolId,
    };

    if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
      dataObj.subjects = {
        connect: subjectIds.map((id: string) => ({ id }))
      };
    }

    const newTeacher = await prisma.user.create({
      data: dataObj,
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
