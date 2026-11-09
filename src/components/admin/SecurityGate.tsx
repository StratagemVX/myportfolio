import { useState, useEffect, FormEvent } from 'react';
import { 
  Lock, 
  KeyRound, 
  Fingerprint, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { startAuthentication } from '@simplewebauthn/browser';

interface SecurityGateProps {
  onAuthenticated: (profile: any) => void;
}

export default function SecurityGate({ onAuthenticated }: SecurityGateProps) {
  // Step 1: Primary Credentials — Sanitized, empty by default, no PII leakage
  const [identifier, setIdentifier] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: MFA Challenge
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaFactor, setMfaFactor] = useState<'TOTP' | 'PASSKEY' | 'RECOVERY'>('TOTP');
  const [totpCode, setTotpCode] = useState('');
  const [showTotp, setShowTotp] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const auth0Domain = (import.meta.env.VITE_AUTH0_DOMAIN as string) || '';
  const auth0ClientId = (import.meta.env.VITE_AUTH0_CLIENT_ID as string) || '';

  // Handle Auth0 Universal Login redirect callback
  useEffect(() => {
    if (window.location.hash.includes('id_token=') || window.location.hash.includes('access_token=')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const idToken = hashParams.get('id_token');
        if (idToken) {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const email = payload.email;
            const sub = payload.sub;
            if (email) {
              setIsLoading(true);
              apiClient.auth0Verify(email, sub).then((res) => {
                if (res.requireMfa && res.challengeToken) {
                  setMfaRequired(true);
                  setChallengeToken(res.challengeToken);
                  setHasPasskeys(res.hasPasskeys || false);
                  setSuccessMsg('Auth0 identity verified. Secondary hardware MFA challenge mandatory.');
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }).catch((err) => {
                setErrorMsg(err instanceof Error ? err.message : 'Auth0 verification failed.');
              }).finally(() => {
                setIsLoading(false);
              });
            }
          }
        }
      } catch (err) {
        console.error('Error handling Auth0 callback:', err);
      }
    }
  }, []);

  const handleAuth0Redirect = () => {
    if (!auth0Domain || !auth0ClientId) {
      setErrorMsg('Auth0 environment variables (VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID) are not configured.');
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/admin`);
    const nonce = Math.random().toString(36).substring(2);
    const authUrl = `https://${auth0Domain}/authorize?client_id=${auth0ClientId}&response_type=id_token&redirect_uri=${redirectUri}&scope=openid%20profile%20email&nonce=${nonce}`;
    window.location.href = authUrl;
  };

  // Handle Step 1: Submit Primary Passphrase
  const handlePrimaryLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !passphrase) {
      setErrorMsg('Please enter both your login identifier and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.login(identifier.trim(), passphrase);
      if (res.requireMfa && res.challengeToken) {
        setMfaRequired(true);
        setChallengeToken(res.challengeToken);
        setHasPasskeys(res.hasPasskeys || false);
        setSuccessMsg('Primary credentials verified. Secondary MFA challenge mandatory.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Authentication challenge failed. Verify credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2A: Verify TOTP Code
  const handleVerifyTotp = async (e: FormEvent) => {
    e.preventDefault();
    if (!challengeToken || totpCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit authenticator code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.verifyTotp(challengeToken, totpCode.trim());
      if (res.authenticated) {
        onAuthenticated(res.profile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Invalid authenticator code. Check device time and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2B: Verify Passkey WebAuthn
  const handleVerifyPasskey = async () => {
    if (!challengeToken) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const options = await apiClient.getPasskeyLoginOptions();
      const authResp = await startAuthentication({ optionsJSON: options });
      const res = await apiClient.verifyPasskeyLogin(challengeToken, authResp);
      if (res.authenticated) {
        onAuthenticated(res.profile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Passkey verification failed or was cancelled.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2C: Verify Recovery Code
  const handleVerifyRecovery = async (e: FormEvent) => {
    e.preventDefault();
    if (!challengeToken || recoveryCode.trim().length < 8) {
      setErrorMsg('Please enter a valid emergency recovery code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.verifyRecoveryCode(challengeToken, recoveryCode.trim());
      if (res.authenticated) {
        onAuthenticated(res.profile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Invalid or already consumed recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your verified administrator account email.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.forgotPassword(forgotEmail.trim());
      setSuccessMsg(res.message);
      setForgotPasswordOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Failed to dispatch recovery request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 font-mono text-xs">
      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Header Indicator */}
        <div className="inline-flex items-center space-x-2 text-[11px] text-[#A8B8A7]">
          <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
          <span>PORTFOLIO OWNER AUTHENTICATION</span>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#F0F0ED]">
            {mfaRequired ? 'Multi-Factor Challenge' : 'Administrator Sign In'}
          </h1>
          <p className="text-[#A4A8AE] text-xs leading-relaxed mt-1 font-sans font-light">
            {mfaRequired
              ? 'Mandatory second-factor verification required for owner clearance.'
              : 'Secure identity gate for Chethan Kumar. Protected by Auth0 Universal Login & hardware MFA.'}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-[#181A1F] border border-[#A8B8A7]/40 rounded text-[11px] text-[#A8B8A7] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-950/30 border border-red-500/40 rounded text-[11px] text-red-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forgot Password Modal */}
        {forgotPasswordOpen ? (
          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#A8B8A7] font-semibold">ACCOUNT RECOVERY</span>
              <button 
                onClick={() => setForgotPasswordOpen(false)}
                className="text-[#A4A8AE] hover:text-[#F0F0ED]"
              >
                Cancel
              </button>
            </div>
            <p className="text-[#A4A8AE] text-[11px] leading-relaxed">
              Enter your verified administrator account email. A secure, single-use password recovery ticket will be dispatched to the server-side destination.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your verified owner email"
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors"
              >
                {isLoading ? 'DISPATCHING RECOVERY...' : 'SEND AUTH0 RECOVERY EMAIL'}
              </button>
            </form>
          </div>
        ) : !mfaRequired ? (
          /* STEP 1: PRIMARY CREDENTIALS FORM */
          <form onSubmit={handlePrimaryLogin} className="space-y-4 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
            {auth0Domain && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleAuth0Redirect}
                  className="w-full py-2.5 px-4 rounded bg-[#101114] border border-[#A8B8A7]/40 text-[#F0F0ED] hover:border-[#A8B8A7] flex items-center justify-center space-x-2 transition-colors text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
                  <span>CONTINUE WITH AUTH0 UNIVERSAL LOGIN</span>
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#181A1F] px-2 text-[#A4A8AE]">Or enter master credentials</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#A4A8AE] mb-1.5">Owner Login ID</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your login identifier"
                autoComplete="username"
                className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-3 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#A4A8AE]">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-[11px] text-[#A8B8A7] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-3 pr-10 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A8AE] hover:text-[#F0F0ED] p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'VERIFYING CREDENTIALS...' : 'CONTINUE TO VERIFICATION'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-[#A4A8AE]">
              <span>Policy: Mandatory Multi-Factor Verification</span>
              <span className="text-[#A8B8A7]">Hardware MFA Enforced</span>
            </div>
          </form>
        ) : (
          /* STEP 2: MANDATORY MFA CHALLENGE */
          <div className="space-y-4 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
            {/* Factor Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#101114] rounded border border-[rgba(255,255,255,0.06)] text-[11px]">
              <button
                type="button"
                onClick={() => setMfaFactor('TOTP')}
                className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                  mfaFactor === 'TOTP' ? 'bg-[#22252C] text-[#F0F0ED] font-medium' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Authenticator</span>
              </button>
              <button
                type="button"
                onClick={() => setMfaFactor('PASSKEY')}
                className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                  mfaFactor === 'PASSKEY' ? 'bg-[#22252C] text-[#F0F0ED] font-medium' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Passkey</span>
              </button>
              <button
                type="button"
                onClick={() => setMfaFactor('RECOVERY')}
                className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                  mfaFactor === 'RECOVERY' ? 'bg-[#22252C] text-[#F0F0ED] font-medium' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Backup Code</span>
              </button>
            </div>

            {/* Factor 1: Authenticator App */}
            {mfaFactor === 'TOTP' && (
              <form onSubmit={handleVerifyTotp} className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[#A4A8AE]">
                      Google / Microsoft Authenticator 6-Digit Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTotp(!showTotp)}
                      className="text-[11px] text-[#A8B8A7] hover:underline flex items-center space-x-1"
                    >
                      {showTotp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showTotp ? 'Mask code' : 'Reveal code'}</span>
                    </button>
                  </div>
                  <input
                    type={showTotp ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    autoFocus
                    className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-3 text-center text-xl tracking-[0.3em] font-mono text-[#A8B8A7] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <p className="text-[11px] text-[#A4A8AE] mt-1.5 flex flex-col gap-0.5">
                    <span>Enter the 6-digit code from your authenticator application.</span>
                    <span className="text-[#A4A8AE]/70 font-mono text-[10px]">
                      RFC 6238 TOTP verification with strict 30-second time synchronization.
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="w-full py-3 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'VERIFYING TOTP CODE...' : 'VERIFY & ENTER CONSOLE'}
                </button>
              </form>
            )}

            {/* Factor 2: WebAuthn Passkey */}
            {mfaFactor === 'PASSKEY' && (
              <div className="space-y-4 pt-2 text-center">
                <div className="p-6 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2">
                  <Fingerprint className="w-10 h-10 text-[#A8B8A7] mx-auto animate-pulse" />
                  <p className="text-sm text-[#F0F0ED] font-display">Biometric / Hardware Passkey</p>
                  <p className="text-[11px] text-[#A4A8AE]">
                    {hasPasskeys
                      ? 'Use Windows Hello, Touch ID, or your physical FIDO2 security key to verify.'
                      : 'No passkeys currently enrolled. You can enroll Windows Hello or Touch ID inside Account & Security once logged in.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyPasskey}
                  disabled={isLoading || !hasPasskeys}
                  className="w-full py-3 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'WAITING FOR SENSOR...' : 'ACTIVATE WEBAUTHN SENSOR'}
                </button>
              </div>
            )}

            {/* Factor 3: Emergency Recovery Code */}
            {mfaFactor === 'RECOVERY' && (
              <form onSubmit={handleVerifyRecovery} className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[#A4A8AE]">
                      Single-Use Emergency Recovery Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(!showRecovery)}
                      className="text-[11px] text-[#A8B8A7] hover:underline flex items-center space-x-1"
                    >
                      {showRecovery ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRecovery ? 'Mask code' : 'Reveal code'}</span>
                    </button>
                  </div>
                  <input
                    type={showRecovery ? 'text' : 'password'}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="••••-••••-••••-••••"
                    autoComplete="off"
                    className="w-full bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded p-3 text-center font-mono text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
                  />
                  <p className="text-[11px] text-[#A4A8AE] mt-1.5">
                    Warning: Entering a backup code consumes it permanently and triggers an immediate security alert.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || recoveryCode.trim().length < 8}
                  className="w-full py-3 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'VERIFYING BACKUP CODE...' : 'CONSUME RECOVERY CODE & ENTER'}
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setChallengeToken(null);
                  setTotpCode('');
                  setRecoveryCode('');
                  setErrorMsg('');
                }}
                className="text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to primary login</span>
              </button>
              <span className="text-[#A8B8A7]">Identity: Verified Primary Factor</span>
            </div>
          </div>
        )}

        {/* Security Architecture Footnote */}
        <div className="p-4 bg-[#181A1F] border border-[rgba(255,255,255,0.06)] rounded text-[11px] text-[#A4A8AE]/80 space-y-1">
          <div className="flex items-center space-x-1.5 text-[#A8B8A7] font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ENTERPRISE SECURITY SPECIFICATION</span>
          </div>
          <p>
            Owner authentication protected by multi-factor verification (WebAuthn/FIDO2 & RFC 6238 TOTP), cryptographic session tokens, and automated anomaly alerts. Passwords and recovery keys are never logged or stored in plaintext.
          </p>
        </div>
      </div>
    </div>
  );
}
