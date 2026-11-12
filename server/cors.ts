import type { IncomingMessage, ServerResponse } from 'node:http';

const PRODUCTION_APPROVED_ORIGINS = [
  'https://chethankumar.dev',
  'https://www.chethankumar.dev',
  'https://chethan-kumar-portfolio.vercel.app',
  'https://backend-api-production-c798.up.railway.app'
];

const DEV_LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

export function normalizeOrigin(rawOrigin: string | undefined | null): string | null {
  if (!rawOrigin || typeof rawOrigin !== 'string') return null;
  const trimmed = rawOrigin.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '*') return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return null;
  }
}

export function getApprovedCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configuredRaw = [env.CORS_ALLOWED_ORIGINS || '', env.CORS_ORIGIN || ''].join(',');
  const configured = configuredRaw
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter((value): value is string => Boolean(value));

  const isProd = env.NODE_ENV === 'production';
  const base = isProd
    ? [...PRODUCTION_APPROVED_ORIGINS, ...configured.filter((origin) => !origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1'))]
    : [...PRODUCTION_APPROVED_ORIGINS, ...DEV_LOCAL_ORIGINS, ...configured];

  return Array.from(new Set(base.map((origin) => origin.toLowerCase())));
}

export function isCorsOriginAllowed(origin: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return getApprovedCorsOrigins(env).includes(normalized);
}

/**
 * Applies strict credentialed CORS policy.
 * Returns false (and sends 403) if an unapproved Origin header is present,
 * or if an OPTIONS preflight was already answered (returns false? Wait: separate flag needed!).
 */
export function handleCorsAndPreflight(
  req: IncomingMessage,
  res: ServerResponse,
  env: NodeJS.ProcessEnv = process.env
): 'continue' | 'handled' {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  if (originHeader) {
    if (!isCorsOriginAllowed(originHeader, env)) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Origin not allowed' }));
      return 'handled';
    }

    const normalizedOrigin = normalizeOrigin(originHeader)!;
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return 'handled';
  }

  return 'continue';
}
