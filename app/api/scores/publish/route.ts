import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms-service';
import { buildResultPublishPayload, RESULT_PUBLISHED_NOTIFICATION } from '@/lib/result-publishing';

const publishSchema = z.object({
  class_id: z.string().min(1, 'Class is required.'),
  academic_year: z.string().min(1, 'Academic year is required.'),
  term: z.string().min(1, 'Term is required.'),
});

function isMissingSchoolColumnError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('sms_username') ||
    message.includes('logo_url') ||
    message.includes('isactive') ||
    message.includes('deactivationmessage') ||
    message.includes('column') ||
    message.includes('does not exist') ||
    message.includes('unknown field')
  );
}

async function findSchoolForPublishing(schoolId: string) {
  try {
    return await prisma.school.findUnique({
      where: { id: schoolId },
      select: { school_name: true, sms_username: true },
    });
  } catch (error) {
    if (!isMissingSchoolColumnError(error)) {
      throw error;
    }

    const fallbackSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { school_name: true },
    });

    return fallbackSchool
      ? {
          ...fallbackSchool,
          sms_username: null,
        }
      : null;
  }
}

async function createPublishNotifications(
  schoolId: string,
  publisherName: string,
  schoolName: string,
  notifications: Array<{ user_id: string; title: string; body: string }>
) {
  try {
    await prisma.appNotification.createMany({
      data: notifications.map((notification) => ({
        ...notification,
        school_id: schoolId,
        source_role: 'school_admin' as const,
        source_name: publisherName,
        school_name: schoolName,
      })),
    });
  } catch (error) {
    console.warn('[Result Publish] Rich notification insert failed, retrying with minimal fields:', error);

    await prisma.appNotification.createMany({
      data: notifications,
    });
  }
}

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      const body = await req.json();
      const validation = publishSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: 'Invalid publish request.', details: validation.error.format() }, { status: 400 });
      }

      if (!session.user.school_id) {
        return NextResponse.json({ error: 'School ID is required.' }, { status: 400 });
      }

      const schoolId = session.user.school_id;
      const { class_id, academic_year, term } = validation.data;

      const [school, classRoom, students, admin] = await Promise.all([
        findSchoolForPublishing(schoolId),
        prisma.class.findFirst({
          where: {
            id: class_id,
            school_id: schoolId,
          },
          select: {
            id: true,
            class_name: true,
          },
        }),
        prisma.student.findMany({
          where: {
            class_id,
            school_id: schoolId,
            status: 'active',
          },
          select: {
            id: true,
            name: true,
            parent_id: true,
            parent_phone: true,
            father_phone: true,
            mother_phone: true,
            guardian_phone: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        }),
      ]);

      if (!classRoom) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }

      if (students.length === 0) {
        return NextResponse.json({ error: 'No students found in this class.' }, { status: 404 });
      }

      const studentIds = students.map((student) => student.id);
      const scores = await prisma.score.findMany({
        where: {
          student_id: { in: studentIds },
          academic_year,
          term,
        },
        select: {
          id: true,
          student_id: true,
        },
      });

      if (scores.length === 0) {
        return NextResponse.json({ error: 'No scores found for that class and period.' }, { status: 404 });
      }

      const phoneSet = new Set<string>();
      const parentIds = new Set<string>();

      students.forEach((student) => {
        if (student.parent_id) parentIds.add(student.parent_id);
        [student.parent_phone, student.father_phone, student.mother_phone, student.guardian_phone]
          .filter((phone): phone is string => Boolean(phone))
          .forEach((phone) => phoneSet.add(phone));
      });

      const parentUsers = await prisma.user.findMany({
        where: {
          role: 'parent',
          school_id: schoolId,
          OR: [
            { id: { in: [...parentIds] } },
            { phone: { in: [...phoneSet] } },
          ],
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

      const parentByPhone = new Map(parentUsers.map((parent) => [parent.phone, parent]));
      const parentById = new Map(parentUsers.map((parent) => [parent.id, parent]));
      const schoolName = school?.school_name || 'School';
      const schoolSmsUsername = school?.sms_username || null;
      const publisherName = admin?.name || 'School Admin';

      const notifications: Array<{ user_id: string; title: string; body: string }> = [];
      const smsQueue = new Map<string, string>();

      for (const student of students) {
        const hasScore = scores.some((score) => score.student_id === student.id);
        if (!hasScore) {
          continue;
        }

        const payload = buildResultPublishPayload({
          studentId: student.id,
          studentName: student.name,
          academicYear: academic_year,
          term,
          schoolName,
        });

        const recipients = new Map<string, { id: string; phone: string }>();
        if (student.parent_id && parentById.has(student.parent_id)) {
          const parent = parentById.get(student.parent_id)!;
          recipients.set(parent.id, { id: parent.id, phone: parent.phone });
        }

        [student.parent_phone, student.father_phone, student.mother_phone, student.guardian_phone]
          .filter((phone): phone is string => Boolean(phone))
          .forEach((phone) => {
            const parent = parentByPhone.get(phone);
            if (parent) {
              recipients.set(parent.id, { id: parent.id, phone: parent.phone });
            }
          });

        recipients.forEach((recipient) => {
          notifications.push({
            user_id: recipient.id,
            title: RESULT_PUBLISHED_NOTIFICATION,
            body: payload,
          });

          smsQueue.set(
            recipient.phone,
            `${schoolName}: ${student.name}'s ${term} ${academic_year} results are now available. Please log in to review them.`
          );
        });
      }

      if (notifications.length === 0) {
        return NextResponse.json({ error: 'No parent accounts were found to notify.' }, { status: 404 });
      }

      await createPublishNotifications(schoolId, publisherName, schoolName, notifications);

      await Promise.all(
        [...smsQueue.entries()].map(([phone, message]) =>
          sendSMS({ phone, message, senderName: schoolName, smsUsername: schoolSmsUsername }).catch((smsError) => {
            console.warn('[Result Publish] SMS failed:', smsError);
            return null;
          })
        )
      );

      return NextResponse.json({
        message: 'Results published successfully.',
        class_name: classRoom.class_name,
        academic_year,
        term,
        notifications_sent: notifications.length,
        sms_sent: smsQueue.size,
      });
    } catch (error: any) {
      console.error('Error publishing results:', error);
      return NextResponse.json({ error: error?.message || 'Failed to publish results.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin'],
  }
);
