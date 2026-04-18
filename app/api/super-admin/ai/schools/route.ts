import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getAiSchoolSettingsMap, upsertAiSchoolSetting } from '@/lib/ai-storage';

export const GET = withAuth(
  async () => {
    try {
      const schools = await prisma.school.findMany({
        select: {
          id: true,
          school_name: true,
          isActive: true,
        },
        orderBy: {
          school_name: 'asc',
        },
      });

      const settingsMap = await getAiSchoolSettingsMap();

      return NextResponse.json({
        schools: schools.map((school) => {
          const setting = settingsMap[school.id];
          return {
            schoolId: school.id,
            schoolName: school.school_name,
            isActive: school.isActive,
            aiEnabled: setting?.aiEnabled || false,
            telegramChatId: setting?.telegramChatId || null,
            lastReportSentAt: setting?.lastReportSentAt || null,
          };
        }),
      });
    } catch (error) {
      console.error('[super-admin.ai.schools.GET] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);

export const POST = withAuth(
  async ({ req }) => {
    try {
      const body = await req.json();
      const schoolId = String(body?.schoolId || '').trim();
      const aiEnabled = Boolean(body?.aiEnabled);
      const telegramChatId =
        typeof body?.telegramChatId === 'string' && body.telegramChatId.trim()
          ? body.telegramChatId.trim()
          : null;

      if (!schoolId) {
        return NextResponse.json({ error: 'schoolId is required.' }, { status: 400 });
      }

      const schoolExists = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } });
      if (!schoolExists) {
        return NextResponse.json({ error: 'School not found.' }, { status: 404 });
      }

      const setting = await upsertAiSchoolSetting({
        schoolId,
        aiEnabled,
        telegramChatId,
      });

      return NextResponse.json({
        message: `AI has been ${aiEnabled ? 'enabled' : 'disabled'} for this school.`,
        setting,
      });
    } catch (error) {
      console.error('[super-admin.ai.schools.POST] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);
