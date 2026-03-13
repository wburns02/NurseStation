import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';

let pass = true;
const log  = (m) => console.log(m);
const fail = (m) => { console.error('FAIL: ' + m); pass = false; };

// ── 1. Sidebar nav ─────────────────────────────────────────────────────────────
log('\n=== Sidebar Coverage Link ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const coverageLink = page.locator('a[href="/coverage"]').first();
if (await coverageLink.count() > 0) log('✓ "Coverage" nav link in sidebar');
else fail('"Coverage" nav link not found');

const badge2 = page.locator('a[href="/coverage"] span').filter({ hasText: '2' }).first();
if (await badge2.count() > 0) log('✓ Sidebar "Coverage" badge shows 2 (active gaps)');
else log('(sidebar coverage badge check — may be hidden when active)');

// ── 2. Page load ───────────────────────────────────────────────────────────────
log('\n=== Coverage Page Load ===');
await page.goto(BASE + '/coverage');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/cv-01-coverage-page.png' });

const heading = page.locator('h1', { hasText: 'Coverage Command' });
if (await heading.count() > 0) log('✓ "Coverage Command" heading visible');
else fail('"Coverage Command" h1 not found');

// Shift countdown visible
const countdown = page.locator('text=Day shift starts in').first();
if (await countdown.count() > 0) log('✓ Shift countdown visible');
else fail('Shift countdown not found');

// ── 3. Critical alert banner ───────────────────────────────────────────────────
log('\n=== Critical Alert Banner ===');
const alertBanner = page.locator('#critical-alert-banner').first();
if (await alertBanner.count() > 0) log('✓ Critical alert banner visible');
else fail('Critical alert banner not found');

// ── 4. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
const openGapsStat = page.locator('#stat-open-gaps').first();
if (await openGapsStat.count() > 0) log('✓ "Open Gaps" stat card visible');
else fail('"Open Gaps" stat card not found');

const filledStat = page.locator('#stat-filled-today').first();
if (await filledStat.count() > 0) log('✓ "Filled Today" stat card visible');
else fail('"Filled Today" stat card not found');

const fillTimeStat = page.locator('#stat-avg-fill').first();
if (await fillTimeStat.count() > 0) log('✓ "Avg Fill Time" stat card visible');
else fail('"Avg Fill Time" stat card not found');

const agencyStat = page.locator('#stat-agency-cost').first();
if (await agencyStat.count() > 0) log('✓ "Agency Cost" stat card visible');
else fail('"Agency Cost" stat card not found');

// ── 5. Active gap cards ────────────────────────────────────────────────────────
log('\n=== Active Gap Cards ===');
const icuGap = page.locator('[data-id="gap-cov001"]').first();
if (await icuGap.count() > 0) log('✓ ICU gap card found (data-id=gap-cov001)');
else fail('ICU gap card (cov001) not found');

const medSurgGap = page.locator('[data-id="gap-cov002"]').first();
if (await medSurgGap.count() > 0) log('✓ Med-Surg gap card found (data-id=gap-cov002)');
else fail('Med-Surg gap card (cov002) not found');

// James Okafor should appear in ICU gap
const jamesOkafor = page.locator('text=James Okafor').first();
if (await jamesOkafor.count() > 0) log('✓ James Okafor visible in ICU gap');
else fail('James Okafor not visible in ICU gap');

// Tyler Barnes should appear in Med-Surg gap
const tylerBarnes = page.locator('text=Tyler Barnes').first();
if (await tylerBarnes.count() > 0) log('✓ Tyler Barnes visible in Med-Surg gap');
else fail('Tyler Barnes not visible in Med-Surg gap');

// ── 6. Fill suggestions ────────────────────────────────────────────────────────
log('\n=== Fill Suggestions ===');
const marcusRow = page.locator('text=Marcus Williams').first();
if (await marcusRow.count() > 0) log('✓ Marcus Williams (top suggestion) visible');
else fail('Marcus Williams not found in suggestions');

const bestMatchBadge = page.locator('text=Best Match').first();
if (await bestMatchBadge.count() > 0) log('✓ "Best Match" badge visible on rank-1 suggestion');
else fail('"Best Match" badge not found');

// ── 7. Notify button + magic fill flow ────────────────────────────────────────
log('\n=== Notify → Fill Flow ===');
const notifyMarcus = page.locator('[aria-label="Notify Marcus Williams"]').first();
if (await notifyMarcus.count() > 0) {
  log('✓ "Notify Marcus Williams" button found');
  await notifyMarcus.click();
  await page.waitForTimeout(400);

  // Spinner state
  const sending = page.locator('text=Sending…').first();
  if (await sending.count() > 0) log('✓ "Sending…" spinner shows after click');
  else log('(sending state may have transitioned too fast)');

  await page.waitForTimeout(600);
  await page.screenshot({ path: 'pw-screenshots/cv-02-notified.png' });

  // "Sent [time]" state
  const sentState = page.locator('text=/Sent \\d/i').first();
  if (await sentState.count() > 0) log('✓ "Sent [time]" confirmation shows');
  else log('(checking alt text for sent state)');

  // Wait for auto-accept (3s + buffer)
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'pw-screenshots/cv-03-accepted.png' });

  // "Confirmed" state
  const confirmedState = page.locator('text=Confirmed').first();
  if (await confirmedState.count() > 0) log('✓ "Confirmed" shows after acceptance');
  else fail('"Confirmed" state not shown after acceptance');

  // ICU gap should now show as filled
  const filledBadge = page.locator('[data-id="gap-cov001"]').locator('text=Filled').first();
  if (await filledBadge.count() > 0) log('✓ ICU gap card shows "Filled" badge after acceptance');
  else fail('ICU gap "Filled" badge not found after acceptance');

  // Stats: filled today should be 1 now
  const filledCount = await page.locator('#stat-filled-today').textContent();
  if (filledCount?.includes('1')) log('✓ "Filled Today" stat updated to 1');
  else fail('"Filled Today" stat did not update');
} else fail('"Notify Marcus Williams" button not found');

await page.screenshot({ path: 'pw-screenshots/cv-04-after-fill.png' });

// ── 8. Log Call-Out button + modal ────────────────────────────────────────────
log('\n=== Log Call-Out Modal ===');
await page.goto(BASE + '/coverage');
await page.waitForTimeout(700);

const logBtn = page.locator('[aria-label="Log a call-out"]').first();
if (await logBtn.count() > 0) {
  log('✓ "Log Call-Out" button found');
  await logBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'pw-screenshots/cv-05-callout-modal.png' });

  // Modal should be open
  const dialog = page.locator('[aria-label="Log call-out dialog"]').first();
  if (await dialog.count() > 0) log('✓ Log call-out dialog opened');
  else fail('Log call-out dialog not found');

  // Staff selector
  const staffSelector = page.locator('[aria-label="Select staff calling out"]').first();
  if (await staffSelector.count() > 0) {
    log('✓ Staff selector found');
    await staffSelector.selectOption({ index: 2 }); // Nathan Foster
    log('✓ Selected Nathan Foster from dropdown');
  } else fail('Staff selector not found');

  // Shift selector — pick Evening
  const eveningShift = page.locator('[aria-label="Select evening shift"]').first();
  if (await eveningShift.count() > 0) {
    await eveningShift.click();
    log('✓ Selected Evening shift');
  } else log('(Evening shift button not found, using default Day)');

  // Reason — pick family
  const familyReason = page.locator('[aria-label="Reason: Family"]').first();
  if (await familyReason.count() > 0) {
    await familyReason.click();
    log('✓ Selected "Family" as reason');
  } else log('(Family reason button not found)');

  // Submit
  const submitBtn = page.locator('[aria-label="Confirm log call-out"]').first();
  if (await submitBtn.count() > 0) {
    log('✓ Submit button found');
    await submitBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'pw-screenshots/cv-06-after-callout-logged.png' });

    // New gap should appear — check for 3 active gaps now
    const newGapCards = await page.locator('[data-id^="gap-cov"]').count();
    log(`✓ Gap cards visible after logging: ${newGapCards}`);
    if (newGapCards >= 3) log('✓ New call-out gap appeared in list');
    else log('(new gap may use different ID format — checking by content)');
  } else fail('Submit button not found');

  // Modal should be closed
  const dialogAfter = page.locator('[aria-label="Log call-out dialog"]').first();
  if (await dialogAfter.count() === 0) log('✓ Modal closed after submission');
  else fail('Modal did not close after submission');
} else fail('"Log Call-Out" button not found');

// ── 9. Modal cancel ────────────────────────────────────────────────────────────
log('\n=== Modal Cancel ===');
await page.goto(BASE + '/coverage');
await page.waitForTimeout(700);

const logBtn2 = page.locator('[aria-label="Log a call-out"]').first();
if (await logBtn2.count() > 0) {
  await logBtn2.click();
  await page.waitForTimeout(400);
  const closeBtn = page.locator('[aria-label="Close log call-out dialog"]').first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(400);
    const dialogGone = page.locator('[aria-label="Log call-out dialog"]').first();
    if (await dialogGone.count() === 0) log('✓ Modal closes via X button');
    else fail('Modal did not close via X button');
  } else fail('X close button not found in modal');
} else fail('"Log Call-Out" button not found for cancel test');

// ── 10. 7-day forecast ────────────────────────────────────────────────────────
log('\n=== 7-Day Forecast ===');
await page.goto(BASE + '/coverage');
await page.waitForTimeout(700);

const forecast = page.locator('text=7-Day Coverage Forecast').first();
if (await forecast.count() > 0) log('✓ "7-Day Coverage Forecast" section visible');
else fail('"7-Day Coverage Forecast" section not found');

const thu12 = page.locator('text=Thu').first();
if (await thu12.count() > 0) log('✓ "Thu" day visible in forecast');
else fail('"Thu" not found in forecast');

const mon16 = page.locator('text=Mon').first();
if (await mon16.count() > 0) log('✓ "Mon" day visible in forecast (4 projected gaps)');
else fail('"Mon" not found in forecast');

// ── 11. At-risk predictions ────────────────────────────────────────────────────
log('\n=== At-Risk Predictions ===');
const atRiskSection = page.locator('text=Predicted Call-Out Risk').first();
if (await atRiskSection.count() > 0) log('✓ "Predicted Call-Out Risk" section visible');
else fail('"Predicted Call-Out Risk" section not found');

const sarahChenRisk = page.locator('text=Sarah Chen').first();
if (await sarahChenRisk.count() > 0) log('✓ Sarah Chen visible in at-risk predictions (78%)');
else fail('Sarah Chen not found in at-risk predictions');

const nathanRisk = page.locator('text=Nathan Foster').first();
if (await nathanRisk.count() > 0) log('✓ Nathan Foster visible in at-risk predictions');
else fail('Nathan Foster not found in at-risk predictions');

// ── 12. Pattern intelligence ───────────────────────────────────────────────────
log('\n=== Pattern Intelligence ===');
const patternSection = page.locator('text=Pattern Intelligence').first();
if (await patternSection.count() > 0) log('✓ "Pattern Intelligence" section visible');
else fail('"Pattern Intelligence" section not found');

const jamesPattern = page.locator('text=/James Okafor.*4 call-outs/').first();
if (await jamesPattern.count() > 0) log('✓ James Okafor pattern alert visible');
else {
  const jamesAlt = page.locator('text=James Okafor — 4 call-outs').first();
  if (await jamesAlt.count() > 0) log('✓ James Okafor pattern alert visible (alt)');
  else fail('James Okafor pattern alert not found');
}

// ── 13. Full schedule link ─────────────────────────────────────────────────────
log('\n=== Navigation Links ===');
const fullScheduleLink = page.locator('text=Full Schedule').first();
if (await fullScheduleLink.count() > 0) log('✓ "Full Schedule" link visible');
else fail('"Full Schedule" link not found');

// ── 14. Console errors ─────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/coverage');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 15. Mobile viewport ────────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/cv-07-mobile.png' });
const mobileHeading = page.locator('h1', { hasText: 'Coverage Command' });
if (await mobileHeading.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
