import { NextResponse } from 'next/server';

import { z } from 'zod';

import { withAuth } from '@/lib/api-auth';

import { prisma } from '@/lib/prisma';

import { getRecipientsForMessage } from '@/lib/messaging';

import type { Role } from '@prisma/client';

import { sendSMS } from '@/lib/sms-service';
import { sendPushToUsers } from '@/lib/push-service';



const createMessageSchema = z.object({

  title: z.string().min(1, 'Title is required.'),

  body: z.string().min(1, 'Message body is required.'),

  recipient_role: z.enum(['school_admin', 'teacher', 'parent', 'secretary', 'finance_admin']),

  delivery_mode: z.enum(['system', 'sms']).optional().default('system'),

});



export const GET = withAuth(

  async ({ session }) => {

    try {

      const messages = await prisma.appMessage.findMany({

        where: {

          OR: [

            { sender_id: session.user.id },

            { recipient_id: session.user.id },

          ],

        },

        include: {

          sender: {

            select: {

              id: true,

              name: true,

              role: true,

              school: {

                select: {

                  school_name: true,

                },

              },

            },

          },

          recipient: {

            select: {

              id: true,

              name: true,

              role: true,

              school: {

                select: {

                  school_name: true,

                },

              },

            },

          },

        },

        orderBy: {

          created_at: 'desc',

        },

      });



      return NextResponse.json({

        messages: messages.filter((message) => message.sender !== null && message.recipient !== null).map((message) => ({

          id: message.id,

          title: message.title,

          body: message.body,

          sender_id: message.sender_id,

          sender_name: message.sender.name,

          sender_role: message.sender_role,

          recipient_id: message.recipient_id,

          recipient_name: message.recipient.name,

          recipient_role: message.recipient_role,

          school_name: message.school_name || message.sender.school?.school_name || message.recipient.school?.school_name || 'FutureLink',

          is_edited: message.is_edited,

          edited_at: message.edited_at,

          created_at: message.created_at,

          updated_at: message.updated_at,

          direction: message.sender_id === session.user.id ? 'sent' : 'received',

        })),

      });

    } catch (error) {

      console.error('Error fetching messages:', error);

      return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });

    }

  },

  {

    roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'secretary', 'finance_admin'],

  }

);



export const POST = withAuth(

  async ({ req, session }) => {

    try {

      const body = await req.json();

      const validation = createMessageSchema.safeParse(body);



      if (!validation.success) {

        return NextResponse.json({ error: 'Invalid input.', details: validation.error.format() }, { status: 400 });

      }



      const sender = {

        id: session.user.id,

        role: session.user.role as Role,

        school_id: session.user.school_id,

      };



      const recipients = await getRecipientsForMessage(sender, validation.data.recipient_role as Role);



      if (recipients.length === 0) {

        return NextResponse.json({ error: 'No recipients found for this role.' }, { status: 404 });

      }



      const senderUser = await prisma.user.findUnique({

        where: { id: session.user.id },

        select: {

          name: true,

          school: {

            select: {

              school_name: true,

              sms_username: true,

            },

          },

        },

      });



      const createdMessages = await prisma.$transaction(

        recipients.map((recipient) =>

          prisma.appMessage.create({

            data: {

              school_id: recipient.school_id || sender.school_id,

              sender_id: sender.id,

              recipient_id: recipient.id,

              sender_role: sender.role,

              recipient_role: validation.data.recipient_role as Role,

              title: validation.data.title.trim(),

              body: validation.data.body.trim(),

              school_name:

                sender.role === 'super_admin'

                  ? 'FutureLink'

                  : senderUser?.school?.school_name || recipient.school?.school_name || 'School',

            },

          })

        )

      );



      await prisma.appNotification.createMany({

        data: recipients.map((recipient, index) => ({

          user_id: recipient.id,

          school_id: recipient.school_id || sender.school_id,

          message_id: createdMessages[index].id,

          title: validation.data.title.trim(),

          body: validation.data.body.trim(),

          source_role: sender.role,

          source_name: senderUser?.name || 'System',

          school_name:

            sender.role === 'super_admin'

              ? 'FutureLink'

              : senderUser?.school?.school_name || recipient.school?.school_name || 'School',

        })),

      });



      await sendPushToUsers(
        recipients.map((recipient) => recipient.id),
        {
          title: validation.data.title.trim() || 'New Message',
          body: validation.data.body.trim() || 'You have a new message.',
          url: `/dashboard/${validation.data.recipient_role}/messaging`,
        }
      );

      let smsSummary = { attempted: 0, sent: 0, failed: 0 };



      if (validation.data.delivery_mode === 'sms') {

        const schoolName =

          sender.role === 'super_admin'

            ? 'FutureLink'

            : senderUser?.school?.school_name || recipients[0]?.school?.school_name || 'School';



        const uniquePhones = [...new Set(recipients.map((recipient) => recipient.phone).filter(Boolean))];



        smsSummary.attempted = uniquePhones.length;



        const smsResults = await Promise.all(

          uniquePhones.map((phone) =>

            sendSMS({

              phone,

              message: `${schoolName}: ${validation.data.title.trim()} - ${validation.data.body.trim()}`,

              senderName: schoolName,

              smsUsername: senderUser?.school?.sms_username,

            }).catch((smsError) => {

              console.warn('[Messages] SMS failed:', smsError);

              return { success: false };

            })

          )

        );



        smsSummary.sent = smsResults.filter((result) => Boolean(result?.success)).length;

        smsSummary.failed = smsSummary.attempted - smsSummary.sent;

      }



      return NextResponse.json({

        success: true,

        count: createdMessages.length,

        delivery_mode: validation.data.delivery_mode,

        sms: smsSummary,

      });

    } catch (error: any) {

      console.error('Error sending message:', error);

      return NextResponse.json({ error: error?.message || 'Failed to send message.' }, { status: 500 });

    }

  },

  {

    roles: ['super_admin', 'school_admin', 'teacher', 'parent'],

  }

);

