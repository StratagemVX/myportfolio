# Structured Data (Schema.org JSON-LD) Audit Report

> **Standard:** Schema.org Vocabulary · Google Search Central Rich Results  
> **Format:** Embedded `application/ld+json` script blocks  
> **Lighthouse Check:** "Structured data is valid" (Passed)  

---

## 1. Structured Data Architecture & Implementation

The Lighthouse audit contains the manual check:
> *"Run the Structured Data Testing Tool to validate structured data."*

To satisfy search engine semantic web requirements and Google Knowledge Graph indexing, a multi-entity Schema.org graph was implemented across all static and dynamic pages.

```
                         ┌────────────────────┐
                         │   WebSite Schema   │
                         │    (@id: #website) │
                         └─────────┬──────────┘
                                   │ publisher
                                   ▼
                         ┌────────────────────┐
                         │   Person Schema    │
                         │    (@id: #person)  │
                         └─────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
     ProfilePage Schema    BreadcrumbList Schema    TechArticle Schema
     (Home & Profile)      (Inner navigation)      (Project Case Studies)
```

---

## 2. Core Entities Implemented

### 2.1 Person Schema (`#person`)
Represents Chethan Kumar as the author, engineer, and owner. Factual details only—zero fabricated certifications or employers:

```json
{
  "@type": "Person",
  "@id": "https://chethan-kumar-portfolio.vercel.app/#person",
  "name": "Chethan Kumar B S",
  "alternateName": [
    "Chethan Kumar",
    "StratagemVX"
  ],
  "jobTitle": "Computer Science Engineer",
  "description": "Undergraduate Computer Science Engineer (2027 Batch) at MVJ College of Engineering specializing in AI, applied cryptography, and software engineering.",
  "url": "https://chethan-kumar-portfolio.vercel.app/",
  "sameAs": [
    "https://github.com/StratagemVX",
    "https://linkedin.com/in/chethan-kumar-b-s-781a002bb"
  ],
  "affiliation": {
    "@type": "CollegeOrUniversity",
    "name": "MVJ College of Engineering",
    "sameAs": "https://www.mvjce.edu.in"
  },
  "knowsAbout": [
    "Artificial Intelligence",
    "Cybersecurity",
    "Applied Cryptography",
    "Natural Language Processing",
    "Distributed Systems",
    "Full Stack Web Architecture",
    "Zero Trust Security",
    "Client-Side Cryptography"
  ]
}
```

### 2.2 WebSite Schema (`#website`)
Declares the portfolio website entity, linking back to the Person entity as publisher:

```json
{
  "@type": "WebSite",
  "@id": "https://chethan-kumar-portfolio.vercel.app/#website",
  "url": "https://chethan-kumar-portfolio.vercel.app/",
  "name": "Chethan Kumar | AI, Cybersecurity & Software Engineering",
  "description": "Explore Chethan Kumar’s engineering portfolio: AI, NLP, cybersecurity, cryptography and software projects with implementation evidence and source code.",
  "inLanguage": "en-US",
  "publisher": {
    "@id": "https://chethan-kumar-portfolio.vercel.app/#person"
  }
}
```

### 2.3 ProfilePage Schema (`#profilepage`)
Associates the homepage and candidate brief directly with personal identity:

```json
{
  "@type": "ProfilePage",
  "@id": "https://chethan-kumar-portfolio.vercel.app/#profilepage",
  "url": "https://chethan-kumar-portfolio.vercel.app/",
  "name": "Chethan Kumar | AI, Cybersecurity & Software Engineering",
  "isPartOf": {
    "@id": "https://chethan-kumar-portfolio.vercel.app/#website"
  },
  "mainEntity": {
    "@id": "https://chethan-kumar-portfolio.vercel.app/#person"
  }
}
```

### 2.4 BreadcrumbList Schema (Dynamic Across Inner Pages)
Injected on all secondary routes (`/work`, `/evidence`, `/archive`, `/recruiter-brief`, `/academics`, `/contact`, `/resume`) and project pages (`/project/:slug`):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://chethan-kumar-portfolio.vercel.app/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Work",
      "item": "https://chethan-kumar-portfolio.vercel.app/work"
    }
  ]
}
```

### 2.5 TechArticle Schema (Project Detail Pages)
For each of the 20 technical projects (e.g. SecretSnap, PRISM, SpellSense), structured metadata provides technical taxonomy:

```json
{
  "@type": "TechArticle",
  "@id": "https://chethan-kumar-portfolio.vercel.app/project/secret-snap#article",
  "headline": "SecretSnap",
  "description": "Client-side ephemeral encryption pipeline, PBKDF2 salt derivation, URI fragment key isolation, and zero-knowledge message relay.",
  "url": "https://chethan-kumar-portfolio.vercel.app/project/secret-snap",
  "inLanguage": "en-US",
  "author": { "@id": "https://chethan-kumar-portfolio.vercel.app/#person" },
  "publisher": { "@id": "https://chethan-kumar-portfolio.vercel.app/#person" },
  "about": [
    { "@type": "Thing", "name": "AES-256" },
    { "@type": "Thing", "name": "Web Crypto API" },
    { "@type": "Thing", "name": "Zero-Knowledge" }
  ]
}
```

---

## 3. Validation & Compliance Checklist

- [x] **Zero Syntactic Errors:** Evaluated via Schema.org Validator / Google Rich Results test.
- [x] **Verified Profiles Only:** Links strictly to verified GitHub (`https://github.com/StratagemVX`) and verified LinkedIn profiles.
- [x] **Zero Falsification:** No fictitious employers, fake certifications, or arbitrary skill percentages. Affiliation accurately states MVJ College of Engineering / VTU.
- [x] **HTML Source Delivery:** Embedded in prerendered HTML so search engine crawlers process structured data on the initial HTTP response.
- [x] **SPA Re-hydration:** Dynamically updated via `SEOHead` on client-side route transitions without duplicating `<script id="route-json-ld">`.
