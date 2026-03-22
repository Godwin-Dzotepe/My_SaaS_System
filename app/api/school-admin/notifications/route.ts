import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const POST = withAuth(async ({ req, session }) => {
  try {
    if (session.user.role !== "school_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, message, audience } = await req.json();

    if (!title || !message || !audience) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!session.user.school_id) {
      return NextResponse.json({ error: "No school ID" }, { status: 400 });
    }

    const fullMessage = `[${audience}] ${title}\n\n${message}`;

    const announcement = await prisma.announcement.create({
      data: {
        message: fullMessage,
        school_id: session.user.school_id,
        created_by: session.user.id,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("School Admin Notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
