import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import { z } from 'zod';

const profileSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'teacher', 'parent', 'secretary', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, image: true, created_at: true },
  });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'teacher', 'parent', 'secretary', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  if (parsed.data.name)  data.name  = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.phone) data.phone = parsed.data.phone;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, phone: true },
  });
  return NextResponse.json(updated);
}
