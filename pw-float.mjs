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
const navLink = page.locator('a[href="/float"]');
check(await navLink.count() > 0, 'Float Pool nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(700);
}

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/float'), `URL is /float: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Float Pool Manager'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r32-float-01-load.png' });

// ── 3. Period selector ────────────────────────────────────────────────────────
log('\n=== 3. PERIOD SELECTOR ===');
check(await page.locator('#period-today').count() > 0, 'Today period button exists');
check(await page.locator('#period-tomorrow').count() > 0, 'Tomorrow period button exists');
check(await page.locator('#period-weekend').count() > 0, 'Weekend period button exists');
await page.locator('#period-tomorrow').click();
await page.waitForTimeout(200);
const bodyAfterPeriod = await page.locator('body').textContent().catch(() => '');
check(bodyAfterPeriod?.includes('Float Pool Manager'), 'Page stable after period switch');
await page.locator('#period-today').click();
await page.waitForTimeout(200);

// ── 4. Hero stats ─────────────────────────────────────────────────────────────
log('\n=== 4. HERO STATS ===');
check(await page.locator('#stat-available').count() > 0, 'stat-available exists');
check(await page.locator('#stat-needs').count() > 0, 'stat-needs exists');
check(await page.locator('#stat-utilization').count() > 0, 'stat-utilization exists');
check(await page.locator('#stat-agency-saved').count() > 0, 'stat-agency-saved exists');
const availText = await page.locator('#stat-available').textContent().catch(() => '');
check(availText && /\d/.test(availText), `Available stat shows number: "${availText?.slice(0,40)}"`);
const needsText = await page.locator('#stat-needs').textContent().catch(() => '');
check(needsText && /\d/.test(needsText), `Needs stat shows number: "${needsText?.slice(0,40)}"`);

// ── 5. Urgent banner ──────────────────────────────────────────────────────────
log('\n=== 5. URGENT BANNER ===');
check(await page.locator('#urgent-banner').count() > 0, 'Urgent banner visible for today');
const bannerText = await page.locator('#urgent-banner').textContent().catch(() => '');
check(bannerText?.includes('urgent') || bannerText?.includes('shifts'), `Urgent banner has text: "${bannerText?.slice(0,80)}"`);

// ── 6. Smart Match tab ────────────────────────────────────────────────────────
log('\n=== 6. SMART MATCH TAB ===');
check(await page.locator('#tab-smart').count() > 0, 'Smart Match tab exists');
await page.locator('#tab-smart').click();
await page.waitForTimeout(300);
check(await page.locator('#smart-match-section').count() > 0, 'Smart match section visible');
// Check shift needs
check(await page.locator('[data-id="match-need-need-001"]').count() > 0, 'ICU shift need card exists');
check(await page.locator('[data-id="match-need-need-002"]').count() > 0, 'ED shift need card exists');
check(await page.locator('[data-id="match-need-need-003"]').count() > 0, 'Telemetry shift need card exists');
const matchText = await page.locator('#smart-match-section').textContent().catch(() => '');
check(matchText?.includes('ICU') && matchText?.includes('ED'), 'Smart match shows ICU and ED shifts');
check(matchText?.includes('Best Match') || matchText?.includes('match'), 'Smart match shows match labels');
await page.screenshot({ path: 'pw-screenshots/r32-float-02-smartmatch.png' });

// ── 7. Assign flow ────────────────────────────────────────────────────────────
log('\n=== 7. ASSIGN FLOW ===');
// Click first assign button in need-001 (ICU)
const assignBtn = page.locator('[data-id="match-need-need-001"]').locator('button[aria-label^="Assign float"]').first();
check(await assignBtn.count() > 0, 'Assign button exists for ICU need');
if (await assignBtn.count() > 0) {
  await assignBtn.click();
  await page.waitForTimeout(400);
}
check(await page.locator('#assign-modal').count() > 0, 'Assign confirmation modal opened');
const modalText = await page.locator('#assign-modal').textContent().catch(() => '');
check(modalText?.includes('Confirm') || modalText?.includes('Assignment'), `Modal shows confirmation text: "${modalText?.slice(0,80)}"`);
check(modalText?.includes('ICU'), 'Modal shows ICU unit');
await page.screenshot({ path: 'pw-screenshots/r32-float-03-modal.png' });

// Confirm the assignment
const confirmBtn = page.locator('[aria-label^="Confirm assignment"]');
check(await confirmBtn.count() > 0, 'Confirm assignment button exists');
if (await confirmBtn.count() > 0) {
  await confirmBtn.click();
  await page.waitForTimeout(500);
}
check(await page.locator('#assign-modal').count() === 0, 'Modal closed after confirm');
check(await page.locator('#assign-toast').count() > 0, 'Success toast shown after assign');
const toastText = await page.locator('#assign-toast').textContent().catch(() => '');
check(toastText?.includes('assigned') || toastText?.includes('notified'), `Toast shows success message: "${toastText?.trim()}"`);
await page.waitForTimeout(3500); // wait for toast to auto-dismiss

// ── 8. Float Pool tab ─────────────────────────────────────────────────────────
log('\n=== 8. FLOAT POOL TAB ===');
await page.locator('#tab-pool').click();
await page.waitForTimeout(300);
check(await page.locator('#float-pool-grid').count() > 0, 'Float pool grid visible');
// Check nurse cards
check(await page.locator('[data-id="float-card-fp-001"]').count() > 0, 'Sarah O\'Brien card exists');
check(await page.locator('[data-id="float-card-fp-004"]').count() > 0, 'Marcus Rivera card exists');
check(await page.locator('[data-id="float-card-fp-008"]').count() > 0, 'Nathan Brooks card exists');
const gridText = await page.locator('#float-pool-grid').textContent().catch(() => '');
check(gridText?.includes('Sarah') && gridText?.includes('Marcus'), 'Pool grid shows nurse names');
check(gridText?.includes('Available') || gridText?.includes('Assigned'), 'Pool grid shows status labels');
await page.screenshot({ path: 'pw-screenshots/r32-float-04-pool.png' });

// ── 9. Status filters ─────────────────────────────────────────────────────────
log('\n=== 9. STATUS FILTERS ===');
check(await page.locator('#filter-status-all').count() > 0, 'All filter exists');
check(await page.locator('#filter-status-available').count() > 0, 'Available filter exists');
check(await page.locator('#filter-status-on-call').count() > 0, 'On-call filter exists');
check(await page.locator('#filter-status-assigned').count() > 0, 'Assigned filter exists');
await page.locator('#filter-status-available').click();
await page.waitForTimeout(300);
const availableGrid = await page.locator('#float-pool-grid').textContent().catch(() => '');
check(availableGrid?.includes('Available'), 'Filtered grid shows available nurses');
// Check DNR nurses are excluded or grayed
const dnrCard = page.locator('[data-id="float-card-fp-011"]');
if (await dnrCard.count() > 0) {
  const dnrClass = await dnrCard.getAttribute('class');
  check(dnrClass?.includes('opacity') || availableGrid?.includes('Lisa Chang') === false, 'DNR nurse Lisa Chang is hidden or dimmed when filtering available');
}
await page.locator('#filter-status-all').click();
await page.waitForTimeout(200);

// Unit filter
check(await page.locator('#filter-unit').count() > 0, 'Unit filter dropdown exists');
await page.locator('#filter-unit').selectOption('ICU');
await page.waitForTimeout(300);
const icuGrid = await page.locator('#float-pool-grid').textContent().catch(() => '');
check(icuGrid?.includes('Sarah'), 'ICU filter shows Sarah O\'Brien (ICU certified)');
await page.locator('#filter-unit').selectOption('all');
await page.waitForTimeout(200);

// ── 10. Nurse profile drawer ──────────────────────────────────────────────────
log('\n=== 10. NURSE PROFILE DRAWER ===');
// Click a nurse card to open drawer
const sarahCard = page.locator('[data-id="float-card-fp-001"]');
await sarahCard.click();
await page.waitForTimeout(500);
check(await page.locator('#nurse-drawer').count() > 0, 'Nurse drawer opened');
const drawerName = await page.locator('#drawer-nurse-name').textContent().catch(() => '');
check(drawerName?.includes('Sarah') || drawerName?.includes('O\'Brien'), `Drawer shows nurse name: "${drawerName?.trim()}"`);
// Unit badges
check(await page.locator('[data-id="drawer-unit-badge-icu"]').count() > 0, 'ICU unit badge in drawer');
check(await page.locator('[data-id="drawer-unit-badge-ccu"]').count() > 0, 'CCU unit badge in drawer');
const drawerText = await page.locator('#nurse-drawer').textContent().catch(() => '');
check(drawerText?.includes('Certifications') || drawerText?.includes('ACLS'), 'Drawer shows certifications');
check(drawerText?.includes('Contact') || drawerText?.includes('555'), 'Drawer shows contact info');
await page.screenshot({ path: 'pw-screenshots/r32-float-05-drawer.png' });

// ── 11. Quick assign from drawer ──────────────────────────────────────────────
log('\n=== 11. QUICK ASSIGN FROM DRAWER ===');
check(await page.locator('#quick-assign-unit').count() > 0, 'Quick assign unit select exists');
check(await page.locator('#quick-assign-shift').count() > 0, 'Quick assign shift select exists');
check(await page.locator('[aria-label="Submit quick assign"]').count() > 0, 'Submit quick assign button exists');
// Select unit and shift
await page.locator('#quick-assign-unit').selectOption('ICU');
await page.locator('#quick-assign-shift').selectOption('night');
await page.locator('[aria-label="Submit quick assign"]').click();
await page.waitForTimeout(500);
// success or reassigned state
const successEl = page.locator('#quick-assign-success');
check(await successEl.count() > 0 || await page.locator('#assign-toast').count() > 0, 'Quick assign shows confirmation');

// Close drawer
await page.locator('[aria-label="Close nurse drawer"]').click();
await page.waitForTimeout(400);
check(await page.locator('#nurse-drawer').count() === 0, 'Drawer closed after clicking X');

// ── 12. Assignment history tab ────────────────────────────────────────────────
log('\n=== 12. ASSIGNMENT HISTORY ===');
await page.locator('#tab-history').click();
await page.waitForTimeout(300);
check(await page.locator('#assignment-history').count() > 0, 'Assignment history section visible');
const histText = await page.locator('#assignment-history').textContent().catch(() => '');
check(histText?.includes('Amanda Walsh') || histText?.includes('Roy Kimura'), 'History shows seeded assignments');
check(histText?.includes('Confirmed') || histText?.includes('confirmed'), 'History shows confirmed status');
await page.screenshot({ path: 'pw-screenshots/r32-float-06-history.png' });

// ── 13. Cross-training matrix tab ─────────────────────────────────────────────
log('\n=== 13. CROSS-TRAINING MATRIX ===');
await page.locator('#tab-matrix').click();
await page.waitForTimeout(400);
check(await page.locator('#cross-training-matrix').count() > 0, 'Cross-training matrix exists');
const matrixText = await page.locator('#cross-training-matrix').textContent().catch(() => '');
check(matrixText?.includes('ICU') && matrixText?.includes('Telemetry'), 'Matrix shows all units');
check(matrixText?.includes('Sarah') || matrixText?.includes('Marcus'), 'Matrix shows nurse names');
// Check cells
check(await page.locator('[data-id^="matrix-cell-"]').count() > 0, 'Matrix cells exist');
await page.screenshot({ path: 'pw-screenshots/r32-float-07-matrix.png' });

// ── 14. Tomorrow period shows different needs ──────────────────────────────────
log('\n=== 14. TOMORROW NEEDS ===');
await page.locator('#tab-smart').click();
await page.waitForTimeout(200);
await page.locator('#period-tomorrow').click();
await page.waitForTimeout(400);
const tomorrowText = await page.locator('#smart-match-section').textContent().catch(() => '');
check(tomorrowText?.includes('Mar 14') || tomorrowText?.includes('tomorrow') || tomorrowText?.includes('MS-B') || tomorrowText?.includes('CCU'), 'Tomorrow shows different needs');

// ── 15. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 15. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Float Pool Manager'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#stat-available').count() > 0, 'Stats visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r32-float-08-mobile.png' });

// ── 16. Console errors ────────────────────────────────────────────────────────
log('\n=== 16. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/float');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
