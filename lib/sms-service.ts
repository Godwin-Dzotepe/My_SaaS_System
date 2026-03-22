/**
 * SMS Service - Handles SMS sending for OTP and notifications
 * 
 * SECURITY: SMS failures in OTP flow should return errors to prevent
 * account enumeration. Non-critical SMS (welcome messages) should not
 * break the main flow.
 * 
 * IMPORTANT: Add your SMS provider credentials to .env
 * Supported: Twilio, AWS SNS, or any HTTP-based SMS API
 */

interface SendSMSParams {
  phone: string;
  message: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generate a random OTP (6 digits)
 * Uses crypto-safe random number generation
 */
export function generateOTP(): string {
  // Use crypto-safe random numbers
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000) + 100000;
  return otp.toString();
}

/**
 * Hash OTP using bcrypt for secure storage
 * 
 * @param otp - Plain text OTP
 * @returns Hashed OTP
 */
export async function hashOTP(otp: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  // Use cost factor of 10 for good security/performance balance
  return bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hashed value
 * 
 * @param otp - Plain text OTP to verify
 * @param hashedOTP - Stored hashed OTP
 * @returns True if OTP matches
 */
export async function verifyOTP(otp: string, hashedOTP: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(otp, hashedOTP);
}

/**
 * Send SMS via configured provider
 * 
 * CRITICAL: For OTP SMS, failure should return error to the caller
 * so they can handle it appropriately (e.g., retry or show error).
 * 
 * @param params - Phone number and message
 * @returns SMS result with success status and messageId/error
 */
export async function sendSMS({ phone, message }: SendSMSParams): Promise<SMSResult> {
  try {
    // Validate phone number format
    if (!phone || phone.length < 10) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // OPTION 1: Twilio (uncomment and configure if using)
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    return {
      success: true,
      messageId: result.sid
    };
    */

    // OPTION 2: AWS SNS (uncomment and configure if using)
    /*
    const AWS = require('aws-sdk');
    const sns = new AWS.SNS({
      region: process.env.AWS_REGION
    });
    
    const params = {
      Message: message,
      PhoneNumber: phone
    };
    
    const result = await sns.publish(params).promise();
    
    return {
      success: true,
      messageId: result.MessageId
    };
    */

    // OPTION 3: HTTP-based SMS API (e.g., Nexmo, Africa's Talking)
    /*
    const response = await fetch('https://api.africaistalk.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'apikey': process.env.SMS_API_KEY!
      },
      body: new URLSearchParams({
        username: process.env.SMS_USERNAME!,
        recipients: phone,
        message: message
      })
    });

    const data = await response.json();
    
    if (data.SMSMessageData?.Recipients?.[0]?.statusCode === '0') {
      return {
        success: true,
        messageId: data.SMSMessageData.Recipients[0].messageId
      };
    }
    
    return {
      success: false,
      error: data.SMSMessageData?.Recipients?.[0]?.status || 'Failed to send SMS'
    };
    */

    // DEVELOPMENT MODE: Log to console instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [SMS SENT] Phone: ${phone}`);
      console.log(`📝 Message: ${message}`);
      return {
        success: true,
        messageId: `dev-${Date.now()}`
      };
    }

    // Production fallback - Return error for critical flows
    console.error('❌ SMS service not configured. Please set up an SMS provider.');
    return {
      success: false,
      error: 'SMS service not configured. Please contact support.'
    };

  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending SMS'
    };
  }
}

/**
 * Send OTP SMS to parent
 * 
 * CRITICAL: This should return error if SMS fails, as OTP is a critical
 * authentication flow. The caller should handle failures appropriately.
 * 
 * @param phone - Recipient phone number
 * @param otp - OTP to send
 * @returns SMS result
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResult> {
  const message = `Your School Management System login code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS({ phone, message });
}

/**
 * Send welcome SMS (non-critical)
 * 
 * This should NOT break the main flow if it fails - it's just a notification.
 * 
 * @param phone - Recipient phone number
 * @param schoolName - School name for personalization
 * @returns SMS result (caller should not throw on failure)
 */
export async function sendWelcomeSMS(phone: string, schoolName: string): Promise<SMSResult> {
  const message = `Welcome to ${schoolName} Parent Portal! Your account has been set up. Contact the school for login assistance.`;
  
  try {
    return await sendSMS({ phone, message });
  } catch (error) {
    // Log but don't throw - welcome SMS is not critical
    console.error('[SMS] Welcome SMS failed:', error);
    return { success: false, error: 'SMS send failed (non-critical)' };
  }
}

/**
 * Send password notification SMS (non-critical)
 * 
 * @param phone - Recipient phone number
 * @param schoolName - School name for personalization
 * @returns SMS result
 */
export async function sendPasswordSMS(phone: string, password: string, schoolName: string): Promise<SMSResult> {
  const message = `${schoolName}: Your login password is ${password}. Please change it after first login. Do not share this code.`;
  
  try {
    return await sendSMS({ phone, message });
  } catch (error) {
    console.error('[SMS] Password SMS failed:', error);
    return { success: false, error: 'SMS send failed (non-critical)' };
  }
}
