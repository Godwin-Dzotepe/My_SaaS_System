import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

/**
 * GET /api/super-admin/schools/[schoolId]
 * 
 * Fetches all data for a specific school (parents, students, staff)
 * Query params:
 * - role: Filter by role (parent, student, teacher, admin, secretary)
 * - search: Search by name or phone
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    // 1. Authenticate and check super_admin role
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { schoolId } = await params;
    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    const search = url.searchParams.get('search') || undefined;

    // 2. Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // 3. Build where clause for users
    const userWhere: any = { school_id: schoolId };
    if (role && role !== 'all') {
      userWhere.role = role;
    }
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 4. Fetch users in school
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // 5. Fetch students in school
    let students = await prisma.student.findMany({
      where: { school_id: schoolId },
      select: {
        id: true,
        name: true,
        student_number: true,
        parent_phone: true,
        parent_name: true,
        parent_relation: true,
        class: {
          select: {
            id: true,
            class_name: true
          }
        },
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Filter students by search if provided
    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.parent_phone?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (s.parent_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      );
    }

    return NextResponse.json({
      school: {
        id: school.id,
        school_name: school.school_name,
        address: school.address,
        phone: school.phone,
        logo_url: school.logo_url,
        sms_username: school.sms_username,
      },
      users,
      students,
      counts: {
        users: users.length,
        students: students.length
      }
    });
  } catch (error) {
    console.error('Error fetching school data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school data' },
      { status: 500 }
    );
  }
}
