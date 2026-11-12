# Local Development & Setup Guide

This guide walks through configuring, running, and testing the Chethan Kumar Engineering Portfolio locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation:

| Prerequisite | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.18.0` | `v20.x LTS` | `node --version` |
| **npm** | `v9.0.0` | `v10.x` | `npm --version` |
| **Git** | `v2.30.0` | Latest | `git --version` |
| **Web Browser** | Modern Chromium / Firefox | Chrome, Edge, Brave | Must support Web Crypto API & WebAuthn |

---

## 2. Repository Cloning & Dependency Installation

Clone the verified repository from GitHub:

```bash
# Clone via HTTPS
git clone https://github.com/StratagemVX/myportfolio.git

# Enter the project directory
cd myportfolio

# Install all runtime dependencies and dev tooling
npm install
```

> [!NOTE]
> On Windows PowerShell, if execution policy errors occur when running local scripts, ensure execution policy is configured for the current session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

## 3. Environment Configuration

The repository includes a safe, sanitized template: `.env.example`. Create your local environment file:

### On Windows (PowerShell):
```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.local
```

### On macOS / Linux (Bash):
```bash
cp .env.example .env
cp .env.example .env.local
```

### Local Development Defaults:
- Set local development environment variables (`ADMIN_PASSWORD`, `SECURITY_HMAC_KEY`, `CORS_ALLOWED_ORIGINS`) in `.env.local` or your shell environment before running `npm run server` (in `NODE_ENV=production`, missing, weak, or placeholder secrets fail closed).
- If **Auth0** is not configured locally (`AUTH0_DOMAIN` / `VITE_AUTH0_*`), admin sign-in uses the configured local password + TOTP / WebAuthn passkey controls; `/admin` remains locked until authenticated.
- If **Firebase Firestore** credentials are not present, the backend uses `server/security-state.json` and `server/notifications-log.json` (or `STATE_FILE_PATH` / `NOTIFICATIONS_LOG_PATH`).
- If **Twilio** or SMTP credentials are unpopulated, notification dispatches record `CONFIGURATION_REQUIRED` / `BLOCKED_CONFIGURATION` diagnostics rather than crashing.

---

## 4. Running the Development Environment

The project consists of two companion services: the **Vite Frontend SPA** and the **Node.js Security Backend Microservice**.

### Terminal 1: Frontend Single Page Application
```bash
npm run dev
```
- **Local URL:** `http://localhost:5173` (or `http://localhost:3000` if port 5173 is occupied).
- Features hot-module replacement (HMR), Tailwind compilation, and client-side routing.

### Terminal 2: Security & API Backend Server
```bash
npm run server
```
- **Local URL:** `http://localhost:3001`
- Runs the native Node.js API router via `vite-node server/index.ts`.
- Verifies database connections, WebAuthn relying party configurations, and webhook listeners.

### Verifying Backend Health:
Once the server is running, query the health endpoints:
```bash
# Basic Liveness Probe
curl http://localhost:3001/health

# Deep Readiness Check (Persistence tier & Provider check)
curl http://localhost:3001/health/ready
```

Expected readiness output:
```json
{
  "status": "READY",
  "timestampIST": "09/11/2026, 23:25:31 IST",
  "checks": {
    "runtime": "ONLINE",
    "persistence": "LOCAL_SECURITY_STATE_FALLBACK",
    "auth0Configured": false,
    "twilioConfigured": false
  }
}
```

---

## 5. Running the Test Suite

The test suite is powered by **Vitest** and tests cryptographic utilities, authentication state machines, session management, and notification dispatch pipelines.

```bash
# Run full test suite once
npm test

# Run tests in continuous watch mode during development
npx vitest watch
```

### Running Vitest & End-to-End Suites:
After running `npm run build` (which populates `dist/` required by static metadata checks), execute the unit and integration suites via `npm test`:
- `tests/portfolio.test.ts`: Validates project metadata, case study consistency, SEO/robots configuration, self-hosted fonts, and AI discovery manifests.
- `tests/owner-security.test.ts`: Tests PBKDF2 / constant-time password validation, TOTP RFC 6238 generation, single-use recovery code hashing, and session TTL expiration.
- `tests/notification-infrastructure.test.ts`: Validates Twilio SMS, WhatsApp, Comms Email payload formatting, status normalization, and webhook verification.
- On the security & performance branches (`security/fail-closed-admin-auth` and `perf/lighthouse-a11y-ai-discoverability`), additional suites cover `tests/security-hardening.test.ts` and `tests/e2e/portfolio.e2e.ts` (`npm run test:e2e`, `npm run lighthouse:audit`).

---

## 6. Compiling the Production Build

To verify TypeScript types and generate the optimized production distribution:

```bash
npm run build
```

- Executes `tsc` (TypeScript compiler check) with strict type checking enabled.
- Compiles minified CSS, chunked JavaScript bundles, and static assets into `dist/`.
- Average build time: ~5–7 seconds.

To test the compiled bundle locally:
```bash
npm run preview
```
- Serves the production `dist/` directory at `http://localhost:4173`.

---

## 7. Synchronizing Public Repositories Locally

To refresh the public GitHub repository index manually:

```bash
npm run sync:github
```
- Queries `https://api.github.com/users/StratagemVX/repos`.
- Normalizes repository metadata, maps engineering categories, and preserves case studies in `src/data/projects.json`.
- *(Optional)* Set `GITHUB_TOKEN=your_token` in your environment to bypass unauthenticated GitHub rate limits (60 req/hr vs 5,000 req/hr).
