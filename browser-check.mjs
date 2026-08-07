import { chromium } from 'playwright';

const OUT = process.env.SHOTS;
const WIDTHS = [1280, 1440];
const BASE = 'http://localhost:4173';

/** Navigate by CLICKING, because a full page load resets the demo session. */
const TARGETS = [
  { name: 'dashboard', group: null, link: 'Dashboard', expect: 'Case Activity Per Week' },
  { name: 'case-management', group: 'Case admin', link: 'Case management', expect: 'Rows per page' },
  { name: 'rule-groups', group: 'Rules', link: 'Rule groups', expect: 'Rules & execution order' },
  { name: 'bulk-actions', group: 'Rules', link: 'Bulk actions', expect: 'Bulk actions' },
  { name: 'rule-check', group: 'Rules', link: 'Rule check', expect: 'No rule selected' },
  { name: 'queue-management', group: 'Case admin', link: 'Queue management', expect: 'Cases in queue' },
  { name: 'upload-cases', group: 'Case admin', link: 'Upload cases', expect: 'Expected columns' },
  { name: 'work-case', group: null, link: 'Work case', expect: 'workable case' },
  { name: 'reports-center', group: 'Reports', link: 'Reports center', expect: 'Entity Case Totals' },
  { name: 'monitoring', group: 'Reports', link: 'Monitoring', expect: 'Dispute outcomes' },
  { name: 'custom-reports', group: 'Reports', link: 'Custom reports', expect: 'Row count' },
  { name: 'users', group: null, link: 'Users', expect: 'User management' },
  { name: 'api-docs', group: null, link: 'API documentation', expect: 'Response schema' },
  { name: 'system-preferences', group: 'Settings', link: 'System preferences', expect: 'Internal buffer' },
  { name: 'help', group: null, link: 'Help', expect: 'Frequently asked' },
];

const overflowProbe = () => ({
  docW: document.documentElement.scrollWidth,
  winW: window.innerWidth,
  text: document.body.innerText.length,
  widest: (() => {
    let worst = null;
    for (const el of document.querySelectorAll('main *, .builder *')) {
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth + 2) {
        let p = el.parentElement, scrollable = false;
        while (p) { const s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowX)) { scrollable = true; break; } p = p.parentElement; }
        if (!scrollable && (!worst || r.width > worst.w)) worst = { w: Math.round(r.width), tag: el.tagName, cls: String(el.className).slice(0, 36) };
      }
    }
    return worst;
  })(),
});

const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[autocomplete="username"]', 'PriceLine');
  await page.fill('input[autocomplete="current-password"]', 'Changeme123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Case Activity Per Week', { timeout: 15000 });

  console.log(`\n=== ${width}px ===`);

  for (const t of TARGETS) {
    if (t.group) {
      const groupBtn = page.locator('.rail__group-btn', { hasText: t.group });
      const childLink = page.locator('.rail__child', { hasText: t.link });
      if (!(await childLink.isVisible().catch(() => false))) await groupBtn.first().click();
      await childLink.first().click();
    } else {
      await page.locator('.rail__link', { hasText: t.link }).first().click();
    }

    let found = true;
    try { await page.waitForSelector(`text=${t.expect}`, { timeout: 8000 }); }
    catch { found = false; }

    await page.waitForTimeout(300);
    const m = await page.evaluate(overflowProbe);
    const overflow = m.docW > m.winW + 1 || Boolean(m.widest);
    const bad = !found || overflow;
    if (bad) problems++;

    console.log(`  ${bad ? 'PROBLEM' : 'ok     '} ${t.name.padEnd(19)} text=${String(m.text).padStart(5)} doc=${m.docW}${!found ? ` MISSING "${t.expect}"` : ''}${m.widest ? ` OVERFLOW ${m.widest.tag}.${m.widest.cls}=${m.widest.w}px` : ''}`);

    if (OUT) await page.screenshot({ path: `${OUT}/${t.name}-${width}.png` });
  }

  // Work case detail — deep content, reached by clicking a row action.
  await page.locator('.rail__link', { hasText: 'Work case' }).first().click();
  await page.waitForSelector('text=workable case');
  await page.locator('table tbody tr').first().click();
  await page.waitForSelector('text=Case details', { timeout: 8000 });
  await page.locator('.tab', { hasText: 'Related cases' }).click();
  await page.waitForTimeout(400);
  const detail = await page.evaluate(overflowProbe);
  const hasConsolidation = await page.locator('text=Work all').count() > 0;
  const detailBad = detail.docW > detail.winW + 1 || Boolean(detail.widest);
  if (detailBad) problems++;
  console.log(`  ${detailBad ? 'PROBLEM' : 'ok     '} ${'work-case-detail'.padEnd(19)} text=${String(detail.text).padStart(5)} doc=${detail.docW} consolidation=${hasConsolidation}${detail.widest ? ` OVERFLOW ${detail.widest.tag}=${detail.widest.w}px` : ''}`);
  if (OUT) await page.screenshot({ path: `${OUT}/work-case-detail-${width}.png` });

  const real = errors.filter((e) => !/favicon|Download the React DevTools/.test(e));
  if (real.length) { problems++; console.log(`  CONSOLE: ${[...new Set(real)].slice(0, 4).join(' | ')}`); }
  else console.log('  no console errors');

  await ctx.close();
}

await browser.close();
console.log(problems ? `\n${problems} PROBLEMS` : '\nNo layout problems at either width.');
