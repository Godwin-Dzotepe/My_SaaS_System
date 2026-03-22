import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(async ({ req, session }) => {
  try {
    const records = await prisma.teacherAttendance.findMany({
      where: {
        teacher_id: session.user.id,
        school_id: session.user.school_id || undefined,
      },
      orderBy: {
        date: 'desc'
      },
      take: 30
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
