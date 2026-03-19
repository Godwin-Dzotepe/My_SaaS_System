import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  school_id: z.string().uuid(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const school_id = searchParams.get('school_id');

  const validation = querySchema.safeParse({ school_id });
  if (!validation.success) {
      return NextResponse.json({ error: 'Missing school_id' }, { status: 400 });
  }

  try {
    // Calculate total collected (status = PAID)
    const collected = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            school_id: validation.data.school_id,
            status: 'PAID'
        }
    });

    // Calculate pending (status = PENDING)
    const pending = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            school_id: validation.data.school_id,
            status: 'PENDING'
        }
    });

    return NextResponse.json({
        total_collected: collected._sum.amount || 0,
        total_pending: pending._sum.amount || 0,
        currency: 'USD' // Could be dynamic based on school settings
    });

  } catch (error) {
    console.error('Error calculating finance summary:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
