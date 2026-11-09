# Comprehensive Performance Comparison Matrix

This document provides a side-by-side technical evaluation comparing the original baseline audit against the audited production deployment (`https://chethan-kumar-portfolio.vercel.app`).

---

## 1. High-Level Category Scores

| Category | Baseline (Dev Server / Slow 4G) | Production Mobile (Slow 4G Moto G) | Production Desktop | Target Objective |
|---|:---:|:---:|:---:|:---:|
| **Performance** | **52** | **81–85** | **98** | 80+ (Mobile) / 95+ (Desktop) |
| **Accessibility** | **94** | **100** | **100** | 100 |
| **Best Practices** | **100** | **100** | **100** | 100 |
| **SEO** | **91** | **100** | **100** | 100 |

---

## 2. Core Web Vitals & Loading Timings

| Metric | Baseline (Localhost Dev) | Production Mobile (Slow 4G) | Production Desktop (Cable) | Delta (Baseline vs Prod Mobile) |
|---|:---:|:---:|:---:|:---:|
| **First Contentful Paint (FCP)** | `13.4 s` | `3.3 – 3.7 s` | `0.9 s` | **-72.4% faster** |
| **Largest Contentful Paint (LCP)** | `24.4 s` | `3.3 – 3.7 s` | `0.9 s` | **-84.8% faster** |
| **Total Blocking Time (TBT)** | `200 ms` | `0 ms` | `0 ms` | **100% reduction (Zero TBT)** |
| **Cumulative Layout Shift (CLS)** | `0.018` | `0.000` | `0.002` | **Zero visual instability** |
| **Speed Index (SI)** | `17.0 s` | `3.3 – 3.7 s` | `0.9 s` | **-78.2% faster** |
| **Initial Network Transfer** | `4,046 KiB` | `191 KiB` | `191 KiB` | **-95.3% payload reduction** |

---

## 3. Network Dependency & Payload Comparison

### Baseline Payload Breakdown (Localhost 3000 Dev Server)
- Multiple unbundled ES modules requested sequentially.
- `@vite/client` and `@react-refresh` injected scripts maintaining constant websocket overhead.
- Total network transfer: **4,046 KiB** across 84 separate network requests.

### Production Payload Breakdown (`chethan-kumar-portfolio.vercel.app`)
- Single pre-compressed HTML document (`4.86 kB` / `1.64 kB gzip`).
- Purged and minified production CSS bundle (`33.94 kB` / `6.76 kB gzip`).
- Route-split JavaScript entry (`77.03 kB` / `20.35 kB gzip`).
- Shared immutable React vendor bundle (`162.14 kB` / `52.94 kB gzip`).
- Total critical initial transfer: **191 KiB** across 5 requests.

---

## 4. Architectural Summary

1. **Elimination of Dev Overhead:** Moving from Vite development server unbundled execution to tree-shaken, Rollup-optimized production artifacts reduced raw payload by **3,855 KiB**.
2. **Total Main Thread Freedom:** Main-thread Total Blocking Time dropped from **200 ms** to **0 ms**, providing immediate input responsiveness.
3. **Flawless Layout Stability:** Cumulative Layout Shift registered at **0.000** on mobile and **0.002** on desktop, demonstrating total layout stability.
