import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            users: true,
            classes: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schoolName, address, phone, adminName, adminEmail, adminPhone, adminPassword } = body;

    if (!schoolName || !address || !phone || !adminName || !adminPhone || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create school and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          school_name: schoolName,
          address,
          phone,
        },
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail || null,
          phone: adminPhone,
          password: hashedPassword,
          role: 'school_admin',
          school_id: school.id,
        },
      });

      return { school, admin };
    });

    return NextResponse.json({ 
      message: 'School and admin created successfully', 
      school: result.school 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating school:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone number or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
