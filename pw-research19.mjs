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
];

log('=== FULL INVENTORY ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(350);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${name.padEnd(14)} h1:"${h1?.trim()?.slice(0,28).padEnd(28)}" btns:${String(btns).padStart(3)} inputs:${inputs}`);
}

log('\n=== GAP ANALYSIS — Missing Workflows ===');
const missingWorkflows = [
  { name: 'Peer recognition / kudos / DAISY', keywords: ['kudos', 'recognition', 'daisy', 'shoutout', 'peer award', 'appreciate'] },
  { name: 'Incident / safety event report', keywords: ['incident', 'near miss', 'safety event', 'medication error', 'fall report', 'variance'] },
  { name: 'Float pool / agency request', keywords: ['float pool', 'per diem', 'agency request', 'float nurse', 'contractor fill'] },
  { name: 'Clock-in / time tracking', keywords: ['clock in', 'clock-in', 'time clock', 'punch', 'check in', 'geofence', 'attendance'] },
  { name: 'Shift handoff / clinical note', keywords: ['handoff', 'shift note', 'shift log', 'supervisor note', 'charge note', 'sbar'] },
  { name: 'Overtime approval', keywords: ['overtime approval', 'ot approval', 'authorize overtime', 'ot request'] },
  { name: 'Patient ratio tracking', keywords: ['ratio', 'nurse:patient', 'hppd', 'nurse to patient'] },
  { name: 'Policy / document library', keywords: ['policy', 'procedure', 'handbook', 'document library', 'protocol'] },
  { name: 'Applicant tracking / hiring', keywords: ['applicant', 'candidate', 'job posting', 'interview', 'hire pipeline'] },
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

log('\n=== ACTIONABILITY AUDIT ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(300);
  const btns = await page.locator('button').count();
  const forms = await page.locator('form').count();
  const inputs = await page.locator('input[type="text"], input[type="number"], textarea').count();
  log(`  ${name.padEnd(14)}: ${btns} buttons, ${forms} forms, ${inputs} text inputs`);
}

log('\n=== DAILY HABIT CHECK ===');
log('What does a charge nurse check every morning?');
await page.goto(BASE + '/');
await page.waitForTimeout(700);
await page.screenshot({ path: 'pw-screenshots/r19-01-dashboard.png' });
const dashText = await page.locator('main, #root').first().innerText().catch(() => '');
log('Dashboard content sample:');
log(dashText.slice(0, 1500));

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
