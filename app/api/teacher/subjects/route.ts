import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET /api/teacher/subjects - Fetches all subjects for the authenticated teacher
export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json(
          { error: 'User is not associated with a school.' },
          { status: 400 }
        );
      }

      const teacherWithSubjects = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        include: {
          subjects: {
            where: {
              school_id: session.user.school_id,
            },
            orderBy: {
              subject_name: 'asc',
            },
          },
        },
      });

      if (!teacherWithSubjects) {
        return NextResponse.json(
          { error: 'Teacher not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(teacherWithSubjects.subjects);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['teacher'],
  }
);
