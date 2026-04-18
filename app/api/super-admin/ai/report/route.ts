import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getAiConfigStatus } from '@/lib/ai-provider';
import { getTelegramConfigStatus } from '@/lib/telegram-service';
import { getSuperAdminAiDashboardData, runDueAiReports, runSchoolAiReport } from '@/lib/ai-automation-service';
import { deleteAiReport, deleteAllAiReports } from '@/lib/ai-storage';

export const GET = withAuth(
  async () => {
    try {
      const reports = await getSuperAdminAiDashboardData();

      return NextResponse.json({
        reports,
      });
    } catch (error) {
      console.error('[super-admin.ai.report.GET] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);

export const DELETE = withAuth(
  async ({ req }) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id')?.trim();

      if (id) {
        await deleteAiReport(id);
        return NextResponse.json({ ok: true });
      }

      // No id → delete all
      await deleteAllAiReports();
      return NextResponse.json({ ok: true, cleared: true });
    } catch (error) {
      console.error('[super-admin.ai.report.DELETE] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);

export const POST = withAuth(
  async ({ req }) => {
    try {
      const aiStatus = getAiConfigStatus();
      const telegramStatus = getTelegramConfigStatus();

      if (!aiStatus.configured) {
        return NextResponse.json(
          {
            error: 'AI is not configured. Set AI_API_KEY in your environment.',
            config: {
              ai: aiStatus,
              telegram: telegramStatus,
            },
          },
          { status: 400 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const mode = String(body?.mode || 'due');

      if (mode === 'school') {
        const schoolId = String(body?.schoolId || '').trim();
        if (!schoolId) {
          return NextResponse.json({ error: 'schoolId is required for school mode.' }, { status: 400 });
        }

        const result = await runSchoolAiReport({ schoolId, force: true });
        if (result.status === 'error') {
          return NextResponse.json({ error: result.error || 'Failed to generate school report.' }, { status: 502 });
        }

        return NextResponse.json(
          {
            message:
              result.status === 'generated'
                ? `AI report generated for ${result.schoolName}.`
                : result.reason || 'Report skipped.',
            report: result.status === 'generated' ? result.report : null,
            sentToTelegram: result.status === 'generated' ? result.sentToTelegram : false,
            telegramSendError: result.status === 'generated' ? result.telegramError : null,
            config: {
              ai: aiStatus,
              telegram: telegramStatus,
            },
          }
        );
      }

      const dueResult = await runDueAiReports();
      const reports = await getSuperAdminAiDashboardData();

      return NextResponse.json({
        message: `AI report run completed. Generated: ${dueResult.generatedCount}, skipped: ${dueResult.skippedCount}, errors: ${dueResult.errorCount}.`,
        runSummary: dueResult,
        reports,
        config: {
          ai: aiStatus,
          telegram: telegramStatus,
        },
      });
    } catch (error) {
      console.error('[super-admin.ai.report] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);
