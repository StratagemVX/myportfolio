import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { 
  formatIST, 
  sha256, 
  generateEmergencyRecoveryCodes, 
  generateBase32Secret,
  generateSalt,
  hashPassword,
  verifyPassword,
  signSessionToken
} from './cryptoUtils';
import { 
  maskEmail, 
  maskPhone 
} from './types';
import type { 
  OwnerSecurityProfile, 
  ActiveSession, 
  AuditLogEntry, 
  HashedRecruiterToken, 
  HashedRecoveryCode,
  EmailVerificationOTP,
  EnrolledPasskey,
  EnrolledAuthenticatorApp,
  InAppNotification,
  FCMDeviceToken
} from './types';

export function getTargetStateFile(): string {
  if (process.env.STATE_FILE_PATH) {
    return process.env.STATE_FILE_PATH;
  }
  // Check if /app/data exists (Railway persistent volume mount)
  if (fs.existsSync('/app/data')) {
    return path.join('/app', 'data', 'security-state.json');
  }
  return path.join(process.cwd(), 'server', 'security-state.json');
}

const TMP_STATE_FILE = path.join(os.tmpdir(), 'chethan-portfolio-security-state.json');

export interface InternalServerState {
  owner: {
    id: string;
    fullName: string;
    displayName: string;
    legalName?: string;
    preferredDisplayName?: string;
    professionalTitle?: string;
    location?: string;
    updatedAt?: string;
    loginUsername: string;
    loginEmail: string;
    recoveryEmail: string;
    securityMobile: string;
    mobileVerified: boolean;
    whatsappMobile: string;
    whatsappVerified: boolean;
    mfaEnforced: boolean;
    passwordHash?: string;
    credentialVersion?: number;
    passwordSalt?: string;
    totpSecret: string | null;
    totpEnrolledAt: string | null;
    authenticators: EnrolledAuthenticatorApp[];
    passkeys: EnrolledPasskey[];
    recoveryCodes: HashedRecoveryCode[];
    recoveryCodesGeneratedAt: string | null;
    fcmTokens?: FCMDeviceToken[];
    inAppNotifications?: InAppNotification[];
    notificationPreferences: {
      email: {
        successfulLogin: boolean;
        newDeviceLogin: boolean;
        passwordChanges: boolean;
        mfaChanges: boolean;
        suspiciousActivity: boolean;
      };
      sms: {
        criticalSecurityEvents: boolean;
        everySuccessfulLogin: boolean;
      };
      whatsapp: {
        criticalSecurityEvents: boolean;
        everySuccessfulLogin: boolean;
      };
    };
  };
  sessions: ActiveSession[];
  auditLogs: AuditLogEntry[];
  recruiterTokens: HashedRecruiterToken[];
}

class SecurityStateManager {
  private state: InternalServerState;
  // Ephemeral in-memory challenges (never stored to disk)
  public currentWebAuthnChallenge: string | null = null;
  public webauthnChallenges: Map<string, { challenge: string; type: 'registration' | 'authentication'; expiresAt: number; userId?: string }> = new Map();
  public pendingEmailOTP: EmailVerificationOTP | null = null;
  public pendingPhoneOTP: { codeHash: string; destination: string; expiresAt: number; channel: 'SMS' | 'WHATSAPP' } | null = null;
  public pendingEmailChange: { oldEmail: string; newEmail: string; codeHash: string; expiresAt: number; attempts: number } | null = null;
  public pendingRecoveryEmailChange: { oldEmail: string; newEmail: string; codeHash: string; expiresAt: number; attempts: number } | null = null;
  public pendingLoginChallenges: Map<string, { userId: string; expiresAt: number; primaryAuthCompleted: boolean }> = new Map();

  public saveWebAuthnChallenge(challenge: string, type: 'registration' | 'authentication', userId?: string): void {
    this.currentWebAuthnChallenge = challenge;
    const now = Date.now();
    this.webauthnChallenges.set(challenge, {
      challenge,
      type,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
      userId
    });
    // Evict expired challenges
    if (this.webauthnChallenges.size > 50) {
      for (const [k, v] of this.webauthnChallenges.entries()) {
        if (now > v.expiresAt) this.webauthnChallenges.delete(k);
      }
    }
  }

  public verifyAndConsumeWebAuthnChallenge(challenge: string, type: 'registration' | 'authentication'): boolean {
    if (!challenge) return false;
    const entry = this.webauthnChallenges.get(challenge);
    if (entry && entry.type === type && Date.now() <= entry.expiresAt) {
      this.webauthnChallenges.delete(challenge);
      if (this.currentWebAuthnChallenge === challenge) {
        this.currentWebAuthnChallenge = null;
      }
      return true;
    }
    // Reject missing, expired, mismatched-type, and replayed challenges.
    return false;
  }

  constructor() {
    this.state = this.loadState();
  }

  private getDefaultState(): InternalServerState {
    const now = new Date();
    const initialRecovery = generateEmergencyRecoveryCodes(10);
    const initialTotpSecret = generateBase32Secret();
    const salt = generateSalt();
    // Never initialize an administrator account with a source-controlled credential.
    const defaultPassword = process.env.ADMIN_PASSWORD;
    if (!defaultPassword || defaultPassword.length < 16) {
      throw new Error('ADMIN_PASSWORD must be configured with at least 16 characters before initializing owner state.');
    }
    const passwordHash = hashPassword(defaultPassword, salt);

    return {
      owner: {
        id: 'usr_stratagemvx_owner_01',
        fullName: 'Chethan Kumar B S',
        displayName: 'Karna',
        legalName: 'Chethan Kumar B S',
        preferredDisplayName: 'Karna',
        professionalTitle: 'Computer Science Engineer | AI & Intelligent Systems | Cybersecurity',
        location: 'Bengaluru, India',
        updatedAt: now.toISOString(),
        loginUsername: 'stratagem_vx',
        loginEmail: 'the.suryaputraa@gmail.com',
        recoveryEmail: 'the.suryaputraa@gmail.com',
        securityMobile: '+919380469287',
        mobileVerified: false,
        whatsappMobile: '+919380469287',
        whatsappVerified: false,
        mfaEnforced: true,
        passwordHash,
        passwordSalt: salt,
        credentialVersion: 2,
        totpSecret: initialTotpSecret,
        totpEnrolledAt: now.toISOString(),
        authenticators: [
          {
            id: 'auth-google-default',
            type: 'GOOGLE_AUTHENTICATOR',
            label: 'Google Authenticator',
            enrolledAt: now.toISOString(),
            enrolledAtIST: formatIST(now),
            lastVerifiedAt: formatIST(now),
            status: 'ENROLLED',
            secret: initialTotpSecret
          }
        ],
        passkeys: [],
        recoveryCodes: initialRecovery.hashedCodes,
        recoveryCodesGeneratedAt: now.toISOString(),
        fcmTokens: [],
        inAppNotifications: [
          {
            id: 'notif-init-01',
            timestamp: now.toISOString(),
            timestampIST: formatIST(now),
            eventType: 'SYSTEM_INITIALIZED',
            subject: 'Portfolio Security Center Active',
            headline: 'Security Center Initialized',
            details: 'Security Center initialized with mandatory multi-factor authentication policy.',
            severity: 'INFO',
            read: false,
            dismissed: false
          }
        ],
        notificationPreferences: {
          email: {
            successfulLogin: true,
            newDeviceLogin: true,
            passwordChanges: true,
            mfaChanges: true,
            suspiciousActivity: true
          },
          sms: {
            criticalSecurityEvents: true,
            everySuccessfulLogin: false
          },
          whatsapp: {
            criticalSecurityEvents: true,
            everySuccessfulLogin: false
          }
        }
      },
      sessions: [
        {
          id: 'sess-current-dev',
          sessionTokenHash: sha256('default-dev-session-token'),
          userId: 'usr_stratagemvx_owner_01',
          ipAddress: '127.0.0.1 (Local Workstation)',
          userAgent: 'Chrome on Windows 11',
          browser: 'Chrome 131.0',
          os: 'Windows 11 NT',
          createdAt: now.toISOString(),
          createdAtIST: formatIST(now),
          lastActiveAt: now.toISOString(),
          lastActiveAtIST: formatIST(now),
          expiresAt: new Date(now.getTime() + 86400000).toISOString(),
          expiresAtIST: formatIST(new Date(now.getTime() + 86400000)),
          isCurrent: true
        }
      ],
      auditLogs: [
        {
          id: 'audit-init-01',
          timestamp: now.toISOString(),
          timestampIST: formatIST(now),
          action: 'OWNER_ACCOUNT_INITIALIZED',
          category: 'SECURITY',
          status: 'SUCCESS',
          actor: 'System Initialization',
          ipAddress: '127.0.0.1',
          details: 'Owner identity established with mandatory MFA policy.'
        },
        {
          id: 'audit-init-02',
          timestamp: now.toISOString(),
          timestampIST: formatIST(now),
          action: 'MFA_POLICY_ENFORCED',
          category: 'MFA',
          status: 'SUCCESS',
          actor: 'Security Architect',
          ipAddress: '127.0.0.1',
          details: 'Multi-factor authentication (TOTP RFC 6238 / FIDO2 Passkeys) locked to mandatory for all administrative access.'
        }
      ],
      recruiterTokens: [
        {
          id: 'rt-seed-1',
          tokenHash: sha256('REC-2026-A89F-91C2-4E5B'),
          tokenPrefix: 'REC-2026-A89F••••',
          label: 'Campus Technical Recruiter Brief',
          createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
          createdAtIST: formatIST(new Date(Date.now() - 6 * 24 * 3600 * 1000)),
          expiresAt: new Date(Date.now() + 24 * 24 * 3600 * 1000).toISOString(),
          accessCount: 3,
          status: 'Active',
          lastAccessedAt: formatIST(new Date(Date.now() - 2 * 3600 * 1000))
        },
        {
          id: 'rt-seed-2',
          tokenHash: sha256('REC-2026-C42B-19D4-8F7A'),
          tokenPrefix: 'REC-2026-C42B••••',
          label: 'Staff Software Architect Review',
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          createdAtIST: formatIST(new Date(Date.now() - 3 * 24 * 3600 * 1000)),
          expiresAt: new Date(Date.now() + 27 * 24 * 3600 * 1000).toISOString(),
          accessCount: 1,
          status: 'Active',
          lastAccessedAt: formatIST(new Date(Date.now() - 14 * 3600 * 1000))
        }
      ]
    };
  }

  private loadState(): InternalServerState {
    const target = getTargetStateFile();
    const fallbackPath = path.join(process.cwd(), 'server', 'security-state.json');
    try {
      let fileToRead: string | null = null;
      if (fs.existsSync(target)) {
        fileToRead = target;
      } else if (fs.existsSync(fallbackPath)) {
        fileToRead = fallbackPath;
      } else if (fs.existsSync(TMP_STATE_FILE)) {
        fileToRead = TMP_STATE_FILE;
      }

      if (fileToRead) {
        const raw = fs.readFileSync(fileToRead, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Ensure owner password hash is initialized
        if (parsed.owner && (!parsed.owner.passwordHash || !parsed.owner.passwordSalt || parsed.owner.credentialVersion !== 2)) {
          const salt = generateSalt();
          const defaultPassword = process.env.ADMIN_PASSWORD;
          if (!defaultPassword || defaultPassword.length < 16) {
            throw new Error('ADMIN_PASSWORD must be configured with at least 16 characters to migrate owner credentials.');
          }
          parsed.owner.passwordSalt = salt;
          parsed.owner.passwordHash = hashPassword(defaultPassword, salt);
          parsed.owner.credentialVersion = 2;
        }

        // Ensure preferred display name and legal name exist
        if (parsed.owner) {
          if (!parsed.owner.preferredDisplayName) {
            parsed.owner.preferredDisplayName = parsed.owner.displayName || 'Karna';
          }
          if (!parsed.owner.legalName) {
            parsed.owner.legalName = parsed.owner.fullName || 'Chethan Kumar B S';
          }
          if (!parsed.owner.professionalTitle) {
            parsed.owner.professionalTitle = 'Computer Science Engineer | AI & Intelligent Systems | Cybersecurity';
          }
          if (!parsed.owner.location) {
            parsed.owner.location = 'Bengaluru, India';
          }
          if (!parsed.owner.inAppNotifications) {
            parsed.owner.inAppNotifications = [];
          }
          if (!parsed.owner.fcmTokens) {
            parsed.owner.fcmTokens = [];
          }
          if (!parsed.owner.passkeys) {
            parsed.owner.passkeys = [];
          }
        }

        if (!parsed.sessions) {
          parsed.sessions = [];
        }
        if (!parsed.auditLogs) {
          parsed.auditLogs = [];
        }

        // Auto-migrate authenticators array if legacy state
        if (parsed.owner && !parsed.owner.authenticators) {
          parsed.owner.authenticators = [];
          if (parsed.owner.totpSecret) {
            parsed.owner.authenticators.push({
              id: 'auth-google-migrated',
              type: 'GOOGLE_AUTHENTICATOR',
              label: 'Google Authenticator',
              enrolledAt: parsed.owner.totpEnrolledAt || new Date().toISOString(),
              enrolledAtIST: formatIST(parsed.owner.totpEnrolledAt ? new Date(parsed.owner.totpEnrolledAt) : new Date()),
              lastVerifiedAt: formatIST(new Date()),
              status: 'ENROLLED',
              secret: parsed.owner.totpSecret
            });
          }
        }
        return parsed;
      }
    } catch {
      // Fallback on error
    }
    const defaultState = this.getDefaultState();
    this.saveStateDirect(defaultState);
    return defaultState;
  }

  private saveStateDirect(stateToSave: InternalServerState) {
    const target = getTargetStateFile();
    try {
      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(target, JSON.stringify(stateToSave, null, 2));
    } catch {
      try {
        fs.writeFileSync(TMP_STATE_FILE, JSON.stringify(stateToSave, null, 2));
      } catch {
        // Silent error in strictly read-only ephemeral environments
      }
    }
  }

  public save() {
    this.saveStateDirect(this.state);
  }

  public getState(): InternalServerState {
    return this.state;
  }

  public verifyOwnerPassword(password: string): boolean {
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return false;
    }
    const o = this.state.owner;
    // Check against configured ADMIN_PASSWORD env if set
    if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
      return true;
    }
    // Check against salt & hash
    if (o.passwordHash && o.passwordSalt) {
      return verifyPassword(password, o.passwordHash, o.passwordSalt);
    }
    return false;
  }

  public setOwnerPassword(newPassword: string): void {
    const salt = generateSalt();
    const hash = hashPassword(newPassword, salt);
    this.state.owner.passwordSalt = salt;
    this.state.owner.passwordHash = hash;
    this.save();
  }

  public getOwnerProfile(): OwnerSecurityProfile {
    const hasAuth0 = Boolean(
      (process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN) && 
      !(process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN || '').includes('your-tenant')
    );
    const o = this.state.owner;

    // Filter out secrets before sending to frontend
    const sanitizedAuthenticators: EnrolledAuthenticatorApp[] = (o.authenticators || []).map(a => ({
      id: a.id,
      type: a.type,
      label: a.label,
      enrolledAt: a.enrolledAt,
      enrolledAtIST: a.enrolledAtIST,
      lastVerifiedAt: a.lastVerifiedAt,
      status: a.status
    }));

    const preferredDisplayName = o.preferredDisplayName || o.displayName || 'Karna';
    const legalName = o.legalName || o.fullName || 'Chethan Kumar B S';

    return {
      id: o.id,
      fullName: legalName,
      displayName: preferredDisplayName,
      legalName,
      preferredDisplayName,
      professionalTitle: o.professionalTitle || 'Computer Science Engineer | AI & Intelligent Systems | Cybersecurity',
      location: o.location || 'Bengaluru, India',
      updatedAt: o.updatedAt || new Date().toISOString(),
      loginUsername: o.loginUsername,
      loginEmailMasked: maskEmail(o.loginEmail),
      recoveryEmailMasked: maskEmail(o.recoveryEmail),
      securityMobileMasked: maskPhone(o.securityMobile),
      mobileVerified: o.mobileVerified,
      whatsappMobileMasked: maskPhone(o.whatsappMobile),
      whatsappVerified: o.whatsappVerified,
      mfaEnforced: o.mfaEnforced,
      authenticators: sanitizedAuthenticators,
      passkeys: this.getEnrolledPasskeys(),
      recoveryCodesCount: (o.recoveryCodes || []).filter(c => !c.used).length,
      recoveryCodesGeneratedAt: o.recoveryCodesGeneratedAt,
      notificationPreferences: o.notificationPreferences,
      auth0Configured: hasAuth0,
      auth0Domain: hasAuth0 ? (process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN || null) : null
    };
  }

  // In-App Notifications
  public addInAppNotification(notification: Omit<InAppNotification, 'id' | 'timestamp' | 'timestampIST' | 'read' | 'dismissed'>): InAppNotification {
    const now = new Date();
    const entry: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timestampIST: formatIST(now),
      createdAt: now.toISOString(),
      createdAtIST: formatIST(now),
      read: false,
      dismissed: false,
      ...notification
    };
    if (!this.state.owner.inAppNotifications) {
      this.state.owner.inAppNotifications = [];
    }
    this.state.owner.inAppNotifications.unshift(entry);
    // Keep max 50 recent notifications
    if (this.state.owner.inAppNotifications.length > 50) {
      this.state.owner.inAppNotifications = this.state.owner.inAppNotifications.slice(0, 50);
    }
    this.save();
    return entry;
  }

  public getInAppNotifications(): InAppNotification[] {
    return (this.state.owner.inAppNotifications || []).filter(n => !n.dismissed);
  }

  public markNotificationRead(id: string): boolean {
    const notifs = this.state.owner.inAppNotifications || [];
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public dismissNotification(id: string): boolean {
    const notifs = this.state.owner.inAppNotifications || [];
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.dismissed = true;
      this.save();
      return true;
    }
    return false;
  }

  public markInAppNotificationRead(id: string): boolean {
    return this.markNotificationRead(id);
  }

  public dismissInAppNotification(id: string): boolean {
    return this.dismissNotification(id);
  }

  public updateOwnerProfile(updates: Partial<{
    preferredDisplayName: string;
    legalName: string;
    displayName: string;
    fullName: string;
    professionalTitle: string;
    location: string;
  }>): OwnerSecurityProfile {
    const o = this.state.owner;
    if (updates.preferredDisplayName) {
      o.preferredDisplayName = updates.preferredDisplayName.trim();
      o.displayName = updates.preferredDisplayName.trim();
    }
    if (updates.displayName) {
      o.displayName = updates.displayName.trim();
      o.preferredDisplayName = updates.displayName.trim();
    }
    if (updates.legalName) {
      o.legalName = updates.legalName.trim();
      o.fullName = updates.legalName.trim();
    }
    if (updates.fullName) {
      o.fullName = updates.fullName.trim();
      o.legalName = updates.fullName.trim();
    }
    if (updates.professionalTitle) {
      o.professionalTitle = updates.professionalTitle.trim();
    }
    if (updates.location) {
      o.location = updates.location.trim();
    }
    o.updatedAt = new Date().toISOString();
    this.save();
    return this.getOwnerProfile();
  }

  // FCM Device Tokens
  public addFCMToken(token: string, deviceLabel: string): FCMDeviceToken {
    const now = new Date();
    if (!this.state.owner.fcmTokens) {
      this.state.owner.fcmTokens = [];
    }
    const existing = this.state.owner.fcmTokens.find(t => t.token === token);
    if (existing) {
      existing.deviceLabel = deviceLabel;
      existing.lastUsedAt = now.toISOString();
      this.save();
      return existing;
    }
    const newEntry: FCMDeviceToken = {
      token,
      deviceLabel,
      registeredAt: now.toISOString(),
      registeredAtIST: formatIST(now),
      lastUsedAt: now.toISOString()
    };
    this.state.owner.fcmTokens.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public canRemoveFactor(factorType: 'AUTHENTICATOR' | 'PASSKEY', factorId?: string): { allowed: boolean; reason?: string } {
    const o = this.state.owner;
    const activeAuthenticators = (o.authenticators || []).filter(a => a.status === 'ENROLLED' && (!factorId || a.id !== factorId));
    const activePasskeys = (o.passkeys || []).filter(p => !factorId || p.id !== factorId);

    if (factorType === 'AUTHENTICATOR') {
      if (activeAuthenticators.length === 0 && activePasskeys.length === 0) {
        return {
          allowed: false,
          reason: 'Factor Protection Policy: You cannot remove your last active Authenticator app when no Passkeys are enrolled. Enrol a Passkey or another Authenticator app before removing this factor.'
        };
      }
    }

    if (factorType === 'PASSKEY') {
      if (activePasskeys.length === 0 && activeAuthenticators.length === 0) {
        return {
          allowed: false,
          reason: 'Factor Protection Policy: You cannot remove your last Passkey when no Authenticator app is enrolled. Enrol an Authenticator app before removing this Passkey.'
        };
      }
    }

    return { allowed: true };
  }

  // Passkey Lifecycle Management
  public addPasskey(passkey: EnrolledPasskey): { success: boolean; passkey: EnrolledPasskey; duplicate: boolean } {
    if (!this.state.owner.passkeys) {
      this.state.owner.passkeys = [];
    }
    const now = new Date();
    if (!passkey.createdAt) passkey.createdAt = now.toISOString();
    if (!passkey.createdAtIST) passkey.createdAtIST = formatIST(now);
    const existing = this.state.owner.passkeys.find(p => p.id === passkey.id);
    if (existing) {
      existing.lastUsedAt = passkey.lastUsedAt || new Date().toISOString();
      existing.lastUsedAtIST = formatIST(new Date());
      if (passkey.transports) existing.transports = passkey.transports;
      if (passkey.counter !== undefined) existing.counter = passkey.counter;
      if (passkey.backedUp !== undefined) existing.backedUp = passkey.backedUp;
      if (passkey.deviceLabel) {
        existing.deviceLabel = passkey.deviceLabel;
        existing.nickname = passkey.nickname || passkey.deviceLabel;
      }
      existing.revoked = false;
      this.save();
      return { success: true, passkey: existing, duplicate: true };
    }
    this.state.owner.passkeys.push(passkey);
    this.save();
    return { success: true, passkey, duplicate: false };
  }

  public renamePasskey(id: string, newLabel: string): boolean {
    if (!this.state.owner.passkeys) return false;
    const pk = this.state.owner.passkeys.find(p => p.id === id);
    if (pk) {
      pk.deviceLabel = newLabel.trim();
      pk.nickname = newLabel.trim();
      this.save();
      return true;
    }
    return false;
  }

  public revokePasskey(id: string): { success: boolean; message: string } {
    const check = this.canRemoveFactor('PASSKEY', id);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Cannot remove last active factor.' };
    }
    if (!this.state.owner.passkeys) return { success: false, message: 'Passkey not found.' };
    const pk = this.state.owner.passkeys.find(p => p.id === id);
    if (pk) {
      pk.revoked = true;
      pk.revokedAt = new Date().toISOString();
      this.state.owner.passkeys = this.state.owner.passkeys.filter(p => p.id !== id);
      this.save();
      return { success: true, message: 'Passkey revoked successfully.' };
    }
    return { success: false, message: 'Passkey not found.' };
  }

  public touchPasskey(id: string, newCounter?: number): void {
    if (!this.state.owner.passkeys) return;
    const pk = this.state.owner.passkeys.find(p => p.id === id);
    if (pk) {
      const now = new Date();
      pk.lastUsedAt = now.toISOString();
      pk.lastUsedAtIST = formatIST(now);
      if (newCounter !== undefined && newCounter > pk.counter) {
        pk.counter = newCounter;
      }
      this.save();
    }
  }

  public getEnrolledPasskeys(): EnrolledPasskey[] {
    return (this.state.owner.passkeys || []).filter(p => !p.revoked);
  }

  // Session Lifecycle Management
  public createSession(data: { userId: string; ipAddress: string; userAgent: string; browser: string; os: string; deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET' }): { session: ActiveSession; sessionToken: string } {
    const now = new Date();
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const sessionToken = signSessionToken(sessionId, data.userId, expiresAtMs);
    const sessionTokenHash = sha256(sessionToken);

    const session: ActiveSession = {
      id: sessionId,
      sessionTokenHash,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      browser: data.browser,
      os: data.os,
      deviceType: data.deviceType || ((data.userAgent || '').toLowerCase().includes('mobile') ? 'MOBILE' : 'DESKTOP'),
      createdAt: now.toISOString(),
      createdAtIST: formatIST(now),
      lastActiveAt: now.toISOString(),
      lastActiveAtIST: formatIST(now),
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresAtIST: formatIST(new Date(expiresAtMs)),
      isCurrent: false,
      revoked: false
    };

    if (!this.state.sessions) {
      this.state.sessions = [];
    }
    this.state.sessions.unshift(session);
    if (this.state.sessions.length > 50) {
      this.state.sessions = this.state.sessions.slice(0, 50);
    }
    this.save();
    return { session, sessionToken };
  }

  public getSession(id: string): ActiveSession | null {
    if (!this.state.sessions) return null;
    return this.state.sessions.find(s => s.id === id && !s.revoked) || null;
  }

  public revokeSession(id: string): boolean {
    if (!this.state.sessions) return false;
    const session = this.state.sessions.find(s => s.id === id);
    if (session) {
      session.revoked = true;
      session.revokedAt = new Date().toISOString();
      this.state.sessions = this.state.sessions.filter(s => s.id !== id);
      this.save();
      return true;
    }
    return false;
  }

  public revokeOtherSessions(currentSessionId: string): number {
    if (!this.state.sessions) return 0;
    const initialCount = this.state.sessions.length;
    this.state.sessions = this.state.sessions.filter(s => s.id === currentSessionId);
    this.save();
    return initialCount - this.state.sessions.length;
  }

  public cleanExpiredSessions(): void {
    if (!this.state.sessions) return;
    const now = Date.now();
    this.state.sessions = this.state.sessions.filter(s => {
      if (s.revoked) return false;
      if (s.expiresAt) {
        return now <= new Date(s.expiresAt).getTime();
      }
      return now - new Date(s.createdAt).getTime() <= 24 * 60 * 60 * 1000;
    });
    this.save();
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'timestampIST'>) {
    const now = new Date();
    // Privacy protection: Mask owner email in actor and details
    let actor = entry.actor;
    if (actor && actor.includes('@')) {
      actor = maskEmail(actor);
    }
    let details = entry.details;
    if (details && details.includes('@')) {
      details = details.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match));
    }

    const log: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      timestampIST: formatIST(now),
      ...entry,
      actor,
      details
    };
    this.state.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
    this.save();
    return log;
  }
}

export const stateManager = new SecurityStateManager();
