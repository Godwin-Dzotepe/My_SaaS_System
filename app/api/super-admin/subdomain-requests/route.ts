import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// List all pending subdomain requests
export const GET = withAuth(
  async () => {
    const schools = await prisma.school.findMany({
      where: { subdomain_status: 'pending' },
      select: {
        id: true,
        school_name: true,
        subdomain_request: true,
        subdomain_status: true,
        subdomain: true,
      },
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json(schools);
  },
  { roles: ['super_admin'] }
);

// Approve or reject a request
export const PATCH = withAuth(
  async ({ req }) => {
    const { schoolId, action, subdomain } = await req.json();

    if (!schoolId || !action) {
      return NextResponse.json({ error: 'schoolId and action required.' }, { status: 400 });
    }

    if (action === 'approve') {
      if (!subdomain || !/^[a-z0-9-]{2,32}$/.test(subdomain)) {
        return NextResponse.json({ error: 'Valid subdomain slug required.' }, { status: 400 });
      }

      // Check uniqueness
      const taken = await prisma.school.findFirst({
        where: { subdomain, NOT: { id: schoolId } },
      });
      if (taken) return NextResponse.json({ error: 'Subdomain already in use.' }, { status: 409 });

      const school = await prisma.school.update({
        where: { id: schoolId },
        data: { subdomain, subdomain_status: 'approved' },
        select: { school_name: true, subdomain: true },
      });

      return NextResponse.json({ message: `Approved. ${school.school_name} → ${school.subdomain}` });
    }

    if (action === 'reject') {
      await prisma.school.update({
        where: { id: schoolId },
        data: { subdomain_request: null, subdomain_status: 'rejected' },
      });
      return NextResponse.json({ message: 'Request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  },
  { roles: ['super_admin'] }
);
