import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['teacher']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id) {
        return NextResponse.json({ error: 'School ID missing from token' }, { status: 400 });
    }

    const teacherClass = await prisma.class.findFirst({
      where: {
        teacher_id: user.id,
        school_id: user.school_id
      },
      include: {
        students: {
          where: { status: 'active' },
        }
      }
    });

    if (!teacherClass) {
        return NextResponse.json({
            error: 'No class assigned',
            className: 'None',
            stats: { students: 0, presentToday: 0, assignmentsDue: 0 },
            recentStudents: []
        });
    }

    const studentCount = teacherClass.students.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceToday = await prisma.attendance.count({
      where: {
        student: { class_id: teacherClass.id },
        date: { gte: today },
        status: 'present'
      }
    });

    const assignmentsDue = await prisma.homework.count({
      where: {
        class_id: teacherClass.id,
        due_date: { gte: new Date() }
      }
    });

    return NextResponse.json({
      className: teacherClass.class_name,
      stats: {
        students: studentCount,
        presentToday: attendanceToday,
        assignmentsDue: assignmentsDue
      },
      recentStudents: teacherClass.students.slice(0, 5)
    });

  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
