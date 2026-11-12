# Identity and Access Management (IAM) Specification

## 1. Architectural Overview

The portfolio uses an enterprise IAM architecture combining **Auth0 Universal Login** (PKCE Authorization Code Flow), hardware-backed **WebAuthn Passkeys**, **RFC 6238 Software Authenticator (TOTP)**, and out-of-band email verification.

```
[Owner Login Request]
        │
        ▼
[Primary Credentials Check]
   (Auth0 / Secured Gate)
        │
        ├─ Passed? ───────► Issue 5-minute Ephemeral Challenge Token
        └─ Failed? ───────► Log Audit Failure & Return HTTP 401
                                │
                                ▼
                   [Mandatory Second-Factor Challenge]
                                │
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
   [TOTP Authenticator]  [WebAuthn Passkey]   [Emergency Recovery]
   (Google/Microsoft)    (Touch ID / Hello)   (Single-Use SHA-256)
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │ Factor Validated
                                ▼
               [Create Cryptographic Active Session]
               [Dispatch Login Alert Email in IST]
               [Owner Security Console Clearance]
```

---

## 2. Authentication Tiers

### Experience A: Public Review (Zero-Friction)
- Target: Hiring managers, engineering recruiters, developers.
- Requires zero authentication.
- Full access to `/work`, `/evidence`, `/archive`, `/executive-brief`, `/academics`, `/contact`, and `/resume`.

### Experience B: Private Recruiter Access
- Target: Pre-vetted recruiters invited by Chethan for private review.
- Access mechanism: Cryptographic token (`REC-2026-XXXX-XXXX-XXXX`).
- Storage: Cryptographic SHA-256 hash. Plaintext secret is never stored.
- Scope: Read-only candidate verification; zero administrative rights.

### Experience C: Owner Administration (`/admin`)
- Target: Chethan Kumar B S (`owner@example.com`).
- Enforced Policy: Primary password + mandatory secondary MFA challenge (TOTP or Passkey).
- No remembered-browser bypass.
- Step-up reauthentication enforced for sensitive security modifications (password reset, email change, factor revocation).

---

## 3. Auth0 Production Configuration Guide

To connect your Auth0 tenant for enterprise single sign-on:

1. **Create an Application** in the [Auth0 Dashboard](https://manage.auth0.com):
   - Type: Single Page Web Application
   - Token Endpoint Auth Method: `None` (PKCE)
2. **Configure Allowed URLs**:
   - **Allowed Callback URLs:** `http://localhost:3000/admin, https://chethankumar.dev/admin`
   - **Allowed Logout URLs:** `http://localhost:3000, https://chethankumar.dev`
   - **Allowed Web Origins:** `http://localhost:3000, https://chethankumar.dev`
3. **Configure Multi-Factor Authentication (MFA)**:
   - Navigate to **Security -> Multi-factor Auth**.
   - Enable **One-time Password (TOTP)** (Google Authenticator, Microsoft Authenticator).
   - Enable **FIDO2 / WebAuthn with Device Biometrics**.
   - Set Policy to **Always Require MFA**.
4. **Configure Post-Login Action** (for event webhook dispatch):
   ```javascript
   exports.onExecutePostLogin = async (event, api) => {
     // Forward successful login metadata to your portfolio security endpoint
     // Server records IP, user-agent, and triggers IST email dispatch to owner@example.com
   };
   ```
5. **Populate Environment Variables**:
   ```bash
   VITE_AUTH0_DOMAIN="your-tenant.us.auth0.com"
   VITE_AUTH0_CLIENT_ID="your_client_id_here"
   VITE_AUTH0_AUDIENCE="https://api.chethankumar.dev"
   ```

---

## 4. Multi-Factor Enrollment Protocols

### A. TOTP Software Authenticator
- Generates 160-bit Base32 secret.
- Renders high-contrast QR code via `qrcode` with `otpauth://totp/ChethanKumarPortfolio:owner@example.com`.
- Requires user to submit a valid 6-digit code before factor is registered as active.
- Emits audit log entry and dispatches security alert email.

### B. W3C WebAuthn Level 3 Passkeys
- Generates cryptographic registration options with RP ID: `localhost` / `chethankumar.dev`.
- Invokes native `navigator.credentials.create()` via `@simplewebauthn/browser`.
- Verifies authenticator data, client data JSON, and public key via `@simplewebauthn/server`.
- Stores credential ID, public key buffer, device label, and sign count.
- Enforces phishing resistance against reverse-proxy attacks.

### C. Emergency Backup Codes
- Generates 10 16-character alphanumeric backup codes formatted as `XXXX-XXXX-XXXX-XXXX`.
- Revealed strictly once with TXT download and print options.
- Server retains only SHA-256 hashes.
- Usage is audited and triggers a critical email notification.
