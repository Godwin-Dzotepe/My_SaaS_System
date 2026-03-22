import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const DELETE = withAuth(
  async ({ session, params }) => {
    try {
      const periodId = params?.id;

      if (!periodId) {
        return NextResponse.json({ error: 'Academic period ID is required.' }, { status: 400 });
      }

      if (!session.user.school_id) {
        return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
      }

      const existingPeriod = await prisma.academicPeriod.findUnique({
        where: { id: periodId },
      });

      if (!existingPeriod || existingPeriod.school_id !== session.user.school_id) {
        return NextResponse.json({ error: 'Academic period not found.' }, { status: 404 });
      }

      await prisma.academicPeriod.delete({
        where: { id: periodId },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting academic period:', error);
      return NextResponse.json({ error: 'Failed to delete academic period.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin'],
  }
);
