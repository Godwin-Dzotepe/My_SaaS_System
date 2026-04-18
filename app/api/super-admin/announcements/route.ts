import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendSchoolBroadcastToParents } from '@/lib/school-broadcast';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        school_id: null // Only global ones
      },
      include: {
        creator: {
          select: { name: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching global announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        message,
        created_by: decoded.userId,
        school_id: null // Global
      }
    });

    const schools = await prisma.school.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const smsResults = await Promise.all(
      schools.map((school) => sendSchoolBroadcastToParents(school.id, message))
    );

    return NextResponse.json({
      announcement,
      sms: {
        recipients: smsResults.reduce((sum, result) => sum + result.recipients, 0),
        sent: smsResults.reduce((sum, result) => sum + result.sent, 0),
        failed: smsResults.reduce((sum, result) => sum + result.failed, 0),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating global announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
