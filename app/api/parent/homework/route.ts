import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET /api/parent/homework — homework for all the parent's children's classes
export const GET = withAuth(
  async ({ session }) => {
    try {
      const parentAccessFilters = [
        { parent_id: session.user.id },
        ...(session.user.phone
          ? [
              { father_phone: session.user.phone },
              { mother_phone: session.user.phone },
              { guardian_phone: session.user.phone },
              { parent_phone: session.user.phone },
            ]
          : []),
      ];

      // Get active children
      const children = await prisma.student.findMany({
        where: { OR: parentAccessFilters, status: 'active', deleted_at: null },
        select: { id: true, name: true, class_id: true, class: { select: { class_name: true } } },
      });

      if (children.length === 0) return NextResponse.json([]);

      const classIds = [...new Set(children.map(c => c.class_id))];

      const homework = await prisma.homework.findMany({
        where: { class_id: { in: classIds } },
        include: {
          class:   { select: { id: true, class_name: true } },
          teacher: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      // Attach which children are in each class
      const childrenByClass = new Map<string, typeof children>();
      for (const child of children) {
        const arr = childrenByClass.get(child.class_id) ?? [];
        arr.push(child);
        childrenByClass.set(child.class_id, arr);
      }

      const result = homework.map(hw => ({
        ...hw,
        children_in_class: childrenByClass.get(hw.class_id) ?? [],
      }));

      return NextResponse.json(result);
    } catch (error) {
      console.error('GET /api/parent/homework:', error);
      return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
    }
  },
  { roles: ['parent'] }
);
