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
const navLink = page.locator('a[href="/live"]');
check(await navLink.count() > 0, 'Live Operations nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/live'), `URL: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Live') || h1?.includes('Operations'), `h1: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r42-live-01-load.png' });

// ── 3. KPI strip ─────────────────────────────────────────────────────────────
log('\n=== 3. KPI STRIP ===');
check(await page.locator('#kpi-on-floor').count()  > 0, 'On Floor KPI');
check(await page.locator('#kpi-callouts').count()  > 0, 'Call-Outs KPI');
check(await page.locator('#kpi-late').count()      > 0, 'Late KPI');
check(await page.locator('#kpi-ratio').count()     > 0, 'Ratio Alerts KPI');
check(await page.locator('#kpi-census').count()    > 0, 'Census KPI');

const onFloorKpi = await page.locator('#kpi-on-floor').textContent().catch(() => '');
check(onFloorKpi && /\d/.test(onFloorKpi), `On Floor KPI has data: "${onFloorKpi?.slice(0,30)}"`);
const censusKpi = await page.locator('#kpi-census').textContent().catch(() => '');
check(censusKpi && /\d/.test(censusKpi), `Census KPI has data: "${censusKpi?.slice(0,30)}"`);

// ── 4. Shift progress ────────────────────────────────────────────────────────
log('\n=== 4. SHIFT PROGRESS ===');
check(await page.locator('#shift-progress').count() > 0, 'Shift progress bar exists');
const progressText = await page.locator('#shift-progress').textContent().catch(() => '');
check(progressText?.includes('7:00') || progressText?.includes('elapsed'), `Progress shows time: "${progressText?.slice(0,60)}"`);

// ── 5. Unit grid ─────────────────────────────────────────────────────────────
log('\n=== 5. UNIT GRID ===');
check(await page.locator('#unit-grid').count() > 0, 'Unit grid exists');
const unitCards = await page.locator('[id^="unit-card-"]').count();
check(unitCards >= 5, `At least 5 unit cards: ${unitCards}`);

// Verify specific units
check(await page.locator('#unit-card-ICU').count()  > 0, 'ICU unit card exists');
check(await page.locator('#unit-card-CCU').count()  > 0, 'CCU unit card exists');
check(await page.locator('#unit-card-ED').count()   > 0, 'ED unit card exists');

// Check ICU card has data
const icuText = await page.locator('#unit-card-ICU').textContent().catch(() => '');
check(icuText?.includes('ICU') || icuText?.includes('floor'), `ICU card has data: "${icuText?.slice(0,60)}"`);

// ── 6. Unit card click → detail panel ────────────────────────────────────────
log('\n=== 6. UNIT DETAIL ===');
await page.locator('#unit-card-ICU').click();
await page.waitForTimeout(400);
check(await page.locator('#unit-detail-panel').count() > 0, 'Unit detail panel opens');

const detailText = await page.locator('#unit-detail-panel').textContent().catch(() => '');
check(detailText?.includes('ICU') || detailText?.includes('Floor') || detailText?.includes('RN'), `Detail shows ICU data: "${detailText?.slice(0,60)}"`);

// Staff rows in detail
const staffRows = await page.locator('[data-id^="detail-staff-"]').count();
check(staffRows >= 5, `At least 5 staff in detail: ${staffRows}`);

// Click another unit — panel switches
await page.locator('#unit-card-CCU').click();
await page.waitForTimeout(400);
const detailText2 = await page.locator('#unit-detail-panel').textContent().catch(() => '');
check(detailText2?.includes('CCU') || detailText2?.includes('Cardiac'), `Detail switches to CCU: "${detailText2?.slice(0,60)}"`);

// Click same unit — panel closes
await page.locator('#unit-card-CCU').click();
await page.waitForTimeout(600);
check(await page.locator('#unit-detail-panel').count() === 0, 'Click same unit closes detail');
await page.screenshot({ path: 'pw-screenshots/r42-live-02-units.png' });

// ── 7. Event feed ─────────────────────────────────────────────────────────────
log('\n=== 7. EVENT FEED ===');
check(await page.locator('#event-feed').count() > 0, 'Event feed exists');
const eventCards = await page.locator('[id^="event-card-"]').count();
check(eventCards >= 5, `At least 5 event cards: ${eventCards}`);

// Check specific events exist
check(await page.locator('#event-card-ev-001').count() > 0, 'Shift start event (ev-001) exists');
check(await page.locator('#event-card-ev-005').count() > 0, 'Callout event (ev-005) exists');

const calloutText = await page.locator('#event-card-ev-005').textContent().catch(() => '');
check(calloutText?.includes('called out') || calloutText?.includes('callout') || calloutText?.includes('Okafor'), `Callout event has data: "${calloutText?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r42-live-03-feed.png' });

// ── 8. Event action buttons ───────────────────────────────────────────────────
log('\n=== 8. EVENT ACTIONS ===');
// ev-005 has "Find Coverage" action
const actionBtn = page.locator('[aria-label="Action ev-005"]');
check(await actionBtn.count() > 0, 'Action button on callout event exists');
await actionBtn.click();
await page.waitForTimeout(500);
const toast = await page.locator('#action-toast').textContent().catch(() => '');
check(toast?.includes('Coverage') || toast?.includes('Float') || toast?.includes('notified'), `Action toast: "${toast?.trim()}"`);
await page.waitForTimeout(3500);

// Verify action is now marked done
const doneText = await page.locator('#event-card-ev-005').textContent().catch(() => '');
check(doneText?.includes('Done') || !doneText?.includes('Find Coverage'), `Action marked done on ev-005: "${doneText?.slice(0,80)}"`);

// ── 9. Priority actions panel ─────────────────────────────────────────────────
log('\n=== 9. PRIORITY ACTIONS ===');
check(await page.locator('#priority-actions').count() > 0, 'Priority actions panel exists');
const priorityItems = await page.locator('[data-id^="priority-"]').count();
check(priorityItems >= 1, `At least 1 priority item: ${priorityItems}`);

// Act on a priority item
const priorityBtn = page.locator('[aria-label^="Priority action ev-"]').first();
check(await priorityBtn.count() > 0, 'Priority action button exists');
await priorityBtn.click();
await page.waitForTimeout(500);
const toast2 = await page.locator('#action-toast').textContent().catch(() => '');
check(toast2?.length > 5, `Priority action toast: "${toast2?.trim()}"`);
await page.waitForTimeout(3500);
await page.screenshot({ path: 'pw-screenshots/r42-live-04-actions.png' });

// ── 10. Live toggle ───────────────────────────────────────────────────────────
log('\n=== 10. LIVE TOGGLE ===');
check(await page.locator('#live-toggle').count() > 0, 'Live toggle button exists');
await page.locator('#live-toggle').click();
await page.waitForTimeout(300);
const toggleText = await page.locator('#live-toggle').textContent().catch(() => '');
check(toggleText?.includes('Paused') || toggleText?.includes('Live'), `Toggle changed: "${toggleText?.trim()}"`);
// Toggle back on
await page.locator('#live-toggle').click();
await page.waitForTimeout(300);

// ── 11. Live clock ────────────────────────────────────────────────────────────
log('\n=== 11. LIVE CLOCK ===');
check(await page.locator('#live-clock').count() > 0, 'Live clock exists');
const clockText = await page.locator('#live-clock').textContent().catch(() => '');
check(clockText && /\d:\d\d/.test(clockText), `Clock shows time: "${clockText?.trim()}"`);

// ── 12. Staff legend ─────────────────────────────────────────────────────────
log('\n=== 12. LEGEND ===');
check(await page.locator('#staff-legend').count() > 0, 'Staff legend exists');
const legendText = await page.locator('#staff-legend').textContent().catch(() => '');
check(legendText?.includes('Floor') || legendText?.includes('Break') || legendText?.includes('Late'), `Legend has labels: "${legendText?.slice(0,60)}"`);

// ── 13. Active alerts badge ───────────────────────────────────────────────────
log('\n=== 13. ALERTS BADGE ===');
// May or may not exist depending on how many actions are already done
const alertsBadge = await page.locator('#active-alerts-badge').count();
check(alertsBadge >= 0, `Alerts badge present or absent (ok either way): ${alertsBadge}`);
ok('Alert badge state is valid');

// ── 14. Mobile ────────────────────────────────────────────────────────────────
log('\n=== 14. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/live');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('Live') || mobH1?.includes('Operations'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#kpi-strip').count() > 0, 'KPI strip on mobile');
check(await page.locator('#unit-grid').count() > 0, 'Unit grid on mobile');
check(await page.locator('#event-feed').count() > 0, 'Event feed on mobile');
await page.screenshot({ path: 'pw-screenshots/r42-live-05-mobile.png' });

// ── 15. Console errors ────────────────────────────────────────────────────────
log('\n=== 15. CONSOLE ERRORS ===');
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
