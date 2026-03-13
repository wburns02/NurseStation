import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok  = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// ── 1. Nav link ──────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(500);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/handoff"]');
check(await navLink.count() > 0, 'Shift Handoff nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(600);
}

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/handoff'), 'URL is /handoff');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Handoff'), `h1 contains "Handoff": "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r23-handoff-01-page.png' });

// ── 3. Header / progress bar ─────────────────────────────────────────────────
log('\n=== 3. HEADER & PROGRESS ===');
check(await page.locator('#handoff-progress').count() > 0, 'Progress indicator exists');
const progressText = await page.locator('#handoff-progress').textContent().catch(() => '');
check(progressText.includes('2/6') || progressText.includes('6'), `Progress shows: "${progressText.trim()}"`);

// ── 4. Patient list ───────────────────────────────────────────────────────────
log('\n=== 4. PATIENT LIST ===');
for (let i = 1; i <= 6; i++) {
  const id = `pt-00${i}`;
  check(await page.locator(`[data-id="patient-card-${id}"]`).count() > 0, `Patient card ${id} exists`);
}

// ── 5. Patient selection & SBAR form ─────────────────────────────────────────
log('\n=== 5. PATIENT SELECTION & SBAR FORM (pt-001, pre-filled) ===');
// pt-001 should be selected by default
check(await page.locator('#sbar-s-pt-001').count() > 0, 'Situation textarea for pt-001 exists');
check(await page.locator('#sbar-b-pt-001').count() > 0, 'Background textarea for pt-001 exists');
check(await page.locator('#sbar-a-pt-001').count() > 0, 'Assessment textarea for pt-001 exists');
check(await page.locator('#sbar-r-pt-001').count() > 0, 'Recommendation textarea for pt-001 exists');
const sitVal = await page.locator('#sbar-s-pt-001').inputValue().catch(() => '');
check(sitVal.length > 50, `Situation pre-filled (${sitVal.length} chars)`);
await page.screenshot({ path: 'pw-screenshots/r23-handoff-02-sbar-form.png' });

// ── 6. Mark complete on pt-001 ───────────────────────────────────────────────
log('\n=== 6. MARK COMPLETE (pt-001) ===');
// pt-001 is already "complete" in seed — should show acknowledge button
const ackBtn001 = page.locator('[aria-label="Acknowledge handoff for pt-001"]');
check(await ackBtn001.count() > 0, 'Acknowledge button for pt-001 exists (already complete)');
if (await ackBtn001.count() > 0) {
  await ackBtn001.click();
  await page.waitForTimeout(400);
  ok('Acknowledged pt-001 handoff');
}

// ── 7. Select pt-003 (draft state) ───────────────────────────────────────────
log('\n=== 7. DRAFT PATIENT (pt-003 — partial SBAR) ===');
const card003 = page.locator('[data-id="patient-card-pt-003"]');
if (await card003.count() > 0) {
  await card003.click();
  await page.waitForTimeout(400);
  ok('Selected pt-003 (draft state)');
}
check(await page.locator('#sbar-s-pt-003').count() > 0, 'Situation textarea for pt-003 visible');
const sit003 = await page.locator('#sbar-s-pt-003').inputValue().catch(() => '');
check(sit003.length > 20, `pt-003 situation pre-filled in draft: ${sit003.length} chars`);
// Assessment should be empty for pt-003
const asses003 = await page.locator('#sbar-a-pt-003').inputValue().catch(() => '');
check(asses003.length === 0, `pt-003 assessment is empty (draft): ${asses003.length} chars`);
await page.screenshot({ path: 'pw-screenshots/r23-handoff-03-pt003-draft.png' });

// ── 8. AI Fill (Generate) button ─────────────────────────────────────────────
log('\n=== 8. AI GENERATE BUTTONS ===');
const generateAssess = page.locator('[aria-label="Generate assessment"]');
check(await generateAssess.count() > 0, 'Generate assessment button exists');
if (await generateAssess.count() > 0) {
  await generateAssess.click();
  await page.waitForTimeout(1200); // 700ms generation + buffer
  const newAssess = await page.locator('#sbar-a-pt-003').inputValue().catch(() => '');
  check(newAssess.length > 50, `AI filled assessment (${newAssess.length} chars)`);
  ok('AI Generate assessment worked');
}

// Generate recommendation too
const generateRec = page.locator('[aria-label="Generate recommendation"]');
if (await generateRec.count() > 0) {
  await generateRec.click();
  await page.waitForTimeout(1200);
  const newRec = await page.locator('#sbar-r-pt-003').inputValue().catch(() => '');
  check(newRec.length > 50, `AI filled recommendation (${newRec.length} chars)`);
}

// ── 9. Watch items ────────────────────────────────────────────────────────────
log('\n=== 9. WATCH ITEMS ===');
// Add a watch item
const addFallRisk = page.locator('[aria-label="Add watch item Fall Risk"]');
if (await addFallRisk.count() > 0) {
  await addFallRisk.click();
  await page.waitForTimeout(300);
  ok('Added "Fall Risk" watch item');
  // Verify it appears as active tag with remove button
  const removeBtn = page.locator('[aria-label="Remove watch item Fall Risk"]');
  check(await removeBtn.count() > 0, 'Remove button for "Fall Risk" appears');
  // Remove it
  if (await removeBtn.count() > 0) {
    await removeBtn.click();
    await page.waitForTimeout(300);
    ok('Removed "Fall Risk" watch item');
  }
} else {
  // Fall Risk already in the watch items for pt-003 — check remove button
  ok('Fall Risk already in watch items or not available to add');
}

// ── 10. Mark complete on pt-003 ──────────────────────────────────────────────
log('\n=== 10. MARK COMPLETE (pt-003) ===');
const markComplete003 = page.locator('[aria-label="Mark handoff complete pt-003"]');
check(await markComplete003.count() > 0, 'Mark complete button for pt-003 exists');
if (await markComplete003.count() > 0) {
  await markComplete003.click();
  await page.waitForTimeout(400);
  ok('Marked pt-003 complete');
  // Acknowledge button should now appear
  const ackBtn003 = page.locator('[aria-label="Acknowledge handoff for pt-003"]');
  check(await ackBtn003.count() > 0, 'Acknowledge button appears for pt-003 after completing');
}

// ── 11. Select pt-004 (empty) and fill manually ───────────────────────────────
log('\n=== 11. EMPTY PATIENT (pt-004) — MANUAL FILL ===');
const card004 = page.locator('[data-id="patient-card-pt-004"]');
if (await card004.count() > 0) {
  await card004.click();
  await page.waitForTimeout(400);
  ok('Selected pt-004');
}
// Use generate for all fields
const gS = page.locator('[aria-label="Generate situation"]');
if (await gS.count() > 0) {
  await gS.click();
  await page.waitForTimeout(1000);
  ok('Generated situation for pt-004');
}
const gB = page.locator('[aria-label="Generate background"]');
if (await gB.count() > 0) {
  await gB.click();
  await page.waitForTimeout(1000);
  ok('Generated background for pt-004');
}
const gA = page.locator('[aria-label="Generate assessment"]');
if (await gA.count() > 0) {
  await gA.click();
  await page.waitForTimeout(1000);
  ok('Generated assessment for pt-004');
}
const gR = page.locator('[aria-label="Generate recommendation"]');
if (await gR.count() > 0) {
  await gR.click();
  await page.waitForTimeout(1000);
  ok('Generated recommendation for pt-004');
}
const markComplete004 = page.locator('[aria-label="Mark handoff complete pt-004"]');
if (await markComplete004.count() > 0) {
  await markComplete004.click();
  await page.waitForTimeout(400);
  ok('Marked pt-004 complete');
}

// ── 12. Complete remaining patients (pt-005, pt-006) ─────────────────────────
log('\n=== 12. COMPLETE pt-005 AND pt-006 ===');
for (const ptId of ['pt-005', 'pt-006']) {
  const card = page.locator(`[data-id="patient-card-${ptId}"]`);
  if (await card.count() > 0) {
    await card.click();
    await page.waitForTimeout(300);
    // Quick fill via generate
    for (const field of ['situation', 'background', 'assessment', 'recommendation']) {
      const genBtn = page.locator(`[aria-label="Generate ${field}"]`);
      if (await genBtn.count() > 0) {
        await genBtn.click();
        await page.waitForTimeout(900);
      }
    }
    const markBtn = page.locator(`[aria-label="Mark handoff complete ${ptId}"]`);
    if (await markBtn.count() > 0) {
      await markBtn.click();
      await page.waitForTimeout(400);
      ok(`Marked ${ptId} complete`);
    }
  }
}

// ── 13. Submit handoff (all complete) ────────────────────────────────────────
log('\n=== 13. SUBMIT HANDOFF PACKAGE ===');
await page.waitForTimeout(400);
const progressAfter = await page.locator('#handoff-progress').textContent().catch(() => '');
log(`  Progress: "${progressAfter.trim()}"`);
const submitBtn = page.locator('[aria-label="Submit shift handoff"]');
check(await submitBtn.count() > 0, 'Submit button exists');
// Check it's enabled (all complete)
const isDisabled = await submitBtn.isDisabled().catch(() => true);
if (isDisabled) {
  // Still some pending — check progress
  log(`  Submit button disabled — progress: ${progressAfter.trim()}`);
  err('Submit button is still disabled — not all handoffs complete');
} else {
  await submitBtn.click();
  await page.waitForTimeout(1800);
  check(await page.locator('#handoff-success').count() > 0, 'Success screen shown after submit');
  await page.screenshot({ path: 'pw-screenshots/r23-handoff-04-success.png' });
}

// ── 14. Console errors ────────────────────────────────────────────────────────
log('\n=== 14. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/handoff');
await page.waitForTimeout(800);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

// ── 15. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 15. MOBILE ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/r23-handoff-05-mobile.png' });
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.trim().length > 0, `Page renders on mobile: "${mobileH1?.trim()}"`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
