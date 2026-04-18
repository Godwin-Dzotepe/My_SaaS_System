/**
 * Audit log helper — fire-and-forget.
 * Never throws; a failure only logs a warning.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const SENSITIVE_FIELDS = new Set([
  'password', 'otp', 'hashedOtp', 'temporary_password',
  'otp_hash', 'otpExpiresAt', 'lastOtpSentAt',
]);

function sanitize(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_FIELDS.has(k) ? '[redacted]' : v;
  }
  return out;
}

export interface AuditParams {
  prismaClient: PrismaClient;
  schoolId?: string | null;
  performedBy: string;
  actorRole?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
}

export function logAudit(params: AuditParams): void {
  const {
    prismaClient,
    schoolId,
    performedBy,
    actorRole,
    action,
    entityType,
    entityId,
    changes,
    ipAddress,
  } = params;

  const sanitizedChanges = changes
    ? { before: sanitize(changes.before), after: sanitize(changes.after) }
    : undefined;

  prismaClient.auditLog
    .create({
      data: {
        school_id:    schoolId ?? null,
        performed_by: performedBy,
        actor_role:   actorRole ?? null,
        action,
        entity_type:  entityType,
        entity_id:    entityId,
        changes:      sanitizedChanges as object ?? null,
        ip_address:   ipAddress ?? null,
      },
    })
    .catch((err: unknown) => {
      logger.warn('[audit] Failed to write audit log', {
        error: err instanceof Error ? err.message : String(err),
        entityType,
        entityId,
        action,
      });
    });
}
