// ── Budget vs Actual Labor Dashboard Data ────────────────────────────────────
// Period: March 2026 (13 days elapsed, 18 remaining)
// All figures in USD. Rates are blended Mercy General averages.

export type BudgetPeriod = 'today' | 'wtd' | 'mtd' | 'ytd'
export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Telemetry'

export interface UnitBudget {
  unit:            UnitKey
  monthlyBudget:   number
  regularHours:    number   // hours worked so far this month
  otHours:         number
  floatHours:      number
  agencyHours:     number
  regularRate:     number   // $/hr blended
  otRate:          number
  floatRate:       number
  agencyRate:      number
  avgCensus:       number   // avg patients this month
  targetHPPD:      number   // Hours Per Patient Day target
  budgetedFTE:     number
}

export interface WeeklyBar {
  week:        string
  weekShort:   string
  regular:     number
  ot:          number
  float:       number
  agency:      number
  budget:      number
}

export interface OTLeader {
  nurseId:    string
  name:       string
  initials:   string
  color:      string
  unit:       UnitKey
  otHours:    number
  otCost:     number
  regularHours: number
  trend:      'up' | 'down' | 'stable'
}

export interface BudgetAlert {
  id:       string
  severity: 'critical' | 'warning' | 'info' | 'success'
  title:    string
  detail:   string
  unit?:    UnitKey
  action?:  string
  actionHref?: string
}

// ── Month-to-date unit data (13 of 31 days = 41.9%) ─────────────────────────

const DAYS_ELAPSED = 13
const DAYS_TOTAL   = 31
const PCT_ELAPSED  = DAYS_ELAPSED / DAYS_TOTAL  // 0.419

const _units: UnitBudget[] = [
  {
    unit: 'ICU', monthlyBudget: 165_000,
    regularHours: 1_248, otHours: 94, floatHours: 48, agencyHours: 0,
    regularRate: 44.50, otRate: 66.75, floatRate: 55.00, agencyRate: 85.00,
    avgCensus: 9.4, targetHPPD: 12.5, budgetedFTE: 14,
  },
  {
    unit: 'CCU', monthlyBudget: 145_000,
    regularHours: 1_092, otHours: 62, floatHours: 0, agencyHours: 0,
    regularRate: 46.00, otRate: 69.00, floatRate: 55.00, agencyRate: 85.00,
    avgCensus: 8.2, targetHPPD: 11.0, budgetedFTE: 12,
  },
  {
    unit: 'ED', monthlyBudget: 195_000,
    regularHours: 1_456, otHours: 148, floatHours: 96, agencyHours: 48,
    regularRate: 48.00, otRate: 72.00, floatRate: 60.00, agencyRate: 92.00,
    avgCensus: 31.6, targetHPPD: 8.5, budgetedFTE: 18,
  },
  {
    unit: 'MS-A', monthlyBudget: 125_000,
    regularHours: 1_014, otHours: 38, floatHours: 24, agencyHours: 0,
    regularRate: 40.00, otRate: 60.00, floatRate: 50.00, agencyRate: 80.00,
    avgCensus: 19.8, targetHPPD: 8.0, budgetedFTE: 13,
  },
  {
    unit: 'MS-B', monthlyBudget: 118_000,
    regularHours: 978, otHours: 52, floatHours: 0, agencyHours: 0,
    regularRate: 39.00, otRate: 58.50, floatRate: 50.00, agencyRate: 80.00,
    avgCensus: 18.9, targetHPPD: 7.8, budgetedFTE: 12,
  },
  {
    unit: 'Telemetry', monthlyBudget: 112_000,
    regularHours: 936, otHours: 74, floatHours: 36, agencyHours: 0,
    regularRate: 38.50, otRate: 57.75, floatRate: 48.00, agencyRate: 78.00,
    avgCensus: 22.4, targetHPPD: 7.5, budgetedFTE: 11,
  },
]

// ── Computed helpers ─────────────────────────────────────────────────────────

export function unitSpent(u: UnitBudget): number {
  return (
    u.regularHours * u.regularRate +
    u.otHours      * u.otRate      +
    u.floatHours   * u.floatRate   +
    u.agencyHours  * u.agencyRate
  )
}
export function unitBudgetedSoFar(u: UnitBudget): number {
  return u.monthlyBudget * PCT_ELAPSED
}
export function unitProjected(u: UnitBudget): number {
  return (unitSpent(u) / DAYS_ELAPSED) * DAYS_TOTAL
}
export function unitVariance(u: UnitBudget): number {
  return unitProjected(u) - u.monthlyBudget
}
export function unitVariancePct(u: UnitBudget): number {
  return unitVariance(u) / u.monthlyBudget
}
export function unitHPPD(u: UnitBudget): number {
  const totalHours = u.regularHours + u.otHours + u.floatHours + u.agencyHours
  return totalHours / (u.avgCensus * DAYS_ELAPSED)
}
export function unitOTCost(u: UnitBudget): number {
  return u.otHours * u.otRate
}
export function unitAgencyCost(u: UnitBudget): number {
  return u.agencyHours * u.agencyRate
}

// ── Totals ───────────────────────────────────────────────────────────────────

export function getTotals() {
  const units = getUnits()
  const totalBudget    = units.reduce((s, u) => s + u.monthlyBudget, 0)
  const totalSpent     = units.reduce((s, u) => s + unitSpent(u), 0)
  const totalProjected = units.reduce((s, u) => s + unitProjected(u), 0)
  const totalVariance  = totalProjected - totalBudget
  const totalOTCost    = units.reduce((s, u) => s + unitOTCost(u), 0)
  const totalAgency    = units.reduce((s, u) => s + unitAgencyCost(u), 0)
  const budgetUsedPct  = totalSpent / totalBudget
  return {
    totalBudget, totalSpent, totalProjected, totalVariance,
    totalOTCost, totalAgency, budgetUsedPct,
    daysElapsed: DAYS_ELAPSED, daysTotal: DAYS_TOTAL, pctElapsed: PCT_ELAPSED,
  }
}

// ── Weekly trend (4 weeks) ───────────────────────────────────────────────────

export const WEEKLY_BARS: WeeklyBar[] = [
  { week: 'Feb 10–16', weekShort: 'Feb 16', regular: 181_400, ot: 11_200, float: 4_800,  agency: 0,      budget: 197_500 },
  { week: 'Feb 17–23', weekShort: 'Feb 23', regular: 183_200, ot: 14_600, float: 6_200,  agency: 0,      budget: 197_500 },
  { week: 'Feb 24–Mar 2', weekShort: 'Mar 2',  regular: 187_600, ot: 18_400, float: 9_400,  agency: 4_416,  budget: 197_500 },
  { week: 'Mar 3–9',  weekShort: 'Mar 9',  regular: 190_200, ot: 22_800, float: 12_000, agency: 8_832,  budget: 197_500 },
]

// ── OT leaders ───────────────────────────────────────────────────────────────

export const OT_LEADERS: OTLeader[] = [
  { nurseId: 'st-004', name: 'David Thompson', initials: 'DT', color: 'from-red-500 to-red-700',     unit: 'ED',        otHours: 18.5, otCost: 1_332, regularHours: 104, trend: 'up' },
  { nurseId: 'st-008', name: 'Kevin Park',     initials: 'KP', color: 'from-cyan-500 to-cyan-700',   unit: 'MS-B',      otHours: 14.2, otCost: 831,   regularHours: 96,  trend: 'down' },
  { nurseId: 'st-002', name: 'Marcus Chen',    initials: 'MC', color: 'from-blue-500 to-blue-700',   unit: 'ICU',       otHours: 11.3, otCost: 754,   regularHours: 108, trend: 'stable' },
  { nurseId: 'st-009', name: 'Linda Foster',   initials: 'LF', color: 'from-teal-500 to-teal-700',   unit: 'CCU',       otHours: 9.4,  otCost: 649,   regularHours: 96,  trend: 'up' },
  { nurseId: 'st-011', name: 'Christina Lee',  initials: 'CL', color: 'from-purple-500 to-purple-700', unit: 'CCU',     otHours: 6.8,  otCost: 469,   regularHours: 84,  trend: 'stable' },
]

// ── Budget alerts ─────────────────────────────────────────────────────────────

export function getAlerts(): BudgetAlert[] {
  const units = getUnits()
  const alerts: BudgetAlert[] = []

  // ED critical overage
  const ed = units.find(u => u.unit === 'ED')!
  const edVar = unitVariance(ed)
  if (edVar > 0) {
    alerts.push({
      id: 'alert-ed-ot',
      severity: 'critical',
      title: 'ED on track to exceed monthly budget',
      detail: `Projected overage of ${fmt(edVar)} driven by ${ed.otHours}h OT and ${ed.agencyHours}h agency hours. Recommend freezing new OT approvals.`,
      unit: 'ED',
      action: 'Review OT Queue',
      actionHref: '/overtime',
    })
  }

  // Telemetry OT warning
  const tel = units.find(u => u.unit === 'Telemetry')!
  const telVar = unitVariance(tel)
  if (telVar > 0) {
    alerts.push({
      id: 'alert-tel-ot',
      severity: 'warning',
      title: 'Telemetry OT trending over target',
      detail: `${tel.otHours}h OT so far this month — projected ${fmt(telVar)} over budget. Review Thursday and Friday night coverage gaps.`,
      unit: 'Telemetry',
      action: 'View Coverage',
      actionHref: '/coverage',
    })
  }

  // Agency cost spike
  const totalAgency = units.reduce((s, u) => s + unitAgencyCost(u), 0)
  if (totalAgency > 8_000) {
    alerts.push({
      id: 'alert-agency',
      severity: 'warning',
      title: 'Agency spend accelerating',
      detail: `${fmt(totalAgency)} in agency costs MTD — annualized run rate is ${fmt(totalAgency / DAYS_ELAPSED * 365)}. Post open shifts to reduce agency dependency.`,
      action: 'Post Open Shifts',
      actionHref: '/shift-board',
    })
  }

  // MS-A and MS-B under budget = opportunity
  const msa = units.find(u => u.unit === 'MS-A')!
  const msb = units.find(u => u.unit === 'MS-B')!
  const msVar = unitVariance(msa) + unitVariance(msb)
  if (msVar < -5_000) {
    alerts.push({
      id: 'alert-ms-under',
      severity: 'success',
      title: 'MS-A and MS-B running under budget',
      detail: `Combined ${fmt(Math.abs(msVar))} projected savings. You have room to approve pending PTO requests or offer per-diem bonuses.`,
      action: 'View Time-Off Requests',
      actionHref: '/time-off',
    })
  }

  // ICU HPPD high
  const icu = units.find(u => u.unit === 'ICU')!
  if (unitHPPD(icu) > icu.targetHPPD * 1.05) {
    alerts.push({
      id: 'alert-icu-hppd',
      severity: 'info',
      title: 'ICU HPPD above target — review acuity',
      detail: `Actual ${unitHPPD(icu).toFixed(1)} vs target ${icu.targetHPPD} HPPD. High acuity may justify this, but confirm with charge RN before reducing float coverage.`,
      unit: 'ICU',
      action: 'View Charge Board',
      actionHref: '/charge',
    })
  }

  return alerts
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)     return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}k`
  return `${n < 0 ? '-' : ''}$${abs.toFixed(0)}`
}
export function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
}

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getUnits(): UnitBudget[] { return _units }
export function getUnit(key: UnitKey): UnitBudget | undefined {
  return _units.find(u => u.unit === key)
}

// ── Cost breakdown by type (current month) ────────────────────────────────────

export function getCostBreakdown() {
  const units = getUnits()
  const regular = units.reduce((s, u) => s + u.regularHours * u.regularRate, 0)
  const ot      = units.reduce((s, u) => s + u.otHours * u.otRate, 0)
  const float_  = units.reduce((s, u) => s + u.floatHours * u.floatRate, 0)
  const agency  = units.reduce((s, u) => s + u.agencyHours * u.agencyRate, 0)
  const total   = regular + ot + float_ + agency
  return [
    { label: 'Regular',  value: regular, pct: regular / total, color: 'bg-violet-500' },
    { label: 'Overtime', value: ot,      pct: ot / total,      color: 'bg-amber-500' },
    { label: 'Float',    value: float_,  pct: float_ / total,  color: 'bg-sky-500' },
    { label: 'Agency',   value: agency,  pct: agency / total,  color: 'bg-red-500' },
  ]
}
