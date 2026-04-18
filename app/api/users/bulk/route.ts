import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limiter';
import { z } from 'zod';

const PROTECTED_ROLES = new Set(['super_admin', 'school_admin']);

const schema = z.object({
  action:  z.literal('delete'),
  userIds: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/users/bulk
 * Bulk soft-delete teachers/secretaries/finance_admins.
 * Protected roles (super_admin, school_admin) cannot be bulk-deleted.
 */
export const POST = withAuth(
  async ({ req, session }) => {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
    }

    const { userIds } = parsed.data;
    const schoolId    = session.user.school_id!;

    // Fetch target users to verify roles and school
    const users = await prisma.user.findMany({
      where:  { id: { in: userIds }, school_id: schoolId },
      select: { id: true, role: true },
    });

    const safeIds = users
      .filter((u) => !PROTECTED_ROLES.has(u.role))
      .map((u) => u.id);

    if (safeIds.length === 0) {
      return NextResponse.json({ error: 'No eligible users to delete.' }, { status: 400 });
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data:  { deleted_at: new Date() },
    });

    logAudit({
      prismaClient: prisma,
      schoolId,
      performedBy:  session.user.id,
      actorRole:    session.user.role,
      action:       'DELETE',
      entityType:   'User',
      entityId:     safeIds.join(','),
      changes:      { before: { userIds: safeIds, count: result.count } },
      ipAddress:    getClientIp(req),
    });

    return NextResponse.json({ deleted: result.count });
  },
  { roles: ['school_admin', 'super_admin'] }
);
