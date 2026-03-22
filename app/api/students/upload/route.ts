import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';
import { ensureParentAccount } from '@/lib/parent-account';

function normalizeString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getSupportedStudentData(data: Record<string, unknown>) {
  const studentModel = Prisma.dmmf.datamodel.models.find((model) => model.name === 'Student');
  const supportedFields = new Set((studentModel?.fields || []).map((field) => field.name));
  return Object.fromEntries(Object.entries(data).filter(([key]) => supportedFields.has(key)));
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fallbackClassId = normalizeString(formData.get('class_id'));

    if (!file) {
      return NextResponse.json({ error: 'Missing upload file' }, { status: 400 });
    }

    const schoolId = user.school_id;
    if (!schoolId) {
      return NextResponse.json({ error: 'School information not found' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { school_name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const classes = await prisma.class.findMany({
      where: { school_id: schoolId },
      select: { id: true, class_name: true, school_id: true },
    });

    const classesById = new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass]));
    const classesByName = new Map(classes.map((schoolClass) => [schoolClass.class_name.trim().toLowerCase(), schoolClass]));

    if (fallbackClassId) {
      const fallbackClass = classesById.get(fallbackClassId);
      if (!fallbackClass || !validateSchool(user, fallbackClass.school_id)) {
        return NextResponse.json({ error: 'You are not authorized for this class' }, { status: 403 });
      }
    }

    const fileText = await file.text();
    const rows = JSON.parse(fileText) as Record<string, unknown>[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No students to import' }, { status: 400 });
    }

    const createdStudents: Array<{ id: string; name: string }> = [];
    const parentAccounts = new Map<string, { id: string; name: string; phone: string; temporary_password: string | null }>();
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      try {
        const name = normalizeString(row.name);
        if (!name) {
          throw new Error('Student name is required');
        }

        const rowClassId = normalizeString(row.class_id);
        const rowClassName = normalizeString(row.class_name);
        const resolvedClass = rowClassId
          ? classesById.get(rowClassId)
          : rowClassName
            ? classesByName.get(rowClassName.toLowerCase())
            : fallbackClassId
              ? classesById.get(fallbackClassId)
              : undefined;

        if (!resolvedClass) {
          throw new Error('A valid class_id, class_name, or selected class is required');
        }

        const fatherAccount = await ensureParentAccount({
          name: normalizeString(row.father_name),
          phone: normalizeString(row.father_phone),
          schoolId,
          schoolName: school.school_name,
        });
        const motherAccount = await ensureParentAccount({
          name: normalizeString(row.mother_name),
          phone: normalizeString(row.mother_phone),
          schoolId,
          schoolName: school.school_name,
        });
        const guardianAccount = await ensureParentAccount({
          name: normalizeString(row.guardian_name),
          phone: normalizeString(row.guardian_phone),
          schoolId,
          schoolName: school.school_name,
        });
        const parentAccount = await ensureParentAccount({
          name: normalizeString(row.parent_name),
          phone: normalizeString(row.parent_phone),
          schoolId,
          schoolName: school.school_name,
        });

        [fatherAccount, motherAccount, guardianAccount, parentAccount].filter(Boolean).forEach((account) => {
          if (!account) return;
          parentAccounts.set(account.user.phone, {
            id: account.user.id,
            name: account.user.name,
            phone: account.user.phone,
            temporary_password: account.temporaryPassword,
          });
        });

        const primaryParent = fatherAccount?.user || motherAccount?.user || guardianAccount?.user || parentAccount?.user;

        const studentData: Record<string, unknown> = {
          name,
          student_number: normalizeString(row.student_number),
          class_id: resolvedClass.id,
          school_id: schoolId,
          parent_id: primaryParent?.id,
          parent_name: normalizeString(row.parent_name) || normalizeString(row.father_name) || normalizeString(row.mother_name) || normalizeString(row.guardian_name),
          parent_phone: normalizeString(row.parent_phone) || normalizeString(row.father_phone) || normalizeString(row.mother_phone) || normalizeString(row.guardian_phone),
          parent_relation: normalizeString(row.parent_relation) || (normalizeString(row.father_name) ? 'Father' : normalizeString(row.mother_name) ? 'Mother' : normalizeString(row.guardian_name) ? 'Guardian' : undefined),
          date_of_birth: normalizeString(row.date_of_birth) ? new Date(String(row.date_of_birth)) : undefined,
          gender: normalizeString(row.gender),
          nationality: normalizeString(row.nationality),
          admission_date: normalizeString(row.admission_date) ? new Date(String(row.admission_date)) : undefined,
          previous_school: normalizeString(row.previous_school),
          residential_address: normalizeString(row.residential_address),
          digital_address: normalizeString(row.digital_address),
          father_name: normalizeString(row.father_name),
          father_phone: normalizeString(row.father_phone),
          father_profession: normalizeString(row.father_profession),
          father_status: normalizeString(row.father_status),
          father_residential_address: normalizeString(row.father_residential_address),
          father_digital_address: normalizeString(row.father_digital_address),
          mother_name: normalizeString(row.mother_name),
          mother_phone: normalizeString(row.mother_phone),
          mother_profession: normalizeString(row.mother_profession),
          mother_status: normalizeString(row.mother_status),
          mother_residential_address: normalizeString(row.mother_residential_address),
          mother_digital_address: normalizeString(row.mother_digital_address),
          guardian_name: normalizeString(row.guardian_name),
          guardian_phone: normalizeString(row.guardian_phone),
          guardian_profession: normalizeString(row.guardian_profession),
          guardian_residential_address: normalizeString(row.guardian_residential_address),
          guardian_digital_address: normalizeString(row.guardian_digital_address),
          emergency_contact_name: normalizeString(row.emergency_contact_name),
          emergency_contact_phone: normalizeString(row.emergency_contact_phone),
          medical_notes: normalizeString(row.medical_notes),
          status: 'active',
        };

        const student = await prisma.student.create({
          data: getSupportedStudentData(studentData),
          select: { id: true, name: true },
        });

        createdStudents.push(student);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown import error';
        errors.push(`Row ${index + 1}: ${message}`);
      }
    }

    return NextResponse.json({
      message: `${createdStudents.length} students imported successfully`,
      count: createdStudents.length,
      failed: errors.length,
      errors,
      parentAccounts: Array.from(parentAccounts.values()),
    }, { status: createdStudents.length > 0 ? 201 : 400 });
  } catch (error: any) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
  }
}
