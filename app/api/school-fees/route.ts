import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAuth, validateSchool, authorize } from '@/lib/api-auth';

const schoolFeeSchema = z.object({
  class_id: z.string().uuid().optional().or(z.literal('')),
  fee_type: z.enum(['TUITION', 'LUNCH', 'TRANSPORT', 'CLASS', 'OTHER']),
  amount: z.number().min(0),
  academic_year: z.string(),
  term: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

// GET: Fetch school fees
export const GET = withAuth(async ({ req, session }) => {
  try {
    const user = session.user;
    const { searchParams } = new URL(req.url);
    const academic_year = searchParams.get('academic_year');

    const where: any = { school_id: user.school_id! };
    if (academic_year) {
      where.academic_year = academic_year;
    }

    const fees = await prisma.schoolFee.findMany({
      where,
      orderBy: [{ fee_type: 'asc' }, { term: 'asc' }]
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Error fetching school fees:', error);
    return NextResponse.json({ error: 'Failed to fetch school fees' }, { status: 500 });
  }
}, { roles: ['school_admin', 'finance_admin', 'super_admin', 'parent'] });

// POST: Create school fee
export const POST = withAuth(async ({ req, session }) => {
  try {
    const user = session.user;
    const body = await req.json();
    const validation = schoolFeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { class_id, fee_type, amount, academic_year, term, description, due_date } = validation.data;

    const fee = await prisma.schoolFee.create({
      data: {
        school_id: user.school_id!,
        class_id: class_id ? class_id : null,
        fee_type,
        amount,
        academic_year,
        term,
        description,
        due_date: due_date ? new Date(due_date) : null
      }
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Error creating school fee:', error);
    return NextResponse.json({ error: 'Failed to create school fee' }, { status: 500 });
  }
}, { roles: ['school_admin'] });

// PUT: Update school fee
export async function PUT(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin']);
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const body = await req.json();
    const { id, fee_type, amount, academic_year, term, description, due_date, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.schoolFee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    if (!validateSchool(user, existing.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const fee = await prisma.schoolFee.update({
      where: { id },
      data: {
        ...(fee_type && { fee_type }),
        ...(amount !== undefined && { amount }),
        ...(academic_year && { academic_year }),
        ...(term !== undefined && { term }),
        ...(description !== undefined && { description }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(is_active !== undefined && { is_active })
      }
    });

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Error updating school fee:', error);
    return NextResponse.json({ error: 'Failed to update school fee' }, { status: 500 });
  }
}

// DELETE: Remove school fee
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin']);
    if (!('user' in auth)) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.schoolFee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    if (!validateSchool(user, existing.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.schoolFee.delete({ where: { id } });

    return NextResponse.json({ message: 'School fee deleted' });
  } catch (error) {
    console.error('Error deleting school fee:', error);
    return NextResponse.json({ error: 'Failed to delete school fee' }, { status: 500 });
  }
}
