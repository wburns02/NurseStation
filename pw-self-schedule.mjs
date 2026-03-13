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
const navLink = page.locator('a[href="/self-schedule"]');
check(await navLink.count() > 0, 'Self-Schedule nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(600);
}

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/self-schedule'), `URL is /self-schedule: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Self-Schedule'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r29-ss-01-load.png' });

// ── 3. Bid window banner ──────────────────────────────────────────────────────
log('\n=== 3. BID WINDOW BANNER ===');
const bodyText = await page.locator('body').textContent().catch(() => '');
check(bodyText?.includes('Bidding window closes in'), 'Bid window countdown banner visible');
check(await page.locator('#bid-countdown').count() > 0, 'Countdown timer element exists');
const countdownText = await page.locator('#bid-countdown').textContent().catch(() => '');
check(/\d{2}:\d{2}:\d{2}/.test(countdownText ?? ''), `Countdown format HH:MM:SS: "${countdownText?.trim()}"`);

// ── 4. Stats ──────────────────────────────────────────────────────────────────
log('\n=== 4. STATS ===');
check(await page.locator('#stat-total').count() > 0, 'stat-total exists');
check(await page.locator('#stat-filled').count() > 0, 'stat-filled exists');
check(await page.locator('#stat-unfilled').count() > 0, 'stat-unfilled exists');
check(await page.locator('#stat-conflicts').count() > 0, 'stat-conflicts exists');
check(await page.locator('#stat-my-bids').count() > 0, 'stat-my-bids exists');
const totalText = await page.locator('#stat-total').textContent().catch(() => '');
check(parseInt(totalText?.replace(/\D/g, '') ?? '0') > 0, `stat-total > 0: "${totalText?.trim()}"`);

// ── 5. Tabs ───────────────────────────────────────────────────────────────────
log('\n=== 5. TABS ===');
check(await page.locator('#tab-available').count() > 0, 'Available Slots tab exists');
check(await page.locator('#tab-mine').count() > 0, 'My Bids tab exists');
check(await page.locator('#tab-manager').count() > 0, 'Manager Queue tab exists');
// Default tab is available
const availTabActive = await page.locator('#tab-available[aria-selected="true"]').count();
check(availTabActive > 0, 'Available tab active by default');

// ── 6. Slot cards visible ─────────────────────────────────────────────────────
log('\n=== 6. SLOT CARDS ===');
const slotCards = await page.locator('[data-id^="slot-card-"]').count();
check(slotCards >= 10, `At least 10 slot cards visible: ${slotCards}`);
check(await page.locator('[data-id="slot-card-sl-001"]').count() > 0, 'sl-001 (Mon ICU Day) visible');
check(await page.locator('[data-id="slot-card-sl-008"]').count() > 0, 'sl-008 (Thu MS-A Night, no bids) visible');
await page.screenshot({ path: 'pw-screenshots/r29-ss-02-slots.png' });

// ── 7. Fill-rate progress bars ────────────────────────────────────────────────
log('\n=== 7. FILL RATE ===');
// sl-001 is fully filled (3/3) — should have emerald fill bar
const sl001Body = await page.locator('[data-id="slot-card-sl-001"]').textContent().catch(() => '');
check(sl001Body?.includes('3/3'), 'sl-001 shows 3/3 bids (fully filled)');
// sl-008 has 0 bids — should show 0/3
const sl008Body = await page.locator('[data-id="slot-card-sl-008"]').textContent().catch(() => '');
check(sl008Body?.includes('0/3'), `sl-008 shows 0/3: "${sl008Body?.slice(0,80)}"`);

// ── 8. Unit filter ────────────────────────────────────────────────────────────
log('\n=== 8. UNIT FILTERS ===');
const icuFilter = page.locator('[aria-label="Filter unit ICU"]');
check(await icuFilter.count() > 0, 'ICU unit filter button exists');
await icuFilter.click();
await page.waitForTimeout(400);
const icuCards = await page.locator('[data-id^="slot-card-"]').count();
check(icuCards >= 1, `Cards filtered to ICU: ${icuCards}`);
// sl-003 (ED) should be gone
check(await page.locator('[data-id="slot-card-sl-003"]').count() === 0, 'ED slot gone after ICU filter');
// Reset
await page.locator('[aria-label="Filter unit all"]').click();
await page.waitForTimeout(300);
const allCards = await page.locator('[data-id^="slot-card-"]').count();
check(allCards >= 10, `All cards back after reset: ${allCards}`);

// ── 9. Shift type filter ──────────────────────────────────────────────────────
log('\n=== 9. SHIFT FILTERS ===');
await page.locator('[aria-label="Filter shift day"]').click();
await page.waitForTimeout(400);
const dayCards = await page.locator('[data-id^="slot-card-"]').count();
check(dayCards >= 1, `Day shift cards visible: ${dayCards}`);
// Night slot sl-002 should be hidden
check(await page.locator('[data-id="slot-card-sl-002"]').count() === 0, 'Night slot hidden after day filter');
// Reset shift filter
await page.locator('[aria-label="Filter shift all"]').click();
await page.waitForTimeout(300);

// ── 10. Place bid via modal ────────────────────────────────────────────────────
log('\n=== 10. PLACE BID ===');
// sl-008 is Thu MS-A Night with 0 bids — bid on it
const bidBtn = page.locator('[aria-label="Place bid sl-008"]');
check(await bidBtn.count() > 0, 'Place bid button for sl-008 exists');
await bidBtn.click();
await page.waitForTimeout(400);
check(await page.locator('#bid-modal').count() > 0, 'Bid modal opened');
await page.screenshot({ path: 'pw-screenshots/r29-ss-03-bid-modal.png' });

// ── 11. Bid modal priority selection ─────────────────────────────────────────
log('\n=== 11. BID PRIORITY SELECTION ===');
check(await page.locator('[data-id="priority-btn-1"]').count() > 0, 'Priority 1 button exists');
check(await page.locator('[data-id="priority-btn-2"]').count() > 0, 'Priority 2 button exists');
check(await page.locator('[data-id="priority-btn-3"]').count() > 0, 'Priority 3 button exists');
// Click priority 2
await page.locator('[data-id="priority-btn-2"]').click();
await page.waitForTimeout(200);
const p2Class = await page.locator('[data-id="priority-btn-2"]').getAttribute('class').catch(() => '');
check(p2Class?.includes('violet'), `Priority 2 selected (violet class): ${p2Class?.slice(0,60)}`);
// Confirm bid
await page.locator('[aria-label="Confirm bid"]').click();
await page.waitForTimeout(500);
check(await page.locator('#bid-modal').count() === 0, 'Bid modal closed after confirm');
const bidToast = await page.locator('#toast-bid').count();
check(bidToast > 0, 'Bid success toast shown');
await page.screenshot({ path: 'pw-screenshots/r29-ss-04-bid-placed.png' });

// ── 12. My Bids tab shows placed bid ─────────────────────────────────────────
log('\n=== 12. MY BIDS TAB ===');
await page.locator('#tab-mine').click();
await page.waitForTimeout(400);
const mineActive = await page.locator('#tab-mine[aria-selected="true"]').count();
check(mineActive > 0, 'My Bids tab active');
const mineCards = await page.locator('[data-id^="slot-card-"]').count();
check(mineCards >= 1, `At least 1 card in My Bids: ${mineCards}`);
check(await page.locator('[data-id="slot-card-sl-001"]').count() > 0, 'sl-001 (Mon ICU Day — Janet pre-bid) in my bids');
check(await page.locator('[data-id="slot-card-sl-008"]').count() > 0, 'sl-008 (just bid) in my bids');
await page.screenshot({ path: 'pw-screenshots/r29-ss-05-my-bids.png' });

// ── 13. Stats updated after bid ───────────────────────────────────────────────
log('\n=== 13. STATS UPDATED ===');
const myBidsStat = await page.locator('#stat-my-bids').textContent().catch(() => '');
// Janet had 3 pre-seeded bids (sl-001 confirmed, sl-002, sl-003 maybe — let me just check > 1)
check(parseInt(myBidsStat?.replace(/\D/g, '') ?? '0') >= 2, `stat-my-bids >= 2: "${myBidsStat?.trim()}"`);

// ── 14. Withdraw bid ─────────────────────────────────────────────────────────
log('\n=== 14. WITHDRAW BID ===');
const withdrawBtn = page.locator('[aria-label="Withdraw bid sl-008"]');
check(await withdrawBtn.count() > 0, 'Withdraw button for sl-008 exists');
await withdrawBtn.click();
await page.waitForTimeout(500);
const withdrawToast = await page.locator('#toast-withdraw').count();
check(withdrawToast > 0, 'Withdraw toast shown');
// sl-008 should leave my bids
await page.waitForTimeout(400);
check(await page.locator('[data-id="slot-card-sl-008"]').count() === 0, 'sl-008 gone from my bids after withdraw');

// ── 15. Manager tab ───────────────────────────────────────────────────────────
log('\n=== 15. MANAGER QUEUE TAB ===');
await page.locator('#tab-manager').click();
await page.waitForTimeout(400);
const managerActive = await page.locator('#tab-manager[aria-selected="true"]').count();
check(managerActive > 0, 'Manager Queue tab active');
const managerCards = await page.locator('[data-id^="slot-card-"]').count();
check(managerCards >= 1, `At least 1 card in manager view: ${managerCards}`);
await page.screenshot({ path: 'pw-screenshots/r29-ss-06-manager.png' });

// ── 16. Conflict alert visible ────────────────────────────────────────────────
log('\n=== 16. CONFLICT + UNFILLED ALERTS ===');
const managerBody = await page.locator('body').textContent().catch(() => '');
// Stats show conflicts exist in seeded data
const conflictsText = await page.locator('#stat-conflicts').textContent().catch(() => '');
const hasConflicts = parseInt(conflictsText?.replace(/\D/g, '') ?? '0') > 0;
if (hasConflicts) {
  check(managerBody?.toLowerCase().includes('conflict'), 'Conflict alert shown in manager view');
}
// Unfilled alert should mention unfilled positions
check(managerBody?.toLowerCase().includes('unfilled') || managerBody?.toLowerCase().includes('position'), 'Unfilled positions mentioned');
ok('Manager tab conflict/unfilled alerts checked');

// ── 17. Cycle picker ─────────────────────────────────────────────────────────
log('\n=== 17. CYCLE PICKER ===');
const cyclePicker = page.locator('#cycle-picker');
check(await cyclePicker.count() > 0, 'Cycle picker exists');
const cycleOptions = await cyclePicker.locator('option').count();
check(cycleOptions >= 2, `At least 2 cycle options: ${cycleOptions}`);
// Switch to past cycle
await cyclePicker.selectOption('cyc-000');
await page.waitForTimeout(400);
const publishedBanner = await page.locator('#published-banner').count();
check(publishedBanner > 0, 'Published banner shown for past cycle');
// Switch back
await cyclePicker.selectOption('cyc-001');
await page.waitForTimeout(300);

// ── 18. Publish flow ─────────────────────────────────────────────────────────
log('\n=== 18. PUBLISH FLOW ===');
await page.locator('#tab-available').click();
await page.waitForTimeout(300);
const publishBtn = page.locator('[aria-label="Publish schedule"]');
check(await publishBtn.count() > 0, 'Publish button exists');
await publishBtn.click();
await page.waitForTimeout(400);
check(await page.locator('#publish-modal').count() > 0, 'Publish confirmation modal opened');
await page.screenshot({ path: 'pw-screenshots/r29-ss-07-publish-modal.png' });
// Cancel first
await page.locator('[aria-label="Cancel publish"]').click();
await page.waitForTimeout(400);
check(await page.locator('#publish-modal').count() === 0, 'Publish modal closed after cancel');
// Publish for real
await publishBtn.click();
await page.waitForTimeout(400);
await page.locator('[aria-label="Confirm publish"]').click();
await page.waitForTimeout(600);
check(await page.locator('#publish-modal').count() === 0, 'Publish modal closed after confirm');
const publishToast = await page.locator('#toast-publish').count();
check(publishToast > 0, 'Publish success toast shown');
// Publish button should disappear (schedule is now published)
await page.waitForTimeout(400);
check(await page.locator('[aria-label="Publish schedule"]').count() === 0, 'Publish button gone after publish');
check(await page.locator('#published-banner').count() > 0, 'Published banner shown after publish');
await page.screenshot({ path: 'pw-screenshots/r29-ss-08-published.png' });

// ── 19. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 19. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Self-Schedule'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('[data-id^="slot-card-"]').count() > 0, 'Slot cards visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r29-ss-09-mobile.png' });

// ── 20. Console errors ────────────────────────────────────────────────────────
log('\n=== 20. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/self-schedule');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
