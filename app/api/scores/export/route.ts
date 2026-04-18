import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/scores/export?academic_year=2024-2025&term=Term+1
 * Exports scores for a given term as a CSV file.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'teacher', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { searchParams } = req.nextUrl;
  const academic_year = searchParams.get('academic_year')?.trim();
  const term          = searchParams.get('term')?.trim();

  if (!academic_year || !term) {
    return NextResponse.json(
      { error: 'academic_year and term query parameters are required.' },
      { status: 400 }
    );
  }

  try {
    const scores = await prisma.score.findMany({
      where: {
        academic_year,
        term,
        student: { school_id: user.school_id || undefined, deleted_at: null },
      },
      include: {
        student: {
          select: { name: true, student_number: true, class: { select: { class_name: true } } },
        },
        subject: { select: { subject_name: true } },
      },
      orderBy: [
        { student: { name: 'asc' } },
        { subject: { subject_name: 'asc' } },
      ],
    });

    const rows = scores.map((sc) => ({
      'Student Number': sc.student.student_number ?? '',
      'Student Name':   sc.student.name,
      'Class':          sc.student.class?.class_name ?? '',
      'Subject':        sc.subject.subject_name,
      'Class Score':    sc.classScore ?? '',
      'Exam Score':     sc.examScore  ?? '',
      'Total Score':    sc.totalScore ?? '',
      'Grade':          sc.grade ?? '',
      'Remark':         sc.remark ?? '',
      'Behavior':       sc.behavior ?? '',
      'Term':           sc.term,
      'Academic Year':  sc.academic_year,
    }));

    const ws  = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const safeTerm = term.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    const safeYear = academic_year.replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `scores-${safeYear}-${safeTerm}.csv`;

    return new NextResponse(csv, {
      status:  200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[scores/export]', error);
    return NextResponse.json({ error: 'Failed to export scores' }, { status: 500 });
  }
}
