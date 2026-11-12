# Security Audit Report — `StratagemVX/myportfolio`

**Primary Security Branch:** `security/fail-closed-admin-auth` (PR #1, head SHA `7903fe6d53f8d8584542a99d8a9a727f3cb0f005`)  
**CSP / Runtime Browser Verification Branch:** `perf/lighthouse-a11y-ai-discoverability` (PR #3, head SHA `96b46b1b2a9e5603f96fc49b2bb5184576b63633`)

---

## 1. Executive Summary

Prior `main` allowed weak/fallback credentials when environment variables were missing, lacked full server-side claim enforcement on several administrative paths, relied on lenient npm audit thresholds (`--audit-level=high`), and triggered unauthenticated `GET /api/security/profile` calls on `/admin`. All identified authentication, authorization, session-lifecycle, WebAuthn, CORS, dependency, CSP, and privacy issues have been remediated across PR #1, PR #2, and PR #3.

---

## 2. Verified Security Controls (Code & Automated Tests)

| Control Area | Verification Evidence | Result |
|---|---|---|
| **Fail-Closed Secrets** (`server/cryptoUtils.ts`, `server/state.ts`) | `validateSecuritySecrets` & `assertSecuritySecrets` enforce `ADMIN_PASSWORD` >= 16 chars and `SECURITY_HMAC_KEY` >= 32 bytes; reject short, repeated-char, and `.env.example` placeholder strings; server throws at startup without them. | Verified by unit tests (`tests/security-hardening.test.ts`, 49 tests) & Phase 8 unconfigured startup test |
| **Auth0 JWT & Identity Validation** (`server/auth0.ts`) | Cryptographic RS256/JWKS signature verification, `iss`, `aud` (`AUTH0_CLIENT_ID`), `exp`, `email_verified: true`, and owner email/identity matching. Rejects expired, wrong-issuer, wrong-audience, unverified-email, and non-owner tokens (`401`/`403`). | Verified (`tests/security-hardening.test.ts`) |
| **Owner Session Enforcement** (`server/apiHandler.ts`) | `getValidatedSession` confirms `sigCheck.userId === state.owner.id` and rejects missing, tampered, expired, or revoked sessions (`401`) across 19 tested administrative, MFA, recovery, and notification endpoints. | Verified (`tests/security-hardening.test.ts`) |
| **MFA & Password Reset Hardening** (`server/apiHandler.ts`) | Added `checkLoginRateLimit` + string validation on `/api/auth/mfa/verify-totp` & `/api/auth/mfa/verify-recovery`. `/api/security/password/verify-otp-and-reset` now marks other sessions `revoked = true` (preventing stateless `sess_` HMAC token reuse) and masks `recoveryEmail`. | Verified (`tests/security-hardening.test.ts`) |
| **WebAuthn Origin & Replay Protection** (`server/apiHandler.ts`) | `getWebAuthnConfig` restricts `expectedOrigin` strictly to `[validatedOrigin]` when present; `rpID` derived safely; one-time challenge consumption blocks replayed/expired challenges (`400`/`403`). | Verified (`tests/security-hardening.test.ts`) |
| **Strict CORS Allowlisting** (`server/cors.ts`) | Enforces explicit `CORS_ALLOWED_ORIGINS` origin match in production; unapproved origins receive no credentialed CORS grant. | Verified (`tests/security-hardening.test.ts`) |
| **Secret & PII Redaction** | Verified `/api/auth/session` and serialized client responses exclude password hashes, HMAC keys, TOTP seeds, and raw recovery codes. Fixed `src/context/ProfileContext.tsx` to skip unauthenticated `/api/security/profile` calls on `/admin`. Redacted personal email/phone/URLs across 22 docs in PR #2. | Verified (`tests/security-hardening.test.ts`, Playwright `/admin` E2E, `Select-String` scan) |
| **Supply Chain (`npm audit`)** | Eliminated all 7 baseline vulnerabilities (`react-router` / `react-router-dom@6.30.6` -> `^7.18.5`, `esbuild@^0.28.2`, `vite@^7.3.8`, `vitest@^4.1.12`). Both `npm audit` and `npm audit --omit=dev` report **0 vulnerabilities**. | Verified (`quality.yml`, `perf-a11y-csp.yml`, local runs) |
| **Production CSP & Trusted Types** (`vercel.json`) | Emits `script-src 'self' https://*.auth0.com`, `object-src 'none'`, `frame-ancestors 'none'`, `require-trusted-types-for 'script'`, `trusted-types portfolio-jsonld`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Strict-Transport-Security`. Zero runtime CSP violations or console errors observed across Playwright Desktop + Mobile suites. | Verified via Playwright (`tests/e2e/portfolio.e2e.ts`) |
| **`/admin` Privacy & Indexing** | `X-Robots-Tag: noindex, nofollow` HTTP header, `<meta name="robots" content="noindex, nofollow" />`, excluded from `robots.txt`, `sitemap.xml`, `llms.txt`, `ai-catalog.json`, `.well-known/ard.json`, and `.well-known/ai-catalog.json`. | Verified via Vitest & Playwright |

---

## 3. Known Remaining Owner Operational Actions

- Rotate all production secrets prior to deploying merged `main` (see [`SECRET_ROTATION_CHECKLIST.md`](SECRET_ROTATION_CHECKLIST.md)).
- Clean git history rewrite for prior personal email/phone/URL strings already committed on `main` is **out of scope** for this remediation (`git push --force` prohibited); redactions in PR #2 remove them from the active working tree upon merge.
