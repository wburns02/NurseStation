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
  ['/ratios', 'RatioMonitor'],
];

log('=== ROUND 23 INVENTORY ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(300);
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NONE');
  const btns = await page.locator('button').count();
  const inputs = await page.locator('input, select, textarea').count();
  log(`${name.padEnd(14)} h1:"${h1?.trim()?.slice(0,28).padEnd(28)}" btns:${String(btns).padStart(3)} inputs:${inputs}`);
}

log('\n=== GAP ANALYSIS ===');
const gaps = [
  { name: 'SBAR / shift handoff documentation',    kw: ['sbar', 'shift handoff', 'handoff note', 'end of shift note', 'shift summary', 'nursing note', 'i-pass', 'ipass'] },
  { name: 'Paycheck / pay stub access',              kw: ['pay stub', 'paycheck', 'earnings statement', 'direct deposit', 'w-2', 'paystub', 'pay history'] },
  { name: 'Equipment / supply request',              kw: ['equipment request', 'supply order', 'requisition form', 'supply request', 'par level', 'inventory request'] },
  { name: 'Self-service schedule / availability',   kw: ['my schedule', 'my availability', 'request shift', 'self schedule', 'nurse portal', 'my shifts'] },
  { name: 'Payroll export / pay period close',      kw: ['payroll export', 'pay period close', 'adp export', 'kronos', 'paychex', 'pay run', 'payroll batch'] },
  { name: 'Float pool / agency request workflow',   kw: ['float pool request', 'agency fill request', 'float request form', 'contractor request'] },
  { name: 'Applicant tracking / open requisitions', kw: ['open requisition', 'applicant tracking', 'job posting', 'candidate pipeline', 'interview', 'offer letter', 'hiring pipeline'] },
  { name: 'Bed management / census dashboard',      kw: ['bed management', 'census board', 'bed board', 'patient placement', 'bed coordinator', 'census management'] },
  { name: 'GPS / geofence time clock',              kw: ['gps clock', 'geofence', 'time clock', 'punch in', 'clock in/out', 'biometric punch', 'mobile clock'] },
  { name: 'HIPAA secure messaging / broadcast',    kw: ['hipaa message', 'broadcast message', 'group announcement', 'unit broadcast', 'secure channel'] },
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
log('\nSTILL NOT FOUND (prime candidates):');
for (const g of gaps) {
  if (!found.has(g.name)) log(`  ✗ ${g.name}`);
}

log('\n=== DEEP DIVE: Shift Handoff / SBAR Analysis ===');
log('WHY SBAR WINS AS KILLER FEATURE:');
log('  • Every bedside nurse does this EVERY shift (3x/day, 3-6 nurses per unit)');
log('  • Currently: paper/whiteboard/verbal (15-45 min of phone tag)');
log('  • Joint Commission REQUIRES documented clinical handoff');
log('  • Missed handoffs cause adverse events → liability → news stories');
log('  • Creates daily habit loop for ALL nurses (not just managers)');
log('  • Network effect: outgoing nurse documents → incoming nurse reads → everyone uses it');
log('  • No competitor has this natively in their scheduling platform');
log('');
log('SBAR = Situation Background Assessment Recommendation');
log('I-PASS = Illness severity, Patient summary, Action list, Situation awareness, Synthesis');
log('');
log('WHAT THE FEATURE LOOKS LIKE:');
log('  Route: /handoff');
log('  View 1: My patients today (pulled from charge board / census)');
log('  View 2: Handoff form per patient (SBAR template, vitals trend summary)');
log('  View 3: Incoming nurse acknowledges each patient');
log('  View 4: Shift-level summary + compliance report');
log('');
log('MAGIC MOMENTS:');
log('  1. Auto-populates patient data from census (saves 10 min of typing)');
log('  2. Flags incomplete handoffs before shift change');
log('  3. Receiving nurse signs off — creates audit trail');
log('  4. AI summary of "watch items" for incoming nurse');

log('\n=== DEEP DIVE: Which pages do nurses (not managers) actually use? ===');
await page.goto(BASE + '/shifts');
await page.waitForTimeout(400);
const shiftsText = await page.locator('body').innerText().catch(() => '');
log('\nShifts page excerpt:');
log(shiftsText.slice(0, 500));

await page.goto(BASE + '/messages');
await page.waitForTimeout(400);
const msgsText = await page.locator('body').innerText().catch(() => '');
log('\nMessages page excerpt:');
log(msgsText.slice(0, 400));

log('\n=== ACTIONABILITY SCAN ===');
for (const [r, name] of routes) {
  await page.goto(BASE + r);
  await page.waitForTimeout(200);
  const modals = await page.locator('[id$="-modal"]').count();
  const forms = await page.locator('form').count();
  const textInputs = await page.locator('input[type="text"],textarea').count();
  const total = modals + forms + textInputs;
  if (total > 0) log(`  ${name.padEnd(14)}: ${modals}modals ${forms}forms ${textInputs}textInputs`);
}

log('\n=== VERDICT ===');
log('BUILD: SBAR Shift Handoff Documentation System at /handoff');
log('WHY: Only feature used by EVERY SINGLE NURSE every SINGLE SHIFT');
log('     Creates the daily habit loop that makes this platform indispensable');
log('     JCAHO compliance driver = admin mandate = budget approved');

await browser.close();
log('\n=== RESEARCH COMPLETE ===');
