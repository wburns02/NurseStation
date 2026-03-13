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
  ['/incidents', 'Incidents'],
  ['/recognition', 'Recognition'],
];

log('=== ROUND 22 FULL INVENTORY ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(350);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${name.padEnd(14)} h1:"${h1?.trim()?.slice(0,28).padEnd(28)}" btns:${String(btns).padStart(3)} inputs:${inputs}`);
}

log('\n=== GAP ANALYSIS — Critical missing workflows ===');
const gaps = [
  { name: 'GPS/geofence clock-in & time tracking', kw: ['clock in', 'time clock', 'punch in', 'geofence', 'gps location', 'clock-in', 'biometric', 'attendance'] },
  { name: 'Applicant tracking / hiring pipeline', kw: ['applicant', 'job requisition', 'candidate', 'interview scheduled', 'offer letter', 'hiring', 'job posting'] },
  { name: 'Equipment / supply request workflow', kw: ['equipment request', 'supply order', 'inventory request', 'requisition form', 'supply request'] },
  { name: 'Payroll export / pay period close', kw: ['payroll export', 'pay period', 'adp', 'kronos', 'paychex', 'payroll approve', 'pay run'] },
  { name: 'Shift note / SBAR handoff documentation', kw: ['shift note', 'sbar', 'end of shift', 'handoff note', 'shift summary', 'nursing note'] },
  { name: 'Float pool / agency fill request', kw: ['float pool request', 'float request', 'agency fill', 'contractor fill', 'agency request'] },
  { name: 'Census / patient bed management', kw: ['bed management', 'census board', 'bed board', 'patient placement', 'bed coordinator', 'census'] },
  { name: 'Skills/cross-training competency tracker', kw: ['cross-train', 'float competency', 'skills checklist', 'competency assessment', 'cross training'] },
  { name: 'Staff retention / exit interview tracking', kw: ['exit interview', 'turnover reason', 'retention score', 'flight risk', 'stay interview'] },
  { name: 'Scheduling rules / policy compliance engine', kw: ['scheduling rule', 'policy engine', 'fatigue rule', 'rest period', 'compliance rule', 'scheduling policy'] },
  { name: 'Real-time patient-to-nurse ratio alerts', kw: ['patient ratio', 'nurse ratio', 'staffing ratio', 'patient load', 'acuity ratio'] },
  { name: 'Paycheck / pay stub access for nurses', kw: ['pay stub', 'paycheck', 'earnings', 'w-2', 'direct deposit', 'paystub'] },
];

const found = new Set();
for (const [route] of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(200);
  const text = await page.locator('body').innerText().catch(() => '').then(t => t.toLowerCase());
  for (const g of gaps) {
    if (!found.has(g.name) && g.kw.some(k => text.includes(k))) {
      found.add(g.name);
      log(`  ✓ "${g.name}" found at ${route}`);
    }
  }
}
log('\nSTILL NOT FOUND:');
for (const g of gaps) {
  if (!found.has(g.name)) log(`  ✗ ${g.name}`);
}

log('\n=== DEEP DIVE: Shift Board / Coverage / Charge Board ===');
for (const [r, name] of [
  ['/shift-board', 'ShiftBoard'],
  ['/coverage', 'Coverage'],
  ['/charge', 'ChargeBoard'],
  ['/shifts', 'Shifts'],
]) {
  await page.goto(BASE + r);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `pw-screenshots/r22-deep-${name.toLowerCase()}.png` });
  const text = await page.locator('body').innerText().catch(() => '');
  log(`\n${name}:`);
  log(text.slice(0, 600));
}

log('\n=== ACTIONABILITY: Which pages have real forms? ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(250);
  const forms = await page.locator('form').count();
  const textInputs = await page.locator('input[type="text"],input[type="number"],input[type="email"],textarea').count();
  const selects = await page.locator('select').count();
  const total = forms + textInputs + selects;
  if (total > 0) log(`  ${name.padEnd(14)}: ${forms}f ${textInputs}ti ${selects}s`);
}

log('\n=== COMPETITOR KILLER FEATURES NOT YET BUILT ===');
log('ShiftMed:    Real-time shift matching, instant credential verification');
log('NurseGrid:   Nurse-self-service (swap requests, availability, schedule view)');
log('Connecteam:  GPS time clock, task checklists, compliance training tracking');
log('QGenda:      Fatigue rules engine, auto-schedule with policy compliance');
log('Staffingly:  AI demand forecasting, float pool automation');
log('');
log('NOT YET IN NURSESTATION:');
log('  → No GPS/time clock (Connecteam killer feature)');
log('  → No SBAR handoff documentation (shift-to-shift continuity)');
log('  → No patient:nurse ratio real-time alerting');
log('  → No payroll integration or pay period close workflow');
log('  → No bed management / census board');

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
