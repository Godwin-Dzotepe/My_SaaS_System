import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateOTP, hashOTP, sendOTPSMS } from '@/lib/sms-service';
import { check, getClientIp, OTP_REQUEST_LIMITER } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

/**
 * Rate limiting configuration
 * Prevents OTP abuse by limiting requests per phone number
 */
const OTP_COOLDOWN_SECONDS = 60; // 60 seconds between OTP requests
const OTP_EXPIRY_MINUTES = 10;

/**
 * Input validation schema for OTP request
 */
const requestOTPSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  schoolId: z.string().optional(), // Optional school ID for multi-tenant lookup
});

export async function POST(req: NextRequest) {
  // IP-level rate limit on top of existing DB-level cooldown
  const ip = getClientIp(req);
  const rl = check(`otp_request:${ip}`, OTP_REQUEST_LIMITER.limit, OTP_REQUEST_LIMITER.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const validation = requestOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const { phone, schoolId } = validation.data;

    // 1. Fix TypeScript issues with strongly typed Prisma Where Input
    const userWhere: any = {
      phone,
      role: 'parent',
    };

    if (schoolId) {
      userWhere.school_id = schoolId;
    }

    // 2. Ensure Prisma queries use correct field names
    const user = await prisma.user.findFirst({
      where: userWhere,
      select: {
        id: true,
        school_id: true,
        lastOtpSentAt: true,
        otpExpiresAt: true,
        school: {
          select: {
            isActive: true,
            deactivationMessage: true
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Phone number not found or not registered as parent' },
        { status: 404 }
      );
    }

    if (user.school && user.school.isActive === false) {
      const msg = user.school.deactivationMessage || "This school's account has been deactivated.";
      return NextResponse.json(
        { error: `SCHOOL_DEACTIVATED: ${msg}` },
        { status: 403 }
      );
    }

    const now = new Date();
    const lastOtpSentAt = user.lastOtpSentAt;

    // 4. Enforce cooldown and allow resend.
    // We only check against the lastOtpSentAt and the Cooldown Seconds.
    if (lastOtpSentAt) {
      const timeSinceLastOTP = (now.getTime() - lastOtpSentAt.getTime()) / 1000;

      if (timeSinceLastOTP < OTP_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(OTP_COOLDOWN_SECONDS - timeSinceLastOTP);
        return NextResponse.json(
          {
            error: 'Please wait before requesting another OTP',
            retryAfter: remainingSeconds
          },
          { status: 429 }
        );
      }
    }

    // Notice we've completely removed the check for \otpExpiresAt > now\ which prevented
    // resending an OTP if the previous one was still technically valid/active.

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    
    // 5. Clean up redundant Date conversion (using now.getTime() directly instead of new Date(new Date()))
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashedOTP,
        otpExpiresAt,
        lastOtpSentAt: now,
        otpAttempts: 0,
      },
    });

    const smsResult = await sendOTPSMS(phone, otp);

    // 3. Prevent runtime crashes by ensuring safe handling of external API responses (smsResult?.success)
    if (!smsResult?.success) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otpExpiresAt: null,
        },
      });

      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        otpSentTo: maskPhoneNumber(phone),
        expiresIn: `${OTP_EXPIRY_MINUTES} minutes`
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error('[OTP Request Error]', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Failed to process request. Please try again later.' },
      { status: 500 }
    );
  }
}

function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}
