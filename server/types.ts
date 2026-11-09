// Enterprise Security & Identity Types for Owner Security Centre
import type { AuthenticatorTransport, CredentialDeviceType } from '@simplewebauthn/server';

// Exact Notification Delivery Status Lifecycle:
// 1. CREATED
// 2. BLOCKED_CONFIGURATION
// 3. AWAITING_RECIPIENT_VERIFICATION
// 4. AWAITING_BUSINESS_APPROVAL
// 5. PENDING_DISPATCH
// 6. DISPATCHING
// 7. ACCEPTED
// 8. QUEUED
// 9. SENT
// 10. DELIVERED
// 11. UNDELIVERED
// 12. FAILED
// 13. REJECTED
// 14. BOUNCED
// 15. UNKNOWN
export type DeliveryStatus = 
  | 'CREATED'
  | 'BLOCKED_CONFIGURATION'
  | 'AWAITING_RECIPIENT_VERIFICATION'
  | 'AWAITING_BUSINESS_APPROVAL'
  | 'PENDING_DISPATCH'
  | 'DISPATCHING'
  | 'ACCEPTED'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'UNDELIVERED'
  | 'FAILED'
  | 'REJECTED'
  | 'BOUNCED'
  | 'UNKNOWN'
  // Backward compatibility aliases for existing logs & components:
  | 'NOT_CONFIGURED'
  | 'CONFIGURATION_REQUIRED'
  | 'AWAITING_CREDENTIALS'
  | 'AWAITING_PHONE_VERIFICATION'
  | 'AWAITING_RECIPIENT_CONSENT'
  | 'READY'
  | 'SENDING'
  | 'ACCEPTED_DELIVERY_UNCONFIRMED';

export type AuthenticatorAppType = 'GOOGLE_AUTHENTICATOR' | 'MICROSOFT_AUTHENTICATOR';

export interface EnrolledAuthenticatorApp {
  id: string;
  type: AuthenticatorAppType;
  label: string;
  enrolledAt: string;
  enrolledAtIST: string;
  lastVerifiedAt: string | null;
  status: 'ENROLLED' | 'NOT_ENROLLED';
  secret?: string; // stored server-side only
}

export interface EnrolledPasskey {
  id: string; // Base64URL credential ID
  publicKey: string; // Base64URL public key
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransport[];
  deviceLabel: string;
  createdAt: string; // ISO
  lastUsedAt: string | null;
}

export interface HashedRecoveryCode {
  codeHash: string; // SHA-256
  used: boolean;
  usedAt: string | null;
}

export interface NotificationChannelPreferences {
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
}

export interface OwnerProfile {
  legalName: string;
  preferredDisplayName: string;
  professionalTitle: string;
  location?: string;
  loginEmail: string;
  recoveryEmail?: string;
  updatedAt: string;
}

export interface OwnerSecurityProfile {
  id: string;
  fullName: string;
  displayName: string;
  legalName?: string;
  preferredDisplayName?: string;
  professionalTitle?: string;
  location?: string;
  updatedAt?: string;
  loginUsername: string;
  loginEmailMasked: string; // e.g. t***@g***.com
  recoveryEmailMasked: string; // e.g. t***@g***.com
  securityMobileMasked: string; // e.g. +91 93804 •••••
  mobileVerified: boolean;
  whatsappMobileMasked: string; // e.g. +91 93804 •••••
  whatsappVerified: boolean;
  mfaEnforced: boolean;
  authenticators: EnrolledAuthenticatorApp[];
  passkeys: EnrolledPasskey[];
  recoveryCodesCount: number;
  recoveryCodesGeneratedAt: string | null;
  notificationPreferences: NotificationChannelPreferences;
  auth0Configured: boolean;
  auth0Domain: string | null;
  // Backward compatibility fields
  totpEnrolled?: boolean;
  totpEnrolledAt?: string | null;
  loginEmail?: string;
  recoveryEmail?: string;
  securityMobile?: string;
  whatsappMobile?: string;
}

export interface InAppNotification {
  id: string;
  timestamp: string;
  timestampIST: string;
  eventType: string;
  subject: string;
  headline: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  read: boolean;
  dismissed: boolean;
}

export interface FCMDeviceToken {
  token: string;
  deviceLabel: string;
  registeredAt: string;
  registeredAtIST: string;
  lastUsedAt?: string;
}

export interface ActiveSession {
  id: string;
  sessionTokenHash: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  createdAt: string;
  createdAtIST: string;
  lastActiveAt: string;
  lastActiveAtIST: string;
  isCurrent?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  timestampIST: string; // Formatted IST time (e.g. 8 Nov 2026, 00:25:30 IST)
  action: string;
  category: 'AUTH' | 'MFA' | 'PASSKEY' | 'PASSWORD' | 'SESSIONS' | 'RECRUITER_ACCESS' | 'NOTIFICATIONS' | 'SECURITY';
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  actor: string;
  ipAddress: string;
  details: string;
}

export interface HashedRecruiterToken {
  id: string;
  tokenHash: string; // SHA-256
  tokenPrefix: string; // e.g. REC-2026-A89F...
  label: string;
  createdAt: string;
  createdAtIST: string;
  expiresAt: string;
  accessCount: number;
  status: 'Active' | 'Revoked' | 'Expired';
  lastAccessedAt: string | null;
}

export interface EmailVerificationOTP {
  codeHash: string; // HMAC-SHA256
  purpose: 'PASSWORD_CHANGE' | 'EMAIL_CHANGE' | 'REAUTH' | 'PHONE_VERIFY';
  destinationMasked: string;
  expiresAt: number; // Unix timestamp ms
  attempts: number;
  lastSentAt: number;
  metadata?: Record<string, string>;
}

export interface NotificationDeliveryRecord {
  id: string; // Event ID
  timestamp: string; // ISO
  timestampIST: string; // Formatted IST (e.g. 08 Nov 2026, 01:45:00 IST)
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  destinationMasked: string;
  eventType: string;
  subject?: string;
  contentPreview: string;
  status: DeliveryStatus;
  provider: string;
  providerMessageId: string | null;
  errorCode?: string | null;
  errorInfo: string | null;
  createdAt: string; // ISO
  createdAtIST: string;
  updatedAt: string; // ISO
  updatedAtIST: string;
  idempotencyKey: string;
  operationStats?: {
    operationStatus?: string;
    total?: number;
    queued?: number;
    sent?: number;
    delivered?: number;
    undelivered?: number;
    failed?: number;
  };
  // Backward compatibility fields
  errorDetails?: string | null;
  attemptedAtIST?: string;
  confirmedAtIST?: string | null;
}

export interface TwilioTrialDiagnostic {
  isTrialAccount: boolean;
  daysRemainingApprox: number;
  accountSidConfigured: boolean;
  apiKeyConfigured: boolean;
  authTokenConfigured: boolean;
  fromNumberConfigured: boolean;
  destinationVerified: boolean;
  restrictionsNotice: string;
  whatsappSandboxConfigured: boolean;
  whatsappRecipientJoined: boolean;
}

export interface TwilioComprehensiveDiagnostics {
  account: {
    accountEmail: string; // karnashaiva81@gmail.com
    accountEmailMasked: string;
    accountSidConfigured: boolean;
    accountSidMasked: string;
    authMode: 'RESTRICTED_API_KEY' | 'ROTATED_AUTH_TOKEN' | 'NONE';
    isTrialAccount: boolean;
    status: 'AUTHENTICATED' | 'CONFIGURATION_REQUIRED' | 'INVALID_CREDENTIALS';
    connectivity: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  };
  sms: {
    senderConfigured: boolean;
    fromNumber: string;
    messagingServiceSid: string | null;
    destinationMasked: string;
    recipientVerified: boolean;
    geoPermissionsIndia: boolean;
    apiConnectivity: boolean;
    latestMessageSid: string | null;
    latestStatus: DeliveryStatus;
    deliveryConfirmation: string | null;
  };
  email: {
    provider: 'TWILIO_COMMS_EMAIL' | 'RESEND' | 'SMTP' | 'UNCONFIGURED';
    apiBaseUrl: string;
    senderConfigured: boolean;
    fromAddress: string;
    destinationMasked: string;
    latestOperationId: string | null;
    latestOperationStatus: string | null;
    deliveredCount: number;
    failedCount: number;
    queuedCount: number;
  };
  whatsapp: {
    senderConfigured: boolean;
    fromAddress: string;
    destinationMasked: string;
    isSandbox: boolean;
    sandboxJoined: boolean;
    businessApproved: boolean;
    latestMessageSid: string | null;
    latestStatus: DeliveryStatus;
  };
  missingConfiguration: string[];
}

export interface IntegrationStatusMatrix {
  auth0: {
    status: 'ACTIVE_CONNECTED' | 'AWAITING_TENANT_KEYS';
    domain: string;
    clientId?: string;
    universalLogin: boolean;
    mfaPolicy: 'MANDATORY_TOTP_WEBAUTHN';
  };
  email: {
    status: DeliveryStatus;
    provider: string;
    destinationMasked: string;
    lastAttemptedAtIST: string | null;
    lastDeliveredAtIST: string | null;
    lastFailedAtIST: string | null;
    lastProviderReference?: string | null;
    lastError?: string | null;
  };
  sms: {
    status: DeliveryStatus;
    provider: string;
    destinationMasked: string;
    verified: boolean;
    lastAttemptedAtIST: string | null;
    lastDeliveredAtIST: string | null;
    lastFailedAtIST: string | null;
    lastProviderReference?: string | null;
    lastError?: string | null;
  };
  whatsapp: {
    status: DeliveryStatus;
    provider: string;
    destinationMasked: string;
    verified: boolean;
    lastAttemptedAtIST: string | null;
    lastDeliveredAtIST: string | null;
    lastFailedAtIST: string | null;
    lastProviderReference?: string | null;
    lastError?: string | null;
  };
  webauthnFIDO2: {
    status: 'HARDWARE_PLATFORM_SUPPORTED';
    enrolledCount: number;
  };
}

// Utility functions for safe masking of PII
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 't***@g***.com';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
  const domainParts = domain.split('.');
  const namePart = domainParts[0];
  const maskedDomain = namePart.length <= 2 ? `${namePart[0]}***` : `${namePart[0]}***${namePart[namePart.length - 1]}`;
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '+91 93804 •••••';
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.length >= 10) {
    let prefix = clean.substring(0, clean.length - 5);
    if (prefix.startsWith('+91') && prefix.length > 3) {
      prefix = `+91 ${prefix.substring(3)}`;
    }
    return `${prefix} •••••`;
  }
  return phone;
}
