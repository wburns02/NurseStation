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
  ['/charge', 'ChargeBoard'],
  ['/onboarding', 'Onboarding'],
  ['/overtime', 'Overtime'],
];

log('=== FULL INVENTORY (Round 20) ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(350);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${name.padEnd(14)} h1:"${h1?.trim()?.slice(0,28).padEnd(28)}" btns:${String(btns).padStart(3)} inputs:${inputs}`);
}

log('\n=== GAP ANALYSIS — Remaining Missing Workflows ===');
const missingWorkflows = [
  { name: 'Peer recognition / kudos / DAISY', keywords: ['kudos', 'recognition', 'daisy', 'shoutout', 'peer award', 'appreciate', 'recognize'] },
  { name: 'Clock-in / GPS time tracking', keywords: ['clock in', 'clock-in', 'time clock', 'punch', 'geofence', 'check in', 'attendance', 'gps'] },
  { name: 'Shift handoff / SBAR note', keywords: ['handoff', 'sbar', 'shift note', 'charge note', 'shift report', 'turnover'] },
  { name: 'Incident / safety event report', keywords: ['incident', 'near miss', 'safety event', 'variance report', 'occurrence'] },
  { name: 'Float pool / agency request flow', keywords: ['float pool', 'agency request', 'float nurse', 'per diem request', 'traveler request'] },
  { name: 'Applicant tracking / hiring pipeline', keywords: ['applicant', 'candidate', 'job posting', 'interview', 'requisition', 'hire pipeline'] },
  { name: 'Equipment / supply request', keywords: ['equipment request', 'supply order', 'requisition', 'inventory request'] },
  { name: 'HR performance review / 90-day eval', keywords: ['performance review', '90-day', 'annual review', 'evaluation', 'appraisal'] },
];

const found = new Set();
for (const [route] of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(200);
  const text = await page.locator('body').innerText().catch(() => '').then(t => t.toLowerCase());
  for (const check of missingWorkflows) {
    if (!found.has(check.name) && check.keywords.some(k => text.includes(k))) {
      found.add(check.name);
      log(`  ✓ "${check.name}" found at ${route}`);
    }
  }
}
log('\nNOT FOUND anywhere:');
for (const check of missingWorkflows) {
  if (!found.has(check.name)) log(`  ✗ ${check.name}`);
}

log('\n=== DEEP DIVE: What pages have interactive forms? ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(300);
  const forms = await page.locator('form').count();
  const textInputs = await page.locator('input[type="text"], input[type="number"], textarea').count();
  const selects = await page.locator('select').count();
  if (forms > 0 || textInputs > 0 || selects > 0) {
    log(`  ${name.padEnd(14)}: ${forms} forms, ${textInputs} text inputs, ${selects} selects`);
  }
}

log('\n=== DEEP DIVE: Dashboard content ===');
await page.goto(BASE + '/');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/r20-01-dashboard.png' });
const dashText = await page.locator('main, #root').first().innerText().catch(() => '');
log(dashText.slice(0, 2000));

log('\n=== DEEP DIVE: Shift Handoff potential ===');
await page.goto(BASE + '/shifts');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/r20-02-shifts.png' });
const shiftsText = await page.locator('main, #root').first().innerText().catch(() => '');
log('Shifts page snippet:');
log(shiftsText.slice(0, 800));

log('\n=== DEEP DIVE: Training page ===');
await page.goto(BASE + '/training');
await page.waitForTimeout(500);
await page.screenshot({ path: 'pw-screenshots/r20-03-training.png' });
const trainingText = await page.locator('main, #root').first().innerText().catch(() => '');
log('Training snippet:');
log(trainingText.slice(0, 600));

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
