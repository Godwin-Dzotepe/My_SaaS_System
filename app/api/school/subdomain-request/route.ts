import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(
  async ({ req, session }) => {
    const { slug } = await req.json();
    if (!slug || !/^[a-z0-9-]{2,32}$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be 2–32 lowercase letters, numbers or hyphens.' },
        { status: 400 }
      );
    }

    const schoolId = session.user.school_id;
    if (!schoolId) return NextResponse.json({ error: 'No school found.' }, { status: 400 });

    // Check slug not already taken
    const taken = await prisma.school.findFirst({
      where: { OR: [{ subdomain: slug }, { subdomain_request: slug }], NOT: { id: schoolId } },
    });
    if (taken) return NextResponse.json({ error: 'This name is already taken or requested.' }, { status: 409 });

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: { subdomain_request: slug, subdomain_status: 'pending' },
      select: { subdomain_request: true, subdomain_status: true },
    });

    return NextResponse.json({ message: 'Request submitted.', ...school });
  },
  { roles: ['school_admin'] }
);

export const GET = withAuth(
  async ({ session }) => {
    const school = await prisma.school.findUnique({
      where: { id: session.user.school_id! },
      select: { subdomain: true, subdomain_request: true, subdomain_status: true },
    });
    return NextResponse.json(school ?? {});
  },
  { roles: ['school_admin'] }
);
