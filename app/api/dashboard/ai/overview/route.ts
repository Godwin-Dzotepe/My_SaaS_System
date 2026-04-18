import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getSchoolAdminAiOverview, runSchoolAiReport } from '@/lib/ai-automation-service';

export const GET = withAuth(
  async ({ session }) => {
    try {
      const schoolId = session.user.school_id;

      if (!schoolId) {
        return NextResponse.json({ error: 'School context not found.' }, { status: 400 });
      }

      const autoReportResult = await runSchoolAiReport({ schoolId });

      const overview = await getSchoolAdminAiOverview(schoolId);

      return NextResponse.json({
        aiEnabled: overview.setting.aiEnabled,
        lastReportSentAt: overview.setting.lastReportSentAt,
        reports: overview.reports,
        autoReportStatus: autoReportResult.status,
        autoReportNote:
          autoReportResult.status === 'generated'
            ? 'A new due report was generated.'
            : autoReportResult.status === 'skipped'
              ? autoReportResult.reason || null
              : autoReportResult.error || null,
      });
    } catch (error) {
      console.error('[dashboard.ai.overview] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['school_admin'] }
);
