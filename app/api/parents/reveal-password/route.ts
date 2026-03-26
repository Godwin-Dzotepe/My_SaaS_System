import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { parentId, adminPassword } = await req.json();
    if (!parentId || !adminPassword) {
      return NextResponse.json({ error: 'parentId and adminPassword are required' }, { status: 400 });
    }

    const [admin, parent] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          password: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          role: true,
          school_id: true,
          temporary_password: true,
        },
      }),
    ]);

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Admin password is incorrect' }, { status: 401 });
    }

    if (!parent || parent.role !== 'parent') {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (!validateSchool(user, parent.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      temporary_password: parent.temporary_password,
    });
  } catch (error) {
    console.error('Error revealing parent password:', error);
    return NextResponse.json({ error: 'Failed to reveal parent password' }, { status: 500 });
  }
}
