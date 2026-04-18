import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

// GET /api/attendance/export?class_id=xxx&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const class_id   = searchParams.get('class_id');
    const start_date = searchParams.get('start_date');
    const end_date   = searchParams.get('end_date');

    if (!class_id) {
      return NextResponse.json({ error: 'class_id is required' }, { status: 400 });
    }

    // Verify class belongs to school
    const cls = await prisma.class.findFirst({
      where: { id: class_id, school_id: user.school_id ?? undefined },
      select: { id: true, class_name: true },
    });
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const dateFilter: Record<string, Date> = {};
    if (start_date) dateFilter.gte = new Date(start_date);
    if (end_date)   dateFilter.lte = new Date(end_date + 'T23:59:59');

    // Fetch all students in the class
    const students = await prisma.student.findMany({
      where: { class_id, deleted_at: null },
      select: { id: true, name: true, student_number: true },
      orderBy: { name: 'asc' },
    });

    // Fetch attendance for those students
    const attendance = await prisma.attendance.findMany({
      where: {
        class_id,
        student_id: { in: students.map(s => s.id) },
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: { student_id: true, status: true, date: true },
    });

    // Count per student
    const countByStudent = new Map<string, { present: number; absent: number }>();
    for (const record of attendance) {
      const entry = countByStudent.get(record.student_id) ?? { present: 0, absent: 0 };
      if (record.status === 'present') entry.present++;
      else entry.absent++;
      countByStudent.set(record.student_id, entry);
    }

    // Build CSV
    const rows: string[] = [
      'Student Number,Student Name,Class,Days Present,Days Absent,Total Days,Attendance %',
    ];

    for (const student of students) {
      const counts = countByStudent.get(student.id) ?? { present: 0, absent: 0 };
      const total = counts.present + counts.absent;
      const pct = total > 0 ? ((counts.present / total) * 100).toFixed(1) : '0.0';
      const num = student.student_number ?? '';
      rows.push(`"${num}","${student.name}","${cls.class_name}",${counts.present},${counts.absent},${total},${pct}%`);
    }

    const csv = rows.join('\n');
    const filename = `attendance-${cls.class_name.replace(/\s+/g, '-')}-${start_date ?? 'all'}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/attendance/export:', error);
    return NextResponse.json({ error: 'Failed to export attendance' }, { status: 500 });
  }
}
