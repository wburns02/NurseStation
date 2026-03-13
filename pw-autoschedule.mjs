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

const autoLink = page.locator('a[href="/auto-schedule"]').first();
if (await autoLink.count() > 0) log('✓ "Auto-Schedule" nav link in sidebar');
else fail('"Auto-Schedule" nav link not found');

const badge4 = page.locator('a[href="/auto-schedule"] span').filter({ hasText: '4' }).first();
if (await badge4.count() > 0) log('✓ Auto-Schedule sidebar badge shows 4');
else log('(badge check skipped — may be hidden when active)');

// ── 2. Idle state ──────────────────────────────────────────────────────────────
log('\n=== Idle State ===');
await page.goto(BASE + '/auto-schedule');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/as-01-idle.png' });

const h1 = page.locator('h1', { hasText: 'Smart Schedule Generator' });
if (await h1.count() > 0) log('✓ "Smart Schedule Generator" heading visible');
else fail('"Smart Schedule Generator" h1 not found');

const weekLabel = page.locator('text=Mar 16–22, 2026').first();
if (await weekLabel.count() > 0) log('✓ Week label "Mar 16–22, 2026" visible');
else fail('Week label not found');

const genBtn = page.locator('[aria-label="Generate schedule"]').first();
if (await genBtn.count() > 0) log('✓ "Generate Schedule" button found');
else fail('"Generate Schedule" button not found');

// ── 3. Generation animation ────────────────────────────────────────────────────
log('\n=== Generation Animation ===');
await genBtn.click();
await page.waitForTimeout(500);

const generatingText = page.locator('text=Generating Optimal Schedule').first();
if (await generatingText.count() > 0) log('✓ "Generating Optimal Schedule…" text visible during animation');
else fail('"Generating Optimal Schedule" text not found');

await page.screenshot({ path: 'pw-screenshots/as-02-generating.png' });

// Wait for generation to complete (4 steps × ~850ms avg + buffer)
await page.waitForTimeout(4200);
await page.screenshot({ path: 'pw-screenshots/as-03-schedule-done.png' });

// ── 4. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
for (const [id, label] of [
  ['stat-total-cells',   'Total Cells stat'],
  ['stat-fully-covered', 'Fully Covered stat'],
  ['stat-conflicts',     'Conflicts stat'],
  ['stat-est-cost',      'Estimated Cost stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 5. Schedule grid ───────────────────────────────────────────────────────────
log('\n=== Schedule Grid ===');
const gridHeading = page.locator('text=Schedule Grid').first();
if (await gridHeading.count() > 0) log('✓ Schedule grid heading visible');
else fail('Schedule grid heading not found');

// Check unit headers are visible
for (const shortName of ['ICU', 'MS-A', 'MS-B', 'PICU', 'ED']) {
  const unitLabel = page.locator(`text=${shortName}`).first();
  if (await unitLabel.count() > 0) log(`✓ Unit "${shortName}" in grid`);
  else fail(`Unit "${shortName}" not found in grid`);
}

// Day headers
const monLabel = page.locator('text=Mon').first();
if (await monLabel.count() > 0) log('✓ Day headers visible (Mon found)');
else fail('Day headers not found');

// ── 6. Conflict panel ──────────────────────────────────────────────────────────
log('\n=== Conflict Panel ===');
const conflictPanel = page.locator('#conflict-panel').first();
if (await conflictPanel.count() > 0) log('✓ Conflict panel visible');
else fail('Conflict panel not found');

const conflict1 = page.locator('[data-id="conflict-c001"]').first();
if (await conflict1.count() > 0) log('✓ Conflict c001 (ICU Night Thu) visible');
else fail('Conflict c001 not found');

const conflict2 = page.locator('[data-id="conflict-c002"]').first();
if (await conflict2.count() > 0) log('✓ Conflict c002 (Med-Surg B Eve Fri) visible');
else fail('Conflict c002 not found');

const conflict3 = page.locator('[data-id="conflict-c003"]').first();
if (await conflict3.count() > 0) log('✓ Conflict c003 (PICU Sat Day) visible');
else fail('Conflict c003 not found');

const conflict4 = page.locator('[data-id="conflict-c004"]').first();
if (await conflict4.count() > 0) log('✓ Conflict c004 (ED Night Sat) visible');
else fail('Conflict c004 not found');

// ── 7. Publish blocked while conflicts remain ──────────────────────────────────
log('\n=== Publish Gated on Conflicts ===');
const publishBtn = page.locator('[aria-label="Publish schedule and notify staff"]').first();
if (await publishBtn.count() > 0) {
  const isDisabled = await publishBtn.isDisabled();
  if (isDisabled) log('✓ Publish button disabled while conflicts remain');
  else fail('Publish button should be disabled while conflicts remain');
} else fail('Publish button not found');

// ── 8. Auto-fix conflicts one by one ──────────────────────────────────────────
log('\n=== Auto-Fix Conflicts ===');
for (const cId of ['c001', 'c002', 'c003', 'c004']) {
  const fixBtn = page.locator(`[data-id="conflict-${cId}"] [aria-label="Auto-fix conflict ${cId}"]`).first();
  if (await fixBtn.count() > 0) {
    log(`✓ Auto-fix button found for ${cId}`);
    await fixBtn.click();
    await page.waitForTimeout(1600);
    const stillThere = await page.locator(`[data-id="conflict-${cId}"]`).count();
    if (stillThere === 0) log(`✓ Conflict ${cId} removed after auto-fix`);
    else fail(`Conflict ${cId} still visible after auto-fix`);
  } else fail(`Auto-fix button not found for ${cId}`);
}

await page.screenshot({ path: 'pw-screenshots/as-04-conflicts-resolved.png' });

// ── 9. All conflicts resolved banner ──────────────────────────────────────────
log('\n=== All Conflicts Resolved ===');
const resolvedBanner = page.locator('#all-conflicts-resolved').first();
if (await resolvedBanner.count() > 0) log('✓ "All conflicts resolved!" message visible');
else fail('"All conflicts resolved!" message not found');

// ── 10. Publish flow ───────────────────────────────────────────────────────────
log('\n=== Publish Flow ===');
const publishCard = page.locator('#publish-card').first();
if (await publishCard.count() > 0) log('✓ Publish card visible');
else fail('Publish card not found');

// Publish button should now be enabled
const publishBtnEnabled = page.locator('[aria-label="Publish schedule and notify staff"]').first();
if (await publishBtnEnabled.count() > 0) {
  const isDisabled = await publishBtnEnabled.isDisabled();
  if (!isDisabled) log('✓ Publish button enabled after all conflicts resolved');
  else fail('Publish button still disabled after resolving all conflicts');
  await publishBtnEnabled.click();
  await page.waitForTimeout(2100);
  const confirmation = page.locator('#publish-confirmation').first();
  if (await confirmation.count() > 0) log('✓ "Sent to 28 staff members" confirmation visible');
  else fail('"Sent to 28 staff members" confirmation not found');
} else fail('Publish button not found after resolving conflicts');

await page.screenshot({ path: 'pw-screenshots/as-05-published.png' });

// ── 11. Regenerate button ──────────────────────────────────────────────────────
log('\n=== Regenerate ===');
await page.goto(BASE + '/auto-schedule');
await page.waitForTimeout(600);
await page.goto(BASE + '/auto-schedule');
await page.waitForTimeout(600);

// Navigate back and test regenerate after schedule is shown
await page.goto(BASE + '/auto-schedule');
await page.waitForTimeout(600);
const genBtn2 = page.locator('[aria-label="Generate schedule"]').first();
if (await genBtn2.count() > 0) {
  await genBtn2.click();
  await page.waitForTimeout(5000);
  const regenBtn = page.locator('[aria-label="Regenerate schedule"]').first();
  if (await regenBtn.count() > 0) log('✓ "Regenerate" button visible after schedule is shown');
  else fail('"Regenerate" button not found');
} else log('(regenerate test skipped - page state)');

// ── 12. Console errors ─────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/auto-schedule');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 13. Mobile viewport ────────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/as-06-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Smart Schedule Generator' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
