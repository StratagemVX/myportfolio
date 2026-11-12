# Technical Remediation Plan — `StratagemVX/myportfolio`

This plan records the concrete technical defects identified during the audit and the fixes implemented across PR #1 (`security/fail-closed-admin-auth`), PR #2 (`docs/readme-maintenance-2026`), and PR #3 (`perf/lighthouse-a11y-ai-discoverability`).

---

## 1. Dependency & Supply-Chain Remediation (Phase 2)

- **Baseline Findings on `origin/main` (`9ad2487`):**
  - Full dependency tree: **7 vulnerabilities** (4 moderate, 1 high, 2 critical) across `react-router` / `react-router-dom@6.30.6` (2 moderate production advisories including open-redirect backslash handling / SSR hydration error deserialization advisories) and Vite/Vitest dev dependencies (`esbuild@0.21.5`, `vite@5.4.21`, `vitest`, `vite-node`, `tinypool`).
  - Existing workflow threshold `--audit-level=high` allowed the 2 moderate production vulnerabilities in `react-router` / `react-router-dom` to pass CI silently.
- **Remediation Implemented (PR #1 & PR #3):**
  - Audited route definitions in `src/App.tsx` (standard `BrowserRouter` + `Routes` + `Route`; no `createBrowserRouter` data-router loaders/actions or SSR hydration error payloads).
  - Upgraded `react-router-dom` to `^7.18.5`, `esbuild` to `^0.28.2`, `vite` to `^7.3.8`, `@vitejs/plugin-react` to `^5.2.0`, and `vitest` to `^4.1.12` (staying on Vitest 4.x to keep Node 20/22 CI compatibility).
  - Removed `--audit-level=high` from `.github/workflows/quality.yml` and `.github/workflows/perf-a11y-csp.yml`; both now enforce zero vulnerabilities across `npm audit` and `npm audit --omit=dev`.

---

## 2. Security Hardening (Phase 3 — PR #1 `security/fail-closed-admin-auth`)

- Enforced fail-closed `ADMIN_PASSWORD` (>= 16 chars) and `SECURITY_HMAC_KEY` (>= 32 bytes) validation rejecting placeholders and weak strings in production (`server/cryptoUtils.ts`, `server/state.ts`).
- Verified `sigCheck.userId !== state.owner.id` inside `getValidatedSession` (`server/apiHandler.ts`).
- Added rate-limiting and string type validation on `/api/auth/mfa/verify-totp` and `/api/auth/mfa/verify-recovery`.
- Bound `getWebAuthnConfig` `expectedOrigin` strictly to validated request origin (`server/apiHandler.ts`).
- Fixed `/api/security/password/verify-otp-and-reset` to mark active sessions `revoked = true` rather than deleting them (closing stateless HMAC token reuse) and masked `recoveryEmail` in OTP password-reset responses.
- Fixed `src/context/ProfileContext.tsx` so unauthenticated `/admin` page loads only request `/api/security/profile` when an active session token exists, eliminating spurious `401` browser console errors caught in Phase 8 integration testing.
- Expanded `tests/security-hardening.test.ts` (49 tests covering fail-closed secrets, 19 unauthorized admin endpoints returning 401, wrong Auth0 `iss`/`aud`/non-owner email rejections, WebAuthn origin mismatch & replay rejection, CORS origin allowlisting, legacy v1->v2 migration, and secret redaction).

---

## 3. Performance, WCAG 2.2 AA, CSP & AI Discoverability (Phases 4, 6, 7, 9 — PR #3)

- **Performance / Core Web Vitals:**
  - Inlined compiled `dist/assets/index-*.css` into static HTML shells during `scripts/generate-static-pages.mjs` to remove the external render-blocking stylesheet round-trip (~619ms savings on mobile).
  - Added route-specific `<link rel="modulepreload">` hints in `scripts/generate-static-pages.mjs` for secondary lazy chunks (`/work`, `/evidence`, `/archive`, `/recruiter-brief`, `/academics`, `/contact`, `/resume`, `/admin`, `/project/*`).
  - Split `AccountSecuritySection`, `PrivateRecruiterAccessSection`, and `IntegrationMatrixSection` into lazy imports inside `src/pages/AdminDashboardPage.tsx`, shrinking initial `/admin` chunk size.
  - Replaced spinner-only `isVerifyingSession` view with an immediate `noindex, nofollow` fail-closed session verification card so `/admin` LCP paints immediately without leaking protected controls.
- **WCAG 2.2 AA Accessibility:**
  - Raised `--text-muted` in `src/index.css` from `#777E87` to `#9CA1AA` and removed low-opacity placeholders (`placeholder-[#A4A8AE]/40`, `text-[#A4A8AE]/70`) on `/archive`, `/contact`, and `SecurityGate`.
  - Upgraded small `10px`/`11px` micro-labels/controls to `text-xs` (12px) across `Footer.tsx`, `ArchivePage.tsx`, `EvidencePage.tsx`, `ContactPage.tsx`, `SecurityGate.tsx`, and `AdminDashboardPage.tsx`.
  - Added visible `focus-visible` indicator and `aria-expanded` synchronization on mobile navigation toggle (`Navigation.tsx`).
- **Playwright, Lighthouse & CI Hardening:**
  - Added `scripts/serve-production-preview.mjs` (gzip-enabled preview server reproducing `vercel.json` headers and static/SPA routing), `playwright.config.ts`, `tests/e2e/portfolio.e2e.ts` (desktop + mobile CSP/Trusted Types, nav, filters, labels, fail-closed `/admin`, 404, AI discovery endpoints, and `axe-core` WCAG 2.2 AA), and `scripts/run-lighthouse-audit.mjs` (3-pass Desktop + Mobile headless Chromium audit).
  - Updated `.github/workflows/perf-a11y-csp.yml` to enforce strict zero-vuln audits, Playwright E2E + `axe-core`, reproducible Lighthouse runs, and upload `playwright-report/` + `.lighthouse-results/` artifacts.

---

## 4. Documentation & Privacy Cleanup (Phase 5 — PR #2 `docs/readme-maintenance-2026`)

- Redacted exposed personal email (`<redacted personal email>` -> `owner@example.com`), personal/Twilio phone numbers (`<redacted E.164 phone numbers>` -> `+15550000000` / `+15005550006`), and private backend URL (`<redacted Railway deployment URL>` -> `your-backend.example.com`) across 22 Markdown files.
- Rewrote `.env.example`, `PRODUCTION_ENVIRONMENT_VARIABLES.md`, `README.md`, `docs/LOCAL_SETUP.md`, and `SECURITY_TESTING.md` to reflect real scripts, fail-closed security semantics, and local dev vs. production secret separation.
