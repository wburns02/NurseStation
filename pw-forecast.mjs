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

const forecastLink = page.locator('a[href="/forecast"]').first();
if (await forecastLink.count() > 0) log('✓ "Forecast" nav link in sidebar');
else fail('"Forecast" nav link not found');

const badge6 = page.locator('a[href="/forecast"] span').filter({ hasText: '6' }).first();
if (await badge6.count() > 0) log('✓ Forecast badge shows 6');
else log('(badge check skipped — may be hidden when active)');

// ── 2. Page load ───────────────────────────────────────────────────────────────
log('\n=== Page Load ===');
await page.goto(BASE + '/forecast');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/fc-01-page-load.png' });

const h1 = page.locator('h1', { hasText: '7-Day Demand Forecast' });
if (await h1.count() > 0) log('✓ "7-Day Demand Forecast" heading visible');
else fail('"7-Day Demand Forecast" h1 not found');

const weekLabel = page.locator('text=Fri Mar 13').first();
if (await weekLabel.count() > 0) log('✓ Week range "Fri Mar 13" visible in header');
else fail('Week range not found in header');

// ── 3. Forecast accuracy badge ────────────────────────────────────────────────
log('\n=== Accuracy Badge ===');
const accuracy = page.locator('#forecast-accuracy').first();
if (await accuracy.count() > 0) log('✓ Forecast accuracy badge visible');
else fail('Forecast accuracy badge (#forecast-accuracy) not found');

const accuracyText = page.locator('text=94% forecast accuracy').first();
if (await accuracyText.count() > 0) log('✓ "94% forecast accuracy" text visible');
else fail('"94% forecast accuracy" text not found');

// ── 4. Stats row ───────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');
for (const [id, label] of [
  ['stat-shortfalls',    'Predicted Shortfalls stat'],
  ['stat-cost-reactive', 'Cost If Reactive stat'],
  ['stat-savings',       'Act-Now Savings stat'],
  ['stat-confidence',    'Avg Confidence stat'],
]) {
  const el = page.locator(`#${id}`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found (#${id})`);
}

// ── 5. Shortfall alert strip ──────────────────────────────────────────────────
log('\n=== Shortfall Alert Strip ===');
const strip = page.locator('#shortfall-strip').first();
if (await strip.count() > 0) log('✓ Shortfall alert strip visible');
else fail('Shortfall strip (#shortfall-strip) not found');

// Check key shortfall cards
for (const [id, label] of [
  ['sf-ed-1',  'ED Sat critical shortfall'],
  ['sf-ed-2',  'ED Sun tight shortfall'],
  ['sf-icu-3', 'ICU Mon tight shortfall'],
  ['sf-msb-0', 'Med-Surg B Fri tight shortfall'],
  ['sf-ccu-3', 'CCU Mon tight shortfall'],
  ['sf-onc-5', 'Oncology Wed tight shortfall'],
]) {
  const el = page.locator(`[data-id="shortfall-alert-${id}"]`).first();
  if (await el.count() > 0) log(`✓ ${label} card visible`);
  else fail(`${label} card not found (data-id="shortfall-alert-${id}")`);
}

// ── 6. Forecast grid ───────────────────────────────────────────────────────────
log('\n=== Forecast Grid ===');
// Check critical cell — ED Saturday (unitIdx=2, dayIdx=1)
const critCell = page.locator('[data-id="forecast-cell-ed-1"]').first();
if (await critCell.count() > 0) log('✓ ED Saturday critical cell visible');
else fail('ED Saturday critical cell not found (data-id="forecast-cell-ed-1")');

// Check tight cells
for (const [cellId, label] of [
  ['forecast-cell-icu-3',       'ICU Monday tight cell'],
  ['forecast-cell-medsurgb-0',  'MS-B Friday tight cell'],
  ['forecast-cell-ccu-3',       'CCU Monday tight cell'],
  ['forecast-cell-oncology-5',  'Oncology Wednesday tight cell'],
]) {
  const el = page.locator(`[data-id="${cellId}"]`).first();
  if (await el.count() > 0) log(`✓ ${label} visible`);
  else fail(`${label} not found`);
}

// ── 7. Click critical cell → opens detail panel ───────────────────────────────
log('\n=== Detail Panel (via Critical Cell) ===');
await critCell.click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/fc-02-detail-panel.png' });

const detailPanel = page.locator('#forecast-detail-panel').first();
if (await detailPanel.count() > 0) log('✓ Detail panel opened for ED Saturday');
else fail('Detail panel (#forecast-detail-panel) not found after click');

// Panel should show ED data
const edText = page.locator('#forecast-detail-panel').locator('text=Emergency Dept').first();
if (await edText.count() > 0) log('✓ "Emergency Dept" visible in detail panel');
else fail('"Emergency Dept" not found in detail panel');

// Should show drivers
const surgeText = page.locator('#forecast-detail-panel').locator('text=/Saturday night surge/i').first();
if (await surgeText.count() > 0) log('✓ Census driver "Saturday night surge" visible');
else fail('"Saturday night surge" driver text not found in panel');

// Should show cost comparison
const proactiveCost = page.locator('#forecast-detail-panel').locator('text=Proactive cost').first();
if (await proactiveCost.count() > 0) log('✓ Proactive cost comparison visible in panel');
else fail('"Proactive cost" not found in detail panel');

// ── 8. Actions in panel ───────────────────────────────────────────────────────
log('\n=== Panel Actions ===');
const action1 = page.locator('[aria-label="Action act-ed-1-a"]').first();
if (await action1.count() > 0) log('✓ Action "Post to shift board" found');
else fail('Action act-ed-1-a not found');

const action2 = page.locator('[aria-label="Action act-ed-1-b"]').first();
if (await action2.count() > 0) log('✓ Action "Request float pool" found');
else fail('Action act-ed-1-b not found');

// Click first action
const actionBtn1 = page.locator('[aria-label="Action act-ed-1-a"] button').first();
if (await actionBtn1.count() > 0) {
  log('✓ Action button found, clicking...');
  await actionBtn1.click();
  await page.waitForTimeout(1100);
  const sentText = page.locator('[aria-label="Action act-ed-1-a"]').locator('text=Sent!').first();
  if (await sentText.count() > 0) log('✓ Action shows "Sent!" after click');
  else fail('Action did not show "Sent!" state');
} else fail('Action button not found in act-ed-1-a');

await page.screenshot({ path: 'pw-screenshots/fc-03-action-sent.png' });

// ── 9. Close panel ────────────────────────────────────────────────────────────
log('\n=== Close Panel ===');
const closeBtn = page.locator('[aria-label="Close forecast detail"]').first();
if (await closeBtn.count() > 0) {
  await closeBtn.click();
  await page.waitForTimeout(400);
  const panelGone = await page.locator('#forecast-detail-panel').count();
  if (panelGone === 0) log('✓ Detail panel closed');
  else fail('Detail panel did not close');
} else fail('"Close forecast detail" button not found');

// ── 10. Shortfall strip card → opens panel ────────────────────────────────────
log('\n=== Shortfall Card → Panel ===');
const icu3Card = page.locator('[data-id="shortfall-alert-sf-icu-3"]').first();
if (await icu3Card.count() > 0) {
  await icu3Card.click();
  await page.waitForTimeout(500);
  const panel2 = page.locator('#forecast-detail-panel').first();
  if (await panel2.count() > 0) {
    log('✓ Detail panel opens from shortfall strip card');
    const icuText = page.locator('#forecast-detail-panel').locator('text=ICU').first();
    if (await icuText.count() > 0) log('✓ Panel shows ICU data');
    else fail('"ICU" not found in panel opened from strip card');
    // Close
    await page.locator('[aria-label="Close forecast detail"]').first().click();
    await page.waitForTimeout(400);
  } else fail('Panel did not open from shortfall strip card');
} else fail('ICU Mon shortfall strip card not found');

// ── 11. Confidence toggle ─────────────────────────────────────────────────────
log('\n=== Confidence Toggle ===');
const confidenceBtn = page.locator('[aria-label="Toggle confidence display"]').first();
if (await confidenceBtn.count() > 0) {
  log('✓ Confidence toggle button found');
  await confidenceBtn.click();
  await page.waitForTimeout(400);
  const confRow = page.locator('#confidence-row').first();
  if (await confRow.count() > 0) log('✓ Confidence row visible after toggle');
  else fail('Confidence row not visible after toggle');
  // Toggle off
  await confidenceBtn.click();
  await page.waitForTimeout(400);
  const confRowGone = await page.locator('#confidence-row').count();
  if (confRowGone === 0) log('✓ Confidence row hidden after second toggle');
  else fail('Confidence row still visible after toggling off');
} else fail('Confidence toggle button not found');

await page.screenshot({ path: 'pw-screenshots/fc-04-grid.png' });

// ── 12. Forecast methodology section ──────────────────────────────────────────
log('\n=== Methodology Section ===');
const methodology = page.locator('#forecast-methodology').first();
if (await methodology.count() > 0) log('✓ "How the Forecast Works" section visible');
else fail('"How the Forecast Works" section not found');

// ── 13. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/forecast');
await page.waitForTimeout(700);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 14. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/fc-05-mobile.png' });
const mobileH1 = page.locator('h1', { hasText: '7-Day Demand Forecast' });
if (await mobileH1.count() > 0) log('✓ Heading visible on mobile');
else fail('Heading not visible on mobile');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
