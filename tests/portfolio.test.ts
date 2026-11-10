import { describe, it, expect } from 'vitest';
import projectsData from '../src/data/projects.json';

describe('Chethan Kumar Portfolio Data Integrity & Route Architecture Tests', () => {
  it('loads valid portfolio metadata without inventing unverified credentials', () => {
    expect(projectsData.owner.fullName).toBe('Chethan Kumar B S');
    expect(projectsData.owner.displayName).toBe('Chethan Kumar');
    expect(projectsData.owner.githubUrl).toBe('https://github.com/StratagemVX');
    expect(projectsData.owner.email).toBe('chethan.athulith@outlook.com');
    expect(projectsData.owner.philosophy).toBe('Security First. Intelligence Always.');
    expect(projectsData.owner.college).toContain('MVJ College of Engineering');
    expect(projectsData.owner.university).toContain('Visvesvaraya Technological University');
  });

  it('contains verified featured projects with architectural case studies', () => {
    const featured = projectsData.projects.filter(p => p.isFeatured);
    expect(featured.length).toBeGreaterThanOrEqual(4);

    for (const project of featured) {
      expect(project.slug).toBeDefined();
      expect(project.problemStatement.length).toBeGreaterThan(15);
      expect(project.architectureOverview.length).toBeGreaterThan(15);
      expect(project.myContribution.length).toBeGreaterThan(10);
      expect(project.limitations.length).toBeGreaterThan(5);
      expect(project.repositoryUrl).toContain('github.com/StratagemVX');
    }
  });

  it('correctly classifies empty repository ShadowComm as Experimental', () => {
    const shadowComm = projectsData.projects.find(p => p.id === 'shadowcomm');
    expect(shadowComm).toBeDefined();
    expect(shadowComm?.isFeatured).toBe(false);
    expect(shadowComm?.status).toBe('Experimental');
  });

  it('maps technical capabilities to real GitHub codebases with zero fake percentages', () => {
    const secretSnap = projectsData.projects.find(p => p.id === 'secret-snap');
    expect(secretSnap?.technologies).toContain('AES-256');

    const sdc = projectsData.projects.find(p => p.id === 'sdc-level-3');
    expect(sdc?.technologies).toContain('React');
    expect(sdc?.name).toBe('Shadow Message Cipher');

    const prism = projectsData.projects.find(p => p.id === 'major-project');
    expect(prism?.technologies).toContain('PyTorch (CUDA 12.1)');

    const spellSense = projectsData.projects.find(p => p.id === 'spellsense-nlp-aat');
    expect(spellSense?.technologies).toContain('SymSpell');
  });

  it('ensures no sensitive secrets or tokens are stored in client data models', () => {
    const raw = JSON.stringify(projectsData);
    expect(raw).not.toContain('ghp_');
    expect(raw).not.toContain('auth0_secret');
    expect(raw).not.toContain('client_secret');
    expect(raw).not.toContain('private_key');
  });

  it('validates SEO assets: robots.txt and sitemap.xml exist and conform to standards', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    expect(robotsContent).toContain('User-agent: *');
    expect(robotsContent).toContain('Allow: /');
    expect(robotsContent).toContain('Sitemap: https://chethan-kumar-portfolio.vercel.app/sitemap.xml');

    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemapContent).toContain('https://chethan-kumar-portfolio.vercel.app/work');
    expect(sitemapContent).toContain('https://chethan-kumar-portfolio.vercel.app/evidence');
  });

  it('validates enterprise security headers in vercel.json configuration', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

    const globalHeaders = vercelConfig.headers.find((h: any) => h.source === '/(.*)');
    expect(globalHeaders).toBeDefined();

    const headerKeys = globalHeaders.headers.map((h: any) => h.key);
    expect(headerKeys).toContain('Strict-Transport-Security');
    expect(headerKeys).toContain('Content-Security-Policy');
    expect(headerKeys).toContain('Cross-Origin-Opener-Policy');
    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('X-Content-Type-Options');
  });

  it('validates improved SEO metadata configuration for all public routes', async () => {
    const { STATIC_ROUTES_SEO, SITE_URL } = await import('../src/data/seoConfig');
    
    // 1. Homepage
    const home = STATIC_ROUTES_SEO['/'];
    expect(home.title).toBe('Chethan Kumar | AI, Cybersecurity & Software Engineering');
    expect(home.title.length).toBe(56);
    expect(home.description).toBe('Explore Chethan Kumar’s engineering portfolio: AI, NLP, cybersecurity, cryptography and software projects with implementation evidence and source code.');
    expect(home.description.length).toBe(151);
    expect(home.canonical).toBe(`${SITE_URL}/`);
    expect(home.robots).toBe('index, follow, max-image-preview:large');

    // 2. Work
    const work = STATIC_ROUTES_SEO['/work'];
    expect(work.title).toBe('Engineering Projects | Chethan Kumar');
    expect(work.description).toBe('Explore Chethan Kumar’s software projects across AI, cybersecurity, NLP and full-stack engineering, with project details and source-code links.');
    expect(work.canonical).toBe(`${SITE_URL}/work`);
    expect(work.robots).toBe('index, follow, max-image-preview:large');

    // 3. Evidence
    const evidence = STATIC_ROUTES_SEO['/evidence'];
    expect(evidence.title).toBe('Technical Evidence | Chethan Kumar');
    expect(evidence.description).toBe('Review the technologies, implementation details and GitHub source-code evidence behind Chethan Kumar’s engineering projects.');
    expect(evidence.canonical).toBe(`${SITE_URL}/evidence`);

    // 4. Archive
    const archive = STATIC_ROUTES_SEO['/archive'];
    expect(archive.title).toBe('Project Archive | Chethan Kumar');
    expect(archive.description).toBe('Browse Chethan Kumar’s public engineering repositories, experiments and academic projects, organised by technology and project area.');
    expect(archive.canonical).toBe(`${SITE_URL}/archive`);

    // 5. Recruiter Brief
    const recruiter = STATIC_ROUTES_SEO['/recruiter-brief'];
    expect(recruiter.title).toBe('Recruiter Brief | Chethan Kumar');
    expect(recruiter.description).toBe('Review Chethan Kumar’s computer science background, technical interests, selected engineering projects and verified implementation evidence.');
    expect(recruiter.canonical).toBe(`${SITE_URL}/recruiter-brief`);

    // 6. Academics
    const academics = STATIC_ROUTES_SEO['/academics'];
    expect(academics.title).toBe('Academics | Chethan Kumar');
    expect(academics.description).toBe('Explore Chethan Kumar’s computer science education, relevant coursework and academic engineering projects at MVJ College of Engineering.');
    expect(academics.canonical).toBe(`${SITE_URL}/academics`);

    // 7. Contact
    const contact = STATIC_ROUTES_SEO['/contact'];
    expect(contact.title).toBe('Contact Chethan Kumar');
    expect(contact.description).toBe('Contact Chethan Kumar about software engineering opportunities, technical projects, collaboration or professional discussions.');
    expect(contact.canonical).toBe(`${SITE_URL}/contact`);

    // 8. Resume
    const resume = STATIC_ROUTES_SEO['/resume'];
    expect(resume.title).toBe('Résumé | Chethan Kumar');
    expect(resume.description).toBe('View or download Chethan Kumar’s résumé, with education, technical skills, selected projects and verified professional details.');
    expect(resume.canonical).toBe(`${SITE_URL}/resume`);

    // 9. Admin (Private)
    const admin = STATIC_ROUTES_SEO['/admin'];
    expect(admin.robots).toBe('noindex, nofollow');
  });

  it('validates HTTP X-Robots-Tag routing rules in vercel.json', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const vercelConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8'));
    
    // Public routes receive index, follow
    const publicRobots = vercelConfig.headers.find((h: any) => h.source.includes('?!admin|api'));
    expect(publicRobots).toBeDefined();
    const publicHeader = publicRobots.headers.find((hdr: any) => hdr.key === 'X-Robots-Tag');
    expect(publicHeader?.value).toBe('index, follow, max-image-preview:large');

    // Admin receives noindex, nofollow
    const adminRobots = vercelConfig.headers.find((h: any) => h.source === '/admin(.*)');
    expect(adminRobots).toBeDefined();
    const adminHeader = adminRobots.headers.find((hdr: any) => hdr.key === 'X-Robots-Tag');
    expect(adminHeader?.value).toBe('noindex, nofollow');

    // API receives noindex, nofollow
    const apiRobots = vercelConfig.headers.find((h: any) => h.source === '/api/(.*)');
    expect(apiRobots).toBeDefined();
    const apiHeader = apiRobots.headers.find((hdr: any) => hdr.key === 'X-Robots-Tag');
    expect(apiHeader?.value).toBe('noindex, nofollow');

    // Raw PDF is excluded from index to canonicalize /resume HTML page
    const pdfRobots = vercelConfig.headers.find((h: any) => h.source === '/resume.pdf');
    expect(pdfRobots).toBeDefined();
    const pdfHeader = pdfRobots.headers.find((hdr: any) => hdr.key === 'X-Robots-Tag');
    expect(pdfHeader?.value).toBe('noindex');
  });

  it('validates self-hosted fonts and zero external Google Font CDN dependency', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // Font files exist in public/fonts
    const fontFiles = [
      'inter-latin.woff2',
      'space-grotesk-latin.woff2',
      'jetbrains-mono-latin.woff2'
    ];

    for (const file of fontFiles) {
      const fontPath = path.join(process.cwd(), 'public', 'fonts', file);
      expect(fs.existsSync(fontPath)).toBe(true);
      expect(fs.statSync(fontPath).size).toBeGreaterThan(15000);
    }

    // index.html does not connect to external Google Fonts CDN
    const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
    expect(indexHtml).not.toContain('fonts.googleapis.com');
    expect(indexHtml).not.toContain('fonts.gstatic.com');
    expect(indexHtml).toContain('/fonts/space-grotesk-latin.woff2');
    expect(indexHtml).toContain('/fonts/inter-latin.woff2');
  });

  it('validates generated static HTML files for all core routes with unique metadata', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const expectedRoutes = [
      { file: 'index.html', title: 'Chethan Kumar | AI, Cybersecurity & Software Engineering' },
      { file: 'work/index.html', title: 'Engineering Projects | Chethan Kumar' },
      { file: 'evidence/index.html', title: 'Technical Evidence | Chethan Kumar' },
      { file: 'archive/index.html', title: 'Project Archive | Chethan Kumar' },
      { file: 'recruiter-brief/index.html', title: 'Recruiter Brief | Chethan Kumar' },
      { file: 'academics/index.html', title: 'Academics | Chethan Kumar' },
      { file: 'contact/index.html', title: 'Contact Chethan Kumar' },
      { file: 'resume/index.html', title: 'Résumé | Chethan Kumar' }
    ];

    for (const r of expectedRoutes) {
      const filePath = path.join(process.cwd(), 'dist', r.file);
      expect(fs.existsSync(filePath), `Static file ${r.file} must exist`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain(`<title>${r.title}</title>`);
      expect(content).toContain('name="robots" content="index, follow, max-image-preview:large"');
      expect(content).toContain('property="og:image"');
      expect(content).toContain('name="twitter:card" content="summary_large_image"');
      expect(content).toContain('application/ld+json');
    }
  });
});
