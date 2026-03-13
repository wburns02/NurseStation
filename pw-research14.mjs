import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';

const log = (m) => console.log(m);

const routes = [
  '/', '/marketplace', '/credentials', '/shifts', '/staff',
  '/messages', '/analytics', '/labor', '/time-off', '/training',
  '/coverage', '/wellbeing', '/auto-schedule', '/notifications'
];

log('=== ROUTE SURVEY ===');
for (const r of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(600);
  const title = await page.locator('h1').first().textContent().catch(() => '?');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${r.padEnd(18)} → h1:"${title?.trim()}" | btns:${btns} | inputs:${inputs}`);
}

log('\n=== DASHBOARD DEEP DIVE ===');
await page.goto(BASE + '/');
await page.waitForTimeout(800);
const dashText = await page.locator('body').innerText();
const keywords = ['today', 'alert', 'urgent', 'pending', 'action', 'nudge', 'metric', 'kpi', 'shift', 'staff', 'open', 'gap'];
for (const kw of keywords) {
  const count = (dashText.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
  if (count > 0) log(`  "${kw}": ${count}x`);
}
await page.screenshot({ path: 'pw-screenshots/r14-dashboard.png' });

log('\n=== SHIFTS PAGE DEEP DIVE ===');
await page.goto(BASE + '/shifts');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/r14-shifts.png' });
const shiftsText = await page.locator('body').innerText();
const shiftKws = ['swap', 'request', 'open shift', 'bid', 'pickup', 'callout', 'fill', 'float'];
for (const kw of shiftKws) {
  const count = (shiftsText.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
  if (count > 0) log(`  "${kw}": ${count}x`);
}

log('\n=== STAFF PAGE DEEP DIVE ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/r14-staff.png' });

log('\n=== MESSAGES PAGE ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(700);
const msgText = await page.locator('body').innerText();
const msgKws = ['broadcast', 'group', 'announcement', 'thread', 'unread', 'direct'];
for (const kw of msgKws) {
  const count = (msgKws.includes(kw) ? (msgText.toLowerCase().match(new RegExp(kw, 'g')) || []).length : 0);
  if (count > 0) log(`  "${kw}": ${count}x`);
}
await page.screenshot({ path: 'pw-screenshots/r14-messages.png' });

log('\n=== ANALYTICS PAGE ===');
await page.goto(BASE + '/analytics');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/r14-analytics.png' });
const analyticsText = await page.locator('body').innerText();
log(`  Analytics text snippet: ${analyticsText.substring(0, 300).replace(/\n/g, ' ')}`);

log('\n=== WHAT IS MISSING — WORKFLOW GAPS ===');
log('Looking for: shift swap marketplace, staff self-scheduling, predictive demand...');

// Check if there's any staff self-service or shift bid feature
await page.goto(BASE + '/shifts');
await page.waitForTimeout(600);
const noSelfService = await page.locator('text=/swap|bid|self.schedul|open shift|pick.?up/i').count();
log(`  Self-service shift features on /shifts: ${noSelfService}`);

// Check for predictive / forecast
await page.goto(BASE + '/analytics');
await page.waitForTimeout(600);
const noPredictive = await page.locator('text=/predict|forecast|demand|census/i').count();
log(`  Predictive features on /analytics: ${noPredictive}`);

// Check for incident / patient assignment
const noIncident = await page.locator('text=/incident|patient assign|acuity|census/i').count();
log(`  Patient/acuity features: ${noIncident}`);

// Check dashboard for "today's priorities"
await page.goto(BASE + '/');
await page.waitForTimeout(600);
const todayPriorities = await page.locator('text=/today|morning|priority|action required/i').count();
log(`  "Today's priorities" concept on dashboard: ${todayPriorities}`);

log('\n=== NAV ITEMS ===');
const navLinks = await page.locator('nav a').allTextContents();
log('  Nav items: ' + navLinks.join(', '));

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
