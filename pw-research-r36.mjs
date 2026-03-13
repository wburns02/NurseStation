import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
const BASE = 'http://localhost:5178';

const routes = [
  '/', '/marketplace', '/credentials', '/shifts', '/staff', '/analytics',
  '/messages', '/notifications', '/labor', '/time-off', '/training',
  '/coverage', '/wellbeing', '/auto-schedule', '/shift-board', '/forecast',
  '/people', '/charge', '/onboarding', '/overtime', '/incidents',
  '/recognition', '/ratios', '/handoff', '/timeclock', '/payroll',
  '/hiring', '/availability', '/swaps', '/self-schedule', '/scorecard',
  '/budget', '/float', '/agency', '/safe-hours', '/oncall',
];

const keywords = [
  'bed board', 'census', 'patient census', 'acuity',
  'preceptor', 'competency',
  'scheduling request', 'shift request', 'open shift',
  'discharge', 'admit', 'transfer',
  'real-time', 'live feed', 'now',
  'grievance', 'retention', 'turnover',
  'cross-unit', 'float assignment',
  'peer review', 'performance review',
  'patient ratio', 'staffing ratio',
  'meal break', 'break tracker',
  'emergency', 'rapid response', 'code',
  'case mix', 'acuity score',
  'staff request', 'direct message',
  'schedule template', 'copy schedule',
  'night shift differential',
  'holiday', 'holiday schedule',
  'text message', 'sms',
  'weather alert', 'mass notification',
];

console.log('=== RESEARCH PASS — R36 ===\n');

const allText = {};
for (const route of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(400);
  const text = await page.locator('body').textContent().catch(() => '');
  allText[route] = text?.toLowerCase() ?? '';
}

console.log('=== KEYWORD SCAN ===');
for (const kw of keywords) {
  const found = routes.filter(r => allText[r]?.includes(kw.toLowerCase()));
  if (found.length === 0) {
    console.log(`  MISSING: "${kw}"`);
  } else {
    console.log(`  present "${kw}": ${found.join(', ')}`);
  }
}

// ── Deep scan: what's on each page ──
console.log('\n=== PAGE HEADLINES ===');
for (const route of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(400);
  const h1 = await page.locator('h1').first().textContent().catch(() => '(no h1)');
  const headings = await page.locator('h2, h3').evaluateAll(els => els.slice(0,4).map(e => e.textContent?.trim()));
  console.log(`  ${route}: ${h1?.trim()} | ${headings.join(' · ')}`);
}

// ── Dashboard scan ──
console.log('\n=== DASHBOARD DETAIL ===');
await page.goto(BASE + '/');
await page.waitForTimeout(600);
const dashText = await page.locator('main').textContent().catch(() => '');
console.log(dashText?.slice(0, 800));

// ── Charge board scan ──
console.log('\n=== CHARGE BOARD DETAIL ===');
await page.goto(BASE + '/charge');
await page.waitForTimeout(600);
const chargeText = await page.locator('main').textContent().catch(() => '');
console.log(chargeText?.slice(0, 600));

// ── Shifts detail ──
console.log('\n=== SHIFTS DETAIL ===');
await page.goto(BASE + '/shifts');
await page.waitForTimeout(600);
const shiftsText = await page.locator('main').textContent().catch(() => '');
console.log(shiftsText?.slice(0, 600));

// ── Handoff detail ──
console.log('\n=== HANDOFF DETAIL ===');
await page.goto(BASE + '/handoff');
await page.waitForTimeout(600);
const handoffText = await page.locator('main').textContent().catch(() => '');
console.log(handoffText?.slice(0, 600));

await browser.close();
console.log('\nDone.');
