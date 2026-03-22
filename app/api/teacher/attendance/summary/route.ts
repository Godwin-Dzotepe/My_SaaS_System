'use server';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

// GET /api/teacher/attendance/summary
// Fetches attendance summary for a given class and date
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
        teacher_id: session.user.role === 'teacher' ? session.user.id : undefined, // Only teachers can view their own classes
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            student_number: true,
          },
          where: {
            status: 'active', // Only consider active students
          },
          orderBy: {
            name: 'asc',
          },
        },
        attendance: {
          where: {
            date: new Date(new Date(date).setHours(0, 0, 0, 0)),
          },
        },
      },
    });

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found or not authorized.' }, { status: 404 });
    }

    // Map students and their attendance status for the given date
    const summary = teacherClass.students.map(student => {
      const attendanceRecord = teacherClass.attendance.find(att => att.student_id === student.id);
      return {
        student_id: student.id,
        student_name: student.name,
        student_number: student.student_number,
        status: attendanceRecord ? attendanceRecord.status : 'present', // Default to present if no record found for the day
      };
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
