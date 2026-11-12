# Production Deployment Architecture: Chethan Kumar B S Engineering Portfolio

```mermaid
flowchart TD
    subgraph Users ["Client Ecosystem"]
        Visitor["Public Visitor / Technical Recruiter"]
        Owner["Authenticated Portfolio Owner"]
    end

    subgraph Vercel ["Vercel Edge Network (Frontend)"]
        VercelCDN["Global Edge CDN\nchethan-kumar-portfolio.vercel.app"]
        SPA["React 18 + Vite SPA\nInteractive Workbench\nWeb Crypto (AES-256-GCM)"]
        VercelRewrite["Vercel Edge Rewrite\n/api/* -> Railway Backend"]
        VercelCDN --> SPA
        SPA -->|API Requests| VercelRewrite
    end

    subgraph Railway ["Railway Cloud Infrastructure (Backend)"]
        RailwayIngress["Railway HTTPS Ingress\nyour-backend.example.com"]
        NodeBackend["Node.js REST Microservice (Port 3001)\nNIXPACKS Container"]
        AuthModule["Security Gate\nPBKDF2 SHA-512 + RFC 6238 TOTP\nWebAuthn Passkeys"]
        NotificationModule["Notification Dispatcher\nTruthful Delivery Status Tracking"]
        
        RailwayIngress --> NodeBackend
        NodeBackend --> AuthModule
        NodeBackend --> NotificationModule
    end

    subgraph ThirdParty ["External Cloud Integrations"]
        Auth0Cloud["Auth0 Identity Platform\nUniversal Login + Enterprise MFA"]
        FirebaseCloud["Firebase Firestore (Spark Tier)\nProfile & Audit Logs Persistence"]
        TwilioCloud["Twilio Communications API\nSMS & WhatsApp Delivery Pipeline"]
        GitHubCloud["GitHub (StratagemVX)\nRepository Source & Metadata Sync"]
    end

    Visitor -->|HTTPS| VercelCDN
    Owner -->|HTTPS Admin Access| VercelCDN
    VercelRewrite -->|HTTPS Reverse Proxy| RailwayIngress
    
    AuthModule <-->|OAuth / JWT Verification| Auth0Cloud
    NodeBackend <-->|Admin SDK Service Account| FirebaseCloud
    NotificationModule -->|Signed REST Requests| TwilioCloud
    NodeBackend <-->|Public API Sync| GitHubCloud
```

---

## Technical Specifications Summary

| Component | Provider | Configuration |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | Vite SPA, Global Edge Network, Custom Security Headers |
| **Backend REST Microservice** | Railway | Node.js v22 HTTP server, NIXPACKS builder, Railway Port Binding |
| **Identity & Authentication** | Auth0 & In-House Security Gate | Universal Login, PBKDF2 SHA-512, RFC 6238 TOTP, WebAuthn Passkeys |
| **Persistent Storage** | Firebase Firestore (Spark Tier) | Owner Profile, Security Audit Logs, FCM Device Tokens |
| **Security Telemetry Alerts** | Twilio | SMS & WhatsApp alerts with delivery verification |
| **Codebase Synchronization** | GitHub Actions (`StratagemVX`) | Automated daily sync for repository metrics and project index |
