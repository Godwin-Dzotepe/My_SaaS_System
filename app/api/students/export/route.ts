import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/students/export?format=csv
 * Exports all active students for the school as a CSV file.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  if (!user.school_id && user.role !== 'super_admin') {
    return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
  }

  try {
    const students = await prisma.student.findMany({
      where:   { school_id: user.school_id || undefined, deleted_at: null },
      include: { class: { select: { class_name: true } } },
      orderBy: { name: 'asc' },
    });

    const rows = students.map((s) => ({
      'Student Number': s.student_number ?? '',
      'Name':           s.name,
      'Class':          s.class?.class_name ?? '',
      'Gender':         s.gender ?? '',
      'Date of Birth':  s.date_of_birth ? s.date_of_birth.toISOString().split('T')[0] : '',
      'Parent Name':    s.parent_name ?? '',
      'Parent Phone':   s.parent_phone ?? '',
      'Father Name':    s.father_name ?? '',
      'Father Phone':   s.father_phone ?? '',
      'Mother Name':    s.mother_name ?? '',
      'Mother Phone':   s.mother_phone ?? '',
      'Status':         s.status,
      'Admission Date': s.admission_date ? s.admission_date.toISOString().split('T')[0] : '',
    }));

    const ws  = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const today    = new Date().toISOString().split('T')[0];
    const filename = `students-${user.school_id ?? 'export'}-${today}.csv`;

    return new NextResponse(csv, {
      status:  200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[students/export]', error);
    return NextResponse.json({ error: 'Failed to export students' }, { status: 500 });
  }
}
