import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const querySchema = z.object({
  school_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'finance_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const requestedSchoolId = searchParams.get('school_id');
    const school_id = user.role === 'super_admin' ? requestedSchoolId : user.school_id;

    const validation = querySchema.safeParse({ school_id });
    if (!validation.success) {
      return NextResponse.json({ error: 'Missing school_id' }, { status: 400 });
    }

    if (!validation.data.school_id || !validateSchool(user, validation.data.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = validation.data.school_id;

    const collected = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        school_id: schoolId,
        status: 'PAID'
      }
    });

    const pending = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        school_id: schoolId,
        status: 'PENDING'
      }
    });

    const [paidCount, unpaidCount, recentPayments, school] = await Promise.all([
      prisma.payment.groupBy({
        by: ['student_id'],
        where: {
          school_id: schoolId,
          status: 'PAID',
        },
      }),
      prisma.payment.groupBy({
        by: ['student_id'],
        where: {
          school_id: schoolId,
          status: 'PENDING',
        },
      }),
      prisma.payment.findMany({
        where: {
          school_id: schoolId,
        },
        include: {
          student: {
            select: {
              name: true,
              class: {
                select: {
                  class_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 8,
      }),
      prisma.school.findUnique({
        where: { id: schoolId },
        select: { school_name: true },
      }),
    ]);

    return NextResponse.json({
      total_collected: collected._sum.amount || 0,
      total_pending: pending._sum.amount || 0,
      paid_students: paidCount.length,
      unpaid_students: unpaidCount.length,
      recent_payments: recentPayments.map((payment) => ({
        id: payment.id,
        student: payment.student.name,
        class_name: payment.student.class?.class_name || 'N/A',
        amount: payment.amount,
        status: payment.status,
        date: payment.paidAt || payment.created_at,
        payment_method: payment.paymentMethod,
      })),
      school_name: school?.school_name || 'School',
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error calculating finance summary:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
