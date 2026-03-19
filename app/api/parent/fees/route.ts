import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for query parameters
const querySchema = z.object({
  phone: z.string().min(10), // Parent's login phone number
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  const validation = querySchema.safeParse({ phone });

  if (!validation.success) {
    return NextResponse.json({ error: 'Missing or invalid phone number' }, { status: 400 });
  }

  try {
    const parentPhone = validation.data.phone;

    // Find the parent user by phone
    const parent = await prisma.user.findUnique({
      where: { phone: parentPhone }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Fetch payments associated with this parent's children
    const payments = await prisma.payment.findMany({
      where: {
        parent_id: parent.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            parent_phone: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the data to match the FeeItem interface used in the frontend
    const transformedFees = payments.map((payment): FeeItem => {
      const amountDue = payment.amount - (payment.status === 'PAID' ? payment.amount : 0);
      const isOverdue = payment.status === 'PENDING' && payment.created_at < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days overdue
      const status = payment.status === 'PAID' ? 'Paid' : (isOverdue ? 'Overdue' : 'Due');

      return {
        id: payment.id,
        childName: payment.student.name,
        feeType: payment.referralName || 'School Fee',
        amountPaid: payment.status === 'PAID' ? payment.amount : 0,
        amountDue: amountDue,
        dueDate: payment.created_at.toISOString(),
        status: status,
      };
    });

    return NextResponse.json(transformedFees);

  } catch (error) {
    console.error('Error fetching parent fees:', error);
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

// Interface for the fee item returned to frontend
interface FeeItem {
  id: string;
  childName: string;
  feeType: string;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  status: 'Paid' | 'Due' | 'Overdue';
}
