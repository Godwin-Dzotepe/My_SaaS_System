import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import { z } from 'zod';

const schema = z.object({
  school_name: z.string().min(1).optional(),
  address:     z.string().min(1).optional(),
  phone:       z.string().min(7).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  if (!user.school_id) return NextResponse.json({ error: 'No school associated' }, { status: 400 });

  const school = await prisma.school.findUnique({
    where: { id: user.school_id },
    select: { id: true, school_name: true, address: true, phone: true, logo_url: true },
  });
  return NextResponse.json(school);
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req, ['school_admin', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  if (!user.school_id) return NextResponse.json({ error: 'No school associated' }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updated = await prisma.school.update({
    where: { id: user.school_id },
    data: parsed.data,
    select: { id: true, school_name: true, address: true, phone: true, logo_url: true },
  });
  return NextResponse.json(updated);
}
