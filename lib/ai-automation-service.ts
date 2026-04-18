import { prisma } from '@/lib/prisma';
import { generateAiCompletion } from '@/lib/ai-provider';
import { sendTelegramMessage } from '@/lib/telegram-service';
import {
  getAiSchoolSetting,
  getAiSchoolSettingsMap,
  listRecentAiReports,
  listRecentAiReportsForSchool,
  saveAiReport,
  upsertAiSchoolSetting,
} from '@/lib/ai-storage';

type SchoolOperationalMetrics = {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
  totalPayments: number;
  totalRevenue: number;
  totalAttendanceRecords: number;
  totalAbsentRecords: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getReportIntervalHours() {
  const value = Number(process.env.AI_REPORT_INTERVAL_HOURS || 10);
  if (!Number.isFinite(value) || value <= 0) return 10;
  return value;
}

function shouldRunReport(lastReportSentAt: Date | null) {
  if (!lastReportSentAt) return true;
  const now = Date.now();
  const elapsedMs = now - lastReportSentAt.getTime();
  const requiredMs = getReportIntervalHours() * 60 * 60 * 1000;
  return elapsedMs >= requiredMs;
}

function getInterReportDelayMs() {
  const raw = Number(process.env.AI_INTER_REPORT_DELAY_MS ?? 900);
  if (!Number.isFinite(raw)) return 900;
  return Math.min(Math.max(Math.floor(raw), 0), 20000);
}

async function getSchoolOperationalMetrics(schoolId: string): Promise<SchoolOperationalMetrics | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      school_name: true,
      _count: {
        select: {
          students: true,
          classes: true,
        },
      },
    },
  });

  if (!school) return null;

  const [usersByRole, paymentAgg, attendanceByStatus] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      where: {
        school_id: schoolId,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        school_id: schoolId,
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        class: {
          is: {
            school_id: schoolId,
          },
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalTeachers = usersByRole
    .filter((entry) => entry.role === 'teacher')
    .reduce((sum, item) => sum + item._count._all, 0);

  const totalParents = usersByRole
    .filter((entry) => entry.role === 'parent')
    .reduce((sum, item) => sum + item._count._all, 0);

  const totalAttendanceRecords = attendanceByStatus.reduce((sum, item) => sum + item._count._all, 0);
  const totalAbsentRecords = attendanceByStatus
    .filter((entry) => entry.status === 'absent')
    .reduce((sum, item) => sum + item._count._all, 0);

  return {
    schoolId: school.id,
    schoolName: school.school_name,
    totalStudents: school._count.students,
    totalTeachers,
    totalClasses: school._count.classes,
    totalParents,
    totalPayments: paymentAgg._count._all,
    totalRevenue: paymentAgg._sum.amount || 0,
    totalAttendanceRecords,
    totalAbsentRecords,
  };
}

function buildSchoolReportPrompt(metrics: SchoolOperationalMetrics) {
  return [
    `Create an operational school report for ${metrics.schoolName}.`,
    'Order findings by business impact and urgency.',
    'Use markdown with sections:',
    '1) Critical',
    '2) High',
    '3) Medium',
    '4) Low',
    '5) Immediate Actions (next 24h)',
    'Focus on attendance, revenue, class operations, and data quality risk.',
    '',
    'School metrics:',
    `- Total Students: ${metrics.totalStudents}`,
    `- Total Teachers: ${metrics.totalTeachers}`,
    `- Total Classes: ${metrics.totalClasses}`,
    `- Total Parents: ${metrics.totalParents}`,
    `- Total Payments: ${metrics.totalPayments}`,
    `- Total Revenue: ${metrics.totalRevenue.toFixed(2)}`,
    `- Attendance Records: ${metrics.totalAttendanceRecords}`,
    `- Absent Records: ${metrics.totalAbsentRecords}`,
  ].join('\n');
}

export async function runSchoolAiReport(params: { schoolId: string; force?: boolean }) {
  const setting = await getAiSchoolSetting(params.schoolId);
  const force = Boolean(params.force);

  if (!setting.aiEnabled && !force) {
    return {
      status: 'skipped' as const,
      reason: 'AI is disabled for this school.',
    };
  }

  if (!force && !shouldRunReport(setting.lastReportSentAt)) {
    return {
      status: 'skipped' as const,
      reason: `Report interval (${getReportIntervalHours()}h) not reached yet.`,
    };
  }

  const metrics = await getSchoolOperationalMetrics(params.schoolId);
  if (!metrics) {
    return {
      status: 'error' as const,
      error: 'School not found.',
    };
  }

  const aiResult = await generateAiCompletion({
    systemPrompt: 'You are a precise school operations AI advisor.',
    userPrompt: buildSchoolReportPrompt(metrics),
    temperature: 0.2,
    maxTokens: 700,
  });

  if (!aiResult.success || !aiResult.text) {
    return {
      status: 'error' as const,
      error: aiResult.error || 'Failed to generate AI report.',
    };
  }

  let sentToTelegram = false;
  let telegramError: string | null = null;

  const telegramResult = await sendTelegramMessage(
    `*${metrics.schoolName} AI Report*\n\n${aiResult.text}`,
    setting.telegramChatId || undefined
  );

  if (telegramResult.success) {
    sentToTelegram = true;
  } else {
    telegramError = telegramResult.error || 'Unknown Telegram delivery error.';
  }

  await saveAiReport({
    schoolId: params.schoolId,
    reportScope: 'school',
    reportTitle: `${metrics.schoolName} AI Operations Report`,
    reportBody: aiResult.text,
    sentToTelegram,
    telegramError,
  });

  await upsertAiSchoolSetting({
    schoolId: params.schoolId,
    aiEnabled: setting.aiEnabled || force,
    telegramChatId: setting.telegramChatId,
    lastReportSentAt: new Date(),
  });

  return {
    status: 'generated' as const,
    report: aiResult.text,
    sentToTelegram,
    telegramError,
    schoolName: metrics.schoolName,
  };
}

export async function runDueAiReports() {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      school_name: true,
    },
  });

  const settingsMap = await getAiSchoolSettingsMap();
  const enabledSchools = schools.filter((school) => settingsMap[school.id]?.aiEnabled === true);

  const results: Array<{
    schoolId: string;
    schoolName: string;
    status: 'generated' | 'skipped' | 'error';
    reason?: string;
    error?: string;
  }> = [];

  const interReportDelayMs = getInterReportDelayMs();

  for (let index = 0; index < enabledSchools.length; index += 1) {
    const school = enabledSchools[index];
    const result = await runSchoolAiReport({ schoolId: school.id });

    if (result.status === 'generated') {
      results.push({
        schoolId: school.id,
        schoolName: school.school_name,
        status: 'generated',
      });
    } else if (result.status === 'skipped') {
      results.push({
        schoolId: school.id,
        schoolName: school.school_name,
        status: 'skipped',
        reason: result.reason,
      });
    } else {
      results.push({
        schoolId: school.id,
        schoolName: school.school_name,
        status: 'error',
        error: result.error,
      });
    }

    if (interReportDelayMs > 0 && index < enabledSchools.length - 1) {
      await sleep(interReportDelayMs);
    }
  }

  return {
    enabledCount: enabledSchools.length,
    generatedCount: results.filter((item) => item.status === 'generated').length,
    skippedCount: results.filter((item) => item.status === 'skipped').length,
    errorCount: results.filter((item) => item.status === 'error').length,
    results,
  };
}

export async function getSuperAdminAiDashboardData() {
  const reports = await listRecentAiReports(20);
  const schoolIds = reports.map((report) => report.schoolId).filter(Boolean) as string[];

  const schools = schoolIds.length
    ? await prisma.school.findMany({
        where: {
          id: { in: schoolIds },
        },
        select: {
          id: true,
          school_name: true,
        },
      })
    : [];

  const schoolMap = Object.fromEntries(schools.map((school) => [school.id, school.school_name]));

  return reports.map((report) => ({
    ...report,
    schoolName: report.schoolId ? schoolMap[report.schoolId] || 'Unknown school' : 'Global',
  }));
}

export async function getSchoolAdminAiOverview(schoolId: string) {
  const setting = await getAiSchoolSetting(schoolId);
  const reports = setting.aiEnabled ? await listRecentAiReportsForSchool(schoolId, 5) : [];

  return {
    setting,
    reports,
  };
}

export async function answerSchoolAdminQuestion(params: { schoolId: string; question: string }) {
  const setting = await getAiSchoolSetting(params.schoolId);
  if (!setting.aiEnabled) {
    return {
      success: false,
      error: 'AI is disabled for this school. Ask super admin to enable it.',
      status: 403,
    };
  }

  const metrics = await getSchoolOperationalMetrics(params.schoolId);
  if (!metrics) {
    return {
      success: false,
      error: 'School data not found.',
      status: 404,
    };
  }

  const recentReports = await listRecentAiReportsForSchool(params.schoolId, 3);
  const reportContext = recentReports
    .map((report, index) => `Report ${index + 1} (${report.createdAt.toISOString()}):\n${report.reportBody}`)
    .join('\n\n');

  const prompt = [
    `You are an AI assistant for ${metrics.schoolName}.`,
    'Only answer using this school context. Do not reference any other school.',
    'If data is not available, say so directly and suggest the next practical step.',
    '',
    'School metrics:',
    `- Students: ${metrics.totalStudents}`,
    `- Teachers: ${metrics.totalTeachers}`,
    `- Classes: ${metrics.totalClasses}`,
    `- Parents: ${metrics.totalParents}`,
    `- Payments: ${metrics.totalPayments}`,
    `- Revenue: ${metrics.totalRevenue.toFixed(2)}`,
    `- Attendance Records: ${metrics.totalAttendanceRecords}`,
    `- Absent Records: ${metrics.totalAbsentRecords}`,
    '',
    'Recent reports context:',
    reportContext || 'No previous report yet.',
    '',
    `Admin question: ${params.question}`,
  ].join('\n');

  const aiResult = await generateAiCompletion({
    systemPrompt: 'You are a concise school operations assistant.',
    userPrompt: prompt,
    temperature: 0.2,
    maxTokens: 500,
  });

  if (!aiResult.success || !aiResult.text) {
    return {
      success: false,
      error: aiResult.error || 'Failed to answer question.',
      status: 502,
    };
  }

  return {
    success: true,
    answer: aiResult.text,
  };
}

export async function answerSuperAdminQuestion(params: { question: string }) {
  const [
    totalSchools,
    totalStudents,
    totalTeachers,
    totalUsers,
    totalPayments,
    attendanceByStatus,
    topSchools,
    recentReports,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.student.count(),
    prisma.user.count({ where: { role: 'teacher' } }),
    prisma.user.count(),
    prisma.payment.aggregate({
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.school.findMany({
      select: {
        school_name: true,
        _count: {
          select: {
            students: true,
            classes: true,
            users: true,
          },
        },
      },
      orderBy: {
        students: {
          _count: 'desc',
        },
      },
      take: 5,
    }),
    listRecentAiReports(5),
  ]);

  const totalAttendance = attendanceByStatus.reduce((sum, item) => sum + item._count._all, 0);
  const totalAbsent = attendanceByStatus
    .filter((item) => item.status === 'absent')
    .reduce((sum, item) => sum + item._count._all, 0);

  const schoolLines = topSchools.map((school, index) => {
    return `${index + 1}. ${school.school_name} (students: ${school._count.students}, classes: ${school._count.classes}, users: ${school._count.users})`;
  });

  const reportLines = recentReports.map((report, index) => {
    return `Report ${index + 1} (${report.createdAt.toISOString()}): ${report.reportTitle}`;
  });

  const prompt = [
    'You are the super admin AI assistant for a school management SaaS platform.',
    'Answer accurately using the system context below.',
    'If information is not in the context, say it clearly and suggest how to get it.',
    'Keep response practical and concise.',
    '',
    'System context:',
    `- Total Schools: ${totalSchools}`,
    `- Total Students: ${totalStudents}`,
    `- Total Teachers: ${totalTeachers}`,
    `- Total Users: ${totalUsers}`,
    `- Total Payments: ${totalPayments._count._all}`,
    `- Total Revenue: ${(totalPayments._sum.amount || 0).toFixed(2)}`,
    `- Attendance Records: ${totalAttendance}`,
    `- Absent Records: ${totalAbsent}`,
    '',
    'Largest schools:',
    schoolLines.join('\n') || 'No schools found.',
    '',
    'Recent AI reports:',
    reportLines.join('\n') || 'No reports found.',
    '',
    `Question: ${params.question}`,
  ].join('\n');

  const aiResult = await generateAiCompletion({
    systemPrompt: 'You are a reliable operations intelligence assistant for platform super admins.',
    userPrompt: prompt,
    temperature: 0.2,
    maxTokens: 600,
  });

  if (!aiResult.success || !aiResult.text) {
    return {
      success: false,
      error: aiResult.error || 'Failed to answer super admin question.',
      status: 502,
    };
  }

  return {
    success: true,
    answer: aiResult.text,
  };
}
