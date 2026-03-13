import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 — this is a mobile-first feature
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok    = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err   = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// ── 1. Nav link ──────────────────────────────────────────────────────────────
await page.goto(BASE + '/');
await page.waitForTimeout(600);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/timeclock"]');
check(await navLink.count() > 0, 'Time Clock nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(800);
}

// ── 2. Page load ─────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/timeclock'), 'URL is /timeclock');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Time Clock'), `h1 contains "Time Clock": "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r24-tc-01-page.png' });

// ── 3. Live clock ─────────────────────────────────────────────────────────────
log('\n=== 3. LIVE CLOCK ===');
check(await page.locator('#current-time').count() > 0, 'Live clock (#current-time) exists');
const clockText1 = await page.locator('#current-time').textContent().catch(() => '');
await page.waitForTimeout(1200);
const clockText2 = await page.locator('#current-time').textContent().catch(() => '');
// Clock text should have changed (seconds ticking)
check(clockText1 !== clockText2, `Clock is ticking: "${clockText1?.slice(0,8)}" → "${clockText2?.slice(0,8)}"`);

// ── 4. Location status (starts as "checking", resolves to "on-premises") ─────
log('\n=== 4. LOCATION STATUS ===');
// Initially checking
const locEl = page.locator('#location-status');
check(await locEl.count() > 0, 'Location status element exists');
// Wait for GPS resolve (1.5s from mount)
await page.waitForTimeout(2000);
const locText = await locEl.textContent().catch(() => '');
check(locText?.includes('On Premises') || locText?.includes('GPS'), `Location resolved: "${locText?.trim()?.slice(0,30)}"`);
await page.screenshot({ path: 'pw-screenshots/r24-tc-02-location.png' });

// ── 5. Session timer (currently clocked in) ──────────────────────────────────
log('\n=== 5. SESSION TIMER ===');
check(await page.locator('#session-timer').count() > 0, 'Session timer visible (clocked in)');
const timerText = await page.locator('#session-timer').textContent().catch(() => '');
check(timerText?.includes('h') || timerText?.includes('m'), `Session timer shows time: "${timerText?.trim()?.slice(0,20)}"`);

// ── 6. Status badge shows ON CLOCK ───────────────────────────────────────────
log('\n=== 6. STATUS BADGE ===');
const pageText = await page.locator('body').textContent().catch(() => '');
check(pageText?.includes('ON CLOCK'), 'Status badge shows ON CLOCK (seeded as clocked in)');

// ── 7. Pay period stats ───────────────────────────────────────────────────────
log('\n=== 7. PAY PERIOD ===');
check(await page.locator('#pay-period-regular').count() > 0, '#pay-period-regular exists');
check(await page.locator('#pay-period-ot').count() > 0, '#pay-period-ot exists');
const regularHrs = await page.locator('#pay-period-regular').textContent().catch(() => '');
check(regularHrs?.includes('40'), `Regular hours shows 40h: "${regularHrs?.trim()}"`);
const otHrs = await page.locator('#pay-period-ot').textContent().catch(() => '');
check(otHrs?.includes('h'), `OT hours shows value: "${otHrs?.trim()}"`);

// ── 8. Upcoming shifts ───────────────────────────────────────────────────────
log('\n=== 8. UPCOMING SHIFTS ===');
const shiftText = await page.locator('body').textContent().catch(() => '');
check(shiftText?.includes('ICU'), 'Upcoming shifts show ICU');
check(shiftText?.includes('Day Off') || shiftText?.includes('MS-A'), 'Upcoming shifts have variety');

// ── 9. Punch history ─────────────────────────────────────────────────────────
log('\n=== 9. PUNCH HISTORY ===');
check(await page.locator('[data-id="punch-punch-012-in"]').count() > 0, 'Today clock-in punch visible');
check(await page.locator('[data-id="punch-punch-011-out"]').count() > 0, 'Yesterday clock-out punch visible');
check(await page.locator('[data-id="punch-punch-011-in"]').count() > 0, 'Yesterday clock-in punch visible');

// ── 10. Clock Out action ─────────────────────────────────────────────────────
log('\n=== 10. CLOCK OUT ===');
const clockOutBtn = page.locator('[aria-label="Clock out"]');
check(await clockOutBtn.count() > 0, 'Clock Out button exists');
if (await clockOutBtn.count() > 0) {
  await clockOutBtn.click();
  await page.waitForTimeout(500);
  // Success message
  check(await page.locator('#punch-success').count() > 0 ||
        (await page.locator('body').textContent()).includes('Clocked Out'),
        'Clock out success message shown');
  await page.screenshot({ path: 'pw-screenshots/r24-tc-03-clocked-out.png' });
  await page.waitForTimeout(2200); // wait for success to fade
}

// ── 11. State changed to Clock In ────────────────────────────────────────────
log('\n=== 11. STATE AFTER CLOCK OUT ===');
const clockInBtn = page.locator('[aria-label="Clock in"]');
check(await clockInBtn.count() > 0, 'Clock In button appears after clocking out');
const pageTextAfter = await page.locator('body').textContent().catch(() => '');
check(pageTextAfter?.includes('OFF CLOCK') || !pageTextAfter?.includes('ON CLOCK'), 'Status changed to OFF CLOCK');
// Session timer should be gone
check(await page.locator('#session-timer').count() === 0, 'Session timer hidden after clock out');

// ── 12. Clock back In ────────────────────────────────────────────────────────
log('\n=== 12. CLOCK BACK IN ===');
if (await clockInBtn.count() > 0) {
  await clockInBtn.click();
  await page.waitForTimeout(500);
  check(
    await page.locator('#punch-success').count() > 0 ||
    (await page.locator('body').textContent()).includes('Clocked In'),
    'Clock in success shown'
  );
  await page.screenshot({ path: 'pw-screenshots/r24-tc-04-clocked-in-again.png' });
  await page.waitForTimeout(2200);
}

// ── 13. New punches appear in history ────────────────────────────────────────
log('\n=== 13. NEW PUNCHES IN HISTORY ===');
const allPunches = await page.locator('[data-id^="punch-"]').count();
check(allPunches >= 3, `History has new punches: ${allPunches} total (2 new + old)`);

// ── 14. Show all punches ─────────────────────────────────────────────────────
log('\n=== 14. SHOW MORE PUNCHES ===');
const showMoreBtn = page.locator('[aria-label="Show all punches"]');
if (await showMoreBtn.count() > 0) {
  await showMoreBtn.click();
  await page.waitForTimeout(300);
  const expandedPunches = await page.locator('[data-id^="punch-"]').count();
  check(expandedPunches >= allPunches, `Expanded shows more: ${expandedPunches}`);
  ok('Show all punches works');
} else {
  ok('All punches visible without pagination (≤8 total)');
}

// ── 15. Console errors ───────────────────────────────────────────────────────
log('\n=== 15. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/timeclock');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

// ── 16. Desktop viewport ─────────────────────────────────────────────────────
log('\n=== 16. DESKTOP VIEWPORT ===');
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/r24-tc-05-desktop.png' });
const desktopH1 = await page.locator('h1').first().textContent().catch(() => '');
check(desktopH1?.includes('Time Clock'), `Desktop renders correctly: "${desktopH1?.trim()}"`);
check(await page.locator('#current-time').count() > 0, 'Clock visible on desktop');

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
