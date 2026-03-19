# SMS-Based OTP Login for Parents - Implementation Guide

## Overview
Parents can now log in using only their phone number. The system sends a One-Time Password (OTP) via SMS, which they use to authenticate. No password needed!

---

## 🔄 Login Flow

```
┌─────────────────────────────────────────────────────────┐
│                 Parent Tries to Login                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Screen 1: "Enter Your Phone Number"                    │
│  Input: +233501234567                                  │
│  Button: "Get Code"                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/auth/parent/request-otp               │
│  Body: { "phone": "+233501234567" }                    │
│                                                         │
│  System checks:                                         │
│  ✅ Phone exists in database                           │
│  ✅ Account has role: "parent"                         │
│  ✅ Generate 6-digit OTP                               │
│  ✅ Send via SMS (Twilio/AWS/HTTP API)                │
│  ✅ Store OTP with 10-min expiry                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  📱 SMS Received: "Your code is: 456789"              │
│     Valid for 10 minutes                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Screen 2: "Enter Code from SMS"                        │
│  Input: 456789                                          │
│  Button: "Login"                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  API: POST /api/auth/parent/verify-otp               │
│  Body: { "phone": "+233501234567", "otp": "456789" }  │
│                                                         │
│  System checks:                                         │
│  ✅ OTP matches database                               │
│  ✅ OTP not expired                                    │
│  ✅ Create JWT token                                   │
│  ✅ Clear OTP from database                            │
│  ✅ Return user data + children list                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ Login Successful                                    │
│  Parent can now access their children's info           │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 API Endpoints

### 1️⃣ Request OTP (Send SMS Code)

**Endpoint:** `POST /api/auth/parent/request-otp`

**Request:**
```json
{
  "phone": "+233501234567"
}
```

**Response (Success):**
```json
{
  "message": "OTP sent successfully",
  "otpSentTo": "+233501234567",
  "expiresIn": "10 minutes"
}
```

**Response (Error - Phone not found):**
```json
{
  "error": "Phone number not found or not registered as parent"
}
```

**What it does:**
- Checks if phone number exists in database
- Verifies account has role: "parent"
- Generates a random 6-digit OTP
- Stores OTP with 10-minute expiry
- Sends OTP via SMS

---

### 2️⃣ Verify OTP (Login)

**Endpoint:** `POST /api/auth/parent/verify-otp`

**Request:**
```json
{
  "phone": "+233501234567",
  "otp": "456789"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "name": "Jane Doe",
    "phone": "+233501234567",
    "email": "jane@example.com",
    "role": "parent",
    "schoolId": "school-uuid",
    "studentCount": 2,
    "students": [
      {
        "id": "student-1-uuid",
        "name": "John Doe",
        "className": "Class 4A",
        "studentNumber": "S001",
        "status": "active"
      },
      {
        "id": "student-2-uuid",
        "name": "Alice Doe",
        "className": "Class 2B",
        "studentNumber": "S002",
        "status": "active"
      }
    ]
  }
}
```

**Response (Error - Invalid OTP):**
```json
{
  "error": "Invalid OTP. Please try again."
}
```

**Response (Error - Expired OTP):**
```json
{
  "error": "OTP has expired. Please request a new one."
}
```

**What it does:**
- Finds parent by phone
- Verifies OTP is correct
- Checks OTP hasn't expired
- Clears OTP from database
- Creates JWT token (7-day expiry)
- Returns parent data + children list
- Sets HTTP-only auth cookie

---

## 🛠️ SMS Provider Setup

The system supports multiple SMS providers. Choose one and set up environment variables.

### Option 1: Twilio

**1. Install package:**
```bash
npm install twilio
```

**2. Set .env variables:**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**3. Uncomment in lib/sms-service.ts:**
```typescript
// Uncomment OPTION 1: Twilio section
```

---

### Option 2: AWS SNS

**1. Set .env variables:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

**2. Uncomment in lib/sms-service.ts:**
```typescript
// Uncomment OPTION 2: AWS SNS section
```

---

### Option 3: Africa's Talking / HTTP-based API

**1. Set .env variables:**
```
SMS_API_KEY=your_api_key
SMS_USERNAME=your_username
```

**2. Uncomment in lib/sms-service.ts:**
```typescript
// Uncomment OPTION 3: HTTP-based section
```

---

### Development Mode

If no SMS provider is configured, the system logs OTP to console:
```
📱 [SMS SENT] Phone: +233501234567
📝 Message: Your School Management System login code is: 456789. Valid for 10 minutes. Do not share this code.
```

---

## 🔐 Security Features

1. **OTP Expiry**: Codes valid for 10 minutes only
2. **One-time Use**: OTP cleared after successful verification
3. **JWT Token**: Secure token-based authentication
4. **HTTP-only Cookie**: Token stored securely on client
5. **No Password Exposure**: Parents don't share passwords
6. **Phone Validation**: Only registered parents can login

---

## 🗄️ Database Schema Changes

**Added to User model:**
```prisma
// OTP fields for SMS login
otp           String? // Temporary OTP for SMS login
otpExpiresAt  DateTime? // Expiry time for OTP
```

---

## 📱 Frontend Integration Example

### React Hook Example:

```typescript
// Step 1: Request OTP
const requestOTP = async (phone: string) => {
  const response = await fetch('/api/auth/parent/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });

  if (response.ok) {
    console.log('OTP sent! Check SMS');
    // Show OTP input screen
  } else {
    const error = await response.json();
    console.error(error.error);
  }
};

// Step 2: Verify OTP
const verifyOTP = async (phone: string, otp: string) => {
  const response = await fetch('/api/auth/parent/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to dashboard
  } else {
    const error = await response.json();
    console.error(error.error);
  }
};
```

---

## ⚡ Usage Example: Full Login Flow

```typescript
import { useState } from 'react';

export function ParentLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/parent/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      if (!res.ok) throw new Error(await res.text());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/parent/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      
      // Redirect to parent dashboard
      window.location.href = '/dashboard/parent';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <div>
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button onClick={handleRequestOTP} disabled={loading}>
          {loading ? 'Sending...' : 'Get Code'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={otp}
        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
        maxLength={6}
      />
      <button onClick={handleVerifyOTP} disabled={loading}>
        {loading ? 'Verifying...' : 'Login'}
      </button>
      <button onClick={() => setStep('phone')}>Back</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

---

## 🔄 Workflow Summary

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Parent enters phone | API checks if registered parent |
| 2 | System sends OTP | SMS delivered to parent |
| 3 | Parent enters OTP | API verifies code |
| 4 | Verification success | JWT token issued |
| 5 | Parent logged in | Access to children's info |

---

## ✅ Features Completed

- ✅ SMS OTP generation (6 digits)
- ✅ 10-minute code expiry
- ✅ Support for multiple SMS providers
- ✅ Phone number validation
- ✅ Parent role verification
- ✅ JWT token authentication
- ✅ HTTP-only secure cookies
- ✅ Development mode (console logging)
- ✅ Returns parent + children data
- ✅ Automatic OTP clearing after use

---

## 🚀 Next Steps

1. Choose an SMS provider and configure .env
2. Uncomment the corresponding SMS option in lib/sms-service.ts
3. Create frontend login UI similar to the React example
4. Test with a real phone number
5. Deploy to production

---

## 📞 Support

For SMS provider setup, check their documentation:
- **Twilio**: https://www.twilio.com/docs
- **AWS SNS**: https://docs.aws.amazon.com/sns/
- **Africa's Talking**: https://africastalking.com/

**Committed to:** `app/api/auth/parent/request-otp/route.ts` & `app/api/auth/parent/verify-otp/route.ts`
