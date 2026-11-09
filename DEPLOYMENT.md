# Production Deployment & Hosting Guide

## 1. Architecture Overview

The platform deploys as a modern single-page application (SPA) backed by serverless API handlers:

```
[Vercel Edge Network / CDN]
        │
        ├─ Static Assets (/assets/*) ──────► Immutable Edge Cache (1 year)
        ├─ API Endpoints (/api/*) ────────► Serverless Node.js Runtime (api/index.ts)
        └─ Web Routes (/*) ────────────────► Single-Page App Index (index.html)
```

---

## 2. Vercel Deployment (Recommended)

1. **Push Code to GitHub:**
   Ensure the latest commit is on your primary repository branch (e.g. `main`).
2. **Import Project into Vercel:**
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build` (`tsc && vite build`)
   - Output Directory: `dist`
3. **Configure Environment Variables in Vercel:**
   Navigate to **Project Settings -> Environment Variables** and add:
   - `VITE_PORTFOLIO_ENV`: `production`
   - `VITE_AUTH0_DOMAIN`: `your-tenant.us.auth0.com`
   - `VITE_AUTH0_CLIENT_ID`: `your_client_id`
   - `VITE_AUTH0_AUDIENCE`: `https://api.chethankumar.dev`
   - `SECURITY_HMAC_KEY`: `[32+ random hex characters]`
   - `RESEND_API_KEY`: `[Your Resend API Key]` (for live email dispatch)
   - `EMAIL_FROM`: `security@chethankumar.dev`
4. **Deploy:** Click **Deploy**. Vercel will build the TypeScript source, optimize Vite bundles, and publish to the global Edge network in ~30 seconds.

---

## 3. Serverless API Routing Configuration (`vercel.json`)

Vercel utilizes `vercel.json` to route `/api/*` requests to the serverless entry point `api/index.ts` while directing web routes to `dist/index.html`:

```json
{
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Local Development & Testing

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   *Vite automatically launches on `http://localhost:3000` with hot module replacement and built-in `/api/*` server middleware.*
3. **Execute Vitest Verification Suite:**
   ```bash
   npm test
   ```
   *Runs all 13 unit, cryptographic, and IAM integration tests.*
4. **Compile Production Bundle Locally:**
   ```bash
   npm run build
   ```

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit `https://your-domain.com/work` — Verify featured engineering projects render.
- [ ] Visit `https://your-domain.com/executive-brief` — Verify 60-second summary and evidence matrix.
- [ ] Visit `https://your-domain.com/admin` — Verify the Administrator Security Gate renders.
- [ ] Test Primary Login (`the.suryaputraa@gmail.com` + passphrase) -> Verify mandatory MFA challenge triggers.
- [ ] Test Authenticator App (TOTP) or Emergency Backup Code -> Verify entry to Account & Security.
- [ ] In Account & Security -> Test "Send Test Email" -> Verify dispatch to `the.suryaputraa@gmail.com`.
- [ ] In Account & Security -> Inspect Security Activity -> Verify events are recorded with IST timestamps.
- [ ] Test Private Recruiter Access -> Issue invitation token -> Verify single-use reveal and validation.
