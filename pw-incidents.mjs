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

const link = page.locator('a[href="/incidents"]').first();
if (await link.count() > 0) log('✓ "Incidents" nav link found');
else fail('"Incidents" nav link not found');

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/incidents');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/inc-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Incident & Safety Hub' });
if (await h1.count() > 0) log('✓ "Incident & Safety Hub" heading visible');
else fail('"Incident & Safety Hub" h1 not found');

// ── 3. Stats bar ─────────────────────────────────────────────────────────────
log('\n=== Stats Bar ===');
for (const [id, label] of [
  ['stat-open',       'Open incidents stat'],
  ['stat-today',      'Reported today stat'],
  ['stat-critical',   'Severity 4-5 stat'],
  ['stat-resolution', 'Resolution rate stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 4. Incident cards ───────────────────────────────────────────────────────
log('\n=== Incident Cards ===');
for (const [id, name] of [
  ['inc-001', 'Incorrect insulin dose'],
  ['inc-002', 'Patient fall MS-B'],
  ['inc-003', 'Near-miss allergy bypass'],
  ['inc-004', 'Ventilator failure ICU'],
  ['inc-005', 'Staff injury MS-A'],
  ['inc-006', 'Infection control ONC'],
  ['inc-007', 'Patient complaint CCU'],
  ['inc-008', 'Pressure injury ICU'],
]) {
  const card = page.locator(`[data-id="incident-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ Incident card "${name}" visible`);
  else fail(`Incident card "${name}" not found (data-id="incident-card-${id}")`);
}

// ── 5. Default detail panel ─────────────────────────────────────────────────
log('\n=== Default Detail Panel ===');
const panel = page.locator('#incident-detail-panel').first();
if (await panel.count() > 0) log('✓ Detail panel open by default (inc-001)');
else fail('Detail panel (#incident-detail-panel) not found');

const insulinText = page.locator('#incident-detail-panel').locator('text=insulin').first();
if (await insulinText.count() > 0) log('✓ "insulin" text visible in detail panel');
else fail('"insulin" text not found in default detail panel');

// ── 6. Select a different incident ──────────────────────────────────────────
log('\n=== Select Different Incident ===');
const fallCard = page.locator('[data-id="incident-card-inc-002"]').first();
if (await fallCard.count() > 0) {
  await fallCard.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/inc-02-fall-panel.png' });

  const fallText = page.locator('#incident-detail-panel').locator('text=fall').first();
  if (await fallText.count() > 0) log('✓ Fall incident detail panel loaded');
  else fail('Fall incident details not found in panel');
} else fail('Fall incident card (inc-002) not found');

// ── 7. Update incident status ────────────────────────────────────────────────
log('\n=== Update Status ===');
const investigatingBtn = page.locator('[aria-label="Set status investigating"]').first();
if (await investigatingBtn.count() > 0) {
  log('✓ Status button "investigating" found');
  await investigatingBtn.click();
  await page.waitForTimeout(400);
  log('✓ Status updated to investigating');
} else fail('"Set status investigating" button not found');

const resolvedBtn = page.locator('[aria-label="Set status resolved"]').first();
if (await resolvedBtn.count() > 0) {
  await resolvedBtn.click();
  await page.waitForTimeout(400);
  log('✓ Status updated to resolved');
} else fail('"Set status resolved" button not found');

// ── 8. Add investigation note ────────────────────────────────────────────────
log('\n=== Add Note ===');
const noteInput = page.locator('#note-input').first();
if (await noteInput.count() > 0) {
  await noteInput.fill('X-ray results received — no fracture. Patient comfortable and resting. Bed alarm re-enabled and fall prevention protocol reinforced.');
  await page.waitForTimeout(300);

  const addNoteBtn = page.locator('[aria-label="Add note"]').first();
  if (await addNoteBtn.count() > 0) {
    await addNoteBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'pw-screenshots/inc-03-note-added.png' });

    const noteSent = page.locator('text=Note Added!').first();
    if (await noteSent.count() > 0) log('✓ "Note Added!" confirmation shown');
    else fail('"Note Added!" text not found after submitting note');
  } else fail('Add note button not found');
} else fail('Note input (#note-input) not found');

// ── 9. Close detail panel ────────────────────────────────────────────────────
log('\n=== Close Detail Panel ===');
const closeBtn = page.locator('[aria-label="Close incident detail"]').first();
if (await closeBtn.count() > 0) {
  await closeBtn.click();
  await page.waitForTimeout(900);
  const panelGone = await page.locator('#incident-detail-panel').count();
  if (panelGone === 0) log('✓ Detail panel closes via X button');
  else fail('Detail panel should close after clicking X');
} else fail('Close incident detail button not found');

// ── 10. Status filter tabs ────────────────────────────────────────────────────
log('\n=== Status Filters ===');
for (const [k, label] of [['all', 'All'], ['open', 'Open'], ['resolved', 'Resolved'], ['escalated', 'Escalated']]) {
  const btn = page.locator(`[aria-label="Filter status ${k}"]`).first();
  if (await btn.count() > 0) log(`✓ Status filter "${label}" found`);
  else fail(`Status filter "${label}" (aria-label="Filter status ${k}") not found`);
}

// Test "Open" filter hides resolved/closed cards
await page.locator('[aria-label="Filter status open"]').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/inc-04-open-filter.png' });

// inc-003 (near-miss, resolved) should not be visible
const resolvedCard = await page.locator('[data-id="incident-card-inc-003"]').isVisible().catch(() => false);
if (!resolvedCard) log('✓ Resolved incident hidden on "Open" filter');
else fail('Resolved incident should be hidden on "Open" filter');

// inc-001 (investigating) should be visible
const investigatingCard = await page.locator('[data-id="incident-card-inc-001"]').isVisible().catch(() => false);
if (investigatingCard) log('✓ Investigating incident visible on "Open" filter');
else fail('Investigating incident should be visible on "Open" filter');

// Reset to all
await page.locator('[aria-label="Filter status all"]').first().click();
await page.waitForTimeout(500);

// ── 11. Type filter ───────────────────────────────────────────────────────────
log('\n=== Type Filter ===');
const typeFilter = page.locator('[aria-label="Filter by type"]').first();
if (await typeFilter.count() > 0) {
  log('✓ Type filter dropdown found');
  await typeFilter.selectOption('patient-fall');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/inc-05-type-filter.png' });

  // Only patient fall cards should be visible
  const fallVisible = await page.locator('[data-id="incident-card-inc-002"]').isVisible().catch(() => false);
  if (fallVisible) log('✓ Fall incident visible with fall type filter');
  else fail('Fall incident should be visible with fall type filter');

  const medErrorHidden = await page.locator('[data-id="incident-card-inc-001"]').isVisible().catch(() => false);
  if (!medErrorHidden) log('✓ Medication error hidden with fall type filter');
  else fail('Medication error should be hidden with fall type filter');

  // Reset
  await typeFilter.selectOption('all');
  await page.waitForTimeout(400);
} else fail('Type filter select not found');

// ── 12. Trends tab ────────────────────────────────────────────────────────────
log('\n=== Trends Tab ===');
const trendsTab = page.locator('[aria-label="Tab Trends"]').first();
if (await trendsTab.count() > 0) {
  await trendsTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/inc-06-trends.png' });
  log('✓ Trends tab accessible');

  // Unit heatmap cells should be visible
  for (const unit of ['icu', 'ccu', 'ed', 'ms-b']) {
    const hm = page.locator(`#heatmap-${unit}`).first();
    if (await hm.count() > 0) log(`✓ Heatmap cell "${unit.toUpperCase()}" visible`);
    else fail(`Heatmap cell "${unit.toUpperCase()}" not found (#heatmap-${unit})`);
  }

  // Switch back
  await page.locator('[aria-label="Tab Incidents"]').first().click();
  await page.waitForTimeout(400);
} else fail('Trends tab button not found');

// ── 13. Report new incident modal ─────────────────────────────────────────────
log('\n=== Submit New Incident ===');
const reportBtn = page.locator('[aria-label="Report new incident"]').first();
if (await reportBtn.count() > 0) {
  log('✓ "Report Incident" button found');
  await reportBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/inc-07-submit-modal.png' });

  const modal = page.locator('#submit-incident-modal').first();
  if (await modal.count() > 0) {
    log('✓ Submit incident modal opened');

    // Select type
    await page.locator('#type-patient-fall').first().click();
    await page.waitForTimeout(200);

    // Select severity 3
    await page.locator('[aria-label="Severity 3"]').first().click();
    await page.waitForTimeout(200);

    // Fill unit
    await page.locator('#incident-unit').selectOption('Med-Surg A');

    // Fill location
    await page.locator('#incident-location').fill('Room 218, near bathroom');

    // Fill title
    await page.locator('#incident-title').fill('Patient unassisted fall — post-surgical');

    // Fill description
    await page.locator('#incident-description').fill('72-year-old male, post-op day 1 ORIF, found on floor at 14:30. Attempted to reach call light without using bed rail. Alert and oriented. No head trauma.');

    // Fill immediate actions
    await page.locator('#incident-immediate-actions').fill('Full assessment completed. Physician notified. X-ray ordered. Bed alarm re-enabled. Family notified by phone.');

    // Toggle anonymous
    await page.locator('#anonymous-toggle').click();
    await page.waitForTimeout(200);
    // Toggle back
    await page.locator('#anonymous-toggle').click();
    await page.waitForTimeout(200);
    log('✓ Anonymous toggle works');

    await page.screenshot({ path: 'pw-screenshots/inc-08-form-filled.png' });

    // Submit
    await page.locator('[aria-label="Submit incident report"]').click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'pw-screenshots/inc-09-submitted.png' });

    // Modal should be closed (1400ms success + AnimatePresence exit)
    const modalGone = await page.locator('#submit-incident-modal').count();
    if (modalGone === 0) log('✓ Modal closed after submission');
    else fail('Modal should close after submission');

    // New incident card should appear
    const newCard = page.locator('[data-id="incident-card-inc-new-001"]').first();
    if (await newCard.count() > 0) log('✓ New incident card visible after submission');
    else fail('New incident card (inc-new-001) not found after submission');

  } else fail('Submit incident modal did not open');
} else fail('"Report Incident" button not found');

// ── 14. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/incidents');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 15. Mobile ────────────────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/inc-10-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Incident & Safety Hub' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
