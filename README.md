# Chethan Kumar — Personal Engineering Portfolio Website

> A high-performance personal engineering portfolio built with React 18, Vite, TypeScript, Tailwind CSS, static route prerendering, WebAuthn biometric security, and dynamic GitHub API synchronization.

[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-configured-729B1B.svg)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## Executive Overview

This repository houses the personal software engineering portfolio of Chethan Kumar B S (`StratagemVX`). Engineered to technical recruiter and engineering manager standards, the platform demonstrates full-stack architecture, zero-compromise automated testing, static pre-rendering across 29 routes, and an administrative security perimeter featuring WebAuthn hardware passkeys and TOTP two-factor authentication.

---

## Core Capabilities & Features

### Production Architecture Features
- **Static Route Prerendering (`scripts/generate-static-pages.mjs`):** Generates 29 standalone static HTML pages for instantaneous initial page loads and optimal SEO.
- **Automated GitHub Synchronization (`scripts/sync-github.mjs`):** Live synchronization script fetching public repositories and categorizing projects automatically.
- **Administrative Security Gate (`SecurityGate.tsx`):** Protected administrative dashboard guarded by WebAuthn FIDO2 biometric passkeys and TOTP authenticators.
- **Vitest suite:** Unit tests are configured for route integrity, security gates, and error resilience. Run the test command below in CI to verify the current result before publishing a passing-test count.

---

## System Architecture

```mermaid
flowchart TD
    Client([Web Visitor]):::visitor --> StaticRoutes[Prerendered Static HTML / Vite SPA]
    StaticRoutes --> PublicPages[Work / Academics / Evidence / Project Detail]
    
    Owner([Chethan Kumar]):::owner --> AdminRoute[/admin]
    AdminRoute --> SecGate[Security Gate - Passkey / WebAuthn / TOTP]
    SecGate --> AdminDash[Admin Telemetry & Analytics Dashboard]

    SyncCron[Automated Sync Service] -->|GitHub API| DataStore[(src/data/projects.json)]
    DataStore --> StaticRoutes

    classDef visitor fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef owner fill:#8b5cf6,stroke:#7c3aed,color:#fff;
```

---

## Verification & Testing

```bash
# Execute complete unit test suite (75 tests)
npm test

# Build production bundle and prerender all 29 routes
npm run build
```

---

## Contributor Attribution & Profile

- **Engineer:** Chethan Kumar B S (`StratagemVX`)
- **GitHub:** [https://github.com/StratagemVX](https://github.com/StratagemVX)
- **Live Portfolio:** [https://chethan-kumar-portfolio.vercel.app/](https://chethan-kumar-portfolio.vercel.app/)
- **LinkedIn:** [https://linkedin.com/in/chethan-kumar-b-s-781a002bb](https://linkedin.com/in/chethan-kumar-b-s-781a002bb)

## Verification and maintenance

Keep the portfolio features, route count, GitHub synchronization, authentication controls, dependencies, and deployment instructions aligned with the implementation. Clearly distinguish configured controls from security guarantees verified by tests.

### Available package scripts

- `npm run dev` — `vite`
- `npm run build` — `tsc && vite build && node scripts/generate-static-pages.mjs && npm run build:api`
- `npm run test` — `vitest run`
- `npm run preview` — `vite preview`

These commands are declared in the package manifest; they have not been executed as part of this documentation update.

### Contribution and security notes

- Document model assumptions, training/evaluation data, and known limitations where relevant.
- Never commit credentials, private keys, personal data, or local environment files.
- Use placeholder-only examples and deployment-managed secrets.
- Include reproducible issue steps and expected/actual results.
- Run relevant build, lint, and test checks before merging.


## Required server environment

Configure these values in the deployment platform's secret/environment settings. Do not commit production values:

| Variable | Requirement |
|---|---|
| `ADMIN_PASSWORD` | Required for owner-state initialization or credential migration; at least 16 characters. Use a new, unique high-entropy value. |
| `SECURITY_HMAC_KEY` | Required at startup; at least 32 random bytes. Do not reuse the previous source-controlled fallback. |
| `CORS_ALLOWED_ORIGINS` | Optional comma-separated list of exact approved origins, including scheme and host. Do not use wildcard domains. |

See `.env.example` for placeholder names only. After changing secrets, restart the deployment and verify owner login, session signing, WebAuthn passkeys, and approved-origin CORS behavior.
