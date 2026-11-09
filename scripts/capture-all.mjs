import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 4173;
const DIST = path.resolve('dist');
const OUTPUT_DIR = path.resolve('public/current-previews');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple SPA static server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(DIST, parsedUrl.pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Preview server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const routes = [
    { name: 'home', path: '/' },
    { name: 'work', path: '/work' },
    { name: 'evidence', path: '/evidence' },
    { name: 'archive', path: '/archive' },
    { name: 'recruiter-brief', path: '/recruiter-brief' },
    { name: 'academics', path: '/academics' },
    { name: 'contact', path: '/contact' },
    { name: 'resume', path: '/resume' },
    { name: 'admin', path: '/admin' }
  ];

  const viewports = [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'mobile', width: 390, height: 844 }
  ];

  const page = await browser.newPage();

  for (const route of routes) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      const url = `http://localhost:${PORT}${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, 600)); // wait for layout stabilization

      const fileName = `${route.name}-${vp.label}.png`;
      const outPath = path.join(OUTPUT_DIR, fileName);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Captured ${fileName}`);
    }
  }

  await browser.close();
  server.close();
  console.log('Capture finished successfully.');
}

run().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
