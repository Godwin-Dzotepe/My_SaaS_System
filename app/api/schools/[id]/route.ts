import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;
    const { searchParams } = new URL(req.url);
    const paymentDetailsOnly = searchParams.get('paymentDetails') === 'true';

    // Payment details endpoint (public, no auth required)
    if (paymentDetailsOnly) {
      const schoolPaymentDetail = await prisma.schoolPaymentDetail.findUnique({
        where: { school_id: schoolId },
        include: {
          school: {
            select: {
              school_name: true,
            },
          },
        },
      });

      if (!schoolPaymentDetail) {
        return NextResponse.json({ message: 'Payment details not found for this school.' }, { status: 404 });
      }

      return NextResponse.json({
        schoolName: schoolPaymentDetail.school?.school_name || 'Unknown School',
        momoNumber: schoolPaymentDetail.momoNumber,
        bankAccountNumber: schoolPaymentDetail.bankAccountNumber,
        bankName: schoolPaymentDetail.bankName,
        paymentInstructions: schoolPaymentDetail.paymentInstructions,
      });
    }

    // School details endpoint (requires super_admin auth)
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            classes: true,
            users: true,
          }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(school);

  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { id: schoolId } = await params;
    const body = await req.json();
    const { school_name, address, phone } = body;

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        school_name: school_name || school.school_name,
        address: address || school.address,
        phone: phone || school.phone,
      },
      include: {
        _count: {
          select: {
            classes: true,
            users: true,
          }
        }
      }
    });

    return NextResponse.json(updatedSchool);

  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { id: schoolId } = await params;

    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete Attendance records
      await tx.attendance.deleteMany({
        where: { student: { school_id: schoolId } }
      });

      // 2. Delete Scores
      await tx.score.deleteMany({
        where: { student: { school_id: schoolId } }
      });

      // 3. Delete Completed Student records
      await tx.completedStudent.deleteMany({
        where: { student: { school_id: schoolId } }
      });

      // 4. Delete Payments
      await tx.payment.deleteMany({
        where: { school_id: schoolId }
      });

      // 5. Delete Homework
      await tx.homework.deleteMany({
        where: { class: { school_id: schoolId } }
      });

      // 6. Delete Students
      await tx.student.deleteMany({
        where: { school_id: schoolId }
      });

      // 7. Delete Events
      await tx.event.deleteMany({
        where: { school_id: schoolId }
      });

      // 8. Delete Announcements
      // Delete announcements for the school, and any other announcements created by the school's users
      await tx.announcement.deleteMany({
        where: {
          OR: [
            { school_id: schoolId },
            { creator: { school_id: schoolId } }
          ]
        }
      });

      // 9. Delete SchoolFees
      await tx.schoolFee.deleteMany({
        where: { school_id: schoolId }
      });

      // 10. Delete GradingConfigs
      await tx.gradingConfig.deleteMany({
        where: { school_id: schoolId }
      });

      // 11. Delete SchoolPaymentDetails
      await tx.schoolPaymentDetail.deleteMany({
        where: { school_id: schoolId }
      });

      // 12. Delete Classes
      // Need to disconnect teachers first or just delete them. 
      // Subjects might be linked to teachers in TeacherSubjects relation. 
      // Wait, we need to clear subjects first.
      await tx.subject.deleteMany({
        where: { school_id: schoolId }
      });

      await tx.class.deleteMany({
        where: { school_id: schoolId }
      });

      // 13. Users
      // Find all users associated strictly with this school
      await tx.user.deleteMany({
        where: { 
          school_id: schoolId,
          role: { not: 'parent' }
        }
      });
      
      // Unlink remaining users (like parents, or super_admins if they somehow have this school_id)
      await tx.user.updateMany({
        where: { school_id: schoolId },
        data: { school_id: null }
      });

      // 14. Finally, delete the school
      await tx.school.delete({
        where: { id: schoolId }
      });
    });

    return NextResponse.json({ message: 'School deleted successfully' });

  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
