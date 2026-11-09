import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  console.log('[SCREENSHOT] Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pagesToCapture = [
    { name: 'work', path: '/work' },
    { name: 'evidence', path: '/evidence' },
    { name: 'recruiter-brief', path: '/recruiter-brief' },
    { name: 'academics', path: '/academics' },
    { name: 'resume', path: '/resume' },
    { name: 'contact', path: '/contact' }
  ];

  for (const item of pagesToCapture) {
    // 1440px desktop
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await pageDesktop.goto(`http://localhost:3000${item.path}`, { waitUntil: 'networkidle0' });
    
    // Check container width
    const containerWidth = await pageDesktop.evaluate(() => {
      const el = document.querySelector('.site-container');
      return el ? Math.round(el.getBoundingClientRect().width) : null;
    });

    const fileDesktop = path.resolve(__dirname, `../public/screenshot-${item.name}-1440.png`);
    await pageDesktop.screenshot({ path: fileDesktop });
    console.log(`[1440px Desktop] ${item.path} captured. Container width: ${containerWidth}px (Target: ~1324px at 1440px) -> ${fileDesktop}`);
    await pageDesktop.close();

    // 390px mobile
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await pageMobile.goto(`http://localhost:3000${item.path}`, { waitUntil: 'networkidle0' });
    
    const mobileWidth = await pageMobile.evaluate(() => {
      const el = document.querySelector('.site-container');
      return el ? Math.round(el.getBoundingClientRect().width) : null;
    });

    const fileMobile = path.resolve(__dirname, `../public/screenshot-${item.name}-390.png`);
    await pageMobile.screenshot({ path: fileMobile });
    console.log(`[390px Mobile] ${item.path} captured. Container width: ${mobileWidth}px (Target: 350px at 390px) -> ${fileMobile}`);
    await pageMobile.close();
  }

  await browser.close();
  console.log('[SCREENSHOT] All responsive captures successfully saved in public/');
}

capture().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
