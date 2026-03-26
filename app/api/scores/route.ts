import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

const scoreModelHasField = (fieldName: string) => {
  try {
    const scoreModel = (prisma as any)?._runtimeDataModel?.models?.Score;
    if (!scoreModel) return false;

    const fields = scoreModel.fields;
    if (Array.isArray(fields)) {
      return fields.some((field: any) => field?.name === fieldName);
    }

    if (fields && typeof fields === 'object') {
      return fieldName in fields;
    }

    return false;
  } catch {
    return false;
  }
};

export const GET = withAuth(
  async ({ req, session }) => {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const academicYear = searchParams.get('academic_year');
    const term = searchParams.get('term');

    const school_id = session.user.school_id;
    if (!school_id) {
      return NextResponse.json(
        { error: 'User is not associated with a school.' },
        { status: 400 }
      );
    }

    try {
      const supportsBehaviorFields =
        scoreModelHasField('behavior') && scoreModelHasField('teacherAdvice');

      const [teacherClasses, teacherWithSubjects] = await Promise.all([
        prisma.class.findMany({
          where: {
            school_id,
            teacher_id: session.user.id,
          },
          select: {
            id: true,
            class_name: true,
          },
          orderBy: {
            class_name: 'asc',
          },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            subjects: {
              where: {
                school_id,
              },
              select: {
                id: true,
                subject_name: true,
              },
              orderBy: {
                subject_name: 'asc',
              },
            },
          },
        }),
      ]);

      const teacherClassIds = teacherClasses.map((item) => item.id);
      const teacherSubjectIds = (teacherWithSubjects?.subjects || []).map((item) => item.id);

      if (classId && !teacherClassIds.includes(classId)) {
        return NextResponse.json(
          { error: 'You can only view scores for classes assigned to you.' },
          { status: 403 }
        );
      }

      if (subjectId && !teacherSubjectIds.includes(subjectId)) {
        return NextResponse.json(
          { error: 'You can only view scores for subjects assigned to you.' },
          { status: 403 }
        );
      }

      if (teacherClassIds.length === 0 && teacherSubjectIds.length === 0) {
        return NextResponse.json({
          scores: [],
          classes: teacherClasses,
          subjects: teacherWithSubjects?.subjects || [],
        });
      }

      const accessScopes: any[] = [
        ...(teacherClassIds.length > 0
          ? [
              {
                student: {
                  is: {
                    class_id: {
                      in: teacherClassIds,
                    },
                  },
                },
              },
            ]
          : []),
        ...(teacherSubjectIds.length > 0
          ? [
              {
                subject_id: {
                  in: teacherSubjectIds,
                },
              },
            ]
          : []),
      ];

      const where: any = {
        student: {
          is: {
            school_id,
            ...(classId ? { class_id: classId } : {}),
          },
        },
        ...(subjectId ? { subject_id: subjectId } : {}),
        ...(academicYear ? { academic_year: academicYear } : {}),
        ...(term ? { term } : {}),
        ...(accessScopes.length === 1
          ? accessScopes[0]
          : {
              OR: accessScopes,
            }),
      };

      const scores = await prisma.score.findMany({
        where,
        select: {
          id: true,
          academic_year: true,
          term: true,
          classScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          remark: true,
          ...(supportsBehaviorFields
            ? {
                behavior: true,
                teacherAdvice: true,
              }
            : {}),
          updated_at: true,
          subject: {
            select: {
              id: true,
              subject_name: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              student_number: true,
              class: {
                select: {
                  id: true,
                  class_name: true,
                },
              },
            },
          },
        },
        orderBy: [{ updated_at: 'desc' }, { id: 'asc' }],
      });

      return NextResponse.json({
        scores,
        classes: teacherClasses,
        subjects: teacherWithSubjects?.subjects || [],
      });
    } catch (error: any) {
      console.error('Error fetching scores:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch scores.',
          details: error?.message || 'Unknown server error.',
        },
        { status: 500 }
      );
    }
  },
  {
    roles: ['teacher'],
  }
);

// POST /api/scores - Create or update a score
export const POST = withAuth(
  async ({ req, session }) => {
    const {
      student_id,
      subject_id,
      classScore,
      examScore,
      behavior,
      teacherAdvice,
      term,
      academic_year,
    } = await req.json();

    if (!student_id || !subject_id || !term || !academic_year) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const school_id = session.user.school_id;
    if (!school_id) {
      return NextResponse.json(
        { error: 'User is not associated with a school.' },
        { status: 400 }
      );
    }

    try {
      const supportsBehaviorFields =
        scoreModelHasField('behavior') && scoreModelHasField('teacherAdvice');

      const [student, subject] = await Promise.all([
        prisma.student.findUnique({
          where: { id: student_id },
          select: {
            id: true,
            school_id: true,
            class: {
              select: {
                id: true,
                teacher_id: true,
              },
            },
          },
        }),
        prisma.subject.findUnique({
          where: { id: subject_id },
          select: {
            id: true,
            school_id: true,
            teachers: {
              where: { id: session.user.id },
              select: { id: true },
            },
          },
        }),
      ]);

      if (!student || student.school_id !== school_id) {
        return NextResponse.json(
          { error: 'Student not found in your school.' },
          { status: 404 }
        );
      }

      if (!subject || subject.school_id !== school_id) {
        return NextResponse.json(
          { error: 'Subject not found in your school.' },
          { status: 404 }
        );
      }

      const isAssignedTeacher =
        student.class?.teacher_id === session.user.id ||
        subject.teachers.length > 0;

      if (!isAssignedTeacher) {
        return NextResponse.json(
          { error: 'You are not assigned to score this student/subject.' },
          { status: 403 }
        );
      }

      const normalizedClassScore = classScore === null || classScore === undefined ? null : Number(classScore);
      const normalizedExamScore = examScore === null || examScore === undefined ? null : Number(examScore);

      if (
        (normalizedClassScore !== null && Number.isNaN(normalizedClassScore)) ||
        (normalizedExamScore !== null && Number.isNaN(normalizedExamScore))
      ) {
        return NextResponse.json(
          { error: 'Class score and exam score must be valid numbers.' },
          { status: 400 }
        );
      }

      // Calculate total score only if at least one numeric score is provided
      const totalScore =
        normalizedClassScore === null && normalizedExamScore === null
          ? null
          : (normalizedClassScore ?? 0) + (normalizedExamScore ?? 0);

      let gradingConfig: Array<{ min_score: number; max_score: number; grade: string; remark: string }> = [];
      if (totalScore !== null) {
        // Only require grading config when numeric scores are submitted.
        gradingConfig = await prisma.gradingConfig.findMany({
          where: { school_id },
          orderBy: { min_score: 'asc' },
          select: {
            min_score: true,
            max_score: true,
            grade: true,
            remark: true,
          },
        });

        if (!gradingConfig || gradingConfig.length === 0) {
          return NextResponse.json(
            {
              error:
                'Grading system is not configured for this school. Please contact the administrator.',
            },
            { status: 400 }
          );
        }
      }

      // Determine grade and remark
      let grade: string | null = null;
      let remark: string | null = null;

      if (totalScore !== null) {
        grade = 'N/A';
        remark = 'No remark';

        for (const config of gradingConfig) {
          if (totalScore >= config.min_score && totalScore <= config.max_score) {
            grade = config.grade;
            remark = config.remark;
            break;
          }
        }
      }

      const normalizedBehavior =
        typeof behavior === 'string' && behavior.trim().length > 0 ? behavior.trim() : null;
      const normalizedTeacherAdvice =
        typeof teacherAdvice === 'string' && teacherAdvice.trim().length > 0
          ? teacherAdvice.trim()
          : null;

      // Upsert the score
      let score = await prisma.score.findFirst({
        where: {
          student_id,
          subject_id,
          academic_year,
          term,
        },
      });

      if (score) {
        score = await prisma.score.update({
          where: { id: score.id },
          data: {
            classScore: normalizedClassScore,
            examScore: normalizedExamScore,
            totalScore,
            ...(supportsBehaviorFields
              ? {
                  behavior: normalizedBehavior,
                  teacherAdvice: normalizedTeacherAdvice,
                }
              : {}),
            grade,
            remark,
          },
        });
      } else {
        score = await prisma.score.create({
          data: {
            student_id,
            subject_id,
            academic_year,
            term,
            classScore: normalizedClassScore,
            examScore: normalizedExamScore,
            totalScore,
            ...(supportsBehaviorFields
              ? {
                  behavior: normalizedBehavior,
                  teacherAdvice: normalizedTeacherAdvice,
                }
              : {}),
            grade,
            remark,
          },
        });
      }

      return NextResponse.json(score, { status: 200 });
    } catch (error: any) {
      console.error('Error creating/updating score:', error);
      return NextResponse.json(
        {
          error: 'Something went wrong.',
          details: error?.message || 'Unknown server error.',
        },
        { status: 500 }
      );
    }
  },
  {
    roles: ['teacher'], // Only teachers can access this route
  }
);
