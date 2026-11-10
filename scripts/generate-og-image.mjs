import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

async function main() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background-color: #101114;
      color: #F0F0ED;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .card {
      width: 1120px;
      height: 550px;
      background-color: #181A1F;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 48px 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background-color: #101114;
      border: 1px solid #22252C;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #A8B8A7;
      font-family: monospace;
      font-weight: bold;
      font-size: 20px;
    }
    .name-title {
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 22px;
      font-weight: 600;
      color: #F0F0ED;
      letter-spacing: -0.02em;
    }
    .role {
      font-size: 13px;
      color: #A8B8A7;
      font-family: monospace;
      margin-top: 2px;
    }
    .badge {
      padding: 6px 14px;
      border-radius: 6px;
      background-color: #101114;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: #A4A8AE;
      font-family: monospace;
    }
    .content {
      margin-top: 10px;
    }
    .headline {
      font-size: 46px;
      font-weight: 500;
      color: #F0F0ED;
      line-height: 1.18;
      letter-spacing: -0.03em;
      max-width: 960px;
    }
    .description {
      font-size: 18px;
      color: #A4A8AE;
      line-height: 1.5;
      margin-top: 16px;
      max-width: 900px;
      font-weight: 300;
    }
    .tags {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    .tag {
      padding: 6px 12px;
      background-color: #22252C;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      font-size: 13px;
      color: #D4D6D2;
      font-family: monospace;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-family: monospace;
      font-size: 13px;
    }
    .url {
      color: #A8B8A7;
    }
    .motto {
      color: #9CA1AA;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <div class="logo">CK</div>
        <div class="name-title">
          <div class="name">Chethan Kumar B S</div>
          <div class="role">Computer Science Engineer · Bengaluru, India</div>
        </div>
      </div>
      <div class="badge">MVJCE / VTU · 2027 Batch</div>
    </div>
    <div class="content">
      <div class="headline">Building secure, distributed web systems &amp; applied AI.</div>
      <div class="description">
        Undergraduate engineer specializing in client-side cryptography (AES-256-GCM), high-concurrency microservices, and hardware-accelerated deep learning. Grounded in core Computer Science fundamentals.
      </div>
      <div class="tags">
        <span class="tag">AES-256-GCM Zero-Knowledge</span>
        <span class="tag">PyTorch CUDA 12.1</span>
        <span class="tag">SymSpell NLP</span>
        <span class="tag">WebSocket Distributed Orchestration</span>
        <span class="tag">20 Verified GitHub Repos</span>
      </div>
    </div>
    <div class="footer">
      <span class="url">https://chethan-kumar-portfolio.vercel.app</span>
      <span class="motto">Security First. Intelligence Always.</span>
    </div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  const outPath = path.resolve('public/og-image.png');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();
  console.log(`Successfully generated ${outPath} (${fs.statSync(outPath).size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
