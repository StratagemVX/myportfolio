# Google Lighthouse Baseline Audit Report

> **Source:** Extracted from the uploaded 26-page Google Lighthouse diagnostic report PDF.  
> **Target Environment:** Development Environment (`http://localhost:3000/`)  
> **Testing Agent:** Lighthouse 13.5.0  
> **Emulated Hardware:** Moto G Power (Mobile)  
> **Network Throttling:** Slow 4G (1,638.4 ms round-trip latency, 1.6 Mbps download throughput)  
> **Browser Engine:** Chromium 156  

---

## 1. Executive Summary & Baseline Scores

The baseline audit conducted against `http://localhost:3000` revealed that while best practices and accessibility scored relatively well in development, performance was critically degraded due to running against an active Vite development server rather than an optimized production build.

| Category | Baseline Score | Rating | Target Score |
|---|:---:|:---:|:---:|
| **Performance** | **52 / 100** | Poor (Orange/Red) | 90+ |
| **Accessibility** | **94 / 100** | Good (Green) | 100 |
| **Best Practices** | **100 / 100** | Perfect (Green) | 100 |
| **SEO** | **91 / 100** | Good (Green) | 100 |

---

## 2. Baseline Core Web Vitals & Loading Timings

| Metric | Baseline Value | Status / Evaluation |
|---|:---:|---|
| **First Contentful Paint (FCP)** | `13.4 s` | Critical Fail (Threshold: ≤ 1.8s) |
| **Largest Contentful Paint (LCP)** | `24.4 s` | Critical Fail (Threshold: ≤ 2.5s) |
| **Total Blocking Time (TBT)** | `200 ms` | Moderate (Threshold: ≤ 200ms) |
| **Cumulative Layout Shift (CLS)** | `0.018` | Good (Threshold: ≤ 0.1) |
| **Speed Index (SI)** | `17.0 s` | Critical Fail (Threshold: ≤ 3.4s) |
| **Total Network Payload** | `4,046 KiB` | Severe Bloat (~4 MB initial transfer) |

---

## 3. Root Cause Analysis of Baseline Degradation

### 3.1 Vite Development Server Overhead
The baseline test was run against `localhost:3000` running in Vite dev mode (`vite` CLI):
- **Development Runtime:** Injected `@vite/client` and `@react-refresh` scripts added uncompiled modules and continuous WebSocket heartbeat polling.
- **Unbundled Dependencies:** Every individual component and library module was requested as a separate HTTP module request over the emulated high-latency Slow 4G connection.
- **Unminified Source:** JavaScript was served with development source comments, symbol maps, and unminified React development builds (`react.development.js`).

### 3.2 Monolithic Bundle Execution
The public application entry imported all administrative, cryptographic, and secondary views synchronously:
- Public visitors arriving at the homepage were forced to download WebAuthn libraries, MFA authenticators, admin management suites, and analytics scripts.
- The monolithic JavaScript payload delayed DOM construction and browser paint cycles by over 5.2 seconds.

### 3.3 Render-Blocking External Typography
- Google Fonts (`Inter`, `Space Grotesk`, `JetBrains Mono`) were requested via synchronous `<link rel="stylesheet">` tags in `<head>`.
- The browser stalled HTML rendering while executing DNS lookups, TLS negotiations, and CSS downloads against `fonts.googleapis.com` and `fonts.gstatic.com`.

### 3.4 Missing Technical SEO & Metadata Assets
- `robots.txt` was absent in the dev root, triggering 32 parsing errors when the SPA catch-all returned HTML.
- `sitemap.xml` was absent.
- Canonical `<link rel="canonical">` was omitted from document head.

### 3.5 Contrast & ARIA Discrepancies
- Low-contrast text tokens (`#6E727A` and `#4A4E58`) fell below the WCAG 2.2 AA required minimum contrast ratio of 4.5:1 against dark backgrounds (`#101114` and `#181A1F`).
- Accessible name mismatches existed where `aria-label` strings substituted rather than included visible button or link labels.
