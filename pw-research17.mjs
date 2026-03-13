import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);

const routes = [
  ['/', 'Dashboard'],
  ['/marketplace', 'Marketplace'],
  ['/credentials', 'Credentials'],
  ['/shifts', 'Shifts'],
  ['/staff', 'Staff'],
  ['/messages', 'Messages'],
  ['/analytics', 'Analytics'],
  ['/labor', 'Labor'],
  ['/time-off', 'TimeOff'],
  ['/training', 'Training'],
  ['/coverage', 'Coverage'],
  ['/wellbeing', 'Wellbeing'],
  ['/auto-schedule', 'AutoSchedule'],
  ['/shift-board', 'ShiftBoard'],
  ['/forecast', 'Forecast'],
  ['/people', 'StaffIntel'],
  ['/notifications', 'Notifications'],
];

log('=== ROUTE INVENTORY ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(400);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${name.padEnd(14)} ${r.padEnd(18)} h1:"${h1?.trim()?.slice(0,30)}" btns:${btns} inputs:${inputs}`);
}

log('\n=== DASHBOARD DEEP DIVE ===');
await page.goto(BASE + '/');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/r17-01-dashboard.png' });
const dashText = await page.locator('main, #root').first().innerText().catch(() => '');
log(dashText.slice(0, 1500));

log('\n=== MESSAGES DEEP DIVE ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/r17-02-messages.png' });
const msgsText = await page.locator('main, #root').first().innerText().catch(() => '');
log(msgsText.slice(0, 1200));
const msgBtns = await page.locator('button').allTextContents();
log('Msg buttons: ' + msgBtns.slice(0, 10).join(' | '));

log('\n=== SHIFTS DEEP DIVE ===');
await page.goto(BASE + '/shifts');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/r17-03-shifts.png' });
const shiftsText = await page.locator('main, #root').first().innerText().catch(() => '');
log(shiftsText.slice(0, 1200));

log('\n=== ANALYTICS DEEP DIVE ===');
await page.goto(BASE + '/analytics');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/r17-04-analytics.png' });
const analyticsText = await page.locator('main, #root').first().innerText().catch(() => '');
log(analyticsText.slice(0, 1000));
const analyticsBtns = await page.locator('button').allTextContents();
log('Analytics btns: ' + analyticsBtns.join(' | ').slice(0, 300));

log('\n=== STAFF PROFILE DEEP DIVE ===');
await page.goto(BASE + '/staff');
await page.waitForTimeout(500);
// Try clicking first staff member
const firstStaffCard = page.locator('[href*="/staff/"], [data-id*="staff"], tr, [role="row"]').first();
log(`Staff cards/rows: ${await page.locator('tr, [data-id*="staff-row"]').count()}`);

log('\n=== FEATURE GAP ANALYSIS ===');
const featureChecks = [
  { name: 'Real-time chat / in-app DM', keywords: ['real-time', 'live chat', 'typing', 'online', 'presence', 'read receipt'] },
  { name: 'Incident reporting', keywords: ['incident', 'report', 'safety event', 'near miss', 'SBAR'] },
  { name: 'Patient census integration', keywords: ['census', 'patient count', 'occupancy', 'admissions'] },
  { name: 'Shift handoff notes', keywords: ['handoff', 'hand-off', 'shift notes', 'SBAR', 'handover'] },
  { name: 'Document management', keywords: ['document', 'upload', 'attachment', 'file', 'policy'] },
  { name: 'Skill / competency matrix', keywords: ['skill', 'competency', 'certification matrix', 'float pool'] },
  { name: 'Clock in / clock out', keywords: ['clock in', 'clock-in', 'time clock', 'punch', 'check in'] },
  { name: 'Payroll export', keywords: ['payroll', 'export', 'kronos', 'adp', 'workday', 'ceridian'] },
  { name: 'Unit charge nurse view', keywords: ['charge nurse', 'unit view', 'my unit', 'charge board'] },
  { name: 'Patient assignment', keywords: ['patient assignment', 'assignment board', 'nurse:patient ratio'] },
  { name: 'Acuity scoring', keywords: ['acuity', 'patient acuity', 'acuity score', 'HPPD'] },
  { name: 'HIPAA-compliant messaging', keywords: ['hipaa', 'encrypted', 'secure message', 'phi'] },
  { name: 'Float pool rostering', keywords: ['float pool', 'float roster', 'float assignment'] },
  { name: 'Onboarding workflow', keywords: ['onboard', 'new hire', 'orientation', 'intake'] },
  { name: 'Per diem / agency integration', keywords: ['per diem', 'agency', 'traveler', 'contract RN'] },
];

const found = new Set();
for (const [route] of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(300);
  const text = await page.locator('body').innerText().catch(() => '').then(t => t.toLowerCase());
  for (const check of featureChecks) {
    if (!found.has(check.name) && check.keywords.some(k => text.includes(k))) {
      found.add(check.name);
      log(`  ✓ "${check.name}" found at ${route}`);
    }
  }
}
log('\n=== MISSING (not found anywhere) ===');
for (const check of featureChecks) {
  if (!found.has(check.name)) log(`  ✗ "${check.name}"`);
}

log('\n=== DASHBOARD WORKFLOW GAPS ===');
await page.goto(BASE + '/');
await page.waitForTimeout(600);
// What actions can you take from dashboard?
const dashBtns = await page.locator('button').allTextContents();
log('Dashboard buttons: ' + dashBtns.join(' | ').slice(0, 500));
// Are there any forms?
const dashInputs = await page.locator('input, textarea').count();
log(`Dashboard inputs: ${dashInputs}`);

log('\n=== MESSAGES INTERACTION TEST ===');
await page.goto(BASE + '/messages');
await page.waitForTimeout(600);
// Is there a compose button? New message?
const composeBtn = page.locator('button', { hasText: /compose|new|write/i }).first();
log(`Compose/new button: ${await composeBtn.count() > 0 ? 'found' : 'not found'}`);
// Is there a thread list?
const threads = await page.locator('[class*="thread"], [class*="conversation"], [class*="chat"]').count();
log(`Thread/conversation elements: ${threads}`);
// Can you see individual messages?
const messageItems = await page.locator('[class*="message"], [data-id*="message"]').count();
log(`Message items: ${messageItems}`);

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
