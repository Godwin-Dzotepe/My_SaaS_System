import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { generateRandomPassword } from '@/lib/password-utils';
import { sendPasswordSMS } from '@/lib/sms-service';

interface EnsureParentAccountParams {
  name?: string;
  phone?: string;
  schoolId: string;
  schoolName: string;
}

export interface ParentAccountResult {
  user: {
    id: string;
    name: string;
    phone: string;
    school_id: string | null;
    temporary_password: string | null;
  };
  temporaryPassword: string | null;
  wasCreated: boolean;
}

export async function ensureParentAccount({
  name,
  phone,
  schoolId,
  schoolName,
}: EnsureParentAccountParams): Promise<ParentAccountResult | null> {
  if (!name || !phone) return null;

  let parentUser = await prisma.user.findFirst({
    where: { phone },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      school_id: true,
      temporary_password: true,
    },
  });

  if (!parentUser) {
    const generatedPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    parentUser = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        temporary_password: generatedPassword,
        password_generated_at: new Date(),
        role: 'parent',
        school_id: schoolId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        school_id: true,
        temporary_password: true,
      },
    });

    try {
      await sendPasswordSMS(phone, generatedPassword, schoolName);
    } catch (smsError) {
      console.warn('[ParentAccount] Password SMS failed:', smsError);
    }

    return {
      user: parentUser,
      temporaryPassword: generatedPassword,
      wasCreated: true,
    };
  }

  if (parentUser.role !== 'parent') {
    throw new Error(`The phone number ${phone} is already used by a different user role`);
  }

  if (parentUser.school_id && parentUser.school_id !== schoolId) {
    throw new Error(`The phone number ${phone} is already linked to a parent account in another school`);
  }

  if (!parentUser.school_id) {
    parentUser = await prisma.user.update({
      where: { id: parentUser.id },
      data: { school_id: schoolId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        school_id: true,
        temporary_password: true,
      },
    });
  }

  return {
    user: parentUser,
    temporaryPassword: parentUser.temporary_password || null,
    wasCreated: false,
  };
}

export async function resetParentTemporaryPassword(parentId: string, schoolName: string) {
  const parent = await prisma.user.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      phone: true,
      role: true,
      school_id: true,
    },
  });

  if (!parent || parent.role !== 'parent') {
    throw new Error('Parent account not found');
  }

  const generatedPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const updatedParent = await prisma.user.update({
    where: { id: parent.id },
    data: {
      password: hashedPassword,
      temporary_password: generatedPassword,
      password_generated_at: new Date(),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      school_id: true,
      temporary_password: true,
    },
  });

  try {
    await sendPasswordSMS(updatedParent.phone, generatedPassword, schoolName);
  } catch (smsError) {
    console.warn('[ParentAccount] Reset password SMS failed:', smsError);
  }

  return {
    parent: updatedParent,
    temporaryPassword: generatedPassword,
  };
}
