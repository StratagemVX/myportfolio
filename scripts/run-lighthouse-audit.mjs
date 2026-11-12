import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { startProductionPreviewServer } from './serve-production-preview.mjs';

const ROUTES = ['/', '/work', '/archive', '/evidence', '/contact', '/admin'];
const RUNS_PER_ROUTE = Number(process.env.LH_RUNS || 3);
const PORT = Number(process.env.LH_PORT || 4174);
const OUT_DIR = path.resolve('.lighthouse-results');

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function round(val, decimals = 3) {
  if (val === null || val === undefined || Number.isNaN(val)) return null;
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function runLighthouseCli(url, formFactor, debugPort) {
  return new Promise((resolve, reject) => {
    const args = [
      '--yes',
      'lighthouse',
      url,
      `--port=${debugPort}`,
      '--output=json',
      '--output-path=stdout',
      '--quiet',
      '--only-categories=performance,accessibility,best-practices,seo'
    ];
    if (formFactor === 'desktop') {
      args.push('--preset=desktop');
    }

    const child = spawn('npx', args, {
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      if (code !== 0 || !stdout.trim()) {
        reject(new Error(`Lighthouse exited with ${code} on ${url} (${formFactor}): ${stderr}`));
        return;
      }
      try {
        const jsonStart = stdout.indexOf('{');
        const lhr = JSON.parse(stdout.slice(jsonStart));
        const a11yAuditIds = new Set(
          (lhr.categories?.accessibility?.auditRefs || [])
            .filter((r) => r.weight > 0)
            .map((r) => r.id)
        );

        resolve({
          lighthouseVersion: lhr.lighthouseVersion,
          userAgent: lhr.userAgent,
          fetchTime: lhr.fetchTime,
          scores: {
            performance: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
            accessibility: Math.round((lhr.categories?.accessibility?.score ?? 0) * 100),
            bestPractices: Math.round((lhr.categories?.['best-practices']?.score ?? 0) * 100),
            seo: Math.round((lhr.categories?.seo?.score ?? 0) * 100)
          },
          metrics: {
            lcpMs: round(lhr.audits?.['largest-contentful-paint']?.numericValue, 0),
            cls: round(lhr.audits?.['cumulative-layout-shift']?.numericValue, 4),
            tbtMs: round(lhr.audits?.['total-blocking-time']?.numericValue, 0),
            fcpMs: round(lhr.audits?.['first-contentful-paint']?.numericValue, 0)
          },
          a11yFailingAudits: Object.values(lhr.audits || {})
            .filter((a) => a11yAuditIds.has(a.id) && a.score !== null && a.score < 1)
            .map((a) => ({ id: a.id, title: a.title, score: a.score }))
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function waitForDevTools(port, chromeProc, getStderr, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (chromeProc.exitCode !== null) {
      throw new Error(`Chrome exited prematurely (${chromeProc.exitCode}): ${getStderr()}`);
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // Retry until DevTools HTTP endpoint binds
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for Chrome DevTools on port ${port}: ${getStderr()}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lighthouse-only-test-password-2026!';
  process.env.SECURITY_HMAC_KEY =
    process.env.SECURITY_HMAC_KEY ||
    'lighthouse-only-test-hmac-key-never-use-in-prod-32bytes';

  const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const server = await startProductionPreviewServer(PORT);

  const candidates = [
    process.env.CHROME_PATH,
    chromium.executablePath(),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ].filter(Boolean);
  const executablePath = candidates.find((p) => fs.existsSync(p));
  if (!executablePath) {
    throw new Error(`No Chrome/Chromium executable found. Checked: ${candidates.join(', ')}`);
  }

  const debugPort = Number(process.env.LH_CHROME_PORT || 9229);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-chrome-'));
  const chromeFlags = [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${debugPort}`,
    'about:blank'
  ];

  let chromeStderr = '';
  const chromeProc = spawn(executablePath, chromeFlags, {
    stdio: ['ignore', 'ignore', 'pipe']
  });
  chromeProc.stderr.on('data', (chunk) => {
    chromeStderr += chunk.toString();
  });

  const report = {
    generatedAtUtc: new Date().toISOString(),
    commitSha,
    runsPerFormFactor: RUNS_PER_ROUTE,
    baseUrl: `http://127.0.0.1:${PORT}`,
    environment: {
      nodeVersion: process.version,
      executablePath,
      chromeFlags: chromeFlags.filter((f) => !f.startsWith('--user-data-dir='))
    },
    routes: {}
  };

  try {
    await waitForDevTools(debugPort, chromeProc, () => chromeStderr);
    for (const route of ROUTES) {
      report.routes[route] = {};
      for (const formFactor of ['desktop', 'mobile']) {
        const runs = [];
        for (let i = 0; i < RUNS_PER_ROUTE; i++) {
          const single = await runLighthouseCli(`http://127.0.0.1:${PORT}${route}`, formFactor, debugPort);
          runs.push(single);
        }

        report.routes[route][formFactor] = {
          medians: {
            performance: round(median(runs.map((r) => r.scores.performance)), 1),
            accessibility: round(median(runs.map((r) => r.scores.accessibility)), 1),
            bestPractices: round(median(runs.map((r) => r.scores.bestPractices)), 1),
            seo: round(median(runs.map((r) => r.scores.seo)), 1),
            lcpMs: round(median(runs.map((r) => r.metrics.lcpMs)), 0),
            cls: round(median(runs.map((r) => r.metrics.cls)), 4),
            tbtMs: round(median(runs.map((r) => r.metrics.tbtMs)), 0)
          },
          runs
        };
        const m = report.routes[route][formFactor].medians;
        console.log(
          `[LH ${formFactor.padEnd(7)}] ${route.padEnd(10)} Perf:${m.performance} A11y:${m.accessibility} BP:${m.bestPractices} SEO:${m.seo} LCP:${m.lcpMs}ms CLS:${m.cls} TBT:${m.tbtMs}ms`
        );
      }
    }
  } finally {
    if (chromeProc.exitCode === null) {
      chromeProc.kill('SIGTERM');
      await new Promise((resolve) => {
        const t = setTimeout(() => {
          if (chromeProc.exitCode === null) chromeProc.kill('SIGKILL');
          resolve();
        }, 3000);
        chromeProc.once('exit', () => {
          clearTimeout(t);
          resolve();
        });
      });
    }
    fs.rmSync(userDataDir, { recursive: true, force: true });
    await new Promise((resolve) => server.close(resolve));
  }

  const outFile = path.join(OUT_DIR, 'lighthouse-summary.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Saved Lighthouse report to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
