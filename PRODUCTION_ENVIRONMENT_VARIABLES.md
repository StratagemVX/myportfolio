# Production Environment Variables Inventory: Chethan Kumar Engineering Portfolio

This document provides an accurate inventory of all environment variables read by the frontend and backend runtime, their security scopes, hosting platform, and distinction between local development vs. production secrets.

> [!IMPORTANT]
> Never commit populated `.env` files, personal phone numbers, personal emails, private infrastructure subdomains, tokens, or secrets into Git. Keep `.env.example` placeholder-only and configure production values exclusively in encrypted hosting secret managers (Vercel / Railway / GitHub Secrets).

---

## 1. Local Development vs. Production Secrets

| Aspect | Local Development (`.env.local` / `.env`) | Production (`NODE_ENV=production`) |
|---|---|---|
| **Secrets (`ADMIN_PASSWORD`, `SECURITY_HMAC_KEY`)** | Non-sensitive development values for local testing (`tests/` & local server) | **Mandatory & fail-closed.** Must pass strength & placeholder validation (`ADMIN_PASSWORD` >= 16 chars, `SECURITY_HMAC_KEY` >= 32 bytes; example/placeholder strings are rejected). |
| **CORS (`CORS_ALLOWED_ORIGINS`)** | `http://localhost:5173,http://localhost:3000` | Explicit comma-separated HTTPS origin allowlist (`https://chethan-kumar-portfolio.vercel.app,...`). Unlisted origins are rejected fail-closed. |
| **Persistence** | Local JSON fallback (`server/security-state.json`, `server/notifications-log.json` or custom `STATE_FILE_PATH`) | Firebase Firestore Admin SDK (`FIREBASE_*`) recommended for ephemeral serverless runtimes. |

Generate strong production secrets before deployment:

```bash
openssl rand -hex 32   # SECURITY_HMAC_KEY (>= 64 hex chars / 32 random bytes)
openssl rand -base64 24 # ADMIN_PASSWORD (>= 16 chars)
```

---

## 2. Frontend Build Variables (Vercel — Public to Browser)

Variables prefixed with `VITE_` are compiled into static browser bundles and must **never** hold secrets.

| Variable | Platform | Example Value | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Vercel (optional) | `https://your-backend.example.com` | Optional API origin when frontend is hosted separately from API; omit when using same-origin `/api/*` routing. |
| `VITE_AUTH0_DOMAIN` | Vercel | `your-tenant.us.auth0.com` | Auth0 Universal Login tenant domain for SPA SDK. |
| `VITE_AUTH0_CLIENT_ID` | Vercel | `your_auth0_spa_client_id` | Public SPA Client ID for Auth0 PKCE login. |

---

## 3. Backend Runtime & Security Variables (Serverless / Node API — Secret)

These variables are read exclusively by `server/` and `api/serverless.ts`.

### Core Security & Runtime

| Variable | Required in Prod | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | Set to `production` to enforce strict fail-closed secrets, CORS, and cookie/header protections. |
| `PORT` | No | Listening port for `server/index.ts` (default `3001`). |
| `ADMIN_PASSWORD` | Yes | Strong administrator password (minimum 16 characters; placeholders/default strings rejected). |
| `SECURITY_HMAC_KEY` | Yes | High-entropy HMAC signing & OTP key (minimum 32 bytes; placeholders/default strings rejected). |
| `CORS_ALLOWED_ORIGINS` | Yes | Strict comma-separated allowlist of trusted browser origins. |
| `AUTH0_DOMAIN` | Recommended | Auth0 tenant domain used by `server/auth0.ts` to verify JWT signatures (RS256/JWKS), issuer, audience, and verified owner email. |
| `GITHUB_TOKEN` | No | Optional GitHub PAT for `scripts/sync-github.mjs` and owner-authenticated `/api/admin/sync` dispatch. |
| `STATE_FILE_PATH` | No | Override path for local JSON security state persistence. |
| `NOTIFICATIONS_LOG_PATH` | No | Override path for local JSON notification delivery log. |

### Firebase Firestore Admin SDK (Optional Persistent State)

| Variable | Description |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | Google Cloud / Firebase project ID. |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email (`...@...iam.gserviceaccount.com`). |
| `FIREBASE_PRIVATE_KEY` | Service account RSA private key (escape newlines as `\n` in single-line env stores). |

### Multi-Channel Notification & Webhook Configuration (Optional)

| Variable | Description |
| :--- | :--- |
| `OWNER_ALERT_EMAIL` | Security alert & OTP destination email address (`owner@example.com`). |
| `OWNER_ALERT_PHONE_E164` | Owner E.164 SMS destination (`+15550000000`). |
| `OWNER_WHATSAPP_PHONE_E164` | Owner E.164 WhatsApp destination (`+15550000000`). |
| `EMAIL_PROVIDER` | Active email transport selector (`twilio`, `resend`, or `smtp`). |
| `EMAIL_FROM_ADDRESS` | Generic sender email address (`security@example.com`). |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (`AC...`). |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (also used for webhook signature validation). |
| `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` | Scoped Twilio API key credentials. |
| `TWILIO_ACCOUNT_EMAIL` | Account email metadata for Twilio diagnostics. |
| `TWILIO_FROM_NUMBER` | Approved E.164 SMS sender number (`+15005550006` placeholder). |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional Twilio Messaging Service SID (`MG...`). |
| `TWILIO_EMAIL_FROM_ADDRESS` | Sender address for Twilio Comms Email API. |
| `TWILIO_EMAIL_API_BASE_URL` | Twilio Comms Email endpoint URL. |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender (`whatsapp:+14155238886`). |
| `TWILIO_SMS_STATUS_CALLBACK_URL` | HTTPS webhook URL for SMS delivery callbacks. |
| `TWILIO_WHATSAPP_STATUS_CALLBACK_URL` | HTTPS webhook URL for WhatsApp callbacks. |
| `TWILIO_STATUS_CALLBACK_URL` | Fallback Twilio status callback URL. |
| `TWILIO_VERIFIED_RECIPIENT_PHONE` | Confirmed E.164 verified caller ID on Twilio trial accounts. |
| `TWILIO_TRIAL_MODE` | Set `"true"` when running on a Twilio trial account. |
| `PHONE_OWNERSHIP_VERIFIED` | `"true"` / `"false"` tracking verified SMS destination ownership. |
| `TWILIO_EMAIL_DOMAIN_VERIFIED` | `"true"` / `"false"` tracking verified email sender domain. |
| `TWILIO_WHATSAPP_SANDBOX_JOINED` | `"true"` / `"false"` tracking WhatsApp sandbox opt-in. |
| `WHATSAPP_OWNERSHIP_VERIFIED` | `"true"` / `"false"` tracking WhatsApp destination verification. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | High-entropy token verified on Meta WhatsApp webhook subscription challenge. |
| `RESEND_API_KEY` / `RESEND_DOMAIN_VERIFIED` | Resend API key and domain verification flag. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Standard SMTP fallback configuration. |
