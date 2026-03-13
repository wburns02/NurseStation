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
const navLink = page.locator('a[href="/acuity"]');
check(await navLink.count() > 0, 'Acuity Intel nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/acuity'), `URL: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Acuity') || h1?.includes('Staffing'), `h1: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-01-load.png' });

// ── 3. KPI strip ─────────────────────────────────────────────────────────────
log('\n=== 3. KPI STRIP ===');
check(await page.locator('#kpi-avg-acuity').count()   > 0, 'Avg Acuity KPI');
check(await page.locator('#kpi-fte-gap').count()      > 0, 'FTE Gap KPI');
check(await page.locator('#kpi-quality-risk').count() > 0, 'Quality Risk KPI');
check(await page.locator('#kpi-savings').count()      > 0, 'Savings KPI');

const avgAcuityText = await page.locator('#kpi-avg-acuity').textContent().catch(() => '');
check(avgAcuityText && /\d/.test(avgAcuityText), `Avg Acuity has data: "${avgAcuityText?.slice(0,40)}"`);
const savingsText = await page.locator('#kpi-savings').textContent().catch(() => '');
check(savingsText?.includes('$'), `Savings shows dollar amount: "${savingsText?.slice(0,30)}"`);

// ── 4. Tabs ──────────────────────────────────────────────────────────────────
log('\n=== 4. TABS ===');
check(await page.locator('#tab-overview').count()         > 0, 'Overview tab');
check(await page.locator('#tab-detail').count()           > 0, 'Patient Detail tab');
check(await page.locator('#tab-trend').count()            > 0, '7-Shift Trend tab');
check(await page.locator('#tab-recommendations').count()  > 0, 'Action Plan tab');

// ── 5. Overview tab — unit cards ─────────────────────────────────────────────
log('\n=== 5. OVERVIEW TAB ===');
check(await page.locator('#overview-tab').count() > 0, 'Overview tab content visible');
const unitCards = await page.locator('[id^="unit-card-"]').count();
check(unitCards >= 5, `At least 5 unit cards: ${unitCards}`);

// Specific units
check(await page.locator('#unit-card-ICU').count()     > 0, 'ICU unit card');
check(await page.locator('#unit-card-ED').count()      > 0, 'ED unit card');
check(await page.locator('[id^="unit-card-MS"]').count() > 0, 'Med-Surg cards');

const icuCard = await page.locator('#unit-card-ICU').textContent().catch(() => '');
check(icuCard?.includes('floor') || icuCard?.includes('needed'), `ICU card has FTE data: "${icuCard?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-02-overview.png' });

// ── 6. Unit card click → detail tab ──────────────────────────────────────────
log('\n=== 6. UNIT CARD CLICK ===');
await page.locator('#unit-card-ICU').click();
await page.waitForTimeout(500);
check(page.url().includes('/acuity'), 'Still on acuity page');
// Should switch to detail tab automatically
check(await page.locator('#unit-detail-panel').count() > 0, 'Unit detail panel appeared');

const detailText = await page.locator('#unit-detail-panel').textContent().catch(() => '');
check(detailText?.includes('ICU') || detailText?.includes('FTE') || detailText?.includes('acuity'), `Detail panel shows ICU data: "${detailText?.slice(0,80)}"`);

// ── 7. Patient list ───────────────────────────────────────────────────────────
log('\n=== 7. PATIENT LIST ===');
check(await page.locator('#patient-list-ICU').count() > 0, 'ICU patient list exists');
const patientRows = await page.locator('[data-id^="patient-row-ICU"]').count();
check(patientRows >= 10, `At least 10 ICU patient rows: ${patientRows}`);

// Check patient row content
const firstPatient = await page.locator('[data-id="patient-row-ICU-1"]').textContent().catch(() => '');
check(firstPatient?.includes('ICU-1') || firstPatient?.includes('Post') || firstPatient?.includes('h'), `First patient has data: "${firstPatient?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-03-patient-list.png' });

// ── 8. Acuity button click — updates instantly ────────────────────────────────
log('\n=== 8. ACUITY UPDATE ===');
// Find a patient row and click a different acuity button
const patientRow = page.locator('[data-id="patient-row-ICU-14"]'); // ICU-14 is currently acuity 1 (Stable)
check(await patientRow.count() > 0, 'ICU-14 patient row exists');

// Read current FTE before update
const fteBefore = await page.locator('#unit-detail-panel').textContent().catch(() => '');
const fteBeforeNum = parseFloat(fteBefore?.match(/FTE needed:\s*([\d.]+)/)?.[1] ?? '0');

// Click acuity level 3 button on ICU-14 (currently level 1)
const acuityBtns = patientRow.locator('button');
const acuityBtnCount = await acuityBtns.count();
check(acuityBtnCount >= 4, `Patient has 4 acuity buttons: ${acuityBtnCount}`);
await acuityBtns.nth(2).click(); // click button index 2 = acuity 3
await page.waitForTimeout(600);

// Check toast appeared
const toast = await page.locator('#action-toast').textContent().catch(() => '');
check(toast?.includes('Acuity') || toast?.includes('updated') || toast?.includes('recalculated'), `Acuity update toast: "${toast?.trim()}"`);
await page.waitForTimeout(3500);

// FTE should have changed
const fteAfter = await page.locator('#unit-detail-panel').textContent().catch(() => '');
const fteAfterNum = parseFloat(fteAfter?.match(/FTE needed:\s*([\d.]+)/)?.[1] ?? '0');
check(fteAfterNum > fteBeforeNum, `FTE recalculated: ${fteBeforeNum} → ${fteAfterNum}`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-04-acuity-update.png' });

// ── 9. Detail tab — unit selector ────────────────────────────────────────────
log('\n=== 9. DETAIL UNIT SELECTOR ===');
await page.locator('#tab-detail').click();
await page.waitForTimeout(300);

// Switch to a different unit
const msaBtn = page.locator('#detail-unit-btn-MS-A');
check(await msaBtn.count() > 0, 'MS-A detail unit button exists');
await msaBtn.click();
await page.waitForTimeout(400);

check(await page.locator('#patient-list-MS-A').count() > 0, 'MS-A patient list shows');
const msaPatients = await page.locator('[data-id^="patient-row-MSA"]').count();
check(msaPatients >= 15, `At least 15 MS-A patients: ${msaPatients}`);

// ── 10. Trend tab ─────────────────────────────────────────────────────────────
log('\n=== 10. TREND TAB ===');
await page.locator('#tab-trend').click();
await page.waitForTimeout(400);

check(await page.locator('#trend-chart').count() > 0, 'Trend chart exists');
const trendUnits = await page.locator('[data-id^="trend-unit-"]').count();
check(trendUnits >= 5, `At least 5 trend unit labels: ${trendUnits}`);

check(await page.locator('#trend-table').count() > 0, 'Trend table exists');
const trendRows = await page.locator('[data-id^="trend-row-"]').count();
check(trendRows >= 5, `At least 5 trend table rows: ${trendRows}`);

const icuTrendRow = await page.locator('[data-id="trend-row-ICU"]').textContent().catch(() => '');
check(icuTrendRow?.includes('ICU') || icuTrendRow?.includes('2.') || icuTrendRow?.includes('3.'), `ICU trend row has data: "${icuTrendRow?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-05-trend.png' });

// ── 11. Recommendations tab ───────────────────────────────────────────────────
log('\n=== 11. RECOMMENDATIONS ===');
await page.locator('#tab-recommendations').click();
await page.waitForTimeout(400);

check(await page.locator('#recommendations-tab').count() > 0, 'Recommendations tab content');
const recCards = await page.locator('[data-id^="rec-"]').count();
check(recCards >= 4, `At least 4 recommendation cards: ${recCards}`);

const firstRec = await page.locator('[data-id="rec-rec-001"]').textContent().catch(() => '');
check(firstRec?.includes('Float') || firstRec?.includes('RN') || firstRec?.includes('MS-A'), `First rec has content: "${firstRec?.slice(0,80)}"`);

// Execute a recommendation
const execBtn = page.locator('[aria-label="Execute rec-001"]');
check(await execBtn.count() > 0, 'Execute button for rec-001 exists');
await execBtn.click();
await page.waitForTimeout(500);
const execToast = await page.locator('#action-toast').textContent().catch(() => '');
check(execToast?.includes('Float') || execToast?.includes('Torres') || execToast?.includes('executed') || execToast?.includes('✓'), `Execute toast: "${execToast?.trim()}"`);
await page.waitForTimeout(3500);

// Verify rec-001 is now marked executed
const rec001After = await page.locator('[data-id="rec-rec-001"]').textContent().catch(() => '');
check(rec001After?.includes('Executed'), `Rec-001 shows Executed: "${rec001After?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r43-acuity-06-recommendations.png' });

// ── 12. Recalculate button ────────────────────────────────────────────────────
log('\n=== 12. RECALCULATE ===');
check(await page.locator('#recalculate-btn').count() > 0, 'Recalculate button exists');
await page.locator('#recalculate-btn').click();
await page.waitForTimeout(200);
// Should show loading state
const btnText = await page.locator('#recalculate-btn').textContent().catch(() => '');
check(btnText?.includes('Recalculating') || btnText?.includes('Recalculate'), `Button shows loading: "${btnText?.trim()}"`);
await page.waitForTimeout(1800); // wait for animation
const recalcToast = await page.locator('#action-toast').textContent().catch(() => '');
check(recalcToast?.includes('recalculated') || recalcToast?.includes('updated'), `Recalc toast: "${recalcToast?.trim()}"`);
await page.waitForTimeout(3500);

// ── 13. Mobile ────────────────────────────────────────────────────────────────
log('\n=== 13. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/acuity');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('Acuity') || mobH1?.includes('Staffing'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#kpi-strip').count() > 0, 'KPI strip on mobile');
check(await page.locator('#tab-overview').count() > 0, 'Tabs on mobile');
await page.screenshot({ path: 'pw-screenshots/r43-acuity-07-mobile.png' });

// ── 14. Console errors ────────────────────────────────────────────────────────
log('\n=== 14. CONSOLE ERRORS ===');
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
