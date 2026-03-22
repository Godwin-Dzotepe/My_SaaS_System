import type { Role } from '@prisma/client';

export const SCHOOL_ADMIN_ROLES: Role[] = ['school_admin'];
export const SCHOOL_MESSAGE_TARGETS: Role[] = ['teacher', 'parent', 'secretary', 'finance_admin', 'school_admin'];

export function canComposeToRole(senderRole: Role, recipientRole: Role) {
  if (senderRole === 'super_admin') {
    return recipientRole === 'school_admin';
  }

  if (senderRole === 'school_admin') {
    return SCHOOL_MESSAGE_TARGETS.includes(recipientRole);
  }

  if (senderRole === 'teacher' || senderRole === 'parent') {
    return recipientRole === 'school_admin';
  }

  return false;
}

export function getAllowedRecipientRoles(senderRole: Role) {
  if (senderRole === 'super_admin') {
    return SCHOOL_ADMIN_ROLES;
  }

  if (senderRole === 'school_admin') {
    return SCHOOL_MESSAGE_TARGETS;
  }

  if (senderRole === 'teacher' || senderRole === 'parent') {
    return SCHOOL_ADMIN_ROLES;
  }

  return [] as Role[];
}
