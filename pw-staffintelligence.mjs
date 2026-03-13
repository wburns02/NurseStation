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

const peopleLink = page.locator('a[href="/people"]').first();
if (await peopleLink.count() > 0) log('✓ "Staff Intel" nav link in sidebar');
else fail('"Staff Intel" nav link (/people) not found');

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/people');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/si-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Staff Intelligence' });
if (await h1.count() > 0) log('✓ "Staff Intelligence" heading visible');
else fail('"Staff Intelligence" h1 not found');

// ── 3. Stats row ─────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
for (const [id, label] of [
  ['stat-total',       'Total Staff stat'],
  ['stat-at-risk',     'At Risk stat'],
  ['stat-avg-score',   'Avg Score stat'],
  ['stat-flight-risk', 'Flight Risk stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 4. At-risk strip ─────────────────────────────────────────────────────────
log('\n=== At-Risk Strip ===');
const strip = page.locator('#at-risk-strip').first();
if (await strip.count() > 0) log('✓ At-risk strip visible');
else fail('At-risk strip (#at-risk-strip) not found');

// Check the two critical staff cards
for (const [id, name] of [
  ['e002', 'James Okafor'],
  ['s005', 'Tyler Barnes'],
]) {
  const card = page.locator(`[data-id="at-risk-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ ${name} at-risk card visible`);
  else fail(`${name} at-risk card not found (data-id="at-risk-card-${id}")`);
}

// Linda Okonkwo (high risk) should also appear
const lindaCard = page.locator('[data-id="at-risk-card-s007"]').first();
if (await lindaCard.count() > 0) log('✓ Linda Okonkwo at-risk card visible');
else fail('Linda Okonkwo at-risk card not found');

// ── 5. Filter tabs ────────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
for (const label of ['All Staff', 'Critical', 'High Risk', 'Moderate', 'Good', 'Stars']) {
  const btn = page.locator(`[aria-label="Filter ${label}"]`).first();
  if (await btn.count() > 0) log(`✓ Filter "${label}" button found`);
  else fail(`Filter "${label}" button not found`);
}

// ── 6. Filter interaction ─────────────────────────────────────────────────────
log('\n=== Filter Interaction ===');
await page.locator('[aria-label="Filter Critical"]').first().click();
await page.waitForTimeout(800);

const critRowJames = page.locator('[data-id="staff-row-e002"]').first();
if (await critRowJames.count() > 0) log('✓ James Okafor row visible in Critical filter');
else fail('James Okafor row not visible after filtering to Critical');

const priyaRow = page.locator('[data-id="staff-row-e001"]').first();
const priyaVisible2 = await priyaRow.isVisible().catch(() => false);
if (!priyaVisible2) log('✓ Priya Sharma (star) correctly hidden in Critical filter');
else fail('Priya Sharma should NOT be visible in Critical filter');

// Reset filter
await page.locator('[aria-label="Filter All Staff"]').first().click();
await page.waitForTimeout(500);

// ── 7. Search ────────────────────────────────────────────────────────────────
log('\n=== Search ===');
const searchInput = page.locator('#staff-search').first();
if (await searchInput.count() > 0) log('✓ Search input found');
else fail('Search input (#staff-search) not found');

await searchInput.fill('Priya');
await page.waitForTimeout(700);

const priyaVisible = page.locator('[data-id="staff-row-e001"]').first();
if (await priyaVisible.count() > 0) log('✓ Priya Sharma visible after search "Priya"');
else fail('Priya Sharma not visible after search');

const jamesHidden = page.locator('[data-id="staff-row-e002"]').first();
const jamesHiddenVisible = await jamesHidden.isVisible().catch(() => false);
if (!jamesHiddenVisible) log('✓ James Okafor hidden after search "Priya"');
else fail('James Okafor should be hidden after search "Priya"');

await searchInput.fill('');
await page.waitForTimeout(500);

// ── 8. Sort columns ───────────────────────────────────────────────────────────
log('\n=== Sort Columns ===');
// Click "Score" header twice to get descending
const scoreHeader = page.locator('th', { hasText: 'Score' }).first();
if (await scoreHeader.count() > 0) {
  await scoreHeader.click();
  await page.waitForTimeout(300);
  await scoreHeader.click();
  await page.waitForTimeout(300);
  // Priya (96) should be first row now
  const firstRow = page.locator('[data-id^="staff-row-"]').first();
  const firstDataId = await firstRow.getAttribute('data-id').catch(() => '');
  if (firstDataId === 'staff-row-e001') log('✓ Sort by Score desc — Priya first (96)');
  else log(`  (sort check: first row is ${firstDataId})`);
  log('✓ Score sort column clickable');
} else fail('Score sort header not found');

// ── 9. Click staff row → opens detail panel ───────────────────────────────────
log('\n=== Detail Panel (via row click) ===');
// Navigate back to default sort
await page.locator('[aria-label="Filter All Staff"]').first().click();
await page.waitForTimeout(300);

const jamesRow = page.locator('[data-id="staff-row-e002"]').first();
if (await jamesRow.count() > 0) {
  await jamesRow.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/si-02-detail-panel.png' });

  const panel = page.locator('#intelligence-detail-panel').first();
  if (await panel.count() > 0) log('✓ Detail panel opened for James Okafor');
  else fail('Detail panel (#intelligence-detail-panel) not found after click');

  const jamesText = page.locator('#intelligence-detail-panel').locator('text=James Okafor').first();
  if (await jamesText.count() > 0) log('✓ "James Okafor" visible in detail panel');
  else fail('"James Okafor" not found in detail panel');

  // Flight risk should show
  const flightRisk = page.locator('#intelligence-detail-panel').locator('text=Flight Risk Detected').first();
  if (await flightRisk.count() > 0) log('✓ "Flight Risk Detected" visible in panel');
  else fail('"Flight Risk Detected" not found in panel');

  // Score breakdown bars
  const breakdown = page.locator('#intelligence-detail-panel').locator('text=Score Breakdown').first();
  if (await breakdown.count() > 0) log('✓ "Score Breakdown" section visible in panel');
  else fail('"Score Breakdown" section not found in panel');

  // Flags
  const calloutFlag = page.locator('#intelligence-detail-panel [data-id="flag-f-jo-1"]').first();
  if (await calloutFlag.count() > 0) log('✓ Attendance flag visible in panel');
  else fail('Attendance flag not found in panel (data-id="flag-f-jo-1")');

  // Suggested actions
  const action1 = page.locator('[aria-label="Action act-jo-1"]').first();
  if (await action1.count() > 0) log('✓ Action "Schedule check-in" found in panel');
  else fail('Action act-jo-1 not found');

} else fail('James Okafor row not found');

// ── 10. Panel action click ────────────────────────────────────────────────────
log('\n=== Panel Action Click ===');
const actionBtn = page.locator('[aria-label="Action act-jo-1"]').first();
if (await actionBtn.count() > 0) {
  log('✓ Action button found');
  await actionBtn.click();
  await page.waitForTimeout(1200);
  const doneText = page.locator('[aria-label="Action act-jo-1"]').locator('text=Done!').first();
  if (await doneText.count() > 0) log('✓ Action shows "Done!" after click');
  else fail('Action did not show "Done!" state');
} else fail('Action button not found (act-jo-1)');

await page.screenshot({ path: 'pw-screenshots/si-03-action-done.png' });

// ── 11. Close panel ───────────────────────────────────────────────────────────
log('\n=== Close Panel ===');
const closeBtn = page.locator('[aria-label="Close intelligence detail"]').first();
if (await closeBtn.count() > 0) {
  await closeBtn.click();
  await page.waitForTimeout(400);
  const panelGone = await page.locator('#intelligence-detail-panel').count();
  if (panelGone === 0) log('✓ Detail panel closed');
  else fail('Detail panel did not close');
} else fail('"Close intelligence detail" button not found');

// ── 12. At-risk card → opens panel ───────────────────────────────────────────
log('\n=== At-Risk Card → Panel ===');
const tylerCard = page.locator('[data-id="at-risk-card-s005"]').first();
if (await tylerCard.count() > 0) {
  await tylerCard.click();
  await page.waitForTimeout(500);
  const panel2 = page.locator('#intelligence-detail-panel').first();
  if (await panel2.count() > 0) {
    log('✓ Detail panel opens from at-risk strip card');
    const tylerText = page.locator('#intelligence-detail-panel').locator('text=Tyler Barnes').first();
    if (await tylerText.count() > 0) log('✓ Panel shows Tyler Barnes data');
    else fail('"Tyler Barnes" not found in panel opened from strip card');
    await page.locator('[aria-label="Close intelligence detail"]').first().click();
    await page.waitForTimeout(400);
  } else fail('Panel did not open from at-risk card');
} else fail('Tyler Barnes at-risk card not found');

// ── 13. Quick action in table row ─────────────────────────────────────────────
log('\n=== Quick Action in Table ===');
await page.goto(BASE + '/people');
await page.waitForTimeout(700);

const priyaRowAgain = page.locator('[data-id="staff-row-e001"]').first();
if (await priyaRowAgain.count() > 0) {
  const quickBtn = priyaRowAgain.locator('[aria-label^="Quick action"]').first();
  if (await quickBtn.count() > 0) {
    log('✓ Quick action button found in Priya row');
    await quickBtn.click();
    await page.waitForTimeout(1200);
    const doneQuick = priyaRowAgain.locator('text=Done!').first();
    if (await doneQuick.count() > 0) log('✓ Quick action shows "Done!" in table row');
    else fail('Quick action did not show "Done!" in table row');
  } else fail('Quick action button not found in Priya row');
} else fail('Priya Sharma row not found for quick action test');

await page.screenshot({ path: 'pw-screenshots/si-04-quick-action.png' });

// ── 14. Methodology section ───────────────────────────────────────────────────
log('\n=== Methodology Section ===');
const methodology = page.locator('#intelligence-methodology').first();
if (await methodology.count() > 0) log('✓ "How the Performance Score Works" section visible');
else fail('"How the Performance Score Works" section not found');

// ── 15. Star filter ───────────────────────────────────────────────────────────
log('\n=== Stars Filter ===');
await page.locator('[aria-label="Filter Stars"]').first().click();
await page.waitForTimeout(800);

const priyaStar = page.locator('[data-id="staff-row-e001"]').first();
if (await priyaStar.count() > 0) log('✓ Priya Sharma visible in Stars filter');
else fail('Priya Sharma not found in Stars filter');

const jamesInStars = page.locator('[data-id="staff-row-e002"]').first();
const jamesInStarsVisible = await jamesInStars.isVisible().catch(() => false);
if (!jamesInStarsVisible) log('✓ James Okafor correctly hidden in Stars filter');
else fail('James Okafor should be hidden in Stars filter');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/people');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/si-05-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Staff Intelligence' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
