/**
 * SMS Service - Handles SMS sending for OTP and notifications
 * 
 * IMPORTANT: Add your SMS provider credentials to .env
 * Supported: Twilio, AWS SNS, or any HTTP-based SMS API
 */

interface SendSMSParams {
  phone: string;
  message: string;
}

/**
 * Generate a random OTP (6 digits)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via configured provider
 * 
 * MOCK IMPLEMENTATION - Replace with your actual SMS provider
 */
export async function sendSMS({ phone, message }: SendSMSParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
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

    // Production fallback
    console.error('❌ SMS service not configured. Please set up an SMS provider.');
    return {
      success: false,
      error: 'SMS service not configured'
    };

  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send OTP SMS to parent
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const message = `Your School Management System login code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS({ phone, message });
}
