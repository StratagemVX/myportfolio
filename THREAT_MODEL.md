# Security Threat Model: Chethan Kumar Portfolio Ecosystem

## 1. System Scope & Assets

| Asset | Sensitivity | Protection Priority | Potential Impact of Compromise |
| :--- | :--- | :--- | :--- |
| **Owner Admin Console** | High | Maximum | Unauthorized modification of case studies, sync triggers, or token tampering |
| **GitHub Ingestion Pipeline** | Medium | High | Malicious script injection (XSS) via external repository metadata |
| **Recruiter Access Tokens** | Low-Medium | Medium | Unauthorized viewing of candidate verification records |
| **Public Portfolio Content** | Low | Low (Public) | Content defacement or visual degradation |

---

## 2. Threat Vector Analysis (STRIDE Model)

### A. Spoofing Identity
- **Threat:** An attacker attempts to forge administrative credentials to access `/admin`.
- **Mitigation:** Enforce Auth0 MFA with FIDO2 / Passkeys. Reject unauthenticated access. Session tokens are validated cryptographically.

### B. Tampering with Data
- **Threat:** Malicious payload injected into a GitHub repository description or commit message aiming to execute code when parsed by the portfolio.
- **Mitigation:** Zero use of `eval()` or unescaped HTML strings (`dangerouslySetInnerHTML`). All GitHub-derived text is sanitized and rendered via standard React text nodes.

### C. Repudiation
- **Threat:** Administrative actions performed without verifiable trace.
- **Mitigation:** In-memory and server-side immutable audit logging recording timestamps, actions, categories, and outcomes.

### D. Information Disclosure
- **Threat:** Personal Access Tokens (PATs) or private environment variables leaked to the browser.
- **Mitigation:** Strict separation of client environment variables. No client-side storage of GitHub tokens. Zero secrets in git repository.

### E. Denial of Service (DoS)
- **Threat:** GitHub API rate limits triggered by automated scrapers, breaking portfolio project listings.
- **Mitigation:** Fallback snapshot architecture (`src/data/github-snapshot.json`). The client website never queries GitHub directly from the user's browser; it serves pre-indexed static JSON.

### F. Elevation of Privilege
- **Threat:** A user with recruiter invitation clearance attempts to escalate permissions to owner administration.
- **Mitigation:** Role-based access control (RBAC). Recruiter tokens only grant access to `/recruiter` data fields and lack any administrative endpoint bindings.
