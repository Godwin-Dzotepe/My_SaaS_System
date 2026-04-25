import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'kobby.dev';

export const GET = withAuth(
  async () => {
    const schools = await prisma.school.findMany({
      where: { subdomain_status: { in: ['pending', 'approved', 'rejected'] } },
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

export const PATCH = withAuth(
  async ({ req }) => {
    const { schoolId, action, subdomain } = await req.json();
    if (!schoolId || !action) {
      return NextResponse.json({ error: 'schoolId and action required.' }, { status: 400 });
    }

    // Find the school admin user to notify
    const schoolAdmin = await prisma.user.findFirst({
      where: { school_id: schoolId, role: 'school_admin' },
      select: { id: true },
    });

    if (action === 'approve') {
      if (!subdomain || !/^[a-z0-9-]{2,32}$/.test(subdomain)) {
        return NextResponse.json({ error: 'Valid subdomain slug required.' }, { status: 400 });
      }
      const taken = await prisma.school.findFirst({
        where: { subdomain, NOT: { id: schoolId } },
      });
      if (taken) return NextResponse.json({ error: 'Subdomain already in use.' }, { status: 409 });

      const school = await prisma.school.update({
        where: { id: schoolId },
        data: { subdomain, subdomain_status: 'approved' },
        select: { school_name: true, subdomain: true, id: true },
      });

      // Notify school admin
      if (schoolAdmin) {
        await prisma.appNotification.create({
          data: {
            user_id: schoolAdmin.id,
            school_id: schoolId,
            title: 'Domain Request Approved',
            body: `Your custom domain request has been approved! Your school is now accessible at ${subdomain}.${BASE_DOMAIN}`,
            source_role: 'super_admin',
            source_name: 'Super Admin',
          },
        });
      }

      return NextResponse.json({ message: `Approved. ${school.school_name} → ${subdomain}.${BASE_DOMAIN}` });
    }

    if (action === 'reject') {
      const school = await prisma.school.update({
        where: { id: schoolId },
        data: { subdomain_request: null, subdomain_status: 'rejected' },
        select: { school_name: true },
      });

      if (schoolAdmin) {
        await prisma.appNotification.create({
          data: {
            user_id: schoolAdmin.id,
            school_id: schoolId,
            title: 'Domain Request Declined',
            body: `Your custom domain request has been declined by the super admin. You may submit a new request with a different name.`,
            source_role: 'super_admin',
            source_name: 'Super Admin',
          },
        });
      }

      return NextResponse.json({ message: `Request for ${school.school_name} declined.` });
    }

    if (action === 'delete') {
      await prisma.school.update({
        where: { id: schoolId },
        data: { subdomain: null, subdomain_request: null, subdomain_status: 'none' },
      });
      return NextResponse.json({ message: 'Domain record deleted.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  },
  { roles: ['super_admin'] }
);
