import { prisma } from '@/lib/prisma';

type LoginUserShape = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  password: string;
  role: string;
  school_id: string | null;
  temporary_password?: string | null;
  password_generated_at?: Date | null;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  otpAttempts?: number;
  lastOtpSentAt?: Date | null;
  created_at?: Date;
  school: {
    id?: string;
    school_name: string;
    logo_url?: string | null;
    sms_username?: string | null;
    isActive: boolean;
    deactivationMessage: string | null;
  } | null;
};

function isMissingBrandingColumnError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('logo_url') ||
    message.includes('sms_username') ||
    message.includes('column') ||
    message.includes('does not exist')
  );
}

export async function findUserWithSchoolBranding(where: Record<string, unknown>): Promise<LoginUserShape | null> {
  try {
    return await prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
            logo_url: true,
            sms_username: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    }) as LoginUserShape | null;
  } catch (error) {
    if (!isMissingBrandingColumnError(error)) {
      throw error;
    }

    const fallbackUser = await prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });

    if (!fallbackUser) return null;

    return {
      ...(fallbackUser as any),
      school: fallbackUser.school
        ? {
            ...fallbackUser.school,
            logo_url: null,
            sms_username: null,
          }
        : null,
    } as LoginUserShape;
  }
}

export async function findSessionUserWithSchoolBranding(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        school_id: true,
        school: {
          select: {
            school_name: true,
            logo_url: true,
            sms_username: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isMissingBrandingColumnError(error)) {
      throw error;
    }

    const fallbackUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        school_id: true,
        school: {
          select: {
            school_name: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });

    if (!fallbackUser) return null;

    return {
      ...fallbackUser,
      school: fallbackUser.school
        ? {
            ...fallbackUser.school,
            logo_url: null,
            sms_username: null,
          }
        : null,
    };
  }
}
