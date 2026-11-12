# Production Deployment Guide: Chethan Kumar Engineering Portfolio

This guide outlines the production deployment topology, step-by-step procedures, environment variable configuration, and pre-flight validation checklists for deploying Chethan Kumar's engineering portfolio.

---

## 1. System Architecture & Topology

The portfolio architecture follows a decoupled, resilient full-stack deployment model:

```
[ Visitor / Recruiter / Owner Browser ]
            │
            ├─── Global CDN Requests ───► [ Vercel Edge Network ]
            │                             • Static HTML, CSS, Bundled JS
            │                             • Dynamic Client-Side Router (React Router)
            │                             • W3C WebAuthn Biometric Handshake
            │                             • Automatic SSL / TLS 1.3
            │
            └─── Authenticated API ─────► [ Railway API Service ] (or Vite Proxy)
                                          • Node.js 22 LTS Runtime
                                          • Salted PBKDF2-SHA512 Password Verification
                                          • RFC 6238 TOTP Validation Engine
                                          • WebAuthn / FIDO2 Authentication Logic
                                          • Dual Persistence: Firestore + Local JSON
                                          • Twilio SMS, Comms Email, WhatsApp Webhooks
```

---

## 2. Frontend Deployment on Vercel

### Step 1: Connect GitHub Repository
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **New Project** and select `StratagemVX/portfolio` (or your repository name).
3. Framework Preset: **Vite**.
4. Root Directory: `./` (root).

### Step 2: Build & Output Settings
- **Build Command**: `npm run build` (`tsc && vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Configure Frontend Environment Variables
In **Project Settings → Environment Variables**, add:

| Variable | Description | Example / Value |
|---|---|---|
| `VITE_AUTH0_DOMAIN` | Auth0 Tenant Domain | `your-tenant.us.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA Client ID | `AbCdEf123456...` |
| `VITE_AUTH0_AUDIENCE` | Auth0 API Audience Identifier | `https://api.chethankumar.dev` |
| `VITE_API_URL` | Upstream Backend URL (if Railway) | `https://api.chethankumar.dev` (or omit for same-origin) |
| `VITE_PORTFOLIO_ENV` | Runtime Environment Flag | `production` |

### Step 4: Verify `vercel.json`
`vercel.json` is pre-configured in the repository with:
- Strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- SPA client-side rewrite fallback to `index.html` for deep links (`/recruiter-brief`, `/work`, `/evidence`, etc.).

---

## 3. Backend Deployment on Railway

### Step 1: Create New Project on Railway
1. Log in to [Railway](https://railway.app).
2. Click **New Project → Deploy from GitHub repo**.
3. Select the repository.

### Step 2: Build & Deploy Commands
Railway automatically recognizes the root `railway.json` and `Procfile`:
- **Builder**: Nixpacks (Node.js 22)
- **Start Command**: `npm run start:server`
- **Healthcheck Path**: `/api/public/stats`

### Step 3: Configure Backend Environment Variables
In Railway **Variables**, add:

```env
# Server Runtime
PORT=3001
CORS_ORIGIN=https://chethankumar.dev

# Master Owner Credentials & Encryption
ADMIN_PASSWORD=YourStrongMasterPasswordHere!
SECURITY_HMAC_KEY=your-production-hmac-sha256-seed-secret

# Firebase Firestore Adapter (Dual-write & sync)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Twilio Security Alerts
TWILIO_ACCOUNT_SID=AC...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
TWILIO_FROM_NUMBER=+1...
TWILIO_TRIAL_MODE=true
OWNER_ALERT_PHONE_E164=+15550000000
OWNER_ALERT_EMAIL=owner@example.com
```

---

## 4. Production DNS & Domain Mapping

1. **Root Domain (`chethankumar.dev`)**:
   - Point Apex A Record to Vercel IP: `76.76.21.21`
   - Point CNAME `www` to `cname.vercel-dns.com`
2. **API Subdomain (`api.chethankumar.dev`)**:
   - Point CNAME `api` to Railway domain (e.g. `your-app.up.railway.app`).

---

## 5. Pre-Flight Production Verification Checklist

- [ ] Navigation renders Home (`/`) as Item #1.
- [ ] Active indicator correctly highlights Home on `/` and Work on `/work`.
- [ ] All instances of "Recruiter Suite" / "Executive Brief" standardized to "Recruiter Brief".
- [ ] Owner login rejects invalid passwords and arbitrary strings.
- [ ] Authenticator MFA enforces mathematical RFC 6238 TOTP computation (no fixed `123456` bypass).
- [ ] Authenticator and Recovery inputs are masked (`••••••`) with reveal toggles.
- [ ] Single-use backup recovery codes are consumed upon entry and cannot be replayed.
- [ ] Factor protection prevents removing the last MFA factor.
- [ ] Preferred display name ("Karna") updates dynamically in header without overwriting legal name ("Chethan Kumar B S").
- [ ] GitHub repository index reflects verified repositories from `StratagemVX`.
- [ ] `npm run build` completes with 0 errors.
- [ ] `npm test` passes all security and regression suites.
