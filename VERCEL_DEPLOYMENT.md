# Vercel Production Deployment: Chethan Kumar B S Engineering Portfolio

**Project:** `chethan-kumar-portfolio`  
**Owner:** `stratagemvxs-projects`  
**Framework:** Vite (React 18 + TypeScript + Tailwind CSS)  
**Production URL:** [https://chethan-kumar-portfolio.vercel.app](https://chethan-kumar-portfolio.vercel.app)  
**Deployment ID:** `dpl_79tnQ6CkJXaTnpK4nehS2AHm6bNA`  
**Deployment State:** `READY` (HTTP 200 OK across all routes)  
**Deployment Protection:** SSO Disabled (Open Public Access)

---

## 1. Production Architecture Overview

The frontend is deployed to Vercel's global Edge Network. It features:
- **Client-Side Routing:** Managed by React Router v6 with clean URLs and custom fallback rewrite (`/(.*) -> /`).
- **Edge Reverse Proxy for API:** Routes `/api/(.*)` directly to the Railway production backend (`https://backend-api-production-c798.up.railway.app/api/$1`), eliminating CORS and preflight overhead.
- **Client Cryptography:** In-browser Web Crypto API (`window.crypto.subtle`) executing AES-256-GCM cipher encryption and SHA-256 HMAC verification.
- **Telemetry:** In-browser latency simulation and Levenshtein dynamic programming matrices on the interactive workbench.
- **Security Headers:** Strict `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Static Asset Caching:** 1-year immutable caching on `/assets/*` (`public, max-age=31536000, immutable`).

---

## 2. Verified Route Status Matrix

Every production route has been tested and verified returning HTTP 200:

| Route | Production URL | HTTP Status | Purpose |
| :--- | :--- | :--- | :--- |
| **Home** | `https://chethan-kumar-portfolio.vercel.app/` | `200 OK` | Interactive workbench, positioning, curated systems |
| **Work** | `https://chethan-kumar-portfolio.vercel.app/work` | `200 OK` | Featured capstone engineering projects |
| **Evidence** | `https://chethan-kumar-portfolio.vercel.app/evidence` | `200 OK` | Verifiable capability-to-codebase matrix |
| **Archive** | `https://chethan-kumar-portfolio.vercel.app/archive` | `200 OK` | Full 20-repository indexed directory with search & filters |
| **Recruiter Brief** | `https://chethan-kumar-portfolio.vercel.app/recruiter-brief` | `200 OK` | 60-second executive summary & candidate dossier |
| **Academics** | `https://chethan-kumar-portfolio.vercel.app/academics` | `200 OK` | Undergrad curriculum & verified laboratory implementations |
| **Contact** | `https://chethan-kumar-portfolio.vercel.app/contact` | `200 OK` | Direct verified channels & client message dispatch |
| **Résumé** | `https://chethan-kumar-portfolio.vercel.app/resume` | `200 OK` | Official PDF embed & printable CV format |
| **Owner Portal** | `https://chethan-kumar-portfolio.vercel.app/admin` | `200 OK` | PBKDF2 + TOTP + Passkey security gate |

---

## 3. Vercel Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://backend-api-production-c798.up.railway.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

---

## 4. Environment Variables Configured on Vercel

Configured for both **Production** and **Preview** environments:

```bash
VITE_API_BASE_URL=https://backend-api-production-c798.up.railway.app
```

---

## 5. Maintenance & Redeployment Commands

- **Deploy New Production Build:**
  ```bash
  vercel deploy --prod --yes
  ```
- **Inspect Deployment:**
  ```bash
  vercel inspect https://chethan-kumar-portfolio.vercel.app
  ```
- **Pull Environment Variables:**
  ```bash
  vercel env pull .env.local
  ```
