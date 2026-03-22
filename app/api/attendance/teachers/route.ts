import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(async ({ req, session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!session.user.school_id) {
      return NextResponse.json({ error: "No school ID" }, { status: 400 });
    }

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const attendanceDate = new Date(dateStr);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await prisma.teacherAttendance.findMany({
      where: {
        school_id: session.user.school_id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const attendanceMap = records.reduce((acc: any, record) => {
      acc[record.teacher_id] = record.status.toUpperCase();
      return acc;
    }, {});

    return NextResponse.json({ attendance: attendanceMap });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req, session }) => {
  try {
    const { teacherId, status, date } = await req.json();

    if (!teacherId || !status || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!session.user.school_id) {
      return NextResponse.json({ error: "No school ID" }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Map 'LATE' to 'present' for the database, or just 'present'/'absent'
    const dbStatus = typeof status === 'string' && status.toUpperCase() === 'ABSENT' ? 'absent' : 'present';

    const record = await prisma.teacherAttendance.upsert({
      where: {
        teacher_id_date: {
          teacher_id: teacherId,
          date: attendanceDate,
        },
      },
      update: {
        status: dbStatus,
      },
      create: {
        teacher_id: teacherId,
        school_id: session.user.school_id,
        date: attendanceDate,
        status: dbStatus,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Attendance save error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
