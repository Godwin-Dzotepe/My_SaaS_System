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

    await prisma.school.delete({
      where: { id: schoolId }
    });

    return NextResponse.json({ message: 'School deleted successfully' });

  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
