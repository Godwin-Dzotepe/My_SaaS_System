import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getPushPublicKey } from '@/lib/push-service';

export const GET = withAuth(
  async () => {
    const key = getPushPublicKey();
    return NextResponse.json({
      enabled: Boolean(key),
      publicKey: key || null,
    });
  },
  {
    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],
  }
);

