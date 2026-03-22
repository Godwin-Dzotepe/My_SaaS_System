import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';
import { ensureParentAccount } from '@/lib/parent-account';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const studentSchema = z.object({
  name: z.string().min(2),
  student_number: z.string().optional(),
  class_id: z.string().uuid(),
  school_id: z.string().uuid(),
  parent_phone: z.string().min(10).optional(),
  parent_name: z.string().min(2).optional(),
  parent_email: z.string().email().optional(),
  parent_relation: z.string().optional(),
  date_of_birth: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid date of birth'),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  admission_date: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Invalid admission date'),
  previous_school: z.string().optional(),
  residential_address: z.string().optional(),
  digital_address: z.string().optional(),
  father_name: z.string().optional(),
  father_phone: z.string().min(10).optional(),
  father_profession: z.string().optional(),
  father_status: z.string().optional(),
  father_residential_address: z.string().optional(),
  father_digital_address: z.string().optional(),
  mother_name: z.string().optional(),
  mother_phone: z.string().min(10).optional(),
  mother_profession: z.string().optional(),
  mother_status: z.string().optional(),
  mother_residential_address: z.string().optional(),
  mother_digital_address: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().min(10).optional(),
  guardian_profession: z.string().optional(),
  guardian_residential_address: z.string().optional(),
  guardian_digital_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_notes: z.string().optional(),
});

function getOptionalString(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function parseStudentRequest(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const imageFile = formData.get('profile_image');

    return {
      data: {
        name: getOptionalString(formData.get('name')),
        student_number: getOptionalString(formData.get('student_number')),
        class_id: getOptionalString(formData.get('class_id')),
        school_id: getOptionalString(formData.get('school_id')),
        parent_phone: getOptionalString(formData.get('parent_phone')),
        parent_name: getOptionalString(formData.get('parent_name')),
        parent_email: getOptionalString(formData.get('parent_email')),
        parent_relation: getOptionalString(formData.get('parent_relation')),
        date_of_birth: getOptionalString(formData.get('date_of_birth')),
        gender: getOptionalString(formData.get('gender')),
        nationality: getOptionalString(formData.get('nationality')),
        admission_date: getOptionalString(formData.get('admission_date')),
        previous_school: getOptionalString(formData.get('previous_school')),
        residential_address: getOptionalString(formData.get('residential_address')),
        digital_address: getOptionalString(formData.get('digital_address')),
        father_name: getOptionalString(formData.get('father_name')),
        father_phone: getOptionalString(formData.get('father_phone')),
        father_profession: getOptionalString(formData.get('father_profession')),
        father_status: getOptionalString(formData.get('father_status')),
        father_residential_address: getOptionalString(formData.get('father_residential_address')),
        father_digital_address: getOptionalString(formData.get('father_digital_address')),
        mother_name: getOptionalString(formData.get('mother_name')),
        mother_phone: getOptionalString(formData.get('mother_phone')),
        mother_profession: getOptionalString(formData.get('mother_profession')),
        mother_status: getOptionalString(formData.get('mother_status')),
        mother_residential_address: getOptionalString(formData.get('mother_residential_address')),
        mother_digital_address: getOptionalString(formData.get('mother_digital_address')),
        guardian_name: getOptionalString(formData.get('guardian_name')),
        guardian_phone: getOptionalString(formData.get('guardian_phone')),
        guardian_profession: getOptionalString(formData.get('guardian_profession')),
        guardian_residential_address: getOptionalString(formData.get('guardian_residential_address')),
        guardian_digital_address: getOptionalString(formData.get('guardian_digital_address')),
        emergency_contact_name: getOptionalString(formData.get('emergency_contact_name')),
        emergency_contact_phone: getOptionalString(formData.get('emergency_contact_phone')),
        medical_notes: getOptionalString(formData.get('medical_notes')),
      },
      imageFile: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
    };
  }

  return {
    data: await req.json(),
    imageFile: null,
  };
}

async function saveProfileImage(file: File) {
  const upload = await uploadImageToCloudinary(file, 'my-school-saas/students');
  return upload.url;
}

function getSupportedStudentCreateData(data: Record<string, unknown>) {
  const studentModel = Prisma.dmmf.datamodel.models.find((model) => model.name === 'Student');
  const supportedFields = new Set(
    (studentModel?.fields || []).map((field) => field.name)
  );

  const filteredEntries = Object.entries(data).filter(([key]) => supportedFields.has(key));
  const unsupportedFields = Object.keys(data).filter((key) => !supportedFields.has(key));

  return {
    data: Object.fromEntries(filteredEntries),
    unsupportedFields,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and check role
    const auth = await authorize(req, ['school_admin', 'secretary', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { data: body, imageFile } = await parseStudentRequest(req);
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const {
      name,
      student_number,
      class_id,
      school_id,
      parent_phone,
      parent_name,
      parent_email,
      parent_relation,
      date_of_birth,
      gender,
      nationality,
      admission_date,
      previous_school,
      residential_address,
      digital_address,
      father_name,
      father_phone,
      father_profession,
      father_status,
      father_residential_address,
      father_digital_address,
      mother_name,
      mother_phone,
      mother_profession,
      mother_status,
      mother_residential_address,
      mother_digital_address,
      guardian_name,
      guardian_phone,
      guardian_profession,
      guardian_residential_address,
      guardian_digital_address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_notes,
    } = validation.data;

    // 2. Check user belongs to school
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'You are not authorized for this school' }, { status: 403 });
    }

    // 3. Ensure class belongs to same school
    const classExists = await prisma.class.findFirst({
      where: {
        id: class_id,
        school_id
      }
    });

    if (!classExists) {
      return NextResponse.json({ error: 'Invalid class for this school' }, { status: 400 });
    }

    // 4. Check duplicate student number
    if (student_number) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          student_number,
          school_id,
        }
      });

      if (existingStudent) {
        return NextResponse.json({ error: 'Student number already exists in this school' }, { status: 400 });
      }
    }

    let profileImagePath: string | null = null;
    if (imageFile) {
      profileImagePath = await saveProfileImage(imageFile);
    }

    const schoolRecord = await prisma.school.findUnique({
      where: { id: school_id },
      select: { school_name: true },
    });

    if (!schoolRecord) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // 5. Handle Parent Accounts (OPTIONAL) - AUTO PASSWORD + SMS
    let parentUser: any = null;
    const fatherUser = await ensureParentAccount({ name: father_name, phone: father_phone, schoolId: school_id, schoolName: schoolRecord.school_name });
    const motherUser = await ensureParentAccount({ name: mother_name, phone: mother_phone, schoolId: school_id, schoolName: schoolRecord.school_name });
    const guardianUser = await ensureParentAccount({ name: guardian_name, phone: guardian_phone, schoolId: school_id, schoolName: schoolRecord.school_name });

    if (parent_name && parent_phone) {
      parentUser = await ensureParentAccount({
        name: parent_name,
        phone: parent_phone,
        email: parent_email,
        schoolId: school_id,
        schoolName: schoolRecord.school_name,
      });
    }

    // 6. Create Student and link to Parent (if parent exists)
    const studentData: any = {
      name,
      class_id,
      school_id,
      status: 'active'
    };

    // Link parent if one was created/found
    const primaryParentUser = fatherUser?.user || motherUser?.user || guardianUser?.user || parentUser?.user;
    if (primaryParentUser) {
      studentData.parent_id = primaryParentUser.id;
    }

    // Store parent contact info
    if (parent_phone) {
      studentData.parent_phone = parent_phone;
    }

    if (parent_name) {
      studentData.parent_name = parent_name;
    }

    if (parent_relation) {
      studentData.parent_relation = parent_relation;
    }

    if (father_name) studentData.father_name = father_name;
    if (father_phone) studentData.father_phone = father_phone;
    if (father_profession) studentData.father_profession = father_profession;
    if (father_status) studentData.father_status = father_status;
    if (father_residential_address) studentData.father_residential_address = father_residential_address;
    if (father_digital_address) studentData.father_digital_address = father_digital_address;

    if (mother_name) studentData.mother_name = mother_name;
    if (mother_phone) studentData.mother_phone = mother_phone;
    if (mother_profession) studentData.mother_profession = mother_profession;
    if (mother_status) studentData.mother_status = mother_status;
    if (mother_residential_address) studentData.mother_residential_address = mother_residential_address;
    if (mother_digital_address) studentData.mother_digital_address = mother_digital_address;

    if (guardian_name) studentData.guardian_name = guardian_name;
    if (guardian_phone) studentData.guardian_phone = guardian_phone;
    if (guardian_profession) studentData.guardian_profession = guardian_profession;
    if (guardian_residential_address) studentData.guardian_residential_address = guardian_residential_address;
    if (guardian_digital_address) studentData.guardian_digital_address = guardian_digital_address;

    if (!studentData.parent_name) {
      studentData.parent_name = father_name || mother_name || guardian_name;
    }

    if (!studentData.parent_phone) {
      studentData.parent_phone = father_phone || mother_phone || guardian_phone;
    }

    if (!studentData.parent_relation) {
      studentData.parent_relation = father_name
        ? 'Father'
        : mother_name
          ? 'Mother'
          : guardian_name
            ? 'Guardian'
            : undefined;
    }

    // Only include optional fields if they have values
    if (student_number) {
      studentData.student_number = student_number;
    }

    if (date_of_birth) {
      studentData.date_of_birth = new Date(date_of_birth);
    }

    if (gender) {
      studentData.gender = gender;
    }

    if (nationality) {
      studentData.nationality = nationality;
    }

    if (admission_date) {
      studentData.admission_date = new Date(admission_date);
    }

    if (previous_school) {
      studentData.previous_school = previous_school;
    }

    if (residential_address) {
      studentData.residential_address = residential_address;
    }

    if (digital_address) {
      studentData.digital_address = digital_address;
    }

    if (emergency_contact_name) {
      studentData.emergency_contact_name = emergency_contact_name;
    }

    if (emergency_contact_phone) {
      studentData.emergency_contact_phone = emergency_contact_phone;
    }

    if (medical_notes) {
      studentData.medical_notes = medical_notes;
    }

    if (profileImagePath) {
      studentData.profile_image = profileImagePath;
    }

    const { data: supportedStudentData, unsupportedFields } = getSupportedStudentCreateData(studentData);

    if (unsupportedFields.length > 0) {
      console.warn(
        '[students.create] Skipping unsupported Student fields until Prisma client/database are updated:',
        unsupportedFields
      );
    }

    const newStudent = await prisma.student.create({
      data: supportedStudentData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        class: true
      }
    });

    // 7. Return Success Response
    const response: any = {
      message: 'Student registered successfully',
      student: newStudent
    };

    // Include parent info in response if parent was linked
    if (newStudent.parent) {
      response.parent = newStudent.parent;
      response.parentLinked = true;
    } else {
      response.parentLinked = false;
    }

    response.parentAccounts = [fatherUser, motherUser, guardianUser, parentUser]
      .filter(Boolean)
      .map((account) => ({
        id: account.user.id,
        name: account.user.name,
        phone: account.user.phone,
        temporary_password: account.temporaryPassword,
        was_created: account.wasCreated,
      }));

    if (unsupportedFields.length > 0) {
      response.warning = 'Some new student profile fields were skipped because the Prisma client/database schema is not fully updated yet.';
      response.skippedFields = unsupportedFields;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 });
  }
}


