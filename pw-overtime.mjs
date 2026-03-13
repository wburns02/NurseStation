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

// ── 1. Sidebar nav ──────────────────────────────────────────────────────────
log('\n=== Sidebar Nav ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const otLink = page.locator('a[href="/overtime"]').first();
if (await otLink.count() > 0) log('✓ "OT Approvals" nav link found');
else fail('"OT Approvals" nav link not found');

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/overtime');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/ot-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Overtime Approval' });
if (await h1.count() > 0) log('✓ "Overtime Approval" heading visible');
else fail('"Overtime Approval" h1 not found');

// ── 3. Stats bar ─────────────────────────────────────────────────────────────
log('\n=== Stats Bar ===');
for (const [id, label] of [
  ['stat-pending',   'Pending stat'],
  ['stat-approved',  'Approved stat'],
  ['stat-cost',      'Approved Cost stat'],
  ['stat-escalated', 'Escalated stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 4. Budget gauge ─────────────────────────────────────────────────────────
log('\n=== Budget Gauge ===');
const budgetGauge = page.locator('#budget-gauge').first();
if (await budgetGauge.count() > 0) log('✓ Budget gauge visible');
else fail('Budget gauge (#budget-gauge) not found');

// ── 5. OT request cards ─────────────────────────────────────────────────────
log('\n=== OT Request Cards ===');
for (const [id, name] of [
  ['ot-001', 'James Okafor'],
  ['ot-002', 'Sarah Mitchell'],
  ['ot-003', 'Natasha Perkins'],
  ['ot-004', 'Francesca Holt (escalated)'],
]) {
  const card = page.locator(`[data-id="ot-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ OT card "${name}" visible`);
  else fail(`OT card "${name}" not found (data-id="ot-card-${id}")`);
}

// ── 6. Predictive alerts ────────────────────────────────────────────────────
log('\n=== Predictive Alerts ===');
for (const [id, name] of [
  ['pred-01', 'Fatima Hassan'],
  ['pred-02', 'Camille Portier'],
  ['pred-03', 'Nathan Foster'],
]) {
  const card = page.locator(`[data-id="pred-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ Predictive alert "${name}" visible`);
  else fail(`Predictive alert "${name}" not found (data-id="pred-card-${id}")`);
}

// ── 7. Approve a request ────────────────────────────────────────────────────
log('\n=== Approve Request ===');
const approveBtn = page.locator('[aria-label="Approve request ot-001"]').first();
if (await approveBtn.count() > 0) {
  log('✓ Approve button for ot-001 found');
  await approveBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'pw-screenshots/ot-02-approved.png' });

  // Button should show "Approved!" state (card stays visible for ~1.4s after approval)
  const approvedText = page.locator('[data-id="ot-card-ot-001"]').locator('text=Approved!').first();
  if (await approvedText.count() > 0) log('✓ "Approved!" shown on card');
  else fail('"Approved!" text not found on card after approval');
} else fail('Approve button for ot-001 not found');

// ── 8. Deny a request ───────────────────────────────────────────────────────
log('\n=== Deny Request ===');
const denyBtn = page.locator('[aria-label="Deny request ot-002"]').first();
if (await denyBtn.count() > 0) {
  log('✓ Deny button for ot-002 found');
  await denyBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ot-03-deny-modal.png' });

  const denyModal = page.locator('#deny-modal').first();
  if (await denyModal.count() > 0) {
    log('✓ Deny modal opened');

    const confirmBtn = page.locator('[aria-label="Confirm deny ot-002"]').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: 'pw-screenshots/ot-04-denied.png' });

      // Modal should be gone
      const modalGone = await page.locator('#deny-modal').count();
      if (modalGone === 0) log('✓ Deny modal closed after confirm');
      else fail('Deny modal should close after confirm');
    } else fail('Confirm deny button not found');
  } else fail('Deny modal did not open');
} else fail('Deny button for ot-002 not found');

// ── 9. Escalate button on ot-004 (ED / census surge) ───────────────────────
log('\n=== Escalate Request ===');
const escBtn = page.locator('[aria-label="Escalate request ot-004"]').first();
if (await escBtn.count() > 0) {
  log('✓ Escalate button for ot-004 found');
  await escBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'pw-screenshots/ot-05-escalated.png' });
  log('✓ Escalate action fired');
} else fail('Escalate button for ot-004 not found');

// ── 10. Close deny modal via X ──────────────────────────────────────────────
log('\n=== Close Deny Modal ===');
const denyBtn3 = page.locator('[aria-label="Deny request ot-003"]').first();
if (await denyBtn3.count() > 0) {
  await denyBtn3.click();
  await page.waitForTimeout(400);
  const modal3 = page.locator('#deny-modal').first();
  if (await modal3.count() > 0) {
    const closeX = page.locator('[aria-label="Close deny modal"]').first();
    if (await closeX.count() > 0) {
      await closeX.click();
      await page.waitForTimeout(700);
      const modalGone = await page.locator('#deny-modal').count();
      if (modalGone === 0) log('✓ Deny modal closes via X button');
      else fail('Deny modal should close via X button');
    } else fail('Close deny modal X button not found');
  } else fail('Deny modal did not open for ot-003');
} else fail('Deny button for ot-003 not found');

// ── 11. Tab switching ───────────────────────────────────────────────────────
log('\n=== Tab Switching ===');
// Switch to History tab
const histTab = page.locator('[aria-label="Tab History"]').first();
if (await histTab.count() > 0) {
  await histTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ot-06-history.png' });

  // Should show approved cards (ot-005, ot-006, ot-007)
  const approvedCard = page.locator('[data-id="ot-card-ot-005"]').first();
  if (await approvedCard.count() > 0) log('✓ Approved cards visible in History tab');
  else fail('Approved cards (ot-005) not found in History tab');
  log('✓ History tab switch works');
} else fail('History tab button not found');

// Switch to All tab
const allTab = page.locator('[aria-label="Tab All"]').first();
if (await allTab.count() > 0) {
  await allTab.click();
  await page.waitForTimeout(500);
  log('✓ All tab switch works');
} else fail('All tab button not found');

// ── 12. Unit filter ─────────────────────────────────────────────────────────
log('\n=== Unit Filter ===');
const unitFilter = page.locator('[aria-label="Filter by unit"]').first();
if (await unitFilter.count() > 0) {
  log('✓ Unit filter found');
  await unitFilter.selectOption('ICU');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ot-07-unit-filter.png' });

  // MS-B cards should be gone when ICU filter is active
  const msbCard = await page.locator('[data-id="ot-card-ot-002"]').isVisible().catch(() => false);
  if (!msbCard) log('✓ MS-B cards hidden when ICU filter active');
  else fail('MS-B card should be hidden when ICU filter is active');

  // Reset filter
  await unitFilter.selectOption('all');
  await page.waitForTimeout(400);
} else fail('Unit filter select not found');

// ── 13. Batch approve ───────────────────────────────────────────────────────
log('\n=== Batch Approve All ===');
// Navigate fresh to get clean pending state
await page.goto(BASE + '/overtime');
await page.waitForTimeout(700);

const batchBtn = page.locator('[aria-label="Batch approve all pending"]').first();
if (await batchBtn.count() > 0) {
  log('✓ Batch Approve button found');
  await batchBtn.click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'pw-screenshots/ot-08-batch-approved.png' });

  // Should show "All Approved!" text
  const allApprovedText = page.locator('text=All Approved!').first();
  if (await allApprovedText.count() > 0) log('✓ "All Approved!" shown after batch approve');
  else fail('"All Approved!" text not found after batch approve');
} else fail('Batch Approve button not found (may have no pending items)');

// ── 14. Unit cost breakdown rows ────────────────────────────────────────────
log('\n=== Unit Cost Breakdown ===');
for (const unit of ['icu', 'ms-b', 'ed', 'ccu', 'onc']) {
  const row = page.locator(`#unit-row-${unit}`).first();
  if (await row.count() > 0) log(`✓ Unit cost row "${unit.toUpperCase()}" visible`);
  else fail(`Unit cost row "${unit.toUpperCase()}" not found (#unit-row-${unit})`);
}

// ── 15. Policy reference section ────────────────────────────────────────────
log('\n=== Policy & Methodology ===');
const policy = page.locator('#ot-policy').first();
if (await policy.count() > 0) log('✓ OT policy reference visible');
else fail('OT policy section (#ot-policy) not found');

const methodology = page.locator('#ot-methodology').first();
if (await methodology.count() > 0) log('✓ Methodology section visible');
else fail('Methodology section (#ot-methodology) not found');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/overtime');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/ot-09-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Overtime Approval' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
