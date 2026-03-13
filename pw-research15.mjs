import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';

const log = (m) => console.log(m);

// Full route survey
const routes = [
  '/', '/marketplace', '/credentials', '/shifts', '/staff',
  '/messages', '/analytics', '/labor', '/time-off', '/training',
  '/coverage', '/wellbeing', '/auto-schedule', '/shift-board', '/notifications'
];

log('=== FULL ROUTE SURVEY ===');
for (const r of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(500);
  const title = await page.locator('h1').first().textContent().catch(() => '?');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  const charts = await page.locator('svg').count();
  log(`${r.padEnd(18)} → "${title?.trim()}" | btns:${btns} | inputs:${inputs} | svgs:${charts}`);
}

// Deep dive into dashboard
log('\n=== DASHBOARD CONTENT ===');
await page.goto(BASE + '/');
await page.waitForTimeout(800);
await page.screenshot({ path: 'pw-screenshots/r15-dashboard.png' });
const dashText = await page.locator('main').innerText().catch(() => '');
log(dashText.substring(0, 800));

// Deep dive into analytics
log('\n=== ANALYTICS CONTENT ===');
await page.goto(BASE + '/analytics');
await page.waitForTimeout(800);
await page.screenshot({ path: 'pw-screenshots/r15-analytics.png' });
const analyticsText = await page.locator('main').innerText().catch(() => '');
log(analyticsText.substring(0, 600));

// Deep dive into labor
log('\n=== LABOR COST CONTENT ===');
await page.goto(BASE + '/labor');
await page.waitForTimeout(800);
await page.screenshot({ path: 'pw-screenshots/r15-labor.png' });
const laborText = await page.locator('main').innerText().catch(() => '');
log(laborText.substring(0, 600));

// Deep dive into messages
log('\n=== MESSAGES CONTENT ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(800);
await page.screenshot({ path: 'pw-screenshots/r15-messages.png' });
const msgText = await page.locator('main').innerText().catch(() => '');
log(msgText.substring(0, 600));

// Deep dive into staff
log('\n=== STAFF PAGE CONTENT ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(800);
await page.screenshot({ path: 'pw-screenshots/r15-staff.png' });
const staffText = await page.locator('main').innerText().catch(() => '');
log(staffText.substring(0, 600));

// Check staff profile
log('\n=== STAFF PROFILE ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(500);
const staffLinks = await page.locator('a[href*="/staff/"]').count();
log(`Staff profile links: ${staffLinks}`);
if (staffLinks > 0) {
  await page.locator('a[href*="/staff/"]').first().click();
  await page.waitForTimeout(500);
  const profileUrl = page.url();
  log(`Profile URL: ${profileUrl}`);
  const profileText = await page.locator('main').innerText().catch(() => '');
  log(profileText.substring(0, 400));
  await page.screenshot({ path: 'pw-screenshots/r15-staff-profile.png' });
}

// What interactions work in messages
log('\n=== MESSAGES INTERACTIONS ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(500);
const msgBtns = await page.locator('button').allTextContents();
log('Message buttons: ' + msgBtns.slice(0, 10).join(' | '));

// Check for existing "today's priorities" or "morning briefing"
log('\n=== GAPS ANALYSIS ===');
await page.goto(BASE + '/');
await page.waitForTimeout(500);
const bodyText = await page.locator('body').innerText();
const gaps = {
  'patient census': (bodyText.match(/census|patient count|bed/gi) || []).length,
  'predictive demand': (bodyText.match(/predict|forecast|demand/gi) || []).length,
  'incident reports': (bodyText.match(/incident|report|IR/g) || []).length,
  'overtime alerts': (bodyText.match(/overtime|OT alert/gi) || []).length,
  'pay rates': (bodyText.match(/pay rate|\$\d+\/hr|hourly/gi) || []).length,
  'certification expiry': (bodyText.match(/expir|certif/gi) || []).length,
  'agency staff': (bodyText.match(/agency|travel|temp/gi) || []).length,
};
for (const [k,v] of Object.entries(gaps)) log(`  "${k}": ${v}x across entire app body`);

// Check all pages for what's missing
log('\n=== CROSS-PAGE GAPS ===');
for (const r of ['/', '/analytics', '/labor', '/staff']) {
  await page.goto(BASE + r);
  await page.waitForTimeout(400);
  const text = await page.locator('body').innerText();
  const hasPayroll = (text.match(/payroll|pay period|budget/gi)||[]).length;
  const hasAI = (text.match(/AI|predict|smart|automat/gi)||[]).length;
  const hasForecast = (text.match(/forecast|next week|demand|census/gi)||[]).length;
  log(`  ${r.padEnd(12)}: payroll:${hasPayroll} ai:${hasAI} forecast:${hasForecast}`);
}

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
