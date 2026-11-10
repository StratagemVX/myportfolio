// Typed API client for Owner Account Security Centre & Backend API
import type { 
  OwnerSecurityProfile, 
  ActiveSession, 
  AuditLogEntry, 
  HashedRecruiterToken,
  IntegrationStatusMatrix
} from '../../server/types';

export interface ApiErrorPayload {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.details = payload.details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

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
    let res: Response;
    
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
    } catch (networkErr: unknown) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const message = isOffline
        ? 'Network offline. Please check your internet connection.'
        : 'Unable to reach authentication server. Please check your network connection.';
      console.error('[SecurityApiClient] Network failure reaching endpoint:', endpoint, networkErr);
      throw new ApiError({
        code: 'NETWORK_ERROR',
        message,
        status: 0,
        details: networkErr instanceof Error ? networkErr.message : String(networkErr)
      });
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('+json');

    // Handle empty body responses (e.g. 204 No Content)
    if (res.status === 204) {
      if (!res.ok) {
        throw new ApiError({
          code: `HTTP_${res.status}`,
          message: `Request failed with HTTP status ${res.status}`,
          status: res.status
        });
      }
      return {} as T;
    }

    let responseText = '';
    try {
      responseText = await res.text();
    } catch (readErr: unknown) {
      console.error('[SecurityApiClient] Failed to read response stream:', readErr);
      throw new ApiError({
        code: 'RESPONSE_READ_ERROR',
        message: 'Failed to read response from server.',
        status: res.status
      });
    }

    // Safely attempt JSON parsing if Content-Type indicates JSON or text appears to be JSON
    let parsedData: any = null;
    let parseSucceeded = false;
    const trimmed = responseText.trim();
    if (isJson || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsedData = JSON.parse(responseText);
        parseSucceeded = true;
      } catch (parseErr) {
        console.warn('[SecurityApiClient] Response indicated JSON but parse failed:', parseErr, responseText.slice(0, 100));
      }
    }

    // Handle non-2xx HTTP responses
    if (!res.ok) {
      let code = `HTTP_${res.status}`;
      let message = '';

      if (parseSucceeded && parsedData && typeof parsedData === 'object') {
        if (parsedData.error) {
          if (typeof parsedData.error === 'object' && parsedData.error.message) {
            message = parsedData.error.message;
            code = parsedData.error.code || code;
          } else if (typeof parsedData.error === 'string') {
            message = parsedData.error;
          }
        } else if (parsedData.message) {
          message = parsedData.message;
        }
      }

      if (!message) {
        switch (res.status) {
          case 400:
            message = 'Invalid request parameters. Please verify your input.';
            code = 'BAD_REQUEST';
            break;
          case 401:
            message = 'Authentication failed. Please verify your credentials.';
            code = 'UNAUTHORIZED';
            break;
          case 403:
            message = 'Access denied. You do not have permission to access this resource.';
            code = 'FORBIDDEN';
            break;
          case 404:
            message = 'The requested authentication endpoint could not be found. Please contact support or try again later.';
            code = 'ENDPOINT_NOT_FOUND';
            break;
          case 429:
            message = 'Too many requests. Please wait a moment and try again.';
            code = 'RATE_LIMITED';
            break;
          case 500:
            message = 'Internal server error. The authentication system encountered an issue.';
            code = 'INTERNAL_SERVER_ERROR';
            break;
          case 502:
          case 503:
          case 504:
            message = 'Authentication service is temporarily unavailable. Please retry in a few moments.';
            code = 'AUTH_SERVICE_UNAVAILABLE';
            break;
          default:
            message = `Request failed with status ${res.status}.`;
        }
      }

      console.error(`[SecurityApiClient] HTTP ${res.status} on ${endpoint}:`, {
        code,
        message,
        contentType,
        bodySnippet: responseText.slice(0, 200)
      });

      throw new ApiError({
        code,
        message,
        status: res.status,
        details: parseSucceeded ? parsedData : undefined
      });
    }

    // If HTTP status is ok, but body is not valid JSON
    if (!parseSucceeded) {
      if (trimmed.length === 0) {
        return {} as T;
      }
      console.error(`[SecurityApiClient] Successful HTTP ${res.status} but invalid JSON returned for ${endpoint}:`, responseText.slice(0, 200));
      throw new ApiError({
        code: 'INVALID_JSON_RESPONSE',
        message: 'Received an invalid response format from server.',
        status: res.status
      });
    }

    return parsedData as T;
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
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    return this.request('/api/auth/passkey/login-options', {
      method: 'POST',
      body: JSON.stringify({ origin })
    });
  }

  async verifyPasskeyLogin(challengeToken: string | null, response: any): Promise<any> {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const res = await this.request<any>('/api/auth/passkey/verify-login', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, response, origin })
    });
    if (res.sessionToken) {
      this.setSessionToken(res.sessionToken);
    }
    return res;
  }

  async checkSession(): Promise<{ authenticated: boolean; sessionId?: string; profile?: OwnerSecurityProfile }> {
    try {
      const res = await this.request<{ authenticated: boolean; sessionId?: string; profile?: OwnerSecurityProfile }>('/api/auth/session');
      return res;
    } catch {
      return { authenticated: false };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setSessionToken(null);
    }
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
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    return this.request('/api/mfa/passkey/register-options', {
      method: 'POST',
      body: JSON.stringify({ origin })
    });
  }

  async verifyPasskeyRegister(deviceLabel: string, response: any): Promise<{ success: boolean; passkeys: any[]; message: string }> {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    return this.request('/api/mfa/passkey/register-verify', {
      method: 'POST',
      body: JSON.stringify({ deviceLabel, response, origin })
    });
  }

  async revokePasskey(id: string): Promise<{ success: boolean; message: string; passkeys?: any[] }> {
    return this.request(`/api/mfa/passkey/${id}`, { method: 'DELETE' });
  }

  async renamePasskey(id: string, deviceLabel: string): Promise<{ success: boolean; message: string; passkeys?: any[] }> {
    return this.request(`/api/mfa/passkey/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ deviceLabel })
    });
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
