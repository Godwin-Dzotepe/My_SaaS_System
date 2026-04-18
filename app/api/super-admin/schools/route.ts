import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { getSchoolColumnSupport, getSupportedSchoolData } from '@/lib/school-model';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function authorizeSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return {};
}

async function parseSchoolCreateRequest(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const logoFile = formData.get('schoolLogo');

    return {
      schoolName: String(formData.get('schoolName') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      smsUsername: String(formData.get('smsUsername') || '').trim(),
      adminName: String(formData.get('adminName') || '').trim(),
      adminEmail: String(formData.get('adminEmail') || '').trim(),
      adminPhone: String(formData.get('adminPhone') || '').trim(),
      adminPassword: String(formData.get('adminPassword') || '').trim(),
      logoFile: logoFile instanceof File && logoFile.size > 0 ? logoFile : null,
    };
  }

  const body = await request.json();
  return {
    schoolName: String(body.schoolName || '').trim(),
    address: String(body.address || '').trim(),
    phone: String(body.phone || '').trim(),
    smsUsername: String(body.smsUsername || '').trim(),
    adminName: String(body.adminName || '').trim(),
    adminEmail: String(body.adminEmail || '').trim(),
    adminPhone: String(body.adminPhone || '').trim(),
    adminPassword: String(body.adminPassword || '').trim(),
    logoFile: null,
  };
}

export async function GET() {
  try {
    const auth = await authorizeSuperAdmin();
    if (auth.error) return auth.error;

    const schoolColumnSupport = await getSchoolColumnSupport();

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        school_name: true,
        address: true,
        phone: true,
        ...(schoolColumnSupport.logo_url ? { logo_url: true } : {}),
        ...(schoolColumnSupport.sms_username ? { sms_username: true } : {}),
        created_at: true,
        ...(schoolColumnSupport.isActive ? { isActive: true } : {}),
        ...(schoolColumnSupport.deactivationMessage ? { deactivationMessage: true } : {}),
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const usersBySchool = await prisma.user.groupBy({
      by: ['school_id', 'role'],
      where: {
        school_id: {
          in: schools.map((school) => school.id),
        },
      },
      _count: {
        _all: true,
      },
    });

    const enrichedSchools = schools.map((school) => {
      const countsForSchool = usersBySchool.filter((entry) => entry.school_id === school.id);
      const parentCount = countsForSchool
        .filter((entry) => entry.role === 'parent')
        .reduce((total, entry) => total + entry._count._all, 0);
      const staffCount = countsForSchool
        .filter((entry) => entry.role !== 'parent' && entry.role !== 'super_admin')
        .reduce((total, entry) => total + entry._count._all, 0);

      return {
        ...school,
        logo_url: schoolColumnSupport.logo_url ? school.logo_url ?? null : null,
        sms_username: schoolColumnSupport.sms_username ? school.sms_username ?? null : null,
        isActive: schoolColumnSupport.isActive ? school.isActive : true,
        deactivationMessage: schoolColumnSupport.deactivationMessage
          ? school.deactivationMessage ?? null
          : null,
        _count: {
          ...school._count,
          staff: staffCount,
          parents: parentCount,
        },
      };
    });

    return NextResponse.json({ schools: enrichedSchools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeSuperAdmin();
    if (auth.error) return auth.error;

    const {
      schoolName,
      address,
      phone,
      smsUsername,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      logoFile,
    } = await parseSchoolCreateRequest(request);

    if (!schoolName || !address || !phone || !adminName || !adminPhone || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let logoUrl: string | null = null;
    if (logoFile) {
      const upload = await uploadImageToCloudinary(logoFile, 'my-school-saas/schools');
      logoUrl = upload.url;
    }

    const result = await prisma.$transaction(async (tx: Tx) => {
      const schoolData: Record<string, unknown> = {
        school_name: schoolName,
        address,
        phone,
        sms_username: smsUsername || null,
        logo_url: logoUrl,
      };
      const { data: supportedSchoolData, unsupportedFields } = getSupportedSchoolData(schoolData);

      if (unsupportedFields.length > 0) {
        console.warn(
          '[schools.create] Skipping unsupported School fields until Prisma client/database are updated:',
          unsupportedFields
        );
      }

      const school = await tx.school.create({
        data: supportedSchoolData as any,
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail || null,
          phone: adminPhone,
          password: hashedPassword,
          role: 'school_admin',
          school_id: school.id,
        },
      });

      return { school, admin };
    });

    return NextResponse.json(
      {
        message: 'School and admin created successfully',
        school: result.school,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating school:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone number or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
