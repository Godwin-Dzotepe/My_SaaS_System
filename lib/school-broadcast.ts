import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms-service';

export async function sendSchoolBroadcastToParents(schoolId: string, message: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { school_name: true },
  });

  if (!school) {
    throw new Error('School not found for SMS broadcast');
  }

  const parents = await prisma.user.findMany({
    where: {
      role: 'parent',
      school_id: schoolId,
    },
    select: {
      id: true,
      phone: true,
    },
  });

  const uniquePhones = [...new Set(parents.map((parent) => parent.phone).filter(Boolean))];
  const smsMessage = `${school.school_name}: ${message}`;

  const results = await Promise.all(
    uniquePhones.map((phone) => sendSMS({ phone, message: smsMessage }))
  );

  return {
    schoolName: school.school_name,
    recipients: uniquePhones.length,
    sent: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
  };
}
