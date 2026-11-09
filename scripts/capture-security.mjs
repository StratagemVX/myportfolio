import puppeteer from 'puppeteer-core';
import { computeTOTP } from '../server/cryptoUtils.ts';
import fs from 'node:fs';

const stateFile = './server/security-state.json';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Capture Security Gate
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'public/screenshot-admin-gate-1440.png' });
  console.log('Saved screenshot-admin-gate-1440.png');

  // Submit primary login
  await page.type('input[type="password"]', 'chethan-admin');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 800));

  // 2. Capture MFA Challenge Screen
  await page.screenshot({ path: 'public/screenshot-admin-mfa-1440.png' });
  console.log('Saved screenshot-admin-mfa-1440.png');

  // Read current TOTP secret from state file
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  const currentOtp = computeTOTP(state.owner.totpSecret);
  console.log('Computed current TOTP:', currentOtp);

  // Type OTP
  await page.type('input[placeholder="123456"]', currentOtp);
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  // 3. Capture Account & Security Center (Owner Profile / Tab 1)
  await page.screenshot({ path: 'public/screenshot-account-security-1440.png' });
  console.log('Saved screenshot-account-security-1440.png');

  // Click Private Recruiter Access tab
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Private Recruiter Access')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'public/screenshot-admin-recruiter-1440.png' });
  console.log('Saved screenshot-admin-recruiter-1440.png');

  // Click Integration Matrix tab
  const buttons2 = await page.$$('button');
  for (const b of buttons2) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Integration Matrix')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'public/screenshot-admin-integrations-1440.png' });
  console.log('Saved screenshot-admin-integrations-1440.png');

  await browser.close();
  console.log('All admin screenshots successfully captured.');
}

capture().catch(err => console.error('Screenshot script error:', err));
