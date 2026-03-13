// autoScheduleData.ts — Smart Auto-Scheduler for week of Mar 16–22, 2026

export type ShiftType = 'day' | 'evening' | 'night'
export type CellStatus = 'full' | 'short' | 'critical' | 'no-charge'
export type ConflictSeverity = 'critical' | 'warning'
export type PublishState = 'idle' | 'publishing' | 'done'

export interface AutoStaff {
  id: string
  name: string
  initials: string
  role: string
  isCharge: boolean
  isFloat: boolean
}

export interface ScheduleCell {
  unitId: string
  dayIdx: number   // 0=Sun … 6=Sat
  shift: ShiftType
  required: number
  assigned: number
  status: CellStatus
  staff: AutoStaff[]
}

export interface AutoUnit {
  id: string
  name: string
  shortName: string
  accent: string   // tailwind bg color for header
  required: Record<ShiftType, number>
}

export interface ScheduleConflict {
  id: string
  severity: ConflictSeverity
  unitId: string
  unitName: string
  dayIdx: number
  shift: ShiftType
  description: string
  impact: string
  autoFix: string
  fixDetail: string
}

export interface ScheduleStats {
  totalCells: number
  fullyCovered: number
  shortStaffed: number
  criticalGaps: number
  estimatedCost: number
  staffHours: number
  conflictCount: number
}

// ─── Week ───────────────────────────────────────────────────────────────────

export const WEEK_DAYS = ['Sun 3/16', 'Mon 3/17', 'Tue 3/18', 'Wed 3/19', 'Thu 3/20', 'Fri 3/21', 'Sat 3/22']
export const WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEK_LABEL = 'Mar 16–22, 2026'

// ─── Units ──────────────────────────────────────────────────────────────────

export const AUTO_UNITS: AutoUnit[] = [
  { id: 'icu',      name: 'ICU',               shortName: 'ICU',     accent: 'bg-violet-600', required: { day: 4, evening: 4, night: 3 } },
  { id: 'medsurga', name: 'Med-Surg A',         shortName: 'MS-A',    accent: 'bg-blue-600',   required: { day: 5, evening: 4, night: 4 } },
  { id: 'medsurgb', name: 'Med-Surg B',         shortName: 'MS-B',    accent: 'bg-cyan-600',   required: { day: 5, evening: 4, night: 4 } },
  { id: 'picu',     name: 'PICU',               shortName: 'PICU',    accent: 'bg-emerald-600',required: { day: 3, evening: 3, night: 2 } },
  { id: 'ed',       name: 'Emergency Dept',     shortName: 'ED',      accent: 'bg-red-600',    required: { day: 6, evening: 5, night: 5 } },
]

// ─── Staff pool helpers ──────────────────────────────────────────────────────

function s(id: string, name: string, role: string, isCharge = false, isFloat = false): AutoStaff {
  const parts = name.split(' ')
  const initials = parts.map(p => p[0]).join('')
  return { id, name, initials, role, isCharge, isFloat }
}

// ─── Schedule grid (5 units × 7 days × 3 shifts = 105 cells) ────────────────

function full(unitId: string, day: number, shift: ShiftType, required: number, staff: AutoStaff[]): ScheduleCell {
  return { unitId, dayIdx: day, shift, required, assigned: staff.length, status: 'full', staff }
}
function short(unitId: string, day: number, shift: ShiftType, required: number, staff: AutoStaff[]): ScheduleCell {
  return { unitId, dayIdx: day, shift, required, assigned: staff.length, status: 'short', staff }
}
function critical(unitId: string, day: number, shift: ShiftType, required: number, staff: AutoStaff[]): ScheduleCell {
  return { unitId, dayIdx: day, shift, required, assigned: staff.length, status: 'critical', staff }
}
function noCharge(unitId: string, day: number, shift: ShiftType, required: number, staff: AutoStaff[]): ScheduleCell {
  return { unitId, dayIdx: day, shift, required, assigned: staff.length, status: 'no-charge', staff }
}

// ICU staff
const icuCharge = s('e001', 'Priya Sharma', 'Charge RN', true)
const icuRN1    = s('e002', 'James Okafor', 'RN')
const icuRN2    = s('e003', 'Sarah Chen', 'RN')
const icuRN3    = s('e004', 'Nathan Foster', 'RN')
const icuRN4    = s('e005', 'Dana Willis', 'RN')
const icuEveCharge = s('e006', 'Marcus Williams', 'Charge RN', true)
const icuEveRN1 = s('e007', 'Rachel Torres', 'RN')
const icuEveRN2 = s('e008', 'Kevin Park', 'RN')
const icuNightCharge = s('e009', 'Carmen Lopez', 'Charge RN', true)
const icuNightRN1 = s('e010', 'Brenda Kim', 'RN')

// Med-Surg A staff
const msaCharge  = s('e011', 'Tyler Barnes', 'Charge RN', true)
const msaRN1     = s('e012', 'Lisa Greenwald', 'RN')
const msaRN2     = s('e013', 'Mike Torres', 'RN')
const msaRN3     = s('e014', 'Janet Wu', 'RN')
const msaLPN1    = s('e015', 'Sandra Bell', 'LPN')
const msaEveCharge = s('e016', 'Christine Park', 'Charge RN', true)
const msaEveRN1  = s('e017', 'Oscar Reyes', 'RN')
const msaEveRN2  = s('e018', 'Tina Adams', 'RN')
const msaNightCharge = s('e019', 'Greg Hall', 'Charge RN', true)
const msaNightRN1 = s('e020', 'Fiona James', 'RN')
const msaNightRN2 = s('e021', 'Bo Li', 'RN')

// Med-Surg B staff
const msbCharge  = s('e022', 'Vince Morgan', 'Charge RN', true)
const msbRN1     = s('e023', 'April Lane', 'RN')
const msbRN2     = s('e024', 'Derek Snow', 'RN')
const msbRN3     = s('e025', 'Chloe Mann', 'RN')
const msbLPN1    = s('e026', 'Roy Grant', 'LPN')
const msbEveCharge = s('e027', 'Donna Fox', 'Charge RN', true)
const msbEveRN1  = s('e028', 'Leo Nash', 'RN')
const msbEveRN2  = s('e029', 'Nina Patel', 'RN')
const msbNightCharge = s('e030', 'Carl Rice', 'Charge RN', true)
const msbNightRN1 = s('e031', 'Ava Scott', 'RN')
const msbNightRN2 = s('e032', 'Walt King', 'RN')

// PICU staff
const picuCharge = s('e033', 'Gina Flores', 'Charge RN', true)
const picuRN1    = s('e034', 'Sam Reed', 'RN')
const picuEveCharge = s('e035', 'Hal Cross', 'Charge RN', true)
const picuEveRN1 = s('e036', 'Meg Hunt', 'RN')
const picuNightRN1 = s('e037', 'Owen Gray', 'RN')

// ED staff
const edCharge   = s('e038', 'Rosa Diaz', 'Charge RN', true)
const edRN1      = s('e039', 'Neil Stone', 'RN')
const edRN2      = s('e040', 'Amy Cole', 'RN')
const edRN3      = s('e041', 'Paul Kent', 'RN')
const edRN4      = s('e042', 'Iris Webb', 'RN')
const edEveCharge = s('e043', 'Ray Burns', 'Charge RN', true)
const edEveRN1   = s('e044', 'Deb Hart', 'RN')
const edEveRN2   = s('e045', 'Al Quinn', 'RN')
const edEveRN3   = s('e046', 'Zoe Page', 'RN')
const edNightCharge = s('e047', 'Mia Lord', 'Charge RN', true)
const edNightRN1 = s('e048', 'Jake Moss', 'RN')
const edNightRN2 = s('e049', 'Lena Best', 'RN')
const edNightRN3 = s('e050', 'Troy Lane', 'RN')
const floatRN    = s('f001', 'Float Pool RN', 'RN', false, true)

// ─── Build all 105 cells ─────────────────────────────────────────────────────

function icuDayCrew(): AutoStaff[] { return [icuCharge, icuRN1, icuRN2, icuRN3] }
function icuEveCrew(): AutoStaff[] { return [icuEveCharge, icuEveRN1, icuEveRN2, icuRN4] }

function msaDayCrew(): AutoStaff[] { return [msaCharge, msaRN1, msaRN2, msaRN3, msaLPN1] }
function msaEveCrew(): AutoStaff[] { return [msaEveCharge, msaEveRN1, msaEveRN2, msaNightRN1] }

function msbDayCrew(): AutoStaff[] { return [msbCharge, msbRN1, msbRN2, msbRN3, msbLPN1] }
function msbEveCrew(short = false): AutoStaff[] {
  const base = [msbEveCharge, msbEveRN1, msbEveRN2]
  return short ? base : [...base, msbNightRN1]
}
function msbNightCrew(): AutoStaff[] { return [msbNightCharge, msbNightRN1, msbNightRN2] }

function picuDayCrew(): AutoStaff[] { return [picuCharge, picuRN1, picuEveRN1] }

function edDayCrew(): AutoStaff[] { return [edCharge, edRN1, edRN2, edRN3, edRN4, edEveRN3] }
function edEveCrew(): AutoStaff[] { return [edEveCharge, edEveRN1, edEveRN2, edEveRN3, edNightRN3] }
function edNightCrew(short = false): AutoStaff[] {
  const base = [edNightCharge, edNightRN1, edNightRN2]
  return short ? base : [...base, edNightRN3]
}

// Build the full schedule
const rawCells: ScheduleCell[] = []

for (let d = 0; d < 7; d++) {
  // ICU
  rawCells.push(full('icu', d, 'day', 4, icuDayCrew()))
  rawCells.push(full('icu', d, 'evening', 4, icuEveCrew()))
  // ICU Night Thu (d=4): Marcus called out — only 2 of 3
  if (d === 4) {
    rawCells.push(critical('icu', d, 'night', 3, [icuNightCharge, icuNightRN1]))
  } else {
    rawCells.push(full('icu', d, 'night', 3, [icuNightCharge, icuNightRN1, icuRN4]))
  }

  // Med-Surg A
  rawCells.push(full('medsurga', d, 'day', 5, msaDayCrew()))
  rawCells.push(full('medsurga', d, 'evening', 4, msaEveCrew()))
  rawCells.push(full('medsurga', d, 'night', 4, [msaNightCharge, msaNightRN1, msaNightRN2, icuNightRN1]))

  // Med-Surg B — Lisa PTO Fri evening
  rawCells.push(full('medsurgb', d, 'day', 5, msbDayCrew()))
  if (d === 5) {
    // Friday evening: Lisa PTO approval → 3 of 4
    rawCells.push(short('medsurgb', d, 'evening', 4, msbEveCrew(true)))
  } else {
    rawCells.push(full('medsurgb', d, 'evening', 4, msbEveCrew()))
  }
  rawCells.push(full('medsurgb', d, 'night', 4, msbNightCrew().concat([icuRN4])))

  // PICU — Sat day: no charge nurse
  if (d === 6) {
    // Saturday day: charge nurse Gina has weekend off — no charge assigned
    rawCells.push(noCharge('picu', d, 'day', 3, [picuRN1, picuEveRN1, picuNightRN1]))
  } else {
    rawCells.push(full('picu', d, 'day', 3, picuDayCrew()))
  }
  rawCells.push(full('picu', d, 'evening', 3, [picuEveCharge, picuEveRN1, picuCharge]))
  // PICU Night: only 1 assigned for most days — show short
  rawCells.push(short('picu', d, 'night', 2, [picuNightRN1]))

  // ED — Sat night: flex pool limit
  rawCells.push(full('ed', d, 'day', 6, edDayCrew()))
  rawCells.push(full('ed', d, 'evening', 5, edEveCrew()))
  if (d === 6) {
    // Saturday night: flex pool capped — 3 of 4 required
    rawCells.push(short('ed', d, 'night', 5, edNightCrew(true)))
  } else {
    rawCells.push(full('ed', d, 'night', 5, edNightCrew()))
  }
}

// Fix: PICU night is short 1 all week — this is expected data
// We'll mark only Sat night as the "conflict" to highlight

export const SCHEDULE_CELLS: ScheduleCell[] = rawCells

// Helper to look up a cell
export function getCell(unitId: string, dayIdx: number, shift: ShiftType): ScheduleCell | undefined {
  return SCHEDULE_CELLS.find(c => c.unitId === unitId && c.dayIdx === dayIdx && c.shift === shift)
}

// ─── Conflicts ───────────────────────────────────────────────────────────────

const _resolvedConflicts = new Set<string>()

const BASE_CONFLICTS: ScheduleConflict[] = [
  {
    id: 'c001',
    severity: 'critical',
    unitId: 'icu',
    unitName: 'ICU',
    dayIdx: 4,
    shift: 'night',
    description: 'ICU Night Thu 3/20 is 1 nurse short (2/3 required)',
    impact: 'Fatigue risk for remaining staff; patient safety concern for acuity level',
    autoFix: 'Pull float pool RN with ICU experience (Jaylen Brooks)',
    fixDetail: 'Jaylen is available, current float pool RN, ICU-certified — adds +$285 OT premium',
  },
  {
    id: 'c002',
    severity: 'warning',
    unitId: 'medsurgb',
    unitName: 'Med-Surg B',
    dayIdx: 5,
    shift: 'evening',
    description: 'Med-Surg B Evening Fri 3/21 is 1 nurse short (3/4 required)',
    impact: 'Lisa Greenwald PTO approval increases patient-to-nurse ratio to 6:1',
    autoFix: 'Offer voluntary overtime to Marcus Williams (MS-B trained)',
    fixDetail: 'Marcus is off Fri but has expressed willingness for OT — +$320 OT premium',
  },
  {
    id: 'c003',
    severity: 'warning',
    unitId: 'picu',
    unitName: 'PICU',
    dayIdx: 6,
    shift: 'day',
    description: 'PICU Saturday Day has no Charge RN assigned',
    impact: 'Compliance gap — PICU policy requires a Charge RN at all times',
    autoFix: 'Designate Sam Reed as acting Charge (completed Charge RN training last month)',
    fixDetail: 'Sam passed Charge Readiness Assessment on 2/14 — designation takes 2 mins',
  },
  {
    id: 'c004',
    severity: 'critical',
    unitId: 'ed',
    unitName: 'Emergency Dept',
    dayIdx: 6,
    shift: 'night',
    description: 'ED Night Sat 3/22 is 2 nurses short (3/5 required)',
    impact: 'ED night census historically peaks Saturday; diversion risk',
    autoFix: 'Split between float pool (1) + agency traveler pre-approved for this period',
    fixDetail: 'Agency traveler Kayla Hughes on standby; float RN available — total add. cost $780',
  },
]

export function getConflicts(): ScheduleConflict[] {
  return BASE_CONFLICTS.filter(c => !_resolvedConflicts.has(c.id))
}

export function resolveConflict(id: string): void {
  _resolvedConflicts.add(id)
  // Update corresponding cell status to 'full'
  const conflict = BASE_CONFLICTS.find(c => c.id === id)
  if (conflict) {
    const cell = SCHEDULE_CELLS.find(
      c => c.unitId === conflict.unitId && c.dayIdx === conflict.dayIdx && c.shift === conflict.shift
    )
    if (cell) {
      if (conflict.id === 'c003') {
        cell.status = 'full'
        cell.staff.find(st => st.id === 'e034') && (SCHEDULE_CELLS.find(c => c === cell)!.staff[0].isCharge = true)
      } else {
        cell.assigned = cell.required
        cell.status = 'full'
        cell.staff.push({ ...floatRN, name: id === 'c001' ? 'Jaylen Brooks' : id === 'c002' ? 'Marcus Williams' : id === 'c004' ? 'Kayla Hughes' : 'Float RN' })
      }
    }
  }
}

// ─── Schedule stats ───────────────────────────────────────────────────────────

export function getScheduleStats(): ScheduleStats {
  const cells = SCHEDULE_CELLS
  const fullyCovered = cells.filter(c => c.status === 'full').length
  const shortStaffed = cells.filter(c => c.status === 'short' || c.status === 'no-charge').length
  const criticalGaps = cells.filter(c => c.status === 'critical').length
  return {
    totalCells: cells.length,
    fullyCovered,
    shortStaffed,
    criticalGaps,
    conflictCount: getConflicts().length,
    staffHours: 2_520,
    estimatedCost: 84_250,
  }
}

// ─── Publish state ────────────────────────────────────────────────────────────

let _published = false
export function isPublished(): boolean { return _published }
export function publishSchedule(): void { _published = false /* reset on route change */ }
export function setPublished(v: boolean): void { _published = v }
