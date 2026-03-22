import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;
    const body = await request.json();
    const { subject_name } = body;

    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    if (!validateSchool(user, existingSubject.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        subject_name: typeof subject_name === 'string' ? subject_name.trim() : subject_name,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Failed to update subject.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;

    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    if (!validateSchool(user, existingSubject.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const scoresCount = await prisma.score.count({
      where: { subject_id: id }
    });

    if (scoresCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject because it has associated scores.' },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Subject deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete subject.' },
      { status: 500 }
    );
  }
}
