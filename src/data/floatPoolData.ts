// ── Float Pool Manager Data ──────────────────────────────────────────────────
// Date context: March 13, 2026 (Friday, Day shift starting)

export type AvailStatus = 'available' | 'assigned' | 'on-call' | 'unavailable' | 'dnr'
export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Telemetry'
export type ShiftType = 'day' | 'evening' | 'night'
export type FloatTier = 1 | 2 | 3  // 3 = all units, 2 = 3-4 units, 1 = 1-2 units
export type NeedReason = 'callout' | 'short-staffed' | 'surge' | 'vacancy'
export type NeedPriority = 'urgent' | 'high' | 'normal'
export type AssignStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface FloatNurse {
  id: string
  name: string
  initials: string
  color: string
  phone: string
  yearsExp: number
  tier: FloatTier
  units: UnitKey[]
  primaryUnit: UnitKey
  status: AvailStatus
  hoursThisPeriod: number
  hoursTarget: number  // monthly PRN target
  lastWorked: string   // date string
  rating: number       // 1.0–5.0 from charge feedback
  totalAssignments: number
  recentUnits: UnitKey[]  // last 3 assignment units
  preferredShift: ShiftType
  notes?: string
  certifications: string[]
}

export interface ShiftNeed {
  id: string
  unit: UnitKey
  shift: ShiftType
  date: string        // 'Mar 13' etc.
  dateKey: string     // 'today' | 'tomorrow' | 'sat' etc.
  reason: NeedReason
  priority: NeedPriority
  neededByTime: string  // '06:30 AM'
  callOutName?: string  // who called out
  filledById?: string
  filledAt?: string
}

export interface FloatAssignment {
  id: string
  nurseId: string
  nurseName: string
  needId: string
  unit: UnitKey
  shift: ShiftType
  date: string
  status: AssignStatus
  assignedAt: string
  confirmedAt?: string
  note?: string
}

// ── Float Pool Nurses (12 nurses) ────────────────────────────────────────────

const _nurses: FloatNurse[] = [
  {
    id: 'fp-001', name: 'Sarah O\'Brien', initials: 'SO',
    color: 'from-violet-500 to-violet-700',
    phone: '(555) 204-1183', yearsExp: 8, tier: 3,
    units: ['ICU', 'CCU', 'ED', 'MS-A', 'Telemetry'],
    primaryUnit: 'ICU', status: 'available',
    hoursThisPeriod: 48, hoursTarget: 80,
    lastWorked: 'Mar 11', rating: 4.9, totalAssignments: 142,
    recentUnits: ['ICU', 'CCU', 'ICU'], preferredShift: 'day',
    certifications: ['ACLS', 'CCRN', 'TNCC'],
  },
  {
    id: 'fp-002', name: 'James Rodriguez', initials: 'JR',
    color: 'from-sky-500 to-sky-700',
    phone: '(555) 317-4402', yearsExp: 5, tier: 2,
    units: ['MS-A', 'MS-B', 'Telemetry'],
    primaryUnit: 'MS-A', status: 'available',
    hoursThisPeriod: 32, hoursTarget: 64,
    lastWorked: 'Mar 10', rating: 4.5, totalAssignments: 88,
    recentUnits: ['MS-A', 'Telemetry', 'MS-B'], preferredShift: 'evening',
    certifications: ['BLS', 'ACLS'],
  },
  {
    id: 'fp-003', name: 'Amanda Walsh', initials: 'AW',
    color: 'from-emerald-500 to-emerald-700',
    phone: '(555) 491-8837', yearsExp: 11, tier: 2,
    units: ['ICU', 'CCU', 'Telemetry'],
    primaryUnit: 'CCU', status: 'assigned',
    hoursThisPeriod: 64, hoursTarget: 80,
    lastWorked: 'Mar 13', rating: 4.7, totalAssignments: 201,
    recentUnits: ['ICU', 'ICU', 'CCU'], preferredShift: 'day',
    certifications: ['ACLS', 'CCRN', 'NRP'],
    notes: 'Assigned ICU day shift today (covering M. Gonzalez callout)',
  },
  {
    id: 'fp-004', name: 'Marcus Rivera', initials: 'MR',
    color: 'from-red-500 to-red-700',
    phone: '(555) 628-0015', yearsExp: 7, tier: 2,
    units: ['ED', 'Telemetry', 'MS-B'],
    primaryUnit: 'ED', status: 'available',
    hoursThisPeriod: 40, hoursTarget: 80,
    lastWorked: 'Mar 12', rating: 4.6, totalAssignments: 113,
    recentUnits: ['ED', 'Telemetry', 'ED'], preferredShift: 'evening',
    certifications: ['ACLS', 'TNCC', 'ENPC'],
  },
  {
    id: 'fp-005', name: 'Karen Liu', initials: 'KL',
    color: 'from-amber-500 to-amber-700',
    phone: '(555) 752-3369', yearsExp: 14, tier: 3,
    units: ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Telemetry'],
    primaryUnit: 'ICU', status: 'unavailable',
    hoursThisPeriod: 28, hoursTarget: 80,
    lastWorked: 'Mar 8', rating: 4.8, totalAssignments: 289,
    recentUnits: ['ICU', 'ED', 'ICU'], preferredShift: 'day',
    certifications: ['ACLS', 'CCRN', 'TNCC', 'NRP', 'PALS'],
    notes: 'Day off — returns Mar 14. Only 28h of 80h target used — priority for next week.',
  },
  {
    id: 'fp-006', name: 'Derek Johnson', initials: 'DJ',
    color: 'from-teal-500 to-teal-700',
    phone: '(555) 883-4421', yearsExp: 3, tier: 1,
    units: ['MS-A', 'MS-B'],
    primaryUnit: 'MS-B', status: 'available',
    hoursThisPeriod: 56, hoursTarget: 64,
    lastWorked: 'Mar 12', rating: 4.2, totalAssignments: 47,
    recentUnits: ['MS-B', 'MS-A', 'MS-B'], preferredShift: 'day',
    certifications: ['BLS', 'ACLS'],
  },
  {
    id: 'fp-007', name: 'Priya Patel', initials: 'PP',
    color: 'from-purple-500 to-purple-700',
    phone: '(555) 119-7753', yearsExp: 6, tier: 2,
    units: ['CCU', 'Telemetry', 'MS-A'],
    primaryUnit: 'Telemetry', status: 'on-call',
    hoursThisPeriod: 44, hoursTarget: 64,
    lastWorked: 'Mar 12', rating: 4.4, totalAssignments: 96,
    recentUnits: ['Telemetry', 'CCU', 'Telemetry'], preferredShift: 'evening',
    certifications: ['ACLS', 'CCRN'],
    notes: 'On-call until 3 PM. Can be called in with 1h notice.',
  },
  {
    id: 'fp-008', name: 'Nathan Brooks', initials: 'NB',
    color: 'from-cyan-500 to-cyan-700',
    phone: '(555) 340-8824', yearsExp: 9, tier: 2,
    units: ['ICU', 'ED', 'CCU'],
    primaryUnit: 'ICU', status: 'available',
    hoursThisPeriod: 36, hoursTarget: 80,
    lastWorked: 'Mar 11', rating: 4.7, totalAssignments: 158,
    recentUnits: ['ICU', 'ED', 'ICU'], preferredShift: 'night',
    certifications: ['ACLS', 'CCRN', 'TNCC'],
  },
  {
    id: 'fp-009', name: 'Tina Morales', initials: 'TM',
    color: 'from-pink-500 to-pink-700',
    phone: '(555) 467-2251', yearsExp: 4, tier: 1,
    units: ['MS-A', 'MS-B', 'Telemetry'],
    primaryUnit: 'MS-A', status: 'available',
    hoursThisPeriod: 60, hoursTarget: 64,
    lastWorked: 'Mar 12', rating: 4.3, totalAssignments: 62,
    recentUnits: ['MS-A', 'MS-A', 'Telemetry'], preferredShift: 'day',
    certifications: ['BLS', 'ACLS'],
  },
  {
    id: 'fp-010', name: 'Roy Kimura', initials: 'RK',
    color: 'from-indigo-500 to-indigo-700',
    phone: '(555) 592-6648', yearsExp: 10, tier: 2,
    units: ['ED', 'Telemetry', 'CCU'],
    primaryUnit: 'ED', status: 'assigned',
    hoursThisPeriod: 72, hoursTarget: 80,
    lastWorked: 'Mar 13', rating: 4.6, totalAssignments: 174,
    recentUnits: ['ED', 'ED', 'Telemetry'], preferredShift: 'evening',
    certifications: ['ACLS', 'TNCC', 'ENPC'],
    notes: 'Assigned ED evening shift today.',
  },
  {
    id: 'fp-011', name: 'Lisa Chang', initials: 'LC',
    color: 'from-slate-500 to-slate-700',
    phone: '(555) 726-3317', yearsExp: 12, tier: 3,
    units: ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Telemetry'],
    primaryUnit: 'CCU', status: 'dnr',
    hoursThisPeriod: 0, hoursTarget: 0,
    lastWorked: 'Dec 15', rating: 2.1, totalAssignments: 33,
    recentUnits: ['CCU'], preferredShift: 'day',
    certifications: ['ACLS'],
    notes: 'Do Not Return — issued Jan 2026. No call-outs without manager approval.',
  },
  {
    id: 'fp-012', name: 'Ben Foster', initials: 'BF',
    color: 'from-orange-500 to-orange-700',
    phone: '(555) 851-4490', yearsExp: 6, tier: 2,
    units: ['ICU', 'CCU', 'MS-A'],
    primaryUnit: 'CCU', status: 'unavailable',
    hoursThisPeriod: 76, hoursTarget: 80,
    lastWorked: 'Mar 12', rating: 4.4, totalAssignments: 109,
    recentUnits: ['CCU', 'ICU', 'MS-A'], preferredShift: 'night',
    certifications: ['ACLS', 'CCRN'],
    notes: 'Hours nearly exhausted this period (76/80h). Available after next pay period.',
  },
]

// ── Open Shift Needs ─────────────────────────────────────────────────────────

const _needs: ShiftNeed[] = [
  {
    id: 'need-001', unit: 'ICU', shift: 'day', date: 'Mar 13', dateKey: 'today',
    reason: 'callout', priority: 'urgent', neededByTime: '07:00 AM',
    callOutName: 'Maria Gonzalez',
  },
  {
    id: 'need-002', unit: 'ED', shift: 'night', date: 'Mar 13', dateKey: 'today',
    reason: 'surge', priority: 'urgent', neededByTime: '11:00 PM',
  },
  {
    id: 'need-003', unit: 'Telemetry', shift: 'evening', date: 'Mar 13', dateKey: 'today',
    reason: 'short-staffed', priority: 'high', neededByTime: '03:00 PM',
  },
  {
    id: 'need-004', unit: 'MS-B', shift: 'day', date: 'Mar 14', dateKey: 'tomorrow',
    reason: 'vacancy', priority: 'normal', neededByTime: '07:00 AM',
  },
  {
    id: 'need-005', unit: 'CCU', shift: 'evening', date: 'Mar 14', dateKey: 'tomorrow',
    reason: 'callout', priority: 'high', neededByTime: '03:00 PM',
    callOutName: 'Tom Bradley',
  },
  {
    id: 'need-006', unit: 'ICU', shift: 'night', date: 'Mar 15', dateKey: 'sat',
    reason: 'short-staffed', priority: 'normal', neededByTime: '11:00 PM',
  },
]

// ── Session-mutable assignment log ──────────────────────────────────────────

let _assignments: FloatAssignment[] = [
  {
    id: 'asgn-hist-001', nurseId: 'fp-003', nurseName: 'Amanda Walsh',
    needId: 'need-hist-01', unit: 'ICU', shift: 'day', date: 'Mar 13',
    status: 'confirmed', assignedAt: '05:48 AM', confirmedAt: '05:52 AM',
  },
  {
    id: 'asgn-hist-002', nurseId: 'fp-010', nurseName: 'Roy Kimura',
    needId: 'need-hist-02', unit: 'ED', shift: 'evening', date: 'Mar 13',
    status: 'confirmed', assignedAt: '06:12 AM', confirmedAt: '06:15 AM',
  },
]

// ── Smart matching logic ─────────────────────────────────────────────────────

export function matchScore(nurse: FloatNurse, need: ShiftNeed): number {
  if (!nurse.units.includes(need.unit)) return 0
  if (nurse.status !== 'available' && nurse.status !== 'on-call') return 0
  let score = 50
  // Tier bonus
  score += (nurse.tier - 1) * 10
  // Rating bonus
  score += (nurse.rating - 3) * 8
  // Hours headroom bonus (not close to limit)
  const headroom = nurse.hoursTarget - nurse.hoursThisPeriod
  if (headroom > 20) score += 10
  else if (headroom < 8) score -= 20
  // Preferred shift match
  if (nurse.preferredShift === need.shift) score += 8
  // Recent unit familiarity
  if (nurse.recentUnits.includes(need.unit)) score += 12
  // On-call slight penalty (need to wake them up)
  if (nurse.status === 'on-call') score -= 5
  // Primary unit match
  if (nurse.primaryUnit === need.unit) score += 5
  return Math.max(0, Math.min(100, score))
}

export function getBestMatches(needId: string, topN = 3): Array<{ nurse: FloatNurse; score: number }> {
  const need = _needs.find(n => n.id === needId)
  if (!need) return []
  return _nurses
    .map(nurse => ({ nurse, score: matchScore(nurse, need) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

// ── Assignments ──────────────────────────────────────────────────────────────

export function assignFloat(nurseId: string, needId: string, note?: string): FloatAssignment {
  const nurse = _nurses.find(n => n.id === nurseId)!
  const need  = _needs.find(n => n.id === needId)!
  // Mark need filled
  need.filledById = nurseId
  need.filledAt   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  // Mark nurse assigned
  nurse.status = 'assigned'
  nurse.notes  = `Assigned ${need.unit} ${need.shift} shift ${need.date}`
  const asgn: FloatAssignment = {
    id: `asgn-${Date.now()}`,
    nurseId, nurseName: nurse.name,
    needId, unit: need.unit, shift: need.shift, date: need.date,
    status: 'confirmed',
    assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    note,
  }
  _assignments.unshift(asgn)
  return asgn
}

export function updateNurseStatus(nurseId: string, status: AvailStatus) {
  const n = _nurses.find(n => n.id === nurseId)
  if (n) n.status = status
}

// ── Accessors ────────────────────────────────────────────────────────────────

export function getNurses(): FloatNurse[] { return _nurses }
export function getNurse(id: string): FloatNurse | undefined { return _nurses.find(n => n.id === id) }
export function getOpenNeeds(): ShiftNeed[] { return _needs.filter(n => !n.filledById) }
export function getAllNeeds(): ShiftNeed[] { return _needs }
export function getAssignments(): FloatAssignment[] { return _assignments }

export function getPoolStats() {
  const nurses = getNurses()
  const available = nurses.filter(n => n.status === 'available').length
  const onCall    = nurses.filter(n => n.status === 'on-call').length
  const assigned  = nurses.filter(n => n.status === 'assigned').length
  const openNeeds = getOpenNeeds().length
  const filledToday = _assignments.filter(a => a.date === 'Mar 13').length
  const totalHours = nurses.reduce((s, n) => s + n.hoursThisPeriod, 0)
  const targetHours = nurses.filter(n => n.status !== 'dnr').reduce((s, n) => s + n.hoursTarget, 0)
  const agencyAvoided = filledToday * 12 * 85  // 12h shift × $85 agency rate
  return { available, onCall, assigned, openNeeds, filledToday, totalHours, targetHours, agencyAvoided }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export const UNIT_COLORS: Record<UnitKey, string> = {
  'ICU':       'bg-red-100 text-red-700 border-red-200',
  'CCU':       'bg-orange-100 text-orange-700 border-orange-200',
  'ED':        'bg-purple-100 text-purple-700 border-purple-200',
  'MS-A':      'bg-sky-100 text-sky-700 border-sky-200',
  'MS-B':      'bg-teal-100 text-teal-700 border-teal-200',
  'Telemetry': 'bg-amber-100 text-amber-700 border-amber-200',
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  day: 'Day (7A–7P)', evening: 'Evening (3P–11P)', night: 'Night (11P–7A)',
}

export const REASON_LABELS: Record<NeedReason, string> = {
  callout: 'Call-out', 'short-staffed': 'Short-staffed', surge: 'Surge', vacancy: 'Open vacancy',
}

export const STATUS_META: Record<AvailStatus, { label: string; dot: string; ring: string }> = {
  available:   { label: 'Available',   dot: 'bg-emerald-500', ring: 'ring-emerald-400' },
  assigned:    { label: 'Assigned',    dot: 'bg-sky-500',     ring: 'ring-sky-400' },
  'on-call':   { label: 'On-Call',     dot: 'bg-amber-500',   ring: 'ring-amber-400' },
  unavailable: { label: 'Unavailable', dot: 'bg-slate-400',   ring: 'ring-slate-300' },
  dnr:         { label: 'DNR',         dot: 'bg-red-500',     ring: 'ring-red-400' },
}

export const PERIOD_LABELS: Record<string, string> = {
  today: 'Today · Mar 13',
  tomorrow: 'Tomorrow · Mar 14',
  weekend: 'This Weekend · Mar 14–15',
}
