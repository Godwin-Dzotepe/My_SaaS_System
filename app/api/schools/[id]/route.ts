import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { getSupportedSchoolData } from '@/lib/school-model';
import type { Prisma } from '@prisma/client';

async function parseSchoolUpdateRequest(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const logoFile = formData.get('schoolLogo');

    return {
      school_name: String(formData.get('school_name') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      sms_username: String(formData.get('sms_username') || '').trim(),
      clearLogo: String(formData.get('clearLogo') || '').trim() === 'true',
      logoFile: logoFile instanceof File && logoFile.size > 0 ? logoFile : null,
    };
  }

  const body = await req.json();
  return {
    school_name: String(body.school_name || '').trim(),
    address: String(body.address || '').trim(),
    phone: String(body.phone || '').trim(),
    sms_username: String(body.sms_username || '').trim(),
    clearLogo: Boolean(body.clearLogo),
    logoFile: null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;
    const { searchParams } = new URL(req.url);
    const paymentDetailsOnly = searchParams.get('paymentDetails') === 'true';

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

    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            classes: true,
            users: true,
          },
        },
      },
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
    const body = await parseSchoolUpdateRequest(req);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    let logoUrl = school.logo_url;
    if (body.clearLogo) {
      logoUrl = null;
    } else if (body.logoFile) {
      const upload = await uploadImageToCloudinary(body.logoFile, 'my-school-saas/schools');
      logoUrl = upload.url;
    }

    const schoolData = {
      school_name: body.school_name || school.school_name,
      address: body.address || school.address,
      phone: body.phone || school.phone,
      sms_username: body.sms_username || null,
      logo_url: logoUrl,
    };
    const { data: supportedSchoolData, unsupportedFields } = getSupportedSchoolData(schoolData);

    if (unsupportedFields.length > 0) {
      console.warn(
        '[schools.update] Skipping unsupported School fields until Prisma client/database are updated:',
        unsupportedFields
      );
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: supportedSchoolData,
      include: {
        _count: {
          select: {
            classes: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSchool);
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update school' }, { status: 500 });
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
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.attendance.deleteMany({
        where: { student: { school_id: schoolId } },
      });

      await tx.score.deleteMany({
        where: { student: { school_id: schoolId } },
      });

      await tx.completedStudent.deleteMany({
        where: { student: { school_id: schoolId } },
      });

      await tx.payment.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.homework.deleteMany({
        where: { class: { school_id: schoolId } },
      });

      await tx.student.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.event.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.announcement.deleteMany({
        where: {
          OR: [
            { school_id: schoolId },
            { creator: { school_id: schoolId } },
          ],
        },
      });

      await tx.schoolFee.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.gradingConfig.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.schoolPaymentDetail.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.subject.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.class.deleteMany({
        where: { school_id: schoolId },
      });

      await tx.user.deleteMany({
        where: {
          school_id: schoolId,
          role: { not: 'parent' },
        },
      });

      await tx.user.updateMany({
        where: { school_id: schoolId },
        data: { school_id: null },
      });

      await tx.school.delete({
        where: { id: schoolId },
      });
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
