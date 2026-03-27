/**
 * SMS Service - Handles SMS sending for OTP and notifications
 *
 * SECURITY: SMS failures in OTP flow should return errors to prevent
 * account enumeration. Non-critical SMS (welcome messages) should not
 * break the main flow.
 */

interface SendSMSParams {
  phone: string;
  message: string;
  senderName?: string | null;
  smsUsername?: string | null;
}

interface PasswordSMSParams {
  phone: string;
  password: string;
  schoolName: string;
  smsUsername?: string | null;
  parentName?: string | null;
  childName?: string | null;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function safeParseJson<T>(value: string): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function buildSmsProviderError(status: number, rawText: string, parsedBody: unknown): string {
  const data = parsedBody as
    | {
        errorMessage?: string;
        message?: string;
        SMSMessageData?: {
          Message?: string;
          Recipients?: Array<{ status?: string }>;
        };
      }
    | null;

  const providerMessage =
    data?.SMSMessageData?.Recipients?.[0]?.status ||
    data?.SMSMessageData?.Message ||
    data?.errorMessage ||
    data?.message ||
    rawText;

  if (providerMessage) {
    return `SMS provider returned ${status}: ${providerMessage}`;
  }

  return `SMS provider returned ${status}`;
}

async function sendViaHttpSmsProvider({
  apiKey,
  phone,
  message,
  senderId,
  endpoint,
}: {
  apiKey: string;
  phone: string;
  message: string;
  senderId?: string;
  endpoint: string;
}): Promise<SMSResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        api_key: apiKey,
        recipient: [phone],
        recipients: [phone],
        to: [phone],
        message,
        msg: message,
        sender: senderId,
        sender_id: senderId,
        from: senderId,
      }),
      signal: controller.signal,
    });

    const rawText = await response.text().catch(() => '');
    const data = safeParseJson<{
      errorMessage?: string;
      message?: string;
      SMSMessageData?: {
        Message?: string;
        Recipients?: Array<{
          statusCode?: string;
          status?: string;
          messageId?: string;
        }>;
      };
    }>(rawText);
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (response.ok && recipient?.statusCode === '0') {
      return {
        success: true,
        messageId: recipient.messageId,
      };
    }

    return {
      success: false,
      error: buildSmsProviderError(response.status, rawText, data),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'SMS provider timed out. Please try again.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'HTTP SMS provider failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizePhone(phone: string): string {
  return phone.trim().replace(/[\s\-().]/g, '');
}

function formatPhoneForProvider(phone: string): string {
  const sanitized = sanitizePhone(phone);
  const defaultCountryCode = (process.env.SMS_DEFAULT_COUNTRY_CODE || '').trim();

  if (sanitized.startsWith('+')) return sanitized;
  if (sanitized.startsWith('00')) return `+${sanitized.slice(2)}`;

  if (defaultCountryCode && /^0\d+$/.test(sanitized)) {
    return `${defaultCountryCode}${sanitized.slice(1)}`;
  }

  if (defaultCountryCode && /^\d+$/.test(sanitized)) {
    return `${defaultCountryCode}${sanitized}`;
  }

  return sanitized;
}

function formatSenderName(senderName?: string | null): string | undefined {
  const trimmed = senderName?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 11);
}

/**
 * Generate a random OTP (6 digits)
 * Uses crypto-safe random number generation
 */
export function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000) + 100000;
  return otp.toString();
}

export async function hashOTP(otp: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp: string, hashedOTP: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(otp, hashedOTP);
}

/**
 * Send SMS via configured provider.
 * Supports:
 * - Nmolify/MNotify HTTP API when SMS_API_KEY is present
 * - Development console fallback in development mode
 */
export async function sendSMS({ phone, message, senderName, smsUsername }: SendSMSParams): Promise<SMSResult> {
  try {
    const formattedPhone = formatPhoneForProvider(phone);
    const formattedSenderName = formatSenderName(senderName);
    // Force a single approved sender id for all schools to avoid provider 401
    // errors when school-level sender ids are not approved.
    const approvedSenderId = (process.env.SMS_USERNAME || 'FutureLink').trim();
    const hasApiKey = Boolean(process.env.SMS_API_KEY);
    const mnotifyEndpoint = (
      process.env.NMOLIFY_API_URL ||
      process.env.MNOTIFY_API_URL ||
      'https://api.mnotify.com/api/sms/quick'
    ).trim();

    if (!formattedPhone || formattedPhone.replace(/\D/g, '').length < 10) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    if (hasApiKey && approvedSenderId) {
      try {
        const primaryResult = await sendViaHttpSmsProvider({
          apiKey: process.env.SMS_API_KEY!,
          phone: formattedPhone,
          message,
          senderId: approvedSenderId,
          endpoint: mnotifyEndpoint,
        });

        if (primaryResult.success) {
          return primaryResult;
        }

        return primaryResult;
      } catch (httpSmsError) {
        console.error('[SMS] Nmolify/MNotify send failed:', httpSmsError);
        return {
          success: false,
          error: httpSmsError instanceof Error ? httpSmsError.message : 'Nmolify/MNotify SMS provider failed',
        };
      }
    }

    if (hasApiKey && !approvedSenderId) {
      return {
        success: false,
        error: 'SMS sender id is missing. Add SMS_USERNAME in env (recommended: FutureLink).',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS SENT] Phone: ${formattedPhone}`);
      if (formattedSenderName) {
        console.log(`[SMS SENDER] ${formattedSenderName}`);
      }
      console.log(`[SMS MESSAGE] ${message}`);
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    console.error('[SMS] SMS service not configured. Add Nmolify/MNotify SMS API credentials.');
    return {
      success: false,
      error: 'SMS service not configured. Add Nmolify/MNotify SMS provider credentials in the environment.',
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending SMS',
    };
  }
}

export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
  const message = `Your School Management System login code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS({ phone, message });
}

export async function sendWelcomeSMS(phone: string, schoolName: string): Promise<SMSResult> {
  const message = `Welcome to ${schoolName} Parent Portal! Your account has been set up. Contact the school for login assistance.`;

  try {
    return await sendSMS({ phone, message, senderName: schoolName });
  } catch (error) {
    console.error('[SMS] Welcome SMS failed:', error);
    return { success: false, error: 'SMS send failed (non-critical)' };
  }
}

export async function sendPasswordSMS({
  phone,
  password,
  schoolName,
  smsUsername,
  parentName,
  childName,
}: PasswordSMSParams): Promise<SMSResult> {
  const safeParentName = (parentName || 'Parent').trim();
  const safeChildName = (childName || 'your child').trim();
  const message = `Hello ${safeParentName}, your login password for your child ${safeChildName} at ${schoolName} is ${password}. Please change it after first login.`;

  try {
    return await sendSMS({ phone, message, senderName: schoolName, smsUsername });
  } catch (error) {
    console.error('[SMS] Password SMS failed:', error);
    return { success: false, error: 'SMS send failed (non-critical)' };
  }
}
