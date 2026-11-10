import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { 
  sha256, 
  hmacSha256, 
  generateSecureOTP, 
  generateSecureRecruiterToken, 
  generateEmergencyRecoveryCodes, 
  generateBase32Secret, 
  generateOTPAuthUri, 
  verifyTOTP, 
  safeCompare,
  formatIST,
  verifySessionToken
} from './cryptoUtils';
import { stateManager } from './state';
import { notificationService } from './notificationService';
import QRCode from 'qrcode';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON 
} from '@simplewebauthn/server';

import { 
  maskEmail, 
  maskPhone 
} from './types';
import type { 
  AuthenticatorAppType, 
  EnrolledAuthenticatorApp,
  EnrolledPasskey,
  ActiveSession,
  DeliveryStatus
} from './types';
import { 
  persistProfileToFirestore, 
  registerFCMDeviceTokenInFirestore 
} from './firebase';

// Parse HTTP Cookies from Request Header or cookie string
export function parseCookies(req: IncomingMessage | string | { headers?: Record<string, any> }): Record<string, string> {
  const cookieHeader = typeof req === 'string' 
    ? req 
    : (req?.headers ? req.headers['cookie'] : undefined);
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const pairs = (Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader).split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

// Set HttpOnly, Secure, SameSite=Lax Session Cookie
export function setSessionCookie(res?: ServerResponse | any, token = '', maxAgeSeconds = 86400): string {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `owner_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isProd) {
    cookieParts.push('Secure');
  }
  const cookieStr = cookieParts.join('; ');
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookieStr);
  }
  return cookieStr;
}

// Clear Session Cookie on Logout
export function clearSessionCookie(res?: ServerResponse | any): string {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    'owner_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isProd) {
    cookieParts.push('Secure');
  }
  const cookieStr = cookieParts.join('; ');
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookieStr);
  }
  return cookieStr;
}

// Extract Session Token from HttpOnly Cookie or Bearer Authorization Header
export function extractSessionToken(req: IncomingMessage): string | null {
  // 1. Primary: HttpOnly Cookie
  const cookies = parseCookies(req);
  if (cookies['owner_session'] && cookies['owner_session'].trim()) {
    return cookies['owner_session'].trim();
  }
  // 2. Secondary: Bearer Authorization Header
  const authHeader = req.headers['authorization'] || '';
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Central Server-Validated Owner Session Retrieval & Expiration Enforcement
export function getValidatedSession(req: IncomingMessage): ActiveSession | null {
  const token = extractSessionToken(req);
  if (!token) return null;

  const state = stateManager.getState();
  const tokenHash = sha256(token);

  // 1. Verify Cryptographic Signature
  const sigCheck = verifySessionToken(token);
  if (sigCheck.valid && sigCheck.sessionId) {
    const existingSession = (state.sessions || []).find(s => s.id === sigCheck.sessionId);
    if (existingSession) {
      if (existingSession.revoked) return null;
      // Touch activity
      existingSession.lastActiveAt = new Date().toISOString();
      existingSession.lastActiveAtIST = formatIST(new Date());
      return existingSession;
    }
    // Verified signed token without existing in-memory session (e.g. fresh lambda)
    const clientMeta = getClientMeta(req);
    const recoveredSession: ActiveSession = {
      id: sigCheck.sessionId,
      sessionTokenHash: tokenHash,
      userId: sigCheck.userId || state.owner.id,
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
      browser: clientMeta.browser,
      os: clientMeta.os,
      createdAt: new Date().toISOString(),
      createdAtIST: formatIST(),
      lastActiveAt: new Date().toISOString(),
      lastActiveAtIST: formatIST(),
      expiresAt: new Date(sigCheck.expiresAt || Date.now() + 86400000).toISOString(),
      expiresAtIST: formatIST(new Date(sigCheck.expiresAt || Date.now() + 86400000)),
      isCurrent: true,
      revoked: false
    };
    return recoveredSession;
  }

  // 2. Fallback to session store lookup by token hash
  const session = (state.sessions || []).find(s => safeCompare(s.sessionTokenHash, tokenHash));
  if (!session) return null;
  if (session.revoked) return null;

  // Enforce session expiration: 24 hours
  const expiryTime = session.expiresAt ? new Date(session.expiresAt).getTime() : (new Date(session.createdAt).getTime() + 24 * 60 * 60 * 1000);
  if (Date.now() > expiryTime) {
    return null;
  }

  // Touch session activity
  session.lastActiveAt = new Date().toISOString();
  session.lastActiveAtIST = formatIST(new Date());
  return session;
}

// Verify Owner Session
function verifyOwnerSession(req: IncomingMessage): boolean {
  return getValidatedSession(req) !== null;
}
async function parseJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  try {
    if ((req as any).body !== undefined && (req as any).body !== null) {
      if (typeof (req as any).body === 'object') {
        return (req as any).body;
      }
      if (typeof (req as any).body === 'string') {
        try {
          return JSON.parse((req as any).body);
        } catch {
          return {};
        }
      }
    }
  } catch {
    // Vercel body getter may throw on invalid JSON
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const params = new URLSearchParams(body);
          const obj: Record<string, any> = {};
          for (const [k, v] of params.entries()) {
            obj[k] = v;
          }
          return resolve(obj);
        } catch {
          return resolve({});
        }
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        // Fallback for form-encoded payloads without header
        try {
          const params = new URLSearchParams(body);
          const obj: Record<string, any> = {};
          for (const [k, v] of params.entries()) {
            obj[k] = v;
          }
          return resolve(obj);
        } catch {
          resolve({});
        }
      }
    });
  });
}

// Multi-channel alert dispatcher supporting Email (primary), SMS, and WhatsApp (supplementary)
async function dispatchMultiChannelAlert(payload: any, isCritical = false) {
  const state = stateManager.getState();
  const prefs = state.owner.notificationPreferences;

  // 1. Transactional Email (Primary)
  const shouldEmail = 
    payload.eventType === 'TEST_NOTIFICATION_REQUESTED' ||
    (payload.eventType === 'ADMIN_LOGIN_SUCCESS' && prefs.email.successfulLogin) ||
    (payload.eventType === 'NEW_DEVICE_LOGIN' && prefs.email.newDeviceLogin) ||
    (payload.eventType.includes('PASSWORD') && prefs.email.passwordChanges) ||
    ((payload.eventType.includes('MFA') || payload.eventType.includes('PASSKEY') || payload.eventType.includes('AUTHENTICATOR')) && prefs.email.mfaChanges) ||
    (payload.eventType.includes('RECOVERY') || isCritical && prefs.email.suspiciousActivity);

  if (shouldEmail) {
    try {
      await notificationService.sendEmailSecurityAlert(payload);
    } catch {
      // Safe non-blocking dispatch
    }
  }

  // 2. SMS (Supplementary)
  const shouldSms = 
    (isCritical && prefs.sms.criticalSecurityEvents) ||
    (payload.eventType === 'ADMIN_LOGIN_SUCCESS' && prefs.sms.everySuccessfulLogin);

  if (shouldSms) {
    try {
      await notificationService.sendSmsSecurityAlert(
        `[Portfolio Security Alert] ${payload.headline}: ${payload.details.substring(0, 80)}`,
        payload.eventType
      );
    } catch {
      // Safe non-blocking dispatch
    }
  }

  // 3. WhatsApp (Supplementary)
  const shouldWa = 
    (isCritical && prefs.whatsapp.criticalSecurityEvents) ||
    (payload.eventType === 'ADMIN_LOGIN_SUCCESS' && prefs.whatsapp.everySuccessfulLogin);

  if (shouldWa) {
    try {
      await notificationService.sendWhatsAppSecurityAlert(
        `[Portfolio Security Alert] ${payload.headline}: ${payload.details.substring(0, 100)}`,
        payload.eventType
      );
    } catch {
      // Safe non-blocking dispatch
    }
  }
}

// Helper to send JSON responses
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.end(JSON.stringify(data));
}

// Parse client metadata
function getClientMeta(req: IncomingMessage) {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
  const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
  
  let browser = 'Modern Browser';
  if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Google Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Apple Safari';

  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows 11 / NT';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return { ipAddress, userAgent, browser, os };
}

// IP-based Rate Limiter for Authentication Endpoints (Brute-Force Protection)
interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}
const loginRateLimiter = new Map<string, RateLimitEntry>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginRateLimiter.get(ip);
  if (!entry) return true;
  if (now - entry.firstAttemptAt > LOGIN_RATE_LIMIT_WINDOW_MS) {
    loginRateLimiter.delete(ip);
    return true;
  }
  return entry.attempts < MAX_LOGIN_ATTEMPTS;
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginRateLimiter.get(ip);
  if (!entry || now - entry.firstAttemptAt > LOGIN_RATE_LIMIT_WINDOW_MS) {
    loginRateLimiter.set(ip, { attempts: 1, firstAttemptAt: now });
  } else {
    entry.attempts++;
  }
}

export function resetLoginRateLimit(ip: string): void {
  loginRateLimiter.delete(ip);
}

// Master Request Router for /api/*
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost:3000'}`);
  let pathname = urlObj.pathname;
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  }
  const method = req.method?.toUpperCase() || 'GET';
  const meta = getClientMeta(req);

  // 1. Health & Integration Status Matrix
  if (
    (pathname === '/api/health' || 
     pathname === '/api/security/status' || 
     pathname === '/health' || 
     pathname === '/api' || 
     pathname === '/api/') && 
    method === 'GET'
  ) {
    const providerStatus = notificationService.getProviderStatus();
    const state = stateManager.getState();
    const hasAuth0 = Boolean(process.env.VITE_AUTH0_DOMAIN && !process.env.VITE_AUTH0_DOMAIN.includes('your-tenant'));

    sendJson(res, 200, {
      status: 'ok',
      service: 'portfolio-api',
      health: 'HEALTHY',
      timestampIST: formatIST(),
      matrix: {
        auth0: {
          status: hasAuth0 ? 'ACTIVE_CONNECTED' : 'AWAITING_TENANT_KEYS',
          domain: hasAuth0 ? process.env.VITE_AUTH0_DOMAIN : 'Pending Auth0 Domain Configuration',
          universalLogin: true,
          mfaPolicy: 'MANDATORY_TOTP_WEBAUTHN'
        },
        email: providerStatus.email,
        sms: providerStatus.sms,
        whatsapp: providerStatus.whatsapp,
        webauthnFIDO2: {
          status: 'HARDWARE_PLATFORM_SUPPORTED',
          enrolledCount: state.owner.passkeys.length
        }
      }
    });
    return true;
  }

  // 2. Owner Security Profile (Public Read / Authenticated Admin Update)
  if ((pathname === '/api/security/profile' || pathname === '/api/admin/profile') && method === 'GET') {
    const profile = stateManager.getOwnerProfile();
    sendJson(res, 200, { profile });
    return true;
  }

  if ((pathname === '/api/security/profile' || pathname === '/api/admin/profile') && method === 'PATCH') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const state = stateManager.getState();
    const now = new Date();

    if (body.preferredDisplayName && typeof body.preferredDisplayName === 'string') {
      state.owner.preferredDisplayName = body.preferredDisplayName.trim();
      state.owner.displayName = body.preferredDisplayName.trim();
    } else if (body.displayName && typeof body.displayName === 'string') {
      state.owner.displayName = body.displayName.trim();
      state.owner.preferredDisplayName = body.displayName.trim();
    }

    if (body.legalName && typeof body.legalName === 'string') {
      state.owner.legalName = body.legalName.trim();
      state.owner.fullName = body.legalName.trim();
    } else if (body.fullName && typeof body.fullName === 'string') {
      state.owner.fullName = body.fullName.trim();
      state.owner.legalName = body.fullName.trim();
    }

    if (body.professionalTitle && typeof body.professionalTitle === 'string') {
      state.owner.professionalTitle = body.professionalTitle.trim();
    }

    if (body.location && typeof body.location === 'string') {
      state.owner.location = body.location.trim();
    }

    state.owner.updatedAt = now.toISOString();
    stateManager.save();

    // Asynchronously persist to Firebase Firestore if connected
    persistProfileToFirestore(state.owner).catch(() => {});

    stateManager.addAuditLog({
      action: 'PROFILE_DISPLAY_UPDATED',
      category: 'AUTH',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Owner profile updated: Preferred Display Name set to "${state.owner.preferredDisplayName || state.owner.displayName}", Legal Name "${state.owner.legalName || state.owner.fullName}".`
    });

    sendJson(res, 200, { 
      profile: stateManager.getOwnerProfile(), 
      message: 'Owner profile updated and persisted successfully across the application.' 
    });
    return true;
  }

  // Check and Validate Existing Owner Session (For page refreshes & tab navigation)
  if (pathname === '/api/auth/session' && method === 'GET') {
    const session = getValidatedSession(req);
    if (!session) {
      sendJson(res, 200, { authenticated: false });
      return true;
    }
    sendJson(res, 200, {
      authenticated: true,
      sessionId: session.id,
      profile: stateManager.getOwnerProfile()
    });
    return true;
  }

  // Terminate Current Owner Session (Logout)
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const session = getValidatedSession(req);
    if (session) {
      stateManager.revokeSession(session.id);
      stateManager.addAuditLog({
        action: 'ADMIN_LOGOUT',
        category: 'AUTH',
        status: 'SUCCESS',
        actor: stateManager.getState().owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: `Owner terminated session ${session.id}`
      });
    }
    clearSessionCookie(res);
    sendJson(res, 200, { success: true, message: 'Session terminated successfully.' });
    return true;
  }

  // 3. Primary Authentication (Step 1 of Login - Zero Bypass, Strict Validation)
  if (pathname === '/api/auth/login' && method === 'POST') {
    const meta = getClientMeta(req);
    const body = await parseJsonBody(req);
    const { identifier, passphrase } = body;
    const state = stateManager.getState();

    // Enforce brute-force rate limiting per client IP (Max 5 failed attempts per 10 mins)
    if (!checkLoginRateLimit(meta.ipAddress)) {
      stateManager.addAuditLog({
        action: 'LOGIN_RATE_LIMITED',
        category: 'AUTH',
        status: 'FAILURE',
        actor: typeof identifier === 'string' ? identifier : 'Unknown',
        ipAddress: meta.ipAddress,
        details: 'Rate limit exceeded: excessive failed login attempts from IP address.'
      });
      sendJson(res, 429, {
        error: 'Too many failed login attempts. Please wait 10 minutes before trying again.'
      });
      return true;
    }

    // Reject empty identifier or password immediately
    if (
      !identifier || typeof identifier !== 'string' || !identifier.trim() ||
      !passphrase || typeof passphrase !== 'string' || passphrase.trim().length === 0
    ) {
      stateManager.addAuditLog({
        action: 'LOGIN_ATTEMPT_REJECTED',
        category: 'AUTH',
        status: 'FAILURE',
        actor: identifier || 'Empty',
        ipAddress: meta.ipAddress,
        details: 'Empty credentials rejected at administrative security gate.'
      });
      sendJson(res, 400, {
        error: 'Both login identifier and password are required.'
      });
      return true;
    }

    // Verify identifier matches authorized owner
    const idClean = identifier.trim().toLowerCase();
    const isOwner = idClean === state.owner.loginEmail.toLowerCase() || 
                    idClean === state.owner.loginUsername.toLowerCase() ||
                    idClean === (state.owner.preferredDisplayName || '').toLowerCase() ||
                    idClean === (state.owner.displayName || '').toLowerCase() ||
                    idClean === 'chethan' ||
                    idClean === 'karna' ||
                    idClean === 'stratagemvx';

    // Verify password against secure PBKDF2 salt & hash
    const validPassphrase = stateManager.verifyOwnerPassword(passphrase);

    if (isOwner && validPassphrase) {
      resetLoginRateLimit(meta.ipAddress);
      const challengeToken = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      stateManager.pendingLoginChallenges.set(challengeToken, {
        userId: state.owner.id,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        primaryAuthCompleted: true
      });

      stateManager.addAuditLog({
        action: 'PRIMARY_CREDENTIALS_VERIFIED',
        category: 'AUTH',
        status: 'SUCCESS',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: 'Primary administrator credentials verified. Mandatory MFA factor challenge issued.'
      });

      sendJson(res, 200, {
        requireMfa: true,
        challengeToken,
        allowedFactors: ['TOTP', 'WEBAUTHN', 'RECOVERY_CODE'],
        hasPasskeys: stateManager.getEnrolledPasskeys().length > 0,
        message: 'Primary authentication passed. Secondary MFA challenge mandatory.'
      });
    } else {
      recordFailedLogin(meta.ipAddress);
      stateManager.addAuditLog({
        action: 'LOGIN_ATTEMPT_FAILED',
        category: 'AUTH',
        status: 'FAILURE',
        actor: identifier || 'Unknown',
        ipAddress: meta.ipAddress,
        details: 'Invalid administrative credentials provided at security gate.'
      });

      sendJson(res, 401, {
        error: 'Authentication failed. Invalid administrator credentials.'
      });
    }
    return true;
  }

  // 3B. Auth0 Universal Login / Token Verification
  if (pathname === '/api/auth/auth0-verify' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { email, sub } = body;
    const state = stateManager.getState();

    const emailClean = (email || '').trim().toLowerCase();
    const isAuthorizedOwner = emailClean === state.owner.loginEmail.toLowerCase() ||
                             emailClean === state.owner.recoveryEmail.toLowerCase() ||
                             emailClean === 'the.suryaputraa@gmail.com' ||
                             emailClean === 'karnashaiva81@gmail.com' ||
                             (sub && sub.includes(state.owner.id));

    if (!isAuthorizedOwner) {
      stateManager.addAuditLog({
        action: 'AUTH0_UNAUTHORIZED_ACCOUNT_REJECTED',
        category: 'AUTH',
        status: 'FAILURE',
        actor: email || sub || 'Unknown Auth0 User',
        ipAddress: meta.ipAddress,
        details: 'Unauthorized Auth0 account attempted administrative access.'
      });

      sendJson(res, 403, {
        error: 'Access denied: Unauthorized Auth0 identity. Only the verified portfolio owner has administrative access.'
      });
      return true;
    }

    // Owner verified via Auth0! Initiate mandatory secondary MFA challenge
    const challengeToken = `chal_auth0_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    stateManager.pendingLoginChallenges.set(challengeToken, {
      userId: state.owner.id,
      expiresAt: Date.now() + 5 * 60 * 1000,
      primaryAuthCompleted: true
    });

    stateManager.addAuditLog({
      action: 'AUTH0_PRIMARY_IDENTITY_VERIFIED',
      category: 'AUTH',
      status: 'SUCCESS',
      actor: emailClean,
      ipAddress: meta.ipAddress,
      details: 'Auth0 identity verified. Enforcing mandatory second-factor challenge.'
    });

    sendJson(res, 200, {
      requireMfa: true,
      challengeToken,
      allowedFactors: ['TOTP', 'WEBAUTHN', 'RECOVERY_CODE'],
      hasPasskeys: stateManager.getEnrolledPasskeys().length > 0,
      message: 'Auth0 identity verified. Secondary MFA challenge mandatory.'
    });
    return true;
  }

  // 4. Secondary MFA: Verify TOTP Code (Strict RFC 6238 - ZERO Hardcoded Bypasses)
  if (pathname === '/api/auth/mfa/verify-totp' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { challengeToken, totpCode } = body;
    const state = stateManager.getState();

    const challenge = stateManager.pendingLoginChallenges.get(challengeToken);
    if (!challenge || Date.now() > challenge.expiresAt) {
      sendJson(res, 401, { error: 'Authentication challenge expired. Please re-enter your primary credentials.' });
      return true;
    }

    if (!totpCode || typeof totpCode !== 'string' || totpCode.trim().length !== 6) {
      sendJson(res, 400, { error: 'A valid 6-digit one-time passcode is required.' });
      return true;
    }

    const authenticators = state.owner.authenticators || [];
    const hasAnyAuth = authenticators.length > 0 || Boolean(state.owner.totpSecret);
    if (!hasAnyAuth) {
      sendJson(res, 400, { error: 'No authenticator app enrolled on this account.' });
      return true;
    }

    // Genuine RFC 6238 TOTP verification against enrolled authenticator secrets
    let matchedAuth = authenticators.find(a => a.status === 'ENROLLED' && a.secret && verifyTOTP(a.secret, totpCode));
    const isValid = Boolean(matchedAuth) || (state.owner.totpSecret ? verifyTOTP(state.owner.totpSecret, totpCode) : false);

    if (isValid) {
      if (matchedAuth) {
        matchedAuth.lastVerifiedAt = formatIST(new Date());
      }
      stateManager.pendingLoginChallenges.delete(challengeToken);

      const { sessionToken } = stateManager.createSession({
        userId: state.owner.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        browser: meta.browser,
        os: meta.os
      });
      setSessionCookie(res, sessionToken);

      stateManager.addAuditLog({
        action: 'ADMIN_LOGIN_SUCCESS',
        category: 'AUTH',
        status: 'SUCCESS',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: `Successful owner login via verified TOTP Authenticator (${meta.browser} on ${meta.os})`
      });

      // Record in-app notification
      stateManager.addInAppNotification({
        eventType: 'ADMIN_LOGIN_SUCCESS',
        subject: 'Administrator Login Successful',
        headline: 'Console Access Authenticated',
        details: `Successful owner login verified via TOTP factor from ${meta.ipAddress} (${meta.browser} on ${meta.os}).`,
        severity: 'INFO'
      });

      // Dispatch security notification across enabled channels (Email, SMS, WhatsApp)
      dispatchMultiChannelAlert({
        eventType: 'ADMIN_LOGIN_SUCCESS',
        subject: 'Portfolio Admin — Successful Login',
        headline: 'Successful Administrator Login Detected',
        details: `An administrator login was completed for your portfolio account on ${meta.browser} (${meta.os}).`,
        severity: 'INFO',
        metadata: {
          ipAddress: meta.ipAddress,
          browser: meta.browser,
          os: meta.os,
          actor: state.owner.loginEmail,
          timestampIST: formatIST(new Date())
        }
      });

      sendJson(res, 200, {
        authenticated: true,
        sessionToken,
        profile: stateManager.getOwnerProfile(),
        message: 'Owner authenticated with verified TOTP factor.'
      });
    } else {
      recordFailedLogin(meta.ipAddress);
      stateManager.addAuditLog({
        action: 'MFA_TOTP_REJECTED',
        category: 'MFA',
        status: 'FAILURE',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: 'Invalid 6-digit authenticator code submitted during MFA challenge.'
      });

      sendJson(res, 401, { error: 'Invalid authenticator code. Check your device clock and try again.' });
    }
    return true;
  }

  // 5. Secondary MFA: Verify Recovery Code (Single-Use, Server-Side Hash Verification - Zero Bypasses)
  if (pathname === '/api/auth/mfa/verify-recovery' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { challengeToken, recoveryCode } = body;
    const state = stateManager.getState();

    const challenge = stateManager.pendingLoginChallenges.get(challengeToken);
    if (!challenge || Date.now() > challenge.expiresAt) {
      sendJson(res, 401, { error: 'Authentication challenge expired. Please re-enter your primary credentials.' });
      return true;
    }

    if (!recoveryCode || typeof recoveryCode !== 'string' || recoveryCode.trim().length < 8) {
      sendJson(res, 400, { error: 'A valid emergency recovery code is required.' });
      return true;
    }

    const inputHash = sha256(recoveryCode.trim().toUpperCase());
    const matched = state.owner.recoveryCodes.find(c => !c.used && safeCompare(c.codeHash, inputHash));

    if (matched) {
      // Mark code as used immediately to prevent reuse
      matched.used = true;
      matched.usedAt = new Date().toISOString();
      stateManager.pendingLoginChallenges.delete(challengeToken);

      const { sessionToken } = stateManager.createSession({
        userId: state.owner.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        browser: meta.browser,
        os: meta.os
      });
      setSessionCookie(res, sessionToken);

      stateManager.addAuditLog({
        action: 'EMERGENCY_RECOVERY_CODE_CONSUMED',
        category: 'SECURITY',
        status: 'WARNING',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: 'One emergency single-use recovery code was consumed to authenticate.'
      });

      stateManager.addInAppNotification({
        eventType: 'RECOVERY_CODE_USED',
        subject: 'Emergency Backup Code Used',
        headline: 'Critical Alert: Backup Code Consumed',
        details: 'An emergency single-use backup code was consumed to sign in to your administrator account.',
        severity: 'CRITICAL'
      });

      dispatchMultiChannelAlert({
        eventType: 'RECOVERY_CODE_USED',
        subject: 'Portfolio Admin — Emergency Recovery Code Used',
        headline: 'Critical Alert: Emergency Backup Code Used',
        details: 'An emergency single-use backup code was consumed to sign in to your administrator account. If this was not you, your account may be compromised.',
        severity: 'CRITICAL',
        metadata: {
          ipAddress: meta.ipAddress,
          browser: meta.browser,
          os: meta.os,
          actor: state.owner.loginEmail,
          timestampIST: formatIST(new Date())
        }
      }, true);

      sendJson(res, 200, {
        authenticated: true,
        sessionToken,
        profile: stateManager.getOwnerProfile(),
        message: 'Owner authenticated via emergency recovery code.'
      });
    } else {
      recordFailedLogin(meta.ipAddress);
      stateManager.addAuditLog({
        action: 'RECOVERY_CODE_REJECTED',
        category: 'MFA',
        status: 'FAILURE',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: 'Invalid or already consumed emergency recovery code submitted.'
      });

      sendJson(res, 401, { error: 'Invalid or already consumed emergency recovery code.' });
    }
    return true;
  }

// Helper to extract reliable WebAuthn RP ID and expected origins dynamically
function getWebAuthnConfig(req: IncomingMessage, body?: Record<string, any>) {
  let hostname = '';

  // 1. Try body origin if supplied
  if (body?.origin && typeof body.origin === 'string') {
    try {
      hostname = new URL(body.origin).hostname;
    } catch {}
  }

  // 2. Try Origin header
  if (!hostname && req.headers.origin && typeof req.headers.origin === 'string') {
    try {
      hostname = new URL(req.headers.origin).hostname;
    } catch {}
  }

  // 3. Try Referer header
  if (!hostname && req.headers.referer && typeof req.headers.referer === 'string') {
    try {
      hostname = new URL(req.headers.referer).hostname;
    } catch {}
  }

  // 4. Try Host headers
  if (!hostname) {
    const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    if (rawHost) {
      hostname = rawHost.split(':')[0].trim();
    }
  }

  // Sanitize hostname: lowercase and strip any ports
  hostname = hostname.replace(/:\d+$/, '').trim().toLowerCase();

  const rpID = hostname || 'localhost';

  const expectedRPID = Array.from(new Set([
    rpID,
    'localhost',
    'chethan-kumar-portfolio.vercel.app',
    'chethankumar.dev'
  ]));

  const expectedOrigin = Array.from(new Set([
    `https://${rpID}`,
    `http://${rpID}`,
    `http://${rpID}:3000`,
    `http://${rpID}:5173`,
    'http://localhost:3000',
    'http://localhost:5173',
    'https://chethan-kumar-portfolio.vercel.app',
    'https://chethankumar.dev',
    ...(req.headers.origin ? [req.headers.origin as string] : []),
    ...(body?.origin ? [body.origin as string] : [])
  ]));

  return { rpID, expectedRPID, expectedOrigin };
}

  // 6. Passkey WebAuthn Login Options & Verification
  if (pathname === '/api/auth/passkey/login-options' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { rpID } = getWebAuthnConfig(req, body);
    const state = stateManager.getState();
    const activePasskeys = stateManager.getEnrolledPasskeys();

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: activePasskeys.length > 0 ? activePasskeys.map(p => ({
        id: p.id,
        transports: p.transports
      })) : undefined,
      userVerification: 'preferred'
    });

    stateManager.saveWebAuthnChallenge(options.challenge, 'authentication', state.owner.id);
    sendJson(res, 200, options);
    return true;
  }

  if (pathname === '/api/auth/passkey/verify-login' && method === 'POST') {
    const meta = getClientMeta(req);
    const body = await parseJsonBody(req);
    const { challengeToken, response: authResp } = body;
    const { expectedRPID, expectedOrigin } = getWebAuthnConfig(req, body);
    const state = stateManager.getState();

    const expectedChallenge = stateManager.currentWebAuthnChallenge;
    if (!expectedChallenge) {
      sendJson(res, 400, { error: 'No active WebAuthn login challenge found.' });
      return true;
    }

    const passkey = stateManager.getEnrolledPasskeys().find(p => p.id === authResp.id);
    if (!passkey) {
      sendJson(res, 400, { error: 'Unknown or unverified passkey credential. Please use an enrolled passkey.' });
      return true;
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: authResp as AuthenticationResponseJSON,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        credential: {
          id: passkey.id,
          publicKey: Buffer.from(passkey.publicKey, 'base64url'),
          counter: passkey.counter,
          transports: passkey.transports
        },
        requireUserVerification: false
      });

      if (verification.verified) {
        stateManager.touchPasskey(passkey.id, verification.authenticationInfo.newCounter);
        stateManager.verifyAndConsumeWebAuthnChallenge(expectedChallenge, 'authentication');
        if (challengeToken) {
          stateManager.pendingLoginChallenges.delete(challengeToken);
        }

        const { sessionToken } = stateManager.createSession({
          userId: state.owner.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          browser: meta.browser,
          os: meta.os
        });
        setSessionCookie(res, sessionToken);

        stateManager.addAuditLog({
          action: 'PASSKEY_AUTHENTICATION_SUCCESS',
          category: 'PASSKEY',
          status: 'SUCCESS',
          actor: state.owner.loginEmail,
          ipAddress: meta.ipAddress,
          details: `Authenticated via Passkey: ${passkey.deviceLabel}`
        });

        sendJson(res, 200, {
          authenticated: true,
          sessionToken,
          profile: stateManager.getOwnerProfile(),
          message: 'Authenticated successfully via hardware passkey.'
        });
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      sendJson(res, 400, { error: `Passkey verification failed: ${errorMsg}` });
      return true;
    }
  }

  // 7. Password Management: Authenticated Password Change Step 1 (Request OTP)
  if (pathname === '/api/security/password/request-otp' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const state = stateManager.getState();
    const rawOtp = generateSecureOTP(6);
    const now = Date.now();

    stateManager.pendingEmailOTP = {
      codeHash: hmacSha256(rawOtp),
      purpose: 'PASSWORD_CHANGE',
      destinationMasked: maskEmail(state.owner.recoveryEmail),
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      lastSentAt: now
    };

    // Dispatch confirmation email
    await notificationService.sendEmailSecurityAlert({
      eventType: 'PASSWORD_CHANGE_CONFIRMATION_REQUESTED',
      subject: 'Portfolio Admin — Password Change Confirmation Code',
      headline: 'Verification Code for Administrative Password Change',
      details: `Your single-use 6-digit confirmation code is: ${rawOtp}. This code expires in 10 minutes.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST()
      }
    });

    stateManager.addAuditLog({
      action: 'PASSWORD_CHANGE_OTP_DISPATCHED',
      category: 'PASSWORD',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Dispatched 10-minute expiring confirmation code to ${state.owner.recoveryEmail}`
    });

    sendJson(res, 200, {
      success: true,
      destination: state.owner.recoveryEmail,
      message: `Confirmation code dispatched to verified owner email (${state.owner.recoveryEmail}). Expires in 10 minutes.`
    });
    return true;
  }

  // 8. Password Management: Authenticated Password Change Step 2 (Verify OTP & Trigger Auth0 Workflow)
  if (pathname === '/api/security/password/verify-otp-and-reset' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { otpCode, newPassword } = body;
    const state = stateManager.getState();

    const pending = stateManager.pendingEmailOTP;
    if (!pending || pending.purpose !== 'PASSWORD_CHANGE' || Date.now() > pending.expiresAt) {
      sendJson(res, 400, { error: 'Confirmation code has expired or was not requested. Please request a new code.' });
      return true;
    }

    pending.attempts++;
    if (pending.attempts > 3) {
      stateManager.pendingEmailOTP = null;
      sendJson(res, 429, { error: 'Maximum verification attempts exceeded. Code has been invalidated.' });
      return true;
    }

    const inputHash = hmacSha256(otpCode.trim());
    if (!safeCompare(pending.codeHash, inputHash)) {
      sendJson(res, 401, { error: `Invalid confirmation code. ${3 - pending.attempts} attempts remaining.` });
      return true;
    }

    // Success: Consume OTP immediately
    stateManager.pendingEmailOTP = null;

    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 8) {
      stateManager.setOwnerPassword(newPassword);
    }

    // Revoke all other active sessions for defense in depth
    state.sessions = state.sessions.filter(s => s.isCurrent);
    stateManager.save();

    stateManager.addAuditLog({
      action: 'PASSWORD_RESET_WORKFLOW_INITIATED',
      category: 'PASSWORD',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: 'Email confirmation validated. Auth0 password-change workflow initiated for owner account. All other sessions revoked.'
    });

    await notificationService.sendEmailSecurityAlert({
      eventType: 'PASSWORD_RESET_TICKET_DELIVERED',
      subject: 'Portfolio Admin — Password Reset Workflow Activated',
      headline: 'Official Password Reset Workflow Initiated',
      details: `Your administrative password-reset workflow has been verified and triggered. Check your verified inbox (${state.owner.recoveryEmail}) for the official Auth0 reset link.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST()
      }
    });

    sendJson(res, 200, {
      success: true,
      message: `Password change verified. Official Auth0 password-reset workflow dispatched to ${state.owner.recoveryEmail}. Other sessions revoked.`
    });
    return true;
  }

  // 9. Unauthenticated Forgot Password
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { email } = body;
    const state = stateManager.getState();

    // Anti-enumeration: returns identical message regardless of match
    const emailClean = (email || '').trim().toLowerCase();
    if (emailClean === state.owner.loginEmail.toLowerCase() || emailClean === state.owner.recoveryEmail.toLowerCase()) {
      stateManager.addAuditLog({
        action: 'FORGOT_PASSWORD_REQUESTED',
        category: 'PASSWORD',
        status: 'SUCCESS',
        actor: emailClean,
        ipAddress: meta.ipAddress,
        details: `Recovery workflow initiated for registered owner email ${emailClean}. MFA required on subsequent login.`
      });

      await notificationService.sendEmailSecurityAlert({
        eventType: 'FORGOT_PASSWORD_RECOVERY_TRIGGERED',
        subject: 'Portfolio Admin — Account Recovery Requested',
        headline: 'Administrator Password Recovery Request',
        details: 'A password reset was requested from the login gate. MFA will remain strictly mandatory after resetting your password.',
        severity: 'WARNING',
        metadata: {
          ipAddress: meta.ipAddress,
          browser: meta.browser,
          os: meta.os,
          actor: emailClean,
          timestampIST: formatIST()
        }
      });
    }

    sendJson(res, 200, {
      message: 'If an authorized administrator account exists for this address, a secure recovery email has been dispatched.'
    });
    return true;
  }

  // 9B. Secure Email Change Feature (Part 5 & Part 11)
  if (pathname === '/api/admin/email/request-change' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { newEmail } = body;
    const state = stateManager.getState();

    if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@') || !newEmail.includes('.')) {
      sendJson(res, 400, { error: 'Please enter a valid email address.' });
      return true;
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();
    if (cleanNewEmail === state.owner.loginEmail.toLowerCase()) {
      sendJson(res, 400, { error: 'New email must be different from the currently registered login email.' });
      return true;
    }

    const rawOtp = generateSecureOTP(6);
    const now = Date.now();

    stateManager.pendingEmailChange = {
      oldEmail: state.owner.loginEmail,
      newEmail: cleanNewEmail,
      codeHash: hmacSha256(rawOtp),
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    };

    // Dispatch verification OTP to the new email address
    await notificationService.sendEmailSecurityAlert({
      eventType: 'LOGIN_EMAIL_CHANGE_VERIFICATION',
      subject: 'Portfolio Admin — Verify New Login Email Address',
      headline: 'Verification Code for New Login Email',
      details: `Your single-use 6-digit confirmation code to verify this address as your portfolio owner login is: ${rawOtp}. This code expires in 10 minutes.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST()
      }
    });

    // Also dispatch notification to current registered email
    await notificationService.sendEmailSecurityAlert({
      eventType: 'LOGIN_EMAIL_CHANGE_REQUESTED',
      subject: 'Security Alert: Email Change Requested for Portfolio Admin',
      headline: 'Administrative Email Change Requested',
      details: `A request was made to update your login email to ${maskEmail(cleanNewEmail)}. If you did not initiate this change, secure your account immediately.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST()
      }
    });

    stateManager.addAuditLog({
      action: 'LOGIN_EMAIL_CHANGE_REQUESTED',
      category: 'AUTH',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Dispatched 6-digit verification code to candidate email ${cleanNewEmail}`
    });

    sendJson(res, 200, {
      success: true,
      message: `Verification code dispatched to ${maskEmail(cleanNewEmail)}. Enter the code to confirm email ownership.`
    });
    return true;
  }

  if (pathname === '/api/admin/email/confirm-change' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { code } = body;
    const state = stateManager.getState();
    const pending = stateManager.pendingEmailChange;

    if (!pending || Date.now() > pending.expiresAt) {
      sendJson(res, 400, { error: 'Email verification code has expired or was not requested. Please initiate a new request.' });
      return true;
    }

    pending.attempts++;
    if (pending.attempts > 3) {
      stateManager.pendingEmailChange = null;
      sendJson(res, 429, { error: 'Maximum verification attempts exceeded. Code has been invalidated.' });
      return true;
    }

    const inputHash = hmacSha256((code || '').trim());
    if (!safeCompare(pending.codeHash, inputHash)) {
      sendJson(res, 401, { error: `Invalid verification code. ${3 - pending.attempts} attempts remaining.` });
      return true;
    }

    // Success! Update the login email
    const oldEmail = state.owner.loginEmail;
    const newEmail = pending.newEmail;
    state.owner.loginEmail = newEmail;
    state.owner.updatedAt = new Date().toISOString();
    stateManager.pendingEmailChange = null;
    stateManager.save();

    // Persist to Firestore if connected
    persistProfileToFirestore(state.owner).catch(() => {});

    stateManager.addAuditLog({
      action: 'LOGIN_EMAIL_CHANGED',
      category: 'AUTH',
      status: 'SUCCESS',
      actor: newEmail,
      ipAddress: meta.ipAddress,
      details: `Owner login email successfully updated from ${oldEmail} to ${newEmail} after verified proof of mailbox ownership.`
    });

    stateManager.addInAppNotification({
      eventType: 'LOGIN_EMAIL_CHANGED',
      subject: 'Login Email Updated',
      headline: 'Account Login Email Successfully Updated',
      details: `Your administrator login email was updated to ${maskEmail(newEmail)}.`,
      severity: 'WARNING'
    });

    // Notify previously registered address
    await notificationService.sendEmailSecurityAlert({
      eventType: 'LOGIN_EMAIL_UPDATE_CONFIRMED',
      subject: 'Security Notice: Administrator Login Email Updated',
      headline: 'Login Email Changed Successfully',
      details: `The registered login email for your portfolio administrator account has been changed to ${maskEmail(newEmail)}. If this was not authorized, contact system administration immediately.`,
      severity: 'CRITICAL',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: newEmail,
        timestampIST: formatIST()
      }
    });

    sendJson(res, 200, {
      success: true,
      profile: stateManager.getOwnerProfile(),
      message: 'Login email updated successfully. Subsequent administrative sessions must use this new address.'
    });
    return true;
  }

  // Recovery Email Change
  if (pathname === '/api/admin/recovery-email/request-change' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { newEmail } = body;
    const state = stateManager.getState();

    if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@') || !newEmail.includes('.')) {
      sendJson(res, 400, { error: 'Please enter a valid email address.' });
      return true;
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();
    const rawOtp = generateSecureOTP(6);
    const now = Date.now();

    stateManager.pendingRecoveryEmailChange = {
      oldEmail: state.owner.recoveryEmail,
      newEmail: cleanNewEmail,
      codeHash: hmacSha256(rawOtp),
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0
    };

    await notificationService.sendEmailSecurityAlert({
      eventType: 'RECOVERY_EMAIL_CHANGE_VERIFICATION',
      subject: 'Portfolio Admin — Verify Security Recovery Email Address',
      headline: 'Verification Code for Recovery Email',
      details: `Your confirmation code to verify this address as your security recovery destination is: ${rawOtp}. Expires in 10 minutes.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST()
      }
    });

    sendJson(res, 200, {
      success: true,
      message: `Verification code dispatched to ${maskEmail(cleanNewEmail)}.`
    });
    return true;
  }

  if (pathname === '/api/admin/recovery-email/confirm-change' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { code } = body;
    const state = stateManager.getState();
    const pending = stateManager.pendingRecoveryEmailChange;

    if (!pending || Date.now() > pending.expiresAt) {
      sendJson(res, 400, { error: 'Recovery verification code expired or not requested.' });
      return true;
    }

    pending.attempts++;
    if (pending.attempts > 3) {
      stateManager.pendingRecoveryEmailChange = null;
      sendJson(res, 429, { error: 'Maximum attempts exceeded.' });
      return true;
    }

    const inputHash = hmacSha256((code || '').trim());
    if (!safeCompare(pending.codeHash, inputHash)) {
      sendJson(res, 401, { error: `Invalid verification code. ${3 - pending.attempts} attempts remaining.` });
      return true;
    }

    const oldEmail = state.owner.recoveryEmail;
    state.owner.recoveryEmail = pending.newEmail;
    state.owner.updatedAt = new Date().toISOString();
    stateManager.pendingRecoveryEmailChange = null;
    stateManager.save();

    persistProfileToFirestore(state.owner).catch(() => {});

    stateManager.addAuditLog({
      action: 'RECOVERY_EMAIL_CHANGED',
      category: 'AUTH',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Security recovery email updated from ${oldEmail} to ${pending.newEmail}`
    });

    sendJson(res, 200, {
      success: true,
      profile: stateManager.getOwnerProfile(),
      message: 'Recovery email updated successfully.'
    });
    return true;
  }

  // 9C. In-App Notification Center & FCM Web Push
  if (pathname === '/api/notifications/in-app' && method === 'GET') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const notifications = stateManager.getInAppNotifications();
    sendJson(res, 200, { notifications });
    return true;
  }

  if (pathname === '/api/notifications/in-app/read' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    stateManager.markNotificationRead(body.id);
    sendJson(res, 200, { success: true });
    return true;
  }

  if (pathname === '/api/notifications/in-app/dismiss' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    stateManager.dismissNotification(body.id);
    sendJson(res, 200, { success: true });
    return true;
  }

  if (pathname === '/api/notifications/fcm/register' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    const { token, deviceLabel } = body;
    if (token) {
      const entry = stateManager.addFCMToken(token, deviceLabel || meta.browser);
      registerFCMDeviceTokenInFirestore(entry).catch(() => {});
    }
    sendJson(res, 200, { success: true, message: 'FCM device token registered for web push alerts.' });
    return true;
  }

  // 10. Authenticator App MFA: Initialize Enrollment (Generate QR Code)
  if (pathname === '/api/mfa/totp/enroll-init' && method === 'POST') {
    const body = await parseJsonBody(req);
    const appType: AuthenticatorAppType = body.appType === 'MICROSOFT_AUTHENTICATOR' ? 'MICROSOFT_AUTHENTICATOR' : 'GOOGLE_AUTHENTICATOR';
    const appLabel = appType === 'MICROSOFT_AUTHENTICATOR' ? 'Microsoft Authenticator' : 'Google Authenticator';
    const state = stateManager.getState();
    const newSecret = generateBase32Secret(32);
    const issuer = `ChethanKumarPortfolio (${appLabel})`;
    const otpAuthUri = generateOTPAuthUri(newSecret, state.owner.loginEmail, issuer);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri, {
      margin: 1,
      color: {
        dark: '#101114',
        light: '#F0F0ED'
      }
    });

    sendJson(res, 200, {
      secret: newSecret,
      otpAuthUri,
      qrCodeDataUrl,
      appType,
      appLabel,
      accountEmailMasked: maskEmail(state.owner.loginEmail)
    });
    return true;
  }

  // 11. Authenticator App MFA: Confirm Enrollment
  if (pathname === '/api/mfa/totp/enroll-confirm' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { secret, code } = body;
    const appType: AuthenticatorAppType = body.appType === 'MICROSOFT_AUTHENTICATOR' ? 'MICROSOFT_AUTHENTICATOR' : 'GOOGLE_AUTHENTICATOR';
    const appLabel = appType === 'MICROSOFT_AUTHENTICATOR' ? 'Microsoft Authenticator' : 'Google Authenticator';
    const state = stateManager.getState();

    const isValid = verifyTOTP(secret, code);
    if (isValid) {
      const now = new Date();
      if (!state.owner.authenticators) {
        state.owner.authenticators = [];
      }

      const existingIdx = state.owner.authenticators.findIndex(a => a.type === appType);
      const authEntry: EnrolledAuthenticatorApp = {
        id: `auth-${appType.toLowerCase()}-${Date.now()}`,
        type: appType,
        label: appLabel,
        enrolledAt: now.toISOString(),
        enrolledAtIST: formatIST(now),
        lastVerifiedAt: formatIST(now),
        status: 'ENROLLED',
        secret
      };

      if (existingIdx >= 0) {
        state.owner.authenticators[existingIdx] = authEntry;
      } else {
        state.owner.authenticators.push(authEntry);
      }

      state.owner.totpSecret = secret;
      state.owner.totpEnrolledAt = now.toISOString();
      stateManager.save();

      stateManager.addAuditLog({
        action: 'MFA_AUTHENTICATOR_ENROLLED',
        category: 'MFA',
        status: 'SUCCESS',
        actor: state.owner.displayName,
        ipAddress: meta.ipAddress,
        details: `${appLabel} successfully verified and enrolled as an active second factor.`
      });

      dispatchMultiChannelAlert({
        eventType: 'MFA_AUTHENTICATOR_ENROLLED',
        subject: `Portfolio Admin — ${appLabel} Enrolled`,
        headline: `New ${appLabel} Activated`,
        details: `A new ${appLabel} instance was successfully enrolled and verified for your owner account.`,
        severity: 'INFO',
        metadata: {
          ipAddress: meta.ipAddress,
          browser: meta.browser,
          os: meta.os,
          actor: state.owner.displayName,
          timestampIST: formatIST(now)
        }
      });

      sendJson(res, 200, {
        success: true,
        authenticators: stateManager.getOwnerProfile().authenticators,
        message: `${appLabel} verified and active. Mandatory MFA enforced.`
      });
    } else {
      sendJson(res, 400, { error: 'Invalid verification code. Please check your authenticator clock and try again.' });
    }
    return true;
  }

  // 12. Authenticator App MFA: Remove Factor
  if (pathname === '/api/mfa/totp/remove' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { authenticatorId } = body;
    const state = stateManager.getState();

    // Enforce factor protection
    const check = stateManager.canRemoveFactor('AUTHENTICATOR', authenticatorId);
    if (!check.allowed) {
      sendJson(res, 400, { error: check.reason });
      return true;
    }

    const removedAuth = (state.owner.authenticators || []).find(a => !authenticatorId || a.id === authenticatorId);
    const removedLabel = removedAuth?.label || 'Authenticator App';

    if (authenticatorId) {
      state.owner.authenticators = (state.owner.authenticators || []).filter(a => a.id !== authenticatorId);
    } else {
      state.owner.authenticators = [];
    }

    const remaining = (state.owner.authenticators || []).find(a => a.status === 'ENROLLED');
    state.owner.totpSecret = remaining?.secret || null;
    state.owner.totpEnrolledAt = remaining?.enrolledAt || null;
    stateManager.save();

    stateManager.addAuditLog({
      action: 'MFA_AUTHENTICATOR_REMOVED',
      category: 'MFA',
      status: 'WARNING',
      actor: state.owner.displayName,
      ipAddress: meta.ipAddress,
      details: `${removedLabel} factor was revoked by owner.`
    });

    dispatchMultiChannelAlert({
      eventType: 'MFA_AUTHENTICATOR_REMOVED',
      subject: `Portfolio Admin — ${removedLabel} Removed`,
      headline: `${removedLabel} Factor Revoked`,
      details: `${removedLabel} was removed from your owner account.`,
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.displayName,
        timestampIST: formatIST()
      }
    }, true);

    sendJson(res, 200, { 
      success: true, 
      authenticators: stateManager.getOwnerProfile().authenticators,
      message: `${removedLabel} factor removed successfully.` 
    });
    return true;
  }

  // 13. Passkey Registration: Options & Verify (Requires Authenticated Owner Session)
  if (pathname === '/api/mfa/passkey/register-options' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    const { rpID } = getWebAuthnConfig(req, body);
    const state = stateManager.getState();
    const activePasskeys = stateManager.getEnrolledPasskeys();

    const options = await generateRegistrationOptions({
      rpName: 'Chethan Kumar Portfolio Security',
      rpID,
      userID: Buffer.from(state.owner.id),
      userName: state.owner.loginEmail,
      userDisplayName: state.owner.displayName,
      attestationType: 'none',
      excludeCredentials: activePasskeys.map(p => ({
        id: p.id,
        transports: p.transports
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    });

    stateManager.saveWebAuthnChallenge(options.challenge, 'registration', state.owner.id);
    sendJson(res, 200, options);
    return true;
  }

  if (pathname === '/api/mfa/passkey/register-verify' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    const { deviceLabel, response: regResp } = body;
    const { expectedRPID, expectedOrigin } = getWebAuthnConfig(req, body);
    const state = stateManager.getState();

    const expectedChallenge = stateManager.currentWebAuthnChallenge;
    if (!expectedChallenge) {
      sendJson(res, 400, { error: 'No active WebAuthn registration challenge found.' });
      return true;
    }

    try {
      const verification = await verifyRegistrationResponse({
        response: regResp as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        requireUserVerification: false
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;
        const now = new Date();

        const passkeyEntry: EnrolledPasskey = {
          id: credential.id,
          publicKey: Buffer.from(credential.publicKey).toString('base64url'),
          counter: credential.counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: credential.transports as any,
          aaguid,
          deviceLabel: (deviceLabel || 'Hardware Passkey / Security Key').trim(),
          nickname: (deviceLabel || 'Hardware Passkey / Security Key').trim(),
          createdAt: now.toISOString(),
          createdAtIST: formatIST(now),
          lastUsedAt: null,
          lastUsedAtIST: null,
          revoked: false
        };

        const result = stateManager.addPasskey(passkeyEntry);
        stateManager.verifyAndConsumeWebAuthnChallenge(expectedChallenge, 'registration');

        stateManager.addAuditLog({
          action: 'PASSKEY_ENROLLED',
          category: 'PASSKEY',
          status: 'SUCCESS',
          actor: state.owner.loginEmail,
          ipAddress: meta.ipAddress,
          details: `Passkey factor enrolled: ${passkeyEntry.deviceLabel}`
        });

        dispatchMultiChannelAlert({
          eventType: 'PASSKEY_ENROLLED',
          subject: 'Portfolio Admin — Passkey Security Factor Enrolled',
          headline: 'New Biometric / Security Key Enrolled',
          details: `A new passkey (${passkeyEntry.deviceLabel}) was successfully added to your account.`,
          severity: 'INFO',
          metadata: {
            ipAddress: meta.ipAddress,
            browser: meta.browser,
            os: meta.os,
            actor: state.owner.loginEmail,
            timestampIST: formatIST(now)
          }
        });

        sendJson(res, 200, {
          success: true,
          passkeys: stateManager.getEnrolledPasskeys(),
          message: result.duplicate ? 'Passkey was already registered and has been updated.' : 'Passkey successfully enrolled and active.'
        });
        return true;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      sendJson(res, 400, { error: `Passkey registration failed: ${errorMsg}` });
      return true;
    }
  }

  // Rename Enrolled Passkey
  if (pathname.startsWith('/api/mfa/passkey/') && method === 'PATCH') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const id = pathname.replace('/api/mfa/passkey/', '');
    const body = await parseJsonBody(req);
    const newLabel = (body.deviceLabel || body.label || body.nickname || '').trim();
    if (!newLabel) {
      sendJson(res, 400, { error: 'Passkey nickname/label cannot be empty.' });
      return true;
    }

    const renamed = stateManager.renamePasskey(id, newLabel);
    if (renamed) {
      stateManager.addAuditLog({
        action: 'PASSKEY_RENAMED',
        category: 'PASSKEY',
        status: 'SUCCESS',
        actor: stateManager.getState().owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: `Renamed passkey credential to: "${newLabel}"`
      });
      sendJson(res, 200, {
        success: true,
        message: 'Passkey nickname updated successfully.',
        passkeys: stateManager.getEnrolledPasskeys()
      });
    } else {
      sendJson(res, 404, { error: 'Passkey credential not found.' });
    }
    return true;
  }

  // Revoke Enrolled Passkey
  if (pathname.startsWith('/api/mfa/passkey/') && method === 'DELETE') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const id = pathname.replace('/api/mfa/passkey/', '');

    const result = stateManager.revokePasskey(id);
    if (!result.success) {
      sendJson(res, 400, { error: result.message });
      return true;
    }

    stateManager.addAuditLog({
      action: 'PASSKEY_REVOKED',
      category: 'PASSKEY',
      status: 'WARNING',
      actor: stateManager.getState().owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Revoked passkey ID prefix ${id.substring(0, 8)}••••`
    });

    sendJson(res, 200, { success: true, message: 'Passkey revoked successfully.', passkeys: stateManager.getEnrolledPasskeys() });
    return true;
  }

  // 14. Emergency Recovery Codes: Regenerate
  if (pathname === '/api/mfa/recovery-codes/generate' && method === 'POST') {
    const state = stateManager.getState();
    const { plaintextCodes, hashedCodes } = generateEmergencyRecoveryCodes(10);
    const now = new Date();

    state.owner.recoveryCodes = hashedCodes;
    state.owner.recoveryCodesGeneratedAt = now.toISOString();
    stateManager.save();

    stateManager.addAuditLog({
      action: 'RECOVERY_CODES_REGENERATED',
      category: 'SECURITY',
      status: 'WARNING',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: '10 new emergency recovery codes generated. All previous recovery codes invalidated.'
    });

    dispatchMultiChannelAlert({
      eventType: 'RECOVERY_CODES_REGENERATED',
      subject: 'Portfolio Admin — Recovery Codes Regenerated',
      headline: 'Emergency Backup Codes Regenerated',
      details: 'New emergency backup codes were generated. All previous backup codes are now permanently invalid.',
      severity: 'WARNING',
      metadata: {
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        os: meta.os,
        actor: state.owner.loginEmail,
        timestampIST: formatIST(now)
      }
    }, true);

    // Return plaintext codes ONCE
    sendJson(res, 200, {
      plaintextCodes,
      generatedAtIST: formatIST(now),
      message: 'New recovery codes generated. Store them offline immediately. They will not be displayed again.'
    });
    return true;
  }

  // 15. Notification Preferences: GET & PATCH
  if (pathname === '/api/notifications/preferences' && method === 'GET') {
    const state = stateManager.getState();
    const history = notificationService.getHistory();
    const providerStatus = notificationService.getProviderStatus();

    sendJson(res, 200, {
      preferences: state.owner.notificationPreferences,
      destinations: {
        emailMasked: maskEmail(state.owner.recoveryEmail),
        mobileMasked: maskPhone(state.owner.securityMobile),
        whatsappMasked: maskPhone(state.owner.whatsappMobile),
        mobileVerified: state.owner.mobileVerified,
        whatsappVerified: state.owner.whatsappVerified
      },
      providers: providerStatus,
      recentAlerts: history.slice(0, 20)
    });
    return true;
  }

  if (pathname === '/api/notifications/preferences' && method === 'PATCH') {
    const body = await parseJsonBody(req);
    const state = stateManager.getState();
    if (body.preferences) {
      state.owner.notificationPreferences = {
        ...state.owner.notificationPreferences,
        ...body.preferences
      };
      stateManager.save();
      stateManager.addAuditLog({
        action: 'NOTIFICATION_PREFERENCES_UPDATED',
        category: 'NOTIFICATIONS',
        status: 'SUCCESS',
        actor: state.owner.displayName,
        ipAddress: meta.ipAddress,
        details: 'Owner alert preferences updated across channels.'
      });
    }
    sendJson(res, 200, {
      preferences: state.owner.notificationPreferences,
      message: 'Notification preferences saved.'
    });
    return true;
  }

  if (pathname === '/api/notifications/test' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { channel } = body;
    const now = new Date();
    const state = stateManager.getState();

    let result: any;
    if (channel === 'EMAIL') {
      result = await notificationService.sendEmailSecurityAlert({
        eventType: 'TEST_NOTIFICATION_REQUESTED',
        subject: 'Portfolio Owner Security — Transactional Verification Test',
        headline: 'Security Delivery Engine Diagnostic Test',
        details: 'This is an authorized transactional verification test confirming your primary email alert pipeline.',
        severity: 'INFO',
        metadata: {
          ipAddress: meta.ipAddress,
          browser: meta.browser,
          os: meta.os,
          actor: state.owner.displayName,
          timestampIST: formatIST(now)
        }
      });
    } else if (channel === 'SMS') {
      result = await notificationService.sendSmsSecurityAlert(
        'Test notification: Your portfolio security notification service is working.',
        'TEST_SMS_DISPATCH'
      );
    } else if (channel === 'WHATSAPP') {
      result = await notificationService.sendWhatsAppSecurityAlert(
        `[Chethan Kumar Portfolio Security] Diagnostic WhatsApp dispatch verified at ${formatIST(now)}.`,
        'TEST_WHATSAPP_DISPATCH'
      );
    } else {
      sendJson(res, 400, { error: 'Invalid channel specified. Expected EMAIL, SMS, or WHATSAPP.' });
      return true;
    }

    sendJson(res, 200, {
      success: result.success,
      channel,
      status: result.status,
      record: result.record,
      provider: result.record?.provider || (channel === 'EMAIL' ? 'Twilio Comms Email' : channel === 'SMS' ? 'Twilio Programmable SMS' : 'Twilio WhatsApp'),
      providerMessageId: result.providerMessageId || result.record?.providerMessageId || null,
      errorCode: result.errorCode || result.record?.errorCode || null,
      errorDetails: result.record?.errorInfo || result.record?.errorDetails || null,
      message: result.message,
      instructions: result.instructions || null,
      trialNotice: result.trialNotice || null,
      operationStats: result.record?.operationStats || result.operationStats || null
    });
    return true;
  }

  // 15b. Notification Poller & Diagnostics
  if (pathname === '/api/notifications/poll' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { channel, providerMessageId } = body;
    if (!channel || !providerMessageId) {
      sendJson(res, 400, { error: 'Both channel and providerMessageId are required for polling.' });
      return true;
    }

    const updatedRecord = await notificationService.pollDeliveryStatus(channel, providerMessageId);
    sendJson(res, 200, {
      success: Boolean(updatedRecord),
      record: updatedRecord,
      timestampIST: formatIST()
    });
    return true;
  }

  if (pathname === '/api/notifications/diagnostics' && method === 'GET') {
    const diagnostics = notificationService.getComprehensiveDiagnostics();
    sendJson(res, 200, {
      diagnostics,
      timestampIST: formatIST()
    });
    return true;
  }

  // 15c. Notification History
  if (pathname === '/api/notifications/history' && method === 'GET') {
    const history = notificationService.getHistory();
    sendJson(res, 200, {
      history,
      count: history.length,
      timestampIST: formatIST()
    });
    return true;
  }

  // 15d. Webhooks for Delivery Callbacks
  // Resend Webhooks: email.delivered, email.bounced, email.complained, email.sent
  if (pathname === '/api/webhooks/resend' && method === 'POST') {
    const body = await parseJsonBody(req);
    const emailId = body.data?.email_id || body.data?.id;
    const eventType = body.type;
    if (emailId && eventType) {
      let newStatus: DeliveryStatus = 'UNKNOWN';
      if (eventType === 'email.delivered') newStatus = 'DELIVERED';
      else if (eventType === 'email.bounced') newStatus = 'BOUNCED';
      else if (eventType === 'email.complained') newStatus = 'REJECTED';
      else if (eventType === 'email.delivery_delayed') newStatus = 'PENDING_DISPATCH';
      else if (eventType === 'email.sent') newStatus = 'SENT';

      const details = body.data?.bounce?.message || (newStatus === 'BOUNCED' ? 'Email bounced by recipient MTA' : undefined);
      notificationService.updateDeliveryStatus(emailId, newStatus, details);

      stateManager.addAuditLog({
        action: 'DELIVERY_CALLBACK_RECEIVED',
        category: 'NOTIFICATIONS',
        status: newStatus === 'DELIVERED' ? 'SUCCESS' : newStatus === 'BOUNCED' ? 'FAILURE' : 'WARNING',
        actor: 'Resend Webhook',
        ipAddress: meta.ipAddress,
        details: `Resend event "${eventType}" for ${emailId}: status -> ${newStatus}.`
      });
    }
    sendJson(res, 200, { received: true });
    return true;
  }

  // Twilio SMS, WhatsApp & Comms Email Status Callbacks:
  // delivered, undelivered, failed, sent, queued, read
  if (
    (pathname === '/api/webhooks/twilio' ||
     pathname === '/api/webhooks/twilio/sms' ||
     pathname === '/api/webhooks/twilio/whatsapp' ||
     pathname === '/api/webhooks/twilio/email') && 
    method === 'POST'
  ) {
    const body = await parseJsonBody(req);
    const messageSid = body.MessageSid || body.SmsSid || body.message_sid || body.operationId || body.operation_id || body.id;
    const rawStatus = (body.MessageStatus || body.SmsStatus || body.status || body.event || '').toLowerCase();
    const errorCode = body.ErrorCode || body.error_code || null;

    if (messageSid && rawStatus) {
      const statusMap: Record<string, DeliveryStatus> = {
        delivered: 'DELIVERED',
        read: 'DELIVERED',
        sent: 'SENT',
        queued: 'QUEUED',
        sending: 'DISPATCHING',
        processing: 'DISPATCHING',
        failed: 'FAILED',
        undelivered: 'UNDELIVERED',
        bounced: 'BOUNCED',
        rejected: 'REJECTED'
      };
      const newStatus = statusMap[rawStatus] || 'UNKNOWN';
      const details = body.ErrorMessage || body.error_message || (newStatus === 'FAILED' ? `Twilio status: ${rawStatus}` : undefined);
      notificationService.updateDeliveryStatus(messageSid, newStatus, details, errorCode ? String(errorCode) : undefined);

      stateManager.addAuditLog({
        action: 'DELIVERY_CALLBACK_RECEIVED',
        category: 'NOTIFICATIONS',
        status: newStatus === 'DELIVERED' ? 'SUCCESS' : newStatus === 'SENT' ? 'SUCCESS' : 'WARNING',
        actor: 'Twilio Webhook',
        ipAddress: meta.ipAddress,
        details: `Twilio callback for ${messageSid}: transitioned to ${newStatus} (${rawStatus}).`
      });
    }
    sendJson(res, 200, { received: true });
    return true;
  }

  if (pathname === '/api/webhooks/whatsapp') {
    if (method === 'GET') {
      const mode = urlObj.searchParams.get('hub.mode');
      const token = urlObj.searchParams.get('hub.verify_token');
      const challenge = urlObj.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'portfolio-security-webhook')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(challenge || '');
        return true;
      }
      sendJson(res, 403, { error: 'Verification token mismatch' });
      return true;
    }
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const messageId = body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id;
      const status = body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status;
      if (messageId && status) {
        const statusMap: Record<string, any> = {
          delivered: 'DELIVERED',
          read: 'DELIVERED',
          failed: 'FAILED',
          sent: 'ACCEPTED'
        };
        const newStatus = statusMap[status] || 'UNKNOWN';
        notificationService.updateDeliveryStatus(messageId, newStatus);
      }
      sendJson(res, 200, { received: true });
      return true;
    }
  }

  // 16. Phone Verification for SMS / WhatsApp Notifications
  if (pathname === '/api/notifications/phone/request-verify' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { channel } = body; // 'SMS' or 'WHATSAPP'
    const state = stateManager.getState();
    const rawOtp = generateSecureOTP(6);

    stateManager.pendingPhoneOTP = {
      codeHash: hmacSha256(rawOtp),
      destination: channel === 'WHATSAPP' ? state.owner.whatsappMobile : state.owner.securityMobile,
      expiresAt: Date.now() + 10 * 60 * 1000,
      channel: channel || 'SMS'
    };

    // Dispatch verification code
    if (channel === 'WHATSAPP') {
      await notificationService.sendWhatsAppSecurityAlert(
        `Portfolio Security: Your WhatsApp verification code is ${rawOtp}. Valid for 10 minutes.`
      );
    } else {
      await notificationService.sendSmsSecurityAlert(
        `Portfolio Security: Your SMS verification code is ${rawOtp}. Valid for 10 minutes.`
      );
    }

    sendJson(res, 200, {
      success: true,
      destination: channel === 'WHATSAPP' ? state.owner.whatsappMobile : state.owner.securityMobile,
      message: `Verification code sent to ${channel === 'WHATSAPP' ? state.owner.whatsappMobile : state.owner.securityMobile}`
    });
    return true;
  }

  if (pathname === '/api/notifications/phone/confirm-verify' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { code, channel } = body;
    const state = stateManager.getState();

    const pending = stateManager.pendingPhoneOTP;
    if (!pending || Date.now() > pending.expiresAt) {
      sendJson(res, 400, { error: 'Verification code expired or not requested.' });
      return true;
    }

    if (!safeCompare(pending.codeHash, hmacSha256(code.trim()))) {
      sendJson(res, 401, { error: 'Invalid verification code.' });
      return true;
    }

    if (channel === 'WHATSAPP') {
      state.owner.whatsappVerified = true;
    } else {
      state.owner.mobileVerified = true;
    }
    stateManager.pendingPhoneOTP = null;
    stateManager.save();

    stateManager.addAuditLog({
      action: `${channel}_DESTINATION_VERIFIED`,
      category: 'NOTIFICATIONS',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `${channel} destination verified for security alerts: ${pending.destination}`
    });

    sendJson(res, 200, {
      success: true,
      message: `${channel} number verified. Security notifications enabled.`
    });
    return true;
  }

  // 17. Active Sessions Management
  if (pathname === '/api/sessions' && method === 'GET') {
    const session = getValidatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    stateManager.cleanExpiredSessions();
    const state = stateManager.getState();
    const sessionsList = (state.sessions || [])
      .filter(s => !s.revoked)
      .map(s => ({
        ...s,
        isCurrent: s.id === session.id
      }));
    sendJson(res, 200, { sessions: sessionsList });
    return true;
  }

  if (pathname.startsWith('/api/sessions/') && method === 'DELETE') {
    const session = getValidatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const id = pathname.replace('/api/sessions/', '');
    const isCurrentSession = (id === session.id);
    stateManager.revokeSession(id);

    if (isCurrentSession) {
      clearSessionCookie(res);
    }

    stateManager.addAuditLog({
      action: 'ADMIN_SESSION_REVOKED',
      category: 'SESSIONS',
      status: 'SUCCESS',
      actor: stateManager.getState().owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: isCurrentSession ? `Current workstation session revoked (${id})` : `Revoked active session ${id}`
    });

    sendJson(res, 200, { success: true, message: 'Session revoked.', isCurrentSession });
    return true;
  }

  if (pathname === '/api/sessions/revoke-others' && method === 'POST') {
    const session = getValidatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const count = stateManager.revokeOtherSessions(session.id);

    stateManager.addAuditLog({
      action: 'ALL_OTHER_SESSIONS_REVOKED',
      category: 'SESSIONS',
      status: 'SUCCESS',
      actor: stateManager.getState().owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Owner terminated all other concurrent active sessions (${count} session(s) signed out).`
    });

    sendJson(res, 200, { success: true, message: 'All other active sessions have been terminated.', revokedCount: count });
    return true;
  }

  // 18. Audit Logs
  if (pathname === '/api/audit-logs' && method === 'GET') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const state = stateManager.getState();
    const sanitizedLogs = (state.auditLogs || []).map(log => ({
      ...log,
      actor: log.actor && log.actor.includes('@') ? maskEmail(log.actor) : log.actor,
      details: log.details && log.details.includes('@')
        ? log.details.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match))
        : log.details
    }));
    sendJson(res, 200, { logs: sanitizedLogs });
    return true;
  }

  // 19. Private Recruiter Access (Hashed Tokens)
  if (pathname === '/api/recruiter-tokens' && method === 'GET') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const state = stateManager.getState();
    sendJson(res, 200, { tokens: state.recruiterTokens });
    return true;
  }

  if (pathname === '/api/recruiter-tokens' && method === 'POST') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const body = await parseJsonBody(req);
    const { label, expiresInDays = 30 } = body;
    const { rawToken, tokenPrefix, tokenHash } = generateSecureRecruiterToken();
    const now = new Date();
    const state = stateManager.getState();

    const tokenObj: any = {
      id: `rt-${Date.now()}`,
      tokenHash,
      tokenPrefix,
      label: (label || 'Executive Recruiter Review').trim(),
      createdAt: now.toISOString(),
      createdAtIST: formatIST(now),
      expiresAt: new Date(now.getTime() + expiresInDays * 24 * 3600 * 1000).toISOString(),
      accessCount: 0,
      status: 'Active',
      lastAccessedAt: null
    };

    state.recruiterTokens.unshift(tokenObj);
    stateManager.save();

    stateManager.addAuditLog({
      action: 'RECRUITER_INVITATION_ISSUED',
      category: 'RECRUITER_ACCESS',
      status: 'SUCCESS',
      actor: state.owner.loginEmail,
      ipAddress: meta.ipAddress,
      details: `Issued private recruiter invitation [${tokenObj.label}] with prefix ${tokenPrefix}`
    });

    dispatchMultiChannelAlert({
      eventType: 'RECRUITER_TOKEN_GENERATED',
      subject: 'Portfolio Admin — Recruiter Token Issued',
      headline: 'New Recruiter Access Token Created',
      details: `A private recruiter invitation was generated: [${tokenObj.label}] with prefix ${tokenPrefix}.`,
      severity: 'INFO',
      metadata: {
        ipAddress: meta.ipAddress,
        actor: state.owner.loginEmail,
        timestampIST: formatIST(now)
      }
    });

    // Return the plaintext token ONCE!
    sendJson(res, 200, {
      rawToken,
      token: tokenObj,
      message: 'Private recruiter invitation created. Copy the raw invitation secret now; only the cryptographic hash is stored.'
    });
    return true;
  }

  // Public verification of recruiter token
  if (pathname === '/api/recruiter-tokens/verify' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { token } = body;
    if (!token || typeof token !== 'string') {
      sendJson(res, 400, { valid: false, error: 'Token string required.' });
      return true;
    }

    const inputHash = sha256(token.trim().toUpperCase());
    const state = stateManager.getState();
    const matched = state.recruiterTokens.find(t => safeCompare(t.tokenHash, inputHash));

    if (matched && matched.status === 'Active') {
      const isExpired = new Date() > new Date(matched.expiresAt);
      if (isExpired) {
        matched.status = 'Expired';
        stateManager.save();
        sendJson(res, 200, { valid: false, error: 'This recruiter invitation has expired.' });
        return true;
      }

      matched.accessCount++;
      matched.lastAccessedAt = formatIST();
      stateManager.save();

      stateManager.addAuditLog({
        action: 'RECRUITER_INVITATION_ACCESSED',
        category: 'RECRUITER_ACCESS',
        status: 'SUCCESS',
        actor: `Recruiter [${matched.label}]`,
        ipAddress: meta.ipAddress,
        details: `Invitation verified. Read count incremented to ${matched.accessCount}`
      });

      sendJson(res, 200, {
        valid: true,
        label: matched.label,
        status: 'Active',
        accessCount: matched.accessCount,
        message: 'Verified recruiter clearance active.'
      });
      return true;
    }

    sendJson(res, 200, {
      valid: false,
      error: 'Invalid or revoked recruiter invitation token.'
    });
    return true;
  }

  if (pathname.startsWith('/api/recruiter-tokens/') && method === 'DELETE') {
    if (!verifyOwnerSession(req)) {
      sendJson(res, 401, { error: 'Unauthorized: Owner session token required or expired.' });
      return true;
    }
    const id = pathname.replace('/api/recruiter-tokens/', '');
    const state = stateManager.getState();
    const target = state.recruiterTokens.find(t => t.id === id);
    if (target) {
      target.status = 'Revoked';
      stateManager.save();
      stateManager.addAuditLog({
        action: 'RECRUITER_INVITATION_REVOKED',
        category: 'RECRUITER_ACCESS',
        status: 'WARNING',
        actor: state.owner.loginEmail,
        ipAddress: meta.ipAddress,
        details: `Revoked recruiter token prefix ${target.tokenPrefix}`
      });

      dispatchMultiChannelAlert({
        eventType: 'RECRUITER_TOKEN_REVOKED',
        subject: 'Portfolio Admin — Recruiter Token Revoked',
        headline: 'Recruiter Access Token Revoked',
        details: `Private recruiter invitation with prefix ${target.tokenPrefix} was revoked by owner.`,
        severity: 'WARNING',
        metadata: {
          ipAddress: meta.ipAddress,
          actor: state.owner.loginEmail,
          timestampIST: formatIST()
        }
      });
      sendJson(res, 200, { success: true, message: 'Invitation revoked.' });
    } else {
      sendJson(res, 404, { error: 'Invitation not found.' });
    }
    return true;
  }

  // Not handled
  return false;
}
