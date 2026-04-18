import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import {
  calculateAmountLeft,
  calculateFeeStatus,
  ensureStudentFeeBalancesForSchool,
  getStudentFeeBalanceModel,
} from '@/lib/fee-balances';

const FEE_TYPE_LABEL_PREFIX = '[fee_type:';

function decodeFeeTypeAndDescription(feeType: string, description: string | null) {
  if (feeType !== 'OTHER' || !description?.startsWith(FEE_TYPE_LABEL_PREFIX)) {
    return { fee_type: feeType, description };
  }

  const closingBracketIndex = description.indexOf(']');
  if (closingBracketIndex < 0) {
    return { fee_type: feeType, description };
  }

  const customType = description.slice(FEE_TYPE_LABEL_PREFIX.length, closingBracketIndex).trim();
  if (!customType) {
    return { fee_type: feeType, description };
  }

  const cleanedDescription = description.slice(closingBracketIndex + 1).trim();
  return {
    fee_type: customType,
    description: cleanedDescription || null,
  };
}

export async function GET(req: NextRequest) {
  try {
    type ChildBalanceRow = {
      id: string;
      schoolFee: {
        fee_type: string;
        amount: number;
        academic_year: string;
        term: string | null;
        description: string | null;
      };
      amount_paid: number;
      updated_at: Date;
    };

    type ChildFeeSummaryRow = {
      id: string;
      fee_type: string;
      description: string | null;
      academic_year: string;
      term: string | null;
      total_amount: number;
      amount_paid: number;
      amount_left: number;
      status: string;
      updated_at: Date;
    };

    const auth = await authorize(req, ['parent']);
    if (!auth || typeof auth !== 'object' || !('user' in auth)) return auth as NextResponse;
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
        deleted_at: null,
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
      const childBalances: ChildFeeSummaryRow[] = (balancesByStudent.get(child.id) ?? [])
        .filter((balance: ChildBalanceRow) => balance.schoolFee)
        .map((balance: ChildBalanceRow) => {
        const decodedFee = decodeFeeTypeAndDescription(balance.schoolFee.fee_type, balance.schoolFee.description);

        return {
          id: balance.id,
          fee_type: decodedFee.fee_type,
          description: decodedFee.description,
          academic_year: balance.schoolFee.academic_year,
          term: balance.schoolFee.term,
          total_amount: balance.schoolFee.amount,
          amount_paid: balance.amount_paid,
          amount_left: calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid),
          status: calculateFeeStatus(balance.schoolFee.amount, balance.amount_paid),
          updated_at: balance.updated_at,
        };
      });

      return {
        id: child.id,
        name: child.name,
        class_name: child.class?.class_name || 'N/A',
        school_name: child.school?.school_name || 'N/A',
        balances: childBalances,
        totals: {
          total_due: childBalances.reduce((sum: number, row: ChildFeeSummaryRow) => sum + row.total_amount, 0),
          total_paid: childBalances.reduce((sum: number, row: ChildFeeSummaryRow) => sum + row.amount_paid, 0),
          total_left: childBalances.reduce((sum: number, row: ChildFeeSummaryRow) => sum + row.amount_left, 0),
        },
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching parent fees:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}
