// coverageData.ts — Coverage Command Center
// Reference date: March 12, 2026 (Thursday) — Day shift starts 7:00 AM

export type ShiftType = 'day' | 'evening' | 'night'
export type CallOutReason = 'sick' | 'family' | 'bereavement' | 'no-show' | 'weather' | 'personal' | 'injury'
export type GapStatus = 'open' | 'notified' | 'filled' | 'escalated' | 'uncovered'
export type FillSource = 'float' | 'internal' | 'overtime' | 'agency'

export const SHIFT_INFO: Record<ShiftType, { start: string; end: string; label: string; hours: number }> = {
  day:     { start: '7:00 AM', end: '7:00 PM',  label: 'Day (7a–7p)',    hours: 12 },
  evening: { start: '3:00 PM', end: '11:00 PM', label: 'Eve (3p–11p)',   hours: 8  },
  night:   { start: '7:00 PM', end: '7:00 AM',  label: 'Night (7p–7a)', hours: 12 },
}

export const REASON_META: Record<CallOutReason, { label: string; emoji: string; color: string }> = {
  sick:        { label: 'Sick',        emoji: '🤒', color: 'text-red-600' },
  family:      { label: 'Family',      emoji: '👨‍👩‍👧', color: 'text-blue-600' },
  bereavement: { label: 'Bereavement', emoji: '💐', color: 'text-violet-600' },
  'no-show':   { label: 'No-Show',     emoji: '⛔', color: 'text-slate-600' },
  weather:     { label: 'Weather',     emoji: '🌧️', color: 'text-sky-600' },
  personal:    { label: 'Personal',    emoji: '👤', color: 'text-teal-600' },
  injury:      { label: 'Injury',      emoji: '🩹', color: 'text-orange-600' },
}

export interface FillSuggestion {
  id: string
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
  fillSource: FillSource
  available: boolean
  overtimeFlag: boolean
  hoursThisWeek: number
  hourlyRate: number
  additionalCost: number   // premium vs scheduled cost; 0 = same cost
  credentialsOk: boolean
  credentialNote?: string
  reliabilityScore: number // 0–100
  lastPickupDate?: string
  notifiedAt?: string
  responseStatus?: 'pending' | 'accepted' | 'declined'
  rank: number
}

export interface CoverageGap {
  id: string
  unit: string
  unitShort: string
  position: string         // "ICU RN"
  role: string
  shiftType: ShiftType
  isoDate: string
  severity: 'critical' | 'warning' | 'info'
  source: 'callout' | 'vacancy' | 'pto'
  callOutStaffId?: string
  callOutStaffName?: string
  callOutReason?: CallOutReason
  reportedAt: string       // "5:42 AM"
  minutesOpen: number
  status: GapStatus
  filledByName?: string
  filledAt?: string
  suggestions: FillSuggestion[]
}

export interface DayForecast {
  isoDate: string
  label: string
  isToday: boolean
  coverageScore: number  // 0–100
  gaps: number
  isProjected: boolean
  severity: 'ok' | 'warning' | 'critical'
}

export interface AtRiskPrediction {
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
  riskPct: number
  riskReasons: string[]
  shiftDate: string
  shiftType: ShiftType
  suggestedActions: string[]
}

export interface PatternAlert {
  id: string
  severity: 'high' | 'medium' | 'low'
  category: 'staff' | 'shift' | 'unit' | 'capacity'
  title: string
  detail: string
  actionHint?: string
}

export interface RosterStaff {
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
}

// ─── Initial gaps ─────────────────────────────────────────────────────────────

const INITIAL_GAPS: CoverageGap[] = [
  {
    id: 'cov001',
    unit: 'Intensive Care Unit',
    unitShort: 'ICU',
    position: 'ICU RN',
    role: 'RN',
    shiftType: 'day',
    isoDate: '2026-03-12',
    severity: 'critical',
    source: 'callout',
    callOutStaffId: 'e002',
    callOutStaffName: 'James Okafor',
    callOutReason: 'sick',
    reportedAt: '5:42 AM',
    minutesOpen: 88,
    status: 'open',
    suggestions: [
      {
        id: 'sug-001-1',
        staffId: 's002',
        name: 'Marcus Williams',
        avatarInitials: 'MW',
        role: 'RN',
        unit: 'Float Pool',
        fillSource: 'float',
        available: true,
        overtimeFlag: false,
        hoursThisWeek: 34,
        hourlyRate: 47,
        additionalCost: 0,
        credentialsOk: true,
        reliabilityScore: 94,
        lastPickupDate: 'Mar 8',
        rank: 1,
      },
      {
        id: 'sug-001-2',
        staffId: 's001',
        name: 'Sarah Chen',
        avatarInitials: 'SC',
        role: 'RN',
        unit: 'Float Pool',
        fillSource: 'overtime',
        available: true,
        overtimeFlag: true,
        hoursThisWeek: 37,
        hourlyRate: 47,
        additionalCost: 141,
        credentialsOk: true,
        credentialNote: 'BLS due Apr 2026',
        reliabilityScore: 89,
        lastPickupDate: 'Mar 5',
        rank: 2,
      },
      {
        id: 'sug-001-3',
        staffId: 'agency-icu',
        name: 'Agency RN',
        avatarInitials: 'AG',
        role: 'RN',
        unit: 'Agency',
        fillSource: 'agency',
        available: true,
        overtimeFlag: false,
        hoursThisWeek: 0,
        hourlyRate: 71,
        additionalCost: 294,
        credentialsOk: true,
        reliabilityScore: 72,
        rank: 3,
      },
    ],
  },
  {
    id: 'cov002',
    unit: 'Med-Surg B',
    unitShort: 'Med-Surg B',
    position: 'Med-Surg CNA',
    role: 'CNA',
    shiftType: 'day',
    isoDate: '2026-03-12',
    severity: 'warning',
    source: 'callout',
    callOutStaffId: 's005',
    callOutStaffName: 'Tyler Barnes',
    callOutReason: 'no-show',
    reportedAt: '6:58 AM',
    minutesOpen: 12,
    status: 'open',
    suggestions: [
      {
        id: 'sug-002-1',
        staffId: 's006',
        name: 'Bobby Kim',
        avatarInitials: 'BK',
        role: 'CNA',
        unit: 'Float Pool',
        fillSource: 'float',
        available: true,
        overtimeFlag: false,
        hoursThisWeek: 28,
        hourlyRate: 28,
        additionalCost: 0,
        credentialsOk: true,
        reliabilityScore: 91,
        lastPickupDate: 'Mar 10',
        rank: 1,
      },
      {
        id: 'sug-002-2',
        staffId: 's007',
        name: 'Amy Santos',
        avatarInitials: 'AS',
        role: 'CNA',
        unit: 'Float Pool',
        fillSource: 'overtime',
        available: true,
        overtimeFlag: true,
        hoursThisWeek: 36,
        hourlyRate: 28,
        additionalCost: 84,
        credentialsOk: true,
        reliabilityScore: 85,
        rank: 2,
      },
      {
        id: 'sug-002-3',
        staffId: 'agency-cna',
        name: 'Agency CNA',
        avatarInitials: 'AG',
        role: 'CNA',
        unit: 'Agency',
        fillSource: 'agency',
        available: true,
        overtimeFlag: false,
        hoursThisWeek: 0,
        hourlyRate: 42,
        additionalCost: 180,
        credentialsOk: true,
        reliabilityScore: 68,
        rank: 3,
      },
    ],
  },
]

// ─── Mutable state ─────────────────────────────────────────────────────────────

let _gaps: CoverageGap[] = INITIAL_GAPS.map(g => ({
  ...g,
  suggestions: g.suggestions.map(s => ({ ...s })),
}))

let _filledToday = 0

export function getCoverageGaps(): CoverageGap[] {
  return _gaps
}

export function getFilledToday(): number {
  return _filledToday
}

export function markNotified(gapId: string, suggestionId: string, timeStr: string): void {
  const gap = _gaps.find(g => g.id === gapId)
  if (!gap) return
  const sug = gap.suggestions.find(s => s.id === suggestionId)
  if (!sug) return
  sug.notifiedAt = timeStr
  sug.responseStatus = 'pending'
  if (gap.status === 'open') gap.status = 'notified'
}

export function acceptFill(gapId: string, suggestionId: string, timeStr: string): void {
  const gap = _gaps.find(g => g.id === gapId)
  if (!gap) return
  const sug = gap.suggestions.find(s => s.id === suggestionId)
  if (!sug) return
  sug.responseStatus = 'accepted'
  gap.status = 'filled'
  gap.filledByName = sug.name
  gap.filledAt = timeStr
  _filledToday += 1
}

let _nextGapNum = 3
export function addCallOutGap(gap: CoverageGap): void {
  _nextGapNum += 1
  _gaps = [{ ...gap, id: `cov${String(_nextGapNum).padStart(3, '0')}` }, ..._gaps]
}

// ─── 7-Day forecast ────────────────────────────────────────────────────────────

export const weekForecast: DayForecast[] = [
  { isoDate: '2026-03-12', label: 'Thu 12', isToday: true,  coverageScore: 88, gaps: 2, isProjected: false, severity: 'critical' },
  { isoDate: '2026-03-13', label: 'Fri 13', isToday: false, coverageScore: 95, gaps: 1, isProjected: true,  severity: 'warning' },
  { isoDate: '2026-03-14', label: 'Sat 14', isToday: false, coverageScore: 82, gaps: 3, isProjected: true,  severity: 'warning' },
  { isoDate: '2026-03-15', label: 'Sun 15', isToday: false, coverageScore: 88, gaps: 2, isProjected: true,  severity: 'warning' },
  { isoDate: '2026-03-16', label: 'Mon 16', isToday: false, coverageScore: 74, gaps: 4, isProjected: true,  severity: 'critical' },
  { isoDate: '2026-03-17', label: 'Tue 17', isToday: false, coverageScore: 95, gaps: 1, isProjected: true,  severity: 'warning' },
  { isoDate: '2026-03-18', label: 'Wed 18', isToday: false, coverageScore: 100, gaps: 0, isProjected: true, severity: 'ok' },
]

// ─── At-risk predictions ──────────────────────────────────────────────────────

export const atRiskPredictions: AtRiskPrediction[] = [
  {
    staffId: 's001',
    name: 'Sarah Chen',
    avatarInitials: 'SC',
    role: 'RN',
    unit: 'Float Pool',
    riskPct: 78,
    riskReasons: ['5 consecutive shifts this week', 'Call-out rate 4× higher after 4+ consecutive days (historical)'],
    shiftDate: 'Sat Mar 14',
    shiftType: 'day',
    suggestedActions: ['Offer weekend PTO incentive', 'Pre-schedule Float RN replacement now'],
  },
  {
    staffId: 'e007',
    name: 'Nathan Foster',
    avatarInitials: 'NF',
    role: 'Charge RN',
    unit: 'Med-Surg B',
    riskPct: 61,
    riskReasons: ['Called out 3 of last 6 Fridays', '4 consecutive shifts this week'],
    shiftDate: 'Fri Mar 13',
    shiftType: 'evening',
    suggestedActions: ['Schedule wellness check-in today', 'Line up Float Charge RN as backup'],
  },
  {
    staffId: 's002',
    name: 'Marcus Williams',
    avatarInitials: 'MW',
    role: 'RN',
    unit: 'Float Pool',
    riskPct: 43,
    riskReasons: ['Float fatigue pattern after 34+ hrs/week', '2 extra pickups this month'],
    shiftDate: 'Sun Mar 15',
    shiftType: 'day',
    suggestedActions: ['Confirm availability proactively', 'Identify backup float staff'],
  },
]

// ─── Pattern alerts ────────────────────────────────────────────────────────────

export const patternAlerts: PatternAlert[] = [
  {
    id: 'pat001',
    severity: 'high',
    category: 'staff',
    title: 'James Okafor — 4 call-outs in 30 days',
    detail: 'All 4 on Thursdays. This is a pattern, not random. A proactive wellness conversation could reduce future absences.',
    actionHint: 'Schedule HR check-in',
  },
  {
    id: 'pat002',
    severity: 'medium',
    category: 'shift',
    title: 'Monday Day shift historically 28% understaffed',
    detail: 'Pre-scheduling float coverage by Friday reduces Monday gaps by 71%. Next Monday already shows 4 projected gaps.',
    actionHint: 'Pre-schedule Monday float',
  },
  {
    id: 'pat003',
    severity: 'medium',
    category: 'capacity',
    title: 'Float pool at 82% utilization — near limit',
    detail: 'Only 1–2 floats remain unscheduled. A weekend call-out spike could force costly agency escalation.',
    actionHint: 'Approve 2 OT pre-authorizations',
  },
  {
    id: 'pat004',
    severity: 'low',
    category: 'shift',
    title: 'Weekend call-outs run 2.1× weekday rate',
    detail: 'Adding one float nurse to the weekend rotation would reduce critical weekend gaps by ~60% based on past 8 weeks.',
    actionHint: 'Add weekend float coverage',
  },
]

// ─── Staff roster for call-out logging modal ───────────────────────────────────

export const ROSTER_STAFF: RosterStaff[] = [
  { staffId: 'e001', name: 'Priya Sharma',    avatarInitials: 'PS', role: 'Charge RN', unit: 'ICU' },
  { staffId: 'e002', name: 'James Okafor',    avatarInitials: 'JO', role: 'RN',        unit: 'ICU' },
  { staffId: 'e007', name: 'Nathan Foster',   avatarInitials: 'NF', role: 'Charge RN', unit: 'Med-Surg B' },
  { staffId: 'e016', name: 'Christine Park',  avatarInitials: 'CP', role: 'Charge RN', unit: 'Med-Surg B' },
  { staffId: 'e021', name: 'Lisa Greenwald',  avatarInitials: 'LG', role: 'RN',        unit: 'NICU' },
  { staffId: 's001', name: 'Sarah Chen',      avatarInitials: 'SC', role: 'RN',        unit: 'Float Pool' },
  { staffId: 's002', name: 'Marcus Williams', avatarInitials: 'MW', role: 'RN',        unit: 'Float Pool' },
  { staffId: 's005', name: 'Tyler Barnes',    avatarInitials: 'TB', role: 'CNA',       unit: 'Med-Surg B' },
  { staffId: 's006', name: 'Bobby Kim',       avatarInitials: 'BK', role: 'CNA',       unit: 'Float Pool' },
  { staffId: 's007', name: 'Amy Santos',      avatarInitials: 'AS', role: 'CNA',       unit: 'Float Pool' },
]

// ─── Week stats (static baseline) ─────────────────────────────────────────────

export const WEEK_STATS = {
  filledThisWeek: 6,
  avgFillMinutes: 23,
  agencyCostThisWeek: 0,
  otCostThisWeek: 318,
  totalGapsThisWeek: 8,
}
