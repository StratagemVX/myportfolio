# Connected Applications & Integrations Status Matrix

As per the technical requirements, every connected application and tool is evaluated honestly based on operational readiness:

| Application / Service | Role in Platform | Status | Implementation Notes |
| :--- | :--- | :--- | :--- |
| **GitHub REST API** | Public repository discovery & language analytics | **Integrated & Tested** | `scripts/sync-github.mjs` discovers 20 public repositories from `StratagemVX` with rate-limit fallback. |
| **GitHub Actions** | Automated CI/CD synchronization | **Integrated & Tested** | `.github/workflows/github-sync.yml` scheduled daily at 04:00 UTC with commit-back. |
| **Vercel** | Production Edge Hosting & SPA rewrites | **Integrated & Tested** | `vercel.json` configured with security headers and client route rewrites. |
| **Auth0** | Enterprise IAM, RBAC & Admin MFA | **Integrated (Awaiting Tenant Keys)** | SDK integrated in architecture; local administrator passphrase provides fallback clearance until credentials are added. |
| **Railway** | Optional server-side webhook receiver | **Architecture Defined** | Can be deployed if real-time push webhooks are required instead of GitHub Actions scheduled polling. |
| **CodeRabbit** | Automated PR code review & security auditing | **Connected Agent Tool** | Available as developer environment review tool for pull requests. |
| **Google Cloud Telemetry** | Operational metrics & latency tracking | **Connected (Hook Resolved)** | Local harness hook fixed. Operational metrics logged in Admin Console. |
| **Stripe** | Commercial payments | **Not Required** | Candidate portfolio is public engineering showcase; no commercial checkout implemented. |
| **Wix / WordPress** | External CMS | **Not Required** | Portfolio is custom-engineered React/TypeScript codebase with full data sovereignty. |
