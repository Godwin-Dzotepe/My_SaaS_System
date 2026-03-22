import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authorize } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const teacherCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1),
  password: z.string().min(1),
  subjectIds: z.array(z.string()).optional(),
  school_id: z.string().uuid().optional(),
  residential_address: z.string().optional(),
  digital_address: z.string().optional(),
  is_graduate: z.boolean().optional(),
  graduate_school: z.string().optional(),
});

function getSupportedUserCreateData(data: Record<string, unknown>) {
  const userModel = Prisma.dmmf.datamodel.models.find((model) => model.name === 'User');
  const supportedFields = new Set((userModel?.fields || []).map((field) => field.name));

  return {
    data: Object.fromEntries(Object.entries(data).filter(([key]) => supportedFields.has(key))),
    unsupportedFields: Object.keys(data).filter((key) => !supportedFields.has(key)),
  };
}

function getOptionalString(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function parseTeacherRequest(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const imageFile = formData.get('profile_image');

    return {
      data: {
        name: getOptionalString(formData.get('name')),
        email: getOptionalString(formData.get('email')),
        phone: getOptionalString(formData.get('phone')),
        password: getOptionalString(formData.get('password')),
        school_id: getOptionalString(formData.get('school_id')),
        residential_address: getOptionalString(formData.get('residential_address')),
        digital_address: getOptionalString(formData.get('digital_address')),
        is_graduate: getOptionalString(formData.get('is_graduate')) === 'true',
        graduate_school: getOptionalString(formData.get('graduate_school')),
        subjectIds: formData.getAll('subjectIds').filter((value): value is string => typeof value === 'string'),
      },
      imageFile: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
    };
  }

  return {
    data: await req.json(),
    imageFile: null,
  };
}

async function saveTeacherProfileImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Profile image must be an image file');
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'teachers');
  await mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(file.name) || '.jpg';
  const safeBaseName = path
    .basename(file.name, extension)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase()
    .slice(0, 40) || 'teacher-photo';
  const fileName = `${Date.now()}-${safeBaseName}${extension.toLowerCase()}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/teachers/${fileName}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: 'teacher',
        school_id: user.school_id || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        classes: {
          select: {
            id: true,
            class_name: true,
          }
        },
        subjects: {
          select: {
            id: true,
            subject_name: true
          }
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    if (!user.school_id && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
    }

    const { data: body, imageFile } = await parseTeacherRequest(req);
    const validation = teacherCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      password,
      subjectIds,
      school_id: requestedSchoolId,
      residential_address,
      digital_address,
      is_graduate,
      graduate_school,
    } = validation.data;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, phone and password are required' }, { status: 400 });
    }

    const teacherSchoolId = user.role === 'super_admin' ? requestedSchoolId : user.school_id;
    if (!teacherSchoolId) {
      return NextResponse.json({ error: 'School is required for teacher creation' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = imageFile ? await saveTeacherProfileImage(imageFile) : undefined;

    const dataObj: any = {
      name,
      email: email || undefined,
      phone,
      password: hashedPassword,
      role: 'teacher',
      school_id: teacherSchoolId,
    };

    if (profileImagePath) dataObj.image = profileImagePath;
    if (residential_address) dataObj.residential_address = residential_address;
    if (digital_address) dataObj.digital_address = digital_address;
    if (typeof is_graduate === 'boolean') dataObj.is_graduate = is_graduate;
    if (graduate_school) dataObj.graduate_school = graduate_school;

    if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
      const subjects = await prisma.subject.findMany({
        where: {
          id: { in: subjectIds },
          school_id: teacherSchoolId,
        },
        select: { id: true },
      });

      if (subjects.length !== subjectIds.length) {
        return NextResponse.json({ error: 'One or more selected subjects are invalid for this school' }, { status: 400 });
      }

      dataObj.subjects = {
        connect: subjects.map(({ id }) => ({ id }))
      };
    }

    const { data: supportedUserData, unsupportedFields } = getSupportedUserCreateData(dataObj);

    const newTeacher = await prisma.user.create({
      data: supportedUserData,
    });

    return NextResponse.json({
      teacher: newTeacher,
      warning: unsupportedFields.length > 0
        ? 'Some teacher profile fields were skipped because the Prisma client/database schema is not fully updated yet.'
        : undefined,
      skippedFields: unsupportedFields,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
