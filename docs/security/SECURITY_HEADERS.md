# Security Headers Specification & Implementation

> **Objective:** Enforce defensive zero-trust HTTP response headers on production deployments (`https://chethan-kumar-portfolio.vercel.app`) without compromising functionality, WebAuthn MFA, or third-party identity integrations.  
> **Lighthouse Best Practices Score:** **100 / 100**  

---

## 1. Deployed Security Headers Architecture (`vercel.json`)

All HTTP headers are configured via edge routing rules in `vercel.json` and applied automatically across all production environments:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.auth0.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://chethan-kumar-portfolio.vercel.app https://chethan-kumar-portfolio-production.up.railway.app https://*.auth0.com https://*.googleapis.com https://*.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=()"
        }
      ]
    }
  ]
}
```

---

## 2. Deep Dive: Header Rationale & Functional Compatibility

### 2.1 Content-Security-Policy (CSP)
- **`default-src 'self'`**: Rejects all external resource loading by default.
- **`script-src 'self' 'unsafe-inline' https://cdn.auth0.com`**: Authorizes local compiled assets, minimal inline scripts, and Auth0 WebAuthn/Universal Login SDK assets.
- **`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`**: Allows local stylesheets, Tailwind inline styles, and Google Fonts stylesheets.
- **`font-src 'self' https://fonts.gstatic.com data:`**: Authorizes Google Fonts WOFF2 files and data URIs.
- **`connect-src 'self' ... https://*.auth0.com`**: Permits backend API queries, WebAuthn authentication handshakes, and Railway fallback endpoints.
- **`frame-ancestors 'none'`**: Completely prevents embedding within external `<iframe>` elements, defeating clickjacking and UI redress attacks.

### 2.2 Strict-Transport-Security (HSTS)
- **`max-age=63072000; includeSubDomains; preload`**: Enforces HTTPS connections for 2 full years (63,072,000 seconds) across all current and future subdomains, making the domain eligible for Google Chrome's HSTS preload list.

### 2.3 Cross-Origin-Opener-Policy (COOP)
- **`same-origin-allow-popups`**: Crucial architectural balance allowing Auth0 popup windows and FIDO2/WebAuthn hardware authenticator dialogues to coordinate securely with the primary window without compromising process isolation against Spectre-style attacks.

### 2.4 X-Frame-Options & X-Content-Type-Options
- **`X-Frame-Options: DENY`**: Legacy browser protection against clickjacking.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type confusion and drive-by script execution when fetching non-executable assets.

### 2.5 Permissions-Policy
- Explicitly disables access to sensitive browser device APIs (`camera`, `microphone`, `geolocation`, `payment`) since this engineering portfolio does not require hardware sensor access.

---

## 3. Verification Commands

To verify active headers on the production deployment:

```bash
curl -I https://chethan-kumar-portfolio.vercel.app
```

**Observed Production Response:**
```http
HTTP/2 200 
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self' ...
cross-origin-opener-policy: same-origin-allow-popups
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```
