# Private Recruiter Access Architecture

## 1. Overview & Purpose

The portfolio provides an explicit distinction between public inspection and private executive invitations:

> [!IMPORTANT]
> **Zero Gatekeeping for Public Reviewers:**
> All public technical projects, architecture deep-dives, capability-to-codebase evidence matrices, the executive candidate brief, academic transcripts, and official résumé are **100% accessible to any visitor with zero login or token required**.

The **Private Recruiter Access** system exists exclusively to:
- Issue temporary, time-bounded, read-only clearance links for selected corporate recruiters or hiring managers.
- Grant expedited access to confidential case studies, unpublished research, or priority communication channels without publishing them to the open web.

---

## 2. Cryptographic Token Lifecycle

```
[Owner Admin Console]
        │
        ├─ Enter Recruiter Label & Expiry (e.g. 30 days)
        ▼
[Cryptographic Generator]
   (crypto.randomBytes 128-bit entropy)
        │
        ├─ Format: REC-2026-[HEX4]-[HEX4]-[HEX4]
        │
        ├─ Compute SHA-256 Hash ──────► Store in Server Database
        │                               (Plaintext NEVER saved)
        ▼
[Single-Use Plaintext Secret Reveal]
   (Display raw invitation link ONCE to Owner with Copy Action)
        │
        ▼
[Recruiter Submits Token at /executive-brief]
        │
        ├─ Server computes SHA-256 hash of input
        ├─ Matches active hash in database
        ├─ Checks expiry date & active status
        │
        ├─ Valid? ───► Increment accessCount, log audit event, return clearance
        └─ Invalid? ─► Return error (Never grant elevated permissions)
```

---

## 3. Security Rules & Principle of Least Privilege

1. **Strictly Read-Only:** A recruiter token has **zero administrative privileges**. It cannot alter portfolio content, view owner credentials, trigger repository syncs, or access audit logs.
2. **One-Time Plaintext Reveal:** For cryptographic hygiene, the full plaintext token is revealed strictly once upon creation. After dismissal, only the masked prefix (`REC-2026-A89F••••`) and SHA-256 hash exist.
3. **Revocation & Expiry:** Tokens expire automatically after the chosen duration (7, 14, 30, or 60 days). The owner can immediately revoke any token with a single click.
4. **Privacy-Preserving Audit:** Access counts and timestamps are logged in the Admin Security Activity center without collecting invasive third-party tracking cookies or device fingerprints.

---

## 4. Architectural Recommendation

If your portfolio does not host confidential client deliverables or proprietary research under active NDA, keep this invitation feature optional or hidden. Public technical recruiters strongly favor immediate, friction-free verification of your engineering capabilities.
