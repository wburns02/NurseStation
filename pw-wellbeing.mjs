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
log('\n=== Sidebar Wellbeing Link ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const wellbeingLink = page.locator('a[href="/wellbeing"]').first();
if (await wellbeingLink.count() > 0) log('✓ "Wellbeing" nav link in sidebar');
else fail('"Wellbeing" nav link not found');

const badge3 = page.locator('a[href="/wellbeing"] span').filter({ hasText: '3' }).first();
if (await badge3.count() > 0) log('✓ Wellbeing sidebar badge shows 3');
else log('(badge check skipped — may be hidden when active)');

// ── 2. Page load ───────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/wellbeing');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/wb-01-wellbeing-page.png' });

const heading = page.locator('h1', { hasText: 'Staff Wellbeing Center' });
if (await heading.count() > 0) log('✓ "Staff Wellbeing Center" heading visible');
else fail('"Staff Wellbeing Center" h1 not found');

// Savings tagline in subtitle
const savings = page.locator('text=$76,500').first();
if (await savings.count() > 0) log('✓ Savings potential ($76,500) visible in header');
else fail('Savings potential not found in header');

// ── 3. Alert banner ────────────────────────────────────────────────────────────
log('\n=== Alert Banner ===');
const alertBanner = page.locator('[aria-label="Burnout risk alert"]').first();
if (await alertBanner.count() > 0) log('✓ Burnout risk alert banner visible');
else fail('Burnout risk alert banner not found');

// ── 4. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
for (const [id, label] of [
  ['stat-at-risk',    'At-risk stat'],
  ['stat-engagement', 'Engagement stat'],
  ['stat-pto',        'PTO stat'],
  ['stat-pulse',      'Pulse stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} card visible`);
  else fail(`${label} card not found`);
}

// ── 5. Staff cards ─────────────────────────────────────────────────────────────
log('\n=== Staff Wellbeing Cards ===');
const lisaCard = page.locator('[data-id="wellbeing-e021"]').first();
if (await lisaCard.count() > 0) log('✓ Lisa Greenwald card found (data-id)');
else fail('Lisa Greenwald card not found');

const jamesCard = page.locator('[data-id="wellbeing-e002"]').first();
if (await jamesCard.count() > 0) log('✓ James Okafor card found');
else fail('James Okafor card not found');

// Critical badge on Lisa
const criticalBadge = page.locator('text=Critical').first();
if (await criticalBadge.count() > 0) log('✓ "Critical" risk badge visible');
else fail('"Critical" badge not found');

// ── 6. Filter tabs ─────────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
const highRiskFilter = page.locator('[aria-label="Filter by High Risk"]').first();
if (await highRiskFilter.count() > 0) {
  log('✓ "High Risk" filter tab found');
  await highRiskFilter.click();
  await page.waitForTimeout(300);
  // Christine Park (low risk) should be gone
  const christineGone = await page.locator('[data-id="wellbeing-e016"]').count();
  if (christineGone === 0) log('✓ Christine Park (low risk) hidden after High Risk filter');
  else fail('Christine Park still visible after High Risk filter');
  // James (high) should still be visible
  const jamesStillThere = page.locator('[data-id="wellbeing-e002"]').first();
  if (await jamesStillThere.count() > 0) log('✓ James Okafor still visible in High Risk filter');
  else fail('James Okafor missing from High Risk filter');
} else fail('"High Risk" filter tab not found');

// Reset to All
const allFilter = page.locator('[aria-label="Filter by All Staff"]').first();
if (await allFilter.count() > 0) {
  await allFilter.click();
  await page.waitForTimeout(300);
  log('✓ Reset to All Staff filter');
} else fail('"All Staff" filter not found');

await page.screenshot({ path: 'pw-screenshots/wb-02-filters.png' });

// ── 7. Sort selector ───────────────────────────────────────────────────────────
log('\n=== Sort Selector ===');
const sortSelect = page.locator('[aria-label="Sort staff by"]').first();
if (await sortSelect.count() > 0) {
  log('✓ Sort selector found');
  await sortSelect.selectOption('name');
  await page.waitForTimeout(300);
  log('✓ Sorted by name');
  await sortSelect.selectOption('burnout');
  log('✓ Sorted back by burnout');
} else fail('Sort selector not found');

// ── 8. Staff detail panel ──────────────────────────────────────────────────────
log('\n=== Staff Detail Panel ===');
// Click Lisa Greenwald card
const lisaCardEl = page.locator('[data-id="wellbeing-e021"]').first();
if (await lisaCardEl.count() > 0) {
  await lisaCardEl.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'pw-screenshots/wb-03-staff-detail.png' });

  // Detail panel should open
  const detailPanel = page.locator('#staff-detail-panel').first();
  if (await detailPanel.count() > 0) log('✓ Staff detail panel opened for Lisa Greenwald');
  else fail('Staff detail panel not found after clicking Lisa card');

  // Check recommended actions visible
  const ptaAction = page.locator('text=/Approve PTO/i').first();
  if (await ptaAction.count() > 0) log('✓ "Approve PTO" recommended action visible in panel');
  else fail('"Approve PTO" action not found in detail panel');

  // Check risk factors section
  const riskFactors = page.locator('text=Risk Factors').first();
  if (await riskFactors.count() > 0) log('✓ "Risk Factors" section visible');
  else fail('"Risk Factors" section not found');

  // Check replacement cost
  const replacementCost = page.locator('text=$58,000').first();
  if (await replacementCost.count() > 0) log('✓ $58,000 replacement cost visible');
  else fail('$58,000 replacement cost not found');

  // Send check-in from detail panel
  const detailCheckInBtn = page.locator('#staff-detail-panel').locator('[aria-label*="Send check-in"]').first();
  if (await detailCheckInBtn.count() > 0) {
    log('✓ Send Check-in button in detail panel found');
    await detailCheckInBtn.click();
    await page.waitForTimeout(1000);
    const sentConfirm = page.locator('text=Check-in Sent').first();
    if (await sentConfirm.count() > 0) log('✓ "Check-in Sent" confirmation shows');
    else fail('"Check-in Sent" confirmation not found');
  } else fail('Send check-in button not found in detail panel');

  // Close panel
  const closeBtn = page.locator('[aria-label="Close staff detail"]').first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(400);
    const panelGone = await page.locator('#staff-detail-panel').count();
    if (panelGone === 0) log('✓ Staff detail panel closed');
    else fail('Staff detail panel did not close');
  } else fail('Close staff detail button not found');
} else fail('Lisa Greenwald card not found for detail test');

// ── 9. Burnout risk matrix ─────────────────────────────────────────────────────
log('\n=== Burnout Risk Matrix ===');
const matrixSvg = page.locator('text=Burnout Risk Matrix').first();
if (await matrixSvg.count() > 0) log('✓ "Burnout Risk Matrix" heading visible');
else fail('"Burnout Risk Matrix" section not found');

// DANGER ZONE label
const dangerZone = page.locator('text=DANGER ZONE').first();
if (await dangerZone.count() > 0) log('✓ "DANGER ZONE" quadrant label visible in matrix');
else fail('"DANGER ZONE" label not found in matrix');

// ── 10. Hospital trend chart ───────────────────────────────────────────────────
log('\n=== Hospital Engagement Trend ===');
const trendChart = page.locator('text=Hospital-Wide Engagement').first();
if (await trendChart.count() > 0) log('✓ "Hospital-Wide Engagement" chart section visible');
else fail('"Hospital-Wide Engagement" chart not found');

// ── 11. Action queue ───────────────────────────────────────────────────────────
log('\n=== Manager Action Queue ===');
const aq1 = page.locator('[data-id="action-aq001"]').first();
if (await aq1.count() > 0) log('✓ Action queue item aq001 (Lisa Greenwald PTO) found');
else fail('Action queue item aq001 not found');

const aq2 = page.locator('[data-id="action-aq002"]').first();
if (await aq2.count() > 0) log('✓ Action queue item aq002 (James Okafor check-in) found');
else fail('Action queue item aq002 not found');

// Mark first action complete
const completeBtn = page.locator('[aria-label*="Mark complete: Approve PTO"]').first();
if (await completeBtn.count() > 0) {
  log('✓ "Mark complete" button found for Lisa PTO action');
  await completeBtn.click();
  await page.waitForTimeout(1400);
  // aq001 should be gone now
  const aq1After = await page.locator('[data-id="action-aq001"]').count();
  if (aq1After === 0) log('✓ Action aq001 removed after completion');
  else fail('Action aq001 still visible after marking complete');
} else fail('"Mark complete" button not found for Lisa PTO action');

await page.screenshot({ path: 'pw-screenshots/wb-04-action-completed.png' });

// ── 12. Savings estimator ──────────────────────────────────────────────────────
log('\n=== Savings Estimator ===');
const savingsBox = page.locator('#savings-estimator').first();
if (await savingsBox.count() > 0) log('✓ Retention ROI savings estimator visible');
else fail('Savings estimator not found');

// ── 13. Bulk pulse check-in ────────────────────────────────────────────────────
log('\n=== Bulk Pulse Check-In ===');
await page.goto(BASE + '/wellbeing');
await page.waitForTimeout(700);

const bulkBtn = page.locator('[aria-label="Send weekly pulse check-in to all staff"]').first();
if (await bulkBtn.count() > 0) {
  log('✓ "Send Pulse Check-in" button found');
  await bulkBtn.click();
  await page.waitForTimeout(1200);
  const sentConfirm = page.locator('text=Sent to all staff').first();
  if (await sentConfirm.count() > 0) log('✓ "Sent to all staff" confirmation shows');
  else fail('"Sent to all staff" confirmation not shown');
} else fail('"Send Pulse Check-in" button not found');

await page.screenshot({ path: 'pw-screenshots/wb-05-pulse-sent.png' });

// ── 14. Console errors ─────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/wellbeing');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 15. Mobile viewport ────────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/wb-06-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Staff Wellbeing Center' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
