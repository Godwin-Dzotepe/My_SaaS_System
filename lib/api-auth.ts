import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { prisma } from './prisma';

// Define a session object structure for clarity
export interface Session {
  user: {
    id: string;
    role: string;
    school_id: string | null; phone?: string;
  };
}

// The handler function that `withAuth` will wrap
type AuthHandler = (params: {
  req: NextRequest; params?: any;
  session: Session;
}) => Promise<NextResponse>;

// Options for the `withAuth` HOC
interface AuthOptions {
  roles?: string[];
}

export async function authorize(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: { id: string, role: string, school_id: string | null, phone?: string } } | NextResponse> {
  // Await cookies to ensure Next.js properly bails out of static rendering
  // Required in Next.js 15+ to parse cookies dynamically in some handlers
  const cookieStore = await cookies();
  
  const authHeader = req.headers.get('Authorization');
  const cookieToken = cookieStore.get('token')?.value || req.cookies.get('token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const verifiedUser = verifyToken(token);
  if (!verifiedUser) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Standardize the user object
  const user = {
      id: verifiedUser.userId,
      role: verifiedUser.role,
      school_id: verifiedUser.schoolId || null,
      phone: verifiedUser.phone
  };

  // ALWAYS CHECK ISACTIVE ON SCHOOL IF NOT SUPER ADMIN
  if (user.role !== 'super_admin') {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        school_id: true,
        school: {
          select: {
            isActive: true,
            deactivationMessage: true
          }
        }
      }
    });

    if (!dbUser) {
       return NextResponse.json({ error: 'User does not exist' }, { status: 401 });
    }

    if (dbUser.school && dbUser.school.isActive === false) {
       return NextResponse.json({ 
         error: 'SCHOOL_DEACTIVATED',
         message: dbUser.school.deactivationMessage || "This school's account has been deactivated."
       }, { status: 403 });
    }

    if (!user.school_id && dbUser.school_id) {
       user.school_id = dbUser.school_id;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Access denied: insufficient permissions' }, { status: 403 });
  }

  return { user };
}

export function validateSchool(user: { school_id: string | null, role: string }, targetSchoolId?: string | null) {
  if (user.role === 'super_admin') return true;
  if (!targetSchoolId) return true; // Let the caller decide or filter by user.school_id
  return user.school_id === targetSchoolId;
}

// The new withAuth HOC
export function withAuth(handler: AuthHandler, options?: AuthOptions) {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    try {
      const authResult = await authorize(req, options?.roles);
      const resolvedParams = params ? await Promise.resolve(params) : undefined;

      // Check if it's a plain `{ user }` object. 
      // This safely avoids `instanceof NextResponse` or deep property checks which crash Turbopack.
      if (authResult && typeof authResult === 'object' && 'user' in authResult) {
        const session: Session = {
          user: authResult.user,
        };
        return handler({ req, session, params: resolvedParams });
      }

      // Otherwise, it's the error NextResponse from authorize
      return authResult as NextResponse;

    } catch (err: any) {
      console.error('[withAuth] Caught exception:', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
