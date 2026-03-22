import { prisma } from '@/lib/prisma';

export function getStudentFeeBalanceModel() {
  return (prisma as any).studentFeeBalance;
}

export function calculateFeeStatus(totalAmount: number, amountPaid: number) {
  if (amountPaid <= 0) return 'Unpaid';
  if (amountPaid >= totalAmount) return 'Paid';
  return 'Partially Paid';
}

export function calculateAmountLeft(totalAmount: number, amountPaid: number) {
  return Math.max(Number((totalAmount - amountPaid).toFixed(2)), 0);
}

export async function ensureStudentFeeBalancesForSchool(schoolId: string) {
  const studentFeeBalanceModel = getStudentFeeBalanceModel();
  if (!studentFeeBalanceModel) {
    return;
  }

  const [students, fees] = await Promise.all([
    prisma.student.findMany({
      where: {
        school_id: schoolId,
        status: 'active',
      },
      select: {
        id: true,
        class_id: true,
      },
    }),
    prisma.schoolFee.findMany({
      where: {
        school_id: schoolId,
        is_active: true,
      },
      select: {
        id: true,
        class_id: true,
      },
    }),
  ]);

  if (students.length === 0 || fees.length === 0) {
    return;
  }

  const candidatePairs = students.flatMap((student) =>
    fees
      .filter((fee) => !fee.class_id || fee.class_id === student.class_id)
      .map((fee) => ({
        school_id: schoolId,
        student_id: student.id,
        school_fee_id: fee.id,
      }))
  );

  if (candidatePairs.length === 0) {
    return;
  }

  await studentFeeBalanceModel.createMany({
    data: candidatePairs,
    skipDuplicates: true,
  });
}
