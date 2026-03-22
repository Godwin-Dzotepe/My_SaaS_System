import jwt from 'jsonwebtoken';

/**
 * Authentication utilities
 * 
 * SECURITY: JWT_SECRET must be set in environment variables.
 * This throws an error if the secret is missing to prevent
 * using insecure fallback secrets in production.
 */

// Validate JWT_SECRET at startup - throw if missing
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable is not set. ' +
      'Authentication cannot function without a secure secret key.'
    );
  }
  
  if (secret.length < 32) {
    throw new Error(
      'CRITICAL: JWT_SECRET must be at least 32 characters for secure encryption.'
    );
  }
  
  return secret;
}

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  schoolId: string;
  phone?: string;
}

/**
 * Generate a JWT token with minimal, secure payload
 * 
 * @param payload - User data to encode in token
 * @returns Signed JWT token
 */
export function generateToken(payload: UserPayload): string {
  const secret = getJwtSecret();
  
  // Minimal payload - only include necessary claims
  const tokenPayload = {
    userId: payload.userId,
    role: payload.role,
    schoolId: payload.schoolId,
  };
  
  return jwt.sign(tokenPayload, secret, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as jwt.JwtPayload;
    
    return {
      userId: decoded.userId,
      email: decoded.email || '',
      role: decoded.role,
      schoolId: decoded.schoolId,
      phone: decoded.phone
    };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Generate a minimal JWT payload for OTP login
 * This is used specifically for parent OTP authentication
 * 
 * @param userId - User ID
 * @param role - User role
 * @param schoolId - School ID for multi-tenant scoping
 * @returns Minimal payload object
 */
export function generateOtpPayload(userId: string, role: string, schoolId: string): UserPayload {
  return {
    userId,
    email: '',
    role,
    schoolId,
  };
}
