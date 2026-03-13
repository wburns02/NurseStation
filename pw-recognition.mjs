import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);
let pass = 0, fail = 0;

const ok  = (msg) => { log(`  ✓ ${msg}`); pass++; };
const err = (msg) => { log(`  ✗ FAIL: ${msg}`); fail++; };
const check = (cond, msg) => cond ? ok(msg) : err(msg);

// Navigate to recognition via nav link
await page.goto(BASE + '/');
await page.waitForTimeout(500);
log('\n=== 1. NAV LINK ===');
const navLink = page.locator('a[href="/recognition"]');
check(await navLink.count() > 0, 'Recognition nav link exists');
if (await navLink.count() > 0) {
  await navLink.click();
  await page.waitForTimeout(600);
}

log('\n=== 2. PAGE LOAD ===');
check(page.url().includes('/recognition'), 'URL is /recognition');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
check(h1?.includes('Recognition') || h1?.includes('recognition'), `h1 contains Recognition: "${h1?.trim()}"`);
await page.screenshot({ path: 'pw-screenshots/r21-rec-01-page.png' });

log('\n=== 3. STATS BAR ===');
check(await page.locator('#stat-this-week').count() > 0, '#stat-this-week exists');
check(await page.locator('#stat-daisy').count() > 0, '#stat-daisy exists');
check(await page.locator('#stat-honored').count() > 0, '#stat-honored exists');
check(await page.locator('#stat-top-unit').count() > 0, '#stat-top-unit exists');
const weekVal = await page.locator('#stat-this-week').textContent().catch(() => '');
check(weekVal.trim() !== '' && weekVal.trim() !== '0', `stat-this-week has value: "${weekVal.trim()}"`);

log('\n=== 4. RECOGNITION CARDS ===');
check(await page.locator('[data-id="rec-card-rec-001"]').count() > 0, 'rec-001 card visible');
check(await page.locator('[data-id="rec-card-rec-002"]').count() > 0, 'rec-002 DAISY card visible');
check(await page.locator('[data-id="rec-card-rec-010"]').count() > 0, 'rec-010 card visible');

log('\n=== 5. LIKE BUTTON ===');
const likeBtn001 = page.locator('[aria-label="Like recognition rec-001"]');
check(await likeBtn001.count() > 0, 'Like button for rec-001 exists');
if (await likeBtn001.count() > 0) {
  const beforeText = await likeBtn001.textContent().catch(() => '');
  await likeBtn001.click();
  await page.waitForTimeout(400);
  const afterText = await likeBtn001.textContent().catch(() => '');
  log(`    Like before: "${beforeText.trim()}" → after: "${afterText.trim()}"`);
  ok('Like button clicked');
}

log('\n=== 6. FILTER TABS ===');
// Try DAISY filter (label includes emoji: "🌼 DAISY")
const daisyFilterBtn = page.locator('[aria-label*="Filter"][aria-label*="DAISY"]');
check(await daisyFilterBtn.count() > 0, 'DAISY filter button exists');
if (await daisyFilterBtn.count() > 0) {
  await daisyFilterBtn.click();
  await page.waitForTimeout(500);
  // DAISY cards should still be visible
  check(await page.locator('[data-id="rec-card-rec-001"]').count() > 0, 'rec-001 DAISY visible in DAISY filter');
  await page.screenshot({ path: 'pw-screenshots/r21-rec-02-daisy-filter.png' });
}
// Milestones filter (label includes emoji: "🎉 Milestones")
const milestoneFilterBtn = page.locator('[aria-label*="Milestones"]');
if (await milestoneFilterBtn.count() > 0) {
  await milestoneFilterBtn.click();
  await page.waitForTimeout(400);
  check(await page.locator('[data-id="rec-card-rec-013"]').count() > 0, 'rec-013 milestone visible in Milestones filter');
}
// Back to All
const allFilterBtn = page.locator('[aria-label="Filter All"]');
if (await allFilterBtn.count() > 0) {
  await allFilterBtn.click();
  await page.waitForTimeout(400);
}

log('\n=== 7. KUDOS MODAL ===');
const giveKudosBtn = page.locator('[aria-label="Give kudos"]');
check(await giveKudosBtn.count() > 0, 'Give kudos button exists');
if (await giveKudosBtn.count() > 0) {
  await giveKudosBtn.click();
  await page.waitForTimeout(500);
  check(await page.locator('#kudos-modal').count() > 0, 'Kudos modal opened');
  await page.screenshot({ path: 'pw-screenshots/r21-rec-03-kudos-modal.png' });

  // Fill recipient
  const recipientSelect = page.locator('#kudos-recipient');
  check(await recipientSelect.count() > 0, 'Kudos recipient select exists');
  if (await recipientSelect.count() > 0) {
    await recipientSelect.selectOption({ index: 1 });
  }

  // Pick a category
  const catBtn = page.locator('[id^="cat-"]').first();
  if (await catBtn.count() > 0) {
    await catBtn.click();
    await page.waitForTimeout(200);
    ok('Kudos category selected');
  }

  // Fill message
  const msgArea = page.locator('#kudos-message');
  check(await msgArea.count() > 0, 'Kudos message textarea exists');
  if (await msgArea.count() > 0) {
    await msgArea.fill('Amazing teamwork during the code blue today — you were calm, focused, and led the team perfectly!');
  }

  // Submit
  const submitKudos = page.locator('[aria-label="Submit kudos"]');
  check(await submitKudos.count() > 0, 'Submit kudos button exists');
  if (await submitKudos.count() > 0) {
    await submitKudos.click();
    await page.waitForTimeout(2500);
    // Modal should be gone
    check(await page.locator('#kudos-modal').count() === 0, 'Kudos modal closed after submit');
  }
}

log('\n=== 8. NEW KUDOS CARD APPEARS ===');
await page.waitForTimeout(300);
// The new recognition should appear in the feed
const allCards = await page.locator('[data-id^="rec-card-"]').count();
check(allCards >= 15, `Feed has >= 15 cards after submission: ${allCards}`);
await page.screenshot({ path: 'pw-screenshots/r21-rec-04-after-kudos.png' });

log('\n=== 9. DAISY NOMINATION MODAL ===');
const daisyNomBtn = page.locator('[aria-label="Open DAISY nomination"]');
check(await daisyNomBtn.count() > 0, 'Open DAISY nomination button exists');
if (await daisyNomBtn.count() > 0) {
  await daisyNomBtn.click();
  await page.waitForTimeout(500);
  check(await page.locator('#daisy-modal').count() > 0, 'DAISY modal opened');
  await page.screenshot({ path: 'pw-screenshots/r21-rec-05-daisy-modal.png' });

  const daisyRecipient = page.locator('#daisy-recipient');
  if (await daisyRecipient.count() > 0) {
    await daisyRecipient.selectOption({ index: 1 });
  }

  const daisyMsg = page.locator('#daisy-message');
  if (await daisyMsg.count() > 0) {
    await daisyMsg.fill('She went above and beyond for our family during the most difficult time of our lives.');
  }

  const daisyStory = page.locator('#daisy-patient-story');
  if (await daisyStory.count() > 0) {
    await daisyStory.fill('My father was in the ICU for two weeks. She held our hands, explained every procedure, and never made us feel like we were in the way.');
  }

  const submitDaisy = page.locator('[aria-label="Submit DAISY nomination"]');
  check(await submitDaisy.count() > 0, 'Submit DAISY button exists');
  if (await submitDaisy.count() > 0) {
    await submitDaisy.click();
    await page.waitForTimeout(2500);
    check(await page.locator('#daisy-modal').count() === 0, 'DAISY modal closed after submit');
  }
}

log('\n=== 10. LEADERBOARD ===');
const lb0 = page.locator('[data-id="leaderboard-0"]');
check(await lb0.count() > 0, 'Leaderboard entry 0 exists');
const lb2 = page.locator('[data-id="leaderboard-2"]');
check(await lb2.count() > 0, 'Leaderboard entry 2 exists');

log('\n=== 11. DAISY INFO ===');
check(await page.locator('#daisy-info').count() > 0, '#daisy-info section exists');

log('\n=== 12. QUICK ACTION BUTTONS ===');
check(await page.locator('[aria-label="Quick give kudos"]').count() > 0 ||
      await page.locator('[aria-label="Give kudos"]').count() > 0, 'Quick kudos button exists');

log('\n=== 13. CONSOLE ERRORS ===');
const consoleMsgs = [];
page.on('console', msg => { if (msg.type() === 'error') consoleMsgs.push(msg.text()); });
await page.goto(BASE + '/recognition');
await page.waitForTimeout(800);
const errors = consoleMsgs.filter(m => !m.includes('favicon') && !m.includes('Download the React DevTools'));
check(errors.length === 0, `No console errors (found ${errors.length}): ${errors.join('; ')}`);

log('\n=== 14. MOBILE VIEWPORT ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/r21-rec-06-mobile.png' });
const mobileH1 = await page.locator('h1').first().textContent().catch(() => '');
check(mobileH1?.trim().length > 0, `Page renders on mobile: "${mobileH1?.trim()}"`);

log('\n=== RESULTS ===');
log(`Passed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  log('SOME TESTS FAILED — review output above');
  process.exit(1);
} else {
  log('ALL TESTS PASSED');
}

await browser.close();
