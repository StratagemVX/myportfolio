import { createRequire } from 'node:module';
import { test, expect, type Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core');

const CORE_ROUTES = ['/', '/work', '/archive', '/evidence', '/contact', '/admin'] as const;

interface Telemetry {
  consoleErrors: string[];
  pageErrors: string[];
  cspViolations: Array<{ violatedDirective: string; blockedURI: string; sourceFile?: string }>;
  failedRequests: Array<{ url: string; status: number }>;
}

async function attachTelemetry(page: Page): Promise<Telemetry> {
  const telemetry: Telemetry = {
    consoleErrors: [],
    pageErrors: [],
    cspViolations: [],
    failedRequests: []
  };

  await page.addInitScript(() => {
    (window as unknown as { __cspViolations: unknown[] }).__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __cspViolations: unknown[] }).__cspViolations.push({
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        blockedURI: e.blockedURI,
        sourceFile: e.sourceFile
      });
    });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      telemetry.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    telemetry.pageErrors.push(err.message || String(err));
  });

  page.on('response', (res) => {
    const reqUrl = res.url();
    if (res.status() >= 400) {
      telemetry.failedRequests.push({ url: reqUrl, status: res.status() });
    }
  });

  return telemetry;
}

async function collectCspViolations(page: Page, telemetry: Telemetry) {
  const recorded = await page.evaluate(() => {
    return (window as unknown as { __cspViolations?: Telemetry['cspViolations'] }).__cspViolations || [];
  });
  telemetry.cspViolations.push(...recorded);
}

test.describe('Core routes runtime, CSP, Trusted Types, navigation & fail-closed admin checks', () => {
  for (const route of CORE_ROUTES) {
    test(`route ${route} renders cleanly with strict CSP headers and zero runtime errors`, async ({ page }) => {
      const telemetry = await attachTelemetry(page);
      const response = await page.goto(route, { waitUntil: 'networkidle' });

      expect(response, `Expected HTTP response for ${route}`).not.toBeNull();
      expect(response!.status()).toBe(200);

      const headers = response!.headers();
      const csp = headers['content-security-policy'] || '';
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("require-trusted-types-for 'script'");
      expect(csp).toContain('trusted-types portfolio-jsonld');

      const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) || '';
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['x-content-type-options']).toBe('nosniff');

      if (route === '/admin') {
        expect(headers['x-robots-tag']).toContain('noindex');
        const metaRobots = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(metaRobots).toContain('noindex');
      }

      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.locator('main#main-content')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      await expect(page.locator('h1').first()).toBeVisible();

      // Verify visible images load properly without broken naturalWidth
      const brokenImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
          .filter((img) => img.offsetParent !== null)
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.getAttribute('src'));
      });
      expect(brokenImages).toEqual([]);

      // Test client-side refresh integrity
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.locator('h1').first()).toBeVisible();

      await collectCspViolations(page, telemetry);
      expect(telemetry.cspViolations, `CSP violations on ${route}`).toEqual([]);
      expect(telemetry.pageErrors, `Uncaught page errors on ${route}`).toEqual([]);
      expect(telemetry.consoleErrors, `Console errors on ${route}`).toEqual([]);
      expect(telemetry.failedRequests, `HTTP >=400 requests on ${route}`).toEqual([]);
    });
  }

  test('interactive navigation, /archive filters, /contact form labels, and keyboard focus work cleanly', async ({ page, isMobile }) => {
    const telemetry = await attachTelemetry(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    if (isMobile) {
      const menuBtn = page.getByRole('button', { name: 'Toggle navigation menu' });
      await expect(menuBtn).toBeVisible();
      await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('banner').getByRole('link', { name: 'Archive', exact: true }).click();
    } else {
      await page.getByRole('banner').locator('nav').getByRole('link', { name: 'Archive', exact: true }).click();
    }

    await expect(page).toHaveURL(/\/archive$/);
    const searchInput = page.getByLabel('Filter repositories by name, language, or stack');
    const categorySelect = page.getByLabel('Filter repositories by category');
    await expect(searchInput).toBeVisible();
    await expect(categorySelect).toBeVisible();

    const initialRows = await page.locator('tbody tr').count();
    expect(initialRows).toBeGreaterThan(5);

    await searchInput.fill('Shadow');
    const filteredRows = await page.locator('tbody tr').count();
    expect(filteredRows).toBeGreaterThanOrEqual(1);
    expect(filteredRows).toBeLessThanOrEqual(initialRows);

    await searchInput.fill('');
    await categorySelect.selectOption('Cybersecurity & Cryptography');
    const catRows = await page.locator('tbody tr').count();
    expect(catRows).toBeGreaterThanOrEqual(1);
    expect(catRows).toBeLessThanOrEqual(initialRows);

    // Keyboard tab sanity check across /archive
    await categorySelect.focus();
    await expect(categorySelect).toBeFocused();
    await page.keyboard.press('Tab');

    // Navigate to /contact and verify explicit labels
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.getByLabel('Your name *')).toBeVisible();
    await expect(page.getByLabel('Your email *')).toBeVisible();
    await expect(page.getByLabel('Subject / Context')).toBeVisible();
    await expect(page.getByLabel('Message *')).toBeVisible();

    await collectCspViolations(page, telemetry);
    expect(telemetry.cspViolations).toEqual([]);
    expect(telemetry.pageErrors).toEqual([]);
    expect(telemetry.consoleErrors).toEqual([]);
  });

  test('/admin fails closed without authentication, never exposes secrets, and has labeled auth controls', async ({ page }) => {
    const telemetry = await attachTelemetry(page);
    await page.goto('/admin', { waitUntil: 'networkidle' });

    await expect(page.getByLabel('Owner Login ID')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('playwright-only-test-password');
    expect(bodyText).not.toContain('playwright-only-test-hmac');
    expect(bodyText).not.toContain('GitHub Synchronization Engine');

    const togglePwd = page.getByRole('button', { name: 'Show password' });
    await togglePwd.click();
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();

    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByLabel('Verified administrator email')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('Owner Login ID')).toBeVisible();

    await collectCspViolations(page, telemetry);
    expect(telemetry.cspViolations).toEqual([]);
    expect(telemetry.pageErrors).toEqual([]);
    expect(telemetry.consoleErrors).toEqual([]);
  });

  test('unknown route renders 404 recovery page without uncaught errors', async ({ page }) => {
    const telemetry = await attachTelemetry(page);
    await page.goto('/non-existent-portfolio-route-404', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Return to Overview/i })).toBeVisible();

    await collectCspViolations(page, telemetry);
    expect(telemetry.cspViolations).toEqual([]);
    expect(telemetry.pageErrors).toEqual([]);
    expect(telemetry.consoleErrors).toEqual([]);
  });

  test('AI discoverability & SEO endpoints serve intended non-HTML content and isolate /admin', async ({ request }) => {
    const llms = await request.get('/llms.txt');
    expect(llms.status()).toBe(200);
    expect(llms.headers()['content-type']).toContain('text/plain');
    const llmsBody = await llms.text();
    expect(llmsBody.startsWith('# ')).toBe(true);
    expect(llmsBody).not.toContain('<!DOCTYPE');
    expect(llmsBody).not.toContain('/admin');

    for (const jsonPath of ['/ai-catalog.json', '/.well-known/ard.json', '/.well-known/ai-catalog.json']) {
      const res = await request.get(jsonPath);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/json');
      const raw = await res.text();
      expect(raw).not.toContain('<!DOCTYPE');
      expect(raw).not.toContain('/admin');
      const doc = JSON.parse(raw);
      expect(doc.specVersion).toBe('1.0');
    }

    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('Disallow: /admin');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).not.toContain('/admin');
  });
});

test.describe('WCAG 2.2 AA Automated Accessibility (axe-core)', () => {
  test.use({ bypassCSP: true });

  for (const route of CORE_ROUTES) {
    test(`axe-core reports zero WCAG 2.0/2.1/2.2 A/AA violations on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.addScriptTag({ path: AXE_PATH });

      const results = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: any }).axe;
        return axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
          }
        });
      });

      expect(results.violations, `Accessibility violations on ${route}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
    });
  }
});
