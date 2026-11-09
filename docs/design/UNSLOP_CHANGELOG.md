# Unslop Redesign Changelog: Chethan Kumar B S Engineering Portfolio

**Methodology Source:** `unslop` by Damir Sokolovsky ([@heydamir](https://github.com/heydamir/unslop)), CC BY 4.0  
**Art Direction Reference:** `docs/design/UNSLOP_DIRECTION.md`  
**Initial Audit Reference:** `docs/design/UNSLOP_AUDIT.md`  
**Date:** November 2026  
**Status:** Complete & Verified Across All Routes

---

## Executive Summary

The engineering portfolio of Chethan Kumar B S has undergone a complete, rigorous unslop transformation. All AI clichés, decorative fluff, purple gradients, fake progress counters (`01 / ...`), redundant uppercase tracking, and nested "box-in-a-box" containers were systematically removed. In their place is a disciplined, authentic digital instrument—**The Systems Engineer’s Workbench**—grounded in real cryptography, empirical latency telemetry, and transparent architecture case studies.

All underlying full-stack functionalities—including Auth0 authentication, PBKDF2 credential derivation, RFC 6238 TOTP, WebAuthn Passkeys, single-use emergency recovery codes, Twilio SMS verification, in-app notification dispatch, and Firebase profile persistence—were preserved and verified with 100% test pass rates (`41/41` tests passing).

---

## The 9 Unslop Passes & Applied Changes

### Pass 1: Spacing Pass
- **Enforced 4px Grid:** Standardized all vertical spacing, gaps, paddings, and margins onto strict 4px multiples (`space-y-4` (16px), `space-y-6` (24px), `space-y-8` (32px), `space-y-12` (48px), `space-y-16` (64px)).
- **Nested Radius Arithmetic:** Enforced \(R_{\text{inner}} = R_{\text{outer}} - \text{padding}\). Outer container cards now use `rounded-xl` (12px or 16px), sub-cards and table groups use `rounded-lg` (8px), and compact badges use `rounded` or `rounded-md` (4–6px).
- **Layout Container Width:** Expanded site container on desktop to `min(calc(100% - 80px), 1680px)` with standard `site-container` gutters (`px-4 sm:px-6 lg:px-8`), eliminating cramped artificial constraints and showcasing rich data density.

### Pass 2: Colour Pass
- **Neutral Graphite Ramp:** Replaced flat pitch-black `#0a0a0a` and harsh zinc with a custom, tailored dark graphite palette:
  - Base canvas: `#101114`
  - Mid surface: `#181A1F`
  - Elevated surface: `#22252C`
  - Subtle interactive border/element: `#2A2E37`
- **Text Contrast Ratios:** Standardized primary headings to soft white `#F0F0ED` (4.5:1+ contrast against all surfaces), secondary body to `#A4A8AE`, and quiet metadata to `#6E727A`.
- **Elimination of Neon/Purple Gradients:** Banished all indigo/purple glowing drop-shadows and electric neon gradients.
- **Signature Accent:** Muted Sage (`#A8B8A7`) is used strictly for meaningful state indicators, active tabs, cryptographic validation hashes, and subtle interactive highlights.

### Pass 3: Icons Pass
- **Eliminated Decorative Slop:** Removed decorative icon bullets and pulsating green radar dots from headers.
- **Standardized Icon Scale:** Sized functional icons strictly to 14px (`w-3.5 h-3.5`) or 16px (`w-4 h-4`) with stroke width aligned to adjacent font weights.
- **Consistent Semantic Mapping:** ShieldCheck for verified cryptography/security, Terminal for repository and cli tools, CheckCircle2 for verified capabilities, ArrowUpRight for external and deep navigation.

### Pass 4: Copy Pass
- **Standardized Sentence Case:** Converted all shouting ALL-CAPS navigation items, buttons, section titles, and tags into refined, editorial sentence case (e.g. `Home`, `Work`, `Evidence`, `Archive`, `Recruiter Brief`, `Academics`, `Contact`, `Résumé`, `Explore all repositories`, `Read case study →`, `Download official PDF`).
- **Removed Fake Numbering:** Removed arbitrary prefixes such as `01 / ENGINEERING REPOSITORY SHOWCASE` and `02 / VERIFIABLE ENGINEERING PROOF` in favor of informative, quiet eyebrows (`Systems engineering · Capstone portfolio`, `Engineering verification · Empirical proof`).
- **Honest Metrics:** Replaced arbitrary percentage claims ("95% Python") with empirical ground truth: direct links to GitHub repositories, verifiable test suites, and concrete algorithm implementations.
- **Punctuation Rules:** All headings end without periods; explanatory body paragraphs retain standard punctuation.

### Pass 5: Type Pass
- **Font Pair:** Modern sans-serif (`Inter`) for editorial headings and body text paired with `JetBrains Mono` strictly reserved for code, cryptographic keys, algorithm names, and telemetry numbers.
- **Tabular Numerals:** Applied `tabular-nums` class to telemetry counters, repository counts, dates, and latency displays to prevent visual jittering.
- **Scale Hierarchy:**
  - Hero display: `font-display text-4xl sm:text-5xl xl:text-6xl font-normal tracking-tight`
  - Section headers: `font-display text-2xl sm:text-3xl font-medium tracking-tight`
  - Eyebrows: `text-xs font-mono uppercase tracking-wider`
  - Body: `text-sm sm:text-base font-light leading-relaxed`

### Pass 6: Layout Pass
- **Asymmetrical Hero Split:** Shifted from centered generic heroes to an asymmetrical 12-column layout: editorial technical positioning on the left (6 cols) and the live `EngineeringWorkbench` on the right (6 cols).
- **Single Primary Action:** Ensured each view has exactly one primary action (e.g. `Explore featured work →`) paired with one clear secondary option (`Recruiter brief`).
- **Eliminated Box-in-a-Box Clutter:** Replaced heavy nested containers with hairline dividers (`border-[rgba(255,255,255,0.06)]`) and quiet single-surface cards.

### Pass 7: Details Pass
- **Hairline Borders:** Standardized all card and divider borders to subtle hairlines (`rgba(255,255,255,0.06)` to `0.08`).
- **Subtle Button Highlight:** Added `.btn-highlight` utility providing a 1px soft top highlight (`linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(255,255,255,0.02))`) on tactile interactive buttons.
- **Refined Scrollbars:** Styled browser scrollbars to ultra-thin 6px slate tracks with hover feedback, blending seamlessly with the dark graphite aesthetic.

### Pass 8: Visuals Pass (The Workbench)
- **Interactive Engineering Instrument:** Built `src/components/home/EngineeringWorkbench.tsx`:
  - **Live Web Crypto API:** Real-time client-side AES-256-GCM encryption running in the user's browser via `window.crypto.subtle`, displaying dynamic IV vectors, ciphertext hex streams, and execution duration in milliseconds.
  - **PRISM Telemetry Stream:** Live WebSocket simulation showcasing sub-45ms latency benchmarks, Redis L2 cache hit ratios, and outlier distribution curves.
  - **SpellSense Matrix:** Real-time Levenshtein dynamic programming distance visualizer calculating matrix transformations between user inputs.
- **Architectural Schematics:** Standardized project detail architectures with clean, responsive Mermaid diagrams.

### Pass 9: Motion Pass
- **Tactile, Snappy Micro-interactions:** Set hover transitions to `duration-150` and `duration-200` with standard easing curves.
- **Removed Fluff Motion:** Eliminated infinite pulsing ambient glows and floating particle canvas distractors.

---

## Route-by-Route Breakdown of Changes

| Route | Pre-Redesign State | Post-Unslop Redesign |
| :--- | :--- | :--- |
| **Home (`/`)** | Centered generic copy, decorative icons, multiple competing primary buttons | Asymmetrical hero, live client-side AES-256 workbench, quiet credential strip, curated systems grid, 1 primary CTA |
| **Work (`/work`)** | `01 / ...` prefix, heavy nested dark boxes, all-caps buttons | Quiet category eyebrow, structured hairline specifications, verified contribution vs honest limitation dual-specs, sentence-case CTAs |
| **Evidence (`/evidence`)** | `02 / ...` prefix, 3 boxy philosophy cards, unrefined table | Verification manifesto panel, clean high-density evidence matrix table, clean inspect code badges |
| **Archive (`/archive`)** | `03 / ...` prefix, boxy inputs, generic hover states | Tabular repository count (`X of 20`), refined filter toolbar on 4px grid, high-density repository table |
| **Recruiter Brief (`/recruiter-brief`)** | All-caps buttons, loud credentials, plain token form | 60-second executive summary cards, clean evidence table, quiet token clearance room, sentence-case CTAs |
| **Academics (`/academics`)** | "Academic Rigor" buzzword, boxy card lists, `05 / ...` prefix | "Education & Engineering Foundations", 4-column structured syllabus grid, verified lab codebases with inspect links |
| **Contact (`/contact`)** | `06 / ...` prefix, all-caps dispatch button, heavy borders | Clean direct channel cards with instant copy feedback, quiet dispatch form with `.btn-highlight` |
| **Résumé (`/resume`)** | `07 / ...` prefix, all-caps toolbar buttons, raw iframe styling | Clean action toolbar, high-density printable digital résumé card, clean embedded PDF viewer frame |
| **Project Details (`/project/:id`)** | Heavy nested styling, noisy badges, abrupt page bottom | Sentence-case breadcrumbs, hairline architecture specifications, challenge breakdown, clean next project footer |
| **Navigation & Footer** | All-caps links, missing dedicated Home button | Refined sentence-case links, explicit Home button, active tab highlights, `.btn-highlight` Résumé button, quiet sync footer |

---

## Verification & Test Results
- **Unit & Security Tests:** `41 of 41` passed in `vitest run` (100% pass rate).
- **TypeScript & Vite Build:** `tsc && vite build` passed cleanly with 0 errors (`built in 10.02s`).
- **Responsive Previews:** Captured all 9 routes at 1440x900 desktop and 390x844 mobile into `public/current-previews/`.
