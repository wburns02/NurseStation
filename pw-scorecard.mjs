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
const navLink = page.locator('a[href="/scorecard"]');
check(await navLink.count() > 0, 'Scorecards nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(600);
}

// ── 2. Page load ──────────────────────────────────────────────────────────────
log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/scorecard'), `URL is /scorecard: ${page.url()}`);
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Nurse Scorecards'), `h1 correct: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r30-sc-01-load.png' });

// ── 3. Stats ──────────────────────────────────────────────────────────────────
log('\n=== 3. STATS ===');
check(await page.locator('#stat-avg-score').count() > 0, 'stat-avg-score exists');
check(await page.locator('#stat-reviews-done').count() > 0, 'stat-reviews-done exists');
check(await page.locator('#stat-pending-feedback').count() > 0, 'stat-pending-feedback exists');
check(await page.locator('#stat-top-performer').count() > 0, 'stat-top-performer exists');
const avgText = await page.locator('#stat-avg-score').textContent().catch(() => '');
check(avgText?.includes('Avg'), `stat-avg-score has content: "${avgText?.slice(0,40)}"`);
const topText = await page.locator('#stat-top-performer').textContent().catch(() => '');
check(topText?.includes('Sarah') || topText?.includes('Robert'), `Top performer shown: "${topText?.slice(0,40)}"`);

// ── 4. Nurse cards ────────────────────────────────────────────────────────────
log('\n=== 4. NURSE CARDS ===');
const nurseCards = await page.locator('[data-id^="nurse-card-"]').count();
check(nurseCards === 14, `All 14 nurse cards visible: ${nurseCards}`);
check(await page.locator('[data-id="nurse-card-st-001"]').count() > 0, 'Janet Morrison card (st-001) visible');
check(await page.locator('[data-id="nurse-card-st-003"]').count() > 0, 'Sarah Kim card (st-003) visible');
check(await page.locator('[data-id="nurse-card-st-014"]').count() > 0, 'Beth Anderson card (st-014) visible');
// Sarah Kim should be first (highest score 4.78)
const firstCard = await page.locator('[data-id^="nurse-card-"]').first().getAttribute('data-id').catch(() => '');
check(firstCard === 'nurse-card-st-003', `Sarah Kim first (highest score): ${firstCard}`);
await page.screenshot({ path: 'pw-screenshots/r30-sc-02-cards.png' });

// ── 5. Period picker ──────────────────────────────────────────────────────────
log('\n=== 5. PERIOD PICKER ===');
const periodPicker = page.locator('#scorecard-period-picker');
check(await periodPicker.count() > 0, 'Period picker exists');
const periodOpts = await periodPicker.locator('option').count();
check(periodOpts === 3, `3 period options: ${periodOpts}`);
// Switch period
await periodPicker.selectOption('annual-2025');
await page.waitForTimeout(300);
check(await page.locator('[data-id^="nurse-card-"]').count() === 14, 'Cards still show after period switch');
await periodPicker.selectOption('q1-2026');
await page.waitForTimeout(200);

// ── 6. Unit filter ────────────────────────────────────────────────────────────
log('\n=== 6. UNIT FILTER ===');
const icuFilter = page.locator('[aria-label="Filter unit ICU"]');
check(await icuFilter.count() > 0, 'ICU filter button exists');
await icuFilter.click();
await page.waitForTimeout(400);
const icuCards = await page.locator('[data-id^="nurse-card-"]').count();
check(icuCards >= 1 && icuCards <= 4, `ICU filter shows ICU nurses only: ${icuCards}`);
// Marcus Chen (ICU) should be visible; Robert Walsh (MS-A) should not
check(await page.locator('[data-id="nurse-card-st-002"]').count() > 0, 'Marcus Chen (ICU) visible after ICU filter');
check(await page.locator('[data-id="nurse-card-st-006"]').count() === 0, 'Robert Walsh (MS-A) hidden after ICU filter');
// Reset
await page.locator('[aria-label="Filter unit all"]').click();
await page.waitForTimeout(300);
const allCardsAfter = await page.locator('[data-id^="nurse-card-"]').count();
check(allCardsAfter === 14, `All 14 back after reset: ${allCardsAfter}`);

// ── 7. Score filter ───────────────────────────────────────────────────────────
log('\n=== 7. SCORE FILTER ===');
await page.locator('[aria-label="Filter score high"]').click();
await page.waitForTimeout(300);
const highCards = await page.locator('[data-id^="nurse-card-"]').count();
check(highCards >= 1 && highCards < 14, `High score filter reduces cards: ${highCards}`);
// Beth Anderson (3.22) should be hidden
check(await page.locator('[data-id="nurse-card-st-014"]').count() === 0, 'Beth Anderson hidden (score < 4.0)');
await page.locator('[aria-label="Filter score low"]').click();
await page.waitForTimeout(300);
const lowCards = await page.locator('[data-id^="nurse-card-"]').count();
check(lowCards >= 1 && lowCards < 14, `Low score filter works: ${lowCards}`);
check(await page.locator('[data-id="nurse-card-st-014"]').count() > 0, 'Beth Anderson visible in low filter');
// Reset
await page.locator('[aria-label="Filter score all"]').click();
await page.waitForTimeout(300);

// ── 8. Open nurse panel ───────────────────────────────────────────────────────
log('\n=== 8. NURSE PANEL ===');
// Click on Sarah Kim card
await page.locator('[data-id="nurse-card-st-003"]').click();
await page.waitForTimeout(500);
check(await page.locator('#nurse-panel').count() > 0, 'Nurse panel opened');
const panelText = await page.locator('#nurse-panel').textContent().catch(() => '');
check(panelText?.includes('Sarah Kim'), 'Panel shows Sarah Kim');
check(panelText?.includes('CCU'), 'Panel shows CCU unit');
check(panelText?.includes('11'), 'Panel shows seniority years');
await page.screenshot({ path: 'pw-screenshots/r30-sc-03-panel.png' });

// ── 9. Dimension bars in panel ────────────────────────────────────────────────
log('\n=== 9. PANEL DIMENSIONS ===');
check(await page.locator('[data-id="panel-dim-reliability"]').count() > 0, 'Reliability dim bar in panel');
check(await page.locator('[data-id="panel-dim-clinical"]').count() > 0, 'Clinical dim bar in panel');
check(await page.locator('[data-id="panel-dim-teamwork"]').count() > 0, 'Teamwork dim bar in panel');
check(await page.locator('[data-id="panel-dim-growth"]').count() > 0, 'Growth dim bar in panel');
check(await page.locator('[data-id="panel-dim-leadership"]').count() > 0, 'Leadership dim bar in panel');

// ── 10. Peer feedback entries in panel ───────────────────────────────────────
log('\n=== 10. PEER FEEDBACK IN PANEL ===');
// Sarah has 2 peer feedbacks seeded
check(await page.locator('[data-id^="feedback-entry-"]').count() === 2, '2 peer feedback entries for Sarah');
check(await page.locator('[data-id="feedback-entry-pf-001"]').count() > 0, 'pf-001 (Christina Lee feedback) visible');

// ── 11. Manager note editing ─────────────────────────────────────────────────
log('\n=== 11. MANAGER NOTE ===');
const noteInput = page.locator('#manager-note-input');
check(await noteInput.count() > 0, 'Manager note textarea exists');
const noteVal = await noteInput.inputValue().catch(() => '');
check(noteVal.length > 0, `Manager note has content: "${noteVal.slice(0,40)}"`);
// Edit note
await noteInput.fill('Updated manager note for Sarah Kim - outstanding quarter.');
await page.waitForTimeout(200);
await page.locator('[aria-label="Save manager note"]').click();
await page.waitForTimeout(500);
check(await page.locator('#note-saved').count() > 0, 'Note saved indicator shown');
await page.screenshot({ path: 'pw-screenshots/r30-sc-04-note-saved.png' });

// ── 12. Generate review draft ─────────────────────────────────────────────────
log('\n=== 12. GENERATE REVIEW DRAFT ===');
const genBtn = page.locator('[aria-label="Generate review draft"]');
check(await genBtn.count() > 0, 'Generate review draft button exists');
await genBtn.click();
await page.waitForTimeout(500);
check(await page.locator('#review-draft').count() > 0, 'Review draft section appeared');
const draftText = await page.locator('#review-draft').textContent().catch(() => '');
check(draftText?.includes('PERFORMANCE REVIEW'), 'Draft contains "PERFORMANCE REVIEW"');
check(draftText?.includes('Sarah Kim'), 'Draft contains nurse name');
check(draftText?.includes('Q1 2026'), 'Draft contains period');
check(draftText?.includes('CCU'), 'Draft contains unit');
await page.screenshot({ path: 'pw-screenshots/r30-sc-05-draft.png' });

// ── 13. Give peer feedback button opens modal ─────────────────────────────────
log('\n=== 13. PEER FEEDBACK MODAL ===');
const feedbackBtn = page.locator('[aria-label="Give peer feedback for Sarah Kim"]');
check(await feedbackBtn.count() > 0, 'Give feedback button exists in panel');
await feedbackBtn.click();
await page.waitForTimeout(400);
check(await page.locator('#peer-feedback-modal').count() > 0, 'Peer feedback modal opened');
await page.screenshot({ path: 'pw-screenshots/r30-sc-06-feedback-modal.png' });

// ── 14. Feedback form questions ───────────────────────────────────────────────
log('\n=== 14. FEEDBACK FORM QUESTIONS ===');
check(await page.locator('[data-id="feedback-q-communication"]').count() > 0, 'Communication question exists');
check(await page.locator('[data-id="feedback-q-reliability"]').count() > 0, 'Reliability question exists');
check(await page.locator('[data-id="feedback-q-clinical"]').count() > 0, 'Clinical question exists');
check(await page.locator('[data-id="feedback-q-collaboration"]').count() > 0, 'Collaboration question exists');
check(await page.locator('[data-id="feedback-q-attitude"]').count() > 0, 'Attitude question exists');
check(await page.locator('#feedback-comment').count() > 0, 'Comment textarea exists');

// ── 15. Validation — empty comment ───────────────────────────────────────────
log('\n=== 15. FEEDBACK VALIDATION ===');
await page.locator('[aria-label="Submit peer feedback"]').click();
await page.waitForTimeout(300);
check(await page.locator('#peer-feedback-modal').count() > 0, 'Modal stays open on empty comment');

// ── 16. Submit peer feedback ──────────────────────────────────────────────────
log('\n=== 16. SUBMIT PEER FEEDBACK ===');
await page.locator('#feedback-comment').fill('Sarah is an exceptional charge nurse. Her situational awareness during the busy census week was remarkable.');
await page.waitForTimeout(200);
await page.locator('[aria-label="Submit peer feedback"]').click();
await page.waitForTimeout(600);
check(await page.locator('#peer-feedback-modal').count() === 0, 'Feedback modal closed after submit');
check(await page.locator('#feedback-success').count() > 0, 'Feedback success toast shown');
await page.screenshot({ path: 'pw-screenshots/r30-sc-07-feedback-submitted.png' });

// ── 17. Feedback count updated in panel ──────────────────────────────────────
log('\n=== 17. FEEDBACK COUNT UPDATED ===');
// Panel should still be open (we submitted feedback from inside panel)
// Sarah now has 3 feedbacks (2 seeded + 1 just submitted)
await page.waitForTimeout(400);
const feedbackEntries = await page.locator('[data-id^="feedback-entry-"]').count();
check(feedbackEntries === 3, `Sarah now has 3 feedback entries: ${feedbackEntries}`);
await page.screenshot({ path: 'pw-screenshots/r30-sc-08-updated.png' });

// ── 18. Close panel ───────────────────────────────────────────────────────────
log('\n=== 18. CLOSE PANEL ===');
const closeBtn = page.locator('[aria-label="Close nurse panel"]');
check(await closeBtn.count() > 0, 'Close panel button exists');
await closeBtn.click();
await page.waitForTimeout(500);
check(await page.locator('#nurse-panel').count() === 0, 'Panel closed');
check(await page.locator('[data-id^="nurse-card-"]').count() === 14, 'All 14 cards still visible after close');

// ── 19. Open different nurse (no peer feedback) ───────────────────────────────
log('\n=== 19. NURSE WITH NO PEER FEEDBACK ===');
// Beth Anderson (st-014) has no peer feedback
await page.locator('[data-id="nurse-card-st-014"]').click();
await page.waitForTimeout(500);
check(await page.locator('#nurse-panel').count() > 0, 'Panel opened for Beth Anderson');
const bethPanel = await page.locator('#nurse-panel').textContent().catch(() => '');
check(bethPanel?.includes('Beth Anderson'), 'Panel shows Beth Anderson');
check(bethPanel?.includes('No peer feedback yet'), 'Empty peer feedback state shown');
check(await page.locator('[data-id^="feedback-entry-"]').count() === 0, 'No feedback entries for Beth');
await page.locator('[aria-label="Close nurse panel"]').click();
await page.waitForTimeout(400);

// ── 20. Export PDF button ─────────────────────────────────────────────────────
log('\n=== 20. EXPORT PDF BUTTON ===');
check(await page.locator('[aria-label="Export to PDF"]').count() > 0, 'Export PDF button exists');

// ── 21. Attention banner ──────────────────────────────────────────────────────
log('\n=== 21. ATTENTION BANNER ===');
const bodyText = await page.locator('body').textContent().catch(() => '');
check(bodyText?.toLowerCase().includes('development') || bodyText?.toLowerCase().includes('attention'), 'Development/attention banner visible');

// ── 22. Mobile viewport ───────────────────────────────────────────────────────
log('\n=== 22. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.includes('Nurse Scorecards'), `Mobile h1: "${mobileH1?.trim()}"`);
check(await page.locator('[data-id^="nurse-card-"]').count() > 0, 'Nurse cards visible on mobile');
await page.screenshot({ path: 'pw-screenshots/r30-sc-09-mobile.png' });

// ── 23. Console errors ────────────────────────────────────────────────────────
log('\n=== 23. CONSOLE ERRORS ===');
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
await page.goto(BASE + '/scorecard');
await page.waitForTimeout(1000);
const errors = consoleErrors.filter(m => !m.includes('favicon') && !m.includes('React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) { log('SOME TESTS FAILED'); process.exit(1); }
else log('ALL TESTS PASSED');

await browser.close();
