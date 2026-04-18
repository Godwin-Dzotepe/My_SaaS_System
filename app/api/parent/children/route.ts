import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET /api/parent/children - Fetches all children for the authenticated parent
export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.id) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }

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

      const children = await prisma.student.findMany({
        where: {
          OR: parentAccessFilters,
          status: 'active',
          deleted_at: null,
        },
        include: {
          school: {
            select: {
              school_name: true,
            },
          },
          class: {
            select: {
              class_name: true,
            },
          },
        },
        orderBy: {
            name: 'asc'
        }
      });

      if (!children) {
        return NextResponse.json([]);
      }

      return NextResponse.json(children);
    } catch (error) {
      console.error('Error fetching parent children:', error);
      return NextResponse.json(
        { error: 'Failed to fetch children.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['parent'],
  }
);
