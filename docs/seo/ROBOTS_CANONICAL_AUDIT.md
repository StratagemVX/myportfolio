# Robots & Canonical Audit Report

> **Production Domain:** `https://chethan-kumar-portfolio.vercel.app`  
> **Target Status:** 100% Valid Directives · Zero Crawl Conflicts · Exact Canonicals  

---

## 1. Investigation of Missing Directives

The uploaded SEO checker screenshot displayed:
- **Robots Tag:** *Missing*
- **X-Robots-Tag:** *Missing*

### Root Cause Analysis
1. **HTML Robots Meta Tag:** The base `index.html` lacked an explicit `<meta name="robots">` tag. Although search engines default to `index, follow` in the absence of a robots tag, tools flag this as "Missing" because explicit directives such as `max-image-preview:large` are required for Google Discover and rich snippet image thumbnails.
2. **HTTP X-Robots-Tag Header:** The Vercel deployment configuration (`vercel.json`) did not have an explicit `X-Robots-Tag` header configured on HTTP responses.

---

## 2. Multi-Layer Remediation Strategy

To guarantee unequivocal crawling directives for both HTML and non-HTML assets, a two-layer approach was implemented:

```
┌──────────────────────────────────────────────────────────┐
│                   HTTP Request to Edge                   │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Public HTML Route                Private / Sensitive
   (/, /work, /evidence...)         (/admin, /api, resume.pdf)
            │                                 │
            ▼                                 ▼
   [HTTP Response Header]            [HTTP Response Header]
   X-Robots-Tag: index, follow,      X-Robots-Tag: noindex, nofollow
   max-image-preview:large           (or noindex on raw PDF)
            │                                 │
            ▼                                 ▼
   [HTML Meta Tag]                   [HTML Meta Tag]
   <meta name="robots"               <meta name="robots"
   content="index, follow,           content="noindex, nofollow">
   max-image-preview:large">
```

### 2.1 HTML Level Directive
Added to `index.html` and every prerendered static route document:
```html
<meta name="robots" content="index, follow, max-image-preview:large" />
```
For the owner console (`/admin`), the `<SEOHead>` component and security gate dynamically enforce:
```html
<meta name="robots" content="noindex, nofollow" />
```

### 2.2 HTTP Response Header Level Directive (`vercel.json`)
Explicit header routing rules ensure headers match content intent:

```json
{
  "source": "/((?!admin|api).*)",
  "headers": [
    {
      "key": "X-Robots-Tag",
      "value": "index, follow, max-image-preview:large"
    }
  ]
},
{
  "source": "/admin(.*)",
  "headers": [
    {
      "key": "X-Robots-Tag",
      "value": "noindex, nofollow"
    }
  ]
},
{
  "source": "/api/(.*)",
  "headers": [
    {
      "key": "X-Robots-Tag",
      "value": "noindex, nofollow"
    }
  ]
},
{
  "source": "/resume.pdf",
  "headers": [
    {
      "key": "X-Robots-Tag",
      "value": "noindex"
    }
  ]
}
```

> **Note on `/resume.pdf` canonicalization:** Applying `X-Robots-Tag: noindex` to `/resume.pdf` prevents Google from indexing the raw binary PDF file while allowing the canonical `/resume` HTML web page (which contains rich navigation, print controls, and verified interactive dossiers) to rank as the primary search result.

---

## 3. Crawler Policy Validation (`public/robots.txt`)

The production `robots.txt` file was verified live via `curl -s https://chethan-kumar-portfolio.vercel.app/robots.txt`:

```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://chethan-kumar-portfolio.vercel.app/sitemap.xml
```

### Audit Findings
- **Content-Type:** `text/plain; charset=utf-8` (Guaranteed via `vercel.json` edge header; does not serve SPA HTML).
- **HTTP Status:** `200 OK`.
- **Syntax:** Standard RFC 9309 compliant.
- **Security:** Correctly disallows crawling of administrative paths (`/admin`) and internal backend APIs (`/api/`) without relying on `robots.txt` as an access-control mechanism (access control is enforced via WebAuthn, MFA, and JWT session validation in `SecurityGate.tsx`).

---

## 4. Comprehensive XML Sitemap Validation (`public/sitemap.xml`)

Verified live via `curl -s https://chethan-kumar-portfolio.vercel.app/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Public Sections -->
  <url>
    <loc>https://chethan-kumar-portfolio.vercel.app/</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://chethan-kumar-portfolio.vercel.app/work</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  ...
```

### Sitemap Verification Checklist
- [x] Declares standard XML schema namespace: `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`.
- [x] Served with `Content-Type: application/xml; charset=utf-8`.
- [x] Contains all 8 core public routes (`/`, `/work`, `/evidence`, `/recruiter-brief`, `/academics`, `/archive`, `/resume`, `/contact`).
- [x] Contains all 20 individual project case studies (e.g. `/project/secret-snap`, `/project/spellsense-nlp`, `/project/prism-risk-modeling`).
- [x] Excludes administrative routes (`/admin`), private recruiter URLs, and API endpoints.
- [x] Zero duplicate URLs, zero localhost references, zero relative paths.
- [x] Consistent URL protocol (`https://`) and hostname (`chethan-kumar-portfolio.vercel.app`).

---

## 5. Canonical URL Validation Across All Routes

Each public route emits a strict, self-referencing canonical tag matching its location in `sitemap.xml`:

| Path | Rendered Canonical Tag | Status |
|---|---|:---:|
| `/` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/" />` | Verified |
| `/work` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/work" />` | Verified |
| `/evidence` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/evidence" />` | Verified |
| `/archive` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/archive" />` | Verified |
| `/recruiter-brief` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/recruiter-brief" />` | Verified |
| `/academics` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/academics" />` | Verified |
| `/contact` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/contact" />` | Verified |
| `/resume` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/resume" />` | Verified |
| `/project/:slug` | `<link rel="canonical" href="https://chethan-kumar-portfolio.vercel.app/project/:slug" />` | Verified |

- **No Trailing Slash Inconsistencies:** All inner routes omit trailing slashes (`/work`, not `/work/`), while root is self-referencing (`https://chethan-kumar-portfolio.vercel.app/`).
- **No Duplicate Tags:** The `updateCanonical()` utility in `SEOHead.tsx` mutates the single existing canonical tag on route change rather than appending duplicates.
- **Pre-rendered in Source:** Every static HTML file generated in `dist/` contains the canonical link directly inside `<head>` before hydration.
