import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/api-auth';
import {
  calculateAmountLeft,
  calculateFeeStatus,
  ensureStudentFeeBalancesForSchool,
  getStudentFeeBalanceModel,
} from '@/lib/fee-balances';

export async function GET(req: NextRequest) {
  try {
    type BalanceRow = {
      id: string;
      student_id: string;
      school_fee_id: string;
      amount_paid: number;
      updated_at: Date;
      student: {
        name: string;
        parent_name: string | null;
        parent_phone: string | null;
        class: { class_name: string } | null;
        parent: { name: string; phone: string } | null;
      };
      schoolFee: {
        id: string;
        fee_type: string;
        amount: number;
        academic_year: string;
        term: string | null;
        description: string | null;
      };
    };

    type FeeCheckerRow = {
      id: string;
      student_id: string;
      school_fee_id: string;
      parent_name: string;
      parent_phone: string;
      child_name: string;
      class_name: string;
      fee_type: string;
      fee_description: string | null;
      academic_year: string;
      term: string | null;
      total_amount: number;
      amount_paid: number;
      amount_left: number;
      status: string;
      updated_at: Date;
    };

    const auth = await authorize(req, ['school_admin', 'finance_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id) {
      return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
    }

    await ensureStudentFeeBalancesForSchool(user.school_id);
    const studentFeeBalanceModel = getStudentFeeBalanceModel();

    if (!studentFeeBalanceModel) {
      return NextResponse.json(
        { error: 'Fee balances are not ready yet. Please restart the dev server once and try again.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const balances: BalanceRow[] = await studentFeeBalanceModel.findMany({
      where: {
        school_id: user.school_id,
        student: {
          status: 'active',
        },
      },
      include: {
        student: {
          include: {
            class: {
              select: {
                class_name: true,
              },
            },
            parent: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        schoolFee: {
          select: {
            id: true,
            fee_type: true,
            amount: true,
            academic_year: true,
            term: true,
            description: true,
          },
        },
      },
      orderBy: [
        { student: { name: 'asc' } },
        { schoolFee: { academic_year: 'desc' } },
        { schoolFee: { term: 'asc' } },
      ],
    });

    const rows = balances
      .map((balance: BalanceRow): FeeCheckerRow => {
        const totalAmount = balance.schoolFee.amount;
        const amountPaid = Number(balance.amount_paid || 0);
        const amountLeft = calculateAmountLeft(totalAmount, amountPaid);
        const parentName = balance.student.parent?.name || balance.student.parent_name || 'Parent not linked';
        const parentPhone = balance.student.parent?.phone || balance.student.parent_phone || 'No phone on file';

        return {
          id: balance.id,
          student_id: balance.student_id,
          school_fee_id: balance.school_fee_id,
          parent_name: parentName,
          parent_phone: parentPhone,
          child_name: balance.student.name,
          class_name: balance.student.class?.class_name || 'No class',
          fee_type: balance.schoolFee.fee_type,
          fee_description: balance.schoolFee.description,
          academic_year: balance.schoolFee.academic_year,
          term: balance.schoolFee.term,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          amount_left: amountLeft,
          status: calculateFeeStatus(totalAmount, amountPaid),
          updated_at: balance.updated_at,
        };
      })
      .filter((row: FeeCheckerRow) => {
        if (!search) return true;
        return (
          row.parent_name.toLowerCase().includes(search) ||
          row.parent_phone.includes(search) ||
          row.child_name.toLowerCase().includes(search) ||
          row.class_name.toLowerCase().includes(search) ||
          row.fee_type.toLowerCase().includes(search) ||
          row.academic_year.toLowerCase().includes(search) ||
          (row.term || '').toLowerCase().includes(search)
        );
      });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching fee checker data:', error);
    return NextResponse.json({ error: 'Failed to fetch fee checker data.' }, { status: 500 });
  }
}
