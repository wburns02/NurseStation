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
const navLink = page.locator('a[href="/rrt"]');
check(await navLink.count() > 0, 'RRT nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/rrt'), `URL is /rrt: ${page.url()}`);
check(await page.locator('#rrt-page').count() > 0, 'rrt-page exists');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('RRT') || h1?.includes('Code'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r38-rrt-01-load.png' });

// ── 3. Tabs ───────────────────────────────────────────────────────────────────
log('\n=== 3. TABS ===');
check(await page.locator('#tab-active').count()  > 0, 'Active tab exists');
check(await page.locator('#tab-history').count() > 0, 'History tab exists');
check(await page.locator('#tab-trends').count()  > 0, 'Trends tab exists');

// ── 4. Active event visible ────────────────────────────────────────────────
log('\n=== 4. ACTIVE EVENT ===');
const activeCard = page.locator('[data-id="rrt-event-evt-001"]');
check(await activeCard.count() > 0, 'Active RRT event (evt-001) visible');

// Active badge
const activeBadge = page.locator('text=ACTIVE').first();
check(await activeBadge.count() > 0, 'ACTIVE badge shown');

// Timer
check(await page.locator('#event-timer').count() > 0, 'Live timer exists');
const timerText = await page.locator('#event-timer').textContent().catch(() => '');
check(timerText?.includes(':'), `Timer shows time: "${timerText?.trim()}"`);

// Location
const cardText = await activeCard.textContent().catch(() => '');
check(cardText?.includes('Oncology') || cardText?.includes('512'), `Card shows location: "${cardText?.slice(0,60)}"`);

await page.screenshot({ path: 'pw-screenshots/r38-rrt-02-active.png' });

// ── 5. Team roster ─────────────────────────────────────────────────────────
log('\n=== 5. TEAM ROSTER ===');
check(await page.locator('#team-roster').count() > 0, 'Team roster visible');
const teamMembers = await page.locator('[data-id^="team-member-"]').count();
check(teamMembers >= 3, `At least 3 team members: ${teamMembers}`);

// Mark arrived (find first unarrived member)
const markBtn = page.locator('[aria-label^="Mark arrived"]').first();
check(await markBtn.count() > 0, 'Mark arrived button exists');
if (await markBtn.count() > 0) {
  await markBtn.click();
  await page.waitForTimeout(400);
  ok('Mark arrived clicked');
}

// ── 6. Resolve event ──────────────────────────────────────────────────────
log('\n=== 6. RESOLVE EVENT ===');
const resolveBtn = page.locator('[aria-label^="Resolve event"]').first();
check(await resolveBtn.count() > 0, 'Resolve button exists');
await resolveBtn.click();
await page.waitForTimeout(400);

// Outcome form should appear
check(await page.locator('#outcome-form').count() > 0, 'Outcome form visible');
check(await page.locator('#outcome-select').count() > 0, 'Outcome select visible');
check(await page.locator('#outcome-notes').count() > 0, 'Notes textarea visible');

// Fill in notes
await page.fill('#outcome-notes', 'Patient stabilised. O2 therapy started. SpO2 improved to 95%.');
await page.waitForTimeout(200);

// Check follow-up checkbox
await page.locator('#follow-up-check').click();
await page.waitForTimeout(200);
check(await page.locator('#follow-up-notes').count() > 0, 'Follow-up notes input appears');
await page.fill('#follow-up-notes', 'Pulmonology consult at 1400.');

// Confirm resolve
const confirmBtn = page.locator('[aria-label^="Confirm resolve"]').first();
check(await confirmBtn.count() > 0, 'Confirm resolve button exists');
await confirmBtn.click();
await page.waitForTimeout(600);

// Toast
const toast = await page.locator('#action-toast').textContent().catch(() => '');
check(toast?.includes('resolved') || toast?.includes('history'), `Toast after resolve: "${toast?.trim()}"`);
await page.waitForTimeout(3500);

// Active events should now be empty (evt-001 resolved)
const remaining = await page.locator('[data-id^="rrt-event-"]').count();
check(remaining === 0, `Event removed from active tab: ${remaining} remaining`);
await page.screenshot({ path: 'pw-screenshots/r38-rrt-03-resolved.png' });

// ── 7. History tab ─────────────────────────────────────────────────────────
log('\n=== 7. HISTORY TAB ===');
await page.locator('#tab-history').click();
await page.waitForTimeout(400);
check(await page.locator('#history-log').count() > 0, 'History log visible');

const histEvents = await page.locator('[data-id^="history-event-"]').count();
check(histEvents >= 4, `At least 4 history events (includes just-resolved): ${histEvents}`);

// Expand a history card
const firstHist = page.locator('[data-id="history-event-hist-001"]');
check(await firstHist.count() > 0, 'Code blue event in history');
await firstHist.locator('button').first().click();
await page.waitForTimeout(400);
const histText = await firstHist.textContent().catch(() => '');
check(histText?.includes('ROSC') || histText?.includes('outcome') || histText?.includes('Davis'), `History card expands with outcome: "${histText?.slice(0,80)}"`);

await page.screenshot({ path: 'pw-screenshots/r38-rrt-04-history.png' });

// ── 8. Activate modal ─────────────────────────────────────────────────────
log('\n=== 8. ACTIVATE MODAL ===');
await page.locator('#activate-btn').click();
await page.waitForTimeout(400);
check(await page.locator('#activate-modal').count() > 0, 'Activate modal opened');

// Event type buttons
const typeButtons = await page.locator('[data-id^="event-type-"]').count();
check(typeButtons >= 5, `At least 5 event types: ${typeButtons}`);

// Select stroke type
await page.locator('[data-id="event-type-stroke"]').click();
await page.waitForTimeout(200);

// Fill location
await page.fill('#location-input', '305');
await page.waitForTimeout(200);

// Confirm button should be enabled
const confirmActivate = page.locator('[aria-label="Confirm activation"]');
check(await confirmActivate.count() > 0, 'Confirm activation button exists');

// Click confirm
await confirmActivate.click();
await page.waitForTimeout(600);

// Modal should close and toast show
check(await page.locator('#activate-modal').count() === 0, 'Modal closed after activation');
const globalToast = await page.locator('#action-toast').textContent().catch(() => '');
check(globalToast?.includes('activated') || globalToast?.includes('Stroke'), `Global toast after activation: "${globalToast?.trim()}"`);
await page.waitForTimeout(3500);

// New event should be on active tab (page auto-switches to active)
const newActiveCount = await page.locator('[data-id^="rrt-event-"]').count();
check(newActiveCount >= 1, `New event appears: ${newActiveCount}`);

await page.screenshot({ path: 'pw-screenshots/r38-rrt-05-new-event.png' });

// ── 9. Trends tab ─────────────────────────────────────────────────────────
log('\n=== 9. TRENDS TAB ===');
await page.locator('#tab-trends').click();
await page.waitForTimeout(500);
check(await page.locator('#trends-panel').count() > 0, 'Trends panel visible');
const trendsText = await page.locator('#trends-panel').textContent().catch(() => '');
check(trendsText?.length > 0, `Trends panel has content: "${trendsText?.slice(0,60)}"`);
await page.screenshot({ path: 'pw-screenshots/r38-rrt-06-trends.png' });

// ── 10. Mobile viewport ────────────────────────────────────────────────────
log('\n=== 10. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(BASE + '/rrt');
await page.waitForTimeout(600);
const mobH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobH1?.includes('RRT') || mobH1?.includes('Code'), `Mobile h1: "${mobH1?.trim()}"`);
check(await page.locator('#activate-btn').count() > 0, 'Activate button on mobile');
check(await page.locator('#tab-active').count() > 0, 'Tabs visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r38-rrt-07-mobile.png' });

// ── 11. Console errors ─────────────────────────────────────────────────────
log('\n=== 11. CONSOLE ERRORS ===');
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.reload();
await page.waitForTimeout(800);
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

// ── RESULTS ───────────────────────────────────────────────────────────────
log(`\n=== RESULTS ===`);
log(`Passed: ${pass}  Failed: ${fail}`);
log(fail === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
await browser.close();
process.exit(fail > 0 ? 1 : 0);
