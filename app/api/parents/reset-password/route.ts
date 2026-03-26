import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { resetParentTemporaryPassword } from '@/lib/parent-account';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { parentId } = await req.json();
    if (!parentId) {
      return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
    }

    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        role: true,
        school_id: true,
        school: { select: { school_name: true, sms_username: true } },
      },
    });

    if (!parent || parent.role !== 'parent') {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (!validateSchool(user, parent.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await resetParentTemporaryPassword(
      parent.id,
      parent.school?.school_name || 'School',
      parent.school?.sms_username || null
    );

    return NextResponse.json({
      message: 'Parent password reset successfully',
      parent: result.parent,
    });
  } catch (error) {
    console.error('Error resetting parent password:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to reset parent password' }, { status: 500 });
  }
}
