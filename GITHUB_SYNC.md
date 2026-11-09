# Automated GitHub Synchronisation Specification

## Architecture Overview

The synchronisation engine bridges public GitHub activity on `https://github.com/StratagemVX` directly into the portfolio's structured index (`src/data/projects.json`).

```
GitHub Profile (StratagemVX)
       │
       ▼
GitHub REST API (/users/StratagemVX/repos?per_page=100)
       │
       ▼
sync-github.mjs Engine (Normalization, Language Extraction, Curated Merging)
       │
       ├── Preserves Curated Case Studies (Architectures, Contributions, Limits)
       ├── Auto-discovers New Repositories & Updates Timestamps
       └── Rate Limit Fallback (src/data/github-snapshot.json)
       │
       ▼
Local Project Index (src/data/projects.json)
```

---

## Triggers

1. **Scheduled Daily Sync:** GitHub Actions workflow `.github/workflows/github-sync.yml` triggers daily at `04:00 UTC` via standard cron.
2. **Manual Workflow Dispatch:** Can be invoked anytime via GitHub Actions web UI or CLI: `gh workflow run github-sync.yml`.
3. **Admin Dashboard Button:** Owner can click "Trigger Refresh" in the `/admin` portal.
4. **Local CLI Command:** Run `npm run sync:github` in the terminal.

---

## Conflict Resolution & Content Preservation Rules

1. **Curated Case Studies Are Sacred:**
   - The sync script matches repositories using normalized alphanumeric names (`normalize(repo.name) === normalize(p.id)`).
   - Custom case study prose (problem statements, architecture diagrams, verified contributions, limitations) is NEVER overwritten by empty or basic GitHub README descriptions.
2. **Technology Accumulation:**
   - Languages returned by GitHub are automatically appended to the technology list, preserving manually tagged libraries (e.g. `AES-256`, `Web Cryptography API`).
3. **Empty Repository Classification:**
   - Repositories with no commits or empty contents (such as `ShadowComm`) are flagged as `Experimental` or `Archived` and excluded from the Featured Case Studies carousel.
4. **Upstream Failure Protection:**
   - If GitHub returns HTTP 403 (Rate Limit) or network timeouts, the sync engine restores `src/data/github-snapshot.json` so the portfolio remains online with zero degraded states.
