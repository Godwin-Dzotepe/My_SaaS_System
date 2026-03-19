import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const promotionSchema = z.object({
  school_id: z.string().uuid(),
  // For simplicity, we assume we promote ALL students in a school based on predefined rules.
  // In a real app, you might promote by class or individually.
});

// Mapping of class progressions
// This should ideally be dynamic/configurable per school in the DB, but hardcoded for this demo per requirement.
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
    const validation = promotionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const { school_id } = validation.data;

    // Fetch all active students in this school with their class names
    const students = await prisma.student.findMany({
        where: { 
            school_id, 
            status: 'active' 
        },
        include: {
            class: true
        }
    });

    const updates = [];
    const completions: string[] = [];

    // Pre-fetch class IDs for target classes to avoid N+1 queries
    // Assume class names are unique within a school for simplicity
    const allClasses = await prisma.class.findMany({
        where: { school_id }
    });
    const classMap = new Map(allClasses.map(c => [c.class_name, c.id]));

    for (const student of students) {
        const currentClassName = student.class.class_name;
        
        if (currentClassName === 'JHS 3') {
            // Mark as completed
            completions.push(student.id);
        } else {
            const nextClassName = CLASS_PROGRESSION[currentClassName];
            if (nextClassName) {
                const nextClassId = classMap.get(nextClassName);
                if (nextClassId) {
                    updates.push({
                        id: student.id,
                        class_id: nextClassId
                    });
                } else {
                    console.warn(`Target class ${nextClassName} not found for student ${student.id}`);
                }
            }
        }
    }

    // Perform updates in transaction
    await prisma.$transaction(async (tx) => {
        // 1. Move graduates
        if (completions.length > 0) {
            await tx.student.updateMany({
                where: { id: { in: completions } },
                data: { status: 'completed' }
            });
            
            await tx.completedStudent.createMany({
                data: completions.map(id => ({
                    student_id: id,
                    graduation_year: new Date().getFullYear()
                }))
            });
        }

        // 2. Promote others
        // Prisma updateMany doesn't support different values for different rows easily without raw query
        // For standard ORM, we might loop (slow) or use raw SQL.
        // For scalability, let's use a loop of promises here but be mindful of batch size.
        // Alternatively, filter by current class and update in batches (e.g. update all Class 1 to Class 2 at once).
        
        for (const [current, next] of Object.entries(CLASS_PROGRESSION)) {
            const targetClassId = classMap.get(next);
            // Get source class ID
            const sourceClassId = classMap.get(current);

            if (targetClassId && sourceClassId) {
                await tx.student.updateMany({
                    where: {
                        school_id,
                        class_id: sourceClassId,
                        status: 'active' // Ensure we don't re-promote if run twice
                    },
                    data: {
                        class_id: targetClassId
                    }
                });
            }
        }
    });

    return NextResponse.json({ 
        message: 'Promotion cycle completed',
        graduated: completions.length,
        promoted_batches: Object.keys(CLASS_PROGRESSION).length 
    });

  } catch (error) {
    console.error('Error promoting students:', error);
    return NextResponse.json({ error: 'Promotion failed' }, { status: 500 });
  }
}
