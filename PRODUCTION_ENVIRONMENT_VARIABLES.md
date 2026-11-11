# Production Environment Variables Inventory: Chethan Kumar B S Engineering Portfolio

This document provides a complete inventory of all production environment variables, their security scopes, which platform hosts them, and their purpose.

> [!IMPORTANT]
> Never commit actual credentials to Git or public repositories. Only `.env.example` should be tracked in source control.

---

## 1. Frontend Environment Variables (Vercel)

These variables are public to the client browser and are prefixed with `VITE_`. They must **NEVER** contain API secrets or private keys.

| Variable | Platform | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Vercel | `https://backend-api-production-c798.up.railway.app` | Base URL for Railway backend REST endpoints |
| `VITE_AUTH0_DOMAIN` | Vercel | `dev-xxxx.us.auth0.com` | Auth0 Universal Login tenant domain |
| `VITE_AUTH0_CLIENT_ID`| Vercel | `your_auth0_spa_client_id` | Public SPA Client ID for Auth0 React SDK |
| `VITE_FIREBASE_API_KEY`| Vercel | `AIzaSy...` | Firebase Web Client API Key |
| `VITE_FIREBASE_PROJECT_ID`| Vercel | `chethan-portfolio` | Google Cloud / Firebase Project ID |
| `VITE_FIREBASE_APP_ID`| Vercel | `1:123456:web:...` | Firebase Web Application ID |

---

## 2. Backend Environment Variables (Railway)

These variables are strictly private and reside only in Railway's encrypted environment variable store.

### Core Runtime & Networking
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode, strict CORS, and disables stack leakages |
| `PORT` | *(injected by Railway)* | The port the Node.js server binds to (default: 3001) |
| `FRONTEND_URL` | `https://chethan-kumar-portfolio.vercel.app` | Canonical frontend domain for redirect validation |
| `CORS_ALLOWED_ORIGINS` | `https://chethan-kumar-portfolio.vercel.app,https://chethankumar.dev` | Strict origin whitelist for credentialed production requests (never include localhost) |
| `SECURITY_HMAC_KEY` | *(cryptographic secret, min 32 bytes)* | Salt and signature key for session hashing and OTPs |
| `ADMIN_PASSWORD` | *(strong passphrase, min 16 chars)* | Required administrator bootstrap/login credential (never hardcoded) |
| `WEBAUTHN_RP_ID` | `chethan-kumar-portfolio.vercel.app` | Optional explicit WebAuthn Relying Party ID override for custom domains |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | *(cryptographic secret)* | Verification token required for Meta WhatsApp webhook subscription handshake |

### Identity & Auth0 (Backend)
| Variable | Value | Description |
| :--- | :--- | :--- |
| `AUTH0_DOMAIN` | `dev-xxxx.us.auth0.com` | Auth0 tenant domain for backend JWT/JWKS verification |
| `AUTH0_CLIENT_ID` | `your_auth0_spa_client_id` | Auth0 client ID expected in verified ID token `aud` claims |
| `AUTH0_AUDIENCE` | `https://api.chethankumar.dev` | API identifier / audience for JWT claims |
| `AUTH0_CLIENT_SECRET` | *(confidential)* | Machine-to-machine client secret for Management API |

### Firebase Firestore (Admin SDK)
| Variable | Value | Description |
| :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | `chethan-portfolio` | GCP Project ID |
| `FIREBASE_CLIENT_EMAIL`| `firebase-adminsdk@...iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | RSA private key with newline escapes |

### Twilio Telemetry & Security Alerts
| Variable | Value | Description |
| :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | *(secret)* | Twilio Primary Auth Token |
| `TWILIO_API_KEY_SID` | `SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Scoped API Key SID |
| `TWILIO_API_KEY_SECRET`| *(secret)* | Scoped API Key Secret |
| `TWILIO_FROM_NUMBER` | `+17372508034` | Approved E.164 SMS phone number |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Twilio WhatsApp sandbox/business number |
| `OWNER_ALERT_EMAIL` | `the.suryaputraa@gmail.com` | Owner security notification recipient |
| `OWNER_ALERT_PHONE_E164`| `+919380469287` | Owner SMS / WhatsApp alert recipient |
