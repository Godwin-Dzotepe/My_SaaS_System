import { sendSMS } from '@/lib/sms-service';
import { logger } from '@/lib/logger';

interface RegistrationRequestPayload {
  name: string;
  school: string;
  email: string;
  number: string;
  totalStudents: number;
}

interface BookDemoRequestPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  schoolName: string;
  schoolLocation: string;
  averageEnrollment: string;
  currentSystem?: string;
  currentSystemGaps?: string;
  mainChallenges?: string;
}

interface MultiChannelNotificationResult {
  success: boolean;
  error?: string;
}

const DEFAULT_LEADS_SMS_NUMBER = '+233240963964';

function buildRegistrationLines(payload: RegistrationRequestPayload): string[] {
  return [
    'New school registration request',
    `Name: ${payload.name}`,
    `School: ${payload.school}`,
    `Email: ${payload.email}`,
    `Number: ${payload.number}`,
    `Total students: ${payload.totalStudents}`,
    `Submitted at: ${new Date().toISOString()}`,
  ];
}

function buildBookDemoLines(payload: BookDemoRequestPayload): string[] {
  return [
    'New book demo request',
    `Full Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone Number: ${payload.phoneNumber}`,
    `School Name: ${payload.schoolName}`,
    `School Location: ${payload.schoolLocation}`,
    `Average Enrollment: ${payload.averageEnrollment}`,
    `Current System: ${payload.currentSystem?.trim() || 'N/A'}`,
    `Current System Limitations: ${payload.currentSystemGaps?.trim() || 'N/A'}`,
    `Main Challenges: ${payload.mainChallenges?.trim() || 'N/A'}`,
    `Submitted at: ${new Date().toISOString()}`,
  ];
}

async function sendLeadSms(
  lines: string[],
): Promise<MultiChannelNotificationResult> {
  const body = lines.join('\n');
  const notificationPhone = process.env.LEADS_NOTIFICATION_SMS || DEFAULT_LEADS_SMS_NUMBER;

  const smsResult = await sendSMS({ phone: notificationPhone, message: body });

  if (smsResult.success) return { success: true };

  logger.warn('[lead-notification] SMS failed', { error: smsResult.error });
  return { success: false, error: smsResult.error || 'SMS send failed.' };
}

export async function sendRegistrationLeadNotifications(
  payload: RegistrationRequestPayload
): Promise<MultiChannelNotificationResult> {
  return sendLeadSms(buildRegistrationLines(payload));
}

export async function sendBookDemoLeadNotifications(
  payload: BookDemoRequestPayload
): Promise<MultiChannelNotificationResult> {
  return sendLeadSms(buildBookDemoLines(payload));
}
