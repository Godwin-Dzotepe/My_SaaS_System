import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAuth, validateSchool, authorize } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limiter';

const FEE_TYPE_LABEL_PREFIX = '[fee_type:';

function parseLegacyFeeType(description: string | null) {
  if (!description?.startsWith(FEE_TYPE_LABEL_PREFIX)) return null;

  const closingBracketIndex = description.indexOf(']');
  if (closingBracketIndex < 0) return null;

  const customType = description.slice(FEE_TYPE_LABEL_PREFIX.length, closingBracketIndex).trim();
  if (!customType) return null;

  const cleanedDescription = description.slice(closingBracketIndex + 1).trim();
  return {
    fee_type: customType,
    description: cleanedDescription || null,
  };
}

async function migrateLegacyFeeTypesForSchool(schoolId: string) {
  const legacyRows = await prisma.schoolFee.findMany({
    where: {
      school_id: schoolId,
      fee_type: 'OTHER',
      description: {
        startsWith: FEE_TYPE_LABEL_PREFIX,
      },
    },
    select: {
      id: true,
      description: true,
    },
  });

  for (const row of legacyRows) {
    const parsed = parseLegacyFeeType(row.description);
    if (!parsed) continue;

    await prisma.schoolFee.update({
      where: { id: row.id },
      data: {
        fee_type: parsed.fee_type as any,
        description: parsed.description,
      },
    });
  }
}

function decodeFeeTypeForResponse<T extends { fee_type: string; description: string | null }>(fee: T) {
  if (fee.fee_type !== 'OTHER') {
    return fee;
  }

  const parsed = parseLegacyFeeType(fee.description);
  if (!parsed) return fee;

  return {
    ...fee,
    fee_type: parsed.fee_type,
    description: parsed.description,
  };
}

function normalizeFeeTypeForStorage(feeTypeInput: string) {
  return feeTypeInput.replace(/\s+/g, ' ').trim();
}

function normalizeDescriptionForStorage(descriptionInput?: string) {
  const trimmed = (descriptionInput ?? '').trim();
  return trimmed || null;
}

const schoolFeeSchema = z.object({
  class_id: z.string().uuid().optional().or(z.literal('')),
  fee_type: z.string().trim().min(1, 'Fee type is required').max(80, 'Fee type is too long'),
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

    await migrateLegacyFeeTypesForSchool(user.school_id!);

    const fees = await prisma.schoolFee.findMany({
      where,
      orderBy: [{ fee_type: 'asc' }, { term: 'asc' }]
    });

    return NextResponse.json(fees.map((fee) => decodeFeeTypeForResponse(fee)));
  } catch (error) {
    console.error('Error fetching school fees:', error);
    return NextResponse.json({ error: 'Failed to fetch school fees' }, { status: 500 });
  }
}, { roles: ['school_admin', 'finance_admin', 'super_admin', 'parent'] });

// POST: Create school fee
export const POST = withAuth(async ({ req, session }) => {
  try {
    const user = session.user;
    if (!user.school_id) {
      return NextResponse.json({ error: 'Your account is not linked to a school.' }, { status: 400 });
    }

    const body = await req.json();
    const validation = schoolFeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { class_id, fee_type, amount, academic_year, term, description, due_date } = validation.data;
    const normalizedFeeType = normalizeFeeTypeForStorage(fee_type);
    const normalizedDescription = normalizeDescriptionForStorage(description);

    const fee = await prisma.schoolFee.create({
      data: {
        school_id: user.school_id,
        class_id: class_id ? class_id : null,
        // Cast to satisfy stale generated Prisma enum typings while DB stores free-text values.
        fee_type: normalizedFeeType as any,
        amount,
        academic_year,
        term,
        description: normalizedDescription,
        due_date: due_date ? new Date(due_date) : null
      }
    });

    logAudit({
      prismaClient: prisma,
      schoolId:     user.school_id,
      performedBy:  user.id,
      actorRole:    user.role,
      action:       'CREATE',
      entityType:   'SchoolFee',
      entityId:     fee.id,
      changes:      { after: { fee_type: fee.fee_type, amount: fee.amount, academic_year: fee.academic_year, term: fee.term } },
    });

    return NextResponse.json(decodeFeeTypeForResponse(fee), { status: 201 });
  } catch (error) {
    console.error('Error creating school fee:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (
      message.toLowerCase().includes('fee_type') &&
      (
        message.toLowerCase().includes('enum') ||
        message.toLowerCase().includes('data truncated') ||
        message.toLowerCase().includes('invalid input value')
      )
    ) {
      return NextResponse.json(
        { error: 'Database schema is outdated for custom fee types. Run Prisma migration and try again.' },
        { status: 500 }
      );
    }

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
    const normalized =
      typeof fee_type === 'string' && fee_type.trim()
        ? {
            fee_type: normalizeFeeTypeForStorage(fee_type),
            description: normalizeDescriptionForStorage(typeof description === 'string' ? description : undefined),
          }
        : null;

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
        ...(normalized && { fee_type: normalized.fee_type as any }),
        ...(amount !== undefined && { amount }),
        ...(academic_year && { academic_year }),
        ...(term !== undefined && { term }),
        ...(normalized
          ? { description: normalized.description }
          : description !== undefined
            ? { description }
            : {}),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(is_active !== undefined && { is_active })
      }
    });

    return NextResponse.json(decodeFeeTypeForResponse(fee));
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
