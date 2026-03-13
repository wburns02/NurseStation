// ── Productivity & HPPD Intelligence Data ───────────────────────────────────

export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry'
export type ProdStatus = 'on-track' | 'over' | 'under' | 'critical'

export interface UnitProductivity {
  unit:          UnitKey
  color:         string   // tailwind gradient
  bgLight:       string
  borderColor:   string
  // Census & staffing
  census:        number
  capacity:      number
  staffOnDuty:   number   // total RN hours contributing (FTE equivalent)
  totalHours:    number   // budgeted hours for shift
  scheduledHours:number   // actually scheduled
  workedHours:   number   // worked so far this shift
  // HPPD
  hppdBudget:    number
  hppdActual:    number
  hppdVariance:  number   // actual - budget (positive = over)
  // Matrix
  matrixRequired:number   // nurses required by census × ratio
  matrixActual:  number   // nurses actually on
  // Financial
  laborRate:     number   // blended $/hr
  dollarVariance:number   // + = over budget, - = under
  status:        ProdStatus
  // Shift
  trend:         number[] // last 14 days HPPD
}

export interface ShiftSummary {
  date:          string
  shift:         string
  totalCensus:   number
  totalCapacity: number
  hppdBudgetAvg: number
  hppdActualAvg: number
  totalDollarVariance: number
  unitsOverBudget: number
  unitsUnderBudget: number
  unitsOnTrack:    number
}

export interface SmartRecommendation {
  id:       string
  priority: 'critical' | 'high' | 'medium' | 'low'
  type:     'float' | 'early-release' | 'marketplace' | 'adjust' | 'monitor'
  title:    string
  detail:   string
  action:   string
  from?:    UnitKey
  to?:      UnitKey
  impact:   string   // e.g. "saves $468"
  done:     boolean
}

export interface MatrixRow {
  censusRange: string
  required:    number
  ratio:       string
}

export const MATRIX_TABLE: Record<UnitKey, MatrixRow[]> = {
  'ICU':       [{ censusRange:'1–4', required:2, ratio:'2:1' },{ censusRange:'5–8', required:4, ratio:'2:1' },{ censusRange:'9–12', required:6, ratio:'2:1' }],
  'CCU':       [{ censusRange:'1–4', required:2, ratio:'2:1' },{ censusRange:'5–8', required:4, ratio:'2:1' },{ censusRange:'9–10', required:5, ratio:'2:1' }],
  'ED':        [{ censusRange:'1–6', required:3, ratio:'3:1' },{ censusRange:'7–12', required:4, ratio:'3:1' },{ censusRange:'13–20', required:5, ratio:'4:1' }],
  'MS-A':      [{ censusRange:'1–8', required:2, ratio:'4:1' },{ censusRange:'9–16', required:4, ratio:'4:1' },{ censusRange:'17–24', required:6, ratio:'4:1' }],
  'MS-B':      [{ censusRange:'1–8', required:2, ratio:'4:1' },{ censusRange:'9–16', required:4, ratio:'4:1' },{ censusRange:'17–24', required:6, ratio:'4:1' }],
  'Oncology':  [{ censusRange:'1–6', required:2, ratio:'3:1' },{ censusRange:'7–9',  required:3, ratio:'3:1' },{ censusRange:'10–12', required:4, ratio:'3:1' }],
  'Telemetry': [{ censusRange:'1–8', required:2, ratio:'4:1' },{ censusRange:'9–16', required:4, ratio:'4:1' },{ censusRange:'17–22', required:5, ratio:'4:1' }],
}

// ── Live store ───────────────────────────────────────────────────────────────

function makeVariance(hppdActual: number, hppdBudget: number, census: number, laborRate: number) {
  const variance = parseFloat((hppdActual - hppdBudget).toFixed(2))
  const hoursVariance = (variance * census * 0.5)  // per 12-hr shift
  return { hppdVariance: variance, dollarVariance: parseFloat((hoursVariance * laborRate).toFixed(0)) }
}

const _units: UnitProductivity[] = [
  (() => {
    const u = { unit:'ICU' as UnitKey, color:'from-sky-500 to-sky-700', bgLight:'bg-sky-50', borderColor:'border-sky-200',
      census:10, capacity:12, staffOnDuty:5, totalHours:72, scheduledHours:60, workedHours:45,
      hppdBudget:14.0, hppdActual:13.2, matrixRequired:5, matrixActual:5, laborRate:72, trend:[13.8,14.1,13.5,14.2,13.9,14.0,14.3,13.7,14.1,13.8,14.0,14.2,13.5,13.2] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'on-track' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'CCU' as UnitKey, color:'from-indigo-500 to-indigo-700', bgLight:'bg-indigo-50', borderColor:'border-indigo-200',
      census:8, capacity:10, staffOnDuty:6, totalHours:60, scheduledHours:72, workedHours:54,
      hppdBudget:12.5, hppdActual:15.0, matrixRequired:4, matrixActual:6, laborRate:72, trend:[12.4,12.6,13.1,12.9,14.2,14.0,15.3,15.1,14.8,15.2,15.6,15.0,15.3,15.0] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'over' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'ED' as UnitKey, color:'from-orange-500 to-orange-700', bgLight:'bg-orange-50', borderColor:'border-orange-200',
      census:14, capacity:20, staffOnDuty:5, totalHours:84, scheduledHours:84, workedHours:63,
      hppdBudget:6.0, hppdActual:6.1, matrixRequired:5, matrixActual:5, laborRate:68, trend:[5.8,6.1,6.0,5.9,6.2,6.0,6.1,6.3,5.8,6.0,6.2,6.1,6.0,6.1] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'on-track' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'MS-A' as UnitKey, color:'from-emerald-500 to-emerald-700', bgLight:'bg-emerald-50', borderColor:'border-emerald-200',
      census:18, capacity:24, staffOnDuty:4, totalHours:96, scheduledHours:96, workedHours:72,
      hppdBudget:8.5, hppdActual:7.1, matrixRequired:5, matrixActual:4, laborRate:65, trend:[8.6,8.4,8.3,8.1,8.0,7.9,7.8,7.7,7.5,7.4,7.2,7.1,7.0,7.1] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'under' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'MS-B' as UnitKey, color:'from-teal-500 to-teal-700', bgLight:'bg-teal-50', borderColor:'border-teal-200',
      census:16, capacity:22, staffOnDuty:5, totalHours:96, scheduledHours:96, workedHours:72,
      hppdBudget:8.5, hppdActual:9.0, matrixRequired:4, matrixActual:5, laborRate:65, trend:[8.3,8.5,8.6,8.9,9.1,8.8,9.0,9.2,8.7,9.0,9.3,9.1,8.9,9.0] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'over' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'Oncology' as UnitKey, color:'from-violet-500 to-violet-700', bgLight:'bg-violet-50', borderColor:'border-violet-200',
      census:11, capacity:12, staffOnDuty:6, totalHours:72, scheduledHours:72, workedHours:54,
      hppdBudget:9.5, hppdActual:13.1, matrixRequired:4, matrixActual:6, laborRate:70, trend:[9.6,9.4,9.8,10.1,10.5,11.2,11.8,12.0,12.4,12.8,13.0,13.3,13.1,13.1] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'critical' as ProdStatus }
  })(),
  (() => {
    const u = { unit:'Telemetry' as UnitKey, color:'from-pink-500 to-pink-700', bgLight:'bg-pink-50', borderColor:'border-pink-200',
      census:17, capacity:22, staffOnDuty:4, totalHours:96, scheduledHours:84, workedHours:63,
      hppdBudget:7.5, hppdActual:6.8, matrixRequired:5, matrixActual:4, laborRate:65, trend:[7.6,7.5,7.4,7.2,7.0,6.9,7.1,7.0,6.8,7.0,6.9,6.7,6.8,6.8] }
    return { ...u, ...makeVariance(u.hppdActual, u.hppdBudget, u.census, u.laborRate), status:'under' as ProdStatus }
  })(),
]

let _recs: SmartRecommendation[] = [
  { id:'rec-001', priority:'critical', type:'float',
    title:'Float 1 RN from CCU → MS-A',
    detail:'CCU has 2 excess nurses (15.0 vs 12.5 HPPD budget). MS-A is 1.4 HPPD below target with rising census.',
    action:'Float Sarah K. (CCU) to MS-A for remainder of shift',
    from:'CCU', to:'MS-A',
    impact:'Saves $624, fixes MS-A ratio risk', done:false },
  { id:'rec-002', priority:'critical', type:'monitor',
    title:'Oncology HPPD +38% over budget',
    detail:'Oncology running 13.1 vs 9.5 budget. Surge protocol pulled extra staff. $2,772 over for shift.',
    action:'Review Oncology surge justification & document variance',
    to:'Oncology',
    impact:'Required for budget compliance', done:false },
  { id:'rec-003', priority:'high', type:'early-release',
    title:'Offer early release in MS-B',
    detail:'MS-B running 9.0 HPPD vs 8.5 budget. Census is stable (16/22). One RN could go early.',
    action:'Offer early release to least-senior available RN in MS-B',
    from:'MS-B',
    impact:'Saves $390 remaining shift hours', done:false },
  { id:'rec-004', priority:'high', type:'float',
    title:'Float 1 RN from CCU → Telemetry',
    detail:'Telemetry has 17 patients with 4 RNs — below the 5 required by matrix. CCU has excess.',
    action:'Float James H. (CCU) to Telemetry to meet ratio',
    from:'CCU', to:'Telemetry',
    impact:'Fixes ratio risk for 17 patients', done:false },
  { id:'rec-005', priority:'medium', type:'marketplace',
    title:'Post tomorrow\'s Oncology shift to marketplace',
    detail:'Oncology surge is trending — 14-day HPPD increasing steadily. Pre-emptive coverage needed.',
    action:'Post 1 RN shift for Fri Mar 14 Oncology to Marketplace',
    to:'Oncology',
    impact:'Locks in coverage before surge peaks', done:false },
  { id:'rec-006', priority:'low', type:'monitor',
    title:'ICU trending 0.8 below budget',
    detail:'ICU has been 0.5–0.8 under HPPD budget for 3 consecutive shifts — may need staffing review.',
    action:'Review ICU staffing model at next charge meeting',
    to:'ICU',
    impact:'Prevents care quality gap', done:false },
]

// ── Selectors ─────────────────────────────────────────────────────────────────

export function getUnits(): UnitProductivity[] { return [..._units] }
export function getUnit(unit: UnitKey): UnitProductivity | undefined { return _units.find(u => u.unit === unit) }

export function getShiftSummary(): ShiftSummary {
  const weighted = _units.reduce((sum, u) => sum + u.hppdActual * u.census, 0)
  const totalCensus = _units.reduce((sum, u) => sum + u.census, 0)
  const budgWeighted = _units.reduce((sum, u) => sum + u.hppdBudget * u.census, 0)
  return {
    date: 'Friday, March 13, 2026',
    shift: 'Day Shift (07:00–15:00)',
    totalCensus,
    totalCapacity: _units.reduce((sum, u) => sum + u.capacity, 0),
    hppdBudgetAvg: parseFloat((budgWeighted / totalCensus).toFixed(1)),
    hppdActualAvg: parseFloat((weighted / totalCensus).toFixed(1)),
    totalDollarVariance: _units.reduce((sum, u) => sum + u.dollarVariance, 0),
    unitsOverBudget:  _units.filter(u => u.status === 'over' || u.status === 'critical').length,
    unitsUnderBudget: _units.filter(u => u.status === 'under').length,
    unitsOnTrack:     _units.filter(u => u.status === 'on-track').length,
  }
}

export function getRecommendations(): SmartRecommendation[] { return [..._recs] }

export function applyRecommendation(id: string): void {
  const r = _recs.find(r => r.id === id)
  if (r) r.done = true
}

export function dismissRecommendation(id: string): void {
  _recs = _recs.filter(r => r.id !== id)
}

// Simulate adjusting HPPD after applying a recommendation
export function applyFloat(from: UnitKey, to: UnitKey): void {
  const src = _units.find(u => u.unit === from)
  const dst = _units.find(u => u.unit === to)
  if (src && dst) {
    src.staffOnDuty = Math.max(src.staffOnDuty - 1, 1)
    dst.staffOnDuty = dst.staffOnDuty + 1
    src.hppdActual = parseFloat((src.hppdActual - (src.laborRate * 0.5 / src.census)).toFixed(1))
    dst.hppdActual = parseFloat((dst.hppdActual + (dst.laborRate * 0.5 / dst.census)).toFixed(1))
    src.hppdVariance = parseFloat((src.hppdActual - src.hppdBudget).toFixed(2))
    dst.hppdVariance = parseFloat((dst.hppdActual - dst.hppdBudget).toFixed(2))
    src.matrixActual = Math.max(src.matrixActual - 1, 1)
    dst.matrixActual = dst.matrixActual + 1
  }
}
