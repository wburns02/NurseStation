import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok  = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// ── 1. Nav link ──────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(500);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/ratios"]');
check(await navLink.count() > 0, 'Ratio Monitor nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(700);
}

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/ratios'), 'URL is /ratios');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Ratio'), `h1 contains "Ratio": "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r22-ratio-01-page.png' });

// ── 3. Stats bar ─────────────────────────────────────────────────────────────
log('\n=== 3. STATS ===');
check(await page.locator('#stat-violations').count() > 0, '#stat-violations exists');
check(await page.locator('#stat-warnings').count() > 0, '#stat-warnings exists');
check(await page.locator('#stat-compliant').count() > 0, '#stat-compliant exists');
check(await page.locator('#stat-forecasted').count() > 0, '#stat-forecasted exists');
const violVal = await page.locator('#stat-violations').textContent().catch(() => '');
check(violVal.includes('3'), `violations stat shows 3 (CCU+ED+MSB): "${violVal.trim()}"`);

// ── 4. Alerts panel ──────────────────────────────────────────────────────────
log('\n=== 4. ALERTS PANEL ===');
check(await page.locator('#alerts-panel').count() > 0, 'Alerts panel visible');
check(await page.locator('[data-id="alert-alert-001"]').count() > 0, 'alert-001 in panel');
check(await page.locator('[data-id="alert-alert-002"]').count() > 0, 'alert-002 in panel');

// Acknowledge one alert
const ack001 = page.locator('[aria-label="Acknowledge alert alert-001"]');
check(await ack001.count() > 0, 'Ack button for alert-001 exists');
if (await ack001.count() > 0) {
  await ack001.click();
  await page.waitForTimeout(400);
  check(await page.locator('[data-id="alert-alert-001"]').count() === 0, 'alert-001 removed after ack');
}

// Ack all
const ackAll = page.locator('[aria-label="Acknowledge all alerts"]');
if (await ackAll.count() > 0) {
  await ackAll.click();
  await page.waitForTimeout(400);
  ok('Ack all alerts clicked');
}

// ── 5. Unit cards ─────────────────────────────────────────────────────────────
log('\n=== 5. UNIT CARDS ===');
check(await page.locator('[data-id="unit-card-icu"]').count() > 0, 'ICU unit card exists');
check(await page.locator('[data-id="unit-card-ccu"]').count() > 0, 'CCU unit card exists');
check(await page.locator('[data-id="unit-card-ed"]').count() > 0, 'ED unit card exists');
check(await page.locator('[data-id="unit-card-msa"]').count() > 0, 'MS-A unit card exists');
check(await page.locator('[data-id="unit-card-msb"]').count() > 0, 'MS-B unit card exists');
check(await page.locator('[data-id="unit-card-onc"]').count() > 0, 'ONC unit card exists');
check(await page.locator('[data-id="unit-card-tele"]').count() > 0, 'TELE unit card exists');
await page.screenshot({ path: 'pw-screenshots/r22-ratio-02-units.png' });

// ── 6. Filter tabs ────────────────────────────────────────────────────────────
log('\n=== 6. FILTER TABS ===');
const violFilter = page.locator('[aria-label="Filter Violations"]');
check(await violFilter.count() > 0, 'Violations filter exists');
if (await violFilter.count() > 0) {
  await violFilter.click();
  await page.waitForTimeout(400);
  // Only violation units should show
  check(await page.locator('[data-id="unit-card-ccu"]').count() > 0, 'CCU visible in violations filter');
  check(await page.locator('[data-id="unit-card-msb"]').count() > 0, 'MS-B visible in violations filter');
  await page.screenshot({ path: 'pw-screenshots/r22-ratio-03-violations-filter.png' });
}

// Compliant filter
const complFilter = page.locator('[aria-label="Filter Compliant"]');
if (await complFilter.count() > 0) {
  await complFilter.click();
  await page.waitForTimeout(400);
  check(await page.locator('[data-id="unit-card-onc"]').count() > 0, 'ONC visible in compliant filter');
  check(await page.locator('[data-id="unit-card-tele"]').count() > 0, 'TELE visible in compliant filter');
}

// Back to all
const allFilter = page.locator('[aria-label="Filter All Units"]');
if (await allFilter.count() > 0) {
  await allFilter.click();
  await page.waitForTimeout(400);
}

// ── 7. Float Pool Request ─────────────────────────────────────────────────────
// ED is in violation (4.67:1) with no seed fill request → button should be available
log('\n=== 7. FLOAT REQUEST MODAL ===');
const floatBtnED = page.locator('[aria-label="Request float for ED"]');
check(await floatBtnED.count() > 0, 'Float button for ED exists (no fill in progress)');
if (await floatBtnED.count() > 0) {
  await floatBtnED.click();
  await page.waitForTimeout(500);
  check(await page.locator('#float-modal').count() > 0, 'Float modal opened');
  await page.screenshot({ path: 'pw-screenshots/r22-ratio-04-float-modal.png' });

  // Check nurse options
  const floatOptions = await page.locator('[data-id^="float-option-"]').count();
  check(floatOptions > 0, `Float nurse options visible: ${floatOptions}`);

  // Select first available
  const firstOption = page.locator('[data-id^="float-option-"]').first();
  if (await firstOption.count() > 0) {
    await firstOption.click();
    await page.waitForTimeout(200);
    ok('Float nurse selected');
  }

  // Submit
  const sendReq = page.locator('[aria-label="Send float request"]');
  check(await sendReq.count() > 0, 'Send request button exists');
  if (await sendReq.count() > 0) {
    await sendReq.click();
    await page.waitForTimeout(2500);
    check(await page.locator('#float-modal').count() === 0, 'Float modal closed after submit');
  }
}

// ── 8. Fill request appears ───────────────────────────────────────────────────
log('\n=== 8. FILL REQUEST TIMELINE ===');
await page.waitForTimeout(300);
// Should have at least the seeded requests + new one
const fillRows = await page.locator('[data-id^="fill-req-"]').count();
check(fillRows >= 2, `Fill request rows present: ${fillRows}`);
await page.screenshot({ path: 'pw-screenshots/r22-ratio-05-fill-requests.png' });

// Cancel a pending request
const cancelBtn = page.locator('[aria-label^="Cancel request fill-002"]');
if (await cancelBtn.count() > 0) {
  await cancelBtn.click();
  await page.waitForTimeout(400);
  ok('Cancelled fill-002 request');
}

// ── 9. Agency escalation modal ────────────────────────────────────────────────
// ICU is in WARNING (ratio 2.0 = exactly at 2:1 mandate) with no seed fill request → button should be available
log('\n=== 9. AGENCY MODAL ===');
const agencyBtnICU = page.locator('[aria-label="Escalate to agency for ICU"]');
check(await agencyBtnICU.count() > 0, 'Agency button for ICU exists (warning state, no fill in progress)');
if (await agencyBtnICU.count() > 0) {
  await agencyBtnICU.click();
  await page.waitForTimeout(500);
  check(await page.locator('#agency-modal').count() > 0, 'Agency modal opened');
  await page.screenshot({ path: 'pw-screenshots/r22-ratio-06-agency-modal.png' });

  // Pick an agency
  const agencyOpts = await page.locator('[data-id^="agency-option-"]').count();
  check(agencyOpts > 0, `Agency options: ${agencyOpts}`);
  if (agencyOpts > 0) {
    await page.locator('[data-id^="agency-option-"]').first().click();
    await page.waitForTimeout(200);
    ok('Agency selected');
  }

  // Place order
  const placeOrder = page.locator('[aria-label="Place agency order"]');
  if (await placeOrder.count() > 0) {
    await placeOrder.click();
    await page.waitForTimeout(3200);
    check(await page.locator('#agency-modal').count() === 0, 'Agency modal closed after submit');
  }
} else {
  // Check if ICU has fill in progress instead
  const icuCard = page.locator('[data-id="unit-card-icu"]');
  const inProgress = await icuCard.locator('[class*="violet"][class*="progress"]').count();
  log(`  ICU agency button not found — inProgress indicators: ${inProgress}`);
  err('Agency button for ICU not found — ICU may not be in warning/violation state');
}

// ── 10. Float pool sidebar ────────────────────────────────────────────────────
log('\n=== 10. FLOAT POOL SIDEBAR ===');
check(await page.locator('[data-id="float-pool-float-001"]').count() > 0, 'Float pool shows Maria Santos');
check(await page.locator('[data-id="float-pool-float-007"]').count() > 0, 'Float pool shows Beth Collins');

// ── 11. Agency contacts sidebar ───────────────────────────────────────────────
log('\n=== 11. AGENCY CONTACTS SIDEBAR ===');
check(await page.locator('[data-id="agency-agency-001"]').count() > 0, 'MedPro Staffing visible');
check(await page.locator('[data-id="agency-agency-003"]').count() > 0, 'NurseNow 24/7 visible');

// ── 12. Console errors ────────────────────────────────────────────────────────
log('\n=== 12. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/ratios');
await page.waitForTimeout(800);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

// ── 13. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 13. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/r22-ratio-07-mobile.png' });
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.trim().length > 0, `Page renders on mobile: "${mobileH1?.trim()}"`);
// Check at least 1 unit card is visible on mobile
check(await page.locator('[data-id^="unit-card-"]').count() > 0, 'Unit cards visible on mobile');

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
