import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('pw-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
const BASE = 'http://localhost:5178';
const log = (m) => console.log(m);

const routes = [
  ['/', 'Dashboard'], ['/marketplace', 'Marketplace'], ['/credentials', 'Credentials'],
  ['/shifts', 'Shifts'], ['/staff', 'Staff'], ['/analytics', 'Analytics'],
  ['/labor', 'Labor'], ['/time-off', 'TimeOff'], ['/training', 'Training'],
  ['/coverage', 'Coverage'], ['/wellbeing', 'Wellbeing'], ['/auto-schedule', 'AutoSchedule'],
  ['/shift-board', 'ShiftBoard'], ['/forecast', 'Forecast'], ['/people', 'StaffIntel'],
  ['/charge', 'ChargeBoard'], ['/onboarding', 'Onboarding'], ['/overtime', 'Overtime'],
  ['/incidents', 'Incidents'], ['/recognition', 'Recognition'], ['/ratios', 'RatioMonitor'],
  ['/handoff', 'Handoff'], ['/timeclock', 'TimeClock'], ['/payroll', 'Payroll'],
  ['/hiring', 'Hiring'], ['/availability', 'Availability'], ['/swaps', 'ShiftSwaps'],
];

log('=== ROUND 29 INVENTORY (28 pages) ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(200);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  log(`${name.padEnd(14)} h1:"${h1?.trim()?.slice(0,28).padEnd(28)}" btns:${String(btns).padStart(3)}`);
}

log('\n=== WHAT 28 ROUNDS HAS BUILT ===');
log('SCHEDULING:  Shifts, AutoSchedule, ShiftBoard, Forecast, Coverage, Availability, ShiftSwaps');
log('CLINICAL:    ChargeBoard, Ratios, Handoff, Incidents');
log('WORKFORCE:   Credentials, Training, Onboarding, TimeOff, TimeClock, Payroll, Hiring');
log('ANALYTICS:   Analytics, Labor, StaffIntel, Wellbeing');
log('COMMS:       Messages, Notifications, Recognition, Marketplace');
log('');
log('=== REMAINING GAPS ===');

const gaps = [
  { name: 'Bed management / census dashboard',    kw: ['bed board', 'census', 'bed management', 'patient census', 'bed capacity', 'admit patient', 'discharge'] },
  { name: 'Float pool dispatch',                  kw: ['float pool dispatch', 'float assignment', 'deploy float', 'float pool manager', 'float nurse'] },
  { name: 'Nurse scorecard / 360 feedback',       kw: ['scorecard', '360 feedback', 'peer review', 'nurse evaluation', 'competency score'] },
  { name: 'Budget vs actual dashboard',           kw: ['budget vs actual', 'budget variance', 'ytd spend', 'fiscal year budget', 'annual budget'] },
  { name: 'Certification renewal workflow',       kw: ['renewal workflow', 'cert renewal', 'license renewal', 'ceu requirement', 'renewal reminder'] },
  { name: 'Real-time unit communication/chat',    kw: ['unit chat', 'shift chat', 'unit communication', 'clinical chat', 'team chat'] },
  { name: 'Open shift bidding / self-schedule',   kw: ['bid shift', 'self-schedule', 'shift bid', 'open bid', 'self scheduling'] },
  { name: 'PRN / per diem management',            kw: ['prn', 'per diem', 'casual staff', 'prn pool', 'per-diem'] },
  { name: 'Nurse command center / daily briefing', kw: ['daily briefing', 'morning report', 'command center', 'today briefing', 'daily summary'] },
  { name: 'Real-time patient assignment / acuity', kw: ['patient assignment', 'acuity', 'nurse assignment', 'patient load', 'acuity score'] },
];

const found = new Set();
for (const [route] of routes) {
  await page.goto(BASE + route);
  await page.waitForTimeout(100);
  const text = await page.locator('body').innerText().catch(() => '').then(t => t.toLowerCase());
  for (const g of gaps) {
    if (!found.has(g.name) && g.kw.some(k => text.includes(k))) {
      found.add(g.name);
      log(`  ✓ "${g.name}" found at ${route}`);
    }
  }
}
log('\nSTILL MISSING:');
for (const g of gaps) {
  if (!found.has(g.name)) log(`  ✗ ${g.name}`);
}

log('\n=== DEEP DIVE: Dashboard ===');
await page.goto(BASE + '/');
await page.waitForTimeout(600);
await page.screenshot({ path: 'pw-screenshots/r29-dashboard.png' });
const dashText = await page.locator('body').innerText().catch(() => '');
log(dashText.slice(0, 800));

log('\n=== STRATEGIC VERDICT R29 ===');
log('');
log('PLATFORM COVERAGE: 28 pages. Manager-centric workflows are comprehensive.');
log('');
log('BIGGEST REMAINING GAP: NURSE DAILY COMMAND CENTER');
log('');
log('The app has everything managers need but NURSES need a morning page that answers:');
log('  "What do I need to do RIGHT NOW to get through my shift?"');
log('');
log('DAILY BRIEFING / MORNING HANDOFF INTELLIGENCE:');
log('  • Which patients are mine today? What are their acuity levels?');
log('  • Who is covering my section if I need help?');
log('  • Any credential renewals due that block me from certain patients?');
log('  • Shift notes from the outgoing nurse');
log('  • Real-time alerts: call light density, code team status');
log('');
log('BUT THAT REQUIRES PATIENT DATA WE DO NOT HAVE.');
log('');
log('ALTERNATIVE — THE THING THAT MAKES MANAGERS OPEN THE APP EVERY MORNING:');
log('');
log('#1 VERDICT R29: BUDGET VS ACTUAL LABOR DASHBOARD');
log('');
log('WHY: Every nurse manager is held accountable to a labor budget.');
log('They currently get this information ONCE A WEEK from finance in Excel.');
log('Our platform can show it IN REAL TIME, updated after every shift closes.');
log('');
log('WHAT IT DOES:');
log('  • YTD spend vs budget by unit, with burn rate projection');
log('  • This week: hours worked vs budgeted, OT cost drill-down');
log('  • Cost per patient day (HPPD - Hours Per Patient Day) trend');
log('  • Which unit is over/under, which nurses drove the OT');
log('  • One-click drill-down from "ICU is 8% over budget" to the specific shifts');
log('  • Projected month-end variance with confidence interval');
log('  • Alerts: "At current burn rate you will exceed monthly budget by $12k"');
log('');
log('THIS KILLS EXCEL. Finance teams will BEG IT to deploy this.');
log('Route: /budget');

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
