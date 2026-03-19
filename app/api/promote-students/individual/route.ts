import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const individualPromotionSchema = z.object({
  student_id: z.string().uuid(),
  target_class_id: z.string().uuid(),
  school_id: z.string().uuid(),
});

// Class progression map
const CLASS_PROGRESSION: Record<string, string> = {
    'Class 1': 'Class 2',
    'Class 2': 'Class 3',
    'Class 3': 'Class 4',
    'Class 4': 'Class 5',
    'Class 5': 'Class 6',
    'Class 6': 'JHS 1',
    'JHS 1': 'JHS 2',
    'JHS 2': 'JHS 3',
    // JHS 3 is final -> Completed
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = individualPromotionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { student_id, target_class_id, school_id } = validation.data;

    // Fetch the student to get their current class
    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { class: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.school_id !== school_id) {
      return NextResponse.json({ error: 'Unauthorized: Student does not belong to this school' }, { status: 403 });
    }

    // Check if student is already in the target class
    if (student.class_id === target_class_id) {
      return NextResponse.json({ error: 'Student is already in this class' }, { status: 400 });
    }

    // Check if target class exists and belongs to the same school
    const targetClass = await prisma.class.findUnique({
      where: { id: target_class_id }
    });

    if (!targetClass || targetClass.school_id !== school_id) {
      return NextResponse.json({ error: 'Invalid target class' }, { status: 400 });
    }

    // Check if this is a graduation (JHS 3 -> Completed)
    if (student.class.class_name === 'JHS 3') {
      // Mark as completed
      await prisma.student.update({
        where: { id: student_id },
        data: { status: 'completed' }
      });

      // Add to completed students
      await prisma.completedStudent.create({
        data: {
          student_id: student_id,
          graduation_year: new Date().getFullYear()
        }
      });

      return NextResponse.json({ 
        message: 'Student has been marked as completed/graduated',
        status: 'graduated'
      });
    }

    // Otherwise, just update the class
    const updatedStudent = await prisma.student.update({
      where: { id: student_id },
      data: { class_id: target_class_id },
      include: { class: true }
    });

    return NextResponse.json({ 
      message: 'Student promoted successfully',
      student: updatedStudent,
      status: 'promoted'
    });

  } catch (error) {
    console.error('Error promoting individual student:', error);
    return NextResponse.json({ error: 'Promotion failed' }, { status: 500 });
  }
}

// GET: Fetch students eligible for individual promotion
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id');
    const class_id = searchParams.get('class_id');

    if (!school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 });
    }

    // Fetch students for the specified class
    const students = await prisma.student.findMany({
      where: {
        school_id,
        status: 'active',
        ...(class_id ? { class_id } : {})
      },
      include: {
        class: true
      },
      orderBy: { name: 'asc' }
    });

    // Get all classes for this school to build promotion options
    const classes = await prisma.class.findMany({
      where: { school_id },
      orderBy: { class_name: 'asc' }
    });

    // Build promotion options for each student
    const studentsWithOptions = students.map(student => {
      const currentClassName = student.class.class_name;
      const nextClassName = CLASS_PROGRESSION[currentClassName];
      
      // Find the target class
      const targetClass = classes.find(c => c.class_name === nextClassName);
      
      return {
        ...student,
        canPromote: !!nextClassName || currentClassName === 'JHS 3',
        isGraduating: currentClassName === 'JHS 3',
        nextClassName: nextClassName || 'Completed',
        targetClassId: targetClass?.id
      };
    });

    return NextResponse.json(studentsWithOptions);

  } catch (error) {
    console.error('Error fetching students for promotion:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
