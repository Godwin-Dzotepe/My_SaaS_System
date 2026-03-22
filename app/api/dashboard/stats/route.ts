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
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });     
    }

    let schoolId = decoded.schoolId;

    // Check DB if token payload is missing schoolId
    if (!schoolId && decoded.role !== 'super_admin') {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { school_id: true }
      });
      
      if (!dbUser || !dbUser.school_id) {
         return NextResponse.json({ error: 'User does not belong to a school' }, { status: 400 });
      }
      schoolId = dbUser.school_id;
    }

    // Fetch all stats in parallel
    const [totalStudents, totalTeachers, totalClasses, recentStudents] = await Promise.all([
      prisma.student.count({
        where: { school_id: schoolId } // Changed to filter on student level directly since student has school_id
      }),
      prisma.user.count({
        where: { role: 'teacher', school_id: schoolId }
      }),
      prisma.class.count({
        where: { school_id: schoolId }
      }),
      prisma.student.findMany({
        where: { school_id: schoolId },
        include: {
          class: {
            select: { class_name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 4
      })
    ]);

    // Calculate revenue (sum of all payments for this school)
    const paymentRecords = await prisma.payment.findMany({
      where: { school_id: schoolId },
      select: { amount: true }
    });

    const totalRevenue = paymentRecords.reduce((sum, payment) => sum + (payment.amount || 0), 0);                                                               
    // Format recent students for display
    const formattedStudents = recentStudents.map(student => ({
      id: student.id,
      name: student.name,
      class: student.class?.class_name || 'N/A',
      roll: student.student_number || '000',
      status: student.status || 'active',
      avatar: (student.name || 'S').substring(0, 2).toUpperCase()
    }));

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      },
      recentStudents: formattedStudents
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
