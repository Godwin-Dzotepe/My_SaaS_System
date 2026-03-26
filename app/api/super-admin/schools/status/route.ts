import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import { getSchoolColumnSupport } from "@/lib/school-model";

export const POST = withAuth(async ({ req, session }) => {
  try {
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyText = await req.text();
    console.log("Status API Body:", bodyText);
    
    // Parse manually
    const { schoolId, isActive, deactivationMessage } = JSON.parse(bodyText);

    if (!schoolId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: `Invalid payload. id: ${schoolId}, isActive: ${isActive}` }, { status: 400 });
    }

    const schoolColumnSupport = await getSchoolColumnSupport();
    if (!schoolColumnSupport.isActive || !schoolColumnSupport.deactivationMessage) {
      return NextResponse.json(
        {
          error: "School status columns are missing from the database",
          details: 'Run the migration that adds "School"."isActive" and "School"."deactivationMessage" first.',
        },
        { status: 503 }
      );
    }

    console.log("Updating school:", schoolId, "to", isActive);
    
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        isActive,
        deactivationMessage: isActive ? null : (deactivationMessage || "School has been deactivated by Super Admin")
      }
    });

    console.log("Update success!");
    return NextResponse.json({ success: true, school: { id: updatedSchool.id, isActive: updatedSchool.isActive } });
  } catch (error: any) {
    console.error("School status update error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message || String(error) }, { status: 500 });
  }
});
