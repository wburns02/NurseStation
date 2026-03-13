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
const navLink = page.locator('a[href="/swaps"]');
check(await navLink.count() > 0, 'Shift Swaps nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(600);
}

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/swaps'), `URL is /swaps: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Shift Swap Board'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r28-swaps-01-load.png' });

// ── 3. Stats ──────────────────────────────────────────────────────────────────
log('\n=== 3. STATS ===');
check(await page.locator('#stat-open').count() > 0, 'stat-open exists');
check(await page.locator('#stat-pending').count() > 0, 'stat-pending exists');
check(await page.locator('#stat-done').count() > 0, 'stat-done exists');
check(await page.locator('#stat-urgent').count() > 0, 'stat-urgent exists');
const openVal = await page.locator('#stat-open').textContent().catch(() => '');
check(openVal?.includes('5'), `stat-open shows 5: "${openVal?.trim()}"`);
const pendVal = await page.locator('#stat-pending').textContent().catch(() => '');
check(pendVal?.includes('2'), `stat-pending shows 2: "${pendVal?.trim()}"`);
const urgentVal = await page.locator('#stat-urgent').textContent().catch(() => '');
check(urgentVal?.includes('1'), `stat-urgent shows 1: "${urgentVal?.trim()}"`);

// ── 4. Open tab default + cards ───────────────────────────────────────────────
log('\n=== 4. OPEN SWAPS TAB ===');
check(await page.locator('#swaps-tab-open').count() > 0, 'swaps-tab-open exists');
check(await page.locator('#swaps-tab-queue').count() > 0, 'swaps-tab-queue exists');
check(await page.locator('#swaps-tab-mine').count() > 0, 'swaps-tab-mine exists');
// Default tab is open — should show 5 cards
const openCards = await page.locator('[data-id^="swap-card-"]').count();
check(openCards === 5, `5 open swap cards: ${openCards}`);
// Kevin Park's urgent swap (sw-001)
check(await page.locator('[data-id="swap-card-sw-001"]').count() > 0, 'sw-001 (Kevin Park urgent) visible');
// David Thompson near swap (sw-002)
check(await page.locator('[data-id="swap-card-sw-002"]').count() > 0, 'sw-002 (David Thompson) visible');

// ── 5. Urgent banner ─────────────────────────────────────────────────────────
log('\n=== 5. URGENT BANNER ===');
const bodyText = await page.locator('body').textContent().catch(() => '');
check(bodyText?.toLowerCase().includes('urgent'), 'Urgent banner visible on open tab');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-02-open.png' });

// ── 6. Claim a swap ───────────────────────────────────────────────────────────
log('\n=== 6. CLAIM SWAP ===');
const claimBtn = page.locator('[aria-label="Claim swap sw-002"]');
check(await claimBtn.count() > 0, 'Claim button for sw-002 exists');
await claimBtn.click();
await page.waitForTimeout(500);
// Should switch to Mine tab and show success toast
check(page.url().includes('/swaps'), 'Still on /swaps after claim');
const claimToast = await page.locator('[id^="claim-success-"]').count();
check(claimToast > 0, 'Claim success toast visible');
// Card should be gone from open list (we should now be on mine tab)
const openAfterClaim = await page.locator('[data-id^="swap-card-"]').count();
check(openAfterClaim > 0, `Cards visible on mine tab after claim: ${openAfterClaim}`);
await page.screenshot({ path: 'pw-screenshots/r28-swaps-03-claimed.png' });

// ── 7. Mine tab ───────────────────────────────────────────────────────────────
log('\n=== 7. MY SWAPS TAB ===');
// We should already be on mine tab after claim — verify
const mineTabActive = await page.locator('#swaps-tab-mine[aria-selected="true"]').count();
check(mineTabActive > 0, 'Mine tab is active after claim');
// Claimed Yuki Tanaka swap should be in mine (she claimed Marcus's — st-001 = Janet, not Yuki)
// Actually Janet is st-001. She claimed sw-010 (completed). Let's check for sw-002 (just claimed)
check(await page.locator('[data-id="swap-card-sw-002"]').count() > 0, 'sw-002 visible in My Swaps after claim');
// sw-010 completed swap (Janet claimed it) should also be visible
check(await page.locator('[data-id="swap-card-sw-010"]').count() > 0, 'sw-010 (completed, Janet claimed) visible');

// ── 8. Switch to approval queue ───────────────────────────────────────────────
log('\n=== 8. APPROVAL QUEUE TAB ===');
await page.locator('#swaps-tab-queue').click();
await page.waitForTimeout(400);
// sw-006 and sw-007 are claimed — but we also just claimed sw-002 which is now in queue
const queueCards = await page.locator('[data-id^="swap-card-"]').count();
check(queueCards >= 2, `At least 2 cards in queue: ${queueCards}`);
check(await page.locator('[data-id="swap-card-sw-006"]').count() > 0, 'sw-006 (Marcus/Yuki) in queue');
check(await page.locator('[data-id="swap-card-sw-007"]').count() > 0, 'sw-007 (Christina/Linda OT warning) in queue');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-04-queue.png' });

// ── 9. Smart checks visible ───────────────────────────────────────────────────
log('\n=== 9. SMART CHECKS ===');
// sw-007 has OT warning
const sw007Body = await page.locator('[data-id="swap-card-sw-007"]').textContent().catch(() => '');
check(sw007Body?.toLowerCase().includes('ot'), 'sw-007 shows OT warning text');
check(sw007Body?.includes('Linda'), 'sw-007 shows Linda Foster as claimer');

// ── 10. Approve sw-006 ────────────────────────────────────────────────────────
log('\n=== 10. APPROVE SWAP ===');
const approveBtn = page.locator('[aria-label="Approve swap sw-006"]');
check(await approveBtn.count() > 0, 'Approve button for sw-006 exists');
await approveBtn.click();
await page.waitForTimeout(500);
const approveToast = await page.locator('#approve-success').count();
check(approveToast > 0, 'Approve success toast shown');
// sw-006 should leave the queue
await page.waitForTimeout(300);
check(await page.locator('[data-id="swap-card-sw-006"]').count() === 0, 'sw-006 removed from queue after approve');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-05-approved.png' });

// ── 11. Deny sw-007 ──────────────────────────────────────────────────────────
log('\n=== 11. DENY SWAP ===');
const denyBtn = page.locator('[aria-label="Deny swap sw-007"]');
check(await denyBtn.count() > 0, 'Deny button for sw-007 exists');
await denyBtn.click();
await page.waitForTimeout(400);
// Deny modal should appear
check(await page.locator('#deny-modal').count() > 0, 'Deny modal opened');
// Fill reason
await page.locator('#deny-reason').fill('OT limit exceeded — please find another cover.');
await page.waitForTimeout(200);
await page.locator('[aria-label="Confirm deny swap"]').click();
await page.waitForTimeout(500);
const denyToast = await page.locator('#deny-success').count();
check(denyToast > 0, 'Deny success toast shown');
check(await page.locator('#deny-modal').count() === 0, 'Deny modal closed after submission');
await page.waitForTimeout(300);
check(await page.locator('[data-id="swap-card-sw-007"]').count() === 0, 'sw-007 removed from queue after deny');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-06-denied.png' });

// ── 12. Post a swap ───────────────────────────────────────────────────────────
log('\n=== 12. POST SWAP MODAL ===');
// Click open swaps tab first to set context, then click post button
await page.locator('#swaps-tab-open').click();
await page.waitForTimeout(300);
const postBtn = page.locator('[aria-label="Post a shift swap"]');
check(await postBtn.count() > 0, 'Post swap button exists');
await postBtn.click();
await page.waitForTimeout(400);
check(await page.locator('#post-swap-modal').count() > 0, 'Post swap modal opened');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-07-post-modal.png' });

// ── 13. Submit post swap form ────────────────────────────────────────────────
log('\n=== 13. SUBMIT POST SWAP ===');
// Select first shift
await page.locator('#post-shift-select').selectOption('js-001');
await page.waitForTimeout(200);
// Select reason
await page.locator('#post-reason-select').selectOption('childcare');
await page.waitForTimeout(200);
// Add notes
await page.locator('#post-notes').fill('School is closed — need coverage for Sat Mar 14.');
await page.waitForTimeout(200);
await page.locator('[aria-label="Submit swap request"]').click();
await page.waitForTimeout(600);
// Modal should close and success toast shown on mine tab
check(await page.locator('#post-swap-modal').count() === 0, 'Post modal closed after submit');
const postToast = await page.locator('#post-swap-success').count();
check(postToast > 0, 'Post swap success toast shown');
// Should be on mine tab now
const mineActive2 = await page.locator('#swaps-tab-mine[aria-selected="true"]').count();
check(mineActive2 > 0, 'Mine tab active after posting');
// New swap should appear in my swaps
await page.waitForTimeout(300);
const mineCards = await page.locator('[data-id^="swap-card-"]').count();
check(mineCards >= 3, `At least 3 cards in my swaps after posting: ${mineCards}`);
await page.screenshot({ path: 'pw-screenshots/r28-swaps-08-posted.png' });

// ── 14. Validation — submit without selecting ─────────────────────────────────
log('\n=== 14. FORM VALIDATION ===');
// Open post modal again
await page.locator('[aria-label="Post a shift swap"]').click();
await page.waitForTimeout(400);
check(await page.locator('#post-swap-modal').count() > 0, 'Post modal re-opened');
// Try to submit empty
await page.locator('[aria-label="Submit swap request"]').click();
await page.waitForTimeout(200);
// Modal should still be open (validation failed)
check(await page.locator('#post-swap-modal').count() > 0, 'Modal stays open on invalid submit');
// Close modal
await page.locator('[aria-label="Close post swap modal"]').click();
await page.waitForTimeout(600);
check(await page.locator('#post-swap-modal').count() === 0, 'Modal closed via X button');

// ── 15. Open tab post-claim state ────────────────────────────────────────────
log('\n=== 15. OPEN TAB AFTER MUTATIONS ===');
await page.locator('#swaps-tab-open').click();
await page.waitForTimeout(400);
// sw-001 Kevin Park still open (we only claimed sw-002)
check(await page.locator('[data-id="swap-card-sw-001"]').count() > 0, 'sw-001 still open (Kevin Park urgent)');
// sw-002 should be gone (claimed)
check(await page.locator('[data-id="swap-card-sw-002"]').count() === 0, 'sw-002 gone from open after claim');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-09-open-final.png' });

// ── 16. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 16. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Shift Swap Board'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('[data-id^="swap-card-"]').count() > 0, 'Cards visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r28-swaps-10-mobile.png' });

// ── 17. Console errors ────────────────────────────────────────────────────────
log('\n=== 17. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/swaps');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
