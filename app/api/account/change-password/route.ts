import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'teacher', 'parent', 'secretary', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
  if (!dbUser?.password) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const match = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
  if (!match) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  return NextResponse.json({ success: true });
}
