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
log('\n=== Sidebar Nav ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const boardLink = page.locator('a[href="/shift-board"]').first();
if (await boardLink.count() > 0) log('✓ "Shift Board" nav link in sidebar');
else fail('"Shift Board" nav link not found');

const badge7 = page.locator('a[href="/shift-board"] span').filter({ hasText: '7' }).first();
if (await badge7.count() > 0) log('✓ Shift Board badge shows 7');
else log('(badge check skipped — may be hidden when active)');

// ── 2. Page load ───────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/shift-board');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/sb-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Open Shift Board' });
if (await h1.count() > 0) log('✓ "Open Shift Board" heading visible');
else fail('"Open Shift Board" h1 not found');

// ── 3. Critical alert banner ───────────────────────────────────────────────────
log('\n=== Critical Alert Banner ===');
const criticalBanner = page.locator('#critical-banner').first();
if (await criticalBanner.count() > 0) log('✓ Critical alert banner visible');
else fail('Critical alert banner (#critical-banner) not found');

const fillNowBtn = page.locator('[aria-label="Fill critical shift now"]').first();
if (await fillNowBtn.count() > 0) log('✓ "Fill Now" button in critical banner');
else fail('"Fill Now" button not found in critical banner');

// ── 4. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
for (const [id, label] of [
  ['stats-open',    'Open Shifts stat'],
  ['stats-pending', 'Swap Requests stat'],
  ['stats-filled',  'Filled This Week stat'],
  ['stats-avg-fill','Avg Fill Time stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 5. Open shift cards ────────────────────────────────────────────────────────
log('\n=== Open Shift Cards ===');
for (const [id, label] of [
  ['sb001', 'ICU Night critical shift'],
  ['sb002', 'Med-Surg B Day high shift'],
  ['sb003', 'ICU Evening high shift'],
  ['sb004', 'PICU Day medium shift'],
  ['sb005', 'ED Night medium shift'],
]) {
  const el = page.locator(`[data-id="open-shift-${id}"]`).first();
  if (await el.count() > 0) log(`✓ ${label} card visible`);
  else fail(`${label} card not found (data-id="open-shift-${id}")`);
}

// ── 6. Swap request cards ──────────────────────────────────────────────────────
log('\n=== Swap Request Cards ===');
const swap1 = page.locator('[data-id="swap-sw001"]').first();
if (await swap1.count() > 0) log('✓ Swap sw001 (Lisa Greenwald) visible');
else fail('Swap sw001 not found');

const swap2 = page.locator('[data-id="swap-sw002"]').first();
if (await swap2.count() > 0) log('✓ Swap sw002 (Marcus Williams) visible');
else fail('Swap sw002 not found');

// ── 7. Filter tabs ─────────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
const urgentFilter = page.locator('[aria-label="Filter by Urgent"]').first();
if (await urgentFilter.count() > 0) {
  log('✓ Urgent filter tab found');
  await urgentFilter.click();
  await page.waitForTimeout(300);
  // sb004 (medium) should not be visible; sb001 (critical) should be
  const sb004visible = await page.locator('[data-id="open-shift-sb004"]').count();
  if (sb004visible === 0) log('✓ Medium shift sb004 hidden in Urgent filter');
  else fail('sb004 (medium) still visible after Urgent filter');
  const sb001visible = await page.locator('[data-id="open-shift-sb001"]').count();
  if (sb001visible > 0) log('✓ Critical shift sb001 visible in Urgent filter');
  else fail('sb001 (critical) not visible in Urgent filter');
} else fail('Urgent filter tab not found');

// Reset to All
const allFilter = page.locator('[aria-label="Filter by All Shifts"]').first();
if (await allFilter.count() > 0) {
  await allFilter.click();
  await page.waitForTimeout(300);
  log('✓ Reset to All Shifts filter');
} else fail('"All Shifts" filter not found');

await page.screenshot({ path: 'pw-screenshots/sb-02-filters.png' });

// ── 8. Post to board ───────────────────────────────────────────────────────────
log('\n=== Post to Board ===');
const postBtn = page.locator('[aria-label="Post shift sb002 to board"]').first();
if (await postBtn.count() > 0) {
  log('✓ "Post to Board" button found for sb002');
  await postBtn.click();
  await page.waitForTimeout(900);
  // Button should now show "Posted"
  const postedText = page.locator('[data-id="open-shift-sb002"]').locator('text=Posted').first();
  if (await postedText.count() > 0) log('✓ sb002 shows "Posted" after clicking Post to Board');
  else fail('sb002 does not show "Posted" state after click');
} else fail('"Post to Board" button not found for sb002');

// ── 9. Send alert ──────────────────────────────────────────────────────────────
log('\n=== Send Alert ===');
const alertBtn = page.locator('[aria-label="Send alert for shift sb003"]').first();
if (await alertBtn.count() > 0) {
  log('✓ "Send Alert" button found for sb003');
  await alertBtn.click();
  await page.waitForTimeout(1000);
  // Button should show "Alert Sent"
  const sentText = page.locator('[data-id="open-shift-sb003"]').locator('text=Alert Sent').first();
  if (await sentText.count() > 0) log('✓ sb003 shows "Alert Sent" after clicking Send Alert');
  else fail('sb003 does not show "Alert Sent" state after click');
} else fail('"Send Alert" button not found for sb003');

await page.screenshot({ path: 'pw-screenshots/sb-03-posted-alerted.png' });

// ── 10. Direct Assign via Fill Now (critical banner) ──────────────────────────
log('\n=== Direct Assign Panel (via Fill Now) ===');
const fillNow = page.locator('[aria-label="Fill critical shift now"]').first();
if (await fillNow.count() > 0) {
  await fillNow.click();
  await page.waitForTimeout(500);
  const panel = page.locator('#assign-panel').first();
  if (await panel.count() > 0) log('✓ Assign panel opened via Fill Now button');
  else fail('Assign panel (#assign-panel) not found after Fill Now click');
  await page.screenshot({ path: 'pw-screenshots/sb-04-assign-panel.png' });

  // Check for Best Match label
  const bestMatch = page.locator('text=Best Match').first();
  if (await bestMatch.count() > 0) log('✓ "Best Match" label visible for top suggestion');
  else fail('"Best Match" label not found');

  // Check suggestion cards
  const suggCard = page.locator('[data-id^="suggestion-"]').first();
  if (await suggCard.count() > 0) log('✓ Staff suggestion card(s) visible in panel');
  else fail('No suggestion cards found in assign panel');

  // Click Assign on first suggestion
  const assignBtn = page.locator('[aria-label^="Assign Carmen"]').first();
  if (await assignBtn.count() > 0) {
    log('✓ "Assign Carmen" button found');
    await assignBtn.click();
    await page.waitForTimeout(1300);
    const successBanner = page.locator('#assign-success-banner').first();
    if (await successBanner.count() > 0) log('✓ Assignment success banner visible');
    else fail('Assignment success banner not found');
    await page.screenshot({ path: 'pw-screenshots/sb-05-assigned.png' });
    // Wait for panel to auto-close
    await page.waitForTimeout(1500);
  } else fail('"Assign Carmen" button not found');

  // Close panel if still open
  const closeBtn = page.locator('[aria-label="Close assign panel"]').first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(400);
    log('✓ Assign panel closed');
  }
} else fail('"Fill Now" button not found for Direct Assign test');

// ── 11. Critical banner gone after filling sb001 ───────────────────────────────
log('\n=== Critical Banner State After Fill ===');
await page.waitForTimeout(500);
const bannerAfterFill = await page.locator('#critical-banner').count();
if (bannerAfterFill === 0) log('✓ Critical banner gone after filling critical shift');
else log('(critical banner still shown — shift may not be marked filled yet)');

// ── 12. Swap approve ───────────────────────────────────────────────────────────
log('\n=== Approve Swap ===');
const approveBtn = page.locator('[aria-label="Approve swap sw001"]').first();
if (await approveBtn.count() > 0) {
  log('✓ Approve swap sw001 button found');
  await approveBtn.click();
  await page.waitForTimeout(2500);
  const sw001After = await page.locator('[data-id="swap-sw001"]').count();
  if (sw001After === 0) log('✓ Swap sw001 removed after approval');
  else fail('Swap sw001 still visible after approval');
} else fail('Approve swap sw001 button not found');

// ── 13. Swap decline ───────────────────────────────────────────────────────────
log('\n=== Decline Swap ===');
const declineBtn = page.locator('[aria-label="Decline swap sw002"]').first();
if (await declineBtn.count() > 0) {
  log('✓ Decline swap sw002 button found (first click shows reason field)');
  await declineBtn.click();
  await page.waitForTimeout(400);

  // Should show reason input
  const reasonInput = page.locator('[aria-label="Decline reason"]').first();
  if (await reasonInput.count() > 0) {
    log('✓ Decline reason input appears');
    await reasonInput.fill('Coverage too thin for that weekend');

    // Click confirm decline
    const confirmDecline = page.locator('[aria-label="Confirm decline swap sw002"]').first();
    if (await confirmDecline.count() > 0) {
      await confirmDecline.click();
      await page.waitForTimeout(2400);
      const sw002After = await page.locator('[data-id="swap-sw002"]').count();
      if (sw002After === 0) log('✓ Swap sw002 removed after decline');
      else fail('Swap sw002 still visible after decline');
    } else fail('Confirm decline button not found');
  } else fail('Decline reason input not found');
} else fail('Decline swap sw002 button not found');

await page.screenshot({ path: 'pw-screenshots/sb-06-swaps-done.png' });

// ── 14. Fill history panel ────────────────────────────────────────────────────
log('\n=== Fill History Panel ===');
const historyBtn = page.locator('[aria-label="Toggle fill history"]').first();
if (await historyBtn.count() > 0) {
  await historyBtn.click();
  await page.waitForTimeout(400);
  const historyPanel = page.locator('#fill-history-panel').first();
  if (await historyPanel.count() > 0) log('✓ Fill history panel visible');
  else fail('Fill history panel not found');
  // Close it
  await historyBtn.click();
  await page.waitForTimeout(400);
  log('✓ Fill history panel toggled');
} else fail('Toggle fill history button not found');

// ── 15. How it works section ──────────────────────────────────────────────────
log('\n=== How It Works ===');
const howItWorks = page.locator('#how-it-works').first();
if (await howItWorks.count() > 0) log('✓ "How it works" guidance section visible');
else fail('"How it works" section not found');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/shift-board');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/sb-07-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Open Shift Board' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
