'use server';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// POST /api/teacher/attendance/mark
// Marks attendance for students in a given class and date
export const POST = withAuth(async ({ req, session }) => {
  try {
    const { class_id, date, attendance_records } = await req.json();

    if (!session.user.school_id) {
      return NextResponse.json({ error: 'User not associated with a school.' }, { status: 400 });
    }
    if (!class_id) {
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
    }
    if (!attendance_records || !Array.isArray(attendance_records) || attendance_records.length === 0) {
      return NextResponse.json({ error: 'Attendance records are required.' }, { status: 400 });
    }

    // Authorize teacher to mark attendance for this class
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: class_id,
        school_id: session.user.school_id,
        teacher_id: session.user.role === 'teacher' ? session.user.id : undefined,
      },
      select: {
        id: true, // Just need to confirm the class exists and is authorized
      },
    });

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found or not authorized.' }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize date to midnight for consistent comparison

    // Process attendance records in a transaction
    await prisma.$transaction(async (tx: Tx) => {
      // First, delete any existing attendance for this class and date to ensure a clean state
      await tx.attendance.deleteMany({
        where: {
          class_id: class_id,
          date: attendanceDate,
        },
      });

      // Then, create new attendance records
      await tx.attendance.createMany({
        data: attendance_records.map((record: { student_id: string; status: AttendanceStatus }) => ({
          student_id: record.student_id,
          class_id: class_id, // Use the class_id from the request
          date: attendanceDate,
          status: record.status,
        })),
      });
    });

    return NextResponse.json({ message: 'Attendance marked successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error marking attendance:', error);
    if (error.code === 'P2002') { // Unique constraint violation (e.g., if deleteMany somehow missed)
      return NextResponse.json({ error: 'Attendance for this date and class already exists or failed to update.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: error.status || 500 });
  }
});
