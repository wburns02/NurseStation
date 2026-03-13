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
log('\n=== Sidebar Labor Cost Link ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const laborLink = page.locator('a[href="/labor"]').first();
if (await laborLink.count() > 0) log('✓ "Labor Cost" nav link in sidebar');
else fail('"Labor Cost" nav link not found in sidebar');

// ── 2. Navigate to /labor ─────────────────────────────────────────────────────
log('\n=== Labor Intelligence Page Load ===');
await page.goto(BASE + '/labor');
await page.waitForTimeout(800); // wait for loading skeleton to clear
await page.screenshot({ path: 'pw-screenshots/lb-01-labor-page.png' });

const heading = page.locator('h1', { hasText: 'Labor Intelligence' });
if (await heading.count() > 0) log('✓ "Labor Intelligence" heading visible');
else fail('"Labor Intelligence" h1 not found');

// ── 3. Loading skeleton → real content ───────────────────────────────────────
log('\n=== Loading State & Content ===');
// After 800ms the skeleton should have cleared
const statCards = page.locator('text=Today Projected').first();
if (await statCards.count() > 0) log('✓ "Today Projected" stat card visible (skeleton cleared)');
else fail('"Today Projected" stat card not found after loading');

// ── 4. Top stats row ──────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
const weekVariance = page.locator('text=Week Variance').first();
if (await weekVariance.count() > 0) log('✓ "Week Variance" stat card visible');
else fail('"Week Variance" stat card not found');

const otPremium = page.locator('text=OT Premium Cost').first();
if (await otPremium.count() > 0) log('✓ "OT Premium Cost" stat card visible');
else fail('"OT Premium Cost" stat card not found');

const openGaps = page.locator('text=Open Gaps').first();
if (await openGaps.count() > 0) log('✓ "Open Gaps" stat card visible');
else fail('"Open Gaps" stat card not found');

// ── 5. Today's spend ring ─────────────────────────────────────────────────────
log("\n=== Today's Spend Ring ===");
const spendRing = page.locator("text=Today's Labor Spend").first();
if (await spendRing.count() > 0) log("✓ \"Today's Labor Spend\" section visible");
else fail("\"Today's Labor Spend\" section not found");

// The ring shows "of budget" text
const budgetText = page.locator('text=of budget').first();
if (await budgetText.count() > 0) log('✓ "of budget" text visible in spend ring');
else fail('Spend ring budget text not found');

// ── 6. Cost type breakdown ────────────────────────────────────────────────────
log('\n=== Cost Breakdown ===');
const regularPay = page.locator('text=Regular Pay').first();
if (await regularPay.count() > 0) log('✓ "Regular Pay" breakdown row visible');
else fail('"Regular Pay" row not found');

const otBreakdown = page.locator('text=OT Premium').first();
if (await otBreakdown.count() > 0) log('✓ "OT Premium" breakdown row visible');
else fail('"OT Premium" breakdown row not found');

// ── 7. Gap Cost Optimizer section ─────────────────────────────────────────────
log('\n=== Gap Cost Optimizer ===');
const gapOptSection = page.locator('text=Gap Cost Optimizer').first();
if (await gapOptSection.count() > 0) log('✓ "Gap Cost Optimizer" section visible');
else fail('"Gap Cost Optimizer" section not found');

// ICU gap should be visible
const icuGap = page.locator('text=ICU').first();
if (await icuGap.count() > 0) log('✓ ICU gap visible in optimizer');
else fail('ICU gap not found in Gap Cost Optimizer');

// ── 8. Fill options with recommended badge ────────────────────────────────────
log('\n=== Fill Option Details ===');
const recommendedBadge = page.locator('text=Recommended').first();
if (await recommendedBadge.count() > 0) log('✓ "Recommended" badge visible on an option');
else fail('"Recommended" badge not found');

const cheapestBadge = page.locator('text=Cheapest').first();
if (await cheapestBadge.count() > 0) log('✓ "Cheapest" badge visible on an option');
else fail('"Cheapest" badge not found');

// Request button
const requestBtn = page.locator('button').filter({ hasText: 'Request' }).first();
if (await requestBtn.count() > 0) log('✓ "Request" button visible on fill option');
else fail('"Request" button not found on fill option');

// ── 9. Click Request on first option ─────────────────────────────────────────
log('\n=== Request Fill Action ===');
await requestBtn.click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/lb-02-after-request.png' });

// After click, should see "Coverage requested" text
const reqSent = page.locator('text=Coverage requested').first();
if (await reqSent.count() > 0) log('✓ "Coverage requested" feedback appears after clicking Request');
else {
  // Maybe it shows "requests sent" in summary
  const altSent = page.locator('text=/request.* sent/i').first();
  if (await altSent.count() > 0) log('✓ Coverage request sent feedback visible');
  else fail('"Coverage requested" feedback not found after Request click');
}

// ── 10. Fill All button ───────────────────────────────────────────────────────
log('\n=== Fill All Button ===');
await page.goto(BASE + '/labor');
await page.waitForTimeout(800);

const fillAllBtn = page.locator('button').filter({ hasText: /Fill All/ }).first();
if (await fillAllBtn.count() > 0) {
  log('✓ "Fill All" button visible');
  const btnText = await fillAllBtn.textContent();
  log(`  Button text: "${btnText?.trim()}"`);
  await fillAllBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/lb-03-all-filled.png' });
  // After fill all, gaps should show empty state
  const allFilledMsg = page.locator('text=All gaps filled').first();
  if (await allFilledMsg.count() > 0) log('✓ "All gaps filled" empty state shown');
  else fail('"All gaps filled" message not shown after Fill All');
} else fail('"Fill All" button not found');

// ── 11. Unit Cost Breakdown table ─────────────────────────────────────────────
log('\n=== Unit Cost Table ===');
await page.goto(BASE + '/labor');
await page.waitForTimeout(800);

const unitTable = page.locator('text=Unit Cost Breakdown').first();
if (await unitTable.count() > 0) log('✓ "Unit Cost Breakdown" table section visible');
else fail('"Unit Cost Breakdown" section not found');

// ICU should appear in table
const icuInTable = page.locator('td', { hasText: 'ICU' }).first();
if (await icuInTable.count() > 0) log('✓ ICU row visible in unit cost table');
else fail('ICU not found in unit cost table');

// ── 12. Sort table by Variance ────────────────────────────────────────────────
log('\n=== Unit Table Sorting ===');
const varianceSort = page.locator('button[aria-label="Sort by variance"]').first();
if (await varianceSort.count() > 0) {
  log('✓ Variance sort button found');
  await varianceSort.click();
  await page.waitForTimeout(200);
  log('✓ Variance sort applied');
} else {
  // Try by text
  const varBtn = page.locator('button').filter({ hasText: 'Variance' }).first();
  if (await varBtn.count() > 0) {
    log('✓ Variance sort button found (by text)');
    await varBtn.click();
    await page.waitForTimeout(200);
  } else fail('Variance sort button not found');
}

const spendSort = page.locator('button').filter({ hasText: 'Spend' }).first();
if (await spendSort.count() > 0) {
  log('✓ "Spend" sort button found');
  await spendSort.click();
  await page.waitForTimeout(200);
  log('✓ Spend sort applied');
} else fail('"Spend" sort button not found');

// ── 13. OT Exposure leaderboard ───────────────────────────────────────────────
log('\n=== OT Exposure Leaderboard ===');
const otSection = page.locator('text=OT Exposure').first();
if (await otSection.count() > 0) log('✓ "OT Exposure" section visible');
else fail('"OT Exposure" section not found');

const jamesOT = page.locator('text=James Okafor').first();
if (await jamesOT.count() > 0) log('✓ James Okafor visible in OT leaderboard');
else fail('James Okafor not found in OT leaderboard');

const christineOT = page.locator('text=Christine Park').first();
if (await christineOT.count() > 0) log('✓ Christine Park visible in OT leaderboard');
else fail('Christine Park not found in OT leaderboard');

// ── 14. 14-day trend chart ────────────────────────────────────────────────────
log('\n=== 14-Day Cost Trend Chart ===');
const trendSection = page.locator('text=14-Day Cost Trend').first();
if (await trendSection.count() > 0) log('✓ "14-Day Cost Trend" chart section visible');
else fail('"14-Day Cost Trend" section not found');

// SVG should exist
const trendSvg = page.locator('svg').nth(2);
if (await trendSvg.count() > 0) log('✓ Trend chart SVG rendered');
else fail('Trend chart SVG not found');

// ── 15. Week forecast chart ───────────────────────────────────────────────────
log('\n=== Week Forecast Chart ===');
const weekSection = page.locator('text=This Week Forecast').first();
if (await weekSection.count() > 0) log('✓ "This Week Forecast" chart visible');
else fail('"This Week Forecast" section not found');

// Day labels
const thuLabel = page.locator('text=Thu').first();
if (await thuLabel.count() > 0) log('✓ "Thu" day label in week chart');
else fail('"Thu" day label not found');

// ── 16. Pay period progress ───────────────────────────────────────────────────
log('\n=== Pay Period Progress ===');
const ppSection = page.locator('text=Pay Period Progress').first();
if (await ppSection.count() > 0) log('✓ "Pay Period Progress" section visible');
else fail('"Pay Period Progress" section not found');

const spentSoFar = page.locator('text=Spent So Far').first();
if (await spentSoFar.count() > 0) log('✓ "Spent So Far" metric visible');
else fail('"Spent So Far" not found');

const projectedEnd = page.locator('text=Projected End').first();
if (await projectedEnd.count() > 0) log('✓ "Projected End" metric visible');
else fail('"Projected End" not found');

// ── 17. Over-budget alert banner ──────────────────────────────────────────────
log('\n=== Over-Budget Alert Banner ===');
// Some units are over budget, so the banner should show
const overBudgetBanner = page.locator('text=/over today.{0,10}budget/i').first();
if (await overBudgetBanner.count() > 0) log('✓ Over-budget alert banner visible');
else {
  const altBanner = page.locator('text=/unit.{0,5} over/i').first();
  if (await altBanner.count() > 0) log('✓ Over-budget banner visible (alt text)');
  else log('(over-budget banner not shown — may not be applicable today)');
}

// ── 18. Screenshot full page ──────────────────────────────────────────────────
await page.screenshot({ path: 'pw-screenshots/lb-04-full-page.png', fullPage: true });

// ── 19. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/labor');
await page.waitForTimeout(800);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 20. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/lb-05-mobile.png' });

const mobileHeading = page.locator('h1', { hasText: 'Labor Intelligence' });
if (await mobileHeading.count() > 0) log('✓ Heading still visible on mobile');
else fail('Heading not visible on mobile viewport');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
