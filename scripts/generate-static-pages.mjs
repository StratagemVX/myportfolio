import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const PROJECTS_FILE = path.resolve('src/data/projects.json');
const SITE_URL = 'https://chethan-kumar-portfolio.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist directory does not exist. Run "vite build" first.');
  process.exit(1);
}

const template = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));

const BASE_PERSON_SCHEMA = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'Chethan Kumar B S',
  alternateName: ['Chethan Kumar', 'StratagemVX'],
  jobTitle: 'Computer Science Engineer',
  description: 'Undergraduate Computer Science Engineer (2027 Batch) at MVJ College of Engineering specializing in AI, applied cryptography, and software engineering.',
  url: `${SITE_URL}/`,
  sameAs: [
    'https://github.com/StratagemVX',
    'https://linkedin.com/in/chethan-kumar-b-s-781a002bb'
  ],
  affiliation: {
    '@type': 'CollegeOrUniversity',
    name: 'MVJ College of Engineering',
    sameAs: 'https://www.mvjce.edu.in'
  },
  knowsAbout: [
    'Artificial Intelligence',
    'Cybersecurity',
    'Applied Cryptography',
    'Natural Language Processing',
    'Distributed Systems',
    'Full Stack Web Architecture',
    'Zero Trust Security'
  ]
};

const BASE_WEBSITE_SCHEMA = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: 'Chethan Kumar | AI, Cybersecurity & Software Engineering',
  description: 'Explore Chethan Kumar’s engineering portfolio: AI, NLP, cybersecurity, cryptography and software projects with implementation evidence and source code.',
  inLanguage: 'en-US',
  publisher: {
    '@id': `${SITE_URL}/#person`
  }
};

function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${SITE_URL}${item.path}`
    }))
  };
}

const routes = [
  {
    path: '/',
    title: 'Chethan Kumar | AI, Cybersecurity & Software Engineering',
    description: 'Explore Chethan Kumar’s engineering portfolio: AI, NLP, cybersecurity, cryptography and software projects with implementation evidence and source code.',
    canonical: `${SITE_URL}/`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Chethan Kumar Portfolio — Computer Science Engineer specialising in AI & Cybersecurity',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        {
          '@type': 'ProfilePage',
          '@id': `${SITE_URL}/#profilepage`,
          url: `${SITE_URL}/`,
          name: 'Chethan Kumar | AI, Cybersecurity & Software Engineering',
          isPartOf: { '@id': `${SITE_URL}/#website` },
          mainEntity: { '@id': `${SITE_URL}/#person` }
        }
      ]
    }
  },
  {
    path: '/work',
    title: 'Engineering Projects | Chethan Kumar',
    description: 'Explore Chethan Kumar’s software projects across AI, cybersecurity, NLP and full-stack engineering, with project details and source-code links.',
    canonical: `${SITE_URL}/work`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/work-desktop.png`,
    ogImageAlt: 'Featured Engineering Projects — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Work', path: '/work' }
        ])
      ]
    }
  },
  {
    path: '/evidence',
    title: 'Technical Evidence | Chethan Kumar',
    description: 'Review the technologies, implementation details and GitHub source-code evidence behind Chethan Kumar’s engineering projects.',
    canonical: `${SITE_URL}/evidence`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/evidence-desktop.png`,
    ogImageAlt: 'Technical Evidence Matrix & Codebase Verification — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Evidence', path: '/evidence' }
        ])
      ]
    }
  },
  {
    path: '/archive',
    title: 'Project Archive | Chethan Kumar',
    description: 'Browse Chethan Kumar’s public engineering repositories, experiments and academic projects, organised by technology and project area.',
    canonical: `${SITE_URL}/archive`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/archive-desktop.png`,
    ogImageAlt: 'Complete Engineering Repository Archive — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Archive', path: '/archive' }
        ])
      ]
    }
  },
  {
    path: '/recruiter-brief',
    title: 'Recruiter Brief | Chethan Kumar',
    description: 'Review Chethan Kumar’s computer science background, technical interests, selected engineering projects and verified implementation evidence.',
    canonical: `${SITE_URL}/recruiter-brief`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'profile',
    ogImage: `${SITE_URL}/current-previews/recruiter-brief-desktop.png`,
    ogImageAlt: 'Candidate Assessment & Recruiter Brief — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Recruiter Brief', path: '/recruiter-brief' }
        ])
      ]
    }
  },
  {
    path: '/academics',
    title: 'Academics | Chethan Kumar',
    description: 'Explore Chethan Kumar’s computer science education, relevant coursework and academic engineering projects at MVJ College of Engineering.',
    canonical: `${SITE_URL}/academics`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/academics-desktop.png`,
    ogImageAlt: 'Academic Foundations & Coursework — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Academics', path: '/academics' }
        ])
      ]
    }
  },
  {
    path: '/contact',
    title: 'Contact Chethan Kumar',
    description: 'Contact Chethan Kumar about software engineering opportunities, technical projects, collaboration or professional discussions.',
    canonical: `${SITE_URL}/contact`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/contact-desktop.png`,
    ogImageAlt: 'Contact Channels & PGP Key Verification — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' }
        ])
      ]
    }
  },
  {
    path: '/resume',
    title: 'Résumé | Chethan Kumar',
    description: 'View or download Chethan Kumar’s résumé, with education, technical skills, selected projects and verified professional details.',
    canonical: `${SITE_URL}/resume`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'profile',
    ogImage: `${SITE_URL}/current-previews/resume-desktop.png`,
    ogImageAlt: 'Curriculum Vitae & Verified Resume — Chethan Kumar',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Resume', path: '/resume' }
        ])
      ]
    }
  },
  {
    path: '/admin',
    title: 'Admin Session Required | Chethan Kumar',
    description: 'Private owner security control room. Authentication required.',
    canonical: `${SITE_URL}/admin`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Private Admin Perimeter'
  }
];

// Add all 20 project detail pages
for (const project of projectsData.projects) {
  const slug = project.slug || project.id;
  const canonical = `${SITE_URL}/project/${slug}`;
  routes.push({
    path: `/project/${slug}`,
    title: `${project.name} | Chethan Kumar`,
    description: `${project.headline} Architectural case study, implementation evidence, and verified source code repository.`,
    canonical,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${project.name} — Technical Architecture Case Study`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        BASE_PERSON_SCHEMA,
        BASE_WEBSITE_SCHEMA,
        {
          '@type': 'TechArticle',
          '@id': `${canonical}#article`,
          headline: project.name,
          description: project.description,
          url: canonical,
          inLanguage: 'en-US',
          author: { '@id': `${SITE_URL}/#person` },
          publisher: { '@id': `${SITE_URL}/#person` },
          about: project.technologies.map((t) => ({ '@type': 'Thing', name: t }))
        },
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Work', path: '/work' },
          { name: project.name, path: `/project/${slug}` }
        ])
      ]
    }
  });
}

// Inline the compiled stylesheet to eliminate render-blocking CSS round-trips on initial paint
const assetFiles = fs.existsSync(path.join(DIST_DIR, 'assets'))
  ? fs.readdirSync(path.join(DIST_DIR, 'assets'))
  : [];

let inlinedTemplate = template.replace(
  /<link\s+rel="stylesheet"\s+[^>]*href="\/assets\/([^"]+\.css)"[^>]*>/,
  (match, cssFilename) => {
    const cssPath = path.join(DIST_DIR, 'assets', cssFilename);
    if (!fs.existsSync(cssPath)) return match;
    const cssText = fs.readFileSync(cssPath, 'utf-8');
    return `<style>\n${cssText}\n    </style>`;
  }
);

function resolveChunkPreload(routePath) {
  const prefixMap = [
    ['/work', 'WorkPage-'],
    ['/evidence', 'EvidencePage-'],
    ['/archive', 'ArchivePage-'],
    ['/recruiter-brief', 'RecruiterBriefPage-'],
    ['/academics', 'AcademicsPage-'],
    ['/contact', 'ContactPage-'],
    ['/resume', 'ResumePage-'],
    ['/admin', 'AdminDashboardPage-']
  ];
  const matchedPrefix =
    prefixMap.find(([p]) => routePath === p)?.[1] ||
    (routePath.startsWith('/project/') ? 'ProjectDetailPage-' : null);
  if (!matchedPrefix) return null;
  const chunk = assetFiles.find((f) => f.startsWith(matchedPrefix) && f.endsWith('.js'));
  return chunk ? `/assets/${chunk}` : null;
}

function renderHtmlForRoute(route) {
  let html = inlinedTemplate;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${route.title}</title>`);

  // Replace Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/s,
    `<meta name="description" content="${route.description.replace(/"/g, '&quot;')}" />`
  );

  // Replace Robots
  html = html.replace(
    /<meta name="robots" content=".*?" \/>/s,
    `<meta name="robots" content="${route.robots}" />`
  );

  // Replace Canonical
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/s,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // Replace Open Graph
  html = html.replace(/<meta property="og:type" content=".*?" \/>/s, `<meta property="og:type" content="${route.ogType}" />`);
  html = html.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${route.canonical}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${route.title.replace(/"/g, '&quot;')}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${route.description.replace(/"/g, '&quot;')}" />`);
  html = html.replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${route.ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content=".*?" \/>/s, `<meta property="og:image:alt" content="${route.ogImageAlt.replace(/"/g, '&quot;')}" />`);

  // Replace Twitter
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${route.title.replace(/"/g, '&quot;')}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${route.description.replace(/"/g, '&quot;')}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?" \/>/s, `<meta name="twitter:image" content="${route.ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content=".*?" \/>/s, `<meta name="twitter:image:alt" content="${route.ogImageAlt.replace(/"/g, '&quot;')}" />`);

  // Replace JSON-LD
  if (route.jsonLd) {
    const jsonLdString = JSON.stringify(route.jsonLd, null, 2);
    html = html.replace(
      /<script type="application\/ld\+json">.*?<\/script>/s,
      `<script type="application/ld+json">\n${jsonLdString}\n    </script>`
    );
  }

  // Inject route-specific modulepreload so lazy secondary chunks fetch in parallel with boot
  const routeChunk = resolveChunkPreload(route.path);
  if (routeChunk) {
    html = html.replace(
      '</head>',
      `    <link rel="modulepreload" crossorigin href="${routeChunk}">\n  </head>`
    );
  }

  return html;
}

console.log(`Generating static HTML prerender for ${routes.length} routes...`);

for (const route of routes) {
  const html = renderHtmlForRoute(route);
  
  if (route.path === '/') {
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
    console.log(`  ✓ Prerendered [${route.path}] -> dist/index.html`);
  } else {
    const routeDir = path.join(DIST_DIR, route.path.replace(/^\//, ''));
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
    console.log(`  ✓ Prerendered [${route.path}] -> dist/${route.path.replace(/^\//, '')}/index.html`);
  }
}

console.log('Static route generation completed successfully.');
