export interface RouteSEO {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogType?: 'website' | 'profile' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  breadcrumbs?: Array<{ name: string; path: string }>;
  jsonLd?: Record<string, any>;
}

export const SITE_URL = 'https://chethan-kumar-portfolio.vercel.app';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const BASE_PERSON_SCHEMA = {
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

export const BASE_WEBSITE_SCHEMA = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: 'Chethan Kumar | AI, Cybersecurity & Software Engineering',
  description: 'Explore Chethan Kumar’s engineering portfolio: AI, NLP, cybersecurity, cryptography and software projects with implementation evidence and source code.',
  publisher: {
    '@id': `${SITE_URL}/#person`
  },
  inLanguage: 'en-US'
};

export const STATIC_ROUTES_SEO: Record<string, RouteSEO> = {
  '/': {
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
  '/work': {
    title: 'Engineering Projects | Chethan Kumar',
    description: 'Explore Chethan Kumar’s software projects across AI, cybersecurity, NLP and full-stack engineering, with project details and source-code links.',
    canonical: `${SITE_URL}/work`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/work-desktop.png`,
    ogImageAlt: 'Featured Engineering Projects — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work' }
    ]
  },
  '/evidence': {
    title: 'Technical Evidence | Chethan Kumar',
    description: 'Review the technologies, implementation details and GitHub source-code evidence behind Chethan Kumar’s engineering projects.',
    canonical: `${SITE_URL}/evidence`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/evidence-desktop.png`,
    ogImageAlt: 'Technical Evidence Matrix & Codebase Verification — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Evidence', path: '/evidence' }
    ]
  },
  '/archive': {
    title: 'Project Archive | Chethan Kumar',
    description: 'Browse Chethan Kumar’s public engineering repositories, experiments and academic projects, organised by technology and project area.',
    canonical: `${SITE_URL}/archive`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/archive-desktop.png`,
    ogImageAlt: 'Complete Engineering Repository Archive — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Archive', path: '/archive' }
    ]
  },
  '/recruiter-brief': {
    title: 'Recruiter Brief | Chethan Kumar',
    description: 'Review Chethan Kumar’s computer science background, technical interests, selected engineering projects and verified implementation evidence.',
    canonical: `${SITE_URL}/recruiter-brief`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'profile',
    ogImage: `${SITE_URL}/current-previews/recruiter-brief-desktop.png`,
    ogImageAlt: 'Candidate Assessment & Recruiter Brief — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Recruiter Brief', path: '/recruiter-brief' }
    ]
  },
  '/academics': {
    title: 'Academics | Chethan Kumar',
    description: 'Explore Chethan Kumar’s computer science education, relevant coursework and academic engineering projects at MVJ College of Engineering.',
    canonical: `${SITE_URL}/academics`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/academics-desktop.png`,
    ogImageAlt: 'Academic Foundations & Coursework — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Academics', path: '/academics' }
    ]
  },
  '/contact': {
    title: 'Contact Chethan Kumar',
    description: 'Contact Chethan Kumar about software engineering opportunities, technical projects, collaboration or professional discussions.',
    canonical: `${SITE_URL}/contact`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogImage: `${SITE_URL}/current-previews/contact-desktop.png`,
    ogImageAlt: 'Contact Channels & PGP Key Verification — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' }
    ]
  },
  '/resume': {
    title: 'Résumé | Chethan Kumar',
    description: 'View or download Chethan Kumar’s résumé, with education, technical skills, selected projects and verified professional details.',
    canonical: `${SITE_URL}/resume`,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'profile',
    ogImage: `${SITE_URL}/current-previews/resume-desktop.png`,
    ogImageAlt: 'Curriculum Vitae & Verified Resume — Chethan Kumar',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Resume', path: '/resume' }
    ]
  },
  '/admin': {
    title: 'Admin Console | Chethan Kumar',
    description: 'Restricted administrative terminal and security control plane for Chethan Kumar engineering portfolio.',
    canonical: `${SITE_URL}/admin`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Restricted Admin Console'
  }
};

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
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

export function getProjectSEO(project: {
  slug: string;
  name: string;
  headline: string;
  description: string;
  category: string;
  technologies: string[];
  repositoryUrl: string;
}): RouteSEO {
  const canonical = `${SITE_URL}/project/${project.slug}`;
  return {
    title: `${project.name} | Chethan Kumar`,
    description: `${project.headline} Architectural case study, implementation evidence, and verified source code repository.`,
    canonical,
    robots: 'index, follow, max-image-preview:large',
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${project.name} — Technical Architecture Case Study`,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work' },
      { name: project.name, path: `/project/${project.slug}` }
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          '@id': `${canonical}#article`,
          headline: project.name,
          description: project.description,
          url: canonical,
          inLanguage: 'en-US',
          author: { '@id': `${SITE_URL}/#person` },
          publisher: { '@id': `${SITE_URL}/#person` },
          about: project.technologies.map((tech) => ({
            '@type': 'Thing',
            name: tech
          }))
        },
        buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Work', path: '/work' },
          { name: project.name, path: `/project/${project.slug}` }
        ])
      ]
    }
  };
}
