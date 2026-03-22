import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || user.school_id;

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 });
    }

    if (!validateSchool(user, schoolId)) {
      return NextResponse.json({ error: 'Unauthorized for this school' }, { status: 403 });
    }

    // Get all students with their parent information
    const students = await prisma.student.findMany({
      where: { school_id: schoolId },
      select: {
        id: true,
        name: true,
        parent_name: true,
        parent_phone: true,
        parent_relation: true,
        class: { select: { class_name: true } }
      }
    });

    // Group students by parent phone to aggregate parents with multiple children
    const parentMap = new Map();
    
    students.forEach(student => {
      const p = student.parent_phone;
      if (!p) return;
      
      if (!parentMap.has(p)) {
        parentMap.set(p, {
          parent_name: student.parent_name || 'Unknown',
          parent_phone: p,
          parent_relation: student.parent_relation || 'Parent/Guardian',
          children: []
        });
      }
      
      parentMap.get(p).children.push({
        id: student.id,
        name: student.name,
        class_name: student.class?.class_name || 'Unassigned'
      });
    });

    const parents = Array.from(parentMap.values());

    return NextResponse.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}
