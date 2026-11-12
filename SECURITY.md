# Enterprise Security Policy & IAM Specification

## 1. Architectural Security Boundaries

The portfolio platform enforces a multi-tier defense-in-depth model separating three distinct access domains:

| Tier | Authentication Barrier | Permissions | Threat Surface & Defenses |
| :--- | :--- | :--- | :--- |
| **Public Visitor** | None (Frictionless access) | Read-only public portfolio, verified projects, case studies, academics, résumé | Content injection, XSS (mitigated by strict React encoding, zero `dangerouslySetInnerHTML`) |
| **Private Recruiter Access** | Cryptographic invitation token (`REC-2026-XXXX-XXXX-XXXX`) | Read-only inspection of confidential brief & evidence | Token brute-forcing (mitigated by 128-bit entropy, SHA-256 server storage, rate limiting) |
| **Owner Administration** | Primary Credentials + Mandatory MFA (TOTP / WebAuthn Passkeys) | Full security controls, recruiter token generation, repository sync, session termination | Credential theft (mitigated by MFA enforcement, biometric passkeys, out-of-band alerts) |

---

## 2. Primary Owner Identity Configuration

- **Designated Owner:** Chethan Kumar B S (`owner@example.com`)
- **Login Identifier:** `owner@example.com` / `stratagem_vx`
- **Security Recovery Email:** `owner@example.com`
- **Security Mobile Destination:** `+15550000000`
- **WhatsApp Notification Destination:** `+15550000000`

> [!IMPORTANT]
> The designated recovery email is kept strictly isolated from ordinary profile edits. Modifying the login identifier requires a recent authenticated session (< 15 min), step-up MFA challenge, dual email verification, and automatic session revocation across all other devices.

---

## 3. Mandatory Multi-Factor Authentication (MFA)

Administrative clearance strictly enforces a second factor at every login:

1. **RFC 6238 Software Authenticator (TOTP):**
   - Compatible with Google Authenticator, Microsoft Authenticator, and 1Password.
   - 160-bit Base32 secret generated server-side.
   - Enforced 30-second time steps with strict drift window (±1 step).
   - Secret is never stored in browser `localStorage` and never transmitted via unencrypted channels.
   - Factor removal protection: The only enrolled factor cannot be removed without enrolling an alternative factor first.

2. **W3C WebAuthn Level 3 (FIDO2 Passkeys):**
   - Supports hardware biometric authenticators: Windows Hello, Apple Touch ID / Face ID, and YubiKeys.
   - Cryptographic challenge-response mechanism resistant to adversary-in-the-middle (AiTM) phishing attacks.
   - Device labels, credential ID hashes, and usage counters stored securely on the server.

3. **Emergency Single-Use Recovery Codes:**
   - 10 emergency backup codes generated with 128-bit cryptographic randomness.
   - Revealed strictly **once** upon generation with download/print actions and offline vault guidance.
   - The server stores only cryptographic **SHA-256 hashes** of the codes.
   - Consuming a recovery code marks it permanently used and dispatches an immediate critical email alert.

---

## 4. Password Management Architecture

1. **Zero Plaintext Storage:** Passwords are never stored, logged, or hashed into an application-owned database.
2. **Authenticated Password Change Flow:**
   - Owner requests a change from Account & Security.
   - Server validates recent authentication and step-up MFA.
   - Server generates a cryptographically random 6-digit confirmation code, hashes it with HMAC-SHA256, and sends it to `owner@example.com` with a 10-minute expiry (max 3 attempts).
   - Upon verification, the server invokes the official Auth0 password-reset workflow, delivering a single-use expiring reset link to the verified owner.
   - All other active sessions are immediately revoked.
3. **Unauthenticated Forgot Password Flow:**
   - Anti-enumeration protection: Returns an identical generic confirmation whether the email exists or not.
   - Native Auth0 reset ticket sent to `owner@example.com`.
   - Mandatory MFA remains enforced at subsequent login; resetting a password never bypasses MFA.

---

## 5. Private Recruiter Access Architecture

- Public technical recruiters and hiring managers can view all featured projects, technical evidence, executive summary, academics, and résumé with zero gatekeeping.
- For confidential out-of-band reviews, the owner can issue temporary, read-only invitation tokens (`REC-2026-XXXX-XXXX-XXXX`).
- Tokens are stored as **SHA-256 hashes**. The plaintext secret is revealed strictly **once** at creation.
- Recruiter tokens possess **zero administrative rights** and cannot trigger syncs or alter system state.

---

## 6. Real-Time Security Notifications & IST Timestamps

All security notifications are generated with timestamps in **Indian Standard Time (IST, UTC +5:30)**:

- **Email Pipeline:** Primary security channel targeting `owner@example.com`. Supports Resend, SendGrid, and SMTP with an emulated delivery queue fallback.
- **SMS Pipeline:** Twilio integration for critical alerts to `+15550000000`.
- **WhatsApp Pipeline:** Meta WhatsApp Cloud API integration for template alerts to `+15550000000`.
- **Payload Hygiene:** Passwords, OTP codes, recovery keys, and reset tokens are strictly forbidden from subject lines and text payloads.

---

## 7. Content Security Policy (CSP) & HTTP Headers

Enforced at the edge via `vercel.json`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://avatars.githubusercontent.com; connect-src 'self' https://api.github.com;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
