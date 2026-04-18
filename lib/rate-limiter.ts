/**
 * In-memory sliding window rate limiter
 * No Redis required — safe for single-instance Node.js (single-threaded event loop)
 */

import { NextRequest } from 'next/server';

interface WindowEntry {
  timestamps: number[];
}

// Global store — persists for the lifetime of the process
const store = new Map<string, WindowEntry>();
const MAX_KEYS = 10_000;

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.timestamps.length === 0 || now - entry.timestamps[entry.timestamps.length - 1] > 60 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

function evictOldest(): void {
  // Remove the first (oldest) entry to make room
  const firstKey = store.keys().next().value;
  if (firstKey) store.delete(firstKey);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/**
 * Check whether a request is within the rate limit.
 * @param key      - Unique identifier (e.g. `login:1.2.3.4`)
 * @param limit    - Max number of requests allowed in the window
 * @param windowMs - Window size in milliseconds
 */
export function check(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!store.has(key)) {
    if (store.size >= MAX_KEYS) evictOldest();
    store.set(key, { timestamps: [] });
  }

  const entry = store.get(key)!;

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Extract the client IP from a Next.js request.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '0.0.0.0';
}

// Preset limiter configs
export const LOGIN_LIMITER       = { limit: 10, windowMs: 15 * 60 * 1000 } as const;
export const REGISTER_LIMITER    = { limit: 5,  windowMs: 60 * 60 * 1000 } as const;
export const BOOK_DEMO_LIMITER   = { limit: 3,  windowMs: 60 * 60 * 1000 } as const;
export const OTP_REQUEST_LIMITER = { limit: 5,  windowMs: 10 * 60 * 1000 } as const;
