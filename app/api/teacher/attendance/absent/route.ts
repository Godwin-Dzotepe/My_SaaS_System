'use server';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/attendance/absent
// Fetches students marked as absent for a given class and date
export const GET = withAuth(async ({ session, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');
    const date = searchParams.get('date');

    if (!session.user.school_id) {
      return NextResponse.json({ error: 'User not associated with a school.' }, { status: 400 });
    }
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
    }

    // Authorize teacher to access this class's data
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: classId,
        school_id: session.user.school_id,
        teacher_id: session.user.role === 'teacher' ? session.user.id : undefined,
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            student_number: true,
          },
          where: {
            status: 'active',
          },
          orderBy: {
            name: 'asc',
          },
        },
        attendance: {
          where: {
            date: new Date(new Date(date).setHours(0, 0, 0, 0)),
            status: 'absent', // Only fetch absent records
          },
          select: {
            student_id: true,
          },
        },
      },
    });

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found or not authorized.' }, { status: 404 });
    }

    // Filter students who are marked as absent
    const absentStudents = teacherClass.students.filter(student =>
      teacherClass.attendance.some(att => att.student_id === student.id)
    );

    return NextResponse.json(absentStudents);

  } catch (error) {
    console.error('Error fetching absent students:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
