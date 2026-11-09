# Portfolio Owner & Administrator Guide

## Overview

The Admin Console (`/admin`) is an authenticated management dashboard designed for the portfolio owner, Chethan Kumar.

---

## 1. Accessing the Owner Console

1. Navigate to `/admin` in your browser, or click the small lock icon (`🔒`) on the right side of the main navigation bar.
2. Enter your administrative passphrase or authenticate via Auth0 SSO.
3. Upon clearance, you will be redirected to the System Control & Security Console.

---

## 2. Managing GitHub Synchronization

- The console displays:
  - Total Discovered Repositories from `https://github.com/StratagemVX`.
  - Timestamp of the last automated sync.
- Click **"TRIGGER REFRESH"** to perform an on-demand API query against GitHub.
- If upstream GitHub rate limits are reached, the system displays a non-blocking warning and preserves your local curated database.

---

## 3. Issuing Recruiter Invitation Tokens

To grant a recruiter verified candidate access without making them register:

1. In the **"Recruiter Access Token Management"** section, enter a label for the recipient (e.g. *Principal Recruiter - Tech Corp*).
2. Click **"+ ISSUE TOKEN"**.
3. A cryptographically unique identifier formatted as `REC-2026-[HEX5]` will be generated with a 30-day Time-To-Live.
4. Provide this token to the hiring manager. They can input it at `/recruiter` to verify access.
5. You can view the cumulative access count in the table, or click **"Revoke"** at any time to instantly invalidate the token.

---

## 4. Reviewing Audit Logs

Every critical event is recorded in the **Security & Operational Audit Log**:
- `ADMIN_LOGIN_SUCCESS` / `ADMIN_LOGIN_FAILED`
- `GITHUB_AUTOMATED_SYNC` / `GITHUB_MANUAL_SYNC`
- `RECRUITER_TOKEN_ISSUED` / `RECRUITER_TOKEN_REVOKED`

Logs are maintained in memory and can be exported for security audits.
