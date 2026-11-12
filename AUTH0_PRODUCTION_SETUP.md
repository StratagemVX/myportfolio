# Auth0 Production Configuration: Chethan Kumar B S Engineering Portfolio

This guide outlines the production configuration required in your [Auth0 Dashboard](https://manage.auth0.com) to support the deployed Vercel frontend and Railway backend.

---

## 1. Auth0 Application Settings (Single-Page Application)

In your Auth0 Dashboard under **Applications** → **Applications** → *[Your Portfolio SPA Application]*:

| Setting | Production Value | Description |
| :--- | :--- | :--- |
| **Application Type** | Single Page Application | React SPA using `@auth0/auth0-react` |
| **Allowed Callback URLs** | `https://chethan-kumar-portfolio.vercel.app/admin`, `https://chethan-kumar-portfolio.vercel.app`, `http://localhost:3000/admin` | Redirect targets after Universal Login |
| **Allowed Logout URLs** | `https://chethan-kumar-portfolio.vercel.app/admin`, `https://chethan-kumar-portfolio.vercel.app`, `http://localhost:3000/admin` | Allowed destinations after user logs out |
| **Allowed Web Origins** | `https://chethan-kumar-portfolio.vercel.app`, `http://localhost:3000` | Domains permitted to exchange authorization codes |
| **Allowed Origins (CORS)** | `https://chethan-kumar-portfolio.vercel.app`, `http://localhost:3000` | Cross-origin request origins |

---

## 2. Multi-Factor Authentication (MFA) Policy

In Auth0 under **Security** → **Multi-factor Auth**:
- **Policy:** *Always require Multi-factor Authentication*
- **Allowed Factors:**
  - One-Time Password (Google Authenticator, Microsoft Authenticator)
  - FIDO2 / WebAuthn (Touch ID, Windows Hello, YubiKey)
  - Recovery Codes

---

## 3. Account Linking & Security Gate Synchronization

The application's backend (`server/apiHandler.ts`) automatically validates the incoming Auth0 user identity against authorized owner emails:
- `owner@example.com`
- `karnashaiva81@gmail.com`

Any other Auth0 identity that logs in is rejected with HTTP 403 Forbidden:
`"Access denied: Unauthorized Auth0 identity. Only the verified portfolio owner has administrative access."`
