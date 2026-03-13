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
const navLink = page.locator('a[href="/briefing"]');
check(await navLink.count() > 0, 'Shift Briefing nav link exists');
if (await navLink.count() > 0) { await navLink.click(); await page.waitForTimeout(700); }

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/briefing'), `URL is /briefing: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Shift') && h1?.includes('Briefing'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r37-brief-01-load.png' });

// ── 3. Tabs ───────────────────────────────────────────────────────────────────
log('\n=== 3. TABS ===');
check(await page.locator('#tab-brief').count()    > 0, 'Brief tab exists');
check(await page.locator('#tab-announce').count() > 0, 'Announce tab exists');
check(await page.locator('#tab-sbar').count()     > 0, 'SBAR tab exists');
check(await page.locator('#tab-ack').count()      > 0, 'Ack tab exists');

// ── 4. Auto-generated brief ────────────────────────────────────────────────────
log('\n=== 4. AUTO-BRIEF PANEL ===');
check(await page.locator('#auto-brief').count() > 0, 'Auto-brief panel exists');
const briefText = await page.locator('#auto-brief').textContent().catch(() => '');
check(briefText?.includes('Shift Brief') || briefText?.includes('Generated'), `Brief panel has content: "${briefText?.slice(0,60)}"`);

// Stats inside brief
check(await page.locator('#brief-stat-staffing').count() > 0, 'Brief staffing stat exists');
check(await page.locator('#brief-stat-census').count()   > 0, 'Brief census stat exists');
check(await page.locator('#brief-stat-safety').count()   > 0, 'Brief safety stat exists');
check(await page.locator('#brief-stat-oncall').count()   > 0, 'Brief oncall stat exists');
const staffStat = await page.locator('#brief-stat-staffing').textContent().catch(() => '');
check(staffStat && /\d/.test(staffStat), `Staffing stat has number: "${staffStat?.slice(0,30)}"`);

// Highlights
const highlights = await page.locator('[data-id^="highlight-"]').count();
check(highlights >= 4, `At least 4 highlights: ${highlights}`);

await page.screenshot({ path: 'pw-screenshots/r37-brief-02-brief.png' });

// ── 5. Pinned announcements on brief tab ──────────────────────────────────────
log('\n=== 5. PINNED ANNOUNCEMENTS (BRIEF TAB) ===');
const pinnedCards = await page.locator('[data-id^="announcement-"]').count();
check(pinnedCards >= 2, `At least 2 pinned announcement cards: ${pinnedCards}`);
const firstAnn = await page.locator('[data-id="announcement-ann-001"]').count();
check(firstAnn > 0, 'ED Surge announcement (ann-001) visible');

// Pinned announcements start expanded; verify body is visible without clicking
const annCard = page.locator('[data-id="announcement-ann-001"]');
const annText = await annCard.textContent().catch(() => '');
check(annText?.includes('census') || annText?.includes('ED'), `Announcement body shows content: "${annText?.slice(0,80)}"`);

// ── 6. Acknowledge announcement ───────────────────────────────────────────────
log('\n=== 6. ACKNOWLEDGE ANNOUNCEMENT ===');
// ann-001 starts expanded (pinned); jm-001 NOT in acknowledgedBy → button should be visible
const ackBtn = page.locator('[aria-label^="Acknowledge announcement"]').first();
check(await ackBtn.count() > 0, 'Acknowledge button visible');
if (await ackBtn.count() > 0) {
  await ackBtn.click();
  await page.waitForTimeout(500);
}
check(await page.locator('#action-toast').count() > 0, 'Toast shown after acknowledge');
const ackToast = await page.locator('#action-toast').textContent().catch(() => '');
check(ackToast?.includes('acknowledged') || ackToast?.includes('Acknowledge'), `Ack toast: "${ackToast?.trim()}"`);
await page.waitForTimeout(4000);

// ── 7. Announcements tab ──────────────────────────────────────────────────────
log('\n=== 7. ANNOUNCEMENTS TAB ===');
await page.locator('#tab-announce').click();
await page.waitForTimeout(400);
check(await page.locator('#announcements-board').count() > 0, 'Announcements board visible');
const allAnns = await page.locator('[data-id^="announcement-"]').count();
check(allAnns >= 5, `At least 5 announcements: ${allAnns}`);

// Filter buttons
check(await page.locator('#ann-filter-all').count()     > 0, 'All filter exists');
check(await page.locator('#ann-filter-urgent').count()  > 0, 'Urgent filter exists');
check(await page.locator('#ann-filter-safety').count()  > 0, 'Safety filter exists');
check(await page.locator('#ann-filter-policy').count()  > 0, 'Policy filter exists');

// Filter to urgent
await page.locator('#ann-filter-urgent').click();
await page.waitForTimeout(300);
const urgentAnns = await page.locator('[data-id^="announcement-"]').count();
check(urgentAnns > 0 && urgentAnns < allAnns, `Urgent filter works: ${urgentAnns} < ${allAnns}`);

await page.locator('#ann-filter-all').click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'pw-screenshots/r37-brief-03-announcements.png' });

// ── 8. Compose new announcement ───────────────────────────────────────────────
log('\n=== 8. COMPOSE ANNOUNCEMENT ===');
await page.locator('[aria-label="Compose new announcement"]').click();
await page.waitForTimeout(400);
check(await page.locator('#compose-modal').count() > 0, 'Compose modal opened');

// Templates visible in modal
const templates = await page.locator('[data-id^="template-"]').count();
check(templates >= 4, `At least 4 templates: ${templates}`);

// Apply a template
await page.locator('[data-id="template-tmpl-001"]').click();
await page.waitForTimeout(200);
const titleAfterTemplate = await page.locator('#ann-title-input').inputValue();
check(titleAfterTemplate.length > 0, `Template fills title: "${titleAfterTemplate}"`);

// Verify type selector
check(await page.locator('#ann-type-urgent').count() > 0, 'Type buttons exist');
await page.locator('#ann-type-safety').click();
await page.waitForTimeout(100);

// Fill title and body
await page.fill('#ann-title-input', 'Test: Code Gray — Parking Garage Security Event');
await page.fill('#ann-body-input', 'CODE GRAY — Parking Garage Level 2. Suspicious individual reported. Security responding. All staff avoid Garage Level 2 until cleared. Update in 30 minutes.');
await page.waitForTimeout(200);

// Send
const sendBtn = page.locator('[aria-label="Send announcement"]');
check(await sendBtn.count() > 0, 'Send button exists');
await sendBtn.click();
await page.waitForTimeout(500);

check(await page.locator('#compose-modal').count() === 0, 'Modal closed after post');
check(await page.locator('#action-toast').count() > 0, 'Toast after posting');
await page.waitForTimeout(4000);

// Verify new announcement appears
const annsAfter = await page.locator('[data-id^="announcement-"]').count();
check(annsAfter > allAnns, `New announcement added: ${allAnns} → ${annsAfter}`);
await page.screenshot({ path: 'pw-screenshots/r37-brief-04-posted.png' });

// ── 9. Templates panel on brief tab ──────────────────────────────────────────
log('\n=== 9. TEMPLATES PANEL ===');
await page.locator('#tab-brief').click();
await page.waitForTimeout(300);
check(await page.locator('#templates-panel').count() > 0, 'Templates panel visible on brief tab');
const templateBtns = await page.locator('[data-id^="template-"]').count();
check(templateBtns >= 4, `At least 4 template buttons: ${templateBtns}`);

// ── 10. SBAR tab ──────────────────────────────────────────────────────────────
log('\n=== 10. SBAR TAB ===');
await page.locator('#tab-sbar').click();
await page.waitForTimeout(400);
check(await page.locator('#sbar-composer').count() > 0, 'SBAR composer exists');
check(await page.locator('#sbar-list').count() > 0, 'SBAR notes list exists');
const sbarNotes = await page.locator('[data-id^="sbar-note-"]').count();
check(sbarNotes >= 3, `At least 3 SBAR notes: ${sbarNotes}`);
// Critical SBAR expanded by default
check(await page.locator('[data-id="sbar-note-sbar-001"]').count() > 0, 'Stroke SBAR note exists');
check(await page.locator('[data-id="sbar-note-sbar-003"]').count() > 0, 'Neutropenic fever SBAR note exists');
await page.screenshot({ path: 'pw-screenshots/r37-brief-05-sbar.png' });

// ── 11. Expand SBAR note ──────────────────────────────────────────────────────
log('\n=== 11. EXPAND SBAR ===');
const sbar2 = page.locator('[data-id="sbar-note-sbar-002"]');
await sbar2.locator('button').first().click();
await page.waitForTimeout(400);
const sbar2Text = await sbar2.textContent().catch(() => '');
check(sbar2Text?.includes('Situation') || sbar2Text?.includes('Background'), `SBAR expanded with SBAR sections`);
check(sbar2Text?.includes('CABG') || sbar2Text?.includes('Davis'), `SBAR shows content: "${sbar2Text?.slice(0,80)}"`);

// ── 12. Acknowledge SBAR ─────────────────────────────────────────────────────
log('\n=== 12. ACKNOWLEDGE SBAR ===');
const sbarAckBtn = page.locator('[aria-label^="Acknowledge SBAR sbar-002"]');
check(await sbarAckBtn.count() > 0, 'SBAR acknowledge button exists');
if (await sbarAckBtn.count() > 0) {
  await sbarAckBtn.click();
  await page.waitForTimeout(500);
}
check(await page.locator('#action-toast').count() > 0, 'Toast after SBAR ack');
await page.waitForTimeout(4000);

// ── 13. Compose SBAR ──────────────────────────────────────────────────────────
log('\n=== 13. COMPOSE SBAR ===');
await page.locator('[aria-label="Toggle SBAR composer"]').click();
await page.waitForTimeout(400);
// SBAR fields should be visible
check(await page.locator('#sbar-situation').count()      > 0, 'S field visible');
check(await page.locator('#sbar-background').count()     > 0, 'B field visible');
check(await page.locator('#sbar-assessment').count()     > 0, 'A field visible');
check(await page.locator('#sbar-recommendation').count() > 0, 'R field visible');
check(await page.locator('#sbar-priority').count()       > 0, 'Priority selector visible');
check(await page.locator('#sbar-unit').count()           > 0, 'Unit selector visible');

// Fill SBAR
await page.fill('#sbar-situation', 'Patient Chen, M. in ICU 401A — BP dropping, now 78/42 despite pressors. MAP <60 for 20 minutes.');
await page.fill('#sbar-background', '55-year-old with septic shock, Klebsiella BSI Day 3. On norepinephrine 0.4 mcg/kg/min + vasopressin 0.04 units/min.');
await page.fill('#sbar-assessment', 'Refractory septic shock — may need stress dose steroids. Lactic acid trending up (3.2 → 4.8).');
await page.fill('#sbar-recommendation', 'Page Intensivist STAT. Request bedside echo, check CVP. Consider hydrocortisone 50mg q6h per septic shock protocol.');

await page.waitForTimeout(200);
const saveBtn = page.locator('[aria-label="Save SBAR note"]');
check(await saveBtn.count() > 0, 'Save SBAR button exists');
const isSaveBtnDisabled = await saveBtn.isDisabled();
check(!isSaveBtnDisabled, 'Save button enabled after filling required fields');
await saveBtn.click();
await page.waitForTimeout(500);

check(await page.locator('#action-toast').count() > 0, 'Toast after saving SBAR');
const sbarToast = await page.locator('#action-toast').textContent().catch(() => '');
check(sbarToast?.includes('SBAR') || sbarToast?.includes('saved'), `SBAR save toast: "${sbarToast?.trim()}"`);
await page.waitForTimeout(4000);

// New note added
const sbarAfter = await page.locator('[data-id^="sbar-note-"]').count();
check(sbarAfter > sbarNotes, `SBAR note added: ${sbarNotes} → ${sbarAfter}`);
await page.screenshot({ path: 'pw-screenshots/r37-brief-06-sbar-saved.png' });

// ── 14. Acknowledgment tab ────────────────────────────────────────────────────
log('\n=== 14. ACK TAB ===');
await page.locator('#tab-ack').click();
await page.waitForTimeout(400);
check(await page.locator('#ack-tracker').count() > 0, 'Ack tracker visible');
const ackRows = await page.locator('[data-id^="ack-staff-"]').count();
check(ackRows >= 10, `At least 10 staff ack rows: ${ackRows}`);
const ackText = await page.locator('#ack-tracker').textContent().catch(() => '');
check(ackText?.includes('Sarah Kim') || ackText?.includes('SK'), 'Ack tracker shows staff names');
check(ackText?.includes('Acknowledged') || ackText?.includes('%'), 'Ack tracker shows acknowledgment status');
check(await page.locator('[aria-label="Send brief reminder"]').count() > 0, 'Send reminder button exists');
await page.screenshot({ path: 'pw-screenshots/r37-brief-07-ack.png' });

// ── 15. Brief ack button ──────────────────────────────────────────────────────
log('\n=== 15. BRIEF ACK BUTTON ===');
await page.locator('#tab-brief').click();
await page.waitForTimeout(300);
await page.locator('[aria-label="Compose new announcement"]').first().waitFor({ state: 'visible' });
// The "Ack Brief" button in the header
const ackBriefBtn = page.locator('button:has-text("Ack Brief")');
check(await ackBriefBtn.count() > 0, 'Ack Brief button in header');
await ackBriefBtn.click();
await page.waitForTimeout(500);
check(await page.locator('#action-toast').count() > 0, 'Toast after brief ack');
await page.waitForTimeout(4000);

// ── 16. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 16. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Shift') && mobileH1?.includes('Briefing'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('#tab-brief').count() > 0, 'Tabs visible on mobile');
check(await page.locator('#auto-brief').count() > 0, 'Brief panel visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r37-brief-08-mobile.png' });

// ── 17. Console errors ─────────────────────────────────────────────────────────
log('\n=== 17. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/briefing');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
