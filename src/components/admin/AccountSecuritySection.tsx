import { useState, useEffect, FormEvent } from 'react';
import { 
  User, 
  Key, 
  ShieldCheck, 
  Smartphone, 
  Fingerprint, 
  FileKey, 
  Bell, 
  Monitor, 
  Activity, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Send,
  Check
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useProfile } from '../../context/ProfileContext';
import type { 
  OwnerSecurityProfile, 
  ActiveSession, 
  AuditLogEntry,
  AuthenticatorAppType,
  DeliveryStatus
} from '../../../server/types';
import { startRegistration } from '@simplewebauthn/browser';

type SecurityTab = 
  | 'profile' 
  | 'identifier' 
  | 'password' 
  | 'mfa' 
  | 'authenticator' 
  | 'passkeys' 
  | 'recovery' 
  | 'notifications' 
  | 'sessions' 
  | 'activity';

interface Props {
  initialProfile: OwnerSecurityProfile;
  onProfileUpdated: (p: OwnerSecurityProfile) => void;
}

export default function AccountSecuritySection({ initialProfile, onProfileUpdated }: Props) {
  const { refreshProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<SecurityTab>('profile');
  const [profile, setProfile] = useState<OwnerSecurityProfile>(initialProfile);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [inAppNotifications, setInAppNotifications] = useState<any[]>([]);

  // Status & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal / Flow States
  // 1. Display Name & Profile Update
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName || profile.preferredDisplayName || 'Karna');
  const [editFullName, setEditFullName] = useState(profile.fullName || profile.legalName || 'Chethan Kumar B S');
  const [editTitle, setEditTitle] = useState(profile.professionalTitle || 'Computer Science Engineer');
  const [editLocation, setEditLocation] = useState(profile.location || 'Bengaluru, India');

  // Email Change Flow
  const [emailChangeStep, setEmailChangeStep] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [newLoginEmail, setNewLoginEmail] = useState('');
  const [emailChangeOtp, setEmailChangeOtp] = useState('');

  // Recovery Email Change Flow
  const [recoveryEmailStep, setRecoveryEmailStep] = useState<'IDLE' | 'OTP_SENT'>('IDLE');
  const [newRecoveryEmailInput, setNewRecoveryEmailInput] = useState('');
  const [recoveryEmailOtp, setRecoveryEmailOtp] = useState('');

  // 2. Password Change OTP Flow
  const [passwordOtpStep, setPasswordOtpStep] = useState<'IDLE' | 'OTP_SENT' | 'COMPLETED'>('IDLE');
  const [passwordOtpCode, setPasswordOtpCode] = useState('');

  // 3. Authenticator Enrollment Flow
  const [selectedAppType, setSelectedAppType] = useState<AuthenticatorAppType>('GOOGLE_AUTHENTICATOR');
  const [totpEnrollData, setTotpEnrollData] = useState<{ 
    secret: string; 
    qrCodeDataUrl: string; 
    appType: AuthenticatorAppType; 
    appLabel: string;
  } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // 4. Passkey Enrollment
  const [passkeyLabel, setPasskeyLabel] = useState('Windows Hello / Biometric');

  // 5. Emergency Recovery Codes Reveal
  const [revealedCodes, setRevealedCodes] = useState<string[] | null>(null);

  // 6. Phone Verification Flow (SMS / WhatsApp)
  const [phoneVerifyChannel, setPhoneVerifyChannel] = useState<'SMS' | 'WHATSAPP' | null>(null);
  const [phoneVerifyCode, setPhoneVerifyCode] = useState('');

  // 7. Audit log filter
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // 8. Test Notification Diagnostic Result
  const [testResult, setTestResult] = useState<{
    channel: string;
    success: boolean;
    status: string;
    provider: string;
    providerMessageId?: string | null;
    errorCode?: string | null;
    errorDetails?: string | null;
    message: string;
    instructions?: string | null;
    trialNotice?: string | null;
    operationStats?: any;
  } | null>(null);

  useEffect(() => {
    loadSessions();
    loadAuditLogs();
    loadNotificationPrefs();
    loadNotificationHistory();
    loadInAppNotifications();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 8000);
  };

  const loadSessions = async () => {
    try {
      const res = await apiClient.getSessions();
      setSessions(res.sessions);
    } catch {
      // Error loading sessions
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await apiClient.getAuditLogs();
      setAuditLogs(res.logs);
    } catch {
      // Error loading logs
    }
  };

  const loadNotificationPrefs = async () => {
    try {
      const res = await apiClient.getNotificationPreferences();
      setNotificationData(res);
    } catch {
      // Error loading prefs
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const res = await apiClient.getNotificationHistory();
      setNotificationHistory(res.history);
    } catch {
      // Error loading history
    }
  };

  const loadInAppNotifications = async () => {
    try {
      const res = await apiClient.getInAppNotifications();
      setInAppNotifications(res.notifications || []);
    } catch {
      // Error loading in-app notifications
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiClient.markInAppNotificationRead(id);
      setInAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await apiClient.dismissInAppNotification(id);
      setInAppNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.updateProfile({
        displayName: editDisplayName.trim(),
        fullName: editFullName.trim(),
        preferredDisplayName: editDisplayName.trim(),
        legalName: editFullName.trim(),
        professionalTitle: editTitle.trim(),
        location: editLocation.trim()
      });
      setProfile(res.profile);
      onProfileUpdated(res.profile);
      await refreshProfile();
      showFeedback('success', 'Owner profile updated successfully. Dynamic branding synchronized.');
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Login Email Change Flow Handlers
  const handleRequestEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLoginEmail.trim() || !newLoginEmail.includes('@')) {
      showFeedback('error', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.requestEmailChange(newLoginEmail.trim());
      setEmailChangeStep('OTP_SENT');
      showFeedback('success', res.message);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailChangeOtp.trim() || emailChangeOtp.trim().length !== 6) {
      showFeedback('error', 'Please enter the 6-digit confirmation code.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.confirmEmailChange(emailChangeOtp.trim());
      setEmailChangeStep('IDLE');
      setNewLoginEmail('');
      setEmailChangeOtp('');
      setProfile(res.profile);
      onProfileUpdated(res.profile);
      showFeedback('success', res.message);
      loadSessions();
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Recovery Email Change Flow Handlers
  const handleRequestRecoveryEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRecoveryEmailInput.trim() || !newRecoveryEmailInput.includes('@')) {
      showFeedback('error', 'Please enter a valid recovery email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.requestRecoveryEmailChange(newRecoveryEmailInput.trim());
      setRecoveryEmailStep('OTP_SENT');
      showFeedback('success', res.message);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRecoveryEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!recoveryEmailOtp.trim() || recoveryEmailOtp.trim().length !== 6) {
      showFeedback('error', 'Please enter the 6-digit confirmation code.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.confirmRecoveryEmailChange(recoveryEmailOtp.trim());
      setRecoveryEmailStep('IDLE');
      setNewRecoveryEmailInput('');
      setRecoveryEmailOtp('');
      setProfile(res.profile);
      onProfileUpdated(res.profile);
      showFeedback('success', res.message);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Password Change Step 1: Request Email OTP
  const handleRequestPasswordOtp = async () => {
    setLoading(true);
    try {
      const res = await apiClient.requestPasswordChangeOtp();
      setPasswordOtpStep('OTP_SENT');
      showFeedback('success', res.message);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Password Change Step 2: Verify Email OTP and trigger Auth0 reset
  const handleVerifyPasswordOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.verifyPasswordOtpAndReset(passwordOtpCode.trim());
      setPasswordOtpStep('COMPLETED');
      showFeedback('success', res.message);
      loadSessions();
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Authenticator App Enrollment: Step 1 (Init)
  const handleInitTotpEnroll = async (appType: AuthenticatorAppType = 'GOOGLE_AUTHENTICATOR') => {
    setSelectedAppType(appType);
    setLoading(true);
    try {
      const res = await apiClient.initTotpEnrollment(appType);
      setTotpEnrollData({
        secret: res.secret,
        qrCodeDataUrl: res.qrCodeDataUrl,
        appType: res.appType as AuthenticatorAppType,
        appLabel: res.appLabel
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Authenticator App Enrollment: Step 2 (Confirm)
  const handleConfirmTotpEnroll = async (e: FormEvent) => {
    e.preventDefault();
    if (!totpEnrollData) return;
    setLoading(true);
    try {
      const res = await apiClient.confirmTotpEnrollment(totpEnrollData.secret, totpVerifyCode.trim(), selectedAppType);
      showFeedback('success', res.message);
      setTotpEnrollData(null);
      setTotpVerifyCode('');
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Authenticator App: Remove Factor with Protection Check
  const handleRemoveTotp = async (authenticatorId?: string) => {
    // Client-side quick check
    const activeAuthenticators = (profile.authenticators || []).filter(a => a.status === 'ENROLLED');
    const hasPasskeys = (profile.passkeys || []).length > 0;
    if (activeAuthenticators.length <= 1 && !hasPasskeys) {
      alert('Factor Protection Policy: You cannot remove your last active Authenticator app when no Passkeys are enrolled. Enrol a Passkey or another Authenticator app first.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this Authenticator app? You must maintain at least one active secondary factor.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.removeTotpFactor(authenticatorId);
      showFeedback('success', res.message);
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Passkey Enrollment via WebAuthn
  const handleEnrollPasskey = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const options = await apiClient.getPasskeyRegisterOptions();
      if (options && typeof window !== 'undefined' && window.location.hostname) {
        const clientHostname = window.location.hostname;
        if (clientHostname !== 'localhost') {
          if (options.rpId) options.rpId = clientHostname;
          if (options.rp?.id) options.rp.id = clientHostname;
        }
      }
      const regResp = await startRegistration({ optionsJSON: options });
      const res = await apiClient.verifyPasskeyRegister(passkeyLabel, regResp);
      showFeedback('success', res.message);
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Revoke Passkey
  const handleRevokePasskey = async (id: string) => {
    const hasAuthenticators = (profile.authenticators || []).some(a => a.status === 'ENROLLED');
    const remainingPasskeys = profile.passkeys.filter(p => p.id !== id);
    if (!hasAuthenticators && remainingPasskeys.length === 0) {
      alert('Factor Protection Policy: You cannot revoke your last active Passkey when no Authenticator app is enrolled.');
      return;
    }

    if (!window.confirm('Revoke this hardware passkey? You will no longer be able to authenticate with this biometric device.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.revokePasskey(id);
      showFeedback('success', res.message);
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Generate Emergency Recovery Codes
  const handleGenerateRecoveryCodes = async () => {
    if (!window.confirm('Generating new emergency recovery codes will invalidate all previously generated codes. Proceed?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.generateRecoveryCodes();
      setRevealedCodes(res.plaintextCodes);
      showFeedback('success', res.message);
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Notifications: Toggle Preferences
  const handleTogglePref = async (channel: 'email' | 'sms' | 'whatsapp', key: string) => {
    if (!notificationData) return;
    const currentVal = notificationData.preferences[channel][key];
    const updated = {
      ...notificationData.preferences,
      [channel]: {
        ...notificationData.preferences[channel],
        [key]: !currentVal
      }
    };
    try {
      await apiClient.updateNotificationPreferences(updated);
      setNotificationData({
        ...notificationData,
        preferences: updated
      });
      showFeedback('success', 'Notification preferences saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    }
  };

  // Notifications: Test Channel
  const handleTestNotification = async (channel: 'EMAIL' | 'SMS' | 'WHATSAPP') => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await apiClient.sendTestNotification(channel);
      setTestResult({
        channel,
        success: res.success,
        status: res.status,
        provider: res.provider,
        providerMessageId: res.providerMessageId || null,
        errorCode: res.errorCode || null,
        errorDetails: res.errorDetails || null,
        message: res.message,
        instructions: res.instructions || null,
        trialNotice: res.trialNotice || null,
        operationStats: res.operationStats || null
      });
      loadNotificationPrefs();
      loadNotificationHistory();
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Real-Time Bounded Poller for Twilio SMS / WhatsApp message or Email operation
  const handlePollStatus = async () => {
    if (!testResult?.providerMessageId || !testResult?.channel) return;
    setLoading(true);
    try {
      const res = await apiClient.pollNotificationStatus(testResult.channel as any, testResult.providerMessageId);
      if (res.record) {
        setTestResult(prev => prev ? ({
          ...prev,
          status: res.record.status,
          errorCode: res.record.errorCode || prev.errorCode,
          errorDetails: res.record.errorInfo || prev.errorDetails,
          operationStats: res.record.operationStats || prev.operationStats
        }) : null);
        loadNotificationPrefs();
        loadNotificationHistory();
        showFeedback('success', `Status refreshed: ${res.record.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Notifications: Request Phone Verification
  const handleRequestPhoneVerify = async (channel: 'SMS' | 'WHATSAPP') => {
    setLoading(true);
    try {
      const res = await apiClient.requestPhoneVerification(channel);
      setPhoneVerifyChannel(channel);
      showFeedback('success', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Notifications: Confirm Phone Verification
  const handleConfirmPhoneVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneVerifyChannel) return;
    setLoading(true);
    try {
      const res = await apiClient.confirmPhoneVerification(phoneVerifyCode.trim(), phoneVerifyChannel);
      showFeedback('success', res.message);
      setPhoneVerifyChannel(null);
      setPhoneVerifyCode('');
      loadNotificationPrefs();
      const p = await apiClient.getProfile();
      setProfile(p.profile);
      onProfileUpdated(p.profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Sessions: Revoke Single Session
  const handleRevokeSession = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiClient.revokeSession(id);
      showFeedback('success', res.message);
      loadSessions();
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Sessions: Revoke All Other Sessions
  const handleRevokeOthers = async () => {
    if (!window.confirm('Sign out of all other active browser sessions? Only this current workstation session will remain valid.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.revokeOtherSessions();
      showFeedback('success', res.message);
      loadSessions();
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.category === logFilter;
  });

  // Helper to render delivery status badges adhering strictly to Part 8 lifecycle
  const renderStatusBadge = (status: DeliveryStatus | string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40 tracking-wider">
            DELIVERED
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/30 text-sky-300 border border-sky-500/30 tracking-wider">
            SENT — AWAITING DELIVERY
          </span>
        );
      case 'QUEUED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/30 text-amber-300 border border-amber-500/30 tracking-wider">
            QUEUED
          </span>
        );
      case 'ACCEPTED':
      case 'ACCEPTED_DELIVERY_UNCONFIRMED':
      case 'READY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/30 text-cyan-300 border border-cyan-500/30 tracking-wider">
            ACCEPTED — UNCONFIRMED
          </span>
        );
      case 'DISPATCHING':
      case 'SENDING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/40 text-cyan-200 border border-cyan-400/40 animate-pulse tracking-wider">
            DISPATCHING...
          </span>
        );
      case 'PENDING_DISPATCH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/30 text-sky-300 border border-sky-500/30 tracking-wider">
            PENDING DISPATCH
          </span>
        );
      case 'CREATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22252C] text-[#A4A8AE] border border-[rgba(255,255,255,0.08)] tracking-wider">
            CREATED
          </span>
        );
      case 'BLOCKED_CONFIGURATION':
      case 'CONFIGURATION_REQUIRED':
      case 'NOT_CONFIGURED':
      case 'AWAITING_CREDENTIALS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/30 text-amber-300 border border-amber-500/30 tracking-wider">
            BLOCKED — CONFIG REQUIRED
          </span>
        );
      case 'AWAITING_RECIPIENT_VERIFICATION':
      case 'AWAITING_PHONE_VERIFICATION':
      case 'AWAITING_RECIPIENT_CONSENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/40 text-amber-200 border border-amber-400/40 tracking-wider">
            AWAITING RECIPIENT VERIFY
          </span>
        );
      case 'AWAITING_BUSINESS_APPROVAL':
      case 'PENDING_BUSINESS_APPROVAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/30 text-indigo-300 border border-indigo-500/30 tracking-wider">
            AWAITING BUSINESS APPROVAL
          </span>
        );
      case 'BOUNCED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/30 text-rose-400 border border-rose-500/30 tracking-wider">
            BOUNCED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/30 text-orange-400 border border-orange-500/30 tracking-wider">
            REJECTED
          </span>
        );
      case 'UNDELIVERED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/30 text-red-400 border border-red-500/30 tracking-wider">
            UNDELIVERED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/30 text-red-400 border border-red-500/30 tracking-wider">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22252C] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]">
            {status}
          </span>
        );
    }
  };

  const enrolledGoogle = (profile.authenticators || []).find(a => a.type === 'GOOGLE_AUTHENTICATOR' && a.status === 'ENROLLED');
  const enrolledMicrosoft = (profile.authenticators || []).find(a => a.type === 'MICROSOFT_AUTHENTICATOR' && a.status === 'ENROLLED');
  const hasAnyAuthenticator = Boolean(enrolledGoogle || enrolledMicrosoft);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div 
          className={`p-4 rounded-lg text-xs flex items-center space-x-2 border ${
            feedback.type === 'success' 
              ? 'bg-[#181A1F] text-[#A8B8A7] border-[#A8B8A7]/40' 
              : 'bg-red-950/30 text-red-400 border-red-500/40'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-2 overflow-x-auto">
        <div className="flex space-x-2 min-w-max text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'profile' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Owner Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('identifier')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'identifier' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Login Identifier</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'password' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Password Management</span>
          </button>

          <button
            onClick={() => setActiveTab('mfa')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'mfa' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Two-Factor Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('authenticator')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'authenticator' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Authenticator Apps</span>
          </button>

          <button
            onClick={() => setActiveTab('passkeys')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'passkeys' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Passkeys & FIDO2</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'recovery' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <FileKey className="w-3.5 h-3.5" />
            <span>Recovery Methods</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'notifications' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'sessions' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Active Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === 'activity' ? 'bg-[#22252C] text-[#F0F0ED] font-medium border border-[rgba(255,255,255,0.08)]' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Security Activity</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OWNER PROFILE
      ========================================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Owner Profile Administration</h3>
            <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
              Manage your verified digital identity attributes and public display presentation.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[#A4A8AE] mb-1.5">Official Legal Name</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
              <span className="text-[11px] text-[#A4A8AE] mt-1 block">Full legal name for academic and verified credentials.</span>
            </div>

            <div>
              <label className="block text-[#A4A8AE] mb-1.5">Preferred Professional Display Name</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
              <span className="text-[11px] text-[#A4A8AE] mt-1 block">Renders across portfolio navigation and case study author lines.</span>
            </div>

            <div>
              <label className="block text-[#A4A8AE] mb-1.5">Professional Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
              <span className="text-[11px] text-[#A4A8AE] mt-1 block">Engineering headline displayed in navigation and recruiter brief.</span>
            </div>

            <div>
              <label className="block text-[#A4A8AE] mb-1.5">Primary Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
              <span className="text-[11px] text-[#A4A8AE] mt-1 block">Location displayed across portfolio and documentation.</span>
            </div>

            <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded space-y-1">
              <span className="text-[10px] text-[#A4A8AE]">VERIFIED LOGIN IDENTITY</span>
              <p className="font-mono text-sm text-[#A8B8A7]">{profile.loginEmailMasked}</p>
              <span className="text-[10px] text-[#6E727A]">Masked for defense-in-depth privacy.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
              >
                {loading ? 'SAVING PROFILE...' : 'SAVE PROFILE CHANGES'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LOGIN IDENTIFIER MANAGEMENT
      ========================================================================== */}
      {activeTab === 'identifier' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Account Identifiers & Recovery Addresses</h3>
            <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
              Clear distinction between login username, login email, and verified recovery destinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2">
              <span className="text-[#A8B8A7] font-semibold text-[11px]">PRIMARY LOGIN EMAIL</span>
              <p className="text-[#F0F0ED] font-mono text-base">{profile.loginEmailMasked}</p>
              <p className="text-[#A4A8AE] text-[11px]">
                Primary identity utilized for Auth0 Universal Login and administrative access.
              </p>
              <div className="inline-flex items-center space-x-1.5 text-[10px] text-[#A8B8A7] bg-[#A8B8A7]/10 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Owner Address</span>
              </div>
            </div>

            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2">
              <span className="text-[#A8B8A7] font-semibold text-[11px]">TRUSTED RECOVERY EMAIL</span>
              <p className="text-[#F0F0ED] font-mono text-base">{profile.recoveryEmailMasked}</p>
              <p className="text-[#A4A8AE] text-[11px]">
                Delivers out-of-band security alerts, one-time OTP codes, and password recovery tickets. Kept strictly isolated from standard edits.
              </p>
              <div className="inline-flex items-center space-x-1.5 text-[10px] text-[#A8B8A7] bg-[#A8B8A7]/10 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Out-Of-Band Channel</span>
              </div>
            </div>
          </div>

          {/* Explicit Change Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            {/* 1. Change Primary Login Email */}
            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-4">
              <span className="text-[#F0F0ED] font-semibold text-xs flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#A8B8A7]" />
                <span>UPDATE PRIMARY LOGIN EMAIL</span>
              </span>

              {emailChangeStep === 'IDLE' ? (
                <form onSubmit={handleRequestEmailChange} className="space-y-3">
                  <p className="text-[#A4A8AE] text-[11px]">
                    Enter new primary email address. A 6-digit confirmation code will be dispatched to verify mailbox ownership.
                  </p>
                  <input
                    type="email"
                    value={newLoginEmail}
                    onChange={(e) => setNewLoginEmail(e.target.value)}
                    placeholder="new.email@example.com"
                    className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-xs text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newLoginEmail.trim()}
                    className="w-full py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'REQUESTING CODE...' : 'REQUEST CONFIRMATION CODE'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailChange} className="space-y-3">
                  <p className="text-[#A8B8A7] text-[11px]">
                    Confirmation code sent to <strong className="text-[#F0F0ED]">{newLoginEmail}</strong>. Valid for 10 minutes.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailChangeOtp}
                    onChange={(e) => setEmailChangeOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-center text-lg tracking-[0.2em] font-mono text-[#A8B8A7] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={loading || emailChangeOtp.length !== 6}
                      className="flex-1 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                    >
                      {loading ? 'CONFIRMING...' : 'CONFIRM UPDATE'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailChangeStep('IDLE')}
                      className="px-3 py-2 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 2. Change Trusted Recovery Email */}
            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-4">
              <span className="text-[#F0F0ED] font-semibold text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
                <span>UPDATE TRUSTED RECOVERY EMAIL</span>
              </span>

              {recoveryEmailStep === 'IDLE' ? (
                <form onSubmit={handleRequestRecoveryEmailChange} className="space-y-3">
                  <p className="text-[#A4A8AE] text-[11px]">
                    Enter new trusted recovery destination. A 6-digit confirmation code will be dispatched to verify delivery.
                  </p>
                  <input
                    type="email"
                    value={newRecoveryEmailInput}
                    onChange={(e) => setNewRecoveryEmailInput(e.target.value)}
                    placeholder="recovery.email@example.com"
                    className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-xs text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newRecoveryEmailInput.trim()}
                    className="w-full py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'REQUESTING CODE...' : 'REQUEST CONFIRMATION CODE'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmRecoveryEmailChange} className="space-y-3">
                  <p className="text-[#A8B8A7] text-[11px]">
                    Confirmation code sent to <strong className="text-[#F0F0ED]">{newRecoveryEmailInput}</strong>. Valid for 10 minutes.
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={recoveryEmailOtp}
                    onChange={(e) => setRecoveryEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-center text-lg tracking-[0.2em] font-mono text-[#A8B8A7] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={loading || recoveryEmailOtp.length !== 6}
                      className="flex-1 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                    >
                      {loading ? 'CONFIRMING...' : 'CONFIRM UPDATE'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryEmailStep('IDLE')}
                      className="px-3 py-2 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2 text-[11px] text-[#A4A8AE]">
            <span className="text-[#F0F0ED] font-semibold">Login Identifier Modification Protocol:</span>
            <p>
              To change your login email address, enterprise security policy requires: (1) An active authenticated session under 15 minutes old, (2) Step-up Authenticator challenge verification, (3) Dual confirmation codes sent to both existing and new inboxes, and (4) Automatic session invalidation across all other devices upon completion.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PASSWORD MANAGEMENT
      ========================================================================== */}
      {activeTab === 'password' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Authenticated Password Management</h3>
            <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
              Initiate official Auth0 password-change workflows with out-of-band email confirmation.
            </p>
          </div>

          <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2 text-[11px] text-[#A4A8AE]">
            <span className="text-[#A8B8A7] font-semibold">Zero Plaintext Policy:</span>
            <p>
              Your password is never stored or visible to this application. Password changes are orchestrated directly through Auth0's cryptographic password-reset engine and delivered strictly to your verified recovery destination: <strong className="text-[#F0F0ED]">{profile.recoveryEmailMasked}</strong>.
            </p>
          </div>

          {passwordOtpStep === 'IDLE' && (
            <div className="space-y-4">
              <p className="text-[#F0F0ED] text-xs">
                To change your password, request a cryptographically secure 6-digit confirmation code. It will be sent to your verified recovery destination.
              </p>
              <button
                type="button"
                onClick={handleRequestPasswordOtp}
                disabled={loading}
                className="px-5 py-2.5 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
              >
                {loading ? 'SENDING VERIFICATION CODE...' : 'DISPATCH CONFIRMATION CODE TO EMAIL'}
              </button>
            </div>
          )}

          {passwordOtpStep === 'OTP_SENT' && (
            <form onSubmit={handleVerifyPasswordOtp} className="space-y-4 max-w-md bg-[#101114] p-5 rounded border border-[rgba(255,255,255,0.08)]">
              <div>
                <label className="block text-[#A4A8AE] mb-1.5">
                  Enter 6-Digit Email Confirmation Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={passwordOtpCode}
                  onChange={(e) => setPasswordOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-center text-lg tracking-[0.2em] font-mono text-[#A8B8A7] focus:outline-none focus:border-[#A8B8A7]"
                />
                <span className="text-[11px] text-[#A4A8AE] mt-1 block">
                  Check <strong className="text-[#F0F0ED]">{profile.recoveryEmailMasked}</strong>. Code valid for 10 minutes.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading || passwordOtpCode.length !== 6}
                  className="px-5 py-2.5 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                >
                  {loading ? 'VALIDATING CODE...' : 'VERIFY & TRIGGER AUTH0 RESET'}
                </button>
                <button
                  type="button"
                  onClick={handleRequestPasswordOtp}
                  className="text-[11px] text-[#A4A8AE] hover:text-[#F0F0ED]"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {passwordOtpStep === 'COMPLETED' && (
            <div className="p-4 bg-[#101114] border border-[#A8B8A7]/40 rounded-lg space-y-2 text-[#A8B8A7]">
              <div className="flex items-center space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password Change Workflow Initiated</span>
              </div>
              <p className="text-xs text-[#A4A8AE]">
                The official one-time Auth0 reset ticket has been dispatched to <strong>{profile.recoveryEmailMasked}</strong>. All other active sessions have been revoked for your security.
              </p>
              <button
                type="button"
                onClick={() => setPasswordOtpStep('IDLE')}
                className="mt-2 text-[11px] text-[#A8B8A7] underline"
              >
                Reset Flow
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: TWO-FACTOR AUTHENTICATION POLICY
      ========================================================================== */}
      {activeTab === 'mfa' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Multi-Factor Authentication (MFA) Policy</h3>
            <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
              System-wide enforcement rules governing administrative clearance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1">
              <span className="text-[#A4A8AE] text-[10px]">ENFORCEMENT POLICY</span>
              <p className="text-[#A8B8A7] font-display text-lg">MANDATORY</p>
              <p className="text-[10px] text-[#A4A8AE]">MFA challenge required on every owner sign-in.</p>
            </div>

            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1">
              <span className="text-[#A4A8AE] text-[10px]">AUTHENTICATOR APPS (TOTP)</span>
              <p className="text-[#F0F0ED] font-display text-lg">
                {(profile.authenticators || []).length > 0 ? `${(profile.authenticators || []).length} ENROLLED` : '0 ENROLLED'}
              </p>
              <p className="text-[10px] text-[#A4A8AE]">RFC 6238 time-based 6-digit codes.</p>
            </div>

            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1">
              <span className="text-[#A4A8AE] text-[10px]">PASSKEYS & WEBAUTHN</span>
              <p className="text-[#F0F0ED] font-display text-lg">
                {(profile.passkeys || []).length > 0 ? `${(profile.passkeys || []).length} ENROLLED` : '0 ENROLLED'}
              </p>
              <p className="text-[10px] text-[#A4A8AE]">FIDO2 biometric & hardware security keys.</p>
            </div>
          </div>

          <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2 text-[11px] text-[#A4A8AE]">
            <span className="text-[#F0F0ED] font-semibold">Strict Defense-in-Depth Guarantee:</span>
            <p>
              Browser cookies or sessions never bypass the MFA challenge automatically. If an administrator signs in from an unfamiliar device or after session expiration, secondary factor verification is non-negotiable.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AUTHENTICATOR APPS (TOTP) — GOOGLE & MICROSOFT AUTHENTICATOR
      ========================================================================== */}
      {activeTab === 'authenticator' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Multi-Factor Authenticator Applications</h3>
              <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
                Configure and manage Google Authenticator, Microsoft Authenticator, and hardware-backed factors.
              </p>
            </div>

            {hasAnyAuthenticator && (
              <span className="px-3 py-1 rounded bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/30 text-[11px] self-start sm:self-auto font-semibold">
                MFA ACTIVE ({(profile.authenticators || []).length} APPS)
              </span>
            )}
          </div>

          {/* Factor Protection Policy Notice */}
          <div className="p-3.5 bg-[#101114] border border-[#A8B8A7]/20 rounded-lg flex items-start space-x-2.5 text-[11px] text-[#A4A8AE]">
            <ShieldCheck className="w-4 h-4 text-[#A8B8A7] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#F0F0ED]">Factor Protection Enforced:</strong> At least one second factor (Authenticator app, Passkey, or Recovery Codes) must remain enrolled at all times. The system prevents removing your only active factor.
            </div>
          </div>

          {/* Dedicated 4-Row Authenticator Management Table */}
          <div className="space-y-3">
            <span className="text-[#A8B8A7] font-semibold text-[11px]">AUTHENTICATOR FACTORS & SECONDARY CREDENTIALS</span>
            <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#22252C] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Authenticator Factor</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Activity / IST Details</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
                  {/* Row 1: Google Authenticator */}
                  <tr>
                    <td className="py-3 px-4 text-[#F0F0ED] font-medium flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] text-[#A8B8A7] font-bold">
                        G
                      </div>
                      <div>
                        <span className="block font-medium">Google Authenticator</span>
                        <span className="text-[10px] text-[#6E727A]">RFC 6238 TOTP Standard</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {enrolledGoogle ? (
                        <span className="px-2 py-0.5 bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40 rounded text-[10px] font-semibold">
                          ENROLLED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#22252C] text-[#A4A8AE] rounded text-[10px]">
                          NOT ENROLLED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A4A8AE] text-[11px]">
                      {enrolledGoogle ? (
                        <div>
                          <div>Enrolled: {enrolledGoogle.enrolledAtIST || new Date(enrolledGoogle.enrolledAt).toLocaleDateString()}</div>
                          {enrolledGoogle.lastVerifiedAt && <div className="text-[10px] text-[#6E727A]">Last verified: {enrolledGoogle.lastVerifiedAt}</div>}
                        </div>
                      ) : (
                        <span className="text-[#6E727A]">Ready for enrollment</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleInitTotpEnroll('GOOGLE_AUTHENTICATOR')}
                          disabled={loading}
                          className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] text-[#F0F0ED] rounded text-[11px] transition-colors"
                        >
                          {enrolledGoogle ? 'Re-enrol' : 'Enrol App'}
                        </button>
                        {enrolledGoogle && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTotp(enrolledGoogle.id)}
                            disabled={loading}
                            className="px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded text-[11px] transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: Microsoft Authenticator */}
                  <tr>
                    <td className="py-3 px-4 text-[#F0F0ED] font-medium flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] text-[#A8B8A7] font-bold">
                        M
                      </div>
                      <div>
                        <span className="block font-medium">Microsoft Authenticator</span>
                        <span className="text-[10px] text-[#6E727A]">RFC 6238 TOTP Standard</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {enrolledMicrosoft ? (
                        <span className="px-2 py-0.5 bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40 rounded text-[10px] font-semibold">
                          ENROLLED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#22252C] text-[#A4A8AE] rounded text-[10px]">
                          NOT ENROLLED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A4A8AE] text-[11px]">
                      {enrolledMicrosoft ? (
                        <div>
                          <div>Enrolled: {enrolledMicrosoft.enrolledAtIST || new Date(enrolledMicrosoft.enrolledAt).toLocaleDateString()}</div>
                          {enrolledMicrosoft.lastVerifiedAt && <div className="text-[10px] text-[#6E727A]">Last verified: {enrolledMicrosoft.lastVerifiedAt}</div>}
                        </div>
                      ) : (
                        <span className="text-[#6E727A]">Ready for enrollment</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleInitTotpEnroll('MICROSOFT_AUTHENTICATOR')}
                          disabled={loading}
                          className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] text-[#F0F0ED] rounded text-[11px] transition-colors"
                        >
                          {enrolledMicrosoft ? 'Re-enrol' : 'Enrol App'}
                        </button>
                        {enrolledMicrosoft && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTotp(enrolledMicrosoft.id)}
                            disabled={loading}
                            className="px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded text-[11px] transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: Emergency Recovery Codes */}
                  <tr>
                    <td className="py-3 px-4 text-[#F0F0ED] font-medium flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] text-[#A8B8A7]">
                        <FileKey className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block font-medium">Emergency Recovery Codes</span>
                        <span className="text-[10px] text-[#6E727A]">Single-use offline backup hashes</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {profile.recoveryCodesCount > 0 ? (
                        <span className="px-2 py-0.5 bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40 rounded text-[10px] font-semibold">
                          AVAILABLE ({profile.recoveryCodesCount} ACTIVE)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-950/30 text-amber-300 rounded text-[10px]">
                          EXHAUSTED / NOT GENERATED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A4A8AE] text-[11px]">
                      {profile.recoveryCodesGeneratedAt ? (
                        <div>Generated: {new Date(profile.recoveryCodesGeneratedAt).toLocaleDateString()}</div>
                      ) : (
                        <span className="text-[#6E727A]">Not generated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveTab('recovery')}
                        className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] text-[#F0F0ED] rounded text-[11px] transition-colors"
                      >
                        Manage Codes
                      </button>
                    </td>
                  </tr>

                  {/* Row 4: FIDO2 Passkey */}
                  <tr>
                    <td className="py-3 px-4 text-[#F0F0ED] font-medium flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] text-[#A8B8A7]">
                        <Fingerprint className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block font-medium">Passkeys & Security Keys</span>
                        <span className="text-[10px] text-[#6E727A]">FIDO2 / WebAuthn Biometric</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(profile.passkeys || []).length > 0 ? (
                        <span className="px-2 py-0.5 bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40 rounded text-[10px] font-semibold">
                          ENROLLED ({(profile.passkeys || []).length} ACTIVE)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#22252C] text-[#A4A8AE] rounded text-[10px]">
                          NOT ENROLLED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A4A8AE] text-[11px]">
                      {(profile.passkeys || []).length > 0 ? (
                        <span>Hardware biometric verified</span>
                      ) : (
                        <span className="text-[#6E727A]">No passkeys registered</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveTab('passkeys')}
                        className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] text-[#F0F0ED] rounded text-[11px] transition-colors"
                      >
                        Manage Passkeys
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Enrollment Modal / Form */}
          {totpEnrollData && (
            <div className="bg-[#101114] border border-[#A8B8A7]/40 p-6 rounded-lg space-y-6 max-w-xl">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <span className="text-[#A8B8A7] font-semibold text-xs tracking-wider">
                  ENROLL {totpEnrollData.appLabel.toUpperCase()}
                </span>
                <button 
                  onClick={() => setTotpEnrollData(null)}
                  className="text-[#A4A8AE] hover:text-[#F0F0ED]"
                >
                  Cancel
                </button>
              </div>

              {/* Instructions Specific to Google or Microsoft Authenticator */}
              <div className="p-3.5 bg-[#181A1F] border border-[rgba(255,255,255,0.06)] rounded space-y-2 text-xs text-[#A4A8AE]">
                <strong className="text-[#F0F0ED] block font-medium">
                  {totpEnrollData.appType === 'MICROSOFT_AUTHENTICATOR' 
                    ? 'Microsoft Authenticator Setup Instructions:' 
                    : 'Google Authenticator Setup Instructions:'}
                </strong>
                {totpEnrollData.appType === 'MICROSOFT_AUTHENTICATOR' ? (
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Open <strong>Microsoft Authenticator</strong> on your iOS or Android device.</li>
                    <li>Tap the <strong>+</strong> button (or <em>Add Account</em>).</li>
                    <li>Choose <strong>Other (Google, Facebook, etc.)</strong> to trigger camera scan.</li>
                    <li>Scan the QR code below (or enter the secret key manually).</li>
                    <li>Enter the 6-digit confirmation code shown in Microsoft Authenticator.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Open <strong>Google Authenticator</strong> on your phone.</li>
                    <li>Tap the <strong>+</strong> (plus) floating button in the bottom right corner.</li>
                    <li>Select <strong>Scan a QR code</strong> (or <em>Enter a setup key</em>).</li>
                    <li>Scan the high-contrast QR code below.</li>
                    <li>Enter the generated 6-digit code to activate.</li>
                  </ol>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-[#F0F0ED] rounded-lg shrink-0 border border-white">
                  <img 
                    src={totpEnrollData.qrCodeDataUrl} 
                    alt="Authenticator QR Code" 
                    className="w-40 h-40"
                  />
                </div>

                <div className="space-y-3 w-full">
                  <p className="text-xs text-[#A4A8AE] leading-relaxed">
                    Can&apos;t scan? Enter this Base32 manual entry key in your app:
                  </p>
                  <div className="p-2.5 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded font-mono text-[11px] text-[#A8B8A7] select-all flex items-center justify-between">
                    <span className="truncate">{totpEnrollData.secret}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(totpEnrollData.secret);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="hover:text-[#F0F0ED] ml-2 shrink-0 p-1 rounded hover:bg-[#22252C]"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-[#A8B8A7]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#6E727A] block">
                    Account: {profile.loginEmailMasked} · Issuer: ChethanKumarPortfolio
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmTotpEnroll} className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <label className="block text-[#A4A8AE] text-[11px]">
                  Enter the 6-digit code currently shown in {totpEnrollData.appLabel}:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-36 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2 text-center text-base tracking-[0.2em] font-mono text-[#A8B8A7] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <button
                    type="submit"
                    disabled={loading || totpVerifyCode.length !== 6}
                    className="px-5 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'VERIFYING...' : 'CONFIRM & ACTIVATE'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: PASSKEYS AND SECURITY KEYS
      ========================================================================== */}
      {activeTab === 'passkeys' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Passkeys and FIDO2 Hardware Security Keys</h3>
            <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
              Phishing-resistant WebAuthn biometric authentication via Windows Hello, Touch ID, or YubiKey.
            </p>
          </div>

          {/* Enrolled Passkeys List */}
          <div className="space-y-3">
            <span className="text-[#A8B8A7] font-semibold text-[11px]">ENROLLED HARDWARE PASSKEYS</span>
            {profile.passkeys.length === 0 ? (
              <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg text-center text-[#A4A8AE] text-xs">
                No passkeys enrolled yet. Add Windows Hello, Apple Touch ID, or a hardware security key below.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#22252C] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Device Label</th>
                      <th className="py-2.5 px-4 font-medium">Credential ID</th>
                      <th className="py-2.5 px-4 font-medium">Enrolled Date</th>
                      <th className="py-2.5 px-4 font-medium">Last Used</th>
                      <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
                    {profile.passkeys.map(pk => (
                      <tr key={pk.id}>
                        <td className="py-2.5 px-4 text-[#F0F0ED] font-medium flex items-center space-x-2">
                          <Fingerprint className="w-3.5 h-3.5 text-[#A8B8A7]" />
                          <span>{pk.deviceLabel}</span>
                        </td>
                        <td className="py-2.5 px-4 text-[#A4A8AE] font-mono">{pk.id.substring(0, 12)}••••</td>
                        <td className="py-2.5 px-4 text-[#A4A8AE]">{new Date(pk.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 text-[#A8B8A7]">{pk.lastUsedAt ? new Date(pk.lastUsedAt).toLocaleString() : 'Never'}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleRevokePasskey(pk.id)}
                            className="text-red-400 hover:underline text-[11px]"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Enroll Form */}
          <form onSubmit={handleEnrollPasskey} className="bg-[#101114] border border-[rgba(255,255,255,0.06)] p-5 rounded-lg space-y-3 max-w-lg">
            <span className="text-[#F0F0ED] font-medium text-xs block">Enrol New Biometric / Security Key</span>
            <div>
              <label className="block text-[#A4A8AE] text-[11px] mb-1">Device Label</label>
              <input
                type="text"
                value={passkeyLabel}
                onChange={(e) => setPasskeyLabel(e.target.value)}
                placeholder="e.g. Windows Hello Laptop or YubiKey 5C"
                className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2 text-xs text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !passkeyLabel.trim()}
              className="px-4 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{loading ? 'REGISTERING PASSKEY...' : 'ENROL HARDWARE PASSKEY'}</span>
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 7: RECOVERY METHODS
      ========================================================================== */}
      {activeTab === 'recovery' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Emergency Account Recovery Methods</h3>
              <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
                Out-of-band single-use recovery codes for emergency access when authenticator devices are unavailable.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/30 rounded text-[11px]">
                {profile.recoveryCodesCount} UNCONSUMED CODES
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2 text-[11px] text-[#A4A8AE]">
            <span className="text-[#F0F0ED] font-semibold">Offline Storage Protocol:</span>
            <p>
              Recovery codes are hashed with SHA-256 before storage. Plaintext keys are presented once upon generation. Print or record them on paper and store in a physical safe. Never store them on cloud storage or paste into chat prompts.
            </p>
          </div>

          {revealedCodes ? (
            <div className="bg-[#101114] border border-[#A8B8A7]/40 p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#A8B8A7] font-semibold text-xs tracking-wider">NEW RECOVERY CODES GENERATED</span>
                <span className="text-[10px] text-amber-400">Save immediately. These will not be shown again.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-[#181A1F] rounded border border-[rgba(255,255,255,0.08)] font-mono text-sm text-[#F0F0ED]">
                {revealedCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 flex items-center justify-between">
                    <span className="text-[#6E727A] text-xs">{idx + 1}.</span>
                    <span className="font-semibold tracking-wider text-[#A8B8A7]">{code}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = revealedCodes.map((c, i) => `${i + 1}. ${c}`).join('\n');
                    navigator.clipboard.writeText(text);
                    showFeedback('success', 'Recovery codes copied to clipboard.');
                  }}
                  className="px-4 py-2 bg-[#22252C] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] rounded text-xs hover:border-[#A8B8A7] flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Codes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRevealedCodes(null)}
                  className="px-4 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA]"
                >
                  Done & Confirm Stored
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[#F0F0ED] font-medium text-xs block">Generate Fresh Recovery Code Set</span>
                <p className="text-[#A4A8AE] text-[11px] mt-0.5">
                  Generates 10 single-use cryptographic backup passcodes and invalidates prior batches.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateRecoveryCodes}
                disabled={loading}
                className="px-4 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA] transition-colors disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REGENERATE 10 RECOVERY CODES</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 8: MULTI-CHANNEL NOTIFICATION PREFERENCES & ENGINE
      ========================================================================== */}
      {activeTab === 'notifications' && notificationData && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Multi-Channel Security Notification Engine</h3>
              <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
                Real-time automated delivery pipelines for logins, password updates, and suspicious activities.
              </p>
            </div>

            <button
              onClick={() => {
                loadNotificationPrefs();
                loadNotificationHistory();
                loadInAppNotifications();
              }}
              className="px-3 py-1.5 bg-[#101114] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] rounded text-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* IN-APP NOTIFICATION CENTER */}
          <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#A8B8A7]" />
                <span className="text-[#F0F0ED] font-semibold text-xs">
                  IN-APP NOTIFICATION CENTER
                </span>
                {inAppNotifications.filter(n => !n.read).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#A8B8A7] text-[#101114] text-[10px] font-semibold">
                    {inAppNotifications.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
              <button
                onClick={loadInAppNotifications}
                className="text-[11px] text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Alerts</span>
              </button>
            </div>

            {inAppNotifications.length === 0 ? (
              <p className="text-xs text-[#A4A8AE] text-center py-4">No active in-app security notifications.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {inAppNotifications.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border text-xs flex items-start justify-between gap-4 transition-colors ${
                      item.read
                        ? 'bg-[#181A1F]/50 border-[rgba(255,255,255,0.04)] text-[#A4A8AE]'
                        : 'bg-[#181A1F] border-[#A8B8A7]/30 text-[#F0F0ED]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${item.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-[#A8B8A7]'}`} />
                        <span className="font-semibold text-xs">{item.headline || item.subject}</span>
                        <span className="text-[10px] font-mono text-[#6E727A]">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-[#A4A8AE] leading-relaxed">{item.details}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {!item.read && (
                        <button
                          onClick={() => handleMarkNotificationRead(item.id)}
                          className="px-2 py-1 bg-[#101114] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] rounded text-[10px] text-[#A8B8A7]"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissNotification(item.id)}
                        className="px-2 py-1 bg-[#101114] border border-[rgba(255,255,255,0.08)] hover:border-red-400 rounded text-[10px] text-red-400"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Diagnostic Result Modal / Banner */}
          {testResult && (
            <div className={`p-4 rounded-lg border text-xs space-y-2.5 ${
              testResult.success 
                ? 'bg-[#101114] border-[#A8B8A7]/40 text-[#F0F0ED]' 
                : 'bg-red-950/20 border-red-500/40 text-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-[#A8B8A7]" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    {testResult.channel} Delivery Diagnostic Result: {testResult.status}
                  </span>
                </div>
                <button onClick={() => setTestResult(null)} className="text-[#A4A8AE] hover:text-[#F0F0ED]">Close</button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#A4A8AE]">{testResult.message}</p>
              
              <div className="p-2.5 bg-[#181A1F] rounded font-mono text-[11px] space-y-1">
                <div><strong>Provider:</strong> {testResult.provider}</div>
                {testResult.providerMessageId && <div><strong>Provider Message ID / SID / Op ID:</strong> {testResult.providerMessageId}</div>}
                {testResult.errorCode && <div><strong>Error Code:</strong> <span className="text-red-400">{testResult.errorCode}</span></div>}
                {testResult.errorDetails && <div className="text-red-400"><strong>Error Details:</strong> {testResult.errorDetails}</div>}
                {testResult.operationStats && (
                  <div className="text-[10px] text-[#A8B8A7] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                    <div>Operation Status: {testResult.operationStats.operationStatus || 'QUEUED'}</div>
                    <div>Queued: {testResult.operationStats.queued ?? 0} · Sent: {testResult.operationStats.sent ?? 0} · Delivered: {testResult.operationStats.delivered ?? 0} · Failed: {testResult.operationStats.failed ?? 0}</div>
                  </div>
                )}
              </div>

              {testResult.trialNotice && (
                <div className="p-2 bg-amber-950/20 border border-amber-500/30 rounded text-amber-300 text-[11px] leading-relaxed">
                  <strong>Trial Notice:</strong> {testResult.trialNotice}
                </div>
              )}

              {testResult.instructions && (
                <div className="p-2 bg-[#121317] border border-[rgba(255,255,255,0.08)] rounded text-[#A4A8AE] text-[11px] leading-relaxed">
                  <strong className="text-[#A8B8A7]">Actionable Guidance:</strong> {testResult.instructions}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {testResult.providerMessageId && (
                  <button
                    onClick={handlePollStatus}
                    disabled={loading}
                    className="px-3 py-1 bg-[#181A1F] border border-[#A8B8A7]/40 text-[#A8B8A7] hover:text-[#F0F0ED] rounded text-[11px] transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Poll Real-Time Delivery Status</span>
                  </button>
                )}

                {!testResult.success && (
                  <button
                    onClick={() => handleTestNotification(testResult.channel as any)}
                    className="px-3 py-1 bg-red-900/40 border border-red-500/40 text-red-200 hover:bg-red-900/60 rounded text-[11px]"
                  >
                    Retry Diagnostic Dispatch
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CHANNEL 1: EMAIL */}
          <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <span className="text-[#F0F0ED] font-semibold text-xs flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-[#A8B8A7]" />
                  <span>Email Security Alerts (Twilio Comms Email / Resend)</span>
                </span>
                <p className="text-[#A4A8AE] text-[11px] mt-0.5">
                  Destination: <strong className="text-[#A8B8A7] font-mono">{notificationData.destinations.emailMasked || 't***@g***.com'}</strong> · Provider: {notificationData.providers.email.provider}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]">
                    Sender: {notificationData.providers.email.fromAddress || 'security@chethankumar.dev'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A8B8A7] border border-[rgba(255,255,255,0.06)]">
                    API: https://comms.twilio.com/v1/Emails
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${notificationData.providers.email.domainVerified ? 'bg-[#A8B8A7]/15 text-[#A8B8A7]' : 'bg-amber-950/30 text-amber-300 border border-amber-500/30'}`}>
                    {notificationData.providers.email.domainVerified ? 'Sender Domain Verified' : 'Domain Awaiting Verification'}
                  </span>
                </div>
                {notificationData.providers.email.lastProviderReference && (
                  <p className="text-[10px] text-[#6E727A] font-mono mt-1">
                    Last Operation ID / Message ID: {notificationData.providers.email.lastProviderReference}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {renderStatusBadge(notificationData.providers.email.status)}
                <button
                  onClick={() => handleTestNotification('EMAIL')}
                  disabled={loading}
                  className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7] rounded text-[11px] transition-colors"
                >
                  Send Test Email
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.email.successfulLogin}
                  onChange={() => handleTogglePref('email', 'successfulLogin')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Every Successful Administrator Login</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.email.newDeviceLogin}
                  onChange={() => handleTogglePref('email', 'newDeviceLogin')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Login from Unfamiliar Device / IP</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.email.passwordChanges}
                  onChange={() => handleTogglePref('email', 'passwordChanges')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Password Reset Requests & Changes</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.email.mfaChanges}
                  onChange={() => handleTogglePref('email', 'mfaChanges')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">MFA Factor Enrolled or Revoked</span>
              </label>
            </div>
          </div>

          {/* CHANNEL 2: SMS */}
          <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <span className="text-[#F0F0ED] font-semibold text-xs flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-[#A8B8A7]" />
                  <span>Twilio SMS Alerts (India +91 Destination)</span>
                </span>
                <p className="text-[#A4A8AE] text-[11px] mt-0.5">
                  Destination: <strong className="text-[#A8B8A7] font-mono">{notificationData.destinations.mobileMasked || '+91 93804 •••••'}</strong> · Provider: {notificationData.providers.sms.provider}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]">
                    Twilio Account: {notificationData.providers.sms.accountSidMasked || 'Not Configured'} (karnashaiva81@gmail.com)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]">
                    Auth: {notificationData.providers.sms.authMode || 'NONE'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${notificationData.providers.sms.isTrialAccount ? 'bg-amber-950/30 text-amber-300 border border-amber-500/30' : 'bg-[#A8B8A7]/15 text-[#A8B8A7]'}`}>
                    {notificationData.providers.sms.isTrialAccount ? 'Trial Mode' : 'Production Mode'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A8B8A7] border border-[rgba(255,255,255,0.06)]">
                    Sender: {notificationData.providers.sms.fromNumber || 'Not Configured'}
                  </span>
                </div>
                {notificationData.providers.sms.trialNotice && (
                  <p className="text-[10px] text-amber-400 font-mono mt-1">
                    {notificationData.providers.sms.trialNotice}
                  </p>
                )}
                {notificationData.providers.sms.lastProviderReference && (
                  <p className="text-[10px] text-[#6E727A] font-mono mt-0.5">
                    Last Twilio SID: {notificationData.providers.sms.lastProviderReference}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {renderStatusBadge(notificationData.providers.sms.status)}
                {!notificationData.destinations.mobileVerified ? (
                  <button
                    onClick={() => handleRequestPhoneVerify('SMS')}
                    disabled={loading}
                    className="px-2.5 py-1 bg-amber-950/30 border border-amber-500/40 text-amber-300 rounded text-[11px] hover:bg-amber-950/50"
                  >
                    Verify Ownership
                  </button>
                ) : (
                  <span className="px-2 py-0.5 bg-[#A8B8A7]/10 text-[#A8B8A7] rounded text-[10px]">
                    VERIFIED NUMBER
                  </span>
                )}
                <button
                  onClick={() => handleTestNotification('SMS')}
                  disabled={loading}
                  className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7] rounded text-[11px]"
                >
                  Send Test SMS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.sms.criticalSecurityEvents}
                  onChange={() => handleTogglePref('sms', 'criticalSecurityEvents')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Critical Security Events (Recovery codes used, factor removed)</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.sms.everySuccessfulLogin}
                  onChange={() => handleTogglePref('sms', 'everySuccessfulLogin')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Every Successful Login (Optional)</span>
              </label>
            </div>
          </div>

          {/* CHANNEL 3: WHATSAPP */}
          <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <span className="text-[#F0F0ED] font-semibold text-xs flex items-center space-x-2">
                  <Send className="w-4 h-4 text-[#A8B8A7]" />
                  <span>Twilio WhatsApp Alerts (Sandbox / Production)</span>
                </span>
                <p className="text-[#A4A8AE] text-[11px] mt-0.5">
                  Destination: <strong className="text-[#A8B8A7] font-mono">{notificationData.destinations.whatsappMasked || '+91 93804 •••••'}</strong> · Provider: {notificationData.providers.whatsapp.provider}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#181A1F] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]">
                    Sender: {notificationData.providers.whatsapp.fromAddress || 'whatsapp:+14155238886'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${notificationData.providers.whatsapp.recipientJoined ? 'bg-[#A8B8A7]/15 text-[#A8B8A7]' : 'bg-amber-950/30 text-amber-300 border border-amber-500/30'}`}>
                    {notificationData.providers.whatsapp.recipientJoined ? 'Opt-In Confirmed' : 'Sandbox Opt-In Required'}
                  </span>
                </div>
                {notificationData.providers.whatsapp.trialNotice && (
                  <p className="text-[10px] text-amber-400 font-mono mt-1">
                    {notificationData.providers.whatsapp.trialNotice}
                  </p>
                )}
                {notificationData.providers.whatsapp.lastProviderReference && (
                  <p className="text-[10px] text-[#6E727A] font-mono mt-0.5">
                    Last Message SID: {notificationData.providers.whatsapp.lastProviderReference}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {renderStatusBadge(notificationData.providers.whatsapp.status)}
                {!notificationData.destinations.whatsappVerified ? (
                  <button
                    onClick={() => handleRequestPhoneVerify('WHATSAPP')}
                    disabled={loading}
                    className="px-2.5 py-1 bg-amber-950/30 border border-amber-500/40 text-amber-300 rounded text-[11px] hover:bg-amber-950/50"
                  >
                    Verify WhatsApp
                  </button>
                ) : (
                  <span className="px-2 py-0.5 bg-[#A8B8A7]/10 text-[#A8B8A7] rounded text-[10px]">
                    VERIFIED DESTINATION
                  </span>
                )}
                <button
                  onClick={() => handleTestNotification('WHATSAPP')}
                  disabled={loading}
                  className="px-3 py-1 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7] rounded text-[11px]"
                >
                  Send Test WhatsApp
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.whatsapp.criticalSecurityEvents}
                  onChange={() => handleTogglePref('whatsapp', 'criticalSecurityEvents')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Critical Security Alerts via WhatsApp</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData.preferences.whatsapp.everySuccessfulLogin}
                  onChange={() => handleTogglePref('whatsapp', 'everySuccessfulLogin')}
                  className="rounded border-[rgba(255,255,255,0.2)] bg-[#181A1F] text-[#A8B8A7] focus:ring-0"
                />
                <span className="text-[#A4A8AE]">Successful Login Alerts (Optional)</span>
              </label>
            </div>
          </div>

          {/* Phone Verify Modal */}
          {phoneVerifyChannel && (
            <div className="p-4 bg-[#101114] border border-[#A8B8A7]/40 rounded-lg space-y-3 max-w-md">
              <div className="flex items-center justify-between">
                <span className="text-[#A8B8A7] font-semibold text-xs">VERIFY {phoneVerifyChannel} DESTINATION</span>
                <button onClick={() => setPhoneVerifyChannel(null)} className="text-[#A4A8AE]">Cancel</button>
              </div>
              <p className="text-[#A4A8AE] text-[11px]">
                Enter the 6-digit confirmation code dispatched to {phoneVerifyChannel === 'WHATSAPP' ? notificationData.destinations.whatsappMasked : notificationData.destinations.mobileMasked}.
              </p>
              <form onSubmit={handleConfirmPhoneVerify} className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={6}
                  value={phoneVerifyCode}
                  onChange={(e) => setPhoneVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-28 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2 text-center text-sm font-mono text-[#A8B8A7]"
                />
                <button
                  type="submit"
                  disabled={loading || phoneVerifyCode.length !== 6}
                  className="px-4 py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded text-xs hover:bg-[#BDCCBA]"
                >
                  Confirm Code
                </button>
              </form>
            </div>
          )}

          {/* Twilio Comprehensive Diagnostics Console (Part 10) */}
          <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <span className="text-[#A8B8A7] font-semibold text-xs tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
                  <span>TWILIO ACCOUNT & MULTI-CHANNEL DIAGNOSTICS CONSOLE</span>
                </span>
                <p className="text-[#A4A8AE] text-[11px] mt-0.5">
                  Real-time operational status, caller ID verification, Comms Email endpoints, and sandbox enrollment audit.
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                notificationData.providers.sms.accountSidConfigured && notificationData.providers.sms.apiKeyConfigured 
                  ? 'bg-[#A8B8A7]/15 text-[#A8B8A7] border border-[#A8B8A7]/40' 
                  : 'bg-amber-950/30 text-amber-300 border border-amber-500/30'
              }`}>
                {notificationData.providers.sms.accountSidConfigured && notificationData.providers.sms.apiKeyConfigured ? 'AUTHENTICATED' : 'CONFIG REQUIRED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-[11px]">
              {/* 1. TWILIO ACCOUNT */}
              <div className="p-3 bg-[#181A1F] border border-[rgba(255,255,255,0.04)] rounded space-y-2">
                <div className="text-[#A8B8A7] font-semibold text-[10px] tracking-wider uppercase border-b border-[rgba(255,255,255,0.04)] pb-1">
                  Twilio Account
                </div>
                <div className="text-[#A4A8AE] space-y-1">
                  <div>Owner: <span className="text-[#F0F0ED]">karnashaiva81@gmail.com</span></div>
                  <div>SID: <span className="text-[#F0F0ED]">{notificationData.providers.sms.accountSidMasked || 'Not Configured'}</span></div>
                  <div>Auth: <span className="text-[#A8B8A7]">{notificationData.providers.sms.authMode || 'NONE'}</span></div>
                  <div>Status: <span className={notificationData.providers.sms.isTrialAccount ? 'text-amber-300' : 'text-[#A8B8A7]'}>
                    {notificationData.providers.sms.isTrialAccount ? 'Trial Account' : 'Production Account'}
                  </span></div>
                  <div>Connectivity: <span className="text-[#A8B8A7]">
                    {notificationData.providers.sms.accountSidConfigured ? 'Connected' : 'Disconnected'}
                  </span></div>
                </div>
              </div>

              {/* 2. SMS DIAGNOSTICS */}
              <div className="p-3 bg-[#181A1F] border border-[rgba(255,255,255,0.04)] rounded space-y-2">
                <div className="text-[#A8B8A7] font-semibold text-[10px] tracking-wider uppercase border-b border-[rgba(255,255,255,0.04)] pb-1">
                  SMS Gateway
                </div>
                <div className="text-[#A4A8AE] space-y-1">
                  <div>Sender: <span className="text-[#F0F0ED]">{notificationData.providers.sms.fromNumber}</span></div>
                  <div>Target: <span className="text-[#F0F0ED]">{notificationData.destinations.mobileMasked}</span></div>
                  <div>Verified: <span className={notificationData.destinations.mobileVerified ? 'text-[#A8B8A7]' : 'text-amber-400'}>
                    {notificationData.destinations.mobileVerified ? 'Caller ID Verified' : 'Unverified (OTP Req)'}
                  </span></div>
                  <div>Geo-Perms: <span className="text-[#A8B8A7]">India (+91) Enabled</span></div>
                  <div>Latest SID: <span className="text-[#6E727A] truncate block">{notificationData.providers.sms.lastProviderReference || 'None'}</span></div>
                </div>
              </div>

              {/* 3. EMAIL DIAGNOSTICS */}
              <div className="p-3 bg-[#181A1F] border border-[rgba(255,255,255,0.04)] rounded space-y-2">
                <div className="text-[#A8B8A7] font-semibold text-[10px] tracking-wider uppercase border-b border-[rgba(255,255,255,0.04)] pb-1">
                  Twilio Email API
                </div>
                <div className="text-[#A4A8AE] space-y-1">
                  <div>Endpoint: <span className="text-[#F0F0ED]">comms.twilio.com</span></div>
                  <div>Sender: <span className="text-[#F0F0ED]">{notificationData.providers.email.fromAddress}</span></div>
                  <div>Target: <span className="text-[#F0F0ED]">{notificationData.destinations.emailMasked}</span></div>
                  <div>Async Op: <span className="text-[#A8B8A7]">{notificationData.providers.email.lastProviderReference ? 'Active' : 'Standby'}</span></div>
                  <div>Delivery: <span className="text-[#6E727A]">
                    {notificationData.providers.email.lastDeliveredAtIST ? 'Confirmed Delivery' : 'Strict Callback Verified'}
                  </span></div>
                </div>
              </div>

              {/* 4. WHATSAPP DIAGNOSTICS */}
              <div className="p-3 bg-[#181A1F] border border-[rgba(255,255,255,0.04)] rounded space-y-2">
                <div className="text-[#A8B8A7] font-semibold text-[10px] tracking-wider uppercase border-b border-[rgba(255,255,255,0.04)] pb-1">
                  WhatsApp Messaging
                </div>
                <div className="text-[#A4A8AE] space-y-1">
                  <div>Sender: <span className="text-[#F0F0ED]">{notificationData.providers.whatsapp.fromAddress}</span></div>
                  <div>Target: <span className="text-[#F0F0ED]">{notificationData.destinations.whatsappMasked}</span></div>
                  <div>Type: <span className="text-[#A8B8A7]">{notificationData.providers.whatsapp.senderType}</span></div>
                  <div>Opt-In: <span className={notificationData.providers.whatsapp.recipientJoined ? 'text-[#A8B8A7]' : 'text-amber-400'}>
                    {notificationData.providers.whatsapp.recipientJoined ? 'Joined Sandbox' : 'Keyword Pending'}
                  </span></div>
                  <div>Latest SID: <span className="text-[#6E727A] truncate block">{notificationData.providers.whatsapp.lastProviderReference || 'None'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Audit History Table */}
          <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#A8B8A7] font-semibold text-[11px]">TRANSACTIONAL DELIVERY AUDIT LOG (IST)</span>
                <p className="text-[#A4A8AE] text-[10px] font-sans font-light">
                  Strict delivery lifecycle: Only webhook callbacks transition status to DELIVERED. Upstream API response is recorded as ACCEPTED.
                </p>
              </div>
              <button
                onClick={loadNotificationHistory}
                className="text-[11px] text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {notificationHistory.length === 0 ? (
              <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded text-center text-[#A4A8AE] text-xs">
                No notification alerts dispatched yet. Click &quot;Send Test Email&quot; or &quot;Send Test SMS&quot; to test your provider pipelines.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#22252C] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Timestamp (IST)</th>
                      <th className="py-2.5 px-3 font-medium">Event ID</th>
                      <th className="py-2.5 px-3 font-medium">Channel</th>
                      <th className="py-2.5 px-3 font-medium">Target</th>
                      <th className="py-2.5 px-3 font-medium">Event</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Provider & Ref</th>
                      <th className="py-2.5 px-3 font-medium">Error Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
                    {notificationHistory.slice(0, 15).map(record => (
                      <tr key={record.id}>
                        <td className="py-2 px-3 text-[#A4A8AE] whitespace-nowrap">{record.timestampIST}</td>
                        <td className="py-2 px-3 font-mono text-[#6E727A] text-[10px]">{record.id}</td>
                        <td className="py-2 px-3 font-medium text-[#F0F0ED]">{record.channel}</td>
                        <td className="py-2 px-3 font-mono text-[#A8B8A7]">{record.destinationMasked}</td>
                        <td className="py-2 px-3 text-[#A4A8AE] max-w-[120px] truncate" title={record.eventType}>{record.eventType}</td>
                        <td className="py-2 px-3">{renderStatusBadge(record.status)}</td>
                        <td className="py-2 px-3 text-[#A4A8AE] font-mono text-[10px]">
                          <div>{record.provider}</div>
                          {record.providerMessageId && <div className="text-[#6E727A] truncate max-w-[160px]">{record.providerMessageId}</div>}
                        </td>
                        <td className="py-2 px-3 text-[#A4A8AE] text-[10px] max-w-[160px] truncate" title={record.errorInfo || record.errorDetails || ''}>
                          {record.errorInfo || record.errorDetails ? (
                            <span className="text-red-400 font-mono">{record.errorInfo || record.errorDetails}</span>
                          ) : (
                            <span className="text-[#6E727A]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: ACTIVE SESSIONS
      ========================================================================== */}
      {activeTab === 'sessions' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Active Device Sessions</h3>
              <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
                Inspect and revoke concurrent authenticated sessions across web browsers and devices.
              </p>
            </div>

            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeOthers}
                className="px-4 py-2 bg-[#22252C] border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded text-xs transition-colors self-start sm:self-auto"
              >
                SIGN OUT OF ALL OTHER SESSIONS
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map(s => (
              <div 
                key={s.id} 
                className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-[#A8B8A7]" />
                    <span className="text-[#F0F0ED] font-medium text-xs">
                      {s.browser} on {s.os}
                    </span>
                    {s.isCurrent && (
                      <span className="px-2 py-0.5 bg-[#A8B8A7]/10 text-[#A8B8A7] rounded text-[10px] font-semibold">
                        THIS DEVICE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A4A8AE]">
                    IP: {s.ipAddress} · Signed in: {s.createdAtIST} · Last Active: {s.lastActiveAtIST}
                  </p>
                </div>

                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded text-[11px] transition-colors self-start sm:self-auto flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Revoke Session</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 10: CHRONOLOGICAL SECURITY ACTIVITY (IST)
      ========================================================================== */}
      {activeTab === 'activity' && (
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Chronological Security Audit Log</h3>
              <p className="text-[#A4A8AE] text-xs mt-1 font-sans font-light">
                Tamper-resistant operational records timestamped in Indian Standard Time (IST).
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-[#A4A8AE]">Filter:</span>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded px-2.5 py-1 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Authentication</option>
                <option value="MFA">MFA & TOTP</option>
                <option value="PASSKEY">Passkeys</option>
                <option value="PASSWORD">Password</option>
                <option value="SESSIONS">Sessions</option>
                <option value="RECRUITER_ACCESS">Recruiter Access</option>
                <option value="NOTIFICATIONS">Notifications</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#22252C] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Timestamp (IST)</th>
                  <th className="py-2.5 px-4 font-medium">Action</th>
                  <th className="py-2.5 px-4 font-medium">Category</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Actor</th>
                  <th className="py-2.5 px-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-4 text-[#A4A8AE] whitespace-nowrap">{log.timestampIST}</td>
                    <td className="py-2.5 px-4 text-[#F0F0ED] font-medium">{log.action}</td>
                    <td className="py-2.5 px-4 text-[#A8B8A7]">{log.category}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        log.status === 'SUCCESS' ? 'text-[#A8B8A7] bg-[#A8B8A7]/10' : 'text-red-400 bg-red-950/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#A4A8AE]">{log.actor}</td>
                    <td className="py-2.5 px-4 text-[#A4A8AE] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
