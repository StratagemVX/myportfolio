# Auth0 Multi-Factor Authentication (MFA) & Tenant Setup Guide

This guide provides end-to-end instructions for configuring your Auth0 tenant for Chethan Kumar's portfolio owner administration system.

---

## 1. Application Registration in Auth0 Dashboard

1. Log into your [Auth0 Dashboard](https://manage.auth0.com/).
2. Navigate to **Applications** > **Applications** > Click **Create Application**.
3. Choose:
   - **Name:** `Portfolio Owner Security Portal`
   - **Application Type:** `Single Page Application (SPA)`
4. Under **Settings**, configure the URLs:
   - **Allowed Callback URLs:**
     ```
     http://localhost:3000,
     http://localhost:3000/admin,
     https://chethankumar.dev,
     https://chethankumar.dev/admin
     ```
   - **Allowed Logout URLs:**
     ```
     http://localhost:3000,
     http://localhost:3000/admin,
     https://chethankumar.dev,
     https://chethankumar.dev/admin
     ```
   - **Allowed Web Origins:**
     ```
     http://localhost:3000,
     https://chethankumar.dev
     ```
5. Click **Save Changes**.

---

## 2. Multi-Factor Authentication (MFA) Policy

1. In the Auth0 Dashboard, go to **Security** > **Multi-factor Auth**.
2. Set **Require Multi-factor Auth** to **Always**.
3. Enable the following factors:
   - **One-time Password (TOTP):** Enable. This supports Google Authenticator and Microsoft Authenticator.
   - **WebAuthn (Passkeys & Biometrics):** Enable. This supports Windows Hello, Touch ID, and YubiKeys.
   - **Recovery Codes:** Enable for offline emergency account recovery.
4. Customize the TOTP display name:
   - **Issuer:** `Chethan Kumar Portfolio`

---

## 3. Account Migration & Verified Email Setup

The owner account requires a verified email matching the server-side configuration:

1. Go to **User Management** > **Users**.
2. Locate or create the primary owner account.
3. Verify that the user's email address is:
   `owner@example.com`
4. Toggle **Email Verified** to **true** (or dispatch the verification email and click the confirmation link).
5. If the account currently uses a different email address:
   - Update the email to `owner@example.com`.
   - Send the verification email to confirm ownership before activating password reset.
   - Never use an unverified email for administrative access.

---

## 4. Custom Email Provider Configuration (Auth0)

By default, Auth0 uses a shared development email server with strict rate limits. For production reliability:

1. Navigate to **Branding** > **Email Provider**.
2. Enable **Use my own email provider**.
3. Select your provider:
   - **Resend (via SMTP):** Host: `smtp.resend.com`, Port: `587`, User: `resend`, Password: `<YOUR_RESEND_API_KEY>`.
   - **SendGrid:** API Key authentication.
   - **Custom SMTP:** Connect your host, user, and pass.
4. Set **From** address to: `security@chethankumar.dev` (or your verified domain sender).
5. Save and send a test email to verify delivery.

---

## 5. Factor Protection Policy Enforcement

The application enforces a strict **Factor Protection Policy**:
- An administrator cannot remove or revoke their last active second factor.
- If only Google Authenticator is enrolled and no passkeys or recovery codes exist, the system blocks factor deletion.
- To revoke an authenticator, you must first enroll Microsoft Authenticator, a WebAuthn passkey, or regenerate recovery codes.
