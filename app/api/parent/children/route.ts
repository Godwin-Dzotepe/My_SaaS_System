import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

  // TODO: Verify the token matches the phone number (Auth check)

  try {
    const children = await prisma.student.findMany({
        where: {
            parent_phone: validation.data.phone,
            status: 'active'
        },
        include: {
            school: {
                select: {
                    school_name: true
                }
            },
            class: {
                select: {
                    class_name: true
                }
            },
            // Optionally include latest scores or attendance summary
            scores: {
                take: 5,
                orderBy: { created_at: 'desc' }
            }
        }
    });

    return NextResponse.json(children);

  } catch (error) {
    console.error('Error fetching parent children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}
