import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok    = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err   = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// ── 1. Nav link ───────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(600);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/beds"]');
check(await navLink.count() > 0, 'Census & Beds nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/beds'), `URL is /beds: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Census') && h1?.includes('Bed'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r36-census-01-load.png' });

// ── 3. Hero stats ─────────────────────────────────────────────────────────────
log('\n=== 3. HERO STATS ===');
check(await page.locator('#stat-total-census').count()   > 0, 'stat-total-census exists');
check(await page.locator('#stat-available').count()      > 0, 'stat-available exists');
check(await page.locator('#stat-pending-admits').count() > 0, 'stat-pending-admits exists');
check(await page.locator('#stat-expected-dc').count()    > 0, 'stat-expected-dc exists');
check(await page.locator('#stat-ratio-risk').count()     > 0, 'stat-ratio-risk exists');

const censusText  = await page.locator('#stat-total-census').textContent().catch(() => '');
const availText   = await page.locator('#stat-available').textContent().catch(() => '');
const admitText   = await page.locator('#stat-pending-admits').textContent().catch(() => '');
const riskText    = await page.locator('#stat-ratio-risk').textContent().catch(() => '');
check(censusText && /\d+\/\d+/.test(censusText), `Census shows occupied/total: "${censusText?.slice(0,30)}"`);
check(availText  && /\d/.test(availText),  `Available has number: "${availText?.slice(0,30)}"`);
check(admitText  && /\d/.test(admitText),  `Pending admits has number: "${admitText?.slice(0,30)}"`);
check(riskText   && /\d/.test(riskText),   `Ratio risk has number: "${riskText?.slice(0,30)}"`);

// ── 4. Ratio risk alert ───────────────────────────────────────────────────────
log('\n=== 4. RATIO RISK ALERT ===');
check(await page.locator('#ratio-risk-alert').count() > 0, 'Ratio risk alert banner visible');
const alertTxt = await page.locator('#ratio-risk-alert').textContent().catch(() => '');
check(alertTxt?.includes('Oncology') || alertTxt?.includes('ratio'), `Alert mentions Oncology/ratio: "${alertTxt?.slice(0,80)}"`);
check(await page.locator('[aria-label="Open float request from alert"]').count() > 0, 'Request Float button in alert');

// ── 5. Unit grid ──────────────────────────────────────────────────────────────
log('\n=== 5. UNIT CENSUS GRID ===');
check(await page.locator('#census-unit-grid').count() > 0, 'Unit census grid exists');
const unitCards = await page.locator('[data-id^="unit-card-"]').count();
check(unitCards >= 6, `At least 6 unit cards: ${unitCards}`);
// Specific units
check(await page.locator('[data-id="unit-card-icu"]').count()       > 0, 'ICU card exists');
check(await page.locator('[data-id="unit-card-ccu"]').count()       > 0, 'CCU card exists');
check(await page.locator('[data-id="unit-card-ed"]').count()        > 0, 'ED card exists');
check(await page.locator('[data-id="unit-card-oncology"]').count()  > 0, 'Oncology card exists');
check(await page.locator('[data-id="unit-card-telemetry"]').count() > 0, 'Telemetry card exists');

// Census rings
const rings = await page.locator('[data-id^="census-ring-"]').count();
check(rings >= 6, `At least 6 census rings: ${rings}`);

// Oncology should show RATIO RISK
const oncCard = await page.locator('[data-id="unit-card-oncology"]').textContent().catch(() => '');
check(oncCard?.includes('RATIO RISK') || oncCard?.includes('RISK'), `Oncology shows ratio risk: "${oncCard?.slice(0,100)}"`);
await page.screenshot({ path: 'pw-screenshots/r36-census-02-overview.png' });

// ── 6. Staffing impact panel ──────────────────────────────────────────────────
log('\n=== 6. STAFFING IMPACT ===');
check(await page.locator('#staffing-impact').count() > 0, 'Staffing impact panel exists');
const impactTxt = await page.locator('#staffing-impact').textContent().catch(() => '');
check(impactTxt?.includes('Oncology') || impactTxt?.includes('Risk'), `Impact panel mentions Oncology: "${impactTxt?.slice(0,100)}"`);
check(await page.locator('[data-id^="impact-risk-"]').count() > 0, 'Impact risk rows exist');

// ── 7. Acuity heatmap ─────────────────────────────────────────────────────────
log('\n=== 7. ACUITY HEATMAP ===');
check(await page.locator('#acuity-heatmap').count() > 0, 'Acuity heatmap exists');
const heatRows = await page.locator('[data-id^="heatmap-"]').count();
check(heatRows >= 6, `At least 6 heatmap rows: ${heatRows}`);

// ── 8. Expand unit → patient table ────────────────────────────────────────────
log('\n=== 8. EXPAND UNIT ===');
// Click on the unit label area (not the float button area) to expand
const icuCard = page.locator('[data-id="unit-card-icu"]');
await icuCard.click();
await page.waitForTimeout(500);
// Should stay on overview and expand inline
check(await page.locator('#census-unit-grid').count() > 0, 'Still on overview after expand');
check(await page.locator('#patient-table-icu').count() > 0, 'ICU patient table expanded');
const tableText = await page.locator('#patient-table-icu').textContent().catch(() => '');
check(tableText?.includes('Chen') || tableText?.includes('Davis'), `Patient table shows patients: "${tableText?.slice(0,80)}"`);
check(tableText?.includes('Acuity') || tableText?.includes('Room'), 'Patient table has column headers');
await page.screenshot({ path: 'pw-screenshots/r36-census-03-expanded.png' });

// ── 9. DC Ready action ────────────────────────────────────────────────────────
log('\n=== 9. DC READY ACTION ===');
const dcBtns = page.locator('[aria-label^="Mark discharge ready"]');
check(await dcBtns.count() > 0, 'DC Ready buttons visible for eligible patients');
if (await dcBtns.count() > 0) {
  await dcBtns.first().click();
  await page.waitForTimeout(500);
}
check(await page.locator('#action-toast').count() > 0, 'Toast shown after DC Ready');
const dcToast = await page.locator('#action-toast').textContent().catch(() => '');
check(dcToast?.includes('discharge') || dcToast?.includes('flagged'), `DC toast text: "${dcToast?.trim()}"`);
await page.waitForTimeout(4000);

// ── 10. Acuity update ─────────────────────────────────────────────────────────
log('\n=== 10. ACUITY UPDATE ===');
const acuityBtns = page.locator('[aria-label^="Acuity"]');
check(await acuityBtns.count() > 0, 'Acuity buttons exist');
if (await acuityBtns.count() > 0) {
  await acuityBtns.first().click();
  await page.waitForTimeout(300);
  // Acuity picker should appear
  const acuityPicker = page.locator('[aria-label^="Set acuity"]');
  check(await acuityPicker.count() >= 5, `Acuity picker has 5 options: ${await acuityPicker.count()}`);
  await page.locator('[aria-label^="Set acuity 3"]').first().click();
  await page.waitForTimeout(500);
  check(await page.locator('#action-toast').count() > 0, 'Toast after acuity change');
  await page.waitForTimeout(4000);
}

// ── 11. Float request from card ───────────────────────────────────────────────
log('\n=== 11. FLOAT REQUEST ===');
// Must be on overview tab — make sure
await page.locator('#tab-overview').click();
await page.waitForTimeout(300);
const floatBtn = page.locator('[aria-label^="Request float for"]').first();
check(await floatBtn.count() > 0, 'Request float button visible for at-risk unit');
if (await floatBtn.count() > 0) {
  await floatBtn.click();
  await page.waitForTimeout(400);
  check(await page.locator('#float-request-modal').count() > 0, 'Float request modal opened');
  const modalTxt = await page.locator('#float-request-modal').textContent().catch(() => '');
  check(modalTxt?.includes('Float') || modalTxt?.includes('Ratio'), `Modal has content: "${modalTxt?.slice(0,80)}"`);
  if (await page.locator('#float-request-modal').count() > 0) {
    await page.fill('textarea', 'Oncology 2 pending admissions — projected 11 patients, only 3 nurses on duty, need 4th');
    await page.locator('[aria-label="Confirm float request"]').click();
    await page.waitForTimeout(500);
    check(await page.locator('#float-request-modal').count() === 0, 'Modal closed after confirm');
    check(await page.locator('#action-toast').count() > 0, 'Toast after float request');
    await page.waitForTimeout(4000);
  }
} else {
  err('Float request modal opened');
  err('Modal has content');
  err('Modal closed after confirm');
  err('Toast after float request');
}

// ── 12. Bed Map tab ───────────────────────────────────────────────────────────
log('\n=== 12. BED MAP TAB ===');
await page.locator('#tab-beds').click();
await page.waitForTimeout(400);
check(await page.locator('#bed-map-view').count() > 0, 'Bed map view exists');
const bedMaps = await page.locator('[data-id^="bed-map-"]').count();
check(bedMaps >= 6, `At least 6 unit bed maps: ${bedMaps}`);
const bedCells = await page.locator('[data-id^="bed-cell-"]').count();
check(bedCells >= 50, `At least 50 bed cells: ${bedCells}`);
await page.screenshot({ path: 'pw-screenshots/r36-census-04-bedmap.png' });

// Expand a unit in bed map
await page.locator('[data-id="bed-map-icu"] button').last().click();
await page.waitForTimeout(400);
check(await page.locator('#patient-table-icu').count() > 0, 'ICU patient table visible from bed map');

// ── 13. Patients tab ──────────────────────────────────────────────────────────
log('\n=== 13. PATIENTS TAB ===');
await page.locator('#tab-patients').click();
await page.waitForTimeout(500);
check(await page.locator('#all-patients-view').count() > 0, 'All patients view exists');
const unitSections = await page.locator('[data-id^="patients-unit-"]').count();
check(unitSections >= 6, `At least 6 unit sections: ${unitSections}`);
const patientRows = await page.locator('[data-id^="patient-row-"]').count();
check(patientRows >= 30, `At least 30 patient rows: ${patientRows}`);
check(await page.locator('[data-id^="patients-unit-icu"]').count() > 0, 'ICU section exists');
check(await page.locator('[data-id^="patients-unit-oncology"]').count() > 0, 'Oncology section exists');
await page.screenshot({ path: 'pw-screenshots/r36-census-05-patients.png' });

// ── 14. ADT tab ───────────────────────────────────────────────────────────────
log('\n=== 14. ADT FEED TAB ===');
await page.locator('#tab-adt').click();
await page.waitForTimeout(400);
check(await page.locator('#adt-feed').count() > 0, 'ADT feed exists');
const adtEvents = await page.locator('[data-id^="adt-event-"]').count();
check(adtEvents >= 8, `At least 8 ADT events: ${adtEvents}`);
// Check ADT filter buttons
check(await page.locator('#adt-filter-all').count() > 0, 'ADT filter All exists');
check(await page.locator('#adt-filter-pending').count() > 0, 'ADT filter Pending exists');
check(await page.locator('#adt-filter-completed').count() > 0, 'ADT filter Completed exists');
// Check content
const adtTxt = await page.locator('#adt-feed').textContent().catch(() => '');
check(adtTxt?.includes('Pending') || adtTxt?.includes('Admitted'), `ADT feed has event types: "${adtTxt?.slice(0,100)}"`);
check(adtTxt?.includes('Oncology') || adtTxt?.includes('ICU'), 'ADT feed mentions units');
await page.screenshot({ path: 'pw-screenshots/r36-census-06-adt.png' });

// Filter ADT
await page.locator('#adt-filter-pending').click();
await page.waitForTimeout(300);
const pendingEvents = await page.locator('[data-id^="adt-event-"]').count();
check(pendingEvents > 0, `Pending filter shows events: ${pendingEvents}`);
check(pendingEvents < adtEvents, `Pending filter reduces count (${pendingEvents} < ${adtEvents})`);

await page.locator('#adt-filter-all').click();
await page.waitForTimeout(200);

// ── 15. Return to Overview ────────────────────────────────────────────────────
log('\n=== 15. TAB RETURN ===');
await page.locator('#tab-overview').click();
await page.waitForTimeout(300);
check(await page.locator('#census-unit-grid').count() > 0, 'Overview restored');

// ── 16. Float from alert banner ───────────────────────────────────────────────
log('\n=== 16. FLOAT FROM ALERT ===');
check(await page.locator('[aria-label="Open float request from alert"]').count() > 0, 'Float request in alert banner');
await page.locator('[aria-label="Open float request from alert"]').click();
await page.waitForTimeout(400);
check(await page.locator('#float-request-modal').count() > 0, 'Modal from alert opened');
// Close modal
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 17. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Census'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#stat-total-census').count() > 0, 'Stats visible on mobile');
check(await page.locator('#census-unit-grid').count() > 0, 'Unit grid visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r36-census-07-mobile.png' });

// ── 18. Console errors ────────────────────────────────────────────────────────
log('\n=== 18. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/beds');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
