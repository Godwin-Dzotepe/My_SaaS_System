import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, UserPayload } from './auth';
import { prisma } from './prisma';

export async function authorize(
  req: NextRequest, 
  allowedRoles?: string[]
): Promise<{ user: UserPayload } | NextResponse> {
  const authHeader = req.headers.get('Authorization');
  const cookieToken = req.cookies.get('token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  console.log('API Auth - Token User:', { id: user.userId, role: user.role, schoolId: user.schoolId });

  // Robustness: If schoolId is missing in token, try to fetch it from DB
  if (!user.schoolId && user.role !== 'super_admin') {
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { school_id: true }
    });
    console.log('API Auth - DB User school_id:', dbUser?.school_id);
    if (dbUser?.school_id) {
        user.schoolId = dbUser.school_id;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Access denied: insufficient permissions' }, { status: 403 });
  }

  return { user };
}

export function validateSchool(user: UserPayload, targetSchoolId?: string | null) {
  if (user.role === 'super_admin') return true;
  if (!targetSchoolId) return true; // Let the caller decide or filter by user.schoolId
  return user.schoolId === targetSchoolId;
}
