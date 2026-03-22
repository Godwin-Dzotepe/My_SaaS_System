import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';

const gradingConfigSchema = z.object({
    grade: z.string().min(1, 'Grade is required.'),
    min_score: z.number().int().min(0).max(100),
    max_score: z.number().int().min(0).max(100),
    remark: z.string().min(1, 'Remark is required.'),
});

// PUT /api/grading/[id] - Update a grading config
export const PUT = withAuth(
    async ({ req, session, params }) => {
        const id = params?.id;
        if (!id) {
            return NextResponse.json({ error: 'ID is missing.' }, { status: 400 });
        }

        try {
            if (!session.user.school_id) {
                return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
            }

            const body = await req.json();
            const validation = gradingConfigSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({ error: validation.error.issues }, { status: 400 });
            }

            const { grade, min_score, max_score, remark } = validation.data;

            const existingConfig = await prisma.gradingConfig.findFirst({
                where: { id, school_id: session.user.school_id }
            });

            if (!existingConfig) {
                return NextResponse.json({ error: 'Grading config not found or you do not have permission to edit it.' }, { status: 404 });
            }

            const updatedConfig = await prisma.gradingConfig.update({
                where: { id },
                data: {
                    grade,
                    min_score,
                    max_score,
                    remark,
                },
            });

            return NextResponse.json(updatedConfig);
        } catch (error) {
            console.error('Error updating grading config:', error);
            return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
        }
    },
    {
        roles: ['school_admin'],
    }
);

// DELETE /api/grading/[id] - Delete a grading config
export const DELETE = withAuth(
    async ({ session, params }) => {
        const id = params?.id;
        if (!id) {
            return NextResponse.json({ error: 'ID is missing.' }, { status: 400 });
        }
        
        try {
            if (!session.user.school_id) {
                return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
            }

            const existingConfig = await prisma.gradingConfig.findFirst({
                where: { id, school_id: session.user.school_id }
            });

            if (!existingConfig) {
                return NextResponse.json({ error: 'Grading config not found or you do not have permission to delete it.' }, { status: 404 });
            }

            await prisma.gradingConfig.delete({
                where: { id },
            });

            return new NextResponse(null, { status: 204 }); // No Content
        } catch (error) {
            console.error('Error deleting grading config:', error);
            return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
        }
    },
    {
        roles: ['school_admin'],
    }
);
