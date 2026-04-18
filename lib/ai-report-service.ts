import { prisma } from '@/lib/prisma';
import { generateAiCompletion } from '@/lib/ai-provider';

type SchoolReportMetrics = {
  schoolName: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents: number;
  paymentsCount: number;
  totalRevenue: number;
};

function buildPriorityPrompt(metrics: SchoolReportMetrics[]) {
  const lines = metrics.map((entry, index) => {
    return [
      `${index + 1}. ${entry.schoolName}`,
      `- Students: ${entry.totalStudents}`,
      `- Teachers: ${entry.totalTeachers}`,
      `- Classes: ${entry.totalClasses}`,
      `- Parents: ${entry.totalParents}`,
      `- Payments Count: ${entry.paymentsCount}`,
      `- Revenue: ${entry.totalRevenue.toFixed(2)}`,
    ].join('\n');
  });

  return [
    'You are an education operations analyst for a multi-school SaaS platform.',
    'Generate a concise operational report ordered by priority.',
    'Return markdown sections in this exact order:',
    '1) Critical Priorities',
    '2) High Priorities',
    '3) Medium Priorities',
    '4) Low Priorities',
    '5) Immediate Actions (next 24 hours)',
    'Keep each bullet short and concrete. Mention school names where relevant.',
    '',
    'School Metrics:',
    lines.join('\n\n'),
  ].join('\n');
}

export async function getGlobalSchoolMetrics(): Promise<SchoolReportMetrics[]> {
  const schools = await prisma.school.findMany({
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
    orderBy: {
      created_at: 'asc',
    },
  });

  const schoolIds = schools.map((school) => school.id);

  const [usersBySchool, paymentsBySchool] = await Promise.all([
    prisma.user.groupBy({
      by: ['school_id', 'role'],
      where: {
        school_id: { in: schoolIds },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.payment.groupBy({
      by: ['school_id'],
      where: {
        school_id: { in: schoolIds },
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return schools.map((school) => {
    const users = usersBySchool.filter((group) => group.school_id === school.id);
    const payment = paymentsBySchool.find((group) => group.school_id === school.id);

    const totalTeachers = users
      .filter((group) => group.role === 'teacher')
      .reduce((sum, item) => sum + item._count._all, 0);

    const totalParents = users
      .filter((group) => group.role === 'parent')
      .reduce((sum, item) => sum + item._count._all, 0);

    return {
      schoolName: school.school_name,
      totalStudents: school._count.students,
      totalTeachers,
      totalClasses: school._count.classes,
      totalParents,
      paymentsCount: payment?._count._all || 0,
      totalRevenue: payment?._sum.amount || 0,
    };
  });
}

export async function generateGlobalAiReport() {
  const metrics = await getGlobalSchoolMetrics();

  const aiResult = await generateAiCompletion({
    systemPrompt: 'You are a precise school operations AI assistant.',
    userPrompt: buildPriorityPrompt(metrics),
    temperature: 0.2,
    maxTokens: 750,
  });

  return {
    metrics,
    aiResult,
  };
}
