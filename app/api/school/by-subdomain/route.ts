import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const school = await prisma.school.findUnique({
    where: { subdomain: slug },
    select: { id: true, school_name: true, logo_url: true, isActive: true },
  });

  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  if (!school.isActive) return NextResponse.json({ error: 'School is inactive' }, { status: 403 });

  return NextResponse.json(school);
}
