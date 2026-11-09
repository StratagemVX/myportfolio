# Implemented Feature Matrix & Functional Capabilities

This document provides a comprehensive functional catalog of the Chethan Kumar Engineering Portfolio, detailing all verified capabilities across public presentation, candidate evaluation, design architecture, and administrator controls.

---

## 1. Public Portfolio Capabilities

### 1.1 Editorial Homepage (`/`)
- **Asymmetrical 12-Column Hero:** 6-column narrative technical positioning paired with a live 6-column interactive systems workbench.
- **Interactive Engineering Workbench (`EngineeringWorkbench.tsx`):**
  - **AES-256 Cryptography Instrument:** Runs real-time hardware-accelerated AES-GCM encryption in the user's browser via the W3C Web Crypto API (`window.crypto.subtle`), rendering dynamic 12-byte IVs, authenticated ciphertext, and millisecond execution timers.
  - **PRISM Telemetry Stream:** Live telemetry simulator showcasing sub-45ms latency benchmarks, Redis L2 query reduction metrics, and microservice health indicators.
  - **SpellSense NLP Matrix:** Real-time Levenshtein and SymSpell algorithmic comparison displaying token edit distances and execution benchmarks.
- **Curated Systems Preview:** Direct access to flagship engineering implementations with status tags and architectural tags.
- **Architectural Chapters:** 4 structured gateway portals linking to the Evidence Matrix, Recruiter Brief, Repository Archive, and Academic Record.

### 1.2 Featured Engineering Systems (`/work`)
- **Rigorous Case Studies:** In-depth technical presentations of complex systems (SecretSnap, MediQueue, PRISM, SpellSense, Shadow Message Cipher).
- **Dual-Specification Engineering Panels:** Each project highlights a **Verified Contribution** alongside an **Honest Limitation**, establishing engineering credibility.
- **Problem Space & Architecture:** Explains why the system was designed, target audiences, and underlying protocols.

### 1.3 Technical Case Study Views (`/project/:slug`)
- **System Architecture Visualizations:** Embedded, dynamic Mermaid diagrams mapping out data flows, network boundaries, and state transitions.
- **Key Verified Capabilities:** Verified checklist of implemented software features directly cross-referenced with GitHub source code.
- **Technical Challenges Solved:** Step-by-step breakdown of architectural bottlenecks and their mathematical/code solutions.
- **Next Project Navigation:** Sequential footer controls allowing continuous exploration across case studies.

### 1.4 Technical Evidence & Codebase Verification (`/evidence`)
- **The Anti-Percentage Manifesto:** Completely rejects arbitrary, unverifiable skill bars (e.g., "95% Python") in favor of empirical proof.
- **Direct Repository Cross-References:** Links technical competencies (AES-256-GCM, WebRTC streams, PyTorch CUDA, SymSpell DP) directly to public GitHub repositories, entry points, and test suites.
- **20-Repository Ground Truth:** Demonstrates production capability through verifiable source code inspection.

### 1.5 Public Repository Archive (`/archive`)
- **Real-Time Client-Side Search:** Instant filtering across repository names, descriptions, languages, and technical tags.
- **Domain Categorization Filter:** Filter by domains including *Cybersecurity & Cryptography*, *AI & Machine Learning*, *NLP & Language Systems*, *Full-Stack Development*, and *Cloud & Distributed Systems*.
- **High-Density Table View:** Displays primary stack, repository status, live links, and GitHub links.

### 1.6 Candidate Recruiter Brief (`/recruiter-brief`)
- **60-Second Executive Summary:** Formatted for rapid evaluation by hiring managers, engineering directors, and technical recruiters.
- **Printable Dossier Mode:** Custom `@media print` stylesheets that format the brief into a clean, physical or PDF engineering dossier with a single click (`window.print()`).
- **Private Recruiter Invitation Gate:** Allows recruiters holding cryptographic tokens (e.g., `REC-2026-XXXX`) to unlock private contact channels and privileged notes.

### 1.7 Academic Record & Foundations (`/academics`)
- **Undergraduate Curriculum:** B.E. in Computer Science & Engineering from MVJ College of Engineering, Visvesvaraya Technological University (VTU), Bengaluru (2023–2027 Batch).
- **4-Column Syllabus Grid:** Structured review across Mathematical Foundations, Systems & Architecture, Algorithms & Software Engineering, and Advanced Electives.
- **Verified Laboratory Codebases:** Links coursework to public repositories containing first-principles implementations (ML-Lab, Computer Networks, DBMS).

### 1.8 Interactive Résumé (`/resume`)
- **High-Density Printable View:** Formatted for ATS parsing and human readability, emphasizing systems engineering, cryptography, and full-stack achievements.
- **Embedded Document Viewer:** Direct preview of the official PDF résumé (`public/resume.pdf`) with quick download actions.

### 1.9 Direct Contact Channels (`/contact`)
- **Instant Copy Feedback:** One-click clipboard copy for email (`chethan.athulith@outlook.com`) and verified handles with tactile UI confirmation.
- **PGP & Security Identity:** Direct guidance for transmitting encrypted communications.

---

## 2. Owner Security Centre & Administration (`/admin`)

The portfolio includes an administrative control room accessible only to the repository owner, featuring production-grade security controls:

### 2.1 Multi-Tier Security Gate (`SecurityGate.tsx`)
- **Passkey Biometrics:** Passwordless authentication using W3C WebAuthn Level 3 (Windows Hello, Touch ID, YubiKey).
- **Master Authentication:** Constant-time password verification via `crypto.timingSafeEqual` with timing attack protection.
- **Auth0 PKCE Integration:** Single Sign-On (SSO) delegation via Auth0 React SDK.
- **Mandatory MFA Challenge:** RFC 6238 Time-Based One-Time Password (TOTP) enforcement before issuing an administrative session token.

### 2.2 Profile & Identity Management
- **Display Name & Professional Title:** Manage owner presentation preferences synced to `ProfileContext`.
- **Primary Login Email Change:** 2-step OTP verification workflow preventing accidental lockout.
- **Recovery Email Configuration:** Dedicated backup channel for critical security notifications.

### 2.3 Multi-Factor Authentication (MFA) Management
- **RFC 6238 TOTP Enrollment:** Generates standards-compliant Base32 secret keys and QR codes compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Bitwarden.
- **W3C WebAuthn Passkeys:** Enroll multiple hardware security keys and platform authenticators with custom device labels.
- **Single-Use Emergency Recovery Codes:** Generates cryptographically secure backup codes (`XXXX-XXXX`) stored as SHA-256 hashes on the server.

### 2.4 Notification & Delivery Matrix
- **Twilio Unified SMS:** Configurable E.164 transactional alert delivery.
- **Twilio WhatsApp Messaging:** Sandbox message dispatch and status callback processing.
- **Twilio Comms Email:** Transactional email delivery with fallback to Nodemailer SMTP and Resend.
- **Delivery Audit History:** Detailed inspection table showing dispatch status, timestamps in IST (UTC+5:30), error diagnostics, and provider message IDs.

### 2.5 Active Sessions & Security Telemetry
- **Active Session Audit:** Real-time visibility into active login sessions with IP addresses, User-Agents, and last activity timestamps.
- **One-Click Session Revocation:** Invalidate all other active sessions across devices immediately.
- **Chronological Security Log:** Append-only audit trail capturing security events (logins, password updates, MFA changes) in Indian Standard Time (IST).

---

## 3. GitHub Intelligence & Automation

- **Automated Discovery Engine (`scripts/sync-github.mjs`):** Queries GitHub REST API v3 to discover all public repositories for `StratagemVX`.
- **Intelligent Classification:** Categorizes repositories into cybersecurity, AI, systems, and academic domains based on repo metadata, language distributions, and repository naming conventions.
- **Preserved Case Study Curation:** Updates dynamic fields (stars, update timestamps, language metrics) while strictly preserving manually authored case studies, architectural diagrams, and trade-off analyses.
- **Scheduled CI/CD Refresh:** Automated GitHub Actions workflow (`.github/workflows/github-sync.yml`) running daily at 04:00 UTC to maintain index freshness.
