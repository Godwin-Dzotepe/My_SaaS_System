import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalSchools, totalStudents, totalTeachers, totalUsers] = await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count(),
    ]);

    // Get schools with their student and teacher counts
    const schoolsData = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            users: true, // This includes all users (admin, teachers, etc.)
          }
        }
      },
      take: 5,
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({
      stats: {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalUsers,
      },
      recentSchools: schoolsData.map(school => ({
        id: school.id,
        name: school.school_name,
        students: school._count.students,
        teachers: school._count.users, // Simplification for now
        createdAt: school.created_at
      }))
    });
  } catch (error: any) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
