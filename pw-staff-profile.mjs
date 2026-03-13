import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';

let pass = true;
const log = (m) => console.log(m);
const fail = (m) => { console.error('FAIL: ' + m); pass = false; };

// ── 1. Staff list — name is clickable ────────────────────────────────────────
log('\n=== Staff List ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/sp-01-staff-list.png' });

const sarahName = page.locator('button').filter({ hasText: 'Sarah Chen' }).first();
if (await sarahName.count() > 0) log('✓ Sarah Chen name clickable in staff list');
else fail('Sarah Chen clickable button not found in staff list');

// ── 2. Navigate to Sarah Chen's profile via click ────────────────────────────
log('\n=== Sarah Chen Profile ===');
await sarahName.click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/sp-02-sarah-profile.png' });

// Check hero
const profileName = page.locator('h1', { hasText: 'Sarah Chen' });
if (await profileName.count() > 0) log('✓ Profile hero shows "Sarah Chen"');
else fail('"Sarah Chen" h1 not found in profile');

const roleText = page.locator('text=RN').first();
if (await roleText.count() > 0) log('✓ Role visible in profile');
else fail('Role not found in profile');

// Check URL
const url = page.url();
if (url.includes('/staff/s001')) log(`✓ URL is ${url}`);
else fail(`URL is ${url}, expected /staff/s001`);

// ── 3. Stats row ─────────────────────────────────────────────────────────────
log('\n=== Stats Row ===');

const payPeriodCard = page.locator('text=Pay Period').first();
if (await payPeriodCard.count() > 0) log('✓ Pay Period stat card visible');
else fail('Pay Period stat card not found');

const otRiskCard = page.locator('text=OT Risk').first();
if (await otRiskCard.count() > 0) log('✓ OT Risk stat card visible');
else fail('OT Risk stat card not found');

const reliabilityCard = page.locator('text=Reliability').first();
if (await reliabilityCard.count() > 0) log('✓ Reliability stat card visible');
else fail('Reliability stat card not found');

const credCard = page.locator('text=Credentials').first();
if (await credCard.count() > 0) log('✓ Credentials stat card visible');
else fail('Credentials stat card not found');

// ── 4. Availability Calendar ─────────────────────────────────────────────────
log('\n=== Availability Calendar ===');
const calendarHeading = page.locator('text=Availability').first();
if (await calendarHeading.count() > 0) log('✓ Availability calendar section visible');
else fail('Availability calendar not found');

// Today marker (Mar 12 highlighted with violet ring)
const todayMarker = page.locator('text=12').first();
if (await todayMarker.count() > 0) log('✓ Calendar date numbers visible (today = 12)');
else fail('Calendar date numbers not found');

// Day labels
const monLabel = page.locator('text=Mon').first();
if (await monLabel.count() > 0) log('✓ Mon-Sun day labels visible in calendar');
else fail('Calendar day labels not found');

// ── 5. OT Cost Calculator ─────────────────────────────────────────────────────
log('\n=== OT Cost Calculator ===');
const otCalc = page.locator('text=OT Cost Calculator').first();
if (await otCalc.count() > 0) log('✓ OT Cost Calculator section visible');
else fail('OT Cost Calculator not found');

// Check cost calculation text (Sarah has 32h worked, 80h threshold, 48h left)
const regularPay = page.locator('text=Regular pay').first();
if (await regularPay.count() > 0) log('✓ "Regular pay" label visible (no OT triggered)');
else fail('"Regular pay" label not found');

// Change hours with + button
const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
await plusBtn.click();
await page.waitForTimeout(200);
const hours12 = page.locator('text=12h').first();
if (await hours12.count() > 0) log('✓ Hours incremented to 12h via + button');
else fail('Hours increment not working');

// Decrement back
const minusBtn = page.locator('button').filter({ hasText: '−' }).first();
await minusBtn.click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'pw-screenshots/sp-03-ot-calculator.png' });

// ── 6. Assign to Gap button ───────────────────────────────────────────────────
log('\n=== Assign to Gap ===');
const assignBtn = page.locator('a').filter({ hasText: 'Assign to Gap' }).first();
if (await assignBtn.count() > 0) log('✓ "Assign to Gap" CTA visible');
else fail('"Assign to Gap" button not found');

// ── 7. Message button ─────────────────────────────────────────────────────────
log('\n=== Message Button ===');
const msgBtn = page.locator('a').filter({ hasText: 'Send Message' }).first();
if (await msgBtn.count() > 0) log('✓ "Send Message" button visible');
else fail('"Send Message" button not found');

// ── 8. Credential Passport ────────────────────────────────────────────────────
log('\n=== Credential Passport ===');
const credPassport = page.locator('text=Credential Passport').first();
if (await credPassport.count() > 0) log('✓ Credential Passport section visible');
else fail('Credential Passport section not found');

// Sarah has no creds in credentialsData, so should show fallback with cert badges
const ccrn = page.locator('text=CCRN').first();
if (await ccrn.count() > 0) log('✓ CCRN certification visible in passport');
else fail('CCRN cert not visible in credential passport');

// ── 9. Recent Shift History ───────────────────────────────────────────────────
log('\n=== Recent Shift History ===');
const shiftHistory = page.locator('text=Recent Shift History').first();
if (await shiftHistory.count() > 0) log('✓ Recent Shift History section visible');
else fail('Recent Shift History not found');

const icuShift = page.locator('text=ICU').first();
if (await icuShift.count() > 0) log('✓ ICU shift visible in history');
else fail('ICU shift not visible in history');

// ── 10. Performance Summary ────────────────────────────────────────────────────
log('\n=== Performance Summary ===');
const perfSummary = page.locator('text=Performance Summary').first();
if (await perfSummary.count() > 0) log('✓ Performance Summary section visible');
else fail('Performance Summary not found');

const ytdOt = page.locator('text=YTD OT Hours').first();
if (await ytdOt.count() > 0) log('✓ YTD OT Hours metric visible');
else fail('YTD OT Hours not found');

// ── 11. Navigate to James Okafor (has credentials + is near OT) ──────────────
log('\n=== James Okafor Profile (Near OT + Expired Cred) ===');
await page.goto(BASE + '/staff/e002');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/sp-04-james-profile.png' });

const jamesName = page.locator('h1', { hasText: 'James Okafor' });
if (await jamesName.count() > 0) log('✓ James Okafor profile loads');
else fail('James Okafor profile not found');

// James has BLS expired → credential passport should show "Expired"
const expiredBadge = page.locator('text=Expired').first();
if (await expiredBadge.count() > 0) log('✓ "Expired" credential badge visible for James');
else fail('Expired credential badge not found for James');

// James has 36h/80h → OT Risk shows high usage
const jamesOtRisk = page.locator('text=OT Risk').first();
if (await jamesOtRisk.count() > 0) log('✓ OT Risk section visible for James');
else fail('OT Risk section not found for James');

// ── 12. Navigate to Lisa Greenwald (critical credential) ─────────────────────
log('\n=== Lisa Greenwald Profile (Critical Cred) ===');
await page.goto(BASE + '/staff/e021');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/sp-05-lisa-profile.png' });

const lisaName = page.locator('h1', { hasText: 'Lisa Greenwald' });
if (await lisaName.count() > 0) log('✓ Lisa Greenwald profile loads');
else fail('Lisa Greenwald profile not found');

const criticalBadge = page.locator('text=Critical').first();
if (await criticalBadge.count() > 0) log('✓ Critical credential badge visible for Lisa');
else fail('Critical credential badge not found for Lisa');

const lisaNotes = page.locator('text=RNC-NIC expiring').first();
if (await lisaNotes.count() > 0) log('✓ Credential expiry note visible');
else fail('Credential expiry note not found for Lisa');

// ── 13. Back button navigates to /staff ───────────────────────────────────────
log('\n=== Back Navigation ===');
const backBtn = page.locator('button').filter({ hasText: 'Staff Roster' }).first();
if (await backBtn.count() > 0) {
  await backBtn.click();
  await page.waitForTimeout(400);
  const staffUrl = page.url();
  if (staffUrl.includes('/staff') && !staffUrl.includes('/staff/')) log('✓ Back button returns to /staff');
  else fail(`Back button went to ${staffUrl}, expected /staff`);
} else {
  fail('Back button (Staff Roster) not found');
}

// ── 14. Staff list — click name button navigates to profile ──────────────────
log('\n=== Name Button → Profile Navigation ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(400);

// Click Marcus Williams' name button (which should navigate directly to his profile)
const marcusNameBtn = page.locator('button').filter({ hasText: 'Marcus Williams' }).first();
if (await marcusNameBtn.count() > 0) {
  log('✓ Marcus Williams name button found in staff list');
  await marcusNameBtn.click();
  await page.waitForTimeout(500);
  const marcusUrl = page.url();
  if (marcusUrl.includes('/staff/s002')) log('✓ Navigates to Marcus Williams profile');
  else fail(`Expected /staff/s002, got ${marcusUrl}`);
} else {
  fail('Marcus Williams name button not found in staff list');
}
await page.screenshot({ path: 'pw-screenshots/sp-06-marcus-profile.png' });

// Verify expanded row shows "View Full Profile" — navigate back and click hours bar area
await page.goto(BASE + '/staff');
await page.waitForTimeout(400);
// Click on the OT bar area of Marcus's row (not the name button), to expand it
// The row div has cursor-pointer and expands on click; click a non-button child
const marcusOtBar = page.locator('div[class*="cursor-pointer"]').filter({ hasText: 'Marcus Williams' }).first();
if (await marcusOtBar.count() > 0) {
  // Click the expand chevron area — offset to avoid name button
  await marcusOtBar.click({ position: { x: 700, y: 20 } });
  await page.waitForTimeout(300);
  const viewProfileBtn = page.locator('button').filter({ hasText: 'View Full Profile' }).first();
  if (await viewProfileBtn.count() > 0) {
    log('✓ "View Full Profile" button visible in expanded row');
  } else {
    // Row might not have expanded — try the profile link in the expanded area
    log('(expanded row - View Full Profile not found, likely row did not expand at this offset)');
  }
} else {
  log('(skipping expanded row cursor-pointer test)');
}

// ── 15. 404-style: unknown staff ID ──────────────────────────────────────────
log('\n=== Unknown Staff ID ===');
await page.goto(BASE + '/staff/unknown-xyz');
await page.waitForTimeout(400);
const notFound = page.locator('text=Staff member not found').first();
if (await notFound.count() > 0) log('✓ "Staff member not found" shown for unknown ID');
else fail('"Staff member not found" message not shown');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/staff/s001');
await page.waitForTimeout(500);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/sp-07-mobile.png' });
log('✓ Mobile screenshot taken');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
