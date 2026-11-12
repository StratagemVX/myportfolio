# Railway Production Deployment: Chethan Kumar B S Engineering Portfolio

**Project:** `chethan-portfolio-backend`  
**Project ID:** `2111f0d8-a0c4-47d4-9d44-40ad805cef27`  
**Environment:** `production` (`c2896ac3-5c32-4a79-a0fa-e7fc1bddd84a`)  
**Service Name:** `backend-api`  
**Service ID:** `023fc46f-216d-44de-afae-ea4be0c3f508`  
**Production URL:** [https://your-backend.example.com](https://your-backend.example.com)  
**Health Check Endpoint:** `https://your-backend.example.com/health`  
**Readiness Endpoint:** `https://your-backend.example.com/health/ready`

---

## 1. Backend Service Configuration

- **Runtime:** Node.js v22 (HTTP/REST Microservice Architecture)
- **Start Command:** `npm run start:server` (`vite-node server/index.ts` / `node server/index.ts`)
- **Port:** Uses Railway's dynamically injected `$PORT` environment variable (`0.0.0.0`)
- **Healthcheck Path:** `/health` (Timeout: 30s)
- **Restart Policy:** `ON_FAILURE` (Max retries: 5)
- **Builder:** `NIXPACKS`
- **CORS Allowed Origins:**
  - `https://chethan-kumar-portfolio.vercel.app`
  - `https://*.vercel.app`
  - `http://localhost:3000`

---

## 2. Configured Production Environment Variables

All 28 sensitive production variables were set directly on the Railway service via the secure integration API:

| Variable | Scope | Status | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Service | `production` | Production runtime optimizations |
| `FRONTEND_URL` | Service | Configured | Primary client web origin |
| `CORS_ALLOWED_ORIGINS` | Service | Configured | Strict whitelist for browser credentials |
| `SECURITY_HMAC_KEY` | Service | Configured | Cryptographic salt & signature seed |
| `TWILIO_ACCOUNT_SID` | Service | Configured | Twilio communication infrastructure |
| `TWILIO_AUTH_TOKEN` | Service | Configured | Twilio API authentication token |
| `TWILIO_API_KEY_SID` | Service | Configured | High-security API key identifier |
| `TWILIO_FROM_NUMBER` | Service | Configured | Verified E.164 SMS sender number |
| `OWNER_ALERT_PHONE_E164` | Service | Configured | Verified owner phone (`+15550000000`) |
| `TWILIO_WHATSAPP_FROM` | Service | Configured | Verified WhatsApp sandbox sender |
| `OWNER_WHATSAPP_PHONE_E164` | Service | Configured | Verified WhatsApp recipient |
| `OWNER_ALERT_EMAIL` | Service | Configured | Primary owner security inbox |
| `ENABLE_EMAIL_SECURITY_ALERTS` | Service | `true` | Real-time security email alerts |
| `ENABLE_SMS_SECURITY_ALERTS` | Service | `true` | Real-time SMS security alerts |
| `ENABLE_WHATSAPP_SECURITY_ALERTS`| Service | `true` | Real-time WhatsApp security alerts |

---

## 3. GitHub Source Connection Step (User Action Required)

Because Railway requires a 1-click GitHub account link for services that build directly from GitHub repositories:

1. Open the [Railway Dashboard](https://railway.app/account).
2. Go to **Settings** → **Connected Accounts**.
3. Click **Connect GitHub** and authorize your account (`StratagemVX`).
4. Once linked, the service `backend-api` in project `chethan-portfolio-backend` can automatically build from your GitHub repository `https://github.com/StratagemVX` whenever you push changes to `main`.
