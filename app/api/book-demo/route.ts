import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendBookDemoLeadNotifications } from '@/lib/lead-notification-service';
import { check, getClientIp, BOOK_DEMO_LIMITER } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const bookDemoSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name is required').max(120, 'Full Name is too long'),
  email: z.string().trim().email('Please enter a valid e-mail').max(160, 'E-mail is too long'),
  phoneNumber: z.string().trim().min(7, 'Phone Number is too short').max(30, 'Phone Number is too long'),
  schoolName: z.string().trim().min(2, 'School Name is required').max(180, 'School Name is too long'),
  schoolLocation: z.string().trim().min(2, 'School location is required').max(180, 'School location is too long'),
  averageEnrollment: z
    .string()
    .trim()
    .min(1, 'Please select the average enrollment range for your school')
    .max(40, 'Average enrollment value is too long'),
  currentSystem: z.string().trim().max(1000, 'Current system response is too long').optional().default(''),
  currentSystemGaps: z.string().trim().max(2000, 'Current system gaps response is too long').optional().default(''),
  mainChallenges: z.string().trim().max(2000, 'Main challenges response is too long').optional().default(''),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = check(`book_demo:${ip}`, BOOK_DEMO_LIMITER.limit, BOOK_DEMO_LIMITER.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const validation = bookDemoSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid demo request details.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const sendResult = await sendBookDemoLeadNotifications(validation.data);

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error:
            sendResult.error ||
            'Unable to send demo request notification right now. Please try again shortly.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: 'Thank you. Your demo request has been received. Our team will contact you shortly.',
    });
  } catch (error) {
    logger.error('[Book Demo API Error]', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
