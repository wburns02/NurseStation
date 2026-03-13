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

const onboardLink = page.locator('a[href="/onboarding"]').first();
if (await onboardLink.count() > 0) log('✓ "Onboarding" nav link found');
else fail('"Onboarding" nav link not found');

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/onboarding');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/ob-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Smart Onboarding Hub' });
if (await h1.count() > 0) log('✓ "Smart Onboarding Hub" heading visible');
else fail('"Smart Onboarding Hub" h1 not found');

// ── 3. Stats bar ─────────────────────────────────────────────────────────────
log('\n=== Stats Bar ===');
for (const [id, label] of [
  ['stat-active',       'Active stat'],
  ['stat-at-risk',      'At Risk stat'],
  ['stat-completed',    'Completed stat'],
  ['stat-avg-progress', 'Avg Progress stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 4. Hire cards ──────────────────────────────────────────────────────────
log('\n=== Hire Cards ===');
for (const [id, name] of [
  ['hire-ek', 'Emily Kowalski'],
  ['hire-mb', 'Marcus Brown'],
  ['hire-pv', 'Priscilla Vargas'],
  ['hire-dw', 'Darius Webb'],
  ['hire-hf', 'Helen Forsyth'],
]) {
  const card = page.locator(`[data-id="hire-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ Hire card "${name}" visible`);
  else fail(`Hire card "${name}" not found (data-id="hire-card-${id}")`);
}

// ── 5. Default selection — Emily ───────────────────────────────────────────
log('\n=== Default Selection ===');
const panel = page.locator('#onboarding-detail-panel').first();
if (await panel.count() > 0) log('✓ Detail panel open by default (Emily)');
else fail('Detail panel not open by default');

const emilyHeading = page.locator('#onboarding-detail-panel').locator('text=Emily Kowalski').first();
if (await emilyHeading.count() > 0) log('✓ "Emily Kowalski" visible in detail panel');
else fail('"Emily Kowalski" not found in detail panel');

// ── 6. Complete a task ─────────────────────────────────────────────────────
log('\n=== Complete Task ===');
// Infection Control task is overdue and incomplete for Emily (ek-t07)
const completeBtn = page.locator('[aria-label="Complete task ek-t07"]').first();
if (await completeBtn.count() > 0) {
  log('✓ Complete task button found (ek-t07)');
  await completeBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ob-02-task-completed.png' });

  // Button should now be checked (disabled)
  const isDisabled = await completeBtn.isDisabled().catch(() => false);
  if (isDisabled) log('✓ Task button disabled after completion');
  else fail('Task button should be disabled after completion');
} else fail('Complete task button (ek-t07) not found');

// ── 7. Send reminder ───────────────────────────────────────────────────────
log('\n=== Send Reminder ===');
const reminderBtn = page.locator('[aria-label="Send reminder hire-ek"]').first();
if (await reminderBtn.count() > 0) {
  log('✓ Send reminder button found');
  await reminderBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'pw-screenshots/ob-03-reminder-sent.png' });

  // Should show "Reminder Sent!" or "sent" state
  const sentText = page.locator('text=Reminder Sent!').first();
  if (await sentText.count() > 0) log('✓ "Reminder Sent!" message shown');
  else fail('"Reminder Sent!" text not found after send');
} else fail('Send reminder button not found for hire-ek');

// ── 8. Close detail panel ─────────────────────────────────────────────────
log('\n=== Close Detail Panel ===');
const closeBtn = page.locator('[aria-label="Close onboarding detail"]').first();
if (await closeBtn.count() > 0) {
  await closeBtn.click();
  await page.waitForTimeout(900);
  const panelGone = await page.locator('#onboarding-detail-panel').count();
  if (panelGone === 0) log('✓ Detail panel closes via X button');
  else fail('Detail panel should close after clicking X');
} else fail('Close onboarding detail button not found');

// ── 9. Select a different hire ─────────────────────────────────────────────
log('\n=== Select Marcus Brown ===');
const marcusCard = page.locator('[data-id="hire-card-hire-mb"]').first();
if (await marcusCard.count() > 0) {
  await marcusCard.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ob-04-marcus-panel.png' });

  const marcusPanel = page.locator('#onboarding-detail-panel').locator('text=Marcus Brown').first();
  if (await marcusPanel.count() > 0) log('✓ Marcus Brown detail panel opened');
  else fail('"Marcus Brown" not found in detail panel after card click');
} else fail('Marcus Brown hire card not found');

// ── 10. Filter tabs ────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
for (const label of ['All', 'At Risk', 'Pre-Start', 'In Progress', 'Completed']) {
  const btn = page.locator(`[aria-label="Filter ${label}"]`).first();
  if (await btn.count() > 0) log(`✓ Filter "${label}" found`);
  else fail(`Filter "${label}" not found`);
}

// Test At Risk filter
await page.locator('[aria-label="Filter At Risk"]').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/ob-05-at-risk-filter.png' });

// Emily and Marcus are at-risk; Helen (completed) should be gone
const helenGone = await page.locator('[data-id="hire-card-hire-hf"]').isVisible().catch(() => false);
if (!helenGone) log('✓ Helen Forsyth hidden on At Risk filter');
else fail('Helen Forsyth should be hidden on At Risk filter');

const emilyVisible = await page.locator('[data-id="hire-card-hire-ek"]').isVisible().catch(() => false);
if (emilyVisible) log('✓ Emily Kowalski visible on At Risk filter');
else fail('Emily Kowalski should be visible on At Risk filter');

// Back to all
await page.locator('[aria-label="Filter All"]').first().click();
await page.waitForTimeout(600);

// ── 11. Add new hire modal ─────────────────────────────────────────────────
log('\n=== Add New Hire Modal ===');
const addBtn = page.locator('[aria-label="Add new hire"]').first();
if (await addBtn.count() > 0) {
  log('✓ "Add New Hire" button found');
  await addBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/ob-06-new-hire-modal.png' });

  const modal = page.locator('#new-hire-modal').first();
  if (await modal.count() > 0) {
    log('✓ New hire modal opened');

    // Fill form
    await page.locator('#new-hire-name').fill('Samantha Park');
    await page.locator('#new-hire-role').fill('RN');
    await page.locator('#new-hire-unit').fill('TELE');
    await page.locator('#new-hire-start-date').fill('2026-03-10');
    await page.locator('#new-hire-manager').fill('David Kim');
    await page.locator('#new-hire-buddy').fill('Laura Green');

    await page.screenshot({ path: 'pw-screenshots/ob-07-new-hire-form.png' });

    // Submit
    await page.locator('[aria-label="Submit new hire"]').click();
    await page.waitForTimeout(2400);
    await page.screenshot({ path: 'pw-screenshots/ob-08-new-hire-added.png' });

    // Modal should be gone (AnimatePresence removes from DOM after exit animation)
    const modalGone = await page.locator('#new-hire-modal').count();
    if (modalGone === 0) log('✓ Modal closed after submit');
    else fail('Modal should close after submit');

    // New hire card should appear
    const newCard = page.locator('[data-id="hire-card-hire-new-001"]').first();
    if (await newCard.count() > 0) log('✓ New hire card "hire-new-001" visible');
    else fail('New hire card (hire-new-001) not found after adding');

  } else fail('New hire modal did not open');
} else fail('"Add New Hire" button not found');

// ── 12. Methodology section ────────────────────────────────────────────────
log('\n=== Methodology Section ===');
const methodology = page.locator('#onboarding-methodology').first();
if (await methodology.count() > 0) log('✓ Onboarding methodology section visible');
else fail('Methodology section (#onboarding-methodology) not found');

// ── 13. Console errors ─────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/onboarding');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 14. Mobile viewport ────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/ob-09-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Smart Onboarding Hub' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
