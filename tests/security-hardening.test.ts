import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';
import { describe, it, expect, afterEach } from 'vitest';

import {
  assertSecuritySecrets,
  getHmacSecret,
  sha256,
  validateSecuritySecrets
} from '../server/cryptoUtils';
import { handleCorsAndPreflight } from '../server/cors';
import { verifyAuth0IdToken } from '../server/auth0';
import { handleApiRequest } from '../server/apiHandler';
import { migrateStateObject, stateManager } from '../server/state';
import serverlessHandler from '../api/serverless';

function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}): IncomingMessage {
  const req = new EventEmitter() as unknown as IncomingMessage;
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = {
    host: 'localhost:3000',
    'content-type': 'application/json',
    ...(options.headers || {})
  };
  req.socket = { remoteAddress: '127.0.0.1' } as any;

  process.nextTick(() => {
    if (options.body !== undefined) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.emit('data', Buffer.from(payload));
    }
    req.emit('end');
  });

  return req;
}

function createMockResponse(): {
  res: ServerResponse;
  getStatusCode: () => number;
  getHeaders: () => Record<string, string>;
  getBody: () => string;
  getJson: () => any;
} {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body = '';

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = String(value);
      return this;
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    end(chunk?: any) {
      if (chunk !== undefined) {
        body += typeof chunk === 'string' ? chunk : chunk.toString();
      }
      return this;
    }
  } as unknown as ServerResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
    getJson: () => {
      try {
        return JSON.parse(body);
      } catch {
        return null;
      }
    }
  };
}

function signJwtRs256(
  header: Record<string, any>,
  payload: Record<string, any>,
  privateKey: crypto.KeyObject
): string {
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput, 'ascii'), privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('Security Hardening & Regression Suite', () => {
  describe('1. Secret Validation & Fail-Closed Configuration', () => {
    it('rejects missing, short, placeholder, or repeated secrets', () => {
      expect(validateSecuritySecrets({} as NodeJS.ProcessEnv).valid).toBe(false);
      expect(
        validateSecuritySecrets({
          SECURITY_HMAC_KEY: 'too-short',
          ADMIN_PASSWORD: 'short'
        } as NodeJS.ProcessEnv).errors.length
      ).toBe(2);

      expect(
        validateSecuritySecrets({
          SECURITY_HMAC_KEY: 'your_secure_random_hmac_seed_key_replace_in_production',
          ADMIN_PASSWORD: 'your_secure_admin_password_here'
        } as NodeJS.ProcessEnv).valid
      ).toBe(false);

      expect(
        validateSecuritySecrets({
          SECURITY_HMAC_KEY: 'a'.repeat(32),
          ADMIN_PASSWORD: 'b'.repeat(16)
        } as NodeJS.ProcessEnv).valid
      ).toBe(false);

      expect(() =>
        assertSecuritySecrets({
          SECURITY_HMAC_KEY: 'portfolio-security-hmac-seed-ck-2026',
          ADMIN_PASSWORD: 'Karna@2026!Security'
        } as NodeJS.ProcessEnv)
      ).toThrow();

      expect(() => getHmacSecret({ SECURITY_HMAC_KEY: 'short' } as NodeJS.ProcessEnv)).toThrow();
    });

    it('accepts strong non-placeholder cryptographic secrets', () => {
      const check = validateSecuritySecrets({
        SECURITY_HMAC_KEY: '9f8e7d6c5b4a3928172635445566778899aabbccddeeff001122334455667788',
        ADMIN_PASSWORD: 'Correct-Horse-Battery-Staple-2026!'
      } as NodeJS.ProcessEnv);
      expect(check.valid).toBe(true);
      expect(check.errors).toEqual([]);
    });
  });

  describe('2. CORS & Origin Allowlist Enforcement', () => {
    it('blocks unapproved origins with HTTP 403 in production on shared CORS helper and serverless handler', async () => {
      process.env.NODE_ENV = 'production';
      const evilReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: 'https://evil-attacker.example' }
      });
      const evilRes = createMockResponse();
      const outcome = handleCorsAndPreflight(evilReq, evilRes.res, process.env);
      expect(outcome).toBe('handled');
      expect(evilRes.getStatusCode()).toBe(403);
      expect(evilRes.getHeaders()['access-control-allow-origin']).toBeUndefined();

      const serverlessEvilReq = createMockRequest({
        method: 'OPTIONS',
        url: '/api/health',
        headers: { origin: 'https://evil-attacker.example' }
      });
      const serverlessEvilRes = createMockResponse();
      await serverlessHandler(serverlessEvilReq, serverlessEvilRes.res);
      expect(serverlessEvilRes.getStatusCode()).toBe(403);
      expect(serverlessEvilRes.getHeaders()['access-control-allow-origin']).toBeUndefined();
    });

    it('allows approved production origins and reflects exact normalized origin', async () => {
      process.env.NODE_ENV = 'production';
      const preflightReq = createMockRequest({
        method: 'OPTIONS',
        url: '/api/health',
        headers: { origin: 'https://chethan-kumar-portfolio.vercel.app' }
      });
      const preflightRes = createMockResponse();
      await serverlessHandler(preflightReq, preflightRes.res);
      expect(preflightRes.getStatusCode()).toBe(204);
      expect(preflightRes.getHeaders()['access-control-allow-origin']).toBe(
        'https://chethan-kumar-portfolio.vercel.app'
      );
    });
  });

  describe('3. Mandatory Authentication Across All Privileged Endpoints', () => {
    const protectedEndpoints: Array<{ method: string; url: string; body?: Record<string, any> }> = [
      { method: 'GET', url: '/api/security/profile' },
      { method: 'GET', url: '/api/admin/profile' },
      { method: 'PATCH', url: '/api/admin/profile', body: { displayName: 'Attacker' } },
      { method: 'POST', url: '/api/mfa/totp/enroll-init', body: { appType: 'GOOGLE_AUTHENTICATOR' } },
      { method: 'POST', url: '/api/mfa/totp/enroll-confirm', body: { secret: 'JBSWY3DPEHPK3PXP', code: '123456' } },
      { method: 'POST', url: '/api/mfa/totp/remove', body: {} },
      { method: 'POST', url: '/api/mfa/passkey/register-options', body: {} },
      { method: 'POST', url: '/api/mfa/recovery-codes/generate', body: {} },
      { method: 'GET', url: '/api/notifications/preferences' },
      { method: 'PATCH', url: '/api/notifications/preferences', body: { preferences: {} } },
      { method: 'POST', url: '/api/notifications/test', body: { channel: 'EMAIL' } },
      { method: 'POST', url: '/api/notifications/poll', body: { channel: 'SMS', providerMessageId: 'SM123' } },
      { method: 'GET', url: '/api/notifications/diagnostics' },
      { method: 'GET', url: '/api/notifications/history' },
      { method: 'POST', url: '/api/notifications/phone/request-verify', body: { channel: 'SMS' } },
      { method: 'POST', url: '/api/notifications/phone/confirm-verify', body: { channel: 'SMS', code: '123456' } },
      { method: 'GET', url: '/api/sessions' },
      { method: 'POST', url: '/api/sessions/revoke-others', body: {} },
      { method: 'DELETE', url: '/api/sessions/sess-123' },
      { method: 'GET', url: '/api/audit-logs' },
      { method: 'GET', url: '/api/recruiter-tokens' },
      { method: 'POST', url: '/api/recruiter-tokens', body: { label: 'Unauthorized' } },
      { method: 'DELETE', url: '/api/recruiter-tokens/rt-123' },
      { method: 'PATCH', url: '/api/mfa/passkey/pk-123', body: { label: 'Pwned' } },
      { method: 'DELETE', url: '/api/mfa/passkey/pk-123' },
      { method: 'POST', url: '/api/security/password/request-otp', body: {} },
      { method: 'POST', url: '/api/security/password/verify-otp-and-reset', body: { otpCode: '000000' } },
      { method: 'POST', url: '/api/admin/email/request-change', body: { newEmail: 'attacker@example.com' } },
      { method: 'POST', url: '/api/admin/email/confirm-change', body: { code: '000000' } },
      { method: 'POST', url: '/api/admin/recovery-email/request-change', body: { newEmail: 'attacker@example.com' } },
      { method: 'POST', url: '/api/admin/recovery-email/confirm-change', body: { code: '000000' } },
      { method: 'GET', url: '/api/notifications/in-app' },
      { method: 'POST', url: '/api/notifications/in-app/read', body: { id: 'notif-1' } },
      { method: 'POST', url: '/api/notifications/in-app/dismiss', body: { id: 'notif-1' } },
      { method: 'POST', url: '/api/notifications/fcm/register', body: { token: 'fcm-123' } }
    ];

    it.each(protectedEndpoints)(
      'rejects unauthenticated $method $url with 401',
      async ({ method, url, body }) => {
        const req = createMockRequest({ method, url, body });
        const mockRes = createMockResponse();
        const handled = await handleApiRequest(req, mockRes.res);
        expect(handled).toBe(true);
        expect(mockRes.getStatusCode()).toBe(401);
        expect(mockRes.getJson()?.plaintextCodes).toBeUndefined();
      }
    );

    it('rejects weak password in setOwnerPassword and incorrect password on login', async () => {
      expect(() => stateManager.setOwnerPassword('short-pw')).toThrow();
      expect(stateManager.verifyOwnerPassword('definitely-wrong-password-1234')).toBe(false);

      const req = createMockRequest({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-forwarded-for': '198.51.100.77' },
        body: { identifier: 'stratagem_vx', passphrase: 'wrong-password-attempt-123456' }
      });
      const mockRes = createMockResponse();
      await handleApiRequest(req, mockRes.res);
      expect(mockRes.getStatusCode()).toBe(401);
    });
  });

  describe('4. Cryptographic Auth0 ID Token Verification', () => {
    it('rejects spoofed /api/auth/auth0-verify payloads without a cryptographically verified ID token', async () => {
      const spoofReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/auth0-verify',
        body: { email: 'the.suryaputraa@gmail.com', sub: 'usr_stratagemvx_owner_01' }
      });
      const spoofRes = createMockResponse();
      await handleApiRequest(spoofReq, spoofRes.res);
      expect([400, 401, 503]).toContain(spoofRes.getStatusCode());
      expect(spoofRes.getJson()?.challengeToken).toBeUndefined();
    });

    it('accepts valid RSA-signed ID tokens and rejects tampered, expired, alg:none, or wrong-aud tokens', async () => {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const jwk = { ...(publicKey.export({ format: 'jwk' }) as Record<string, any>), kid: 'key-1', use: 'sig', alg: 'RS256' };
      const fetchJwks = async () => ({ keys: [jwk] });
      const nowSec = Math.floor(Date.now() / 1000);
      const baseOptions = { domain: 'portfolio-owner.us.auth0.com', clientId: 'client_123', fetchJwks, nowMs: nowSec * 1000 };

      const validJwt = signJwtRs256(
        { alg: 'RS256', typ: 'JWT', kid: 'key-1' },
        {
          iss: 'https://portfolio-owner.us.auth0.com/',
          aud: 'client_123',
          sub: 'auth0|owner123',
          email: 'the.suryaputraa@gmail.com',
          email_verified: true,
          iat: nowSec - 10,
          exp: nowSec + 300
        },
        privateKey
      );
      const okResult = await verifyAuth0IdToken(validJwt, baseOptions);
      expect(okResult.ok).toBe(true);
      if (okResult.ok) {
        expect(okResult.claims.email).toBe('the.suryaputraa@gmail.com');
      }

      // Expired token rejected
      const expiredJwt = signJwtRs256(
        { alg: 'RS256', kid: 'key-1' },
        {
          iss: 'https://portfolio-owner.us.auth0.com/',
          aud: 'client_123',
          sub: 'auth0|owner123',
          email: 'the.suryaputraa@gmail.com',
          email_verified: true,
          exp: nowSec - 60
        },
        privateKey
      );
      expect((await verifyAuth0IdToken(expiredJwt, baseOptions)).ok).toBe(false);

      // Tampered payload rejected
      const parts = validJwt.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          iss: 'https://portfolio-owner.us.auth0.com/',
          aud: 'client_123',
          sub: 'auth0|attacker',
          email: 'the.suryaputraa@gmail.com',
          email_verified: true,
          exp: nowSec + 300
        })
      ).toString('base64url');
      expect((await verifyAuth0IdToken(`${parts[0]}.${tamperedPayload}.${parts[2]}`, baseOptions)).ok).toBe(false);

      // alg: none rejected
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', kid: 'key-1' })).toString('base64url');
      expect((await verifyAuth0IdToken(`${noneHeader}.${parts[1]}.${parts[2]}`, baseOptions)).ok).toBe(false);

      // Unverified email rejected
      const unverifiedEmailJwt = signJwtRs256(
        { alg: 'RS256', kid: 'key-1' },
        {
          iss: 'https://portfolio-owner.us.auth0.com/',
          aud: 'client_123',
          sub: 'auth0|owner123',
          email: 'the.suryaputraa@gmail.com',
          email_verified: false,
          exp: nowSec + 300
        },
        privateKey
      );
      expect((await verifyAuth0IdToken(unverifiedEmailJwt, baseOptions)).ok).toBe(false);

      // Wrong issuer rejected
      const wrongIssuerJwt = signJwtRs256(
        { alg: 'RS256', kid: 'key-1' },
        {
          iss: 'https://evil-tenant.us.auth0.com/',
          aud: 'client_123',
          sub: 'auth0|owner123',
          email: 'the.suryaputraa@gmail.com',
          email_verified: true,
          exp: nowSec + 300
        },
        privateKey
      );
      expect((await verifyAuth0IdToken(wrongIssuerJwt, baseOptions)).ok).toBe(false);

      // Wrong audience rejected
      const wrongAudienceJwt = signJwtRs256(
        { alg: 'RS256', kid: 'key-1' },
        {
          iss: 'https://portfolio-owner.us.auth0.com/',
          aud: 'other_client_id',
          sub: 'auth0|owner123',
          email: 'the.suryaputraa@gmail.com',
          email_verified: true,
          exp: nowSec + 300
        },
        privateKey
      );
      expect((await verifyAuth0IdToken(wrongAudienceJwt, baseOptions)).ok).toBe(false);

      // Non-owner verified identity is rejected by /api/auth/auth0-verify with 403
      process.env.AUTH0_DOMAIN = 'portfolio-owner.us.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'client_123';
      const originalFetch = global.fetch;
      global.fetch = (async (input: any) => {
        const url = String(input);
        if (url.includes('/.well-known/jwks.json')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ keys: [jwk] })
          } as Response;
        }
        return originalFetch(input);
      }) as typeof fetch;

      try {
        const nonOwnerJwt = signJwtRs256(
          { alg: 'RS256', kid: 'key-1' },
          {
            iss: 'https://portfolio-owner.us.auth0.com/',
            aud: 'client_123',
            sub: 'auth0|stranger999',
            email: 'stranger@unauthorized.example',
            email_verified: true,
            iat: nowSec - 10,
            exp: nowSec + 300
          },
          privateKey
        );
        const strangerReq = createMockRequest({
          method: 'POST',
          url: '/api/auth/auth0-verify',
          body: { idToken: nonOwnerJwt }
        });
        const strangerRes = createMockResponse();
        await handleApiRequest(strangerReq, strangerRes.res);
        expect(strangerRes.getStatusCode()).toBe(403);
        expect(strangerRes.getJson()?.challengeToken).toBeUndefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('5. WebAuthn Challenge Binding & Origin Hardening', () => {
    it('rejects unapproved WebAuthn origin on login-options and burns failed login challenge to block replay', async () => {
      const evilOptionsReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/login-options',
        headers: { origin: 'https://evil-phish.example' },
        body: { origin: 'https://evil-phish.example' }
      });
      const evilOptionsRes = createMockResponse();
      await handleApiRequest(evilOptionsReq, evilOptionsRes.res);
      expect(evilOptionsRes.getStatusCode()).toBe(403);

      // Issue genuine options from approved origin
      const okOptionsReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/login-options',
        headers: { origin: 'http://localhost:3000' },
        body: {}
      });
      const okOptionsRes = createMockResponse();
      await handleApiRequest(okOptionsReq, okOptionsRes.res);
      expect(okOptionsRes.getStatusCode()).toBe(200);
      const issuedChallenge = okOptionsRes.getJson()?.challenge as string;
      expect(issuedChallenge).toBeTruthy();

      // Cross-user lookup must fail even before expiry
      expect(stateManager.isWebAuthnChallengeValid(issuedChallenge, 'authentication', 'other-user')).toBe(false);
      expect(stateManager.isWebAuthnChallengeValid(issuedChallenge, 'authentication', 'usr_stratagemvx_owner_01')).toBe(true);

      // Failed verification attempt burns the challenge immediately
      const failVerifyReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/verify-login',
        headers: { origin: 'http://localhost:3000' },
        body: {
          response: {
            id: 'non-existent-credential',
            response: {
              clientDataJSON: Buffer.from(
                JSON.stringify({ type: 'webauthn.get', challenge: issuedChallenge, origin: 'http://localhost:3000' })
              ).toString('base64url')
            }
          }
        }
      });
      const failVerifyRes = createMockResponse();
      await handleApiRequest(failVerifyReq, failVerifyRes.res);
      expect(failVerifyRes.getStatusCode()).toBe(400);
      expect(stateManager.isWebAuthnChallengeValid(issuedChallenge, 'authentication', 'usr_stratagemvx_owner_01')).toBe(false);
    });

    it('rejects expired WebAuthn challenges', () => {
      const challenge = 'expired-challenge-test';
      stateManager.saveWebAuthnChallenge(challenge, 'authentication', 'usr_stratagemvx_owner_01');
      const entry = stateManager.getWebAuthnChallengeEntry(challenge)!;
      entry.expiresAt = Date.now() - 1000;
      expect(stateManager.isWebAuthnChallengeValid(challenge, 'authentication', 'usr_stratagemvx_owner_01')).toBe(false);
      stateManager.consumeWebAuthnChallenge(challenge);
    });
  });

  describe('6. WhatsApp Webhook Verification Fail-Closed', () => {
    it('fails closed when verify token is unset or matches removed hardcoded fallback', async () => {
      delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      const unsetReq = createMockRequest({
        method: 'GET',
        url: '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=portfolio-security-webhook&hub.challenge=abc123'
      });
      const unsetRes = createMockResponse();
      await handleApiRequest(unsetReq, unsetRes.res);
      expect(unsetRes.getStatusCode()).toBe(503);

      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'real-secret-whatsapp-token-2026';
      const hardcodedReq = createMockRequest({
        method: 'GET',
        url: '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=portfolio-security-webhook&hub.challenge=abc123'
      });
      const hardcodedRes = createMockResponse();
      await handleApiRequest(hardcodedReq, hardcodedRes.res);
      expect(hardcodedRes.getStatusCode()).toBe(403);

      const validReq = createMockRequest({
        method: 'GET',
        url: '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=real-secret-whatsapp-token-2026&hub.challenge=challenge-ok'
      });
      const validRes = createMockResponse();
      await handleApiRequest(validReq, validRes.res);
      expect(validRes.getStatusCode()).toBe(200);
      expect(validRes.getBody()).toBe('challenge-ok');
    });
  });

  describe('7. Legacy v1 -> v2 State Migration', () => {
    it('preserves owner MFA factors while upgrading credentialVersion to 2 and stripping seeded sessions/tokens', () => {
      const legacyState = {
        owner: {
          id: 'usr_stratagemvx_owner_01',
          fullName: 'Chethan Kumar B S',
          displayName: 'Karna',
          loginUsername: 'stratagem_vx',
          loginEmail: 'the.suryaputraa@gmail.com',
          recoveryEmail: 'the.suryaputraa@gmail.com',
          securityMobile: '+919380469287',
          mobileVerified: true,
          whatsappMobile: '+919380469287',
          whatsappVerified: true,
          mfaEnforced: true,
          credentialVersion: 1,
          totpSecret: 'JBSWY3DPEHPK3PXP',
          totpEnrolledAt: '2026-01-01T00:00:00.000Z',
          authenticators: [{ id: 'auth-existing', type: 'GOOGLE_AUTHENTICATOR', status: 'ENROLLED', secret: 'JBSWY3DPEHPK3PXP' }],
          passkeys: [{ id: 'pk-existing', deviceLabel: 'YubiKey 5', publicKey: 'abc', counter: 4, revoked: false }],
          recoveryCodes: [{ codeHash: sha256('AAAA-BBBB-CCCC-DDDD'), used: false, usedAt: null }],
          notificationPreferences: { email: { successfulLogin: true }, sms: { criticalSecurityEvents: true }, whatsapp: { criticalSecurityEvents: true } }
        },
        sessions: [
          { id: 'sess-current-dev', sessionTokenHash: sha256('default-dev-session-token') },
          { id: 'sess-legit-user', sessionTokenHash: sha256('real-session-token') }
        ],
        recruiterTokens: [
          { id: 'rt-seed-1', tokenHash: sha256('REC-2026-DEMO-7890-TEST') },
          { id: 'rt-legit-1', tokenHash: sha256('REC-2026-REAL-TOKEN') }
        ],
        auditLogs: []
      };

      const { state, mutated } = migrateStateObject(legacyState, {
        SECURITY_HMAC_KEY: '9f8e7d6c5b4a3928172635445566778899aabbccddeeff001122334455667788',
        ADMIN_PASSWORD: 'Strong-Migrated-Admin-Password-2026!'
      } as NodeJS.ProcessEnv);

      expect(mutated).toBe(true);
      expect(state.owner.credentialVersion).toBe(2);
      expect(state.owner.passwordHash).toBeTruthy();
      expect(state.owner.passwordSalt).toBeTruthy();
      expect(state.owner.totpSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(state.owner.authenticators).toHaveLength(1);
      expect(state.owner.passkeys).toHaveLength(1);
      expect(state.owner.recoveryCodes).toHaveLength(1);
      expect(state.sessions.map((s) => s.id)).toEqual(['sess-legit-user']);
      expect(state.recruiterTokens.map((t) => t.id)).toEqual(['rt-legit-1']);
    });

    it('throws when attempting migration without a strong ADMIN_PASSWORD', () => {
      expect(() =>
        migrateStateObject(
          { owner: { id: 'usr_stratagemvx_owner_01', credentialVersion: 1 }, sessions: [], recruiterTokens: [], auditLogs: [] },
          { SECURITY_HMAC_KEY: '9f8e7d6c5b4a3928172635445566778899aabbccddeeff001122334455667788', ADMIN_PASSWORD: 'weak' } as NodeJS.ProcessEnv
        )
      ).toThrow();
    });
  });

  describe('8. WebAuthn Origin/RP ID Mismatch, Challenge Replay, and Secret Non-Disclosure', () => {
    it('rejects WebAuthn clientDataJSON origin mismatch and burns challenge against replay', async () => {
      const optionsReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/login-options',
        headers: { origin: 'https://chethankumar.dev' },
        body: {}
      });
      const optionsRes = createMockResponse();
      await handleApiRequest(optionsReq, optionsRes.res);
      expect(optionsRes.getStatusCode()).toBe(200);
      const issued = optionsRes.getJson();
      expect(issued?.rpId).toBe('chethankumar.dev');
      expect(issued?.challenge).toBeTruthy();

      // Reusing challenge from another origin must fail closed and consume challenge
      const badOriginVerifyReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/verify-login',
        headers: { origin: 'https://chethankumar.dev' },
        body: {
          response: {
            id: 'cred-1',
            response: {
              clientDataJSON: Buffer.from(
                JSON.stringify({
                  type: 'webauthn.get',
                  challenge: issued.challenge,
                  origin: 'https://phishing.example'
                })
              ).toString('base64url')
            }
          }
        }
      });
      const badOriginVerifyRes = createMockResponse();
      await handleApiRequest(badOriginVerifyReq, badOriginVerifyRes.res);
      expect(badOriginVerifyRes.getStatusCode()).toBe(403);
      expect(stateManager.isWebAuthnChallengeValid(issued.challenge, 'authentication', 'usr_stratagemvx_owner_01')).toBe(false);

      // Replaying the same challenge after consumption must also fail
      const replayReq = createMockRequest({
        method: 'POST',
        url: '/api/auth/passkey/verify-login',
        headers: { origin: 'https://chethankumar.dev' },
        body: {
          response: {
            id: 'cred-1',
            response: {
              clientDataJSON: Buffer.from(
                JSON.stringify({
                  type: 'webauthn.get',
                  challenge: issued.challenge,
                  origin: 'https://chethankumar.dev'
                })
              ).toString('base64url')
            }
          }
        }
      });
      const replayRes = createMockResponse();
      await handleApiRequest(replayReq, replayRes.res);
      expect(replayRes.getStatusCode()).toBe(400);
    });

    it('never exposes raw secrets, password hashes, TOTP seeds, or recovery codes in owner profile or session responses', async () => {
      const { sessionToken } = stateManager.createSession({
        userId: stateManager.getState().owner.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest',
        browser: 'Vitest',
        os: 'Test'
      });

      const sessionReq = createMockRequest({
        method: 'GET',
        url: '/api/auth/session',
        headers: { authorization: `Bearer ${sessionToken}` }
      });
      const sessionRes = createMockResponse();
      await handleApiRequest(sessionReq, sessionRes.res);
      expect(sessionRes.getStatusCode()).toBe(200);
      const serialized = sessionRes.getBody();
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('passwordSalt');
      expect(serialized).not.toContain('totpSecret');
      expect(serialized).not.toContain(process.env.ADMIN_PASSWORD || 'ci-only');
      expect(serialized).not.toContain(process.env.SECURITY_HMAC_KEY || 'ci-only');
      expect(sessionRes.getJson()?.profile?.authenticators?.[0]?.secret).toBeUndefined();
    });
  });
});
