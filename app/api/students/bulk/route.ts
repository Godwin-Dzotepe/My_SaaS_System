import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limiter';
import { z } from 'zod';

const bulkSchema = z.discriminatedUnion('action', [
  z.object({
    action:     z.literal('delete'),
    studentIds: z.array(z.string().uuid()).min(1).max(100),
  }),
  z.object({
    action:     z.literal('update_class'),
    studentIds: z.array(z.string().uuid()).min(1).max(100),
    class_id:   z.string().uuid(),
  }),
]);

export const POST = withAuth(
  async ({ req, session }) => {
    const body = await req.json().catch(() => null);
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
    }

    const { action, studentIds } = parsed.data;
    const schoolId = session.user.school_id!;
    const ip       = getClientIp(req);

    if (action === 'delete') {
      const result = await prisma.student.updateMany({
        where: { id: { in: studentIds }, school_id: schoolId, deleted_at: null },
        data:  { deleted_at: new Date() },
      });

      logAudit({
        prismaClient: prisma,
        schoolId,
        performedBy:  session.user.id,
        actorRole:    session.user.role,
        action:       'DELETE',
        entityType:   'Student',
        entityId:     studentIds.join(','),
        changes:      { before: { studentIds, count: result.count } },
        ipAddress:    ip,
      });

      return NextResponse.json({ deleted: result.count });
    }

    if (action === 'update_class') {
      const { class_id } = parsed.data as { action: 'update_class'; studentIds: string[]; class_id: string };

      // Validate class belongs to same school
      const cls = await prisma.class.findFirst({ where: { id: class_id, school_id: schoolId } });
      if (!cls) {
        return NextResponse.json({ error: 'Class not found or does not belong to your school.' }, { status: 404 });
      }

      const result = await prisma.student.updateMany({
        where: { id: { in: studentIds }, school_id: schoolId, deleted_at: null },
        data:  { class_id },
      });

      logAudit({
        prismaClient: prisma,
        schoolId,
        performedBy:  session.user.id,
        actorRole:    session.user.role,
        action:       'UPDATE',
        entityType:   'Student',
        entityId:     studentIds.join(','),
        changes:      { after: { class_id, count: result.count } },
        ipAddress:    ip,
      });

      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  },
  { roles: ['school_admin', 'secretary', 'super_admin'] }
);
