# Chethan Kumar — Personal Engineering Portfolio Website

> Full-stack personal engineering portfolio built with React 18, TypeScript, Vite, Tailwind CSS, static route prerendering, serverless API functions, WebAuthn/TOTP security controls, and automated GitHub repository synchronization.

[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-729B1B.svg)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## Executive Overview

This repository houses the portfolio application of Chethan Kumar B S (`StratagemVX`). It combines a static-prerendered React SPA (generating 29 standalone HTML routes via `scripts/generate-static-pages.mjs`), automated GitHub project snapshot synchronization (`scripts/sync-github.mjs`), an Express/serverless API layer (`server/`, `api/`), and an authenticated owner perimeter supporting Auth0 JWT, TOTP, and WebAuthn passkeys (`src/components/admin/SecurityGate.tsx`).

> **Security Remediation Status (`main` vs. Open Draft PR #1 — `security/fail-closed-admin-auth`):**
> - **PR #1** enforces fail-closed admin authentication (removing hardcoded fallback secret/password behavior), adds signed Auth0 JWT verification (`server/auth0.ts`), strict `CORS_ALLOWED_ORIGINS` enforcement (`server/cors.ts`), WebAuthn origin binding, session guards, updated `PRODUCTION_ENVIRONMENT_VARIABLES.md` & `.env.example`, adds `tests/security-hardening.test.ts` (106 total Vitest assertions across 6 test files), and introduces `.github/workflows/quality.yml` (verified passing in CI).

---

## Core Capabilities & Architecture

- **Static Route Prerendering (`scripts/generate-static-pages.mjs`):** Builds 29 static HTML pages alongside `vite build` for fast initial load and SEO.
- **Automated GitHub Synchronization (`scripts/sync-github.mjs` & `.github/workflows/github-sync.yml`):** Refreshes `src/data/projects.json` and `src/data/github-snapshot.json` from GitHub metadata.
- **Serverless & Express API (`server/`, `api/serverless.ts`):** Compiled by `esbuild` (`npm run build:api`) into `api/index.js` and `api/[...path].js`.
- **Owner Security Perimeter (`SecurityGate.tsx`, `server/`):** Multi-factor owner authentication with fail-closed startup checks in PR #1.

```mermaid
flowchart TD
    Visitor([Web Visitor]) --> StaticRoutes[29 Prerendered HTML Pages + Vite SPA]
    StaticRoutes --> PublicPages[Work / Academics / Evidence / Project Details]

    Owner([Portfolio Owner]) --> AdminRoute[/admin]
    AdminRoute --> SecGate[SecurityGate - Auth0 / WebAuthn / TOTP]
    SecGate --> API[Server / Serverless API Layer]

    SyncCron[GitHub Sync Workflow] -->|Updates JSON| DataStore[(src/data/projects.json & github-snapshot.json)]
    DataStore --> StaticRoutes
```

---

## Available Package Scripts (`package.json`)

| Script | Command | Notes |
|---|---|---|
| `npm run dev` | `vite` | Local frontend dev server |
| `npm run build` | `tsc && vite build && node scripts/generate-static-pages.mjs && npm run build:api` | Type-checks, builds SPA, prerenders 29 routes, and bundles serverless API |
| `npm run build:api` | `esbuild api/serverless.ts ...` | Bundles Vercel/serverless API entrypoints |
| `npm run server` | `vite-node server/index.ts` | Run Express API server locally |
| `npm run start:server` | `vite-node server/index.ts` | Alias for local API server |
| `npm run sync:github` | `node scripts/sync-github.mjs` | Regenerate portfolio GitHub snapshot data |
| `npm test` | `vitest run` | Executes Vitest unit and security suites |
| `npm run preview` | `vite preview` | Preview built frontend |

---

## Required Server Environment (`.env.example`)

Configure deployment secrets through your hosting provider's environment settings (never commit populated `.env` files):

| Variable Group | Variables | Notes |
|---|---|---|
| Core Security (PR #1) | `ADMIN_PASSWORD` (>= 16 chars), `SECURITY_HMAC_KEY` (>= 32 bytes), `CORS_ALLOWED_ORIGINS` | Fail-closed startup validation in PR #1; do not reuse legacy fallback strings |
| Auth0 & GitHub Sync | `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `GITHUB_TOKEN` | Optional/configured identity & sync tokens |
| Notifications | `TWILIO_*`, `OWNER_ALERT_*`, `OWNER_WHATSAPP_PHONE_E164`, `RESEND_API_KEY`, `SMTP_*` | Multi-channel alert providers |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `VITE_FIREBASE_*` | Firestore & FCM messaging |

See `.env.example` and `PRODUCTION_ENVIRONMENT_VARIABLES.md` for placeholder definitions and setup runbooks (`AUTH0_PRODUCTION_SETUP.md`, `FIREBASE_PRODUCTION_SETUP.md`, `DEPLOYMENT.md`).

---

## Contributor Attribution & Profile

- **Engineer:** Chethan Kumar B S (`StratagemVX`)
- **GitHub:** [https://github.com/StratagemVX](https://github.com/StratagemVX)
- **Live Portfolio:** [https://chethan-kumar-portfolio.vercel.app/](https://chethan-kumar-portfolio.vercel.app/)
- **LinkedIn:** [https://linkedin.com/in/chethan-kumar-b-s-781a002bb](https://linkedin.com/in/chethan-kumar-b-s-781a002bb)
