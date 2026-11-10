const routes = [
  '/',
  '/work',
  '/evidence',
  '/archive',
  '/recruiter-brief',
  '/academics',
  '/contact',
  '/resume',
  '/project/secret-snap',
  '/robots.txt',
  '/sitemap.xml',
  '/og-image.png',
  '/resume.pdf',
  '/admin'
];

async function verifyAll() {
  const base = 'https://chethan-kumar-portfolio.vercel.app';
  console.log('=== VERIFYING LIVE PRODUCTION DEPLOYMENT ===\n');

  for (const r of routes) {
    const url = base + r;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' } });
    const status = res.status;
    const xRobots = res.headers.get('x-robots-tag');
    const xfo = res.headers.get('x-frame-options');
    const contentType = res.headers.get('content-type');

    let title = '';
    let description = '';
    let canonical = '';
    let metaRobots = '';

    if (contentType && contentType.includes('text/html')) {
      const html = await res.text();
      const tMatch = html.match(/<title>(.*?)<\/title>/);
      if (tMatch) title = tMatch[1];
      const dMatch = html.match(/<meta name="description" content="(.*?)"/);
      if (dMatch) description = dMatch[1];
      const cMatch = html.match(/<link rel="canonical" href="(.*?)"/);
      if (cMatch) canonical = cMatch[1];
      const rMatch = html.match(/<meta name="robots" content="(.*?)"/);
      if (rMatch) metaRobots = rMatch[1];
    }

    console.log(`URL: ${r}`);
    console.log(`  HTTP Status: ${status} | Content-Type: ${contentType}`);
    console.log(`  X-Robots-Tag: ${xRobots || 'NONE'}`);
    console.log(`  X-Frame-Options: ${xfo || 'NONE'}`);
    if (title) console.log(`  Title (${title.length} chars): ${title}`);
    if (description) console.log(`  Description (${description.length} chars): ${description}`);
    if (canonical) console.log(`  Canonical: ${canonical}`);
    if (metaRobots) console.log(`  Meta Robots: ${metaRobots}`);
    console.log('--------------------------------------------------');
  }
}

verifyAll().catch(console.error);
