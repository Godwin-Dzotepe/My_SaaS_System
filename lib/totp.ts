/**
 * TOTP (RFC 6238) implementation using Node.js built-in `crypto`.
 * No external packages required.
 */

import crypto from 'crypto';

// Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(input: string): Buffer {
  const str = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(str[i]);
    if (idx === -1) throw new Error(`Invalid base32 character: ${str[i]}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Generate a new TOTP secret (20 random bytes → base32 string).
 */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Generate an otpauth:// URI for QR code display.
 */
export function generateTotpUri(secret: string, accountName: string, issuer = 'FutureLink'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
}

/**
 * Verify a 6-digit TOTP token.
 * windowSize = 1 allows ±30s clock drift.
 */
export function verifyTotp(token: string, secret: string, windowSize = 1): boolean {
  if (!/^\d{6}$/.test(token)) return false;

  const secretBytes = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);

  for (let w = -windowSize; w <= windowSize; w++) {
    const expected = generateHotp(secretBytes, counter + w);
    if (expected === token) return true;
  }

  return false;
}

function generateHotp(secretBytes: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  // Write counter as big-endian 8-byte integer
  const high = Math.floor(counter / 0x100000000);
  const low  = counter >>> 0;
  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(low,  4);

  const hmac = crypto.createHmac('sha1', secretBytes);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset]     & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) <<  8) |
     (hash[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, '0');
}

// ── AES-256-GCM encryption for stored TOTP secrets ──────────────────────────

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must be at least 32 characters');
  }
  // Use first 32 bytes (256 bits)
  return Buffer.from(key.slice(0, 32), 'utf8');
}

/**
 * Encrypt a TOTP secret for storage.
 * Returns base64(iv[12] + authTag[16] + ciphertext).
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv  = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt a stored TOTP secret.
 */
export function decryptSecret(ciphertext: string): string {
  const key  = getEncryptionKey();
  const data = Buffer.from(ciphertext, 'base64');

  const iv        = data.subarray(0, 12);
  const authTag   = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
