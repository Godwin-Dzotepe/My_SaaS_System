import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';

const schema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/students/bulk/hard-delete
 * Permanently deletes students. SUPER ADMIN ONLY.
 */
export const POST = withAuth(
  async ({ req, session }) => {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { studentIds } = parsed.data;

    const result = await prisma.student.deleteMany({
      where: { id: { in: studentIds } },
    });

    return NextResponse.json({ deleted: result.count });
  },
  { roles: ['super_admin'] }
);
