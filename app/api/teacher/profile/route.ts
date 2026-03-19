import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  // Add other fields as needed
});

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['teacher']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req, ['teacher']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = await req.json();
    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: validation.data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
