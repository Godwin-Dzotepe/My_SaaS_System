'use server';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async ({ session, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');

    if (!session.user.school_id) {
      return NextResponse.json({ error: 'User not associated with a school.' }, { status: 400 });
    }
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 });
    }

    const teacherClass = await prisma.class.findFirst({
      where: {
        id: classId,
        school_id: session.user.school_id,
        teacher_id: session.user.role === 'teacher' ? session.user.id : undefined,
      },
      include: {
        students: { select: { id: true, name: true, student_number: true } }
      }
    });

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found or not authorized.' }, { status: 404 });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { class_id: classId },
    });

    const historyMap = new Map();
    
    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!historyMap.has(dateStr)) {
        historyMap.set(dateStr, { date: dateStr, present: 0, absent: 0, records: [] });
      }
      
      const dayData = historyMap.get(dateStr);
      const student = teacherClass.students.find(s => s.id === record.student_id);
      
      if (student) {
        dayData.records.push({ 
          student_id: record.student_id, 
          student_name: student.name,
          student_number: student.student_number || '',
          status: record.status 
        });
        
        if (record.status === 'present') dayData.present++;
        else dayData.absent++;
      }
    }

    const history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(history);

  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});