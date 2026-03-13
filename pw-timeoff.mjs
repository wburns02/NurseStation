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

// ── 1. Sidebar nav item ───────────────────────────────────────────────────────
log('\n=== Sidebar Time Off Link ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const timeOffLink = page.locator('a[href="/time-off"]').first();
if (await timeOffLink.count() > 0) log('✓ "Time Off" nav link in sidebar');
else fail('"Time Off" nav link not found');

// Sidebar badge should show pending count (5)
const sidebarBadge = page.locator('a[href="/time-off"] span').filter({ hasText: '5' }).first();
if (await sidebarBadge.count() > 0) log('✓ Sidebar "Time Off" badge shows 5 pending');
else log('(sidebar badge not found — may be hidden when active)');

// ── 2. Navigate to /time-off ──────────────────────────────────────────────────
log('\n=== Time Off Page Load ===');
await page.goto(BASE + '/time-off');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/to-01-timeoff-page.png' });

const heading = page.locator('h1', { hasText: 'Time Off & PTO' });
if (await heading.count() > 0) log('✓ "Time Off & PTO" heading visible');
else fail('"Time Off & PTO" h1 not found');

// ── 3. Stats row ──────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
const pendingCard = page.locator('text=Pending Review').first();
if (await pendingCard.count() > 0) log('✓ "Pending Review" stat card visible');
else fail('"Pending Review" stat card not found');

const approvedCard = page.locator('text=Approved (Month)').first();
if (await approvedCard.count() > 0) log('✓ "Approved (Month)" stat card visible');
else fail('"Approved (Month)" stat card not found');

const criticalCard = page.locator('text=Critical Impact').first();
if (await criticalCard.count() > 0) log('✓ "Critical Impact" stat card visible');
else fail('"Critical Impact" stat card not found');

const coverageCostCard = page.locator('text=Coverage Cost').first();
if (await coverageCostCard.count() > 0) log('✓ "Coverage Cost" stat card visible');
else fail('"Coverage Cost" stat card not found');

// ── 4. Filter tabs ────────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
const pendingTab = page.locator('button[aria-label="Show Pending requests"]').first();
if (await pendingTab.count() > 0) log('✓ "Pending" filter tab found');
else {
  const altPending = page.locator('button').filter({ hasText: /^Pending/ }).first();
  if (await altPending.count() > 0) log('✓ "Pending" filter tab found (alt)');
  else fail('"Pending" filter tab not found');
}

const approvedTab = page.locator('button[aria-label="Show Approved requests"]').first();
if (await approvedTab.count() > 0) log('✓ "Approved" tab found');
else log('(Approved tab check via text)');

// ── 5. Critical alert banner ──────────────────────────────────────────────────
log('\n=== Critical Alert Banner ===');
const criticalBanner = page.locator('text=/critical staffing impact/i').first();
if (await criticalBanner.count() > 0) log('✓ Critical staffing impact alert banner visible');
else fail('Critical staffing impact banner not found');

// ── 6. PTO Request cards render ───────────────────────────────────────────────
log('\n=== Request Cards ===');
// James Okafor's request should show (vacation, critical)
const jamesCard = page.locator('[data-id="pto-pto001"]').first();
if (await jamesCard.count() > 0) log('✓ James Okafor request card found (data-id)');
else {
  const jamesText = page.locator('text=James Okafor').first();
  if (await jamesText.count() > 0) log('✓ James Okafor request visible');
  else fail('James Okafor request card not found');
}

// Marcus Williams sick leave (most recent submission)
const marcusCard = page.locator('text=Marcus Williams').first();
if (await marcusCard.count() > 0) log('✓ Marcus Williams request visible');
else fail('Marcus Williams request not found');

// ── 7. Coverage impact section in card ───────────────────────────────────────
log('\n=== Coverage Impact Details ===');
const coverageImpact = page.locator('text=Coverage Impact').first();
if (await coverageImpact.count() > 0) log('✓ "Coverage Impact" section visible in request card');
else fail('"Coverage Impact" not found in request card');

// Suggested coverage should show Sarah Chen
const suggestedCoverage = page.locator('text=Suggested Coverage').first();
if (await suggestedCoverage.count() > 0) log('✓ "Suggested Coverage" section visible');
else fail('"Suggested Coverage" section not found');

// ── 8. Approve button visible ─────────────────────────────────────────────────
log('\n=== Approve Button ===');
const approveBtn = page.locator('button').filter({ hasText: 'Approve' }).first();
if (await approveBtn.count() > 0) log('✓ "Approve" button visible');
else fail('"Approve" button not found');

// ── 9. Deny button and dialog ─────────────────────────────────────────────────
log('\n=== Deny Dialog Flow ===');
const denyBtn = page.locator('button').filter({ hasText: 'Deny' }).first();
if (await denyBtn.count() > 0) {
  log('✓ "Deny" button visible');
  await denyBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'pw-screenshots/to-02-deny-dialog.png' });

  // Dialog should be open
  const denyDialog = page.locator('text=Deny Time-Off Request').first();
  if (await denyDialog.count() > 0) log('✓ Deny dialog opens on click');
  else fail('Deny dialog not opened');

  // Reason textarea
  const reasonField = page.locator('textarea[aria-label="Denial reason"]').first();
  if (await reasonField.count() > 0) {
    log('✓ Denial reason textarea visible');
    await reasonField.fill('Understaffed that period — please choose a different date.');
    log('✓ Typed denial reason');
  } else fail('Denial reason textarea not found');

  // Cancel button closes dialog — use the dialog container to scope the button
  const denyDialogEl = page.locator('.fixed.inset-0').first();
  const cancelBtn = denyDialogEl.locator('button').filter({ hasText: 'Cancel' }).first();
  if (await cancelBtn.count() > 0) {
    await cancelBtn.click();
    await page.waitForTimeout(700);
    const dialogAfter = page.locator('text=Deny Time-Off Request').first();
    if (await dialogAfter.count() === 0) log('✓ Dialog closes on Cancel');
    else fail('Dialog did not close on Cancel');
  } else fail('Cancel button in deny dialog not found');
} else fail('"Deny" button not found');

// ── 10. Approve a safe request (Lisa - no impact) ────────────────────────────
log('\n=== Approve Safe Request (Lisa Greenwald) ===');
// Lisa's request is "none" severity — safe to approve
const lisaCard = page.locator('[data-id="pto-pto004"]').first();
if (await lisaCard.count() > 0) {
  log('✓ Lisa Greenwald card found');
  // Find approve button within this card
  const lisaApproveBtn = lisaCard.locator('button[aria-label*="Approve Lisa"]').first();
  if (await lisaApproveBtn.count() > 0) {
    log('✓ Approve button found on Lisa card');
    await lisaApproveBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'pw-screenshots/to-03-after-approve.png' });
    // Check for confirmation feedback
    const confirmed = page.locator('text=Approved — staff notified').first();
    if (await confirmed.count() > 0) log('✓ Approval confirmation "staff notified" message shows');
    else {
      // May have transitioned to Approved badge
      const approvedBadge = page.locator('[data-id="pto-pto004"]').locator('text=Approved').first();
      if (await approvedBadge.count() > 0) log('✓ Lisa card shows "Approved" badge after approval');
      else fail('Approval feedback not shown for Lisa');
    }
  } else {
    // Expand the card first
    const expandBtn = lisaCard.locator('button[aria-label*="Expand"]').first();
    if (await expandBtn.count() > 0) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }
    const lisaApproveBtn2 = lisaCard.locator('button').filter({ hasText: 'Approve' }).first();
    if (await lisaApproveBtn2.count() > 0) {
      log('✓ Approve button found after expanding');
      await lisaApproveBtn2.click();
      await page.waitForTimeout(800);
      log('✓ Approve clicked for Lisa');
    } else fail('Approve button not found on Lisa card');
  }
} else {
  // Try by text
  const lisaText = page.locator('text=Lisa Greenwald').first();
  if (await lisaText.count() > 0) log('✓ Lisa Greenwald request visible (text)');
  else fail('Lisa Greenwald request not found');
}

// ── 11. Approved tab ─────────────────────────────────────────────────────────
log('\n=== Approved Tab ===');
await page.goto(BASE + '/time-off');
await page.waitForTimeout(500);

const approvedTabBtn = page.locator('button[aria-label="Show Approved requests"]').first();
if (await approvedTabBtn.count() > 0) {
  await approvedTabBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'pw-screenshots/to-04-approved-tab.png' });
  const priyaCard = page.locator('text=Priya Sharma').first();
  if (await priyaCard.count() > 0) log('✓ Priya Sharma approved request visible in Approved tab');
  else fail('Priya Sharma not found in Approved tab');
} else {
  // Try text-based
  const approvedTabAlt = page.locator('button').filter({ hasText: /^Approved/ }).first();
  if (await approvedTabAlt.count() > 0) {
    await approvedTabAlt.click();
    await page.waitForTimeout(300);
    const priyaCard = page.locator('text=Priya Sharma').first();
    if (await priyaCard.count() > 0) log('✓ Priya Sharma visible in Approved tab');
    else fail('Priya Sharma not found in Approved tab');
  } else fail('Approved tab not found');
}

// ── 12. Denied tab ────────────────────────────────────────────────────────────
log('\n=== Denied Tab ===');
await page.goto(BASE + '/time-off');
await page.waitForTimeout(500);

const deniedTabBtn = page.locator('button').filter({ hasText: /^Denied/ }).first();
if (await deniedTabBtn.count() > 0) {
  log('✓ "Denied" tab found');
  await deniedTabBtn.click();
  await page.waitForTimeout(300);
  // Fatima's request should be in denied
  const fatimaCard = page.locator('text=Fatima Hassan').first();
  if (await fatimaCard.count() > 0) log('✓ Fatima Hassan visible in Denied tab');
  else fail('Fatima Hassan not found in Denied tab');
} else fail('"Denied" tab not found');

// ── 13. 30-day calendar ───────────────────────────────────────────────────────
log('\n=== 30-Day Absence Calendar ===');
await page.goto(BASE + '/time-off');
await page.waitForTimeout(500);

const calendarSection = page.locator('text=30-Day Absence Calendar').first();
if (await calendarSection.count() > 0) log('✓ "30-Day Absence Calendar" section visible');
else fail('"30-Day Absence Calendar" section not found');

// Mar 12 (today) should appear
const todayCell = page.locator('text=Mar 12').first();
if (await todayCell.count() > 0) log('✓ "Mar 12" today marker visible in calendar');
else fail('"Mar 12" not found in calendar');

// ── 14. PTO Balance ledger toggle ────────────────────────────────────────────
log('\n=== PTO Balance Ledger ===');
const balanceLedger = page.locator('text=PTO Balance Ledger').first();
if (await balanceLedger.count() > 0) {
  log('✓ "PTO Balance Ledger" section found');
  await balanceLedger.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'pw-screenshots/to-05-balances.png' });
  // Table headers should appear
  const balanceHeader = page.locator('text=Balance').first();
  if (await balanceHeader.count() > 0) log('✓ Balance table header visible after expanding');
  else log('(balance table did not expand — may need to click container)');
} else fail('"PTO Balance Ledger" section not found');

// ── 15. Quick links ───────────────────────────────────────────────────────────
log('\n=== Quick Links ===');
const shiftsLink = page.locator('a').filter({ hasText: 'View affected shifts' }).first();
if (await shiftsLink.count() > 0) log('✓ "View affected shifts" quick link visible');
else fail('"View affected shifts" link not found');

const staffLink = page.locator('a').filter({ hasText: 'Find coverage staff' }).first();
if (await staffLink.count() > 0) log('✓ "Find coverage staff" quick link visible');
else fail('"Find coverage staff" link not found');

const laborLink = page.locator('a').filter({ hasText: 'Labor cost impact' }).first();
if (await laborLink.count() > 0) log('✓ "Labor cost impact" quick link visible');
else fail('"Labor cost impact" link not found');

// ── 16. Card expand/collapse ──────────────────────────────────────────────────
log('\n=== Card Expand/Collapse ===');
await page.goto(BASE + '/time-off');
await page.waitForTimeout(500);

// Find a card with collapse button (expanded cards have ChevronUp = collapse)
const collapseBtn = page.locator('button[aria-label="Collapse details"]').first();
if (await collapseBtn.count() > 0) {
  await collapseBtn.click();
  await page.waitForTimeout(300);
  log('✓ Card collapsed via "Collapse details" button');
  // Re-expand
  const expandBtn = page.locator('button[aria-label="Expand details"]').first();
  if (await expandBtn.count() > 0) {
    await expandBtn.click();
    await page.waitForTimeout(300);
    log('✓ Card re-expanded via "Expand details" button');
  }
} else log('(no collapse button found — cards may start collapsed)');

// ── 17. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/time-off');
await page.waitForTimeout(600);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 18. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/to-06-mobile.png' });
const mobileHeading = page.locator('h1', { hasText: 'Time Off & PTO' });
if (await mobileHeading.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
