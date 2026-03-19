import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

// GET: Fetch completed students for a school
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id');
    const graduation_year = searchParams.get('graduation_year');

    if (!school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 });
    }

    // Validate school access
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      student: { school_id }
    };
    
    if (graduation_year) {
      where.graduation_year = parseInt(graduation_year);
    }

    const completedStudents = await prisma.completedStudent.findMany({
      where,
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: { graduation_year: 'desc' }
    });

    // Calculate statistics
    const stats = {
      total: completedStudents.length,
      byYear: await Promise.all(
        (await prisma.completedStudent.groupBy({
          by: ['graduation_year'],
          where: { student: { school_id } },
          _count: { id: true }
        })).map(async (item) => ({
          year: item.graduation_year,
          count: item._count.id
        }))
      )
    };

    return NextResponse.json({
      students: completedStudents,
      stats
    });
  } catch (error) {
    console.error('Error fetching completed students:', error);
    return NextResponse.json({ error: 'Failed to fetch completed students' }, { status: 500 });
  }
}

// Note: Deletion is handled through the promote-students API
// Only super_admin can manually remove a student from completed list
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorize(req, ['super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Get the completed student record
    const completed = await prisma.completedStudent.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!completed) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Restore student to active status
    await prisma.$transaction([
      prisma.completedStudent.delete({ where: { id } }),
      prisma.student.update({
        where: { id: completed.student_id },
        data: { status: 'active' }
      })
    ]);

    return NextResponse.json({ message: 'Student restored to active status' });
  } catch (error) {
    console.error('Error restoring completed student:', error);
    return NextResponse.json({ error: 'Failed to restore student' }, { status: 500 });
  }
}
