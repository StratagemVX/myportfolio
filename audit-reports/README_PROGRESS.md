# Documentation Remediation Progress (`PR #2 — docs/readme-maintenance-2026`)

**Branch:** `docs/readme-maintenance-2026`  
**Base Sync:** Merged `origin/main` cleanly (`9ad2487`, then `70f0b85`) preserving all 4 prior PR #2 commits (`fc5a59d`, `51b8fbf`, `d18257f`, `7dbbd26`).

---

## 1. Completed Documentation Corrections

| File(s) | Remediation Applied |
|---|---|
| `README.md` | Replaced inaccurate baseline descriptions with verified architecture, exact `package.json` scripts (`dev`, `server`, `start:server`, `build`, `build:api`, `sync:github`, `test`, `preview`, plus PR #3 `preview:prod`, `test:e2e`, `lighthouse:audit`), active PR #1/#2/#3 summary, local dev vs. production secret distinction, and troubleshooting runbook. |
| `.env.example` | Sanitized to safe placeholders only; explicitly separated public `VITE_*` build vars from fail-closed production server secrets; added `AUTH0_CLIENT_ID` and `WEBAUTHN_RP_ID`; added `openssl rand` secret generation instructions. |
| `PRODUCTION_ENVIRONMENT_VARIABLES.md` | Removed leaked personal email, personal phone number, Twilio number, and private Railway deployment URL; aligned table with actual `process.env.*` / `import.meta.env.*` references in `server/` and `src/`; removed unused claims (`AUTH0_CLIENT_SECRET`, `FRONTEND_URL`, `VITE_FIREBASE_*`). |
| `docs/LOCAL_SETUP.md` | Removed outdated claim that missing Auth0 silently grants local admin access; aligned Vitest command instructions (`npm run build` before `npm test`) with actual test suites. |
| `SECURITY_TESTING.md` | Redacted exposed email/phone examples, removed obsolete `2 passed / 16 passed` snapshot, and replaced `123456` local TOTP guidance with enrolled authenticator / isolated test-fixture accuracy. |
| **22 Markdown Runbooks** (`ACCOUNT_RECOVERY.md`, `AUTH0_MFA_SETUP.md`, `AUTH0_PRODUCTION_SETUP.md`, `AUTHENTICATION.md`, `COST_AWARENESS.md`, `DEPLOYMENT.md`, `DEPLOYMENT_ARCHITECTURE.md`, `DEPLOYMENT_GUIDE.md`, `EMAIL_DELIVERY_SETUP.md`, `ENVIRONMENT_VARIABLES.md`, `NOTIFICATIONS.md`, `NOTIFICATION_SETUP.md`, `PRODUCTION_ENVIRONMENT_VARIABLES.md`, `PRODUCTION_SECURITY_CHECKLIST.md`, `RAILWAY_DEPLOYMENT.md`, `SECURITY.md`, `SECURITY_TESTING.md`, `SMS_SETUP.md`, `VERCEL_DEPLOYMENT.md`, `WHATSAPP_SETUP.md`, `docs/DEPLOYMENT.md`, `docs/SECURITY.md`) | Automated + manual `Select-String` verification confirming 0 remaining occurrences of literal personal email, personal mobile number, Twilio sender phone number, or private Railway deployment subdomain. |
| `audit-reports/*.md` (9 files) | Authored complete Phase 12 verification, security, rotation, test, and readiness reports grounded strictly in observed command outputs and live GitHub API data. |
