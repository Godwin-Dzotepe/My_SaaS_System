import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, validateSchool } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and check role
    const auth = await authorize(req, ['school_admin', 'secretary']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('class_id') as string;

    if (!file || !classId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get school_id from user context
    const schoolId = user.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: 'School information not found' }, { status: 400 });
    }

    // 2. Data Isolation Check
    if (!validateSchool(user, schoolId)) {
      return NextResponse.json({ error: 'You are not authorized for this school' }, { status: 403 });
    }

    // 3. Parse JSON data from file
    const fileText = await file.text();
    const jsonData = JSON.parse(fileText) as any[];

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'No students to import' }, { status: 400 });
    }

    // 4. Batch Create Students
    const studentsToCreate = jsonData
      .filter(row => row.name && row.parent_phone)
      .map(row => ({
        name: String(row.name),
        parent_phone: String(row.parent_phone),
        parent_name: row.parent_name ? String(row.parent_name) : null,
        parent_relation: row.parent_relation ? String(row.parent_relation) : null,
        student_number: row.student_number ? String(row.student_number) : undefined,
        class_id: classId,
        school_id: schoolId,
        status: 'active' as const
      }));

    if (studentsToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid students found to import' }, { status: 400 });
    }

    const results = await prisma.$transaction(
      studentsToCreate.map((data) => {
        return prisma.student.create({ data });
      })
    );

    return NextResponse.json({ 
      message: `${results.length} students imported successfully`,
      count: results.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in bulk upload:', error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'One or more Student Numbers or Parent Phones are already in use.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
  }
}

