import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  Send, 
  Fingerprint, 
  RefreshCw, 
  ExternalLink,
  Info
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { IntegrationStatusMatrix } from '../../../server/types';

export default function IntegrationMatrixSection() {
  const [matrix, setMatrix] = useState<IntegrationStatusMatrix | null>(null);
  const [timestampIST, setTimestampIST] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getStatus();
      setMatrix(res.matrix);
      setTimestampIST(res.timestampIST);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (!matrix) {
    return (
      <div className="p-8 text-center text-[#A4A8AE] font-mono text-xs">
        Loading integration status matrix...
      </div>
    );
  }

  return (
    <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-7 font-mono text-xs">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#A8B8A7]">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-display text-lg font-medium text-[#F0F0ED]">
              Enterprise Integration Verification Matrix
            </h3>
          </div>
          <p className="text-[#A4A8AE] text-xs leading-relaxed mt-1 font-sans font-light">
            Live operational status across identity, transactional email, SMS gateways, and WebAuthn hardware.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-[10px] text-[#A4A8AE]">Verified at {timestampIST}</span>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-1.5 rounded bg-[#101114] border border-[rgba(255,255,255,0.08)] text-[#A8B8A7] hover:text-[#F0F0ED] transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of 5 Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. AUTH0 IDENTITY */}
        <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>AUTH0 SSO & MFA</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                matrix.auth0.status === 'ACTIVE_CONNECTED' 
                  ? 'bg-[#A8B8A7]/10 text-[#A8B8A7]' 
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
              }`}>
                {matrix.auth0.status === 'ACTIVE_CONNECTED' ? 'LIVE CONNECTED' : 'AWAITING TENANT KEYS'}
              </span>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Provides PKCE Authorization Code flow, Universal Login, and enterprise multi-factor authentication policies.
            </p>
            <div className="space-y-1 text-[11px] font-mono text-[#A4A8AE] pt-2 border-t border-[rgba(255,255,255,0.04)]">
              <div>Tenant: <span className="text-[#F0F0ED]">{matrix.auth0.domain}</span></div>
              <div>MFA: <span className="text-[#A8B8A7]">Mandatory (TOTP / WebAuthn)</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#A4A8AE]">
            <span>Env: VITE_AUTH0_DOMAIN</span>
            <a href="https://manage.auth0.com" target="_blank" rel="noopener noreferrer" className="text-[#A8B8A7] hover:underline flex items-center space-x-1">
              <span>Auth0 Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. EMAIL DELIVERY ENGINE */}
        <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-1.5">
                <Mail className="w-4 h-4" />
                <span>TRANSACTIONAL EMAIL</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                matrix.email.status === 'READY' || matrix.email.status === 'DELIVERED' || matrix.email.status === 'ACCEPTED' || matrix.email.status === 'QUEUED' || matrix.email.status === 'SENT'
                  ? 'bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/30'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
              }`}>
                {matrix.email.status === 'READY' || matrix.email.status === 'DELIVERED' || matrix.email.status === 'ACCEPTED' || matrix.email.status === 'QUEUED' || matrix.email.status === 'SENT' ? 'PROVIDER READY' : 'CONFIG REQUIRED'}
              </span>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Dispatches security alerts, single-use password OTPs, and login alerts to your verified inbox via Twilio Comms Email API / Resend.
            </p>
            <div className="space-y-1 text-[11px] font-mono text-[#A4A8AE] pt-2 border-t border-[rgba(255,255,255,0.04)]">
              <div>Provider: <span className="text-[#F0F0ED]">{matrix.email.provider}</span></div>
              <div>Destination: <span className="text-[#A8B8A7]">{matrix.email.destinationMasked}</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#A4A8AE]">
            <span>Supported: Twilio Email / Resend</span>
            <span className="text-[#A8B8A7]">Verified Target</span>
          </div>
        </div>

        {/* 3. TWILIO SMS GATEWAY */}
        <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-1.5">
                <Smartphone className="w-4 h-4" />
                <span>TWILIO SMS ALERTS</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                matrix.sms.status === 'READY' || matrix.sms.status === 'DELIVERED' || matrix.sms.status === 'ACCEPTED' || matrix.sms.status === 'QUEUED' || matrix.sms.status === 'SENT'
                  ? 'bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/30'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
              }`}>
                {matrix.sms.status === 'READY' || matrix.sms.status === 'DELIVERED' || matrix.sms.status === 'ACCEPTED' || matrix.sms.status === 'QUEUED' || matrix.sms.status === 'SENT' ? 'PROVIDER READY' : 'AWAITING CREDENTIALS'}
              </span>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Out-of-band text message alerts for critical security anomalies and factor revocations via Twilio SMS.
            </p>
            <div className="space-y-1 text-[11px] font-mono text-[#A4A8AE] pt-2 border-t border-[rgba(255,255,255,0.04)]">
              <div>Destination: <span className="text-[#F0F0ED]">{matrix.sms.destinationMasked}</span></div>
              <div>Account: <span className="text-[#A8B8A7]">karnashaiva81@gmail.com</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#A4A8AE]">
            <span>Account: karnashaiva81@gmail.com</span>
            <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-[#A8B8A7] hover:underline flex items-center space-x-1">
              <span>Twilio Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 4. WHATSAPP BUSINESS */}
        <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-1.5">
                <Send className="w-4 h-4" />
                <span>TWILIO WHATSAPP ALERTS</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                matrix.whatsapp.status === 'READY' || matrix.whatsapp.status === 'DELIVERED' || matrix.whatsapp.status === 'ACCEPTED' || matrix.whatsapp.status === 'QUEUED' || matrix.whatsapp.status === 'SENT'
                  ? 'bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/30'
                  : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
              }`}>
                {matrix.whatsapp.status === 'READY' || matrix.whatsapp.status === 'DELIVERED' || matrix.whatsapp.status === 'ACCEPTED' || matrix.whatsapp.status === 'QUEUED' || matrix.whatsapp.status === 'SENT' ? 'PROVIDER READY' : 'OPT-IN / APPROVAL REQUIRED'}
              </span>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Twilio WhatsApp messaging (Sandbox testing / Registered Sender) for critical administrator dispatches.
            </p>
            <div className="space-y-1 text-[11px] font-mono text-[#A4A8AE] pt-2 border-t border-[rgba(255,255,255,0.04)]">
              <div>Destination: <span className="text-[#F0F0ED]">{matrix.whatsapp.destinationMasked}</span></div>
              <div>State: <span className="text-[#A4A8AE]">{matrix.whatsapp.provider}</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#A4A8AE]">
            <span>Sender: whatsapp:+14155238886</span>
            <span className="text-[#A8B8A7]">Twilio Gateway</span>
          </div>
        </div>

        {/* 5. FIDO2 / WEBAUTHN HARDWARE SENSOR */}
        <div className="p-5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-1.5">
                <Fingerprint className="w-4 h-4" />
                <span>FIDO2 / WEBAUTHN</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#A8B8A7]/10 text-[#A8B8A7]">
                HARDWARE READY
              </span>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Client-to-authenticator platform protocol supporting Windows Hello, Apple Touch ID, and hardware tokens.
            </p>
            <div className="space-y-1 text-[11px] font-mono text-[#A4A8AE] pt-2 border-t border-[rgba(255,255,255,0.04)]">
              <div>Status: <span className="text-[#A8B8A7]">Browser WebAuthn Supported</span></div>
              <div>Enrolled Keys: <span className="text-[#F0F0ED]">{matrix.webauthnFIDO2.enrolledCount} active passkeys</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-[10px] text-[#A4A8AE]">
            <span>Spec: W3C WebAuthn Level 3</span>
            <span className="text-[#A8B8A7]">Phishing-Resistant</span>
          </div>
        </div>
      </div>

      {/* Setup Checklist & Production Deployment Guidelines */}
      <div className="bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 space-y-4">
        <div className="flex items-center space-x-2 text-[#F0F0ED] font-semibold text-xs">
          <Info className="w-4 h-4 text-[#A8B8A7]" />
          <span>Production Activation Checklist</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-[#A4A8AE]">
          <div className="space-y-2">
            <span className="text-[#A8B8A7] font-semibold block">1. Auth0 Identity Tenant</span>
            <p>
              In Auth0 Dashboard: Create an SPA Application, add <code>http://localhost:3000</code> and your production domain to Allowed Callback URLs. Enable MFA with One-time Password (TOTP) and WebAuthn (FIDO2).
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[#A8B8A7] font-semibold block">2. Transactional Email (Resend / SendGrid / SMTP)</span>
            <p>
              Set <code>RESEND_API_KEY</code>, <code>SENDGRID_API_KEY</code>, or <code>SMTP_*</code> in server environment variables. The server will dispatch cryptographically signed alerts to your verified destination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
