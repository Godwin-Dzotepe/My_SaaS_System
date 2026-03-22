import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET /api/subjects - Fetch all subjects for the user's school
export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json({ error: 'School ID missing from token' }, { status: 400 });
      }

      const subjects = await prisma.subject.findMany({
        where: {
          school_id: session.user.school_id,
        },
        orderBy: { subject_name: 'asc' },
      });

      return NextResponse.json(subjects);
    } catch (error: any) {
      console.error('Subjects fetch error:', error);
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
  }
);

// POST /api/subjects - Create a new subject
export const POST = withAuth(
  async ({ req, session }) => {
    try {
      if (!session.user.school_id) {
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
          school_id: session.user.school_id,
        },
      });

      return NextResponse.json(subject, { status: 201 });
    } catch (error: any) {
      console.error('Subject create error:', error);
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin'], // Only school admins can create subjects
  }
);
