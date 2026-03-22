import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(
  async ({ session }) => {
    try {
      const schoolId = session.user.school_id;

      if (!schoolId && session.user.role !== 'super_admin') {
        return NextResponse.json({ error: 'User does not belong to a school' }, { status: 400 });
      }

      const studentWhere = schoolId ? { school_id: schoolId } : undefined;
      const teacherWhere = schoolId ? { role: 'teacher' as const, school_id: schoolId } : { role: 'teacher' as const };
      const classWhere = schoolId ? { school_id: schoolId } : undefined;
      const paymentWhere = schoolId ? { school_id: schoolId } : undefined;

      const [totalStudents, totalTeachers, totalClasses, recentStudents, paymentRecords] = await Promise.all([
        prisma.student.count({
          where: studentWhere,
        }),
        prisma.user.count({
          where: teacherWhere,
        }),
        prisma.class.count({
          where: classWhere,
        }),
        prisma.student.findMany({
          where: studentWhere,
          include: {
            class: {
              select: { class_name: true },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 4,
        }),
        prisma.payment.findMany({
          where: paymentWhere,
          select: { amount: true },
        }),
      ]);

      const totalRevenue = paymentRecords.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      const formattedStudents = recentStudents.map((student) => ({
        id: student.id,
        name: student.name,
        class: student.class?.class_name || 'N/A',
        roll: student.student_number || '000',
        status: student.status || 'active',
        avatar: (student.name || 'S').substring(0, 2).toUpperCase(),
      }));

      return NextResponse.json({
        stats: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
        recentStudents: formattedStudents,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin', 'finance_admin', 'secretary', 'super_admin'],
  }
);
