import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma';
import { logger } from './logger';

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
 */
export function generateToken(payload: UserPayload): string {
  const secret = getJwtSecret();

  const tokenPayload = {
    userId: payload.userId,
    role: payload.role,
    schoolId: payload.schoolId,
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

/**
 * SHA-256 hash of the raw JWT string (internal use only — for blacklist lookups).
 */
export function createTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify and decode a JWT token.
 * Also checks the token blacklist (populated on logout).
 *
 * @returns Decoded payload, or null if invalid/blacklisted.
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    // Blacklist check
    const tokenHash = createTokenHash(token);
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token_hash: tokenHash },
      select: { id: true },
    });
    if (blacklisted) return null;

    return {
      userId:   decoded.userId,
      email:    decoded.email || '',
      role:     decoded.role,
      schoolId: decoded.schoolId,
      phone:    decoded.phone,
    };
  } catch (error) {
    logger.warn('[Auth] Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Generate a minimal JWT payload for OTP login
 */
export function generateOtpPayload(userId: string, role: string, schoolId: string): UserPayload {
  return {
    userId,
    email: '',
    role,
    schoolId,
  };
}
