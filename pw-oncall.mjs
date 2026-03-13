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
const navLink = page.locator('a[href="/oncall"]');
check(await navLink.count() > 0, 'On-Call nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/oncall'), `URL is /oncall: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('On-Call') && h1?.includes('Rotation'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r35-oncall-01-load.png' });

// ── 3. Hero stats ─────────────────────────────────────────────────────────────
log('\n=== 3. HERO STATS ===');
check(await page.locator('#stat-active').count() > 0, 'stat-active exists');
check(await page.locator('#stat-blocked').count() > 0, 'stat-blocked exists');
check(await page.locator('#stat-ready').count() > 0, 'stat-ready exists');
check(await page.locator('#stat-nurses').count() > 0, 'stat-nurses exists');
const activeText  = await page.locator('#stat-active').textContent().catch(() => '');
const blockedText = await page.locator('#stat-blocked').textContent().catch(() => '');
const nursesText  = await page.locator('#stat-nurses').textContent().catch(() => '');
check(activeText  && /\d/.test(activeText),  `Active stat has number: "${activeText?.slice(0,30)}"`);
check(blockedText && /\d/.test(blockedText), `Blocked stat has number: "${blockedText?.slice(0,30)}"`);
check(nursesText  && /14/.test(nursesText),  `Nurses stat shows 14: "${nursesText?.slice(0,30)}"`);

// ── 4. Alert banners ──────────────────────────────────────────────────────────
log('\n=== 4. ALERT BANNERS ===');
check(await page.locator('#active-alert').count() > 0, 'Active activation alert visible');
const alertTxt = await page.locator('#active-alert').textContent().catch(() => '');
check(alertTxt?.includes('James Wilson') || alertTxt?.includes('activated'), `Alert mentions active nurse: "${alertTxt?.slice(0,80)}"`);
check(alertTxt?.includes('ED'), 'Alert mentions ED unit');

check(await page.locator('#blocked-alert').count() > 0, 'Blocked alert banner visible');
const blockedTxt = await page.locator('#blocked-alert').textContent().catch(() => '');
check(blockedTxt?.includes('blocked') || blockedTxt?.includes('Safe Hours'), `Blocked alert text: "${blockedTxt?.slice(0,80)}"`);

// ── 5. Today tab ─────────────────────────────────────────────────────────────
log('\n=== 5. TODAY TAB ===');
check(await page.locator('#tab-today').count() > 0, 'Today tab exists');
check(await page.locator('#today-oncall').count() > 0, 'Today on-call panel exists');

// Shift filter buttons
check(await page.locator('#shift-filter-all').count() > 0, 'All shifts filter exists');
check(await page.locator('#shift-filter-evening').count() > 0, 'Evening filter exists');
check(await page.locator('#shift-filter-night').count() > 0, 'Night filter exists');

// Check slot cards exist
const totalSlots = await page.locator('[data-id^="oncall-slot-"]').count();
check(totalSlots >= 12, `At least 12 slot cards today: ${totalSlots}`);

// Specific slots
check(await page.locator('[data-id="oncall-slot-oc-012"]').count() > 0, 'James Wilson (oc-012) slot exists');
check(await page.locator('[data-id="oncall-slot-oc-011"]').count() > 0, 'David Thompson blocked (oc-011) slot exists');
check(await page.locator('[data-id="oncall-slot-oc-021"]').count() > 0, 'Patricia Moore blocked (oc-021) slot exists');

// Verify blocked slots show block indicator
const dtSlot = await page.locator('[data-id="oncall-slot-oc-011"]').textContent().catch(() => '');
check(dtSlot?.includes('Safe Hours') || dtSlot?.includes('blocked') || dtSlot?.includes('Blocked'), `David Thompson shows blocked: "${dtSlot?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r35-oncall-02-today.png' });

// ── 6. Evening filter ──────────────────────────────────────────────────────────
log('\n=== 6. SHIFT FILTER ===');
await page.locator('#shift-filter-evening').click();
await page.waitForTimeout(300);
const eveningSlots = await page.locator('[data-id^="oncall-slot-"]').count();
check(eveningSlots > 0, `Evening filter shows slots: ${eveningSlots}`);
check(eveningSlots < totalSlots, `Evening filter reduces slot count (${eveningSlots} < ${totalSlots})`);

await page.locator('#shift-filter-night').click();
await page.waitForTimeout(300);
const nightSlots = await page.locator('[data-id^="oncall-slot-"]').count();
check(nightSlots > 0, `Night filter shows slots: ${nightSlots}`);

await page.locator('#shift-filter-all').click();
await page.waitForTimeout(200);

// ── 7. Activate slot ──────────────────────────────────────────────────────────
log('\n=== 7. ACTIVATE SLOT ===');
// Find a schedulable slot (oc-001 = ICU evening primary, Sarah Kim)
const activateBtn = page.locator('[aria-label="Activate on-call oc-001"]');
check(await activateBtn.count() > 0, 'Activate button exists for ICU evening slot');
if (await activateBtn.count() > 0) {
  await activateBtn.click();
  await page.waitForTimeout(400);
}

// ── 8. Activation modal ───────────────────────────────────────────────────────
log('\n=== 8. ACTIVATION MODAL ===');
check(await page.locator('#activation-modal').count() > 0, 'Activation modal opened');
const modalTxt = await page.locator('#activation-modal').textContent().catch(() => '');
check(modalTxt?.includes('Sarah Kim') || modalTxt?.includes('ICU'), `Modal shows nurse/unit: "${modalTxt?.slice(0,80)}"`);
check(modalTxt?.includes('(555)'), 'Modal shows nurse phone');
check(await page.locator('[aria-label="Confirm activate on-call"]').count() > 0, 'Confirm button exists');

// Confirm button should be disabled without reason
const confirmBtn = page.locator('[aria-label="Confirm activate on-call"]');
const isDisabled = await confirmBtn.isDisabled();
check(isDisabled, 'Confirm button disabled without reason text');

// Type reason and submit
await page.fill('textarea', 'ICU census surge — additional coverage needed');
await page.waitForTimeout(200);
const isDisabledAfter = await confirmBtn.isDisabled();
check(!isDisabledAfter, 'Confirm button enabled after typing reason');
await page.screenshot({ path: 'pw-screenshots/r35-oncall-03-modal.png' });
await confirmBtn.click();
await page.waitForTimeout(500);

check(await page.locator('#activation-modal').count() === 0, 'Modal closed after confirm');
check(await page.locator('#activate-toast').count() > 0, 'Toast shown after activation');
const toastTxt = await page.locator('#activate-toast').textContent().catch(() => '');
check(toastTxt?.includes('Sarah') || toastTxt?.includes('activated'), `Toast text: "${toastTxt?.trim()}"`);
await page.waitForTimeout(4000);

// ── 9. Calendar tab ──────────────────────────────────────────────────────────
log('\n=== 9. CALENDAR TAB ===');
await page.locator('#tab-calendar').click();
await page.waitForTimeout(400);
check(await page.locator('#oncall-calendar').count() > 0, 'Calendar view exists');
const calTxt = await page.locator('#oncall-calendar').textContent().catch(() => '');
check(calTxt?.includes('13') && (calTxt?.includes('Fri') || calTxt?.includes('Sat')), 'Calendar shows date 13 with weekdays');
check(calTxt?.includes('Fri') || calTxt?.includes('Sat'), 'Calendar shows weekday headers');
// Calendar should have slot cells
const calSlots = await page.locator('[data-id^="cal-slot-"]').count();
check(calSlots >= 10, `Calendar has slot cells: ${calSlots}`);
await page.screenshot({ path: 'pw-screenshots/r35-oncall-04-calendar.png' });

// ── 10. Rotation tab ──────────────────────────────────────────────────────────
log('\n=== 10. ROTATION TAB ===');
await page.locator('#tab-rotation').click();
await page.waitForTimeout(400);
check(await page.locator('#rotation-stats').count() > 0, 'Rotation stats panel exists');
const rotTxt = await page.locator('#rotation-stats').textContent().catch(() => '');
check(rotTxt?.includes('David Thompson') || rotTxt?.includes('Sarah Kim'), 'Rotation shows nurse names');
check(rotTxt?.includes('BLOCKED'), 'Rotation shows BLOCKED badge for safe-hours nurses');
check(rotTxt?.includes('OVER')  || rotTxt?.includes('UNDER'), 'Rotation shows over/under badges');
// Individual nurse bars
const rotNurses = await page.locator('[data-id^="rotation-nurse-"]').count();
check(rotNurses >= 14, `At least 14 nurses in rotation: ${rotNurses}`);
check(await page.locator('[data-id="rotation-nurse-st-004"]').count() > 0, 'David Thompson rotation row exists');
const dtRotTxt = await page.locator('[data-id="rotation-nurse-st-004"]').textContent().catch(() => '');
check(dtRotTxt?.includes('BLOCKED'), `David Thompson shows BLOCKED: "${dtRotTxt?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r35-oncall-05-rotation.png' });

// ── 11. Log tab ───────────────────────────────────────────────────────────────
log('\n=== 11. LOG TAB ===');
await page.locator('#tab-log').click();
await page.waitForTimeout(400);
check(await page.locator('#activation-log').count() > 0, 'Activation log exists');
const logTxt = await page.locator('#activation-log').textContent().catch(() => '');
check(logTxt?.includes('James Wilson') || logTxt?.includes('ED surge'), 'Log shows James Wilson activation');
check(logTxt?.includes('Sarah Kim') || logTxt?.includes('ICU'), 'Log shows recent ICU activation');
check(logTxt?.includes('Mar 12') || logTxt?.includes('Mar 11'), 'Log shows historical dates');
// Log events
const logEvents = await page.locator('[data-id^="log-event-"]').count();
check(logEvents >= 5, `At least 5 log events: ${logEvents}`);
check(await page.locator('[data-id="log-event-act-001"]').count() > 0, 'James Wilson event exists');
await page.screenshot({ path: 'pw-screenshots/r35-oncall-06-log.png' });

// ── 12. Mark arrived ─────────────────────────────────────────────────────────
log('\n=== 12. MARK ARRIVED ===');
// James Wilson event (act-001) should have mark arrived button
const arrivedBtn = page.locator('[aria-label="Mark arrived act-001"]');
check(await arrivedBtn.count() > 0, 'Mark arrived button for James Wilson exists');
if (await arrivedBtn.count() > 0) {
  await arrivedBtn.click();
  await page.waitForTimeout(500);
}
check(await page.locator('#activate-toast').count() > 0, 'Toast shown after mark arrived');
const arrivedToast = await page.locator('#activate-toast').textContent().catch(() => '');
check(arrivedToast?.includes('James Wilson') || arrivedToast?.includes('arrived'), `Arrived toast: "${arrivedToast?.trim()}"`);
await page.waitForTimeout(4000);

// ── 13. Return to Today tab ───────────────────────────────────────────────────
log('\n=== 13. TAB NAVIGATION RETURN ===');
await page.locator('#tab-today').click();
await page.waitForTimeout(300);
check(await page.locator('#today-oncall').count() > 0, 'Today panel restored on tab return');

// ── 14. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 14. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('On-Call'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#stat-active').count() > 0, 'Stats visible on mobile');
check(await page.locator('#today-oncall').count() > 0, 'Today panel visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r35-oncall-07-mobile.png' });

// ── 15. Console errors ─────────────────────────────────────────────────────────
log('\n=== 15. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/oncall');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
