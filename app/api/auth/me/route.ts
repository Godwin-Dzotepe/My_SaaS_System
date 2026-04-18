import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { findSessionUserWithSchoolBranding } from '@/lib/school-branding';

export const dynamic = 'force-dynamic';

export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session || !session.user || !session.user.id) {
        return NextResponse.json(
          { error: 'No session found or invalid session user.' },
          { status: 401 }
        );
      }

      console.log("API Auth /me - Fetching DB for User ID:", session.user.id);  
      const dbUser = await findSessionUserWithSchoolBranding(session.user.id);

      if (!dbUser) {
        return NextResponse.json(
          { error: 'User not found in database.' },
          { status: 404 }
        );
      }

      // If user is not super_admin and their school is deactivated, block them
      if (session.user.role !== 'super_admin' && dbUser.school && dbUser.school.isActive === false) {
        const response = NextResponse.json(
          { error: 'SCHOOL_DEACTIVATED', message: dbUser.school.deactivationMessage || "This school's account has been deactivated." },
          { status: 403 }
        );
        // Clear the token cookie
        response.cookies.delete('token');
        return response;
      }

      // Combine session info with fetched name
      const userWithDetails = {
        ...session.user,
        name: dbUser.name,
        school_id: session.user.school_id || dbUser.school_id,
        schoolName: dbUser.school?.school_name || null,
        schoolLogoUrl: dbUser.school?.logo_url || null,
        schoolSmsUsername: dbUser.school?.sms_username || null,
        has2fa: !!(dbUser as any).totpSecret?.verified,
      };

      return NextResponse.json({ user: userWithDetails });
    } catch (error) {
      console.error('Error fetching user session:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    // No specific roles needed, just an authenticated user
  }
);
