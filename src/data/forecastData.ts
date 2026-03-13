// forecastData.ts — 7-Day Demand Forecast & Predictive Staffing Engine
// Today: Thu Mar 12, 2026 → forecasting Fri Mar 13 – Thu Mar 19

export type UnitId = 'icu' | 'ccu' | 'ed' | 'medsurga' | 'medsurgb' | 'oncology' | 'telemetry'
export type CellStatus = 'critical' | 'tight' | 'ok' | 'surplus'
export type ActionType = 'post-board' | 'request-float' | 'pre-alert' | 'pre-ot' | 'agency'
export type ActionState = 'idle' | 'sent'

export interface ForecastDay {
  dayIdx: number
  label: string   // "Fri Mar 13"
  short: string   // "Fri"
  date: string    // "3/13"
  isWeekend: boolean
}

export interface ForecastUnit {
  id: UnitId
  name: string
  short: string
  accent: string    // tailwind bg class
  capacity: number  // beds
}

export interface DayCellData {
  censusPercent: number
  requiredStaff: number
  scheduledStaff: number
  gap: number             // negative = short, 0 = ok, positive = surplus
  status: CellStatus
  confidence: number      // 0–100 %
  drivers: string[]
}

export interface ShortfallDetail {
  id: string              // e.g. "ed-1"
  unitId: UnitId
  unitName: string
  dayIdx: number
  dayLabel: string
  censusPct: number
  requiredStaff: number
  scheduledStaff: number
  gap: number
  status: CellStatus
  confidence: number
  drivers: string[]
  actions: ProactiveAction[]
  costIfReactive: number
  costIfProactive: number
  // 8-week historical census for mini trend chart
  historicalCensus: number[]
  forecastCensus: number[]    // next 7 days
}

export interface ProactiveAction {
  id: string
  type: ActionType
  label: string
  detail: string
  saving: number   // $ saved vs reactive
  priority: 'urgent' | 'high' | 'medium'
}

// ─── Days ────────────────────────────────────────────────────────────────────

export const FORECAST_DAYS: ForecastDay[] = [
  { dayIdx: 0, label: 'Fri Mar 13', short: 'Fri', date: '3/13', isWeekend: false },
  { dayIdx: 1, label: 'Sat Mar 14', short: 'Sat', date: '3/14', isWeekend: true  },
  { dayIdx: 2, label: 'Sun Mar 15', short: 'Sun', date: '3/15', isWeekend: true  },
  { dayIdx: 3, label: 'Mon Mar 16', short: 'Mon', date: '3/16', isWeekend: false },
  { dayIdx: 4, label: 'Tue Mar 17', short: 'Tue', date: '3/17', isWeekend: false },
  { dayIdx: 5, label: 'Wed Mar 18', short: 'Wed', date: '3/18', isWeekend: false },
  { dayIdx: 6, label: 'Thu Mar 19', short: 'Thu', date: '3/19', isWeekend: false },
]

// ─── Units ───────────────────────────────────────────────────────────────────

export const FORECAST_UNITS: ForecastUnit[] = [
  { id: 'icu',       name: 'ICU',            short: 'ICU',  accent: 'bg-violet-600', capacity: 10 },
  { id: 'ccu',       name: 'CCU',            short: 'CCU',  accent: 'bg-indigo-600', capacity: 8  },
  { id: 'ed',        name: 'Emergency Dept', short: 'ED',   accent: 'bg-red-600',    capacity: 30 },
  { id: 'medsurga',  name: 'Med-Surg A',     short: 'MS-A', accent: 'bg-blue-600',   capacity: 28 },
  { id: 'medsurgb',  name: 'Med-Surg B',     short: 'MS-B', accent: 'bg-cyan-600',   capacity: 28 },
  { id: 'oncology',  name: 'Oncology',       short: 'ONC',  accent: 'bg-teal-600',   capacity: 20 },
  { id: 'telemetry', name: 'Telemetry',      short: 'TEL',  accent: 'bg-sky-600',    capacity: 18 },
]

// ─── Forecast matrix: UNIT_IDX × DAY_IDX ─────────────────────────────────────
// Rows: icu(0) ccu(1) ed(2) medsurga(3) medsurgb(4) oncology(5) telemetry(6)

const MATRIX: DayCellData[][] = [
  // ICU
  [
    { censusPercent: 80, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 91, drivers: ['Regular Friday admits'] },
    { censusPercent: 75, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 88, drivers: ['Weekend stabilization'] },
    { censusPercent: 72, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 87, drivers: ['Sunday typically quieter'] },
    { censusPercent: 86, requiredStaff: 5, scheduledStaff: 4, gap: -1, status: 'tight',    confidence: 84, drivers: ['Post-weekend trauma', 'Monday elective procedures'] },
    { censusPercent: 83, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 82, drivers: ['Stable mid-week'] },
    { censusPercent: 79, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 85, drivers: ['Discharge surge expected'] },
    { censusPercent: 77, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 88, drivers: ['Pre-weekend discharges'] },
  ],
  // CCU
  [
    { censusPercent: 75, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 90, drivers: ['Stable census'] },
    { censusPercent: 71, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 89, drivers: ['Weekend discharge patterns'] },
    { censusPercent: 68, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 88, drivers: ['Sunday low activity'] },
    { censusPercent: 82, requiredStaff: 4, scheduledStaff: 3, gap: -1, status: 'tight',    confidence: 83, drivers: ['Post-weekend cardiac admits', 'Elective cath procedures Mon'] },
    { censusPercent: 78, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 85, drivers: ['Steady census'] },
    { censusPercent: 74, requiredStaff: 3, scheduledStaff: 4, gap:  1, status: 'surplus',  confidence: 86, drivers: ['Below-average mid-week admits'] },
    { censusPercent: 71, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 88, drivers: ['Pre-weekend lull'] },
  ],
  // ED
  [
    { censusPercent: 68, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 87, drivers: ['Average Friday volume'] },
    { censusPercent: 92, requiredStaff: 7, scheduledStaff: 5, gap: -2, status: 'critical', confidence: 89, drivers: ['Saturday night surge (+41% historical avg)', 'March cold/flu season', 'Local sporting event'] },
    { censusPercent: 85, requiredStaff: 6, scheduledStaff: 5, gap: -1, status: 'tight',    confidence: 86, drivers: ['Sunday afternoon peak', 'Sports-related injuries expected'] },
    { censusPercent: 72, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 84, drivers: ['Monday regular volume'] },
    { censusPercent: 69, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 85, drivers: ['Below-average Tuesday'] },
    { censusPercent: 74, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 83, drivers: ['Mid-week average'] },
    { censusPercent: 71, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 86, drivers: ['Pre-weekend increase starting'] },
  ],
  // Med-Surg A
  [
    { censusPercent: 79, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 88, drivers: ['Typical Friday census'] },
    { censusPercent: 74, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 87, drivers: ['Weekend discharge patterns'] },
    { censusPercent: 71, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 86, drivers: ['Weekend lull'] },
    { censusPercent: 83, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 84, drivers: ['Post-weekend admits'] },
    { censusPercent: 86, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 82, drivers: ['Elective procedure admits Tue'] },
    { censusPercent: 82, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 84, drivers: ['Mid-week peak'] },
    { censusPercent: 78, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 87, drivers: ['Pre-weekend discharges'] },
  ],
  // Med-Surg B
  [
    { censusPercent: 80, requiredStaff: 5, scheduledStaff: 4, gap: -1, status: 'tight',    confidence: 86, drivers: ['Lisa Greenwald PTO (approved)', 'Elevated Friday census'] },
    { censusPercent: 75, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 86, drivers: ['Weekend patterns'] },
    { censusPercent: 71, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 85, drivers: ['Sunday low admit rate'] },
    { censusPercent: 84, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 83, drivers: ['Post-weekend admit spike'] },
    { censusPercent: 81, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 82, drivers: ['Elective procedures flowing in'] },
    { censusPercent: 79, requiredStaff: 5, scheduledStaff: 5, gap:  0, status: 'ok',       confidence: 84, drivers: ['Steady mid-week'] },
    { censusPercent: 76, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 87, drivers: ['Pre-weekend discharges'] },
  ],
  // Oncology
  [
    { censusPercent: 72, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 91, drivers: ['Regular chemo schedule'] },
    { censusPercent: 68, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 92, drivers: ['Weekend: reduced chemo'] },
    { censusPercent: 65, requiredStaff: 3, scheduledStaff: 3, gap:  0, status: 'ok',       confidence: 93, drivers: ['Inpatient monitoring only'] },
    { censusPercent: 74, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 90, drivers: ['New chemo cycle starts Mon'] },
    { censusPercent: 78, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 89, drivers: ['Infusion clinic overflow'] },
    { censusPercent: 82, requiredStaff: 4, scheduledStaff: 3, gap: -1, status: 'tight',    confidence: 88, drivers: ['4 planned infusion procedures', 'Radiation oncology coordination'] },
    { censusPercent: 76, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 90, drivers: ['Return to normal volume'] },
  ],
  // Telemetry
  [
    { censusPercent: 78, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 89, drivers: ['Steady telemetry census'] },
    { censusPercent: 74, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 88, drivers: ['Weekend patterns'] },
    { censusPercent: 70, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 87, drivers: ['Sunday lull'] },
    { censusPercent: 82, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 85, drivers: ['Post-weekend admits'] },
    { censusPercent: 80, requiredStaff: 4, scheduledStaff: 5, gap:  1, status: 'surplus',  confidence: 86, drivers: ['Discharge pending — slight overbook'] },
    { censusPercent: 77, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 87, drivers: ['Normal mid-week'] },
    { censusPercent: 74, requiredStaff: 4, scheduledStaff: 4, gap:  0, status: 'ok',       confidence: 89, drivers: ['Pre-weekend discharges'] },
  ],
]

export function getCell(unitIdx: number, dayIdx: number): DayCellData {
  return MATRIX[unitIdx][dayIdx]
}

// ─── Shortfall details ────────────────────────────────────────────────────────

const BASE_SHORTFALLS: ShortfallDetail[] = [
  {
    id: 'sf-ed-1',
    unitId: 'ed',
    unitName: 'Emergency Dept',
    dayIdx: 1,
    dayLabel: 'Sat Mar 14',
    censusPct: 92,
    requiredStaff: 7,
    scheduledStaff: 5,
    gap: -2,
    status: 'critical',
    confidence: 89,
    drivers: ['Saturday night surge (+41% historical average)', 'March cold/flu season', 'Local sporting event at Mercy Arena'],
    costIfReactive: 1_840,
    costIfProactive: 920,
    historicalCensus: [72, 68, 84, 91, 78, 70, 88, 95, 76, 69, 82, 93, 80, 72, 91],
    forecastCensus:   [68, 92, 85, 72, 69, 74, 71],
    actions: [
      { id: 'act-ed-1-a', type: 'post-board',    label: 'Post 2 shifts to board',        detail: 'ED Sat 3/14 · Eve & Night · 7 qualified staff available',      saving: 520, priority: 'urgent' },
      { id: 'act-ed-1-b', type: 'request-float', label: 'Request float pool (×2)',         detail: 'Mia Lord (ED charge, available) + Jake Moss (ED trained)',    saving: 460, priority: 'urgent' },
      { id: 'act-ed-1-c', type: 'pre-alert',     label: 'Send 48h pre-alert to 8 staff',  detail: 'Push + SMS to all ED-certified available staff tonight',       saving: 310, priority: 'high' },
    ],
  },
  {
    id: 'sf-ed-2',
    unitId: 'ed',
    unitName: 'Emergency Dept',
    dayIdx: 2,
    dayLabel: 'Sun Mar 15',
    censusPct: 85,
    requiredStaff: 6,
    scheduledStaff: 5,
    gap: -1,
    status: 'tight',
    confidence: 86,
    drivers: ['Sunday afternoon peak', 'Sports-related injuries expected from Sat event overflow'],
    costIfReactive: 820,
    costIfProactive: 380,
    historicalCensus: [72, 68, 84, 91, 78, 70, 88, 95, 76, 69, 82, 93, 80, 72, 91],
    forecastCensus:   [68, 92, 85, 72, 69, 74, 71],
    actions: [
      { id: 'act-ed-2-a', type: 'post-board',    label: 'Post shift to board',           detail: 'ED Sun 3/15 · Day shift · 5 qualified staff available',        saving: 240, priority: 'high' },
      { id: 'act-ed-2-b', type: 'request-float', label: 'Request float pool RN',          detail: 'Troy Lane (ED trained, low hours this week)',                  saving: 180, priority: 'high' },
      { id: 'act-ed-2-c', type: 'pre-alert',     label: 'Send 48h pre-alert',             detail: 'Alert ED-certified staff for Sunday coverage',                saving: 140, priority: 'medium' },
    ],
  },
  {
    id: 'sf-icu-3',
    unitId: 'icu',
    unitName: 'ICU',
    dayIdx: 3,
    dayLabel: 'Mon Mar 16',
    censusPct: 86,
    requiredStaff: 5,
    scheduledStaff: 4,
    gap: -1,
    status: 'tight',
    confidence: 84,
    drivers: ['Post-weekend trauma admissions (Mon historically +28%)', 'Monday elective procedure starts'],
    costIfReactive: 780,
    costIfProactive: 340,
    historicalCensus: [78, 75, 72, 82, 84, 80, 76, 86, 82, 78, 74, 80, 77, 79, 85],
    forecastCensus:   [80, 75, 72, 86, 83, 79, 77],
    actions: [
      { id: 'act-icu-3-a', type: 'post-board',    label: 'Post ICU shift to board',      detail: 'ICU Mon 3/16 · Day · Carmen Lopez & Jaylen Brooks available', saving: 210, priority: 'high' },
      { id: 'act-icu-3-b', type: 'request-float', label: 'Request ICU float (×1)',        detail: 'Jaylen Brooks is ICU-certified float — low hours this week',  saving: 160, priority: 'high' },
      { id: 'act-icu-3-c', type: 'pre-alert',     label: 'Pre-alert ICU-certified staff', detail: 'Notify Carmen Lopez and Dana Willis for Mon morning coverage', saving: 120, priority: 'medium' },
    ],
  },
  {
    id: 'sf-msb-0',
    unitId: 'medsurgb',
    unitName: 'Med-Surg B',
    dayIdx: 0,
    dayLabel: 'Fri Mar 13',
    censusPct: 80,
    requiredStaff: 5,
    scheduledStaff: 4,
    gap: -1,
    status: 'tight',
    confidence: 86,
    drivers: ['Lisa Greenwald PTO (approved)', 'Elevated Friday census (historical avg +12%)'],
    costIfReactive: 680,
    costIfProactive: 290,
    historicalCensus: [76, 74, 70, 80, 82, 78, 75, 82, 80, 76, 72, 78, 75, 77, 81],
    forecastCensus:   [80, 75, 71, 84, 81, 79, 76],
    actions: [
      { id: 'act-msb-0-a', type: 'post-board',    label: 'Post to shift board',          detail: 'MS-B Fri 3/13 · Day shift · Rachel Torres & Kevin Park available', saving: 200, priority: 'urgent' },
      { id: 'act-msb-0-b', type: 'request-float', label: 'Request Med-Surg float',        detail: 'Oscar Reyes available (low hours, 20h this week)',               saving: 160, priority: 'high' },
      { id: 'act-msb-0-c', type: 'pre-ot',        label: 'Pre-authorize OT',              detail: 'Offer Marcus Williams Friday OT (willing, $320 premium)',        saving: 140, priority: 'high' },
    ],
  },
  {
    id: 'sf-ccu-3',
    unitId: 'ccu',
    unitName: 'CCU',
    dayIdx: 3,
    dayLabel: 'Mon Mar 16',
    censusPct: 82,
    requiredStaff: 4,
    scheduledStaff: 3,
    gap: -1,
    status: 'tight',
    confidence: 83,
    drivers: ['Post-weekend cardiac admissions pattern', 'Elective cath procedures Monday'],
    costIfReactive: 720,
    costIfProactive: 310,
    historicalCensus: [74, 70, 66, 80, 76, 72, 68, 84, 80, 76, 72, 78, 74, 70, 76],
    forecastCensus:   [75, 71, 68, 82, 78, 74, 71],
    actions: [
      { id: 'act-ccu-3-a', type: 'post-board',    label: 'Post CCU shift to board',      detail: 'CCU Mon 3/16 · Day · 3 CCRN-certified staff available',        saving: 195, priority: 'high' },
      { id: 'act-ccu-3-b', type: 'request-float', label: 'Request CCRN float',            detail: 'Rachel Torres (CCU charge, willing for Mon OT)',               saving: 155, priority: 'high' },
      { id: 'act-ccu-3-c', type: 'pre-alert',     label: 'Send pre-alert',                detail: 'Notify CCU-certified staff for Mon morning',                  saving: 110, priority: 'medium' },
    ],
  },
  {
    id: 'sf-onc-5',
    unitId: 'oncology',
    unitName: 'Oncology',
    dayIdx: 5,
    dayLabel: 'Wed Mar 18',
    censusPct: 82,
    requiredStaff: 4,
    scheduledStaff: 3,
    gap: -1,
    status: 'tight',
    confidence: 88,
    drivers: ['4 planned infusion procedures Wednesday', 'Radiation oncology coordination day'],
    costIfReactive: 640,
    costIfProactive: 280,
    historicalCensus: [70, 66, 63, 72, 76, 78, 74, 78, 74, 70, 66, 72, 70, 73, 80],
    forecastCensus:   [72, 68, 65, 74, 78, 82, 76],
    actions: [
      { id: 'act-onc-5-a', type: 'post-board',    label: 'Post Oncology shift',          detail: 'ONC Wed 3/18 · Day · 2 Oncology-certified staff available',    saving: 185, priority: 'high' },
      { id: 'act-onc-5-b', type: 'agency',        label: 'Request agency traveler',       detail: 'Kayla Hughes (Oncology traveler, on 72h standby)',             saving: 155, priority: 'high' },
      { id: 'act-onc-5-c', type: 'pre-alert',     label: 'Send 5-day pre-alert',          detail: 'Notify Oncology-trained staff 5 days before for planning',    saving: 120, priority: 'medium' },
    ],
  },
]

// ─── Mutable action state ─────────────────────────────────────────────────────

const _actionStates = new Map<string, ActionState>()

export function getActionState(id: string): ActionState {
  return _actionStates.get(id) ?? 'idle'
}

export function setActionState(id: string, state: ActionState): void {
  _actionStates.set(id, state)
}

export function getShortfallById(id: string): ShortfallDetail | undefined {
  return BASE_SHORTFALLS.find(sf => sf.id === id)
}

export function getShortfalls(): ShortfallDetail[] {
  return BASE_SHORTFALLS
}

// All shortfalls at a given unit/day
export function getShortfallForCell(unitId: UnitId, dayIdx: number): ShortfallDetail | undefined {
  return BASE_SHORTFALLS.find(sf => sf.unitId === unitId && sf.dayIdx === dayIdx)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface ForecastStats {
  totalShortfalls: number
  criticalCount: number
  costIfReactive: number
  costIfProactive: number
  savings: number
  avgConfidence: number
  historicalAccuracy: number
}

export function getForecastStats(): ForecastStats {
  const sfs = getShortfalls()
  const critical = sfs.filter(s => s.status === 'critical').length
  const costR = sfs.reduce((a, s) => a + s.costIfReactive, 0)
  const costP = sfs.reduce((a, s) => a + s.costIfProactive, 0)
  const avgConf = Math.round(sfs.reduce((a, s) => a + s.confidence, 0) / sfs.length)
  return {
    totalShortfalls: sfs.length,
    criticalCount: critical,
    costIfReactive: costR,
    costIfProactive: costP,
    savings: costR - costP,
    avgConfidence: avgConf,
    historicalAccuracy: 94,
  }
}

// ─── Status meta ─────────────────────────────────────────────────────────────

export const STATUS_META: Record<CellStatus, {
  label: string; bg: string; border: string; text: string; ringColor: string
}> = {
  critical: { label: 'Critical', bg: 'bg-red-100',     border: 'border-red-400',    text: 'text-red-700',    ringColor: 'ring-red-400' },
  tight:    { label: 'Tight',    bg: 'bg-amber-50',    border: 'border-amber-400',  text: 'text-amber-700',  ringColor: 'ring-amber-400' },
  ok:       { label: 'OK',       bg: 'bg-emerald-50',  border: 'border-emerald-200',text: 'text-emerald-700',ringColor: 'ring-emerald-400' },
  surplus:  { label: 'Surplus',  bg: 'bg-blue-50',     border: 'border-blue-200',   text: 'text-blue-700',   ringColor: 'ring-blue-400' },
}

export const ACTION_META: Record<ActionType, { icon: string; color: string; bg: string }> = {
  'post-board':    { icon: '📋', color: 'text-violet-700', bg: 'bg-violet-100' },
  'request-float': { icon: '👥', color: 'text-blue-700',   bg: 'bg-blue-100' },
  'pre-alert':     { icon: '🔔', color: 'text-amber-700',  bg: 'bg-amber-100' },
  'pre-ot':        { icon: '⏱',  color: 'text-orange-700', bg: 'bg-orange-100' },
  'agency':        { icon: '🏢', color: 'text-slate-700',  bg: 'bg-slate-100' },
}
