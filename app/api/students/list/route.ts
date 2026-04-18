import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin', 'teacher', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const { searchParams } = req.nextUrl;
    const search   = searchParams.get('search')?.trim() || undefined;
    const classId  = searchParams.get('class_id') || undefined;
    const status   = searchParams.get('status') || undefined;
    const pageStr  = searchParams.get('page');
    const sizeStr  = searchParams.get('pageSize');

    const paginated = !!pageStr;
    const page     = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(sizeStr ?? '50', 10) || 50));

    const where: Record<string, unknown> = {
      school_id:  user.school_id || undefined,
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { name:           { contains: search } },
        { student_number: { contains: search } },
      ];
    }
    if (classId)  where.class_id = classId;
    if (status && (status === 'active' || status === 'completed')) {
      where.status = status;
    }

    if (paginated) {
      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          include: { class: { select: { id: true, class_name: true } } },
          orderBy: { created_at: 'desc' },
          skip:    (page - 1) * pageSize,
          take:    pageSize,
        }),
        prisma.student.count({ where }),
      ]);

      return NextResponse.json({ students, total, page, pageSize });
    }

    // Non-paginated path (backward-compatible plain array)
    const students = await prisma.student.findMany({
      where,
      include: { class: { select: { id: true, class_name: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
