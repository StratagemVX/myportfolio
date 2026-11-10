import { useEffect } from 'react';
import { RouteSEO, DEFAULT_OG_IMAGE, buildBreadcrumbSchema } from '../data/seoConfig';

interface SEOHeadProps extends Partial<RouteSEO> {
  title: string;
  description: string;
  canonical: string;
}

function updateMetaByName(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateMetaByProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateCanonical(url: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

function updateJsonLd(schema: Record<string, any> | null) {
  const SCRIPT_ID = 'route-json-ld';
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  
  if (!schema) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema, null, 2);
}

export default function SEOHead({
  title,
  description,
  canonical,
  robots = 'index, follow, max-image-preview:large',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt,
  breadcrumbs,
  jsonLd
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // 2. Core SEO meta
    updateMetaByName('description', description);
    updateMetaByName('robots', robots);
    updateCanonical(canonical);

    // 3. Open Graph
    updateMetaByProperty('og:title', title);
    updateMetaByProperty('og:description', description);
    updateMetaByProperty('og:url', canonical);
    updateMetaByProperty('og:type', ogType);
    updateMetaByProperty('og:image', ogImage);
    updateMetaByProperty('og:image:width', '1200');
    updateMetaByProperty('og:image:height', '630');
    updateMetaByProperty('og:site_name', 'Chethan Kumar Portfolio');
    if (ogImageAlt) {
      updateMetaByProperty('og:image:alt', ogImageAlt);
    }

    // 4. Twitter Card
    updateMetaByName('twitter:card', 'summary_large_image');
    updateMetaByName('twitter:title', title);
    updateMetaByName('twitter:description', description);
    updateMetaByName('twitter:image', ogImage);
    if (ogImageAlt) {
      updateMetaByName('twitter:image:alt', ogImageAlt);
    }

    // 5. Structured Data JSON-LD
    let finalSchema = jsonLd;
    if (!finalSchema && breadcrumbs && breadcrumbs.length > 0) {
      finalSchema = buildBreadcrumbSchema(breadcrumbs);
    }
    updateJsonLd(finalSchema || null);
  }, [title, description, canonical, robots, ogType, ogImage, ogImageAlt, breadcrumbs, jsonLd]);

  return null;
}
