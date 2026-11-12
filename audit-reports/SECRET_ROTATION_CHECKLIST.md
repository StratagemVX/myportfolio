# Secret Rotation & Production Cutover Checklist

**Repository:** `StratagemVX/myportfolio`  
**Important:** Do **not** commit real secrets, tokens, private keys, phone numbers, or personal emails into Git. Rotate and apply values strictly in encrypted hosting dashboards (Vercel, Railway, Auth0, Twilio, Firebase, GitHub Secrets).

---

## 1. Mandatory Pre-Deployment Secret Rotations (PR #1 Requirement)

Because legacy defaults or fallback behavior existed prior to PR #1 (`security/fail-closed-admin-auth`), PR #1 intentionally fails closed if weak, short, or placeholder credentials are supplied when `NODE_ENV=production`.

| Secret / Variable | Hosting Location | Required Action | Verification |
|---|---|---|---|
| `ADMIN_PASSWORD` | Railway / Serverless Backend | Generate a fresh unique passphrase (>= 16 chars, non-dictionary, non-placeholder, e.g. `openssl rand -base64 24`). | Backend starts without fail-closed validation errors; `/api/auth/login` authenticates owner. |
| `SECURITY_HMAC_KEY` | Railway / Serverless Backend | Generate a fresh 256-bit random secret (`openssl rand -hex 32`). Rotating invalidates prior OTP hashes & legacy session signatures immediately. | Backend starts cleanly; active admin sessions re-authenticate cleanly. |
| `CORS_ALLOWED_ORIGINS` | Railway / Serverless Backend | Set strictly to production HTTPS origins (e.g. `https://chethan-kumar-portfolio.vercel.app`), omitting all `http://localhost:*` origins. | Cross-origin requests from unapproved origins are rejected. |
| `AUTH0_DOMAIN` & `AUTH0_CLIENT_ID` | Railway + Vercel (`VITE_*`) | Confirm production Auth0 SPA client ID and tenant domain match verified owner email/account with `email_verified: true`. | `/admin` Auth0 Universal Login exchanges valid ID token accepted by `/api/auth/auth0-verify`. |
| `WEBAUTHN_RP_ID` | Railway (optional override) | Confirm matches exact production domain (`chethan-kumar-portfolio.vercel.app`) if proxied or behind custom domain. | Hardware Passkey registration/login succeeds on production URL. |

---

## 2. Third-Party Provider & PII Hygiene Checklist

| Provider / Credential | Reason | Owner Action |
|---|---|---|
| **Twilio (`TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SECRET`, `TWILIO_ACCOUNT_SID`)** | Defense-in-depth rotation & webhook signature validation | Rotate API key / auth token in Twilio Console and update Railway env vars cleanly. Confirm `TWILIO_FROM_NUMBER` is stored only in env, not in tracked docs. |
| **Owner Alert Contacts (`OWNER_ALERT_EMAIL`, `OWNER_ALERT_PHONE_E164`, `OWNER_WHATSAPP_PHONE_E164`)** | Personal email/phone previously committed in `main` Markdown docs (redacted in PR #2) | Confirm target email/phone remain stored only as private server env vars. Review whether GitHub repository history scrubbing is desired separately. |
| **WhatsApp Webhook Token (`WHATSAPP_WEBHOOK_VERIFY_TOKEN`)** | Removed hardcoded fallback token in PR #1 (`server/apiHandler.ts`) | Set a unique random verify token (`openssl rand -hex 24`) in backend env and Meta Developer Webhook config before enabling WhatsApp callbacks. |
| **Resend / SMTP (`RESEND_API_KEY`, `SMTP_PASS`)** | Routine credential hygiene | Rotate in provider dashboard if previously used outside current secret vault. |
| **Firebase Service Account (`FIREBASE_PRIVATE_KEY`)** | Admin SDK JSON key hygiene | Confirm private key has single-line `\n` escapes in hosting secret store and minimal IAM permissions. |
| **GitHub Token (`GITHUB_TOKEN`)** | Used by `scripts/sync-github.mjs` / manual admin sync | Confirm fine-grained PAT scope is minimal (`public_repo` / `actions:write` only if needed) and expiration policy is set. |
