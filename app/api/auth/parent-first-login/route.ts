import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const { phone } = validation.data;

    // 1. Check if there are any students associated with this parent phone
    const students = await prisma.student.findMany({
      where: { parent_phone: phone },
      include: { school: true }
    });

    if (students.length === 0) {
      return NextResponse.json({ 
        error: 'No students found linked to this phone number. Please contact the school.' 
      }, { status: 404 });
    }

    // 2. Generate a random 6-digit password
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 3. Find or Create the Parent User
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (user) {
      // Update existing user with new password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    } else {
      // Create new parent user
      // Note: We link them to the school of their first child found
      user = await prisma.user.create({
        data: {
          name: 'Parent', // Default name, can be updated later
          phone,
          password: hashedPassword,
          role: 'parent',
          school_id: students[0].school_id
        }
      });
    }

    // 4. Mock SMS Send
    // In a real app, you would call your SMS gateway API here (Twilio, etc.)
    console.log(`[SMS MOCK] Sending to ${phone}: Your school portal password is ${rawPassword}`);

    return NextResponse.json({ 
      message: 'A password has been sent to your phone via SMS. Please check and log in.' 
    });

  } catch (error) {
    console.error('Parent first login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
