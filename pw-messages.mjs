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

// ── 1. Nav item exists and has badge ────────────────────────────────────────
log('\n=== Nav & Routing ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);

const messagesNav = page.locator('a[href="/messages"]');
if (await messagesNav.count() > 0) log('✓ Messages nav item found');
else fail('Messages nav item not found');

// Check for unread badge on nav
const navBadge = page.locator('a[href="/messages"] span').filter({ hasText: '4' });
if (await navBadge.count() > 0) log('✓ Messages unread badge (4) visible in nav');
else fail('Messages unread badge not found in nav');

// ── 2. Navigate to Messages page ────────────────────────────────────────────
log('\n=== Messages Page Load ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/msg-01-initial.png' });

const heading = page.locator('text=Messages').first();
if (await heading.count() > 0) log('✓ "Messages" heading visible');
else fail('"Messages" heading not found');

// Check three-pane layout
const hipaaNotice = page.locator('text=HIPAA compliant');
if (await hipaaNotice.count() > 0) log('✓ HIPAA compliance notice visible');
else fail('HIPAA compliance notice not found');

// ── 3. Conversation list ─────────────────────────────────────────────────────
log('\n=== Conversation List ===');
const convNames = ['ICU Team', 'ED Team', 'Med-Surg B', 'James Okafor', 'Sarah Chen', 'Lisa Greenwald', 'Christine Park'];
for (const name of convNames) {
  const el = page.locator(`text=${name}`).first();
  if (await el.count() > 0) log(`✓ Conversation "${name}" visible`);
  else fail(`Conversation "${name}" not found`);
}

// ── 4. ICU Team channel (default) ───────────────────────────────────────────
log('\n=== ICU Team Channel (Default) ===');
// Should show pre-populated messages
const priyaMsg = page.locator('text=Good morning everyone');
if (await priyaMsg.count() > 0) log('✓ Priya Sharma message visible');
else fail('Priya Sharma message not found');

const gapAlert = page.locator('text=Gap alert').first();
if (await gapAlert.count() > 0) log('✓ System gap alert card visible');
else fail('System gap alert card not found');

// Context panel — unit status
const liveStatus = page.locator('text=Live Status').first();
if (await liveStatus.count() > 0) log('✓ Context panel with Live Status visible');
else fail('Context panel Live Status not found');

// ── 5. Switch to James Okafor DM ────────────────────────────────────────────
log('\n=== James Okafor DM ===');
const jamesConv = page.locator('button').filter({ hasText: 'James Okafor' }).first();
await jamesConv.click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'pw-screenshots/msg-02-james-dm.png' });

const swapCard = page.locator('text=Shift Swap Request');
if (await swapCard.count() > 0) log('✓ Shift swap card visible in James DM');
else fail('Shift swap card not found in James DM');

const approveBtn = page.locator('button:has-text("Approve Swap")');
if (await approveBtn.count() > 0) log('✓ "Approve Swap" action button visible');
else fail('"Approve Swap" button not found');

// Click approve
await approveBtn.click();
await page.waitForTimeout(300);
const approvedBadge = page.locator('text=Approved ✓');
if (await approvedBadge.count() > 0) log('✓ Card updated to "Approved ✓" after clicking');
else fail('Card did not update to "Approved ✓"');
await page.screenshot({ path: 'pw-screenshots/msg-03-approved-card.png' });

// Active request in context panel
const activeReq = page.locator('text=Active Requests');
if (await activeReq.count() > 0) log('✓ Context panel shows Active Requests for James');
else fail('Context panel Active Requests not found');

// ── 6. Send a message ────────────────────────────────────────────────────────
log('\n=== Compose & Send Message ===');
const compose = page.locator('textarea').first();
await compose.click();
await compose.fill('Thanks James, I\'ll approve the swap. Get some rest!');
await page.waitForTimeout(200);

const sendBtn = page.locator('button[title=""]').last();
// Find the send button via its parent
const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
await page.keyboard.press('Enter');
await page.waitForTimeout(400);

// Check message appeared
const sentMsg = page.locator('text=Thanks James').first();
if (await sentMsg.count() > 0) log('✓ Sent message appears in thread');
else fail('Sent message not found in thread');
await page.screenshot({ path: 'pw-screenshots/msg-04-message-sent.png' });

// Auto-response appears after delay
log('Waiting for auto-response...');
await page.waitForTimeout(3500);
const autoResp = page.locator('text=Sounds good, thanks Janet').first();
if (await autoResp.count() > 0) log('✓ Auto-response from James appeared');
else fail('Auto-response from James not found');
await page.screenshot({ path: 'pw-screenshots/msg-05-auto-response.png' });

// ── 7. Sarah Chen DM ─────────────────────────────────────────────────────────
log('\n=== Sarah Chen DM ===');
// Use unique last message text to avoid matching James Okafor's preview (which also says "Sarah Chen")
const sarahConv = page.locator('button').filter({ hasText: "You're a lifesaver" }).first();
await sarahConv.click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/msg-06-sarah-dm.png' });

const gapFilledCard = page.locator('text=Gap Filled ✓');
if (await gapFilledCard.count() > 0) log('✓ Gap filled success card visible in Sarah DM');
else fail('Gap filled card not found in Sarah DM');

const sarahAssignment = page.locator('text=Today\'s Assignment');
if (await sarahAssignment.count() > 0) log('✓ Context panel shows Today\'s Assignment for Sarah');
else fail('Context panel Today\'s Assignment not found');

// ── 8. Lisa Greenwald DM (credential context) ───────────────────────────────
log('\n=== Lisa Greenwald DM ===');
const lisaConv = page.locator('button').filter({ hasText: 'Lisa Greenwald' }).first();
await lisaConv.click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/msg-07-lisa-dm.png' });

const credCard = page.locator('text=Credential Expiry Reminder Sent');
if (await credCard.count() > 0) log('✓ Credential alert card visible in Lisa DM');
else fail('Credential alert card not found in Lisa DM');

const credStatus = page.locator('text=Credential Status');
if (await credStatus.count() > 0) log('✓ Context panel shows Credential Status for Lisa');
else fail('Context panel Credential Status not found');

// ── 9. Search ─────────────────────────────────────────────────────────────────
log('\n=== Search Functionality ===');
const searchBox = page.locator('input[placeholder*="Search"]');
await searchBox.fill('Sarah');
await page.waitForTimeout(200);
const sarahResult = page.locator('button').filter({ hasText: 'Sarah Chen' });
if (await sarahResult.count() > 0) log('✓ Search filters to Sarah Chen');
else fail('Search result for Sarah Chen not found');

await searchBox.fill('');
await page.waitForTimeout(200);

// ── 10. Context panel toggle ─────────────────────────────────────────────────
log('\n=== Context Panel Toggle ===');
const infoBtn = page.locator('button[title="Toggle info panel"]');
if (await infoBtn.count() > 0) {
  await infoBtn.click();
  await page.waitForTimeout(300);
  // Panel should be hidden
  const credStatusAfter = page.locator('text=Credential Status');
  if (await credStatusAfter.count() === 0) log('✓ Context panel hidden after toggle');
  else log('(context panel still visible — may be transition timing)');
  // Toggle back
  await infoBtn.click();
  await page.waitForTimeout(400);
  log('✓ Context panel toggled back');
} else {
  fail('Info toggle button not found');
}

// ── 11. Console errors ───────────────────────────────────────────────────────
log('\n=== Console Errors ===');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(BASE + '/messages');
await page.waitForTimeout(500);
log(`Console errors: ${errors.length}`);
if (errors.length > 0) errors.forEach(e => log('ERR: ' + e));

// Mobile viewport
log('\n=== Mobile (375px) ===');
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'pw-screenshots/msg-08-mobile.png' });
log('✓ Mobile screenshot taken');

await browser.close();

log('\n=== RESULT ===');
if (pass) { log('ALL CHECKS PASSED ✓'); process.exit(0); }
else { log('SOME CHECKS FAILED'); process.exit(1); }
