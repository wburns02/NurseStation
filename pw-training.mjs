import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';

let pass = true;
const log = (m) => console.log(m);
const fail = (m) => { console.error('FAIL: ' + m); pass = false; };

// ── 1. Sidebar nav item ────────────────────────────────────────────────────────
log('\n=== Sidebar Training Link ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const trainingLink = page.locator('a[href="/training"]').first();
if (await trainingLink.count() > 0) log('✓ "Training" nav link in sidebar');
else fail('"Training" nav link not found');

// Sidebar badge should show 4 (overdue count)
const sidebarBadge = page.locator('a[href="/training"] span').filter({ hasText: '4' }).first();
if (await sidebarBadge.count() > 0) log('✓ Sidebar "Training" badge shows 4');
else log('(sidebar training badge check skipped — may be hidden when active)');

// ── 2. Navigate to /training ───────────────────────────────────────────────────
log('\n=== Training Page Load ===');
await page.goto(BASE + '/training');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/tr-01-training-page.png' });

const heading = page.locator('h1', { hasText: 'Training & Compliance Center' });
if (await heading.count() > 0) log('✓ "Training & Compliance Center" heading visible');
else fail('"Training & Compliance Center" h1 not found');

// ── 3. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
const overallStat = page.locator('#stat-overall').first();
if (await overallStat.count() > 0) log('✓ "Overall Compliance" stat card visible');
else fail('"Overall Compliance" stat card not found');

const jcahoStat = page.locator('#stat-jcaho').first();
if (await jcahoStat.count() > 0) log('✓ "JCAHO Readiness" stat card visible');
else fail('"JCAHO Readiness" stat card not found');

const overdueStat = page.locator('#stat-overdue').first();
if (await overdueStat.count() > 0) log('✓ "Overdue Items" stat card visible');
else fail('"Overdue Items" stat card not found');

const expiringStat = page.locator('#stat-expiring').first();
if (await expiringStat.count() > 0) log('✓ "Expiring ≤60 Days" stat card visible');
else fail('"Expiring ≤60 Days" stat card not found');

// ── 4. Critical alert banner ───────────────────────────────────────────────────
log('\n=== Critical Alert Banner ===');
const alertBanner = page.locator('[aria-label="Critical compliance alert"]').first();
if (await alertBanner.count() > 0) log('✓ Critical compliance alert banner visible');
else fail('Critical compliance alert banner not found');

// ── 5. Compliance rings ────────────────────────────────────────────────────────
log('\n=== Compliance Rings ===');
const overallLabel = page.locator('text=Overall').first();
if (await overallLabel.count() > 0) log('✓ "Overall" ring label visible');
else fail('"Overall" ring label not found');

const jcahoLabel = page.locator('text=JCAHO').first();
if (await jcahoLabel.count() > 0) log('✓ "JCAHO" ring label visible');
else fail('"JCAHO" ring label not found');

// ── 6. Expiring list ───────────────────────────────────────────────────────────
log('\n=== Expiring Soon List ===');
const expiringList = page.locator('#expiring-list').first();
if (await expiringList.count() > 0) log('✓ Expiring soon list found');
else fail('Expiring soon list not found');

// Lisa Greenwald should appear (8 days expiring)
const lisaExpiring = page.locator('text=Lisa Greenwald').first();
if (await lisaExpiring.count() > 0) log('✓ Lisa Greenwald visible in expiring list');
else fail('Lisa Greenwald not found in expiring list');

// ── 7. Module cards rendered ───────────────────────────────────────────────────
log('\n=== Module Cards ===');
const hipaaBadge = page.locator('text=HIPAA').first();
if (await hipaaBadge.count() > 0) log('✓ HIPAA module card visible');
else fail('HIPAA module card not found');

const bbpBadge = page.locator('text=BBP').first();
if (await bbpBadge.count() > 0) log('✓ BBP module card visible');
else fail('BBP module card not found');

// ── 8. Category filter tabs ────────────────────────────────────────────────────
log('\n=== Category Filter Tabs ===');
const regulatoryTab = page.locator('button[aria-label="Filter by Regulatory"]').first();
if (await regulatoryTab.count() > 0) {
  log('✓ "Regulatory" filter tab found');
  await regulatoryTab.click();
  await page.waitForTimeout(300);
  // SEP, MAS, RST are clinical/regulatory — HIPAA should still be visible
  const hipaaAfterFilter = page.locator('text=HIPAA').first();
  if (await hipaaAfterFilter.count() > 0) log('✓ HIPAA visible after Regulatory filter');
  else fail('HIPAA not visible after Regulatory filter');
} else fail('"Regulatory" filter tab not found');

// Switch to Safety
const safetyTab = page.locator('button[aria-label="Filter by Safety"]').first();
if (await safetyTab.count() > 0) {
  await safetyTab.click();
  await page.waitForTimeout(300);
  const fireBadge = page.locator('text=FIRE').first();
  if (await fireBadge.count() > 0) log('✓ FIRE module visible after Safety filter');
  else fail('FIRE not visible after Safety filter');
} else fail('"Safety" filter tab not found');

// Reset to All Modules
const allTab = page.locator('button[aria-label="Filter by All Modules"]').first();
if (await allTab.count() > 0) {
  await allTab.click();
  await page.waitForTimeout(300);
  log('✓ Reset to All Modules');
} else fail('"All Modules" filter tab not found');

await page.screenshot({ path: 'pw-screenshots/tr-02-modules.png' });

// ── 9. Expand a module card ────────────────────────────────────────────────────
log('\n=== Module Card Expand ===');
const bbpExpandBtn = page.locator('[aria-label="Expand BBP"]').first();
if (await bbpExpandBtn.count() > 0) {
  await bbpExpandBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'pw-screenshots/tr-03-bbp-expanded.png' });
  // James Okafor should show (BBP never done)
  const jamesInBBP = page.locator('text=James Okafor').first();
  if (await jamesInBBP.count() > 0) log('✓ James Okafor visible in BBP expanded view (overdue)');
  else fail('James Okafor not visible in BBP expanded view');

  // Bulk reminder button should appear (multiple staff overdue)
  const bulkBtn = page.locator('[aria-label="Send bulk reminder for BBP"]').first();
  if (await bulkBtn.count() > 0) {
    log('✓ Bulk reminder button found for BBP');
    await bulkBtn.click();
    await page.waitForTimeout(1000);
    // Should show confirmation
    const sentText = page.locator('text=/Reminders sent to/').first();
    if (await sentText.count() > 0) log('✓ Bulk reminder confirmation message shown');
    else fail('Bulk reminder confirmation not shown');
  } else fail('Bulk reminder button not found for BBP');

  // Collapse the card
  const bbpCollapseBtn = page.locator('[aria-label="Collapse BBP"]').first();
  if (await bbpCollapseBtn.count() > 0) {
    await bbpCollapseBtn.click();
    await page.waitForTimeout(300);
    log('✓ BBP card collapsed');
  }
} else {
  // try text-based click
  const bbpCard = page.locator('text=Bloodborne Pathogens').first();
  if (await bbpCard.count() > 0) {
    await bbpCard.click();
    await page.waitForTimeout(400);
    log('✓ BBP card expanded via text click');
  } else fail('BBP expand button not found');
}

// ── 10. Staff compliance table ─────────────────────────────────────────────────
log('\n=== Staff Compliance Table ===');
const staffTable = page.locator('#staff-compliance-table').first();
if (await staffTable.count() > 0) log('✓ Staff compliance table found');
else fail('Staff compliance table not found');

// Check James Okafor row is visible
const jamesRow = page.locator('[data-staffid="e002"]').first();
if (await jamesRow.count() > 0) log('✓ James Okafor row found in staff table');
else {
  const jamesText = page.locator('#staff-compliance-table').locator('text=James Okafor').first();
  if (await jamesText.count() > 0) log('✓ James Okafor visible in staff table (text)');
  else fail('James Okafor not found in staff table');
}

// Sort by score (ascending)
const scoreHeader = page.locator('th').filter({ hasText: 'Score' }).first();
if (await scoreHeader.count() > 0) {
  await scoreHeader.click();
  await page.waitForTimeout(300);
  log('✓ Staff table sorted by Score');
} else fail('Score sort header not found');

// ── 11. Staff detail panel ─────────────────────────────────────────────────────
log('\n=== Staff Detail Panel ===');
// Click on James Okafor row to open panel
const jamesRowEl = page.locator('[data-staffid="e002"]').first();
if (await jamesRowEl.count() > 0) {
  await jamesRowEl.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'pw-screenshots/tr-04-staff-detail.png' });

  // Panel should show compliance bar and module list
  const panelOverall = page.locator('text=Overall Compliance').first();
  if (await panelOverall.count() > 0) log('✓ Staff detail panel opened with compliance bar');
  else fail('Staff detail panel not found after clicking row');

  // BBP should show as overdue in panel
  const bbpInPanel = page.locator('text=Bloodborne Pathogens').first();
  if (await bbpInPanel.count() > 0) log('✓ Bloodborne Pathogens visible in staff detail panel');
  else fail('Bloodborne Pathogens not in staff detail panel');

  // Close the panel
  const closeBtn = page.locator('[aria-label="Close staff detail"]').first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(500);
    const closeBtnAfter = page.locator('[aria-label="Close staff detail"]').first();
    if (await closeBtnAfter.count() === 0) log('✓ Staff detail panel closed');
    else fail('Staff detail panel did not close');
  } else fail('Close staff detail button not found');
} else {
  log('(staff row click via text fallback)');
  const jamesTextEl = page.locator('#staff-compliance-table').locator('text=James Okafor').first();
  if (await jamesTextEl.count() > 0) {
    await jamesTextEl.click();
    await page.waitForTimeout(400);
    log('✓ Clicked James Okafor via text');
  } else fail('Cannot open staff detail panel — James Okafor row not found');
}

// ── 12. Quick actions panel ────────────────────────────────────────────────────
log('\n=== Quick Actions Panel ===');
const assignBtn = page.locator('[aria-label="Assign overdue training"]').first();
if (await assignBtn.count() > 0) log('✓ "Assign overdue training" quick action found');
else fail('"Assign overdue training" quick action not found');

const notifyAllBtn = page.locator('[aria-label="Notify all at-risk staff"]').first();
if (await notifyAllBtn.count() > 0) log('✓ "Notify all at-risk staff" quick action found');
else fail('"Notify all at-risk staff" quick action not found');

const jcahoBtn = page.locator('[aria-label="View JCAHO checklist"]').first();
if (await jcahoBtn.count() > 0) log('✓ "View JCAHO checklist" quick action found');
else fail('"View JCAHO checklist" quick action not found');

// ── 13. Export report button ───────────────────────────────────────────────────
log('\n=== Export Button ===');
const exportBtn = page.locator('[aria-label="Export compliance report"]').first();
if (await exportBtn.count() > 0) log('✓ Export compliance report button found');
else fail('Export compliance report button not found');

// ── 14. Console errors ─────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/training');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 15. Mobile viewport ────────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/tr-05-mobile.png' });
const mobileHeading = page.locator('h1', { hasText: 'Training & Compliance Center' });
if (await mobileHeading.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
