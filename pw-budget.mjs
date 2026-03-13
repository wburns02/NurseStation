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

// ── 1. Nav link ───────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(600);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/budget"]');
check(await navLink.count() > 0, 'Budget Intel nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(700);
}

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/budget'), `URL is /budget: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Labor Budget Intelligence'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r31-budget-01-load.png' });

// ── 3. Period selector ────────────────────────────────────────────────────────
log('\n=== 3. PERIOD SELECTOR ===');
check(await page.locator('#period-today').count() > 0, 'Today period button exists');
check(await page.locator('#period-wtd').count() > 0, 'WTD period button exists');
check(await page.locator('#period-mtd').count() > 0, 'MTD period button exists (default)');
check(await page.locator('#period-ytd').count() > 0, 'YTD period button exists');
// Click each period
await page.locator('#period-wtd').click();
await page.waitForTimeout(200);
const bodyText1 = await page.locator('body').textContent().catch(() => '');
check(bodyText1?.includes('Labor Budget Intelligence'), 'Page still shows after period switch');
await page.locator('#period-mtd').click();
await page.waitForTimeout(200);

// ── 4. Hero stats ─────────────────────────────────────────────────────────────
log('\n=== 4. HERO STATS ===');
check(await page.locator('#stat-total-budget').count() > 0, 'stat-total-budget exists');
check(await page.locator('#stat-total-spent').count() > 0, 'stat-total-spent exists');
check(await page.locator('#stat-projected').count() > 0, 'stat-projected exists');
check(await page.locator('#stat-ot-cost').count() > 0, 'stat-ot-cost exists');
const budgetText = await page.locator('#stat-total-budget').textContent().catch(() => '');
check(budgetText?.includes('$') || budgetText?.includes('k') || budgetText?.includes('M'), `Budget stat shows dollar amount: "${budgetText?.slice(0,40)}"`);
const spentText = await page.locator('#stat-total-spent').textContent().catch(() => '');
check(spentText?.includes('$') || spentText?.includes('k'), `Spent MTD shows amount: "${spentText?.slice(0,40)}"`);
const projText = await page.locator('#stat-projected').textContent().catch(() => '');
check(projText?.includes('$') || projText?.includes('k') || projText?.includes('M'), `Projected EOM shows amount: "${projText?.slice(0,40)}"`);
const otText = await page.locator('#stat-ot-cost').textContent().catch(() => '');
check(otText?.includes('$') || otText?.includes('k'), `OT cost shows amount: "${otText?.slice(0,40)}"`);

// ── 5. Burn gauge ─────────────────────────────────────────────────────────────
log('\n=== 5. BURN GAUGE ===');
check(await page.locator('#burn-gauge-card').count() > 0, 'Burn gauge card exists');
const gaugeText = await page.locator('#burn-gauge-card').textContent().catch(() => '');
check(gaugeText?.includes('%'), `Burn gauge shows percentage: "${gaugeText?.slice(0,60)}"`);
check(gaugeText?.toLowerCase().includes('march') || gaugeText?.toLowerCase().includes('projected'), 'Burn gauge shows projection text');
await page.screenshot({ path: 'pw-screenshots/r31-budget-02-gauge.png' });

// ── 6. Budget alerts ──────────────────────────────────────────────────────────
log('\n=== 6. BUDGET ALERTS ===');
const alertEd = page.locator('[data-id="alert-alert-ed-ot"]');
check(await alertEd.count() > 0, 'ED critical alert visible');
const alertEdText = await alertEd.textContent().catch(() => '');
check(alertEdText?.includes('ED'), 'ED alert mentions ED unit');
// Check for success alert (MS-A/MS-B under budget)
const alertSuccess = page.locator('[data-id="alert-alert-ms-under"]');
check(await alertSuccess.count() > 0, 'MS-A/B under-budget success alert visible');
// Action links in alerts
const actionLinks = await page.locator('[aria-label^="Alert action:"]').count();
check(actionLinks >= 2, `At least 2 alert action links: ${actionLinks}`);
await page.screenshot({ path: 'pw-screenshots/r31-budget-03-alerts.png' });

// ── 7. Unit table ─────────────────────────────────────────────────────────────
log('\n=== 7. UNIT TABLE ===');
check(await page.locator('#unit-table').count() > 0, 'Unit table exists');
check(await page.locator('[data-id="unit-row-icu"]').count() > 0, 'ICU unit row exists');
check(await page.locator('[data-id="unit-row-ccu"]').count() > 0, 'CCU unit row exists');
check(await page.locator('[data-id="unit-row-ed"]').count() > 0, 'ED unit row exists');
check(await page.locator('[data-id="unit-row-ms-a"]').count() > 0, 'MS-A unit row exists');
check(await page.locator('[data-id="unit-row-ms-b"]').count() > 0, 'MS-B unit row exists');
check(await page.locator('[data-id="unit-row-telemetry"]').count() > 0, 'Telemetry unit row exists');
const tableText = await page.locator('#unit-table').textContent().catch(() => '');
check(tableText?.includes('ICU') && tableText?.includes('ED') && tableText?.includes('CCU'), 'Unit table shows all units');
await page.screenshot({ path: 'pw-screenshots/r31-budget-04-table.png' });

// ── 8. Unit drill-down ────────────────────────────────────────────────────────
log('\n=== 8. UNIT DRILL-DOWN ===');
// Click ED row to drill down
await page.locator('[data-id="unit-row-ed"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-drill-down').count() > 0, 'Drill-down panel opened for ED');
const drillText = await page.locator('#unit-drill-down').textContent().catch(() => '');
check(drillText?.includes('ED'), 'Drill-down shows ED unit');
check(drillText?.includes('Regular Pay') || drillText?.includes('Regular'), 'Drill-down shows Regular Pay');
check(drillText?.includes('Overtime') || drillText?.includes('OT'), 'Drill-down shows Overtime');
check(drillText?.includes('HPPD'), 'Drill-down shows HPPD');
await page.screenshot({ path: 'pw-screenshots/r31-budget-05-drilldown.png' });

// Close drill-down
await page.locator('[aria-label="Close unit drill-down"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-drill-down').count() === 0, 'Drill-down closed');

// Click same row again to re-open
await page.locator('[data-id="unit-row-ed"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-drill-down').count() > 0, 'Drill-down re-opened');
// Click same row to toggle off
await page.locator('[data-id="unit-row-ed"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-drill-down').count() === 0, 'Drill-down toggle-off works');

// ── 9. Weekly chart ───────────────────────────────────────────────────────────
log('\n=== 9. WEEKLY CHART ===');
check(await page.locator('#weekly-chart').count() > 0, 'Weekly chart exists');
check(await page.locator('[data-id="weekly-bar-0"]').count() > 0, 'Weekly bar 0 exists');
check(await page.locator('[data-id="weekly-bar-1"]').count() > 0, 'Weekly bar 1 exists');
check(await page.locator('[data-id="weekly-bar-2"]').count() > 0, 'Weekly bar 2 exists');
check(await page.locator('[data-id="weekly-bar-3"]').count() > 0, 'Weekly bar 3 exists');
const chartText = await page.locator('#weekly-chart').textContent().catch(() => '');
check(chartText?.includes('Feb') || chartText?.includes('Mar'), 'Weekly chart shows dates');

// ── 10. OT leaders ────────────────────────────────────────────────────────────
log('\n=== 10. OT LEADERS ===');
check(await page.locator('#ot-leaders-list').count() > 0, 'OT leaders list exists');
check(await page.locator('[data-id="ot-leader-st-004"]').count() > 0, 'David Thompson OT leader visible');
check(await page.locator('[data-id="ot-leader-st-008"]').count() > 0, 'Kevin Park OT leader visible');
check(await page.locator('[data-id="ot-leader-st-002"]').count() > 0, 'Marcus Chen OT leader visible');
const otLeadText = await page.locator('#ot-leaders-list').textContent().catch(() => '');
check(otLeadText?.includes('David Thompson'), 'OT leaders shows David Thompson');
check(otLeadText?.includes('h'), 'OT leaders shows hours');
await page.screenshot({ path: 'pw-screenshots/r31-budget-06-ot.png' });

// ── 11. Cost breakdown ────────────────────────────────────────────────────────
log('\n=== 11. COST BREAKDOWN ===');
check(await page.locator('#cost-breakdown').count() > 0, 'Cost breakdown section exists');
check(await page.locator('[data-id="cost-item-regular"]').count() > 0, 'Regular cost item exists');
check(await page.locator('[data-id="cost-item-overtime"]').count() > 0, 'Overtime cost item exists');
check(await page.locator('[data-id="cost-item-float"]').count() > 0, 'Float cost item exists');
check(await page.locator('[data-id="cost-item-agency"]').count() > 0, 'Agency cost item exists');
const breakdownText = await page.locator('#cost-breakdown').textContent().catch(() => '');
check(breakdownText?.includes('Regular') && breakdownText?.includes('Overtime'), 'Breakdown shows cost categories');
await page.screenshot({ path: 'pw-screenshots/r31-budget-07-breakdown.png' });

// ── 12. Alert action navigation ───────────────────────────────────────────────
log('\n=== 12. ALERT ACTION LINK ===');
const firstActionLink = page.locator('[aria-label^="Alert action:"]').first();
check(await firstActionLink.count() > 0, 'Alert action link exists');
const actionText = await firstActionLink.textContent().catch(() => '');
check(actionText && actionText.length > 0, `Action link has text: "${actionText?.trim()}"`);

// ── 13. ICU drill-down data ───────────────────────────────────────────────────
log('\n=== 13. ICU DRILL-DOWN ===');
await page.locator('[data-id="unit-row-icu"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-drill-down').count() > 0, 'ICU drill-down opened');
const icuDrillText = await page.locator('#unit-drill-down').textContent().catch(() => '');
check(icuDrillText?.includes('ICU'), 'ICU drill-down shows ICU');
check(icuDrillText?.includes('HPPD'), 'ICU drill-down shows HPPD');
check(icuDrillText?.includes('Avg census'), 'ICU drill-down shows census');

// ── 14. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 14. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Labor Budget Intelligence'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#stat-total-budget').count() > 0, 'Stats visible on mobile');
check(await page.locator('#unit-table').count() > 0, 'Unit table visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r31-budget-08-mobile.png' });

// ── 15. Console errors ────────────────────────────────────────────────────────
log('\n=== 15. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/budget');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
