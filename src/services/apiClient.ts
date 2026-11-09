// Typed API client for Owner Account Security Centre & Backend API
import type { 
  OwnerSecurityProfile, 
  ActiveSession, 
  AuditLogEntry, 
  HashedRecruiterToken,
  IntegrationStatusMatrix
} from '../../server/types';

class SecurityApiClient {
  private baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  private sessionToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('owner_session_token') : null;

  public setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('owner_session_token', token);
      } else {
        localStorage.removeItem('owner_session_token');
      }
    }
  }

  public getSessionToken(): string | null {
    if (!this.sessionToken && typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('owner_session_token');
    }
    return this.sessionToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getSessionToken();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data as T;
  }

  // Health & Integration Matrix
  async getStatus(): Promise<{ status: string; timestampIST: string; matrix: IntegrationStatusMatrix }> {
    return this.request('/api/security/status');
  }

  // Profile & Identifiers
  async getProfile(): Promise<{ profile: OwnerSecurityProfile }> {
    return this.request('/api/security/profile');
  }

  async updateProfile(updates: { 
    preferredDisplayName?: string; 
    displayName?: string; 
    fullName?: string; 
    legalName?: string; 
    professionalTitle?: string; 
    location?: string;
  }): Promise<{ profile: OwnerSecurityProfile; message: string }> {
    return this.request('/api/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Authentication & MFA
  async login(identifier: string, passphrase: string): Promise<{
    requireMfa: boolean;
    challengeToken: string;
    allowedFactors: string[];
    hasPasskeys: boolean;
    message: string;
  }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, passphrase })
    });
  }

  async auth0Verify(email: string, sub?: string): Promise<{
    requireMfa: boolean;
    challengeToken: string;
    allowedFactors: string[];
    hasPasskeys: boolean;
    message: string;
  }> {
    return this.request('/api/auth/auth0-verify', {
      method: 'POST',
      body: JSON.stringify({ email, sub })
    });
  }

  async verifyTotp(challengeToken: string, totpCode: string): Promise<{
    authenticated: boolean;
    sessionToken: string;
    profile: OwnerSecurityProfile;
    message: string;
  }> {
    const res = await this.request<{
      authenticated: boolean;
      sessionToken: string;
      profile: OwnerSecurityProfile;
      message: string;
    }>('/api/auth/mfa/verify-totp', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, totpCode })
    });
    if (res.sessionToken) {
      this.setSessionToken(res.sessionToken);
    }
    return res;
  }

  async verifyRecoveryCode(challengeToken: string, recoveryCode: string): Promise<{
    authenticated: boolean;
    sessionToken: string;
    profile: OwnerSecurityProfile;
    message: string;
  }> {
    const res = await this.request<{
      authenticated: boolean;
      sessionToken: string;
      profile: OwnerSecurityProfile;
      message: string;
    }>('/api/auth/mfa/verify-recovery', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, recoveryCode })
    });
    if (res.sessionToken) {
      this.setSessionToken(res.sessionToken);
    }
    return res;
  }

  async getPasskeyLoginOptions(): Promise<any> {
    return this.request('/api/auth/passkey/login-options', { method: 'POST' });
  }

  async verifyPasskeyLogin(challengeToken: string | null, response: any): Promise<any> {
    const res = await this.request<any>('/api/auth/passkey/verify-login', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, response })
    });
    if (res.sessionToken) {
      this.setSessionToken(res.sessionToken);
    }
    return res;
  }

  async logout(): Promise<void> {
    this.setSessionToken(null);
  }

  // Account Email Management
  async requestEmailChange(newEmail: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/email/request-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail })
    });
  }

  async confirmEmailChange(code: string): Promise<{ success: boolean; profile: OwnerSecurityProfile; message: string }> {
    return this.request('/api/admin/email/confirm-change', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async requestRecoveryEmailChange(newEmail: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/recovery-email/request-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail })
    });
  }

  async confirmRecoveryEmailChange(code: string): Promise<{ success: boolean; profile: OwnerSecurityProfile; message: string }> {
    return this.request('/api/admin/recovery-email/confirm-change', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // In-App Notifications
  async getInAppNotifications(): Promise<{ notifications: any[] }> {
    return this.request('/api/notifications/in-app');
  }

  async markInAppNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request('/api/notifications/in-app/read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }

  async dismissInAppNotification(id: string): Promise<{ success: boolean }> {
    return this.request('/api/notifications/in-app/dismiss', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }

  // FCM Device Token Registration
  async registerFCMToken(token: string, deviceLabel: string): Promise<{ success: boolean }> {
    return this.request('/api/notifications/fcm/register', {
      method: 'POST',
      body: JSON.stringify({ token, deviceLabel })
    });
  }

  // Password Management
  async requestPasswordChangeOtp(): Promise<{ success: boolean; destination: string; message: string }> {
    return this.request('/api/security/password/request-otp', { method: 'POST' });
  }

  async verifyPasswordOtpAndReset(otpCode: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/security/password/verify-otp-and-reset', {
      method: 'POST',
      body: JSON.stringify({ otpCode })
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Authenticator App Enrollment
  async initTotpEnrollment(appType: 'GOOGLE_AUTHENTICATOR' | 'MICROSOFT_AUTHENTICATOR' = 'GOOGLE_AUTHENTICATOR'): Promise<{
    secret: string;
    otpAuthUri: string;
    qrCodeDataUrl: string;
    appType: string;
    appLabel: string;
    accountEmailMasked: string;
  }> {
    return this.request('/api/mfa/totp/enroll-init', { 
      method: 'POST',
      body: JSON.stringify({ appType })
    });
  }

  async confirmTotpEnrollment(secret: string, code: string, appType: 'GOOGLE_AUTHENTICATOR' | 'MICROSOFT_AUTHENTICATOR' = 'GOOGLE_AUTHENTICATOR'): Promise<{ success: boolean; authenticators: any[]; message: string }> {
    return this.request('/api/mfa/totp/enroll-confirm', {
      method: 'POST',
      body: JSON.stringify({ secret, code, appType })
    });
  }

  async removeTotpFactor(authenticatorId?: string): Promise<{ success: boolean; authenticators: any[]; message: string }> {
    return this.request('/api/mfa/totp/remove', { 
      method: 'POST',
      body: JSON.stringify({ authenticatorId })
    });
  }

  // WebAuthn Passkeys
  async getPasskeyRegisterOptions(): Promise<any> {
    return this.request('/api/mfa/passkey/register-options', { method: 'POST' });
  }

  async verifyPasskeyRegister(deviceLabel: string, response: any): Promise<{ success: boolean; passkeys: any[]; message: string }> {
    return this.request('/api/mfa/passkey/register-verify', {
      method: 'POST',
      body: JSON.stringify({ deviceLabel, response })
    });
  }

  async revokePasskey(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/mfa/passkey/${id}`, { method: 'DELETE' });
  }

  // Emergency Recovery Codes
  async generateRecoveryCodes(): Promise<{
    plaintextCodes: string[];
    generatedAtIST: string;
    message: string;
  }> {
    return this.request('/api/mfa/recovery-codes/generate', { method: 'POST' });
  }

  // Notifications
  async getNotificationPreferences(): Promise<{
    preferences: any;
    destinations: any;
    providers: any;
    recentAlerts: any[];
  }> {
    return this.request('/api/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: any): Promise<{ preferences: any; message: string }> {
    return this.request('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences })
    });
  }

  async sendTestNotification(channel: 'EMAIL' | 'SMS' | 'WHATSAPP'): Promise<{ 
    success: boolean; 
    record: any; 
    status: string; 
    provider: string; 
    providerMessageId?: string | null; 
    errorCode?: string | null;
    errorDetails?: string | null; 
    message: string; 
    instructions?: string | null; 
    trialNotice?: string | null; 
    operationStats?: any;
  }> {
    return this.request('/api/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ channel })
    });
  }

  async pollNotificationStatus(channel: 'EMAIL' | 'SMS' | 'WHATSAPP', providerMessageId: string): Promise<{
    success: boolean;
    record: any;
    timestampIST: string;
  }> {
    return this.request('/api/notifications/poll', {
      method: 'POST',
      body: JSON.stringify({ channel, providerMessageId })
    });
  }

  async getDiagnostics(): Promise<{
    diagnostics: any;
    timestampIST: string;
  }> {
    return this.request('/api/notifications/diagnostics');
  }

  async getNotificationHistory(): Promise<{ history: any[]; count: number; timestampIST: string }> {
    return this.request('/api/notifications/history');
  }

  async requestPhoneVerification(channel: 'SMS' | 'WHATSAPP'): Promise<{ success: boolean; destination: string; message: string }> {
    return this.request('/api/notifications/phone/request-verify', {
      method: 'POST',
      body: JSON.stringify({ channel })
    });
  }

  async confirmPhoneVerification(code: string, channel: 'SMS' | 'WHATSAPP'): Promise<{ success: boolean; message: string }> {
    return this.request('/api/notifications/phone/confirm-verify', {
      method: 'POST',
      body: JSON.stringify({ code, channel })
    });
  }

  // Active Sessions
  async getSessions(): Promise<{ sessions: ActiveSession[] }> {
    return this.request('/api/sessions');
  }

  async revokeSession(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/sessions/${id}`, { method: 'DELETE' });
  }

  async revokeOtherSessions(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/sessions/revoke-others', { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
    return this.request('/api/audit-logs');
  }

  // Private Recruiter Access
  async getRecruiterTokens(): Promise<{ tokens: HashedRecruiterToken[] }> {
    return this.request('/api/recruiter-tokens');
  }

  async createRecruiterToken(label: string, expiresInDays = 30): Promise<{
    rawToken: string;
    token: HashedRecruiterToken;
    message: string;
  }> {
    return this.request('/api/recruiter-tokens', {
      method: 'POST',
      body: JSON.stringify({ label, expiresInDays })
    });
  }

  async revokeRecruiterToken(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/recruiter-tokens/${id}`, { method: 'DELETE' });
  }

  async verifyRecruiterToken(token: string): Promise<{ valid: boolean; label?: string; error?: string; message?: string }> {
    return this.request('/api/recruiter-tokens/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }
}

export const apiClient = new SecurityApiClient();
