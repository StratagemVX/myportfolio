import puppeteer from 'puppeteer-core';

const viewports = [
  { name: '1920px Desktop (Ultrawide)', width: 1920, height: 1080 },
  { name: '1536px Desktop (Primary Test)', width: 1536, height: 950 },
  { name: '1440px Desktop (Standard)', width: 1440, height: 900 },
  { name: '1024px Tablet Landscape', width: 1024, height: 768 },
  { name: '768px Tablet Portrait', width: 768, height: 1024 },
  { name: '390px Mobile', width: 390, height: 844 },
];

async function validate() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  console.log('--------------------------------------------------------------------------------');
  console.log('                    HORIZONTAL RESPONSIVE CONTAINER MEASUREMENTS               ');
  console.log('--------------------------------------------------------------------------------');
  console.log('Target Rule: width: min(calc(100% - 80px), 1680px), max-width: 1680px');
  console.log('--------------------------------------------------------------------------------');

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

    const measurements = await page.evaluate(() => {
      const container = document.querySelector('.site-container');
      const body = document.body;
      const rect = container ? container.getBoundingClientRect() : null;
      const bodyScrollWidth = body.scrollWidth;
      const windowInnerWidth = window.innerWidth;
      const hasHorizontalOverflow = bodyScrollWidth > windowInnerWidth;

      return {
        width: rect ? Math.round(rect.width) : 0,
        leftMargin: rect ? Math.round(rect.left) : 0,
        rightMargin: rect ? Math.round(windowInnerWidth - rect.right) : 0,
        percentage: rect ? ((rect.width / windowInnerWidth) * 100).toFixed(1) : 0,
        hasHorizontalOverflow
      };
    });

    console.log(
      `${vp.name.padEnd(28)} | Viewport: ${String(vp.width).padStart(4)}px | ` +
      `Container: ${String(measurements.width).padStart(4)}px (${measurements.percentage}%) | ` +
      `Margins: L ${measurements.leftMargin}px / R ${measurements.rightMargin}px | ` +
      `Overflow: ${measurements.hasHorizontalOverflow ? 'FAIL' : 'NONE'}`
    );

    // Save screenshots for the key breakpoints
    if (vp.width === 1536) {
      await page.screenshot({ path: 'public/screenshot-home-1536-after.png' });
      console.log('  -> Saved public/screenshot-home-1536-after.png');
      
      // Also test Work and Evidence at 1536px
      await page.goto('http://localhost:3000/work', { waitUntil: 'networkidle0' });
      await page.screenshot({ path: 'public/screenshot-work-1536-after.png' });
      
      await page.goto('http://localhost:3000/evidence', { waitUntil: 'networkidle0' });
      await page.screenshot({ path: 'public/screenshot-evidence-1536-after.png' });
    }
  }

  console.log('--------------------------------------------------------------------------------');
  await browser.close();
}

validate().catch(console.error);
