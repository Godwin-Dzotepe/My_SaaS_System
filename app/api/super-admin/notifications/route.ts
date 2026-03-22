import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const POST = withAuth(async ({ req, session }) => {
  try {
    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    if (session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools = await prisma.school.findMany({ where: { isActive: true } });
    
    const announcements = schools.map(school => ({
      message: `[SUPER ADMIN SYSTEM ALERT]: ${title}\n\n${message}`,
      school_id: school.id,
      created_by: session.user.id,
    }));

    await prisma.announcement.createMany({
      data: announcements,
    });

    return NextResponse.json({ success: true, count: announcements.length });
  } catch (error) {
    console.error("Super Admin Notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
