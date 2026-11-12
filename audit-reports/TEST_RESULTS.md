# Verification & Test Results — `StratagemVX/myportfolio`

**Audit Date:** 2026-11-12  
**Repository:** `https://github.com/StratagemVX/myportfolio`

---

## 1. Dependency Audit Summary (`npm audit` & `npm audit --omit=dev`)

| Branch / Target | Full Tree (`npm audit`) | Production Tree (`npm audit --omit=dev`) | Status |
|---|---|---|---|
| Baseline `origin/main` (`9ad2487`) | 7 vulnerabilities (4 moderate, 1 high, 2 critical) | 2 moderate (`react-router` / `react-router-dom@6.30.6`) | Resolved in PR #1 & PR #3 |
| PR #1 (`security/fail-closed-admin-auth`, `7903fe6`) | **0 vulnerabilities** | **0 vulnerabilities** | Clean (local + CI) |
| PR #3 (`perf/lighthouse-a11y-ai-discoverability`, `96b46b1`) | **0 vulnerabilities** (`269` packages) | **0 vulnerabilities** | Clean (local + CI) |
| Phase 8 Integration (`temp/integration-verify`, `2561fc7`) | **0 vulnerabilities** | **0 vulnerabilities** | Clean |
| PR #2 (`docs/readme-maintenance-2026`) | Docs-only branch (dependency upgrades live in PR #1 / PR #3) | Docs-only branch | Clean upon PR #1/#3 merge |

---

## 2. Typecheck, Build & Unit Test Suite

| Branch | `tsc --noEmit` | `npm run build` | `npm test` (Vitest) |
|---|---|---|---|
| **PR #1** (`7903fe6`, with test env vars) | Exit `0` | 29 prerendered routes, `183.6kb` API bundles | **6 passed (6), 124 passed (124)** (includes `49` security-hardening tests) |
| **PR #3** (`96b46b1`) | Exit `0` | 30 prerendered routes (incl. `/admin` `noindex`), `167.0kb` API bundles | **5 passed (5), 77 passed (77)** |
| **Phase 8 Integration** (`2561fc7`, PR #1 + PR #3 + PR #2) | Exit `0` | 30 prerendered routes, `183.6kb` API bundle | **6 passed (6), 126 passed (126)** |

---

## 3. Playwright Browser, CSP, Trusted Types & WCAG 2.2 AA (`axe-core`) Results

Executed via `npm run test:e2e` against the gzip-enabled production preview server (`scripts/serve-production-preview.mjs` serving `dist/` with `vercel.json` headers) across **Desktop Chromium** and **Mobile Chromium** viewports on `/`, `/work`, `/archive`, `/evidence`, `/contact`, `/admin`, and 404/AI discovery routes:

| Run Context | Total Cases | Passed | Failed / Skipped | Verified Assertions |
|---|---|---|---|---|
| **PR #3** (`96b46b1`) | 32 | **32** (`19.7s`) | 0 | Zero CSP violations, `portfolio-jsonld` Trusted Types enforcement, zero uncaught page/console errors, keyboard navigation/focus indicators, explicit form labels, fail-closed `/admin` auth gate, AI manifests excluding `/admin`, 0 `axe-core` WCAG 2.0/2.1/2.2 A/AA violations across all 6 routes (Desktop + Mobile) |
| **Phase 8 Integration** (`2561fc7`) | 32 | **32** | 0 | Confirmed `ProfileContext.tsx` fix eliminated spurious unauthenticated `/api/security/profile` `401` console errors on `/admin` |

---

## 4. Reproducible Lighthouse Performance & Core Web Vitals Metrics

Executed via `npm run lighthouse:audit` (`scripts/run-lighthouse-audit.mjs`) against `http://127.0.0.1:4174` using `--headless=new`. `/admin` intentionally carries `<meta name="robots" content="noindex, nofollow" />` and `X-Robots-Tag: noindex, nofollow`, which produces Lighthouse SEO `66` (expected for private non-indexed admin pages).

### A. PR #3 — 3-Run Median (`61353be`, identical built UI/assets prior to CI Lighthouse script updates)

| Route | Desktop Perf | Desktop A11y / BP / SEO | Desktop LCP | Desktop CLS / TBT | Mobile Perf | Mobile A11y / BP / SEO | Mobile LCP | Mobile CLS / TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 / 100 / 100 | 439 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2033 ms | 0 / 52 ms |
| `/work` | 100 | 100 / 100 / 100 | 501 ms | 0 / 0 ms | 98 | 100 / 100 / 100 | 2051 ms | 0 / 56 ms |
| `/archive` | 100 | 100 / 100 / 100 | 495 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2037 ms | 0 / 44 ms |
| `/evidence` | 100 | 100 / 100 / 100 | 480 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2019 ms | 0 / 43 ms |
| `/contact` | 100 | 100 / 100 / 100 | 474 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2024 ms | 0 / 45 ms |
| `/admin` (`noindex`) | 100 | 100 / 100 / 66 | 543 ms | 0 / 0 ms | 97 | 100 / 100 / 66 | 2182 ms | 0 / 46 ms |

### B. PR #3 — 1-Run Post-Fix Local Verification (`96b46b1`, `LH_RUNS=1`)

| Route | Desktop Perf | Desktop A11y / BP / SEO | Desktop LCP | Desktop CLS / TBT | Mobile Perf | Mobile A11y / BP / SEO | Mobile LCP | Mobile CLS / TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 / 100 / 100 | 478 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2114 ms | 0 / 54 ms |
| `/work` | 100 | 100 / 100 / 100 | 502 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2015 ms | 0 / 46 ms |
| `/archive` | 100 | 100 / 100 / 100 | 470 ms | 0 / 0 ms | 99 | 100 / 100 / 100 | 2010 ms | 0 / 54 ms |
| `/evidence` | 100 | 100 / 100 / 100 | 473 ms | 0 / 0 ms | 98 | 100 / 100 / 100 | 2053 ms | 0 / 44 ms |
| `/contact` | 100 | 100 / 100 / 100 | 490 ms | 0 / 0 ms | 98 | 100 / 100 / 100 | 2022 ms | 0 / 88 ms |
| `/admin` (`noindex`) | 100 | 100 / 100 / 66 | 565 ms | 0 / 0 ms | 97 | 100 / 100 / 66 | 2419 ms | 0 / 47 ms |

### C. Phase 8 Integrated Merge Verification (3-Run Median, `2561fc7`)

- **Desktop:** Perf `100`, A11y `100`, BP `100`, CLS `0`, TBT `0 ms`, LCP `516–574 ms`.
- **Mobile:** Perf `96–97`, A11y `100`, BP `100`, CLS `0`, TBT `80–157 ms`, public routes LCP `2322–2431 ms` (`<= 2500 ms`), `/admin` (`noindex`) LCP `2514 ms`.

---

## 5. Live GitHub Actions CI Verification Runs

| PR / Branch | Workflow | Event | Run ID | Head SHA | Conclusion | Uploaded Artifacts |
|---|---|---|---|---|---|---|
| **PR #1** (`security/fail-closed-admin-auth`) | `Security branch quality checks` | `push` | `43216474906` | `7903fe6d53f8d8584542a99d8a9a727f3cb0f005` | **`success`** | — |
| **PR #1** (`security/fail-closed-admin-auth`) | `Security branch quality checks` | `pull_request` | `43216486087` | `7903fe6d53f8d8584542a99d8a9a727f3cb0f005` | **`success`** | — |
| **PR #3** (`perf/lighthouse-a11y-ai-discoverability`) | `Performance, Accessibility, CSP & AI Discoverability Checks` | `push` | `43222397017` | `96b46b1b2a9e5603f96fc49b2bb5184576b63633` | **`success`** | `perf-a11y-csp-verification-reports` (`13946906916`, `213982` bytes) |
| **PR #3** (`perf/lighthouse-a11y-ai-discoverability`) | `Performance, Accessibility, CSP & AI Discoverability Checks` | `pull_request` | `43222405792` | `96b46b1b2a9e5603f96fc49b2bb5184576b63633` | **`success`** | `perf-a11y-csp-verification-reports` (`13947031413`, `240381` bytes) |
