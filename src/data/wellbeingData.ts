// wellbeingData.ts — Staff Wellbeing & Retention Risk Center
// Reference date: March 12, 2026
// Burnout scores calculated from: hours, call-outs, schedule changes,
// consecutive days, overtime, PTO utilization, weekend load

export type BurnoutLevel = 'low' | 'medium' | 'high' | 'critical'
export type RetentionRisk = 'low' | 'medium' | 'high'

export interface WellbeingRecord {
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
  burnoutScore: number        // 0–100, higher = more burned out
  engagementScore: number     // 0–100, higher = more engaged
  burnoutLevel: BurnoutLevel
  retentionRisk: RetentionRisk
  retentionCostIfLeft: number // $ replacement estimate
  factors: {
    consecutiveDays: number
    hoursLast2Weeks: number
    unplannedChanges: number  // schedule changes in past 30 days
    callOutsLast30d: number
    overtimeHours: number
    ptoDaysTaken: number      // this year; 0 = red flag
    weekendShifts: number     // last 4 weeks
  }
  engagementTrend: number[]   // 8 weekly scores, oldest → newest
  lastPulseDate: string | null
  lastPulseScore: number | null  // 1–5
  recommendedActions: string[]
  topRiskFactor: string
}

export interface ActionQueueItem {
  id: string
  staffId: string
  staffName: string
  priority: 'urgent' | 'high' | 'medium'
  action: string
  reason: string
  estimatedImpact: string
  completed: boolean
}

export interface HospitalWellbeingSummary {
  retentionHealthScore: number   // 0–100
  retentionScoreTrend: number    // Δ vs last week
  atHighRisk: number
  avgEngagementScore: number
  ptoUtilizationPct: number
  pulseResponseRate: number      // % responded this week
  potentialTurnoverSavings: number  // $ if interventions succeed
}

// ─── Staff records ─────────────────────────────────────────────────────────────

export const wellbeingRecords: WellbeingRecord[] = [
  {
    staffId: 'e021',
    name: 'Lisa Greenwald',
    avatarInitials: 'LG',
    role: 'RN',
    unit: 'NICU',
    burnoutScore: 78,
    engagementScore: 55,
    burnoutLevel: 'critical',
    retentionRisk: 'high',
    retentionCostIfLeft: 58000,
    factors: {
      consecutiveDays: 6,
      hoursLast2Weeks: 92,
      unplannedChanges: 4,
      callOutsLast30d: 2,
      overtimeHours: 12,
      ptoDaysTaken: 0,
      weekendShifts: 5,
    },
    engagementTrend: [78, 75, 70, 68, 65, 62, 58, 55],
    lastPulseDate: 'Mar 5',
    lastPulseScore: 2,
    recommendedActions: [
      'Approve PTO immediately — Lisa has taken 0 days this year',
      'Cap at 36 hrs/week for next 4 weeks — 12 OT hrs is unsustainable',
      'Offer NICU peer support group referral',
      'Schedule wellbeing check-in with unit manager this week',
    ],
    topRiskFactor: '92 hrs/2 wks · 0 PTO days · 6 consecutive shifts',
  },
  {
    staffId: 'e002',
    name: 'James Okafor',
    avatarInitials: 'JO',
    role: 'RN',
    unit: 'ICU',
    burnoutScore: 72,
    engagementScore: 45,
    burnoutLevel: 'high',
    retentionRisk: 'high',
    retentionCostIfLeft: 52000,
    factors: {
      consecutiveDays: 3,
      hoursLast2Weeks: 72,
      unplannedChanges: 5,
      callOutsLast30d: 4,
      overtimeHours: 0,
      ptoDaysTaken: 0,
      weekendShifts: 4,
    },
    engagementTrend: [75, 70, 65, 60, 55, 52, 48, 45],
    lastPulseDate: 'Feb 28',
    lastPulseScore: 2,
    recommendedActions: [
      'Schedule 1:1 wellbeing conversation this week',
      'Review 4 call-outs in 30 days — HR involvement may be needed',
      'Reduce weekend assignments for 30 days',
      'Address 0 PTO days — consider mandatory day off next pay period',
    ],
    topRiskFactor: '4 call-outs in 30 days · engagement declining for 8 weeks',
  },
  {
    staffId: 's005',
    name: 'Tyler Barnes',
    avatarInitials: 'TB',
    role: 'CNA',
    unit: 'Med-Surg B',
    burnoutScore: 68,
    engagementScore: 42,
    burnoutLevel: 'high',
    retentionRisk: 'high',
    retentionCostIfLeft: 38000,
    factors: {
      consecutiveDays: 2,
      hoursLast2Weeks: 60,
      unplannedChanges: 6,
      callOutsLast30d: 3,
      overtimeHours: 0,
      ptoDaysTaken: 0,
      weekendShifts: 4,
    },
    engagementTrend: [65, 62, 60, 58, 55, 52, 48, 42],
    lastPulseDate: 'Feb 28',
    lastPulseScore: 2,
    recommendedActions: [
      'Root-cause check-in after today\'s no-show — determine what changed',
      '6 unplanned schedule changes signals schedule mismatch — run preference survey',
      'Review weekend load — 4 of last 4 weekends scheduled',
    ],
    topRiskFactor: '6 unplanned changes · 3 call-outs · no-show today',
  },
  {
    staffId: 's001',
    name: 'Sarah Chen',
    avatarInitials: 'SC',
    role: 'RN',
    unit: 'Float Pool',
    burnoutScore: 58,
    engagementScore: 67,
    burnoutLevel: 'high',
    retentionRisk: 'medium',
    retentionCostIfLeft: 48000,
    factors: {
      consecutiveDays: 5,
      hoursLast2Weeks: 84,
      unplannedChanges: 3,
      callOutsLast30d: 1,
      overtimeHours: 4,
      ptoDaysTaken: 1,
      weekendShifts: 3,
    },
    engagementTrend: [85, 83, 80, 78, 75, 72, 70, 67],
    lastPulseDate: 'Mar 7',
    lastPulseScore: 3,
    recommendedActions: [
      'Proactively offer a PTO day — 5 consecutive days is the threshold',
      'Ensure 2-day rest window before next float assignment',
      'Float pool discussion: discuss preferred unit rotations',
    ],
    topRiskFactor: '5 consecutive days · 84 hrs/2 wks · declining 8-week trend',
  },
  {
    staffId: 'e007',
    name: 'Nathan Foster',
    avatarInitials: 'NF',
    role: 'Charge RN',
    unit: 'Med-Surg B',
    burnoutScore: 45,
    engagementScore: 63,
    burnoutLevel: 'medium',
    retentionRisk: 'medium',
    retentionCostIfLeft: 54000,
    factors: {
      consecutiveDays: 4,
      hoursLast2Weeks: 76,
      unplannedChanges: 3,
      callOutsLast30d: 2,
      overtimeHours: 2,
      ptoDaysTaken: 1,
      weekendShifts: 3,
    },
    engagementTrend: [72, 74, 71, 69, 72, 68, 65, 63],
    lastPulseDate: 'Mar 7',
    lastPulseScore: 3,
    recommendedActions: [
      'Friday call-out pattern (3 of 6 Fridays) — discuss flexibility options',
      'Charge role stress check-in — managing team tension?',
    ],
    topRiskFactor: 'Friday call-out pattern · slight declining engagement',
  },
  {
    staffId: 's002',
    name: 'Marcus Williams',
    avatarInitials: 'MW',
    role: 'RN',
    unit: 'Float Pool',
    burnoutScore: 32,
    engagementScore: 79,
    burnoutLevel: 'medium',
    retentionRisk: 'low',
    retentionCostIfLeft: 48000,
    factors: {
      consecutiveDays: 4,
      hoursLast2Weeks: 80,
      unplannedChanges: 2,
      callOutsLast30d: 0,
      overtimeHours: 6,
      ptoDaysTaken: 2,
      weekendShifts: 3,
    },
    engagementTrend: [80, 82, 79, 81, 78, 80, 77, 79],
    lastPulseDate: 'Mar 7',
    lastPulseScore: 4,
    recommendedActions: [
      'Monitor: 6 OT hours this period — watch for trajectory shift',
      'Recognize publicly — zero call-outs, strong engagement score',
    ],
    topRiskFactor: '6 OT hours this period — watch trajectory',
  },
  {
    staffId: 'e001',
    name: 'Priya Sharma',
    avatarInitials: 'PS',
    role: 'Charge RN',
    unit: 'ICU',
    burnoutScore: 12,
    engagementScore: 91,
    burnoutLevel: 'low',
    retentionRisk: 'low',
    retentionCostIfLeft: 56000,
    factors: {
      consecutiveDays: 3,
      hoursLast2Weeks: 72,
      unplannedChanges: 1,
      callOutsLast30d: 0,
      overtimeHours: 0,
      ptoDaysTaken: 4,
      weekendShifts: 2,
    },
    engagementTrend: [88, 90, 89, 91, 88, 90, 92, 91],
    lastPulseDate: 'Mar 11',
    lastPulseScore: 5,
    recommendedActions: [
      'Consider for Peer Mentor role — high engagement, zero call-outs',
      'Positive signal: 4 PTO days used, healthy work-life balance model',
    ],
    topRiskFactor: 'No significant risk — model employee',
  },
  {
    staffId: 'e016',
    name: 'Christine Park',
    avatarInitials: 'CP',
    role: 'Charge RN',
    unit: 'Med-Surg B',
    burnoutScore: 8,
    engagementScore: 94,
    burnoutLevel: 'low',
    retentionRisk: 'low',
    retentionCostIfLeft: 52000,
    factors: {
      consecutiveDays: 2,
      hoursLast2Weeks: 72,
      unplannedChanges: 0,
      callOutsLast30d: 0,
      overtimeHours: 0,
      ptoDaysTaken: 5,
      weekendShifts: 2,
    },
    engagementTrend: [92, 91, 93, 94, 92, 93, 95, 94],
    lastPulseDate: 'Mar 11',
    lastPulseScore: 5,
    recommendedActions: [
      'Consistently highest engagement — public recognition opportunity',
      '5 PTO days taken, 0 call-outs — share as a team benchmark',
    ],
    topRiskFactor: 'No risk factors — recognition opportunity',
  },
]

// ─── Hospital-wide summary ────────────────────────────────────────────────────

export const hospitalWellbeing: HospitalWellbeingSummary = {
  retentionHealthScore: 73,
  retentionScoreTrend: -2,
  atHighRisk: 3,    // critical + high risk
  avgEngagementScore: 67,
  ptoUtilizationPct: 64,
  pulseResponseRate: 62,
  potentialTurnoverSavings: 76500,
}

// ─── 8-week hospital-wide engagement trend ────────────────────────────────────

export const hospitalEngagementTrend = [72, 73, 71, 70, 72, 71, 68, 67]
export const TREND_WEEK_LABELS = ['Jan 22', 'Jan 29', 'Feb 5', 'Feb 12', 'Feb 19', 'Feb 26', 'Mar 5', 'Mar 12']

// ─── Manager action queue ─────────────────────────────────────────────────────

const _actionQueue: ActionQueueItem[] = [
  {
    id: 'aq001',
    staffId: 'e021',
    staffName: 'Lisa Greenwald',
    priority: 'urgent',
    action: 'Approve PTO — 0 days taken this year',
    reason: 'Critical burnout risk · 92 hrs/2 wks · 12 OT hours',
    estimatedImpact: 'Reduces burnout score ~18 pts; saves $58K replacement',
    completed: false,
  },
  {
    id: 'aq002',
    staffId: 'e002',
    staffName: 'James Okafor',
    priority: 'urgent',
    action: 'Schedule 1:1 wellbeing conversation',
    reason: '4 call-outs in 30 days · engagement at 45/100 and falling',
    estimatedImpact: 'Early intervention saves $52K replacement cost',
    completed: false,
  },
  {
    id: 'aq003',
    staffId: 's005',
    staffName: 'Tyler Barnes',
    priority: 'high',
    action: 'Root-cause check-in after today\'s no-show',
    reason: '3 call-outs + 6 schedule changes + engagement at 42',
    estimatedImpact: 'Prevents likely disengagement escalation',
    completed: false,
  },
  {
    id: 'aq004',
    staffId: 's001',
    staffName: 'Sarah Chen',
    priority: 'medium',
    action: 'Offer proactive PTO day this week',
    reason: '5 consecutive days worked · float pool fatigue pattern',
    estimatedImpact: 'Prevents predicted Saturday call-out (78% risk)',
    completed: false,
  },
  {
    id: 'aq005',
    staffId: 'e001',
    staffName: 'Priya Sharma',
    priority: 'medium',
    action: 'Nominate for Peer Mentor Program',
    reason: 'Highest engagement (91) · zero call-outs · strong PTO habits',
    estimatedImpact: 'Leverages top performer to support at-risk staff',
    completed: false,
  },
]

// ─── Mutable state ─────────────────────────────────────────────────────────────

let _actions = _actionQueue.map(a => ({ ...a }))
const _sentCheckIns = new Set<string>()
let _pulseCount = 5  // already 5 of 8 responded this week

export function getActionQueue(): ActionQueueItem[] {
  return _actions
}

export function completeAction(id: string): void {
  const item = _actions.find(a => a.id === id)
  if (item) item.completed = true
}

export function sendPulseCheckIn(staffId?: string): number {
  if (staffId) {
    if (!_sentCheckIns.has(staffId)) {
      _sentCheckIns.add(staffId)
      return 1
    }
    return 0
  }
  // Bulk — send to all who haven't received one
  let count = 0
  wellbeingRecords.forEach(r => {
    if (!_sentCheckIns.has(r.staffId)) {
      _sentCheckIns.add(r.staffId)
      count++
    }
  })
  _pulseCount += count
  return count
}

export function hasSentCheckIn(staffId: string): boolean {
  return _sentCheckIns.has(staffId)
}

export function getPulseCount(): number {
  return _pulseCount
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const BURNOUT_META: Record<BurnoutLevel, { label: string; color: string; bg: string; dot: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500',    border: 'border-l-red-500' },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500', border: 'border-l-orange-400' },
  medium:   { label: 'Medium',   color: 'text-amber-700',  bg: 'bg-amber-100',  dot: 'bg-amber-500',  border: 'border-l-amber-400' },
  low:      { label: 'Low',      color: 'text-emerald-700',bg: 'bg-emerald-100',dot: 'bg-emerald-500',border: 'border-l-emerald-400' },
}

export const PRIORITY_META: Record<ActionQueueItem['priority'], { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-700',    bg: 'bg-red-100' },
  high:   { label: 'High',   color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { label: 'Medium', color: 'text-amber-700',  bg: 'bg-amber-100' },
}
