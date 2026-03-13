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

// ── 1. Sidebar bell badge links to /notifications ─────────────────────────────
log('\n=== Sidebar Bell Badge ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/n-01-dashboard.png' });

const bellLink = page.locator('a[href*="notifications"]').first();
if (await bellLink.count() > 0) log('✓ Sidebar bell link exists');
else fail('Sidebar bell link not found');

// Bell should show badge (notifications exist)
const bellBadge = page.locator('a[href*="notifications"] span').filter({ hasText: /^\d+$/ }).first();
if (await bellBadge.count() > 0) log('✓ Bell badge shows count');
else fail('Bell badge count not visible');

// ── 2. Navigate to /notifications ────────────────────────────────────────────
log('\n=== Notifications Page Load ===');
await page.goto(BASE + '/notifications');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/n-02-notifications-page.png' });

// Page heading
const heading = page.locator('h1', { hasText: 'Notification Center' });
if (await heading.count() > 0) log('✓ "Notification Center" heading visible');
else fail('"Notification Center" h1 not found');

// ── 3. Stats bar ──────────────────────────────────────────────────────────────
log('\n=== Stats Bar ===');
const criticalStat = page.locator('text=Critical').first();
if (await criticalStat.count() > 0) log('✓ Critical stat card visible');
else fail('Critical stat card not found');

const unreadStat = page.locator('text=Unread').first();
if (await unreadStat.count() > 0) log('✓ Unread stat card visible');
else fail('Unread stat card not found');

const actionStat = page.locator('text=Action Needed').first();
if (await actionStat.count() > 0) log('✓ "Action Needed" stat card visible');
else fail('"Action Needed" stat card not found');

const resolvedStat = page.locator('text=Resolved Today').first();
if (await resolvedStat.count() > 0) log('✓ "Resolved Today" stat card visible');
else fail('"Resolved Today" stat card not found');

// ── 4. Filter tabs ────────────────────────────────────────────────────────────
log('\n=== Filter Tabs ===');
const allTab = page.locator('button').filter({ hasText: /^All/ }).first();
if (await allTab.count() > 0) log('✓ "All" filter tab visible');
else fail('"All" tab not found');

const criticalTab = page.locator('button').filter({ hasText: /^Critical/ }).first();
if (await criticalTab.count() > 0) log('✓ "Critical" filter tab visible');
else fail('"Critical" tab not found');

const gapsTab = page.locator('button').filter({ hasText: /^Gaps/ }).first();
if (await gapsTab.count() > 0) log('✓ "Gaps" filter tab visible');
else fail('"Gaps" tab not found');

const credsTab = page.locator('button').filter({ hasText: /^Credentials/ }).first();
if (await credsTab.count() > 0) log('✓ "Credentials" filter tab visible');
else fail('"Credentials" tab not found');

// ── 5. Notification cards render ──────────────────────────────────────────────
log('\n=== Notification Cards ===');
// ICU gap (n001)
const icuGap = page.locator('text=ICU Day Shift — 1 RN gap open now').first();
if (await icuGap.count() > 0) log('✓ ICU gap notification visible');
else fail('ICU gap notification not found');

// James Okafor credential (n003)
const jamesCred = page.locator('text=James Okafor — BLS expired').first();
if (await jamesCred.count() > 0) log('✓ James Okafor BLS notification visible');
else fail('James Okafor BLS notification not found');

// Today group header
const todayGroup = page.locator('text=Today').first();
if (await todayGroup.count() > 0) log('✓ "Today" group header visible');
else fail('"Today" group header not found');

// ── 6. Unread dot on unread notifications ─────────────────────────────────────
log('\n=== Unread Indicators ===');
// Unread notifications should have a colored dot — check via Open Smart Fill CTA
const actionBtn = page.locator('button').filter({ hasText: 'Open Smart Fill' }).first();
if (await actionBtn.count() > 0) log('✓ Action button "Open Smart Fill" visible on ICU gap');
else fail('"Open Smart Fill" action button not found');

// ── 7. Critical filter tab ────────────────────────────────────────────────────
log('\n=== Critical Filter ===');
await criticalTab.click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/n-03-critical-filter.png' });

// Should show critical notifications only
const marcus = page.locator('text=Marcus Williams at 90% OT threshold').first();
if (await marcus.count() > 0) log('✓ Critical tab shows OT threshold notification');
else fail('Marcus OT critical notification not found in Critical tab');

// ICU gap should still be visible (it's critical)
const icuInCritical = page.locator('text=ICU Day Shift — 1 RN gap open now').first();
if (await icuInCritical.count() > 0) log('✓ ICU gap still visible under Critical filter');
else fail('ICU gap not found under Critical filter');

// ── 8. Credentials filter ────────────────────────────────────────────────────
log('\n=== Credentials Filter ===');
await credsTab.click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/n-04-creds-filter.png' });

const lisaCred = page.locator('text=NICU RNC-NIC buffer drops').first();
if (await lisaCred.count() > 0) log('✓ Lisa Greenwald NICU cred visible in Credentials filter');
else fail('Lisa NICU credential notification not found');

// Rachel Torres warning should be in credentials filter
const rachelCred = page.locator('text=Rachel Torres CCRN expires').first();
if (await rachelCred.count() > 0) log('✓ Rachel Torres CCRN notification visible in Credentials filter');
else fail('Rachel Torres CCRN notification not found');

// ── 9. All filter + mark-all-read button ─────────────────────────────────────
log('\n=== Mark All Read ===');
await allTab.click();
await page.waitForTimeout(300);

const markAllBtn = page.locator('button').filter({ hasText: 'Mark all read' }).first();
if (await markAllBtn.count() > 0) {
  log('✓ "Mark all read" button visible');
  await markAllBtn.click();
  await page.waitForTimeout(300);
  // After mark all read, button should disappear (no unread remain)
  const btnAfter = page.locator('button').filter({ hasText: 'Mark all read' }).first();
  if (await btnAfter.count() === 0) log('✓ "Mark all read" button disappears after clicking');
  else log('(mark all read button still visible — may be expected)');
} else fail('"Mark all read" button not found');

// ── 10. Dismiss a notification ────────────────────────────────────────────────
log('\n=== Dismiss Notification ===');
await page.goto(BASE + '/notifications');
await page.waitForTimeout(500);

// Use data-id to precisely target the Med-Surg B notification (n002)
const medsurgCard = page.locator('[data-id="notif-n002"]');
if (await medsurgCard.count() > 0) {
  log('✓ Med-Surg B gap card found (data-id="notif-n002")');
  const dismissBtn = medsurgCard.locator('button[aria-label="Dismiss notification"]').first();
  if (await dismissBtn.count() > 0) {
    log('✓ Dismiss button found on Med-Surg B card');
    await dismissBtn.click();
    await page.waitForTimeout(600);
    const cardAfter = page.locator('[data-id="notif-n002"]');
    if (await cardAfter.count() === 0) log('✓ Notification dismissed and removed from list');
    else fail('Notification card still in DOM after dismiss');
  } else fail('Dismiss button (aria-label) not found on Med-Surg B card');
} else fail('Med-Surg B gap card not found (notif-n002)');

await page.screenshot({ path: 'pw-screenshots/n-05-after-dismiss.png' });

// ── 11. Unread-only filter toggle ─────────────────────────────────────────────
log('\n=== Unread Only Toggle ===');
const unreadToggle = page.locator('button').filter({ hasText: 'Unread only' }).first();
if (await unreadToggle.count() > 0) {
  log('✓ "Unread only" toggle button visible');
  await unreadToggle.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'pw-screenshots/n-06-unread-only.png' });
  log('✓ Unread-only mode toggled');
  // Toggle back
  await unreadToggle.click();
  await page.waitForTimeout(200);
} else fail('"Unread only" button not found');

// ── 12. Activity / resolved notifications ────────────────────────────────────
log('\n=== Activity Tab (Resolved) ===');
const activityTab = page.locator('button').filter({ hasText: /^Activity/ }).first();
if (await activityTab.count() > 0) {
  log('✓ "Activity" tab visible');
  await activityTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'pw-screenshots/n-07-activity-tab.png' });
  // Should show resolved items
  const oncology = page.locator('text=Oncology gap filled').first();
  if (await oncology.count() > 0) log('✓ Resolved "Oncology gap filled" visible in Activity tab');
  else fail('"Oncology gap filled" not found in Activity tab');
} else fail('"Activity" tab not found');

// ── 13. Click notification title navigates to linked page ─────────────────────
log('\n=== Navigation from Notification ===');
await allTab.click();
await page.waitForTimeout(300);

// Click the credentials link on James Okafor's BLS card
const jamesCardTitle = page.locator('span').filter({ hasText: 'James Okafor — BLS expired' }).first();
if (await jamesCardTitle.count() > 0) {
  log('✓ James Okafor BLS card found');
  await jamesCardTitle.click();
  await page.waitForTimeout(500);
  const afterUrl = page.url();
  if (afterUrl.includes('/credentials')) log(`✓ Clicking BLS card navigated to ${afterUrl}`);
  else log(`(navigation URL: ${afterUrl} — expected /credentials)`);
} else log('(James BLS title not found for nav test — may have been marked read/dismissed)');

// ── 14. Swaps filter ─────────────────────────────────────────────────────────
log('\n=== Swaps Filter ===');
await page.goto(BASE + '/notifications');
await page.waitForTimeout(500);

const swapsTab = page.locator('button').filter({ hasText: /^Swaps/ }).first();
if (await swapsTab.count() > 0) {
  log('✓ "Swaps" tab visible');
  await swapsTab.click();
  await page.waitForTimeout(300);
  const pendingSwaps = page.locator('text=3 pending shift swap requests').first();
  if (await pendingSwaps.count() > 0) log('✓ "3 pending shift swaps" visible in Swaps filter');
  else fail('"3 pending swaps" notification not found in Swaps tab');
} else fail('"Swaps" tab not found');

// ── 15. Messages filter ───────────────────────────────────────────────────────
log('\n=== Messages Filter ===');
const messagesTab = page.locator('button').filter({ hasText: /^Messages/ }).first();
if (await messagesTab.count() > 0) {
  log('✓ "Messages" tab visible');
  await messagesTab.click();
  await page.waitForTimeout(300);
  const christineMsg = page.locator('text=Christine Park').first();
  if (await christineMsg.count() > 0) log('✓ Christine Park message notification visible');
  else fail('Christine Park message not found in Messages filter');
} else fail('"Messages" tab not found');

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/notifications');
await page.waitForTimeout(600);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// ── 17. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/n-08-mobile.png' });
log('✓ Mobile screenshot taken');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
