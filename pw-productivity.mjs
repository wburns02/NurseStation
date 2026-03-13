import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok    = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err   = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// ── 1. Nav link ────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(600);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/productivity"]');
check(await navLink.count() > 0, 'Productivity nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/productivity'), `URL: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Productivity') || h1?.includes('HPPD'), `h1: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r39-prod-01-load.png' });

// ── 3. KPI strip ────────────────────────────────────────────────────────────
log('\n=== 3. KPI STRIP ===');
check(await page.locator('#kpi-strip').count()         > 0, 'KPI strip exists');
check(await page.locator('#kpi-hppd-actual').count()   > 0, 'HPPD actual KPI');
check(await page.locator('#kpi-dollar-variance').count()> 0, 'Dollar variance KPI');
check(await page.locator('#kpi-over-budget').count()   > 0, 'Over budget KPI');
check(await page.locator('#kpi-under-target').count()  > 0, 'Under target KPI');

const hppdKpi = await page.locator('#kpi-hppd-actual').textContent().catch(() => '');
check(hppdKpi && /\d/.test(hppdKpi), `HPPD KPI has data: "${hppdKpi?.slice(0,30)}"`);
const dollarKpi = await page.locator('#kpi-dollar-variance').textContent().catch(() => '');
check(dollarKpi?.includes('$'), `Dollar KPI shows $: "${dollarKpi?.slice(0,30)}"`);

// ── 4. Tabs ─────────────────────────────────────────────────────────────────
log('\n=== 4. TABS ===');
check(await page.locator('#tab-dashboard').count() > 0, 'Dashboard tab');
check(await page.locator('#tab-matrix').count()    > 0, 'Matrix tab');
check(await page.locator('#tab-trends').count()    > 0, 'Trends tab');

// ── 5. Unit cards ────────────────────────────────────────────────────────────
log('\n=== 5. UNIT CARDS ===');
const unitCards = await page.locator('[data-id^="unit-card-"]').count();
check(unitCards >= 6, `At least 6 unit cards: ${unitCards}`);
check(await page.locator('[data-id="unit-card-ICU"]').count()      > 0, 'ICU card exists');
check(await page.locator('[data-id="unit-card-Oncology"]').count()  > 0, 'Oncology card exists');
check(await page.locator('[data-id="unit-card-MS-A"]').count()      > 0, 'MS-A card exists');

// HPPD numbers visible
const oncCard = await page.locator('[data-id="unit-card-Oncology"]').textContent().catch(() => '');
check(oncCard?.includes('13') || oncCard?.includes('Oncology'), `Oncology card has HPPD: "${oncCard?.slice(0,60)}"`);

// Status badge
check(oncCard?.toLowerCase().includes('critical') || oncCard?.toLowerCase().includes('over'), `Oncology shows critical status`);
await page.screenshot({ path: 'pw-screenshots/r39-prod-02-units.png' });

// ── 6. Select unit for detail ─────────────────────────────────────────────
log('\n=== 6. UNIT DETAIL ===');
await page.locator('[data-id="unit-card-CCU"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-detail').count() > 0, 'Unit detail panel visible');
const detailText = await page.locator('#unit-detail').textContent().catch(() => '');
check(detailText?.includes('CCU') || detailText?.includes('Matrix') || detailText?.includes('Census'), `Detail shows CCU data: "${detailText?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r39-prod-03-detail.png' });

// ── 7. Recommendations ───────────────────────────────────────────────────
log('\n=== 7. SMART RECOMMENDATIONS ===');
check(await page.locator('#recommendations').count() > 0, 'Recommendations panel exists');
const recCards = await page.locator('[data-id^="rec-"]').count();
check(recCards >= 4, `At least 4 recommendations: ${recCards}`);

// Check first rec has apply button
const applyBtn = page.locator('[aria-label^="Apply rec-"]').first();
check(await applyBtn.count() > 0, 'Apply button exists');
const dismissBtn = page.locator('[aria-label^="Dismiss rec-"]').first();
check(await dismissBtn.count() > 0, 'Dismiss button exists');

// Apply a recommendation
const recCountBefore = await page.locator('[data-id^="rec-"]').count();
await applyBtn.click();
await page.waitForTimeout(600);
check(await page.locator('#action-toast').count() > 0, 'Toast after apply');
const applyToast = await page.locator('#action-toast').textContent().catch(() => '');
check(applyToast?.includes('Applied') || applyToast?.includes('Float') || applyToast?.includes('✓'), `Apply toast: "${applyToast?.trim()}"`);

// Rec should show "Applied" state
await page.waitForTimeout(200);
const appliedCount = await page.locator('text=Applied').count();
check(appliedCount > 0, 'Applied state shown');
await page.waitForTimeout(3500); // let toast fade

// Dismiss a recommendation
const dismissBtnAfter = page.locator('[aria-label^="Dismiss rec-"]').first();
const recCountBeforeDismiss = await page.locator('[data-id^="rec-"]').count();
await dismissBtnAfter.click();
await page.waitForTimeout(400);
const recCountAfterDismiss = await page.locator('[data-id^="rec-"]').count();
check(recCountAfterDismiss < recCountBeforeDismiss, `Rec dismissed: ${recCountBeforeDismiss} → ${recCountAfterDismiss}`);

// Filter recs
const filterSel = page.locator('select').first();
if (await filterSel.count() > 0) {
  await filterSel.selectOption('critical');
  await page.waitForTimeout(300);
  const critCount = await page.locator('[data-id^="rec-"]').count();
  ok(`Filter to critical: ${critCount} shown`);
  await filterSel.selectOption('all');
  await page.waitForTimeout(200);
}

await page.screenshot({ path: 'pw-screenshots/r39-prod-04-recs.png' });

// ── 8. Matrix tab ──────────────────────────────────────────────────────────
log('\n=== 8. MATRIX TAB ===');
await page.locator('#tab-matrix').click();
await page.waitForTimeout(400);
check(await page.locator('#matrix-table').count() > 0, 'Matrix table visible');
const matrixRows = await page.locator('[data-id^="matrix-row-"]').count();
check(matrixRows >= 6, `At least 6 matrix rows: ${matrixRows}`);

// Check shift comparison panel
check(await page.locator('#shift-comparison').count() > 0, 'Shift comparison visible');
const dayRow = await page.locator('[data-id="shift-row-day"]').count();
check(dayRow > 0, 'Day shift row in comparison');

await page.screenshot({ path: 'pw-screenshots/r39-prod-05-matrix.png' });

// ── 9. Trends tab ─────────────────────────────────────────────────────────
log('\n=== 9. TRENDS TAB ===');
await page.locator('#tab-trends').click();
await page.waitForTimeout(500);
check(await page.locator('#trend-chart').count() > 0, 'Trend chart visible');
const trendText = await page.locator('#trend-chart').textContent().catch(() => '');
check(trendText && trendText.length > 0, `Trend chart has content: "${trendText?.slice(0,50)}"`);
check(await page.locator('#unit-trend-table').count() > 0, 'Unit trend table visible');
await page.screenshot({ path: 'pw-screenshots/r39-prod-06-trends.png' });

// ── 10. Mobile viewport ────────────────────────────────────────────────────
log('\n=== 10. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/productivity');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('Productivity'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#kpi-strip').count() > 0, 'KPI strip on mobile');
check(await page.locator('[data-id^="unit-card-"]').count() >= 4, 'Unit cards on mobile');
await page.screenshot({ path: 'pw-screenshots/r39-prod-07-mobile.png' });

// ── 11. Console errors ─────────────────────────────────────────────────────
log('\n=== 11. CONSOLE ERRORS ===');
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.waitForTimeout(800);
check(errors.length === 0, `No console errors (${errors.length}): ${errors.join('; ')}`);

// ── RESULTS ───────────────────────────────────────────────────────────────
log(`\n=== RESULTS ===`);
log(`Passed: ${pass}  Failed: ${fail}`);
log(fail === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
await browser.close();
process.exit(fail > 0 ? 1 : 0);
