# Security Testing, Verification & IAM Test Matrix

This document summarizes the automated and manual verification procedures for Chethan Kumar's Portfolio Owner Account Security Centre.

---

## 1. Automated Vitest Test Suite Execution

All security scenarios are programmatically tested in `tests/owner-security.test.ts` and `tests/portfolio.test.ts`:

```bash
npx vitest run
```

### Test Results Summary:
```
✓ tests/portfolio.test.ts  (5 tests)
  ✓ Page routing, meta tags, and responsive container bounds
  ✓ Work, Evidence, Archive, Academics, Contact navigation verification
  ✓ Recruiter Brief alternate label verification
  ✓ Zero horizontal overflow on desktop and mobile
  ✓ 94.8% viewport width at 1536px resolution

✓ tests/owner-security.test.ts  (11 tests)
  ✓ Scenario 1 & 2: Primary authentication succeeds and enforces RFC 6238 TOTP factor validation
  ✓ Scenario 3: Single-use emergency recovery codes can be verified and consumed
  ✓ Scenario 4 & 5: Owner email OTP generation, HMAC hashing, and single-use validation
  ✓ Scenario 6 & 10: Prevention of factor removal when no other factor is enrolled
  ✓ Scenario 7 & 8: Private Recruiter Access tokens are stored as SHA-256 hashes only
  ✓ Scenario 9: Revoked recruiter token cannot be accessed
  ✓ Scenario 11: Security audit logs are chronological and formatted in Indian Standard Time (IST)
  ✓ Scenario 12: Notification service enforces truthful statuses and never claims DELIVERED without confirmation
  ✓ Scenario 13: Privacy sanitization - SecurityGate.tsx contains NO literal the.suryaputraa@gmail.com
  ✓ Scenario 14: Masking functions protect PII correctly (t***a@g***l.com, +91 93804 •••••)
  ✓ Scenario 15: Google and Microsoft Authenticator dual-support validation

Test Files: 2 passed (2)
Tests:      16 passed (16)
Duration:   1.6s
```

---

## 2. Key Security Verification Checks

### 1. Gmail Privacy Sanitization (Scenario 13)
- **Check:** Search the codebase for public disclosures of `the.suryaputraa@gmail.com`.
- **Assertion:** `SecurityGate.tsx` and all public bundle code contain zero occurrences of the raw personal Gmail address.
- **Pass Status:** Verified. Login fields default to empty strings (`''`) with generic placeholders (`Enter your login identifier`).

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
   - Enter your 6-digit TOTP code (or `123456` in local development).
   - Verify successful redirect to `Chethan Kumar · Security Control Room`.
3. **Account & Security Console:**
   - Check the **Verified Account** indicator in the top header: displays masked identity `t***@g***.com`.
   - Switch to **Authenticator Apps**: verify the 4-row Authenticator Management Table displays Google Authenticator, Microsoft Authenticator, Recovery Codes, and Passkeys with accurate status pills.
   - Switch to **Notifications**: click `Send Test Email` and inspect the live diagnostic feedback window showing provider reference ID or configuration diagnostic.
