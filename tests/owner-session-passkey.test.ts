import { describe, it, expect, beforeEach } from 'vitest';
import { 
  signSessionToken, 
  verifySessionToken, 
  formatIST, 
  sha256 
} from '../server/cryptoUtils';
import { stateManager } from '../server/state';
import { 
  parseCookies, 
  extractSessionToken, 
  setSessionCookie, 
  clearSessionCookie 
} from '../server/apiHandler';

describe('Phase 8: Owner Session Management & Passkey Persistence Verification', () => {
  beforeEach(() => {
    // Reset state before tests
    stateManager.cleanExpiredSessions();
  });

  describe('1. Cryptographic Session Token Handling', () => {
    it('generates a valid HMAC-signed session token', () => {
      const sessionId = 'test-session-12345';
      const userId = 'admin-user-001';
      const expiresAt = Date.now() + 3600000; // 1 hour

      const token = signSessionToken(sessionId, userId, expiresAt);
      expect(token).toMatch(/^sess_test-session-12345\.admin-user-001\.\d+\.[a-f0-9]{64}$/);

      const verified = verifySessionToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.sessionId).toBe(sessionId);
      expect(verified.userId).toBe(userId);
      expect(verified.expiresAt).toBe(expiresAt);
    });

    it('rejects tampered session tokens', () => {
      const token = signSessionToken('sess-abc', 'user-1', Date.now() + 60000);
      const parts = token.split('.');
      // Tamper userId
      const tampered = `${parts[0]}.attacker.${parts[2]}.${parts[3]}`;
      const verified = verifySessionToken(tampered);
      expect(verified.valid).toBe(false);
    });

    it('rejects expired session tokens', () => {
      const expiredAt = Date.now() - 5000; // 5 seconds in the past
      const token = signSessionToken('sess-old', 'user-1', expiredAt);
      const verified = verifySessionToken(token);
      expect(verified.valid).toBe(false);
    });
  });

  describe('2. Cookie Utilities & HttpOnly Transmission', () => {
    it('parses cookies from header string correctly', () => {
      const cookieHeader = 'owner_session=sess_123.abc.999.sig; other_cookie=xyz';
      const cookies = parseCookies(cookieHeader);
      expect(cookies['owner_session']).toBe('sess_123.abc.999.sig');
      expect(cookies['other_cookie']).toBe('xyz');
    });

    it('extracts session token from Authorization Bearer or Cookie', () => {
      // From Bearer header
      const bearerReq: any = {
        headers: { authorization: 'Bearer sess_from_bearer' }
      };
      expect(extractSessionToken(bearerReq)).toBe('sess_from_bearer');

      // From Cookie
      const cookieReq: any = {
        headers: { cookie: 'owner_session=sess_from_cookie' }
      };
      expect(extractSessionToken(cookieReq)).toBe('sess_from_cookie');
    });

    it('formats secure HttpOnly session cookie properly', () => {
      const cookieStr = setSessionCookie(undefined, 'sess_test_token', 86400);
      expect(cookieStr).toContain('owner_session=sess_test_token');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('SameSite=Lax');
      expect(cookieStr).toContain('Path=/');
    });

    it('formats clear session cookie properly on logout', () => {
      const clearStr = clearSessionCookie();
      expect(clearStr).toContain('owner_session=;');
      expect(clearStr).toContain('Max-Age=0');
      expect(clearStr).toContain('HttpOnly');
    });
  });

  describe('3. Active Device Sessions (Fixing False "THIS DEVICE" Badges)', () => {
    it('creates distinct sessions for separate logins and identifies current session dynamically', () => {
      const { session: s1 } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '103.20.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        browser: 'Chrome 124',
        os: 'Windows 11',
        deviceType: 'DESKTOP'
      });

      const { session: s2 } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '103.20.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/605.1.15',
        browser: 'Safari Mobile',
        os: 'iOS 17',
        deviceType: 'MOBILE'
      });

      expect(s1.id).not.toBe(s2.id);

      // Verify dynamic isCurrent evaluation
      const allSessions = stateManager.getState().sessions;
      const currentId = s1.id;
      const evaluated = allSessions.map(s => ({
        ...s,
        isCurrent: s.id === currentId
      }));

      const currentMatches = evaluated.filter(s => s.isCurrent);
      expect(currentMatches.length).toBe(1);
      expect(currentMatches[0].id).toBe(s1.id);
      expect(evaluated.find(s => s.id === s2.id)?.isCurrent).toBe(false);
    });

    it('revokes a specific session server-side', () => {
      const { session } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox Linux',
        browser: 'Firefox',
        os: 'Linux'
      });
      expect(stateManager.getSession(session.id)).not.toBeNull();

      const revoked = stateManager.revokeSession(session.id);
      expect(revoked).toBe(true);
      expect(stateManager.getSession(session.id)).toBeNull();
    });

    it('supports sign out of all other sessions preserving the current session', () => {
      const { session: current } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '1.1.1.1',
        userAgent: 'Chrome Windows',
        browser: 'Chrome',
        os: 'Windows'
      });
      const { session: other1 } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '2.2.2.2',
        userAgent: 'Other Laptop',
        browser: 'Chrome',
        os: 'Windows'
      });
      const { session: other2 } = stateManager.createSession({
        userId: 'admin-1',
        ipAddress: '3.3.3.3',
        userAgent: 'Other Phone',
        browser: 'Safari',
        os: 'iOS'
      });

      const count = stateManager.revokeOtherSessions(current.id);
      expect(count).toBeGreaterThanOrEqual(2);

      expect(stateManager.getSession(current.id)).not.toBeNull();
      expect(stateManager.getSession(other1.id)).toBeNull();
      expect(stateManager.getSession(other2.id)).toBeNull();
    });
  });

  describe('4. Permanent Mobile Passkey Registration & Persistence', () => {
    it('registers and retains passkeys with metadata without duplicating', () => {
      const credId = 'cred_android_pixel_fingerprint_001';
      const added = stateManager.addPasskey({
        id: credId,
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...',
        counter: 0,
        deviceLabel: 'Google Pixel 8 Fingerprint',
        nickname: 'Pixel 8',
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
        transports: ['internal', 'hybrid'],
        createdAt: new Date().toISOString()
      });

      expect(added.passkey.id).toBe(credId);
      expect(added.passkey.deviceLabel).toBe('Google Pixel 8 Fingerprint');
      expect(added.passkey.createdAtIST).toContain('IST');

      // Verify passkey is present in active passkeys list
      const passkeys = stateManager.getEnrolledPasskeys();
      const found = passkeys.find(p => p.id === credId);
      expect(found).toBeDefined();
      expect(found?.deviceLabel).toBe('Google Pixel 8 Fingerprint');

      // Add with same ID to simulate repeated registration -> updates and preserves single entry
      stateManager.addPasskey({
        id: credId,
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...',
        counter: 1,
        deviceLabel: 'Google Pixel 8 Updated'
      });

      const updatedList = stateManager.getEnrolledPasskeys().filter(p => p.id === credId);
      expect(updatedList.length).toBe(1);
      expect(updatedList[0].deviceLabel).toBe('Google Pixel 8 Updated');
    });

    it('allows owner to rename a registered passkey', () => {
      const credId = 'cred_iphone_faceid_002';
      stateManager.addPasskey({
        id: credId,
        publicKey: 'pubkey_bytes_002',
        counter: 0,
        deviceLabel: 'iPhone 15'
      });

      const renamed = stateManager.renamePasskey(credId, 'Personal iPhone 15 Pro (Face ID)');
      expect(renamed).toBe(true);

      const passkeys = stateManager.getEnrolledPasskeys();
      const p = passkeys.find(x => x.id === credId);
      expect(p?.deviceLabel).toBe('Personal iPhone 15 Pro (Face ID)');
      expect(p?.nickname).toBe('Personal iPhone 15 Pro (Face ID)');
    });

    it('updates last-used timestamp and counter on passkey login verification', () => {
      const credId = 'cred_yubikey_003';
      stateManager.addPasskey({
        id: credId,
        publicKey: 'pubkey_bytes_003',
        counter: 5,
        deviceLabel: 'YubiKey 5C NFC'
      });

      stateManager.touchPasskey(credId, 6);

      const passkeys = stateManager.getEnrolledPasskeys();
      const p = passkeys.find(x => x.id === credId);
      expect(p?.counter).toBe(6);
      expect(p?.lastUsedAt).toBeDefined();
      expect(p?.lastUsedAtIST).toContain('IST');
    });

    it('revokes a registered passkey properly', () => {
      const credId = 'cred_old_laptop_004';
      stateManager.addPasskey({
        id: credId,
        publicKey: 'pubkey_bytes_004',
        counter: 0,
        deviceLabel: 'Old Laptop Windows Hello'
      });

      const res = stateManager.revokePasskey(credId);
      expect(res.success).toBe(true);

      const active = stateManager.getEnrolledPasskeys();
      expect(active.some(p => p.id === credId)).toBe(false);
    });
  });

  describe('5. Security Audit Log Email Privacy & IST Timestamps', () => {
    it('masks owner email in audit log actor and details', () => {
      stateManager.addAuditLog({
        action: 'PRIMARY_CREDENTIALS_VERIFIED',
        category: 'AUTH',
        status: 'SUCCESS',
        actor: 'the.suryaputraa@gmail.com',
        details: 'Owner logged in with login email the.suryaputraa@gmail.com from verified device.'
      });

      const logs = stateManager.getState().auditLogs;
      const latest = logs[0];

      expect(latest.actor).not.toBe('the.suryaputraa@gmail.com');
      expect(latest.actor).toContain('***');
      expect(latest.details).not.toContain('the.suryaputraa@gmail.com');
      expect(latest.timestampIST).toContain('IST');
      expect(latest.id).toBeDefined();
    });
  });

  describe('6. Notification Engine Date Safety & Idempotency', () => {
    it('formats IST timestamps safely without ever returning NaN or Invalid Date', () => {
      expect(formatIST(new Date())).toContain('IST');
      expect(formatIST('2026-11-10T11:42:53.000Z')).toContain('IST');
      expect(formatIST(Date.now())).toContain('IST');
      expect(formatIST(null)).not.toContain('Invalid Date');
      expect(formatIST(undefined)).not.toContain('Invalid Date');
      expect(formatIST('')).not.toContain('Invalid Date');
      expect(formatIST('invalid-string-123')).not.toContain('Invalid Date');
    });

    it('attaches valid createdAt and createdAtIST to in-app notifications', () => {
      stateManager.addInAppNotification({
        eventType: 'TEST_LOGIN_NOTIFICATION',
        headline: 'Console Access Authenticated',
        details: 'Successful owner login from test runner.',
        severity: 'INFO'
      });

      const notifs = stateManager.getInAppNotifications();
      const latest = notifs[0];

      expect(latest.createdAt).toBeDefined();
      expect(new Date(latest.createdAt).toString()).not.toBe('Invalid Date');
      expect(latest.createdAtIST).toContain('IST');
      expect(latest.headline).toBe('Console Access Authenticated');
    });
  });
});
