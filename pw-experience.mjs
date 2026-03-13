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

// ── 1. Nav link ──────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(600);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/experience"]');
check(await navLink.count() > 0, 'Pt. Experience nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/experience'), `URL: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Experience') || h1?.includes('HCAHPS'), `h1: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r40-exp-01-load.png' });

// ── 3. KPI strip ─────────────────────────────────────────────────────────────
log('\n=== 3. KPI STRIP ===');
check(await page.locator('#kpi-strip').count()        > 0, 'KPI strip exists');
check(await page.locator('#kpi-composite').count()    > 0, 'Composite KPI');
check(await page.locator('#kpi-percentile').count()   > 0, 'Percentile KPI');
check(await page.locator('#kpi-open-actions').count() > 0, 'Open actions KPI');
check(await page.locator('#kpi-top-unit').count()     > 0, 'Top unit KPI');

const compositeKpi = await page.locator('#kpi-composite').textContent().catch(() => '');
check(compositeKpi && /\d/.test(compositeKpi), `Composite KPI has data: "${compositeKpi?.slice(0,30)}"`);
const pctKpi = await page.locator('#kpi-percentile').textContent().catch(() => '');
check(pctKpi?.includes('th') || pctKpi?.includes('%'), `Percentile shows: "${pctKpi?.slice(0,20)}"`);

// ── 4. Tabs ──────────────────────────────────────────────────────────────────
log('\n=== 4. TABS ===');
check(await page.locator('#tab-overview').count()      > 0, 'Overview tab');
check(await page.locator('#tab-domains').count()       > 0, 'Domains tab');
check(await page.locator('#tab-correlations').count()  > 0, 'Correlations tab');
check(await page.locator('#tab-actions').count()       > 0, 'Actions tab');

// ── 5. Overview — Composite gauge + trend ────────────────────────────────────
log('\n=== 5. OVERVIEW ===');
check(await page.locator('#composite-gauge').count() > 0, 'Composite gauge exists');
check(await page.locator('#hospital-trend').count()  > 0, 'Hospital trend exists');
const gaugeText = await page.locator('#composite-gauge').textContent().catch(() => '');
check(gaugeText && /\d/.test(gaugeText), `Gauge has score: "${gaugeText?.slice(0,30)}"`);

// Unit leaderboard
check(await page.locator('#unit-leaderboard').count() > 0, 'Unit leaderboard exists');
const leaderRows = await page.locator('[data-id^="unit-row-"]').count();
check(leaderRows >= 6, `At least 6 unit rows: ${leaderRows}`);

// Oncology is the default selected unit; click ICU (not pre-selected) to see detail
await page.locator('[data-id="unit-row-ICU"]').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-detail').count() > 0, 'Unit detail panel visible after click');
const detailText = await page.locator('#unit-detail').textContent().catch(() => '');
check(detailText?.includes('ICU') || detailText?.includes('composite') || detailText?.includes('tenure'), `Detail shows ICU data: "${detailText?.slice(0,60)}"`);

// Click another unit
await page.locator('[data-id="unit-row-MS-A"]').click();
await page.waitForTimeout(400);
const detailText2 = await page.locator('#unit-detail').textContent().catch(() => '');
check(detailText2?.includes('MS-A') || detailText2?.includes('float'), `Detail switches to MS-A: "${detailText2?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r40-exp-02-overview.png' });

// ── 6. Domains tab ───────────────────────────────────────────────────────────
log('\n=== 6. DOMAINS TAB ===');
await page.locator('#tab-domains').click();
await page.waitForTimeout(400);

check(await page.locator('#domains-grid').count() > 0, 'Domains grid exists');
const domainCards = await page.locator('[data-id^="domain-"]').count();
check(domainCards >= 7, `At least 7 domain cards: ${domainCards}`);

// Check specific domains
check(await page.locator('[data-id="domain-nurse-comm"]').count() > 0, 'Nurse communication domain');
check(await page.locator('[data-id="domain-staff-resp"]').count() > 0, 'Staff responsiveness domain');

const nurseCommText = await page.locator('[data-id="domain-nurse-comm"]').textContent().catch(() => '');
check(nurseCommText?.includes('76') || nurseCommText?.includes('Nurse'), `Nurse comm shows score: "${nurseCommText?.slice(0,50)}"`);

// Benchmark table
check(await page.locator('#benchmark-table').count() > 0, 'Benchmark table exists');
const benchRows = await page.locator('[data-id^="benchmark-row-"]').count();
check(benchRows >= 7, `At least 7 benchmark rows: ${benchRows}`);
await page.screenshot({ path: 'pw-screenshots/r40-exp-03-domains.png' });

// ── 7. Correlations tab ──────────────────────────────────────────────────────
log('\n=== 7. CORRELATIONS TAB ===');
await page.locator('#tab-correlations').click();
await page.waitForTimeout(400);

check(await page.locator('#correlations-list').count() > 0, 'Correlations list exists');
const corrCards = await page.locator('[data-id^="corr-"]').count();
check(corrCards >= 4, `At least 4 correlation cards: ${corrCards}`);

// Expand a correlation card
const firstCorr = page.locator('[data-id="corr-corr-001"]');
check(await firstCorr.count() > 0, 'First correlation exists (float ratio)');
await firstCorr.locator('button').first().click();
await page.waitForTimeout(300);
const corrText = await firstCorr.textContent().catch(() => '');
check(corrText?.includes('float') || corrText?.includes('surveys') || corrText?.includes('Communication'), `Correlation expands with detail: "${corrText?.slice(0,80)}"`);

// Check positive correlation
check(await page.locator('[data-id="corr-corr-003"]').count() > 0, 'Positive correlation (tenure) exists');
await page.screenshot({ path: 'pw-screenshots/r40-exp-04-correlations.png' });

// ── 8. Actions tab ───────────────────────────────────────────────────────────
log('\n=== 8. ACTIONS TAB ===');
await page.locator('#tab-actions').click();
await page.waitForTimeout(400);

check(await page.locator('#actions-list').count() > 0, 'Actions list exists');
const actionCards = await page.locator('[data-id^="action-"]').count();
check(actionCards >= 5, `At least 5 action cards: ${actionCards}`);

// Start an open action
const startBtn = page.locator('[aria-label^="Start act-"]').first();
check(await startBtn.count() > 0, 'Start button exists');
await startBtn.click();
await page.waitForTimeout(500);
const startToast = await page.locator('#action-toast').textContent().catch(() => '');
check(startToast?.includes('started') || startToast?.includes('progress'), `Start toast: "${startToast?.trim()}"`);
await page.waitForTimeout(3500);

// Complete an action
const completeBtn = page.locator('[aria-label^="Complete act-"]').first();
check(await completeBtn.count() > 0, 'Complete button exists');
await completeBtn.click();
await page.waitForTimeout(500);
const completeToast = await page.locator('#action-toast').textContent().catch(() => '');
check(completeToast?.includes('complete') || completeToast?.includes('✓'), `Complete toast: "${completeToast?.trim()}"`);
await page.waitForTimeout(3500);

await page.screenshot({ path: 'pw-screenshots/r40-exp-05-actions.png' });

// ── 9. Add action modal ──────────────────────────────────────────────────────
log('\n=== 9. ADD ACTION MODAL ===');
await page.locator('#add-action-btn').click();
await page.waitForTimeout(400);
check(await page.locator('#add-action-modal').count() > 0, 'Add action modal opens');

// Fill in form
await page.fill('#action-title-input', 'Implement hourly rounding in MS-B');
await page.waitForTimeout(200);
await page.selectOption('#action-type-select', 'rounding');
await page.selectOption('#action-unit-select', 'MS-B');
await page.fill('#action-detail-input', 'Structured hourly rounding checklist for all RNs.');
await page.fill('#action-due-input', 'Apr 20');
await page.waitForTimeout(200);

const saveBtn = page.locator('[aria-label="Save action item"]');
check(await saveBtn.count() > 0, 'Save button exists');
const actionCountBefore = await page.locator('[data-id^="action-"]').count();
await saveBtn.click();
await page.waitForTimeout(500);
check(await page.locator('#add-action-modal').count() === 0, 'Modal closed after save');
const addToast = await page.locator('#action-toast').textContent().catch(() => '');
check(addToast?.includes('Added') || addToast?.includes('hourly'), `Add toast: "${addToast?.trim()}"`);
await page.waitForTimeout(3500);
const actionCountAfter = await page.locator('[data-id^="action-"]').count();
check(actionCountAfter > actionCountBefore, `New action added: ${actionCountBefore} → ${actionCountAfter}`);
await page.screenshot({ path: 'pw-screenshots/r40-exp-06-add-action.png' });

// ── 10. Mobile ───────────────────────────────────────────────────────────────
log('\n=== 10. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/experience');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('Experience'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#kpi-strip').count() > 0, 'KPI strip on mobile');
check(await page.locator('#composite-gauge').count() > 0, 'Gauge on mobile');
check(await page.locator('#tab-overview').count() > 0, 'Tabs on mobile');
await page.screenshot({ path: 'pw-screenshots/r40-exp-07-mobile.png' });

// ── 11. Console errors ───────────────────────────────────────────────────────
log('\n=== 11. CONSOLE ERRORS ===');
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
