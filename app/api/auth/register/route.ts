import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendRegistrationLeadNotifications } from '@/lib/lead-notification-service';
import { check, getClientIp, REGISTER_LIMITER } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120, 'Name is too long'),
  school: z.string().trim().min(2, 'School is required').max(160, 'School name is too long'),
  email: z.string().trim().email('Please enter a valid email').max(160, 'Email is too long'),
  number: z.string().trim().min(7, 'Phone number is too short').max(30, 'Phone number is too long'),
  totalStudents: z.coerce
    .number({ message: 'Total number of students is required' })
    .int('Total number of students must be a whole number')
    .positive('Total number of students must be greater than 0')
    .max(200000, 'Total number of students is too large'),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = check(`register:${ip}`, REGISTER_LIMITER.limit, REGISTER_LIMITER.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many registration requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid registration details.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const sendResult = await sendRegistrationLeadNotifications(validation.data);

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error:
            sendResult.error ||
            'Unable to send registration notification right now. Please try again shortly.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: 'Registration received. Your details have been sent to our team by SMS for follow-up.',
    });
  } catch (error) {
    logger.error('[Register API Error]', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
