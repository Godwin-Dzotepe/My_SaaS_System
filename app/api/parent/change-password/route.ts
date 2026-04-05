import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, 'Old password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm password is required.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password must match.',
    path: ['confirmPassword'],
  });

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      const body = await req.json();
      const parsed = changePasswordSchema.safeParse(body);

      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid input.';
        return NextResponse.json({ error: firstError }, { status: 400 });
      }

      const { oldPassword, newPassword } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          password: true,
        },
      });

      if (!user || user.role !== 'parent') {
        return NextResponse.json({ error: 'Parent account not found.' }, { status: 404 });
      }

      const oldMatches = await bcrypt.compare(oldPassword, user.password);
      if (!oldMatches) {
        return NextResponse.json({ error: 'Old password is incorrect.' }, { status: 401 });
      }

      const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (sameAsCurrent) {
        return NextResponse.json({ error: 'New password must be different from old password.' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          temporary_password: null,
          password_generated_at: null,
        },
      });

      return NextResponse.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Error changing parent password:', error);
      return NextResponse.json({ error: 'Failed to change password.' }, { status: 500 });
    }
  },
  {
    roles: ['parent'],
  }
);

