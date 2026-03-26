import { prisma } from '@/lib/prisma';

function isMissingSchoolBrandingColumnError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('sms_username') ||
    message.includes('logo_url') ||
    message.includes('column') ||
    message.includes('does not exist') ||
    message.includes('unknown field')
  );
}

export async function findStudentsForParentFirstLogin(where: Record<string, unknown>) {
  try {
    return await prisma.student.findMany({
      where: where as any,
      select: {
        name: true,
        school_id: true,
        parent_name: true,
        parent_phone: true,
        father_name: true,
        father_phone: true,
        mother_name: true,
        mother_phone: true,
        guardian_name: true,
        guardian_phone: true,
        school: {
          select: {
            school_name: true,
            sms_username: true,
          },
        },
      },
      take: 5,
    });
  } catch (error) {
    if (!isMissingSchoolBrandingColumnError(error)) {
      throw error;
    }

    const fallbackStudents = await prisma.student.findMany({
      where: where as any,
      select: {
        name: true,
        school_id: true,
        parent_name: true,
        parent_phone: true,
        father_name: true,
        father_phone: true,
        mother_name: true,
        mother_phone: true,
        guardian_name: true,
        guardian_phone: true,
        school: {
          select: {
            school_name: true,
          },
        },
      },
      take: 5,
    });

    return fallbackStudents.map((student) => ({
      ...student,
      school: student.school
        ? {
            ...student.school,
            sms_username: null,
          }
        : null,
    }));
  }
}
