import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendPasswordSMS } from '@/lib/sms-service';
import { generateRandomPassword } from '@/lib/password-utils';
import { findStudentsForParentFirstLogin } from '@/lib/student-parent-login';

const schema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  schoolId: z.string().optional(),
});

function normalizePhoneForMatch(phone: string) {
  return phone.replace(/\D/g, '');
}

function buildPhoneVariants(phone: string) {
  const raw = phone.trim();
  const digitsOnly = normalizePhoneForMatch(phone);
  const variants = new Set<string>([raw, digitsOnly]);

  if (raw.startsWith('+')) {
    variants.add(raw.slice(1));
  }

  if (digitsOnly.startsWith('233') && digitsOnly.length >= 12) {
    variants.add(`0${digitsOnly.slice(3)}`);
    variants.add(`+${digitsOnly}`);
  }

  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    variants.add(`233${digitsOnly.slice(1)}`);
    variants.add(`+233${digitsOnly.slice(1)}`);
  }

  return Array.from(variants);
}

function resolveParentContext(
  student: {
    name: string;
    parent_name: string | null;
    parent_phone: string | null;
    father_name: string | null;
    father_phone: string | null;
    mother_name: string | null;
    mother_phone: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
  },
  phone: string
) {
  const incomingPhone = normalizePhoneForMatch(phone);
  const matches = (value?: string | null) => value ? normalizePhoneForMatch(value) === incomingPhone : false;

  if (matches(student.parent_phone)) {
    return {
      parentName: student.parent_name || 'Parent',
      childName: student.name,
    };
  }

  if (matches(student.father_phone)) {
    return {
      parentName: student.father_name || student.parent_name || 'Parent',
      childName: student.name,
    };
  }

  if (matches(student.mother_phone)) {
    return {
      parentName: student.mother_name || student.parent_name || 'Parent',
      childName: student.name,
    };
  }

  if (matches(student.guardian_phone)) {
    return {
      parentName: student.guardian_name || student.parent_name || 'Parent',
      childName: student.name,
    };
  }

  return {
    parentName: student.parent_name || student.father_name || student.mother_name || student.guardian_name || 'Parent',
    childName: student.name,
  };
}

function resolveMatchedPhone(
  student: {
    parent_phone: string | null;
    father_phone: string | null;
    mother_phone: string | null;
    guardian_phone: string | null;
  },
  phoneVariants: string[]
) {
  const normalizedVariants = new Set(phoneVariants.map(normalizePhoneForMatch));
  const phoneCandidates = [
    student.parent_phone,
    student.father_phone,
    student.mother_phone,
    student.guardian_phone,
  ];

  for (const candidate of phoneCandidates) {
    if (!candidate) continue;
    if (normalizedVariants.has(normalizePhoneForMatch(candidate))) {
      return candidate;
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const { phone, schoolId } = validation.data;
    const phoneVariants = buildPhoneVariants(phone);

    const studentWhere: Record<string, unknown> = {
      OR: [
        { parent_phone: { in: phoneVariants } },
        { father_phone: { in: phoneVariants } },
        { mother_phone: { in: phoneVariants } },
        { guardian_phone: { in: phoneVariants } },
      ],
      ...(schoolId ? { school_id: schoolId } : {}),
    };

    const students = await findStudentsForParentFirstLogin(studentWhere);

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found linked to this phone number. Please contact the school.' },
        { status: 404 }
      );
    }

    const school = students[0].school;
    const studentSchoolId = students[0].school_id;
    const parentContext = resolveParentContext(students[0], phone);
    const matchedPhone = resolveMatchedPhone(students[0], phoneVariants) || phone.trim();

    if (!school) {
      return NextResponse.json(
        { error: 'School configuration is missing for this student.' },
        { status: 500 }
      );
    }

    let user = await prisma.user.findFirst({
      where: { phone: { in: phoneVariants } },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        school_id: true,
        temporary_password: true,
      },
    });

    let rawPassword = user?.temporary_password || '';

    if (user) {
      if (!rawPassword) {
        rawPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: user.name || parentContext.parentName,
            phone: matchedPhone,
            password: hashedPassword,
            temporary_password: rawPassword,
            password_generated_at: new Date(),
            school_id: studentSchoolId,
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
      } else if (user.school_id !== studentSchoolId || !user.name || user.name === 'Parent') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            school_id: studentSchoolId,
            phone: matchedPhone,
            name: user.name && user.name !== 'Parent' ? user.name : parentContext.parentName,
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
      }
    } else {
      rawPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      user = await prisma.user.create({
        data: {
          name: parentContext.parentName,
          phone: matchedPhone,
          password: hashedPassword,
          temporary_password: rawPassword,
          password_generated_at: new Date(),
          role: 'parent',
          school_id: studentSchoolId,
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
    }

    const smsResult = await sendPasswordSMS({
      phone: matchedPhone,
      password: rawPassword,
      schoolName: school.school_name,
      smsUsername: school.sms_username,
      parentName: user.name || parentContext.parentName,
      childName: parentContext.childName,
    });

    if (!smsResult.success) {
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          message: 'Check your phone. FutureLink has sent you an SMS password to access your portal.',
          warning: smsResult.error || 'Unable to send the parent password by SMS right now.',
          fallbackPassword: rawPassword,
          phone: matchedPhone,
        });
      }

      return NextResponse.json(
        { error: smsResult.error || 'Unable to send the parent password by SMS right now.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: 'Check your phone. FutureLink has sent you an SMS password to access your portal.',
    });
  } catch (error) {
    console.error('[Parent First Login Error]:', error instanceof Error ? error.message : 'Unknown error');

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
