import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize } from '@/lib/api-auth';

const paymentSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().min(1),
  paymentMethod: z.enum(['MOMO', 'BANK_TRANSFER', 'CARD', 'CASH']),
  referralName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['parent']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { student_id, amount, paymentMethod, referralName } = validation.data;

    // Get student to verify they belong to this parent
    const student = await prisma.student.findUnique({
      where: { id: student_id }
    });

    if (!student || student.parent_phone !== user.phone) {
      return NextResponse.json({ error: 'Unauthorized - student does not belong to parent' }, { status: 403 });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        student_id,
        parent_id: user.userId,
        school_id: student.school_id,
        amount,
        paymentMethod,
        referralName,
        status: 'PENDING'
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['parent', 'school_admin', 'finance_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    let where: any = {};
    
    // Parents can only see their own payments
    if (user.role === 'parent') {
      where.parent_id = user.userId;
    } else if (user.role === 'school_admin' || user.role === 'secretary' || user.role === 'finance_admin') {
      where.school_id = user.schoolId;
    }
    // Super admin can see all

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            student_number: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
