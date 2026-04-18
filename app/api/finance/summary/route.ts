import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import {
  calculateAmountLeft,
  calculateFeeStatus,
  ensureStudentFeeBalancesForSchool,
  getStudentFeeBalanceModel,
} from '@/lib/fee-balances';

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
    await ensureStudentFeeBalancesForSchool(schoolId);

    const studentFeeBalanceModel = getStudentFeeBalanceModel();
    if (!studentFeeBalanceModel) {
      return NextResponse.json(
        { error: 'Fee balances are not ready yet. Please restart the dev server once and try again.' },
        { status: 503 }
      );
    }

    const [balances, school] = await Promise.all([
      studentFeeBalanceModel.findMany({
        where: {
          school_id: schoolId,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              class: {
                select: {
                  class_name: true,
                },
              },
            },
          },
          schoolFee: {
            select: {
              fee_type: true,
              amount: true,
              academic_year: true,
              term: true,
            },
          },
        },
        orderBy: [
          { updated_at: 'desc' },
          { student: { name: 'asc' } },
        ],
      }),
      prisma.school.findUnique({
        where: { id: schoolId },
        select: { school_name: true },
      }),
    ]);

    const validBalances = balances.filter((balance: any) => balance.schoolFee !== null);

    const total_expected = validBalances.reduce((sum: number, balance: any) => sum + balance.schoolFee.amount, 0);
    const total_paid = validBalances.reduce((sum: number, balance: any) => sum + balance.amount_paid, 0);
    const total_pending = validBalances.reduce(
      (sum: number, balance: any) => sum + calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid),
      0
    );

    const studentStatusMap = new Map<string, { expected: number; paid: number; left: number }>();
    for (const balance of validBalances) {
      const current = studentStatusMap.get(balance.student_id) ?? { expected: 0, paid: 0, left: 0 };
      current.expected += balance.schoolFee.amount;
      current.paid += balance.amount_paid;
      current.left += calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid);
      studentStatusMap.set(balance.student_id, current);
    }

    const paid_students = Array.from(studentStatusMap.values()).filter((student) => student.left <= 0).length;
    const unpaid_students = Array.from(studentStatusMap.values()).filter((student) => student.left > 0).length;
    const partially_paid_students = Array.from(studentStatusMap.values()).filter(
      (student) => student.paid > 0 && student.left > 0
    ).length;
    const collection_rate = total_expected > 0 ? Number(((total_paid / total_expected) * 100).toFixed(1)) : 0;

    const recent_balances = validBalances.slice(0, 10).map((balance: any) => ({
      id: balance.id,
      student: balance.student.name,
      class_name: balance.student.class?.class_name || 'N/A',
      fee_type: balance.schoolFee.fee_type,
      amount_expected: balance.schoolFee.amount,
      amount_paid: balance.amount_paid,
      amount_left: calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid),
      status: calculateFeeStatus(balance.schoolFee.amount, balance.amount_paid),
      period: `${balance.schoolFee.term || 'No term'} ${balance.schoolFee.academic_year}`,
      updated_at: balance.updated_at,
    }));

    return NextResponse.json({
      total_expected,
      total_paid,
      total_pending,
      paid_students,
      unpaid_students,
      partially_paid_students,
      collection_rate,
      recent_balances,
      school_name: school?.school_name || 'School',
      currency: 'GHS',
    });
  } catch (error) {
    console.error('Error calculating finance summary:', error);
    return NextResponse.json({ error: 'Failed to generate finance summary' }, { status: 500 });
  }
}
