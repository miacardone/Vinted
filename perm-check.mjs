import { chromium } from 'playwright';
const OUT = process.env.SHOTS;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle' });
await page.fill('input[autocomplete="username"]', 'PriceLine');
await page.fill('input[autocomplete="current-password"]', 'Changeme123');
await page.click('button[type="submit"]');
await page.waitForSelector('text=Case Activity Per Week');
await page.locator('.rail__link', { hasText: 'Users' }).first().click();
await page.locator('.tab', { hasText: 'Permissions' }).click();
await page.waitForSelector('text=permissions');

for (const role of ['Admin', 'Manager', 'Dispute Specialist']) {
  await page.locator('.tab', { hasText: role }).first().click();
  await page.waitForTimeout(300);
  const stats = await page.evaluate(() => ({
    granted: document.querySelectorAll('.perm-row--granted').length,
    denied: document.querySelectorAll('.perm-row--denied').length,
    togglesInGranted: document.querySelectorAll('.perm-row--granted .toggle').length,
    togglesInDenied: document.querySelectorAll('.perm-row--denied .toggle').length,
    header: document.querySelector('.card__head')?.innerText.replace(/\n/g, ' '),
  }));
  const ok = stats.togglesInDenied === 0 && stats.togglesInGranted === stats.granted;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${role.padEnd(20)} granted=${stats.granted} denied=${stats.denied} togglesInGranted=${stats.togglesInGranted} togglesInDenied=${stats.togglesInDenied} | ${stats.header}`);
  if (OUT && role === 'Manager') await page.screenshot({ path: `${OUT}/permissions-manager.png` });
}
await browser.close();
