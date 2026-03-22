import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { calculateAmountLeft, calculateFeeStatus } from '@/lib/fee-balances';

const updateBalanceSchema = z.object({
  amount_paid: z.number().min(0).optional(),
  quick_status: z.enum(['UNPAID', 'HALF_PAID', 'PAID']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(req, ['school_admin', 'finance_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;
    const body = await req.json();
    const validation = updateBalanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validation.error.format() }, { status: 400 });
    }

    const existingBalance = await prisma.studentFeeBalance.findUnique({
      where: { id },
      include: {
        schoolFee: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!existingBalance) {
      return NextResponse.json({ error: 'Fee balance not found.' }, { status: 404 });
    }

    if (!validateSchool(user, existingBalance.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const totalAmount = existingBalance.schoolFee.amount;
    let nextAmountPaid = validation.data.amount_paid ?? existingBalance.amount_paid;

    if (validation.data.quick_status) {
      if (validation.data.quick_status === 'UNPAID') {
        nextAmountPaid = 0;
      } else if (validation.data.quick_status === 'HALF_PAID') {
        nextAmountPaid = Number((totalAmount / 2).toFixed(2));
      } else if (validation.data.quick_status === 'PAID') {
        nextAmountPaid = totalAmount;
      }
    }

    nextAmountPaid = Math.min(Number(nextAmountPaid.toFixed(2)), totalAmount);

    const updatedBalance = await prisma.studentFeeBalance.update({
      where: { id },
      data: {
        amount_paid: nextAmountPaid,
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
            fee_type: true,
            amount: true,
            academic_year: true,
            term: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedBalance.id,
      parent_name: updatedBalance.student.parent?.name || updatedBalance.student.parent_name || 'Parent not linked',
      parent_phone: updatedBalance.student.parent?.phone || updatedBalance.student.parent_phone || 'No phone on file',
      child_name: updatedBalance.student.name,
      class_name: updatedBalance.student.class?.class_name || 'No class',
      fee_type: updatedBalance.schoolFee.fee_type,
      fee_description: updatedBalance.schoolFee.description,
      academic_year: updatedBalance.schoolFee.academic_year,
      term: updatedBalance.schoolFee.term,
      total_amount: updatedBalance.schoolFee.amount,
      amount_paid: updatedBalance.amount_paid,
      amount_left: calculateAmountLeft(updatedBalance.schoolFee.amount, updatedBalance.amount_paid),
      status: calculateFeeStatus(updatedBalance.schoolFee.amount, updatedBalance.amount_paid),
      updated_at: updatedBalance.updated_at,
    });
  } catch (error) {
    console.error('Error updating fee balance:', error);
    return NextResponse.json({ error: 'Failed to update fee balance.' }, { status: 500 });
  }
}
