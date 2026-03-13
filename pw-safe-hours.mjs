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
const navLink = page.locator('a[href="/safe-hours"]');
check(await navLink.count() > 0, 'Safe Hours nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/safe-hours'), `URL is /safe-hours: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Safe Hours') && h1?.includes('Fatigue'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r34-safe-01-load.png' });

// ── 3. Hero stats ─────────────────────────────────────────────────────────────
log('\n=== 3. HERO STATS ===');
check(await page.locator('#stat-critical').count() > 0, 'stat-critical exists');
check(await page.locator('#stat-warning').count() > 0, 'stat-warning exists');
check(await page.locator('#stat-resting').count() > 0, 'stat-resting exists');
check(await page.locator('#stat-avg-score').count() > 0, 'stat-avg-score exists');
const critText = await page.locator('#stat-critical').textContent().catch(() => '');
check(critText && /\d/.test(critText), `Critical stat has number: "${critText?.slice(0,40)}"`);
const warnText = await page.locator('#stat-warning').textContent().catch(() => '');
check(warnText && /\d/.test(warnText), `Warning stat has number: "${warnText?.slice(0,40)}"`);

// ── 4. Alert banners ──────────────────────────────────────────────────────────
log('\n=== 4. ALERT BANNERS ===');
check(await page.locator('#fatigue-alert').count() > 0, 'Critical fatigue alert banner visible');
const alertText = await page.locator('#fatigue-alert').textContent().catch(() => '');
check(alertText?.includes('critical') || alertText?.includes('Critical'), `Alert mentions critical: "${alertText?.slice(0,80)}"`);
check(alertText?.includes('David Thompson') || alertText?.includes('Patricia'), 'Alert names critical nurses');

// ── 5. Nurse monitor list ─────────────────────────────────────────────────────
log('\n=== 5. NURSE HOURS LIST ===');
check(await page.locator('#nurse-hours-list').count() > 0, 'Nurse hours list exists');
check(await page.locator('[data-id="nurse-hours-st-004"]').count() > 0, 'David Thompson row exists');
check(await page.locator('[data-id="nurse-hours-st-014"]').count() > 0, 'Patricia Moore row exists');
check(await page.locator('[data-id="nurse-hours-st-002"]').count() > 0, 'Marcus Chen row exists');
check(await page.locator('[data-id="nurse-hours-st-001"]').count() > 0, 'Sarah Kim row exists');
// Fatigue zone badges
check(await page.locator('[data-id="fatigue-zone-st-004"]').count() > 0, 'David Thompson fatigue zone badge');
const dtZone = await page.locator('[data-id="fatigue-zone-st-004"]').textContent().catch(() => '');
check(dtZone?.toLowerCase().includes('critical'), `David Thompson zone is Critical: "${dtZone}"`);
await page.screenshot({ path: 'pw-screenshots/r34-safe-02-list.png' });

// ── 6. Filter buttons ─────────────────────────────────────────────────────────
log('\n=== 6. FILTER BUTTONS ===');
check(await page.locator('#filter-all').count() > 0, 'All filter exists');
check(await page.locator('#filter-critical').count() > 0, 'Critical filter exists');
check(await page.locator('#filter-warning').count() > 0, 'Warning filter exists');
check(await page.locator('#filter-caution').count() > 0, 'Caution filter exists');
check(await page.locator('#filter-safe').count() > 0, 'Safe filter exists');

await page.locator('#filter-critical').click();
await page.waitForTimeout(300);
const critList = await page.locator('#nurse-hours-list').textContent().catch(() => '');
check(critList?.includes('David') || critList?.includes('Patricia'), 'Critical filter shows critical nurses');
check(!critList?.includes('Sarah Kim'), 'Critical filter hides safe nurses');

await page.locator('#filter-safe').click();
await page.waitForTimeout(300);
const safeList = await page.locator('#nurse-hours-list').textContent().catch(() => '');
check(safeList?.includes('Emily') || safeList?.includes('Robert'), 'Safe filter shows safe nurses');

await page.locator('#filter-all').click();
await page.waitForTimeout(200);

// ── 7. Sort buttons ───────────────────────────────────────────────────────────
log('\n=== 7. SORT BUTTONS ===');
check(await page.locator('[aria-label="Sort by fatigue"]').count() > 0, 'Sort by fatigue exists');
check(await page.locator('[aria-label="Sort by hours"]').count() > 0, 'Sort by hours exists');
check(await page.locator('[aria-label="Sort by consec"]').count() > 0, 'Sort by consec exists');
await page.locator('[aria-label="Sort by hours"]').click();
await page.waitForTimeout(200);
await page.locator('[aria-label="Sort by fatigue"]').click();
await page.waitForTimeout(200);

// ── 8. Expand nurse row ───────────────────────────────────────────────────────
log('\n=== 8. EXPAND NURSE ROW ===');
const dtRow = page.locator('[data-id="nurse-hours-st-004"]');
await dtRow.click();
await page.waitForTimeout(400);
const dtExpanded = await dtRow.textContent().catch(() => '');
check(dtExpanded?.includes('7-Day Hours') || dtExpanded?.includes('Consecutive'), 'Row expanded showing details');
check(dtExpanded?.includes('Mar') || dtExpanded?.includes('shift'), 'Expanded row shows shift history');
check(dtExpanded?.includes('OT') || dtExpanded?.includes('alert') || dtExpanded?.includes('hours'), 'Expanded row shows alerts/OT info');
await page.screenshot({ path: 'pw-screenshots/r34-safe-03-expanded.png' });

// Collapse
await dtRow.click();
await page.waitForTimeout(300);

// ── 9. Block OT action ────────────────────────────────────────────────────────
log('\n=== 9. BLOCK OT ACTION ===');
// Marcus Chen (warning zone, not yet blocked) should have block OT button
const mcRow = page.locator('[data-id="nurse-hours-st-002"]');
const blockBtn = mcRow.locator('[aria-label^="Block OT for st-002"]').first();
check(await blockBtn.count() > 0, 'Block OT button visible for Marcus Chen');
if (await blockBtn.count() > 0) {
  await blockBtn.click();
  await page.waitForTimeout(500);
}
check(await page.locator('#action-toast').count() > 0, 'Toast shown after blocking OT');
const blockToast = await page.locator('#action-toast').textContent().catch(() => '');
check(blockToast?.includes('Marcus') || blockToast?.includes('blocked'), `Block OT toast: "${blockToast?.trim()}"`);
await page.waitForTimeout(4000);

// ── 10. Notify flow ───────────────────────────────────────────────────────────
log('\n=== 10. NOTIFY FLOW ===');
// Patricia Moore (critical) should have notify button
const pmRow = page.locator('[data-id="nurse-hours-st-014"]');
const notifyBtn = pmRow.locator('[aria-label^="Notify nurse st-014"]');
check(await notifyBtn.count() > 0, 'Notify button visible for Patricia Moore');
if (await notifyBtn.count() > 0) {
  await notifyBtn.click();
  await page.waitForTimeout(400);
}
check(await page.locator('#notify-modal').count() > 0, 'Notify modal opened');
const modalText = await page.locator('#notify-modal').textContent().catch(() => '');
check(modalText?.includes('Patricia') || modalText?.includes('Notification'), `Notify modal shows content: "${modalText?.slice(0,80)}"`);
await page.screenshot({ path: 'pw-screenshots/r34-safe-04-notify.png' });

// Confirm notification
const sendBtn = page.locator('[aria-label="Send fatigue notification"]');
check(await sendBtn.count() > 0, 'Send notification button exists');
if (await sendBtn.count() > 0) { await sendBtn.click(); await page.waitForTimeout(500); }
check(await page.locator('#notify-modal').count() === 0, 'Notify modal closed after confirm');
check(await page.locator('#action-toast').count() > 0, 'Toast shown after sending notification');
await page.waitForTimeout(4000);

// ── 11. Timeline tab ──────────────────────────────────────────────────────────
log('\n=== 11. TIMELINE TAB ===');
await page.locator('#tab-timeline').click();
await page.waitForTimeout(400);
check(await page.locator('#timeline-view').count() > 0, 'Timeline view visible');
const timelineText = await page.locator('#timeline-view').textContent().catch(() => '');
check(timelineText?.includes('Mar') || timelineText?.includes('Fri'), 'Timeline shows dates');
check(await page.locator('[data-id^="timeline-row-"]').count() > 0, 'Timeline rows exist');
const tlRows = await page.locator('[data-id^="timeline-row-"]').count();
check(tlRows >= 5, `At least 5 timeline rows: ${tlRows}`);
await page.screenshot({ path: 'pw-screenshots/r34-safe-05-timeline.png' });

// ── 12. Compliance rules tab ──────────────────────────────────────────────────
log('\n=== 12. COMPLIANCE RULES TAB ===');
await page.locator('#tab-rules').click();
await page.waitForTimeout(400);
check(await page.locator('#compliance-panel').count() > 0, 'Compliance panel visible');
const rulesText = await page.locator('#compliance-panel').textContent().catch(() => '');
check(rulesText?.includes('California') || rulesText?.includes('AB 394'), 'Rules mention CA AB 394');
check(rulesText?.includes('State Law') || rulesText?.includes('Hospital Policy'), 'Rules show severity labels');
check(rulesText?.includes('60'), 'Rules mention 60-hour limit');
check(rulesText?.includes('mandatory') || rulesText?.includes('Mandatory'), 'Rules mention mandatory provisions');
check(await page.locator('[data-id^="rule-"]').count() >= 4, 'At least 4 compliance rules');
await page.screenshot({ path: 'pw-screenshots/r34-safe-06-rules.png' });

// ── 13. Monitor tab — return ──────────────────────────────────────────────────
log('\n=== 13. MONITOR TAB RETURN ===');
await page.locator('#tab-monitor').click();
await page.waitForTimeout(300);
check(await page.locator('#nurse-hours-list').count() > 0, 'Monitor tab restored');

// ── 14. Rest-period alert ─────────────────────────────────────────────────────
log('\n=== 14. REST PERIOD ALERT ===');
const restAlert = page.locator('#rest-alert');
check(await restAlert.count() > 0, 'Rest period alert banner visible');
const restText = await restAlert.textContent().catch(() => '');
check(restText?.includes('rest') || restText?.includes('mandatory'), `Rest alert has text: "${restText?.slice(0,80)}"`);

// ── 15. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 15. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Safe Hours'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#stat-critical').count() > 0, 'Stats visible on mobile');
check(await page.locator('#nurse-hours-list').count() > 0, 'Nurse list visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r34-safe-07-mobile.png' });

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== 16. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/safe-hours');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
