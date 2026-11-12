import crypto from 'node:crypto';

// Format Date into Indian Standard Time (IST, UTC +5:30)
export function formatIST(dateInput?: Date | string | number | null): string {
  if (!dateInput) dateInput = new Date();
  let date: Date;
  if (dateInput instanceof Date) {
    date = isNaN(dateInput.getTime()) ? new Date() : dateInput;
  } else {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  }
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} IST`;
}

// Cryptographic SHA-256 hash
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// PBKDF2 Password Hashing (100,000 iterations of SHA-512 with cryptographically secure salt)
export function generateSalt(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  if (!password || !salt) return '';
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  const computed = hashPassword(password, salt);
  return safeCompare(computed, hash);
}

const KNOWN_INSECURE_PASSWORDS = new Set([
  'Karna@2026!Security',
  'Karna2026!Security',
  'your_secure_admin_password_here',
  'changeme',
  'password12345678'
]);

const KNOWN_INSECURE_HMAC_KEYS = new Set([
  'portfolio-security-hmac-seed-ck-2026',
  'your_secure_random_hmac_seed_key_replace_in_production'
]);

export function getHmacKeyError(env: NodeJS.ProcessEnv = process.env): string | null {
  const hmacKey = env.SECURITY_HMAC_KEY;
  if (!hmacKey || Buffer.byteLength(hmacKey, 'utf8') < 32) {
    return 'SECURITY_HMAC_KEY must be configured with at least 32 bytes before starting the security service.';
  }
  if (KNOWN_INSECURE_HMAC_KEYS.has(hmacKey.trim()) || /^(.)\1+$/.test(hmacKey.trim())) {
    return 'SECURITY_HMAC_KEY cannot use a placeholder, hardcoded, or trivial repeated value.';
  }
  return null;
}

export function getHmacSecret(env: NodeJS.ProcessEnv = process.env): string {
  const err = getHmacKeyError(env);
  if (err) {
    throw new Error(err);
  }
  return env.SECURITY_HMAC_KEY!;
}

export function validateSecuritySecrets(env: NodeJS.ProcessEnv = process.env): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const hmacErr = getHmacKeyError(env);
  if (hmacErr) {
    errors.push(hmacErr);
  }

  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim().length < 16) {
    errors.push('ADMIN_PASSWORD must be configured with at least 16 characters before starting the security service.');
  } else if (KNOWN_INSECURE_PASSWORDS.has(adminPassword.trim()) || /^(.)\1+$/.test(adminPassword.trim())) {
    errors.push('ADMIN_PASSWORD cannot use a source-controlled, placeholder, or trivial repeated credential.');
  }

  return { valid: errors.length === 0, errors };
}

export function assertSecuritySecrets(env: NodeJS.ProcessEnv = process.env): void {
  const check = validateSecuritySecrets(env);
  if (!check.valid) {
    throw new Error(check.errors.join(' '));
  }
}

export function generateSecureTokenHex(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// HMAC-SHA256 for OTP hashing and signature verification
export function hmacSha256(data: string, secret?: string): string {
  const resolvedSecret = secret ?? getHmacSecret();
  return crypto.createHmac('sha256', resolvedSecret).update(data).digest('hex');
}

// Cryptographically signed session tokens
export function signSessionToken(sessionId: string, userId: string, expiresAt: number): string {
  const payload = `${sessionId}.${userId}.${expiresAt}`;
  const sig = hmacSha256(payload, getHmacSecret());
  return `sess_${payload}.${sig}`;
}

export function verifySessionToken(token: string): { valid: boolean; sessionId?: string; userId?: string; expiresAt?: number } {
  if (!token || typeof token !== 'string') return { valid: false };
  if (!token.startsWith('sess_')) return { valid: false };
  const rest = token.substring(5);
  const parts = rest.split('.');
  if (parts.length !== 4) {
    return { valid: false };
  }
  const [sessionId, userId, expiresAtStr, sig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false };
  }
  const expectedSig = hmacSha256(`${sessionId}.${userId}.${expiresAtStr}`, getHmacSecret());
  if (!safeCompare(sig, expectedSig)) {
    return { valid: false };
  }
  return { valid: true, sessionId, userId, expiresAt };
}

// Timing-safe string comparison to prevent timing attacks
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Cryptographically secure numeric OTP (e.g. 6 digits)
export function generateSecureOTP(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits);
  const num = crypto.randomInt(min, max);
  return num.toString();
}

// Cryptographically secure random token (e.g. for Recruiter Private Access)
export function generateSecureRecruiterToken(): { rawToken: string; tokenPrefix: string; tokenHash: string } {
  const bytes = crypto.randomBytes(12);
  const hex = bytes.toString('hex').toUpperCase();
  // Format as REC-2026-XXXX-XXXX-XXXX
  const rawToken = `REC-2026-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
  const tokenPrefix = `REC-2026-${hex.slice(0, 4)}••••`;
  const tokenHash = sha256(rawToken);
  return { rawToken, tokenPrefix, tokenHash };
}

// Generate 10 Emergency Recovery Codes (e.g. 4 groups of 4 chars: A8B9-C2D3-E4F5-G6H7)
export function generateEmergencyRecoveryCodes(count = 10): { plaintextCodes: string[]; hashedCodes: { codeHash: string; used: boolean; usedAt: string | null }[] } {
  const plaintextCodes: string[] = [];
  const hashedCodes: { codeHash: string; used: boolean; usedAt: string | null }[] = [];

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 unambiguous charset (no 0, 1, I, O)
  for (let i = 0; i < count; i++) {
    const randomBytes = crypto.randomBytes(16);
    let codeStr = '';
    for (let b = 0; b < 16; b++) {
      codeStr += chars[randomBytes[b] % chars.length];
      if ((b + 1) % 4 === 0 && b < 15) {
        codeStr += '-';
      }
    }
    plaintextCodes.push(codeStr);
    hashedCodes.push({
      codeHash: sha256(codeStr),
      used: false,
      usedAt: null
    });
  }

  return { plaintextCodes, hashedCodes };
}

// ==========================================
// Standard RFC 6238 TOTP Engine
// ==========================================
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate base32 secret (160-bit / 32 base32 characters)
export function generateBase32Secret(length = 32): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

// Decode Base32 string to Buffer
function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Compute standard RFC 6238 TOTP for a specific time step
export function computeTOTP(secretBase32: string, timeMs: number = Date.now(), stepSeconds = 30): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(timeMs / 1000 / stepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

// Verify TOTP with clock drift window (+/- 1 step)
export function verifyTOTP(secretBase32: string, token: string, windowSteps = 1, stepSeconds = 30): boolean {
  if (!token || token.trim().length !== 6) return false;
  const sanitizedToken = token.trim();
  const now = Date.now();

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const checkTime = now + offset * stepSeconds * 1000;
    const expected = computeTOTP(secretBase32, checkTime, stepSeconds);
    if (safeCompare(expected, sanitizedToken)) {
      return true;
    }
  }
  return false;
}

// Generate OTPAuth URI for QR code generation
export function generateOTPAuthUri(secret: string, accountEmail: string, issuer = 'ChethanKumarPortfolio'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountEmail)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
