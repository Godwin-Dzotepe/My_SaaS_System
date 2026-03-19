import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject_name } = body;

    const subject = await prisma.subject.update({
      where: { id },
      data: { subject_name },
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if the subject has any scores
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
