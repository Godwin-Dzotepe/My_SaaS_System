import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

/**
 * DELETE /api/students/[id]/hard
 * Permanently deletes a single student. SUPER ADMIN ONLY.
 */
export const DELETE = withAuth(
  async ({ params }) => {
    const studentId = params?.id as string;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.student.delete({ where: { id: studentId } });

    return NextResponse.json({ message: 'Student permanently deleted' });
  },
  { roles: ['super_admin'] }
);
