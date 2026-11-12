# Security Testing, Verification & IAM Test Matrix

This document summarizes the automated and manual verification procedures for Chethan Kumar's Portfolio Owner Account Security Centre.

---

## 1. Automated Vitest Test Suite Execution

All security scenarios are programmatically tested in `tests/owner-security.test.ts` and `tests/portfolio.test.ts`:

```bash
npx vitest run
```

### Verification Coverage Summary:
Run the built bundle + automated security suites locally with:

```bash
npm run build
npm test
```

Key verified security properties:
- `tests/portfolio.test.ts`: Page routing, meta tags, `/admin` `noindex` isolation, self-hosted fonts, CSP header rules, and AI discovery manifests.
- `tests/owner-security.test.ts`: Primary authentication, RFC 6238 TOTP validation, single-use recovery codes, OTP password reset, Factor Protection Policy, recruiter token hashing/revocation, IST audit logs, and honest notification delivery diagnostics.
- `tests/owner-session-passkey.test.ts` & `tests/auth-api-client.test.ts`: Bearer/session cookie lifecycle, passkey binding, and resilient frontend JSON/HTML error handling.
- Additional fail-closed secret/Auth0/WebAuthn/CORS tests are tracked on `security/fail-closed-admin-auth` (`tests/security-hardening.test.ts`).

---

## 2. Key Security Verification Checks

### 1. Owner Contact Privacy Sanitization
- **Check:** Search public bundle code and tracked documentation for literal personal email addresses or phone numbers.
- **Assertion:** `SecurityGate.tsx`, client bundles, and public docs contain zero raw personal addresses/numbers. Login fields default to empty strings (`''`) with generic placeholders (`Enter your login identifier`).

### 2. Status Accuracy & Anti-Simulation Policy (Scenario 12)
- **Check:** Dispatch test alerts when no provider credentials exist.
- **Assertion:** The server returns `success: false` and status `CONFIGURATION_REQUIRED` (email) or `AWAITING_CREDENTIALS` (SMS). It strictly never reports `DELIVERED` or "Verified Destination".
- **Pass Status:** Verified via `Invoke-RestMethod` and automated unit tests.

### 3. Factor Protection Policy (Scenario 6 & 10)
- **Check:** Attempt to revoke an active authenticator app when no other secondary factors (Passkeys or Recovery Codes) exist.
- **Assertion:** The system blocks removal with HTTP 400: `Factor Protection Policy: You cannot remove your last active Authenticator app when no Passkeys are enrolled. Enrol a Passkey or another Authenticator app before removing this factor.`
- **Pass Status:** Verified.

### 4. Multiple Authenticator Dual-Enrollment (Scenario 15)
- **Check:** Enroll Google Authenticator and Microsoft Authenticator independently.
- **Assertion:** Both factors receive unique labels (`ChethanKumarPortfolio (Google Authenticator)` vs `ChethanKumarPortfolio (Microsoft Authenticator)`), custom tailored onboarding guides, and separate lifecycle management entries.
- **Pass Status:** Verified.

---

## 3. Manual End-to-End Verification Runbook

1. **Accessing the Gate:**
   - Open browser to `http://localhost:3000/admin`.
   - Verify header reads: `PORTFOLIO OWNER AUTHENTICATION` / `Administrator Sign In`.
   - Verify login identifier and password fields are clean, empty, and free of personal identifiers.
2. **Primary Login & MFA Challenge:**
   - Enter your owner login identifier and password.
   - Click `CONTINUE TO VERIFICATION`.
   - Verify the multi-factor challenge prompt appears with `Authenticator`, `Passkey`, and `Backup Code` tabs.
   - Enter the 6-digit TOTP code from your enrolled authenticator app (or your verified test fixture code in isolated tests).
   - Verify successful redirect to `Chethan Kumar · Security Control Room`.
3. **Account & Security Console:**
   - Check the **Verified Account** indicator in the top header: displays masked identity `o***@e***.com`.
   - Switch to **Authenticator Apps**: verify the 4-row Authenticator Management Table displays Google Authenticator, Microsoft Authenticator, Recovery Codes, and Passkeys with accurate status pills.
   - Switch to **Notifications**: click `Send Test Email` and inspect the live diagnostic feedback window showing provider reference ID or configuration diagnostic.
