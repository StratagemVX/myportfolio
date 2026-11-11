import crypto from 'node:crypto';

export interface VerifiedAuth0Claims {
  email: string;
  emailVerified: boolean;
  sub: string;
  iss: string;
  aud: string | string[];
}

export type Auth0VerifyResult =
  | { ok: true; claims: VerifiedAuth0Claims }
  | { ok: false; status: number; error: string };

export interface VerifyAuth0Options {
  domain?: string;
  clientId?: string;
  fetchJwks?: (jwksUri: string) => Promise<{ keys: Array<Record<string, any>> }>;
  nowMs?: number;
}

const jwksCache = new Map<string, { fetchedAt: number; keys: Array<Record<string, any>> }>();
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

function isPlaceholderConfig(value: string): boolean {
  const lower = value.toLowerCase();
  return !lower || lower.includes('your-tenant') || lower.includes('placeholder') || lower.includes('example');
}

function decodeBase64UrlJson<T = Record<string, any>>(segment: string): T | null {
  try {
    const raw = Buffer.from(segment, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

async function getJwksKeys(
  jwksUri: string,
  kid: string,
  customFetch?: VerifyAuth0Options['fetchJwks']
): Promise<Array<Record<string, any>>> {
  if (customFetch) {
    const data = await customFetch(jwksUri);
    return Array.isArray(data?.keys) ? data.keys : [];
  }

  const cached = jwksCache.get(jwksUri);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < JWKS_CACHE_TTL_MS && cached.keys.some((k) => k.kid === kid)) {
    return cached.keys;
  }

  const res = await fetch(jwksUri, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch Auth0 JWKS (${res.status}).`);
  }
  const json = (await res.json()) as { keys?: Array<Record<string, any>> };
  const keys = Array.isArray(json?.keys) ? json.keys : [];
  jwksCache.set(jwksUri, { fetchedAt: now, keys });
  return keys;
}

export async function verifyAuth0IdToken(
  idToken: string,
  options: VerifyAuth0Options = {}
): Promise<Auth0VerifyResult> {
  const rawDomain = (options.domain ?? process.env.AUTH0_DOMAIN ?? process.env.VITE_AUTH0_DOMAIN ?? '').trim();
  const clientId = (options.clientId ?? process.env.AUTH0_CLIENT_ID ?? process.env.VITE_AUTH0_CLIENT_ID ?? '').trim();

  if (isPlaceholderConfig(rawDomain) || isPlaceholderConfig(clientId)) {
    return { ok: false, status: 503, error: 'Auth0 server-side verification is not configured.' };
  }

  const normalizedDomain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!normalizedDomain || !/^[a-z0-9.-]+$/i.test(normalizedDomain)) {
    return { ok: false, status: 503, error: 'Configured Auth0 domain is invalid.' };
  }

  if (!idToken || typeof idToken !== 'string') {
    return { ok: false, status: 400, error: 'A signed Auth0 idToken is required.' };
  }

  const parts = idToken.split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) {
    return { ok: false, status: 401, error: 'Malformed Auth0 ID token.' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string; typ?: string }>(headerB64);
  const payload = decodeBase64UrlJson<Record<string, any>>(payloadB64);

  if (!header || !payload) {
    return { ok: false, status: 401, error: 'Unable to parse Auth0 ID token.' };
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    return { ok: false, status: 401, error: 'Unsupported Auth0 token signing algorithm or missing key ID.' };
  }

  const expectedIssuer = `https://${normalizedDomain}/`;
  if (payload.iss !== expectedIssuer) {
    return { ok: false, status: 401, error: 'Invalid Auth0 token issuer.' };
  }

  const audMatches =
    (typeof payload.aud === 'string' && payload.aud === clientId) ||
    (Array.isArray(payload.aud) && payload.aud.includes(clientId));
  if (!audMatches) {
    return { ok: false, status: 401, error: 'Invalid Auth0 token audience.' };
  }

  const nowSec = Math.floor((options.nowMs ?? Date.now()) / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    return { ok: false, status: 401, error: 'Auth0 ID token has expired.' };
  }
  if (typeof payload.iat === 'number' && payload.iat > nowSec + 300) {
    return { ok: false, status: 401, error: 'Auth0 ID token issue timestamp is invalid.' };
  }

  if (payload.email_verified !== true) {
    return { ok: false, status: 403, error: 'Verified email claim is required from Auth0.' };
  }

  if (typeof payload.email !== 'string' || !payload.email.trim() || typeof payload.sub !== 'string' || !payload.sub.trim()) {
    return { ok: false, status: 401, error: 'Auth0 ID token is missing required identity claims.' };
  }

  try {
    const jwksUri = `https://${normalizedDomain}/.well-known/jwks.json`;
    const keys = await getJwksKeys(jwksUri, header.kid, options.fetchJwks);
    const matchingKey = keys.find((k) => k.kid === header.kid && (!k.use || k.use === 'sig'));
    if (!matchingKey) {
      return { ok: false, status: 401, error: 'Matching Auth0 signing key was not found.' };
    }

    const publicKey = crypto.createPublicKey({
      key: matchingKey as JsonWebKey,
      format: 'jwk'
    });

    const isSignatureValid = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${headerB64}.${payloadB64}`, 'ascii'),
      publicKey,
      Buffer.from(signatureB64, 'base64url')
    );

    if (!isSignatureValid) {
      return { ok: false, status: 401, error: 'Invalid Auth0 ID token signature.' };
    }
  } catch {
    return { ok: false, status: 401, error: 'Failed to cryptographically verify Auth0 ID token.' };
  }

  return {
    ok: true,
    claims: {
      email: payload.email.trim().toLowerCase(),
      emailVerified: true,
      sub: payload.sub.trim(),
      iss: payload.iss,
      aud: payload.aud
    }
  };
}
