import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const auth = await authorize(req, ['super_admin', 'school_admin', 'finance_admin', 'secretary']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { paymentId } = await params;
  const { status } = await req.json();

  if (!paymentId) {
    return NextResponse.json({ message: 'Payment ID is required.' }, { status: 400 });
  }

  // Basic validation for status
  if (!status || !['PAID', 'FAILED', 'CANCELLED'].includes(status.toUpperCase())) {
    return NextResponse.json({ message: 'Invalid status provided. Allowed statuses are PAID, FAILED, CANCELLED.' }, { status: 400 });
  }

  try {
    // Fetch the payment to check school ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { school: true }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found.' }, { status: 404 });
    }

    // Validate school access
    if (!validateSchool(user, payment.school_id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status.toUpperCase(),
        paidAt: status.toUpperCase() === 'PAID' ? new Date() : null,
      },
    });

    return NextResponse.json(updatedPayment);

  } catch (error: unknown) {
    console.error(`Error updating payment ${paymentId} status:`, error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ message: 'Payment not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update payment status.' }, { status: 500 });
  }
}
