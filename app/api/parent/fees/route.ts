import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import {
  calculateAmountLeft,
  calculateFeeStatus,
  ensureStudentFeeBalancesForSchool,
  getStudentFeeBalanceModel,
} from '@/lib/fee-balances';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['parent']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const parentAccessFilters = [
      { parent_id: user.id },
      ...(user.phone
        ? [
            { father_phone: user.phone },
            { mother_phone: user.phone },
            { guardian_phone: user.phone },
            { parent_phone: user.phone },
          ]
        : []),
    ];

    const children = await prisma.student.findMany({
      where: {
        OR: parentAccessFilters,
        status: 'active',
      },
      include: {
        class: {
          select: {
            class_name: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const schoolIds = Array.from(new Set(children.map((child) => child.school_id).filter(Boolean)));
    await Promise.all(schoolIds.map((schoolId) => ensureStudentFeeBalancesForSchool(schoolId)));
    const studentFeeBalanceModel = getStudentFeeBalanceModel();

    if (!studentFeeBalanceModel) {
      return NextResponse.json(
        { error: 'Fee balances are not ready yet. Please restart the dev server once and try again.' },
        { status: 503 }
      );
    }

    const childIds = children.map((child) => child.id);
    const balances = childIds.length > 0
      ? await studentFeeBalanceModel.findMany({
          where: {
            student_id: { in: childIds },
          },
          include: {
            schoolFee: {
              select: {
                fee_type: true,
                amount: true,
                academic_year: true,
                term: true,
                description: true,
              },
            },
          },
          orderBy: [
            { schoolFee: { academic_year: 'desc' } },
            { schoolFee: { term: 'asc' } },
          ],
        })
      : [];

    const balancesByStudent = new Map<string, typeof balances>();
    for (const balance of balances) {
      const current = balancesByStudent.get(balance.student_id) ?? [];
      current.push(balance);
      balancesByStudent.set(balance.student_id, current);
    }

    const response = children.map((child) => {
      const childBalances = (balancesByStudent.get(child.id) ?? []).map((balance) => ({
        id: balance.id,
        fee_type: balance.schoolFee.fee_type,
        description: balance.schoolFee.description,
        academic_year: balance.schoolFee.academic_year,
        term: balance.schoolFee.term,
        total_amount: balance.schoolFee.amount,
        amount_paid: balance.amount_paid,
        amount_left: calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid),
        status: calculateFeeStatus(balance.schoolFee.amount, balance.amount_paid),
        updated_at: balance.updated_at,
      }));

      return {
        id: child.id,
        name: child.name,
        class_name: child.class?.class_name || 'N/A',
        school_name: child.school?.school_name || 'N/A',
        balances: childBalances,
        totals: {
          total_due: childBalances.reduce((sum, row) => sum + row.total_amount, 0),
          total_paid: childBalances.reduce((sum, row) => sum + row.amount_paid, 0),
          total_left: childBalances.reduce((sum, row) => sum + row.amount_left, 0),
        },
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching parent fees:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}
