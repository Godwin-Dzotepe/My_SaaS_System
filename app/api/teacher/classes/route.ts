import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET /api/teacher/classes - Fetches all classes for the authenticated teacher
export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json(
          { error: 'User is not associated with a school.' },
          { status: 400 }
        );
      }

      const teacherClasses = await prisma.class.findMany({
        where: {
          teacher_id: session.user.id,
          school_id: session.user.school_id,
        },
        orderBy: {
          class_name: 'asc',
        },
      });

      if (!teacherClasses) {
        return NextResponse.json(
          { error: 'No classes assigned to this teacher.' },
          { status: 404 }
        );
      }

      return NextResponse.json(teacherClasses);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
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
