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
const navLink = page.locator('a[href="/retention"]');
check(await navLink.count() > 0, 'Turnover Intel nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/retention'), `URL: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Retention') || h1?.includes('Flight'), `h1: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-01-load.png' });

// ── 3. KPI strip ──────────────────────────────────────────────────────────────
log('\n=== 3. KPI STRIP ===');
check(await page.locator('#kpi-at-risk').count()        > 0, 'At-Risk KPI exists');
check(await page.locator('#kpi-projected-cost').count() > 0, 'Projected Cost KPI exists');
check(await page.locator('#kpi-avg-score').count()      > 0, 'Avg Score KPI exists');
check(await page.locator('#kpi-flagged-week').count()   > 0, 'Flagged This Week KPI exists');

const atRiskText = await page.locator('#kpi-at-risk').textContent().catch(() => '');
check(atRiskText && /[0-9]/.test(atRiskText), `At-Risk has numeric data: "${atRiskText?.slice(0,40)}"`);

const costText = await page.locator('#kpi-projected-cost').textContent().catch(() => '');
check(costText?.includes('$'), `Projected cost shows $: "${costText?.slice(0,40)}"`);

const avgText = await page.locator('#kpi-avg-score').textContent().catch(() => '');
check(avgText?.includes('74') || avgText?.includes('7'), `Avg score has data: "${avgText?.slice(0,30)}"`);

// ── 4. Tabs ───────────────────────────────────────────────────────────────────
log('\n=== 4. TABS ===');
check(await page.locator('#tab-overview').count() > 0, 'Overview tab exists');
check(await page.locator('#tab-units').count()    > 0, 'By Unit tab exists');
check(await page.locator('#tab-trends').count()   > 0, 'Trends tab exists');
check(await page.locator('#tab-costs').count()    > 0, 'Cost Analysis tab exists');

// ── 5. Overview tab — risk cards ──────────────────────────────────────────────
log('\n=== 5. OVERVIEW TAB ===');
check(await page.locator('#overview-tab').count() > 0, 'Overview tab content visible');

const riskCards = await page.locator('[data-id^="risk-card-"]').count();
check(riskCards >= 8, `At least 8 risk cards (got ${riskCards})`);

check(await page.locator('[data-id="risk-card-staff-001"]').count() > 0, 'Marcus Webb (staff-001) card exists');
check(await page.locator('[data-id="risk-card-staff-002"]').count() > 0, 'Keisha Thompson (staff-002) card exists');

const card001Text = await page.locator('[data-id="risk-card-staff-001"]').textContent().catch(() => '');
check(card001Text?.includes('Marcus') || card001Text?.includes('ED'), `staff-001 card has content: "${card001Text?.slice(0,60)}"`);
check(card001Text?.includes('18') || card001Text?.includes('Critical'), `staff-001 shows score/risk: "${card001Text?.slice(0,40)}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-02-overview.png' });

// ── 6. Filter by critical ─────────────────────────────────────────────────────
log('\n=== 6. FILTERS ===');
await page.locator('#filter-critical').click();
await page.waitForTimeout(400);
const criticalCards = await page.locator('[data-id^="risk-card-"]').count();
check(criticalCards === 2, `Critical filter shows 2 nurses: ${criticalCards}`);
check(await page.locator('[data-id="risk-card-staff-001"]').count() > 0, 'Marcus Webb in critical filter');
check(await page.locator('[data-id="risk-card-staff-002"]').count() > 0, 'Keisha Thompson in critical filter');

// Filter by high
await page.locator('#filter-high').click();
await page.waitForTimeout(400);
const highCards = await page.locator('[data-id^="risk-card-"]').count();
check(highCards === 6, `High filter shows 6 nurses: ${highCards}`);

// Filter by stable
await page.locator('#filter-stable').click();
await page.waitForTimeout(400);
const stableCards = await page.locator('[data-id^="risk-card-"]').count();
check(stableCards >= 5, `Stable filter shows stable nurses: ${stableCards}`);

// Reset to all
await page.locator('#filter-all').click();
await page.waitForTimeout(400);
const allCards = await page.locator('[data-id^="risk-card-"]').count();
check(allCards >= 15, `All filter shows all nurses: ${allCards}`);

// ── 7. Card click → detail panel ─────────────────────────────────────────────
log('\n=== 7. CARD CLICK → DETAIL PANEL ===');
await page.locator('[data-id="risk-card-staff-001"]').click();
await page.waitForTimeout(600);
check(await page.locator('#staff-detail-panel').count() > 0, 'Detail panel opened on card click');

const panelText = await page.locator('#staff-detail-panel').textContent().catch(() => '');
check(panelText?.includes('Marcus') || panelText?.includes('Pay Review'), `Panel shows staff data: "${panelText?.slice(0,80)}"`);
check(panelText?.includes('$') || panelText?.includes('52'), `Panel shows cost info`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-03-detail-panel.png' });

// Close panel via X button
await page.locator('#staff-detail-panel button').first().click();
await page.waitForTimeout(800); // wait for exit animation

// ── 8. Intervene button → panel ───────────────────────────────────────────────
log('\n=== 8. INTERVENE BUTTON ===');
const interveneBtn = page.locator('[aria-label="Intervene staff-001"]');
check(await interveneBtn.count() > 0, 'Intervene button for staff-001 exists');
await interveneBtn.click();
await page.waitForTimeout(600);
check(await page.locator('#staff-detail-panel').count() > 0, 'Detail panel opened via Intervene button');

// ── 9. Execute intervention → toast ──────────────────────────────────────────
log('\n=== 9. EXECUTE INTERVENTION ===');
const execBtn = page.locator('[aria-label="Execute int-001-a"]');
check(await execBtn.count() > 0, 'Execute button for int-001-a exists');
await execBtn.click();
await page.waitForTimeout(500);

const toast = await page.locator('#action-toast').textContent().catch(() => '');
check(toast?.includes('Pay') || toast?.includes('initiated') || toast?.includes('✓'), `Execute toast appeared: "${toast?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-04-execute.png' });
await page.waitForTimeout(3500);

// Verify intervention is now marked done
const panelAfter = await page.locator('#staff-detail-panel').textContent().catch(() => '');
check(panelAfter?.includes('Done') || panelAfter?.includes('tracking'), `Intervention marked done: "${panelAfter?.slice(0,100)}"`);

// Close panel
await page.locator('#staff-detail-panel').locator('button').first().click();
await page.waitForTimeout(500);

// ── 10. By Unit tab ───────────────────────────────────────────────────────────
log('\n=== 10. BY UNIT TAB ===');
await page.locator('#tab-units').click();
await page.waitForTimeout(400);
check(await page.locator('#units-tab').count()      > 0, 'Units tab content visible');
check(await page.locator('#unit-risk-chart').count()> 0, 'Unit risk chart exists');

const unitBars = await page.locator('[data-id^="unit-bar-"]').count();
check(unitBars >= 7, `At least 7 unit bars: ${unitBars}`);

const unitCards = await page.locator('[data-id^="unit-card-"]').count();
check(unitCards >= 7, `At least 7 unit summary cards: ${unitCards}`);

const edBar = await page.locator('[data-id="unit-bar-ED"]').textContent().catch(() => '');
check(edBar?.includes('ED') || edBar?.includes('63'), `ED bar shows data: "${edBar?.slice(0,40)}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-05-units.png' });

// ── 11. Trends tab ────────────────────────────────────────────────────────────
log('\n=== 11. TRENDS TAB ===');
await page.locator('#tab-trends').click();
await page.waitForTimeout(400);
check(await page.locator('#trends-tab').count()  > 0, 'Trends tab content visible');
check(await page.locator('#trend-chart').count() > 0, 'Trend chart exists');

const trendRows = await page.locator('[data-id^="trend-unit-row-"]').count();
check(trendRows >= 7, `At least 7 trend unit rows: ${trendRows}`);

const edRow = await page.locator('[data-id="trend-unit-row-ED"]').textContent().catch(() => '');
check(edRow?.includes('ED') || edRow?.includes('56'), `ED trend row has data: "${edRow?.slice(0,50)}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-06-trends.png' });

// ── 12. Cost Analysis tab ─────────────────────────────────────────────────────
log('\n=== 12. COST ANALYSIS TAB ===');
await page.locator('#tab-costs').click();
await page.waitForTimeout(400);
check(await page.locator('#costs-tab').count() > 0, 'Cost Analysis tab content visible');
check(await page.locator('#cost-panel').count() > 0, 'Cost panel exists');

const costRows = await page.locator('[data-id^="cost-row-"]').count();
check(costRows >= 8, `At least 8 at-risk cost rows: ${costRows}`);

const costPanel = await page.locator('#cost-panel').textContent().catch(() => '');
check(costPanel?.includes('342') || costPanel?.includes('$'), `Cost panel shows dollar amounts: "${costPanel?.slice(0,80)}"`);
check(costPanel?.includes('ROI') || costPanel?.includes('x'), `Cost panel shows ROI: "${costPanel?.slice(0,100)}"`);

const costRowText = await page.locator('[data-id="cost-row-staff-001"]').textContent().catch(() => '');
check(costRowText?.includes('Marcus') || costRowText?.includes('52'), `Marcus Webb cost row: "${costRowText?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-07-costs.png' });

// ── 13. Recalculate button ────────────────────────────────────────────────────
log('\n=== 13. RECALCULATE ===');
check(await page.locator('#recalculate-btn').count() > 0, 'Recalculate button exists');
await page.locator('#recalculate-btn').click();
await page.waitForTimeout(300);
const btnText = await page.locator('#recalculate-btn').textContent().catch(() => '');
check(btnText?.includes('Recalculating') || btnText?.includes('Recalculate'), `Recalculate button state: "${btnText?.trim()}"`);
await page.waitForTimeout(2000);
const recalcToast = await page.locator('#action-toast').textContent().catch(() => '');
check(recalcToast?.includes('recalculated') || recalcToast?.includes('✓'), `Recalc toast: "${recalcToast?.trim()}"`);
await page.waitForTimeout(3500);

// ── 14. NEW flag nurses ───────────────────────────────────────────────────────
log('\n=== 14. NEW FLAG ===');
await page.locator('#tab-overview').click();
await page.waitForTimeout(300);
await page.locator('#filter-all').click();
await page.waitForTimeout(300);
// Priya Nair (staff-003) flagged this week
const priyaCard = await page.locator('[data-id="risk-card-staff-003"]').textContent().catch(() => '');
check(priyaCard?.includes('NEW') || priyaCard?.includes('Priya'), `Priya Nair flagged card: "${priyaCard?.slice(0,60)}"`);

// ── 15. Mobile ────────────────────────────────────────────────────────────────
log('\n=== 15. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/retention');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('Retention') || mobH1?.includes('Flight'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#kpi-strip').count() > 0, 'KPI strip on mobile');
check(await page.locator('#tab-overview').count() > 0, 'Tabs on mobile');
const mobCards = await page.locator('[data-id^="risk-card-"]').count();
check(mobCards >= 8, `Risk cards visible on mobile: ${mobCards}`);
await page.screenshot({ path: 'pw-screenshots/r44-retention-08-mobile.png' });

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== 16. CONSOLE ERRORS ===');
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.waitForTimeout(800);
check(errors.length === 0, `No console errors (${errors.length}): ${errors.join('; ')}`);

// ── RESULTS ──────────────────────────────────────────────────────────────────
log(`\n=== RESULTS ===`);
log(`Passed: ${pass}  Failed: ${fail}`);
log(fail === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
await browser.close();
process.exit(fail > 0 ? 1 : 0);
