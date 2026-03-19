import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateOTP, sendOTPSMS } from '@/lib/sms-service';

const requestOTPSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
});

/**
 * POST /api/auth/parent/request-otp
 * 
 * Sends OTP via SMS to parent's phone
 * Only works if:
 * - Phone number exists in system
 * - Account has "parent" role
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = requestOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const { phone } = validation.data;

    // 1. Check if parent exists with this phone
    const user = await prisma.user.findFirst({
      where: {
        phone,
        role: 'parent'
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Phone number not found or not registered as parent' },
        { status: 404 }
      );
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Store OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiresAt
      }
    });

    // 4. Send OTP via SMS
    const smsResult = await sendOTPSMS(phone, otp);

    if (!smsResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // 5. Return success (don't expose OTP in response)
    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        otpSentTo: phone,
        expiresIn: '10 minutes'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error requesting OTP:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
