import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 950 });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  
  // Measure container width
  const containerWidth = await page.evaluate(() => {
    const el = document.querySelector('.site-container');
    return el ? el.getBoundingClientRect().width : null;
  });

  console.log(`[BEFORE] Viewport: 1536px, Container Width: ${containerWidth}px`);
  await page.screenshot({ path: 'public/screenshot-home-1536-before.png' });
  console.log('Saved screenshot-home-1536-before.png');

  await browser.close();
}

run().catch(console.error);
