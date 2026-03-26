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

    const [students, parentUsers] = await Promise.all([
      prisma.student.findMany({
        where: { school_id: schoolId },
        select: {
          id: true,
          name: true,
          parent_name: true,
          parent_phone: true,
          parent_relation: true,
          father_name: true,
          father_phone: true,
          mother_name: true,
          mother_phone: true,
          guardian_name: true,
          guardian_phone: true,
          class: { select: { class_name: true } }
        }
      }),
      prisma.user.findMany({
        where: {
          role: 'parent',
          school_id: schoolId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          temporary_password: true,
          password_generated_at: true,
          created_at: true,
        }
      })
    ]);

    const parentUserMap = new Map(parentUsers.map((parent) => [parent.phone, parent]));
    const parentMap = new Map<string, any>();

    const attachParent = (phone: string | null, name: string | null, relation: string | null, student: any) => {
      if (!phone) return;

      if (!parentMap.has(phone)) {
        const account = parentUserMap.get(phone);
        parentMap.set(phone, {
          parent_id: account?.id || null,
          parent_name: name || account?.name || 'Unknown',
          parent_phone: phone,
          parent_relation: relation || 'Parent/Guardian',
          temporary_password: null,
          password_generated_at: account?.password_generated_at || null,
          created_at: account?.created_at || null,
          children: []
        });
      }

      const parentEntry = parentMap.get(phone);
      const alreadyAttached = parentEntry.children.some((child: { id: string }) => child.id === student.id);
      if (alreadyAttached) {
        return;
      }

      parentEntry.children.push({
        id: student.id,
        name: student.name,
        class_name: student.class?.class_name || 'Unassigned'
      });
    };

    students.forEach((student) => {
      attachParent(student.parent_phone, student.parent_name, student.parent_relation, student);
      attachParent(student.father_phone, student.father_name, 'Father', student);
      attachParent(student.mother_phone, student.mother_name, 'Mother', student);
      attachParent(student.guardian_phone, student.guardian_name, 'Guardian', student);
    });

    return NextResponse.json(Array.from(parentMap.values()));
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}
