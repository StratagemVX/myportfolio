# Production Deployment Guide

This guide provides end-to-end deployment instructions for the Chethan Kumar Engineering Portfolio across Vercel (Frontend), Railway (Backend Microservice), and Firebase Firestore (Persistence).

---

## 1. Production Architecture Overview

```mermaid
flowchart LR
    subgraph VercelEdge ["Vercel Edge Network"]
        SPA["React 18 SPA (dist/)<br/>https://chethankumar.dev"]
        VercelRewrite["vercel.json Proxy Rewrite<br/>/api/* -> Railway Backend"]
    end

    subgraph RailwayCloud ["Railway Service Tier"]
        BackendAPI["Node.js Service (:3001)<br/>https://your-backend.example.com"]
    end

    subgraph DataTier ["Firebase Cloud"]
        Firestore["Firestore Database<br/>Spark Plan"]
    end

    subgraph AuthTier ["Auth0 Cloud"]
        Auth0Tenant["Auth0 OIDC Tenant<br/>MFA / Passkeys"]
    end

    SPA -->|Direct API Calls| VercelRewrite
    VercelRewrite -->|HTTPS Proxy| BackendAPI
    BackendAPI <-->|Firebase Admin SDK| Firestore
    SPA <-->|PKCE Auth Code Flow| Auth0Tenant
```

---

## 2. Frontend Deployment: Vercel

The frontend is an optimized Single Page Application built with Vite and React 18.

### 2.1 Vercel Project Setup
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and import the repository: `https://github.com/StratagemVX/myportfolio`.
3. Configure the build parameters:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.2 Reverse Proxy & Route Rewrites (`vercel.json`)
The portfolio uses `vercel.json` to handle SPA client-side deep links and seamlessly proxy `/api/*` requests to the Railway backend without cross-origin issues:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.example.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### 2.3 Frontend Environment Variables (Vercel)
Configure these variables under **Settings → Environment Variables** (set for `Production` and `Preview`):

| Variable Name | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `VITE_AUTH0_DOMAIN` | Yes | Auth0 tenant domain | `dev-xxxx.us.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Yes | Auth0 SPA application client ID | `client_id_placeholder` |
| `VITE_AUTH0_AUDIENCE` | Yes | Audience for backend API authorization | `https://api.chethankumar.dev` |
| `VITE_PORTFOLIO_ENV` | Yes | Current application environment | `production` |

### 2.4 Custom Domain Configuration
1. In Vercel Project Settings, navigate to **Domains**.
2. Add your custom domain: `chethankumar.dev` and `www.chethankumar.dev`.
3. Configure DNS records at your domain registrar:
   - **A Record:** `@` points to `76.76.21.21`
   - **CNAME Record:** `www` points to `cname.vercel-dns.com`

---

## 3. Backend Deployment: Railway

The backend is an event-driven Node.js service running `server/index.ts`.

### 3.1 Railway Service Configuration (`railway.json`)
The repository includes a declarative `railway.json` file configuring Nixpacks builds and automated health monitoring:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:server",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

### 3.2 Railway Deployment Steps
1. Log in to [Railway](https://railway.app).
2. Create a **New Project** → **Deploy from GitHub repo**.
3. Select `StratagemVX/myportfolio`.
4. Under **Settings → Networking**, generate a public Railway domain (e.g., `your-backend.example.com`).
5. Ensure the Healthcheck Path is set to `/health`.

### 3.3 Backend Environment Variables (Railway)
Configure these sensitive server-side variables under **Railway → Variables**:

```ini
# Core Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://chethankumar.dev
CORS_ALLOWED_ORIGINS=https://chethankumar.dev,https://chethan-kumar-portfolio.vercel.app
SECURITY_HMAC_KEY=your_cryptographically_secure_hmac_secret
ADMIN_PASSWORD=your_secure_administrative_passphrase

# Twilio Communications (Optional for alerts)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_twilio_api_key_secret
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_TRIAL_MODE=true
SMS_PROVIDER=twilio
TWILIO_FROM_NUMBER=+15005550006
OWNER_ALERT_PHONE_E164=+91XXXXXXXXXX
EMAIL_PROVIDER=twilio
TWILIO_EMAIL_FROM_ADDRESS=security@chethankumar.dev
OWNER_ALERT_EMAIL=owner@example.com
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OWNER_WHATSAPP_PHONE_E164=+91XXXXXXXXXX

# Firebase Admin SDK (Persistence)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> [!IMPORTANT]
> When pasting `FIREBASE_PRIVATE_KEY` into Railway, ensure newline characters (`\n`) are preserved inside double quotes. The backend automatically converts literal `\n` substrings into true line breaks.

---

## 4. Database Setup: Firebase Firestore

The backend connects to Firebase Firestore via the official `firebase-admin` SDK.

### 4.1 Firebase Project Creation (Spark Free Plan)
1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Create a project on the **Spark (No-Cost)** plan.
3. Enable **Cloud Firestore** in production mode.
4. Navigate to **Project Settings → Service Accounts**.
5. Click **Generate new private key** to download the admin credentials JSON file.

### 4.2 Security Rules Deployment
Deploy the repository's `firestore.rules` using the Firebase CLI or paste directly into the Firebase Console:

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

The deployed rules enforce a strict **Default Deny** security boundary: public clients cannot directly write to audit logs, owner credentials, or recruiter tokens.

---

## 5. Post-Deployment Verification Checklist

Once deployed, verify production health:

```bash
# 1. Verify Frontend Delivery
curl -I https://chethankumar.dev

# 2. Verify Backend Liveness via Railway Direct URL
curl https://your-backend.example.com/health

# 3. Verify Backend Liveness via Vercel Proxy Rewrite
curl https://chethankumar.dev/api/health

# 4. Verify Deep Readiness Check
curl https://chethankumar.dev/api/health/ready
```

Expected HTTP response for `/api/health`:
```json
{
  "status": "HEALTHY",
  "uptimeSeconds": 1420,
  "service": "chethan-portfolio-backend",
  "environment": "production"
}
```
