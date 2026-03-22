import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// POST /api/scores - Create or update a score
export const POST = withAuth(
  async ({ req, session }) => {
    const {
      student_id,
      subject_id,
      classScore,
      examScore,
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
      // Fetch grading configuration for the school
      const gradingConfig = await prisma.gradingConfig.findMany({
        where: { school_id },
        orderBy: { min_score: 'asc' },
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

      // Calculate total score
      const totalScore = (classScore || 0) + (examScore || 0);

      // Determine grade and remark
      let grade = 'N/A';
      let remark = 'No remark';

      for (const config of gradingConfig) {
        if (totalScore >= config.min_score && totalScore <= config.max_score) {
          grade = config.grade;
          remark = config.remark;
          break;
        }
      }

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
            classScore,
            examScore,
            totalScore,
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
            classScore,
            examScore,
            totalScore,
            grade,
            remark,
          },
        });
      }

      return NextResponse.json(score, { status: 200 });
    } catch (error) {
      console.error('Error creating/updating score:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['teacher'], // Only teachers can access this route
  }
);