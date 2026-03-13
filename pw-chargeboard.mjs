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

const chargeLink = page.locator('a[href="/charge"]').first();
if (await chargeLink.count() > 0) log('✓ "Charge Board" nav link found');
else fail('"Charge Board" nav link not found');

// ── 2. Page load ────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/charge');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/cb-01-page-load.png' });

const h1 = page.locator('h1', { hasText: 'Charge Board' });
if (await h1.count() > 0) log('✓ "Charge Board" heading visible');
else fail('"Charge Board" h1 not found');

// ── 3. Stats bar ─────────────────────────────────────────────────────────────
log('\n=== Stats Bar ===');
for (const [id, label] of [
  ['stat-census',     'Census stat'],
  ['stat-avail',      'Available stat'],
  ['stat-acuity',     'Avg Acuity stat'],
  ['stat-ratio',      'Over Ratio stat'],
  ['stat-unassigned', 'Unassigned stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 4. Unit tabs ──────────────────────────────────────────────────────────────
log('\n=== Unit Tabs ===');
for (const unit of ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'ONC', 'TELE']) {
  const tab = page.locator(`[aria-label="Select unit ${unit}"]`).first();
  if (await tab.count() > 0) log(`✓ Unit tab "${unit}" found`);
  else fail(`Unit tab "${unit}" not found`);
}

// ── 5. ICU nurse columns ──────────────────────────────────────────────────────
log('\n=== ICU Nurse Columns ===');
for (const [id, name] of [
  ['n-icu-01', 'Priya Sharma'],
  ['n-icu-02', 'James Okafor'],
  ['n-icu-03', 'Maria Santos'],
  ['n-icu-04', 'Fatima Hassan'],
]) {
  const col = page.locator(`[data-id="nurse-column-${id}"]`).first();
  if (await col.count() > 0) log(`✓ ${name} column visible`);
  else fail(`${name} column not found (data-id="nurse-column-${id}")`);
}

// ── 6. Patient cards ──────────────────────────────────────────────────────────
log('\n=== Patient Cards ===');
for (const [id, name] of [
  ['p-icu-01', 'Chen, Margaret'],
  ['p-icu-02', 'Davis, Robert'],
  ['p-icu-05', 'Thompson, Barbara'],
  ['p-icu-07', 'Martinez, Linda'],
]) {
  const card = page.locator(`[data-id="patient-card-${id}"]`).first();
  if (await card.count() > 0) log(`✓ Patient card "${name}" visible`);
  else fail(`Patient card "${name}" not found (data-id="patient-card-${id}")`);
}

// ── 7. Click patient → reassign panel ─────────────────────────────────────────
log('\n=== Reassign Panel ===');
const chenCard = page.locator('[data-id="patient-card-p-icu-01"]').first();
if (await chenCard.count() > 0) {
  await chenCard.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw-screenshots/cb-02-reassign-panel.png' });

  const panel = page.locator('#reassign-panel').first();
  if (await panel.count() > 0) log('✓ Reassign panel opened');
  else fail('Reassign panel (#reassign-panel) not found');

  // Panel should show patient name
  const nameText = page.locator('#reassign-panel').locator('text=Margaret Chen').first();
  if (await nameText.count() > 0) log('✓ "Margaret Chen" visible in panel');
  else fail('"Margaret Chen" not found in reassign panel');

  // Clinical note section
  const noteSection = page.locator('#reassign-panel').locator('text=Clinical Note').first();
  if (await noteSection.count() > 0) log('✓ Clinical note section visible');
  else fail('Clinical note section not found in panel');

  // Reassign buttons for other nurses
  const reassignJames = page.locator('[aria-label="Reassign to James Okafor"]').first();
  if (await reassignJames.count() > 0) log('✓ "Reassign to James Okafor" button found');
  else fail('"Reassign to James Okafor" button not found');

  // Discharge button
  const dischargeBtn = page.locator(`[aria-label="Discharge patient p-icu-01"]`).first();
  if (await dischargeBtn.count() > 0) log('✓ Discharge button found');
  else fail('Discharge button not found');

} else fail('Chen patient card not found for panel test');

// ── 8. Reassign patient ────────────────────────────────────────────────────────
log('\n=== Reassign Patient ===');
const reassignBtn = page.locator('[aria-label="Reassign to James Okafor"]').first();
if (await reassignBtn.count() > 0) {
  await reassignBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'pw-screenshots/cb-03-after-reassign.png' });

  // Panel should be closed
  const panelGone = await page.locator('#reassign-panel').count();
  if (panelGone === 0) log('✓ Reassign panel closed after reassign');
  else fail('Reassign panel should close after reassign');

  // Chen card should now appear in James column
  const jamesCol = page.locator('[data-id="nurse-column-n-icu-02"]');
  const chenInJames = jamesCol.locator('[data-id="patient-card-p-icu-01"]').first();
  if (await chenInJames.count() > 0) log('✓ Patient moved to James Okafor column');
  else fail('Patient card not found in James column after reassign');

} else fail('Reassign to James button not found');

// ── 9. Close panel via X ───────────────────────────────────────────────────────
log('\n=== Close Panel via Overlay ===');
const davisCard = page.locator('[data-id="patient-card-p-icu-02"]').first();
if (await davisCard.count() > 0) {
  await davisCard.click();
  await page.waitForTimeout(400);
  const panel2 = page.locator('#reassign-panel').first();
  if (await panel2.count() > 0) {
    const closeBtn = page.locator('[aria-label="Close reassign panel"]').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
    const panelGone2 = await page.locator('#reassign-panel').count();
    if (panelGone2 === 0) log('✓ Panel closes via X button');
    else fail('Panel did not close via X button');
  } else fail('Panel did not open for Davis patient');
} else fail('Davis patient card not found');

// ── 10. Discharge patient ──────────────────────────────────────────────────────
log('\n=== Discharge Patient ===');
// Click another patient card to open panel
const davisCard2 = page.locator('[data-id="patient-card-p-icu-02"]').first();
if (await davisCard2.count() > 0) {
  await davisCard2.click();
  await page.waitForTimeout(400);

  const dischargeBtn2 = page.locator(`[aria-label="Discharge patient p-icu-02"]`).first();
  if (await dischargeBtn2.count() > 0) {
    await dischargeBtn2.click();
    await page.waitForTimeout(400);

    // Should show confirm dialog
    const confirmBtn = page.locator(`[aria-label="Confirm discharge p-icu-02"]`).first();
    if (await confirmBtn.count() > 0) {
      log('✓ Discharge confirm dialog appeared');
      await confirmBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'pw-screenshots/cb-04-discharged.png' });

      // Patient card should be gone
      const davisGone = page.locator('[data-id="patient-card-p-icu-02"]').first();
      const davisVisible = await davisGone.isVisible().catch(() => false);
      if (!davisVisible) log('✓ Patient removed from board after discharge');
      else fail('Patient card still visible after discharge');
    } else fail('Discharge confirm button not found');
  } else fail('Discharge button not found in panel');
} else fail('Davis card not found for discharge test');

// ── 11. Balance Load ──────────────────────────────────────────────────────────
log('\n=== Balance Load ===');
const balanceBtn = page.locator('[aria-label="Balance load"]').first();
if (await balanceBtn.count() > 0) {
  log('✓ Balance Load button found');
  await balanceBtn.click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'pw-screenshots/cb-05-balanced.png' });

  // Should show "Balanced!" text
  const balancedText = page.locator('text=Balanced!').first();
  if (await balancedText.count() > 0) log('✓ "Balanced!" message shown after balance');
  else fail('"Balanced!" message not found after balance click');

} else fail('Balance Load button not found');

// ── 12. Unit tab switching ─────────────────────────────────────────────────────
log('\n=== Unit Tab Switching ===');
await page.locator('[aria-label="Select unit CCU"]').first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/cb-06-ccu.png' });

const ccu01 = page.locator('[data-id="patient-card-p-ccu-01"]').first();
if (await ccu01.count() > 0) log('✓ CCU patients visible after tab switch');
else fail('CCU patient card not found after switching to CCU');

const icuCard = page.locator('[data-id="patient-card-p-icu-01"]').first();
const icuVisible = await icuCard.isVisible().catch(() => false);
if (!icuVisible) log('✓ ICU patients hidden after switching to CCU');
else fail('ICU patients should be hidden on CCU tab');

// Switch to ED
await page.locator('[aria-label="Select unit ED"]').first().click();
await page.waitForTimeout(400);
const ed01 = page.locator('[data-id="patient-card-p-ed-01"]').first();
if (await ed01.count() > 0) log('✓ ED patients visible after tab switch');
else fail('ED patient card not found after switching to ED');

// ── 13. Admit patient ─────────────────────────────────────────────────────────
log('\n=== Admit Patient ===');
// Switch back to ICU
await page.locator('[aria-label="Select unit ICU"]').first().click();
await page.waitForTimeout(400);

const admitBtn = page.locator('[aria-label="Admit patient"]').first();
if (await admitBtn.count() > 0) {
  log('✓ Admit Patient button found');
  await admitBtn.click();
  await page.waitForTimeout(400);

  const modal = page.locator('#admit-modal').first();
  if (await modal.count() > 0) {
    log('✓ Admit modal opened');

    // Fill out form
    await page.locator('#admit-room').fill('405A');
    await page.locator('#admit-last-name').fill('Kowalski');
    await page.locator('#admit-first-name').fill('Diana');
    await page.locator('#admit-age').fill('58');
    await page.locator('#admit-diagnosis').fill('Septic shock — Enterococcus BSI');
    await page.locator('#admit-acuity').selectOption('4');

    await page.screenshot({ path: 'pw-screenshots/cb-07-admit-form.png' });

    // Submit
    await page.locator('[aria-label="Submit admit patient"]').click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'pw-screenshots/cb-08-admit-success.png' });

    // New patient card should appear
    const newCard = page.locator('[data-id="patient-card-p-new-001"]').first();
    if (await newCard.count() > 0) log('✓ New patient card visible on board after admit');
    else fail('New patient card (p-new-001) not found after admit');

  } else fail('Admit modal did not open');
} else fail('Admit Patient button not found');

// ── 14. Share board ────────────────────────────────────────────────────────────
log('\n=== Share Board ===');
const shareBtn = page.locator('[aria-label="Share assignment board"]').first();
if (await shareBtn.count() > 0) {
  log('✓ Share Board button found');
  await shareBtn.click();
  await page.waitForTimeout(1200);
  const sentText = page.locator('text=Sent!').first();
  if (await sentText.count() > 0) log('✓ "Sent!" shown after share');
  else fail('"Sent!" text not found after share');
} else fail('Share Board button not found');

// ── 15. Methodology section ───────────────────────────────────────────────────
log('\n=== Methodology Section ===');
const methodology = page.locator('#charge-methodology').first();
if (await methodology.count() > 0) log('✓ Acuity reference section visible');
else fail('Acuity reference section (#charge-methodology) not found');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/charge');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/cb-09-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: 'Charge Board' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
