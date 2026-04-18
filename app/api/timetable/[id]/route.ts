import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;
    const entry = await prisma.timetableEntry.findFirst({
      where: { id, school_id: user.school_id ?? undefined },
    });

    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    await prisma.timetableEntry.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE /api/timetable/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
