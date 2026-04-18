/**
 * Startup environment variable validation.
 * Call validateEnv() once at startup via instrumentation.ts.
 */

import { logger } from './logger';

interface EnvRule {
  key: string;
  required: boolean;
  validate?: (value: string) => string | null; // return error message or null if OK
}

const rules: EnvRule[] = [
  // Critical — will throw if missing/invalid
  {
    key: 'DATABASE_URL',
    required: true,
    validate: (v) => {
      if (!v.startsWith('mysql://') && !v.startsWith('mariadb://')) {
        return 'DATABASE_URL must start with mysql:// or mariadb://';
      }
      return null;
    },
  },
  {
    key: 'JWT_SECRET',
    required: true,
    validate: (v) => {
      if (v.length < 32) return 'JWT_SECRET must be at least 32 characters';
      return null;
    },
  },
  {
    key: 'TOTP_ENCRYPTION_KEY',
    required: true,
    validate: (v) => {
      if (v.length < 32) return 'TOTP_ENCRYPTION_KEY must be at least 32 characters';
      return null;
    },
  },

  // Optional — warn if missing
  { key: 'SMS_API_KEY',            required: false },
  { key: 'SMS_USERNAME',           required: false },
  { key: 'LEADS_NOTIFICATION_SMS', required: false },
  { key: 'AI_API_KEY',             required: false },
  { key: 'TELEGRAM_BOT_TOKEN',     required: false },
];

export function validateEnv(): void {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = process.env[rule.key];

    if (!value) {
      if (rule.required) {
        errors.push(`CRITICAL: ${rule.key} is not set`);
      } else {
        logger.warn(`[env] Optional env var not set: ${rule.key}`);
      }
      continue;
    }

    if (rule.validate) {
      const msg = rule.validate(value);
      if (msg) {
        if (rule.required) {
          errors.push(`CRITICAL: ${rule.key} — ${msg}`);
        } else {
          logger.warn(`[env] ${rule.key} — ${msg}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    const message = ['Environment validation failed:', ...errors.map(e => `  • ${e}`)].join('\n');
    logger.error(message);
    throw new Error(message);
  }

  logger.info('[env] Environment validation passed');
}
