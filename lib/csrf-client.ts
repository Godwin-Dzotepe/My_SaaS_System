/**
 * Client-side CSRF helper.
 * Reads the csrf_token cookie (set by the server on login) and returns
 * the header object needed for fetch calls.
 *
 * Usage:
 *   import { csrfHeader } from '@/lib/csrf-client';
 *   await fetch('/api/...', { method: 'POST', headers: { ...csrfHeader() }, body: ... })
 */

export function csrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : '';
  return token ? { 'X-CSRF-Token': token } : {};
}
