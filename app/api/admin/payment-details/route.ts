import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// GET: Fetch payment details
export const GET = withAuth(async ({ req, session }) => {
  try {
    const details = await prisma.schoolPaymentDetail.findUnique({
      where: { school_id: session.user.school_id! }
    });
    return NextResponse.json(details || {});
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, { roles: ['school_admin', 'parent'] });

// POST: Upsert payment details
export const POST = withAuth(async ({ req, session }) => {
  try {
    const body = await req.json();
    const { momoNumber, bankAccountNumber, bankName, paymentInstructions } = body;
    const details = await prisma.schoolPaymentDetail.upsert({
      where: { school_id: session.user.school_id! },
      create: {
        school_id: session.user.school_id!,
        momoNumber, bankAccountNumber, bankName, paymentInstructions
      },
      update: {
        momoNumber, bankAccountNumber, bankName, paymentInstructions
      }
    });
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error saving payment details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, { roles: ['school_admin'] });
