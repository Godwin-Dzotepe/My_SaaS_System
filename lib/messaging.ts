import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import { canComposeToRole } from '@/lib/message-permissions';

export async function getRecipientsForMessage(sender: {
  id: string;
  role: Role;
  school_id: string | null;
}, recipientRole: Role) {
  if (!canComposeToRole(sender.role, recipientRole)) {
    throw new Error('You are not allowed to send messages to this role.');
  }

  if (sender.role === 'super_admin') {
    return prisma.user.findMany({
      where: {
        role: 'school_admin',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        school_id: true,
        school: {
          select: {
            school_name: true,
          },
        },
      },
    });
  }

  if (!sender.school_id) {
    throw new Error('Your account is not linked to a school.');
  }

  return prisma.user.findMany({
    where: {
      role: recipientRole,
      school_id: sender.school_id,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      school_id: true,
      school: {
        select: {
          school_name: true,
        },
      },
    },
  });
}
