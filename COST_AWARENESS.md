# Cloud Architecture Cost Awareness & Quota Guidelines

This document provides transparent cost, quota, and trial constraint analysis for all cloud providers integrated into Chethan Kumar's engineering portfolio.

---

## 1. Executive Summary

| Service | Tier / Plan | Monthly Cost | Quota Limits & Safeguards |
|---|---|---|---|
| **Vercel** | Hobby (Free) | **\$0.00** | 100 GB Bandwidth / mo; Unlimited Deployments |
| **Railway** | Starter Credit | **\$0.00 – \$5.00** | \$5.00 monthly free execution credit covers 24/7 lightweight Node.js API |
| **Firebase Firestore** | Spark (Free Tier) | **\$0.00** | 50,000 Reads / day; 20,000 Writes / day; 1 GB storage |
| **Auth0 by Okta** | Free Tier | **\$0.00** | Up to 7,500 active users; MFA & Universal Login included |
| **Twilio** | Developer Trial | **\$0.00** | \$15.50 trial credit; verified recipient whitelist enforced |
| **GitHub API** | Public / Personal | **\$0.00** | 60 unauthenticated or 5,000 authenticated req / hr |

**Total Estimated Monthly Expense: \$0.00** (Zero ongoing financial commitment for portfolio hosting).

---

## 2. Detailed Service Quota & Constraints

### 2.1 Firebase Firestore (Spark vs. Blaze Plan)
- **Spark Plan (Default / Recommended)**:
  - 100% Free forever.
  - Storage: 1 GiB.
  - Document Operations:
    - 50,000 document reads / day.
    - 20,000 document writes / day.
    - 20,000 document deletes / day.
  - Network Egress: 10 GiB / month.
  - **Portfolio Architectural Safeguard**: The portfolio uses a graceful fallback system. If Firebase credentials are missing or daily quotas are exceeded, the server seamlessly falls back to persistent local JSON storage (`server/security-state.json`), ensuring zero downtime or broken logins.
- **Blaze Plan (Pay-as-you-go)**:
  - Only required if exceeding Spark quotas. For a personal engineering portfolio with administrative-only database writes, the Spark plan is virtually impossible to exhaust.

### 2.2 Twilio Unified Communications (Trial Constraints)
- **Developer Trial Account Rules**:
  - Outbound SMS can only be sent to **verified caller ID numbers** (e.g. `+919380469287`).
  - Outbound SMS messages are automatically prepended by Twilio with: `"Sent from your Twilio trial account - "`.
  - WhatsApp messages require the recipient phone to join the Twilio sandbox by sending `join <sandbox-keyword>` to `+14155238886`.
  - Comms Email requires either domain DNS verification or sending through verified sender identities.
- **Status Reporting Integrity**:
  - The portfolio backend records truthful delivery status codes (`ACCEPTED`, `DISPATCHING`, `DELIVERED`, `FAILED`, `BLOCKED_CONFIGURATION`). It never reports false deliveries when operating in trial mode.
- **Paid Transition (Optional)**:
  - India SMS destination cost: ~\$0.0079 / SMS.
  - WhatsApp utility message cost: ~\$0.005 / message.

### 2.3 Auth0 Identity Platform
- **Free Tier Entitlements**:
  - Up to 7,500 monthly active users.
  - Universal Login with custom domain branding.
  - Social logins and database connections.
  - Multi-Factor Authentication (TOTP authenticator apps + WebAuthn FIDO2 passkeys).
  - Rate limits: 100 requests/second on authentication endpoints (vastly exceeding personal admin usage).

### 2.4 Vercel Edge Hosting
- **Hobby Tier**:
  - 100 GB Fast Data Transfer / month.
  - 100 hours serverless function execution.
  - Unlimited preview deployments and automatic SSL certificate provisioning via Let's Encrypt.
  - Edge caching rules ensure zero cold-start latency for global visitors.

---

## 3. Best Practices for Maintaining Zero-Cost Hosting

1. Keep repository cache syncs periodic (`npm run sync:github` run once during deployments or via scheduled cron).
2. Retain Firebase Spark plan without entering billing information unless external scale warrants it.
3. Use Authenticator TOTP and WebAuthn Passkeys as primary security factors; use SMS as secondary out-of-band alert channel to preserve trial balance.
