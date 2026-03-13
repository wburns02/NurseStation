// laborData.ts — Labor Intelligence data layer
// Reference date: March 12, 2026 (Thursday, Day 3 of pay period)

import { units } from './mockData'
import { allStaff } from './mockData'

// ─── Unit-level labor configuration ──────────────────────────────────────────

export interface UnitLaborConfig {
  unitId: string
  shortName: string
  color: string           // tailwind bg class for charts
  avgHourlyRate: number   // blended RN rate $/hr
  dailyBudget: number     // full-day (3 shifts) budget
  weeklyBudget: number
  floatPoolRate: number   // rate for float pool coverage
  perDiemRate: number     // per-diem premium rate
  otMultiplier: number    // usually 1.5
}

export const UNIT_LABOR: UnitLaborConfig[] = [
  { unitId: 'icu',       shortName: 'ICU',        color: 'bg-red-500',     avgHourlyRate: 47, dailyBudget: 4512, weeklyBudget: 31584, floatPoolRate: 49,  perDiemRate: 72,  otMultiplier: 1.5 },
  { unitId: 'ccu',       shortName: 'CCU',        color: 'bg-orange-500',  avgHourlyRate: 46, dailyBudget: 3312, weeklyBudget: 23184, floatPoolRate: 48,  perDiemRate: 70,  otMultiplier: 1.5 },
  { unitId: 'ed',        shortName: 'ED',         color: 'bg-amber-500',   avgHourlyRate: 44, dailyBudget: 5280, weeklyBudget: 36960, floatPoolRate: 46,  perDiemRate: 68,  otMultiplier: 1.5 },
  { unitId: 'med-surg-a',shortName: 'Med-Surg A', color: 'bg-emerald-500', avgHourlyRate: 41, dailyBudget: 4920, weeklyBudget: 34440, floatPoolRate: 43,  perDiemRate: 62,  otMultiplier: 1.5 },
  { unitId: 'med-surg-b',shortName: 'Med-Surg B', color: 'bg-teal-500',    avgHourlyRate: 41, dailyBudget: 4920, weeklyBudget: 34440, floatPoolRate: 43,  perDiemRate: 62,  otMultiplier: 1.5 },
  { unitId: 'pacu',      shortName: 'PACU',       color: 'bg-cyan-500',    avgHourlyRate: 50, dailyBudget: 2400, weeklyBudget: 16800, floatPoolRate: 53,  perDiemRate: 76,  otMultiplier: 1.5 },
  { unitId: 'nicu',      shortName: 'NICU',       color: 'bg-blue-500',    avgHourlyRate: 53, dailyBudget: 5088, weeklyBudget: 35616, floatPoolRate: 56,  perDiemRate: 82,  otMultiplier: 1.5 },
  { unitId: 'oncology',  shortName: 'Oncology',   color: 'bg-violet-500',  avgHourlyRate: 43, dailyBudget: 4128, weeklyBudget: 28896, floatPoolRate: 45,  perDiemRate: 65,  otMultiplier: 1.5 },
  { unitId: 'ortho',     shortName: 'Ortho',      color: 'bg-pink-500',    avgHourlyRate: 40, dailyBudget: 2880, weeklyBudget: 20160, floatPoolRate: 42,  perDiemRate: 60,  otMultiplier: 1.5 },
  { unitId: 'telemetry', shortName: 'Telemetry',  color: 'bg-indigo-500',  avgHourlyRate: 42, dailyBudget: 4032, weeklyBudget: 28224, floatPoolRate: 44,  perDiemRate: 64,  otMultiplier: 1.5 },
]

// ─── Today's actual spend snapshot (per unit, per shift) ─────────────────────

export interface UnitDaySnapshot {
  unitId: string
  shortName: string
  required: number        // total staff required today (all shifts)
  staffed: number         // actual staff on books
  openGaps: number
  regularHours: number    // hours worked at regular rate
  otHours: number         // overtime hours (premium cost)
  floatHours: number      // hours covered by float pool
  perDiemHours: number    // per-diem hours
  projectedSpend: number  // $ projected for today
  dailyBudget: number
  variance: number        // projectedSpend - dailyBudget (negative = under budget)
  ytdOtCost: number       // year-to-date OT cost
}

function buildSnapshot(): UnitDaySnapshot[] {
  return units.map(unit => {
    const cfg = UNIT_LABOR.find(c => c.shortName === unit.shortName) ?? UNIT_LABOR[0]
    // Each shift = 8 hrs, 3 shifts/day
    const staffedShiftHours  = unit.staffed  * 8
    const gapHours           = unit.openGaps * 8

    // Simulate realistic OT/float split
    const otHours      = unit.shortName === 'Med-Surg B' ? 8 : unit.shortName === 'ICU' ? 4 : 0
    const floatHours   = unit.shortName === 'Oncology'   ? 8 : unit.shortName === 'ED'  ? 0 : 0
    const perDiemHours = gapHours - otHours - floatHours > 0 ? gapHours - otHours - floatHours : 0

    // Three-shift projection
    const regularCost  = staffedShiftHours * cfg.avgHourlyRate
    const otCost       = otHours * cfg.avgHourlyRate * (cfg.otMultiplier - 1) // only the premium
    const floatCost    = floatHours * (cfg.floatPoolRate - cfg.avgHourlyRate)   // delta vs base
    const perDiemCost  = perDiemHours * cfg.perDiemRate

    const projectedSpend = regularCost + otCost + floatCost + perDiemCost

    return {
      unitId:         unit.id,
      shortName:      unit.shortName,
      required:       unit.required,
      staffed:        unit.staffed,
      openGaps:       unit.openGaps,
      regularHours:   staffedShiftHours,
      otHours,
      floatHours,
      perDiemHours,
      projectedSpend: Math.round(projectedSpend),
      dailyBudget:    cfg.dailyBudget,
      variance:       Math.round(projectedSpend - cfg.dailyBudget),
      ytdOtCost:      unit.shortName === 'Med-Surg B' ? 8_440 : unit.shortName === 'ICU' ? 6_220 : unit.shortName === 'ED' ? 4_310 : 1_200,
    }
  })
}

export const unitSnapshots: UnitDaySnapshot[] = buildSnapshot()

// ─── Today's top-line summary ─────────────────────────────────────────────────

export interface DaySummary {
  projectedSpend: number
  dailyBudget: number
  regularPay:   number
  otPremium:    number
  floatPremium: number
  perDiem:      number
  openGapCount: number
  openGapCost:  number   // cost if ALL gaps filled at base rate
  savingsIfOptimal: number
}

export const daySummary: DaySummary = (() => {
  const cfg = UNIT_LABOR
  const snaps = unitSnapshots

  const projectedSpend = snaps.reduce((s, u) => s + u.projectedSpend, 0)
  const dailyBudget    = snaps.reduce((s, u) => s + u.dailyBudget, 0)

  const regularPay   = snaps.reduce((s, u) => {
    const c = cfg.find(c => c.shortName === u.shortName)!
    return s + u.regularHours * c.avgHourlyRate
  }, 0)

  const otPremium = snaps.reduce((s, u) => {
    const c = cfg.find(c => c.shortName === u.shortName)!
    return s + u.otHours * c.avgHourlyRate * 0.5
  }, 0)

  const floatPremium = snaps.reduce((s, u) => {
    const c = cfg.find(c => c.shortName === u.shortName)!
    return s + u.floatHours * (c.floatPoolRate - c.avgHourlyRate)
  }, 0)

  const perDiem = snaps.reduce((s, u) => {
    const c = cfg.find(c => c.shortName === u.shortName)!
    return s + u.perDiemHours * c.perDiemRate
  }, 0)

  const openGapCount = snaps.reduce((s, u) => s + u.openGaps, 0)
  const openGapCost  = snaps.reduce((s, u) => {
    const c = cfg.find(c => c.shortName === u.shortName)!
    return s + u.openGaps * 8 * c.avgHourlyRate
  }, 0)

  return {
    projectedSpend: Math.round(projectedSpend),
    dailyBudget:    Math.round(dailyBudget),
    regularPay:     Math.round(regularPay),
    otPremium:      Math.round(otPremium),
    floatPremium:   Math.round(floatPremium),
    perDiem:        Math.round(perDiem),
    openGapCount,
    openGapCost:    Math.round(openGapCost),
    savingsIfOptimal: 1_840, // vs current projected (if all filled with cheapest option)
  }
})()

// ─── 14-day cost trend ────────────────────────────────────────────────────────

export interface DayCost {
  date: string   // "Feb 27", "Mar 1", etc.
  actual: number
  budget: number
}

export const costTrend14d: DayCost[] = [
  { date: 'Feb 27', actual: 47_200, budget: 49_440 },
  { date: 'Feb 28', actual: 51_800, budget: 49_440 },  // over
  { date: 'Mar 1',  actual: 48_100, budget: 49_440 },
  { date: 'Mar 2',  actual: 46_900, budget: 49_440 },
  { date: 'Mar 3',  actual: 52_300, budget: 49_440 },  // OT spike
  { date: 'Mar 4',  actual: 54_100, budget: 49_440 },  // weekend
  { date: 'Mar 5',  actual: 53_800, budget: 49_440 },  // weekend
  { date: 'Mar 6',  actual: 47_600, budget: 49_440 },
  { date: 'Mar 7',  actual: 48_900, budget: 49_440 },
  { date: 'Mar 8',  actual: 50_200, budget: 49_440 },  // slight over
  { date: 'Mar 9',  actual: 46_800, budget: 49_440 },
  { date: 'Mar 10', actual: 51_400, budget: 49_440 },
  { date: 'Mar 11', actual: 49_100, budget: 49_440 },
  { date: 'Mar 12', actual: daySummary.projectedSpend, budget: 49_440 },  // today (projected)
]

// ─── Gap fill cost options ────────────────────────────────────────────────────

export type FillType = 'regular' | 'ot' | 'float' | 'per-diem'

export interface FillOption {
  type: FillType
  label: string
  staffName?: string
  staffId?: string
  rate: number
  shiftCost: number    // for an 8h shift
  otHoursUsed?: number // if this triggers OT, how many OT hours
  available: boolean
  matchScore?: number  // 0-100
  note?: string
  recommended: boolean
  savingsVsNext: number // $ saved vs next cheapest option
}

export interface GapFillOption {
  gapId: string
  unitShortName: string
  shiftLabel: string
  role: string
  date: string
  options: FillOption[]
}

export const gapFillOptions: GapFillOption[] = [
  {
    gapId: 'gap-icu-day',
    unitShortName: 'ICU',
    shiftLabel: 'Day 07:00–15:00',
    role: 'RN',
    date: 'Today, Mar 12',
    options: [
      {
        type: 'regular',
        label: 'Float Pool — Regular Rate',
        staffName: 'Sarah Chen',
        staffId: 's001',
        rate: 43,
        shiftCost: 344,
        available: true,
        matchScore: 95,
        note: '8h left before OT · ICU certified · 4-hr response',
        recommended: true,
        savingsVsNext: 132,
      },
      {
        type: 'float',
        label: 'Float Pool — Float Rate',
        staffName: 'Aisha Patel',
        staffId: 'e023',
        rate: 49,
        shiftCost: 392,
        available: true,
        matchScore: 88,
        note: 'Available now · No OT risk',
        recommended: false,
        savingsVsNext: 144,
      },
      {
        type: 'ot',
        label: 'OT Assignment',
        staffName: 'Marcus Williams',
        staffId: 's002',
        rate: 70.5,
        shiftCost: 564,
        otHoursUsed: 4,
        available: true,
        matchScore: 92,
        note: 'Near OT threshold — 4h OT at 1.5×',
        recommended: false,
        savingsVsNext: -172,
      },
      {
        type: 'per-diem',
        label: 'Per Diem',
        staffName: 'Linda M.',
        rate: 72,
        shiftCost: 576,
        available: true,
        matchScore: 82,
        note: 'ICU experience, credentialed',
        recommended: false,
        savingsVsNext: 0,
      },
    ],
  },
  {
    gapId: 'gap-ed-day',
    unitShortName: 'ED',
    shiftLabel: 'Evening 15:00–23:00',
    role: 'RN',
    date: 'Tomorrow, Mar 13',
    options: [
      {
        type: 'regular',
        label: 'Float Pool — Regular Rate',
        staffName: 'Fatima Hassan',
        staffId: 'e008',
        rate: 44,
        shiftCost: 352,
        available: true,
        matchScore: 90,
        note: '8h left this pay period · ED experience',
        recommended: true,
        savingsVsNext: 96,
      },
      {
        type: 'float',
        label: 'Float Pool — Float Rate',
        staffName: 'Derrick Obi',
        staffId: 'e031',
        rate: 46,
        shiftCost: 368,
        available: true,
        matchScore: 78,
        note: 'Available · General med-surg background',
        recommended: false,
        savingsVsNext: 192,
      },
      {
        type: 'per-diem',
        label: 'Per Diem',
        staffName: 'Casey T.',
        rate: 68,
        shiftCost: 544,
        available: true,
        matchScore: 85,
        note: 'ED experience, TNCC certified',
        recommended: false,
        savingsVsNext: 0,
      },
    ],
  },
  {
    gapId: 'gap-msb-day-1',
    unitShortName: 'Med-Surg B',
    shiftLabel: 'Day 07:00–15:00',
    role: 'RN',
    date: 'Today, Mar 12',
    options: [
      {
        type: 'ot',
        label: 'OT Assignment',
        staffName: 'Tyler Barnes',
        staffId: 's005',
        rate: 57,
        shiftCost: 456,
        otHoursUsed: 8,
        available: true,
        matchScore: 89,
        note: 'Has remaining OT capacity · Med-Surg B regular',
        recommended: true,
        savingsVsNext: 56,
      },
      {
        type: 'per-diem',
        label: 'Per Diem',
        staffName: 'Rosa L.',
        rate: 62,
        shiftCost: 496,
        available: true,
        matchScore: 80,
        note: 'Med-surg certified',
        recommended: false,
        savingsVsNext: 0,
      },
    ],
  },
  {
    gapId: 'gap-msb-day-2',
    unitShortName: 'Med-Surg B',
    shiftLabel: 'Day 07:00–15:00',
    role: 'RN',
    date: 'Today, Mar 12',
    options: [
      {
        type: 'float',
        label: 'Float Pool — Float Rate',
        staffName: 'Keisha Moore',
        staffId: 'e029',
        rate: 43,
        shiftCost: 344,
        available: true,
        matchScore: 82,
        note: 'Available now · Med-Surg experience',
        recommended: true,
        savingsVsNext: 128,
      },
      {
        type: 'per-diem',
        label: 'Per Diem',
        staffName: 'Paul K.',
        rate: 62,
        shiftCost: 496,
        available: false,
        matchScore: 70,
        note: 'On hold — pending background check',
        recommended: false,
        savingsVsNext: 0,
      },
    ],
  },
  {
    gapId: 'gap-oncology-day',
    unitShortName: 'Oncology',
    shiftLabel: 'Day 07:00–15:00',
    role: 'RN',
    date: 'Today, Mar 12',
    options: [
      {
        type: 'regular',
        label: 'Float Pool — Regular Rate',
        staffName: 'Linda Okonkwo',
        staffId: 's007',
        rate: 43,
        shiftCost: 344,
        available: true,
        matchScore: 96,
        note: 'OCN certified · Match score 96%',
        recommended: true,
        savingsVsNext: 152,
      },
      {
        type: 'per-diem',
        label: 'Per Diem',
        staffName: 'Maria S.',
        rate: 65,
        shiftCost: 520,
        available: true,
        matchScore: 74,
        note: 'Oncology experience',
        recommended: false,
        savingsVsNext: 0,
      },
    ],
  },
]

// ─── OT Exposure leaderboard (top staff by pay-period OT) ─────────────────────

export interface OTExposureEntry {
  staffId: string
  name: string
  role: string
  unit: string
  hoursWorked: number
  otThreshold: number
  hourlyRate: number
  otHoursAccrued: number
  otCostAccrued: number
  riskLevel: 'critical' | 'warning' | 'low'
  hoursToNextOT: number
}

export const otLeaderboard: OTExposureEntry[] = [
  { staffId: 'e002', name: 'James Okafor',    role: 'RN',        unit: 'ICU',        hoursWorked: 36, otThreshold: 40, hourlyRate: 46, otHoursAccrued: 0, otCostAccrued: 0,    riskLevel: 'warning',  hoursToNextOT: 4 },
  { staffId: 's002', name: 'Marcus Williams', role: 'RN',        unit: 'Float Pool', hoursWorked: 36, otThreshold: 40, hourlyRate: 47, otHoursAccrued: 0, otCostAccrued: 0,    riskLevel: 'warning',  hoursToNextOT: 4 },
  { staffId: 'e007', name: 'Nathan Foster',   role: 'Charge RN', unit: 'Med-Surg B', hoursWorked: 34, otThreshold: 40, hourlyRate: 54, otHoursAccrued: 0, otCostAccrued: 0,    riskLevel: 'warning',  hoursToNextOT: 6 },
  { staffId: 's005', name: 'Tyler Barnes',    role: 'CNA',       unit: 'Med-Surg B', hoursWorked: 38, otThreshold: 40, hourlyRate: 38, otHoursAccrued: 4, otCostAccrued: 76,   riskLevel: 'critical', hoursToNextOT: 2 },
  { staffId: 'e016', name: 'Christine Park',  role: 'Charge RN', unit: 'Med-Surg B', hoursWorked: 42, otThreshold: 40, hourlyRate: 52, otHoursAccrued: 2, otCostAccrued: 104,  riskLevel: 'critical', hoursToNextOT: 0 },
  { staffId: 'e001', name: 'Priya Sharma',    role: 'Charge RN', unit: 'ICU',        hoursWorked: 30, otThreshold: 40, hourlyRate: 52, otHoursAccrued: 0, otCostAccrued: 0,    riskLevel: 'low',      hoursToNextOT: 10 },
  { staffId: 's001', name: 'Sarah Chen',      role: 'RN',        unit: 'Float Pool', hoursWorked: 32, otThreshold: 80, hourlyRate: 43, otHoursAccrued: 0, otCostAccrued: 0,    riskLevel: 'low',      hoursToNextOT: 48 },
]

// ─── Weekly forecast ──────────────────────────────────────────────────────────

export interface WeekForecast {
  dayLabel: string
  date: string
  isToday: boolean
  isPast: boolean
  projectedSpend: number
  budget: number
  gapCount: number
}

export const weekForecast: WeekForecast[] = [
  { dayLabel: 'Mon', date: 'Mar 9',  isToday: false, isPast: true,  projectedSpend: 47_600, budget: 49_440, gapCount: 0 },
  { dayLabel: 'Tue', date: 'Mar 10', isToday: false, isPast: true,  projectedSpend: 51_400, budget: 49_440, gapCount: 1 },
  { dayLabel: 'Wed', date: 'Mar 11', isToday: false, isPast: true,  projectedSpend: 49_100, budget: 49_440, gapCount: 0 },
  { dayLabel: 'Thu', date: 'Mar 12', isToday: true,  isPast: false, projectedSpend: daySummary.projectedSpend, budget: 49_440, gapCount: 5 },
  { dayLabel: 'Fri', date: 'Mar 13', isToday: false, isPast: false, projectedSpend: 51_200, budget: 49_440, gapCount: 2 },
  { dayLabel: 'Sat', date: 'Mar 14', isToday: false, isPast: false, projectedSpend: 53_800, budget: 49_440, gapCount: 3 },
  { dayLabel: 'Sun', date: 'Mar 15', isToday: false, isPast: false, projectedSpend: 52_100, budget: 49_440, gapCount: 2 },
]

// Derived totals for current week
export const weekTotals = {
  actualSoFar: weekForecast.filter(d => d.isPast).reduce((s, d) => s + d.projectedSpend, 0),
  projectedTotal: weekForecast.reduce((s, d) => s + d.projectedSpend, 0),
  weeklyBudget: weekForecast.reduce((s, d) => s + d.budget, 0),
  varianceThisWeek: 0, // computed below
  otTotalCost: otLeaderboard.reduce((s, e) => s + e.otCostAccrued, 0),
}
weekTotals.varianceThisWeek = weekTotals.projectedTotal - weekTotals.weeklyBudget

// ─── Pay period summary (biweekly, started Mon Mar 9) ────────────────────────

export const payPeriodSummary = {
  label: 'Pay Period Mar 9–22',
  daysElapsed: 3,
  totalDays: 14,
  spentSoFar: weekTotals.actualSoFar + daySummary.projectedSpend,
  periodBudget: 49_440 * 14,
  projectedPeriodEnd: (weekTotals.actualSoFar + daySummary.projectedSpend) / 3 * 14,
  otCostSoFar: weekTotals.otTotalCost + 840,  // 840 from prior days
}

// ─── Cost type helpers ────────────────────────────────────────────────────────

export const FILL_TYPE_META: Record<FillType, { label: string; color: string; bg: string }> = {
  regular:  { label: 'Regular',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  ot:       { label: 'Overtime', color: 'text-red-700',     bg: 'bg-red-100'     },
  float:    { label: 'Float',    color: 'text-blue-700',    bg: 'bg-blue-100'    },
  'per-diem': { label: 'Per Diem', color: 'text-amber-700', bg: 'bg-amber-100'   },
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

export function formatDollar(n: number): string {
  return `$${Math.abs(n).toLocaleString()}`
}

// Derive OT exposure % for allStaff context
export function getOtExposurePct(staffId: string): number {
  const entry = otLeaderboard.find(e => e.staffId === staffId)
  if (!entry) return 0
  return Math.round((entry.hoursWorked / entry.otThreshold) * 100)
}

void allStaff // suppress unused import warning
