import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId) {
        return NextResponse.json({ error: 'School ID missing from token' }, { status: 400 });
    }

    const subjects = await prisma.subject.findMany({
      where: {
        school_id: user.schoolId
      },
      orderBy: { subject_name: 'asc' }
    });

    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('Subjects fetch error:', error);
    return NextResponse.json({
        error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School ID missing from token' }, { status: 400 });
    }

    const body = await req.json();
    const { subject_name } = body;

    if (!subject_name || typeof subject_name !== 'string') {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        subject_name: subject_name.trim(),
        school_id: user.schoolId,
      }
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error('Subject create error:', error);
    return NextResponse.json({
        error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
