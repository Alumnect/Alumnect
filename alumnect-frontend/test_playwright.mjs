import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });
  page.on('pageerror', err => {
    console.error(`BROWSER ERROR:`, err);
  });
  
  console.log("Navigating to Feed Page...");
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' });
  
  console.log("Wait for posts to load...");
  await page.waitForTimeout(2000);
  
  console.log("Clicking 'Hiring' tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const hiringBtn = buttons.find(b => b.textContent.includes('Hiring'));
    if (hiringBtn) hiringBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log("Clicking 'All' tab...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const allBtn = buttons.find(b => b.textContent === 'All');
    if (allBtn) allBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log("Done.");
  await browser.close();
})();
