import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

/**
 * GET /api/super-admin/global-view
 * 
 * Fetches all users across all schools for super admin view
 * Query params:
 * - role: Filter by role (parent, student, teacher, admin, secretary)
 * - search: Search by name or phone
 * - skip: Pagination offset
 * - take: Number of records (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate and check super_admin role
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const take = parseInt(url.searchParams.get('take') || '50');

    // 2. Build where clause
    const where: any = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 3. Fetch users with school info
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        school_id: true,
        school: {
          select: {
            id: true,
            school_name: true
          }
        },
        created_at: true
      },
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });

    // 4. Get total count for pagination
    const total = await prisma.user.count({ where });

    // 5. Fetch students as separate records (students are not users)
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        student_number: true,
        parent_phone: true,
        school_id: true,
        school: {
          select: {
            id: true,
            school_name: true
          }
        },
        created_at: true
      },
      skip: search ? 0 : skip,
      take: search ? 50 : take,
      orderBy: { created_at: 'desc' }
    });

    // Filter students by search if provided
    const filteredStudents = search
      ? students.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.parent_phone?.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      : students;

    return NextResponse.json({
      users,
      students: filteredStudents,
      total,
      pagination: {
        skip,
        take,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching global view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global view data' },
      { status: 500 }
    );
  }
}
