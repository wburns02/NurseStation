// ── Safe Hours & Fatigue Monitor Data ────────────────────────────────────────
// Date context: Friday March 13, 2026 — Day Shift 07:00
// State: California (AB 394 — most restrictive nursing hours law in US)

export type FatigueZone = 'safe' | 'caution' | 'warning' | 'critical'
export type RestStatus  = 'available' | 'resting' | 'blocked'
export type UnitKey     = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Telemetry'
export type ShiftType   = 'day' | 'evening' | 'night'

export interface ShiftRecord {
  date:  string    // 'Mar 7'
  dow:   string    // 'Sat'
  start: string    // '07:00'
  end:   string    // '19:30'
  hours: number    // 12.5
  unit:  UnitKey
  type:  ShiftType
  ot:    boolean
}

export interface NurseHours {
  id:                string
  name:              string
  initials:          string
  color:             string   // gradient
  unit:              UnitKey
  role:              string
  // Rolling hour totals
  hoursThisWeek:     number   // Mon–Fri so far
  hours7d:           number   // last 7 calendar days
  hours14d:          number   // last 14 calendar days
  hoursLastShift:    number   // most recent shift duration
  consecutiveDays:   number   // days worked in a row through today
  // Rest / availability
  restStatus:        RestStatus
  lastShiftEndTime:  string   // '19:30 Mar 12'
  nextAvailableTime: string   // '05:30 AM' or 'Available now'
  hoursUntilAvail:   number   // 0 if available
  // Fatigue
  fatigueZone:       FatigueZone
  fatigueScore:      number   // 0–100 (100 = most fatigued)
  otBlockedBySystem: boolean
  pendingOtRequest:  boolean
  // Shifts
  recentShifts:      ShiftRecord[]
  // Alerts
  alerts:            string[]
}

// ── CA Compliance Rules ───────────────────────────────────────────────────────

export interface ComplianceRule {
  id:          string
  source:      string
  title:       string
  description: string
  limit:       string
  consequence: string
  severity:    'law' | 'policy' | 'best-practice'
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'ca-ab394',
    source: 'CA AB 394 / Labor Code §1199',
    title: 'Prohibition on Mandatory Overtime',
    description: 'Nurses cannot be required to work more than agreed-upon, regularly scheduled hours. Emergency exceptions require documentation.',
    limit: 'No mandatory overtime beyond scheduled shift without consent',
    consequence: 'Hospital fine up to $25,000 per violation; nurse can refuse without retaliation',
    severity: 'law',
  },
  {
    id: 'ca-ratio',
    source: 'CA Health & Safety Code §1276.4',
    title: 'Minimum Staffing Ratios',
    description: 'Unit-specific nurse-to-patient ratios must be maintained at all times, including during breaks.',
    limit: 'ICU: 1:2 · ED: 1:4 · MS: 1:5 · Tele: 1:5 · CCU: 1:2',
    consequence: 'Facility license suspension; immediate DPH investigation',
    severity: 'law',
  },
  {
    id: 'jhc-60hr',
    source: 'Mercy General Hospital Policy HR-214',
    title: '60-Hour Weekly Limit',
    description: 'No employee may work more than 60 hours in a 7-day period. OT approval required above 40 hours.',
    limit: '60h/week maximum · 40h requires OT approval',
    consequence: 'Shift blocked by system; manager notification required',
    severity: 'policy',
  },
  {
    id: 'jhc-rest',
    source: 'Mercy General Hospital Policy HR-215',
    title: 'Mandatory Rest Between Shifts',
    description: 'A minimum 10-hour rest period must separate any two consecutive shifts. Applies to all patient-care staff.',
    limit: '10-hour minimum between shift end and next shift start',
    consequence: 'Schedule conflict flagged; auto-block in scheduling system',
    severity: 'policy',
  },
  {
    id: 'jhc-consec',
    source: 'Mercy General Hospital Policy HR-216',
    title: 'Consecutive Days Limit',
    description: 'No nurse may work more than 7 consecutive days without a day off. After day 5, fatigue assessment recommended.',
    limit: '7-day maximum consecutive; day 5+ triggers assessment',
    consequence: 'Day 6: manager review required · Day 8+: automatic schedule block',
    severity: 'policy',
  },
  {
    id: 'jhc-12hr',
    source: 'Mercy General Hospital Policy HR-213',
    title: 'Single-Shift Duration Limit',
    description: 'Shifts should not exceed 12.5 hours including overlap time. Extensions beyond 14 hours require CNO approval.',
    limit: '12.5h standard · 14h max with CNO approval',
    consequence: 'Extension >14h: incident report filed automatically',
    severity: 'policy',
  },
  {
    id: 'aacn-fatigue',
    source: 'AACN Healthy Work Environment Standards',
    title: 'Fatigue Risk Screening',
    description: 'Assess nurse fatigue risk before assignment to high-acuity patients. Nurses scoring >70 fatigue points should not be assigned to critical patients.',
    limit: 'Fatigue score ≤70 for critical patient assignment',
    consequence: 'Reassign to lower-acuity if score exceeded',
    severity: 'best-practice',
  },
]

// ── Nurse hours roster (14 nurses) ───────────────────────────────────────────

const _nurses: NurseHours[] = [
  {
    id: 'st-004', name: 'David Thompson', initials: 'DT', color: 'from-red-500 to-red-700',
    unit: 'ED', role: 'ED RN',
    hoursThisWeek: 68, hours7d: 72, hours14d: 122,
    hoursLastShift: 14.5, consecutiveDays: 6,
    restStatus: 'blocked', lastShiftEndTime: '05:30 AM Mar 13',
    nextAvailableTime: '03:30 PM Mar 13', hoursUntilAvail: 8.5,
    fatigueZone: 'critical', fatigueScore: 94, otBlockedBySystem: true, pendingOtRequest: true,
    alerts: ['72h worked in last 7 days — exceeds 60h policy', '6 consecutive days — mandatory rest day required tomorrow', 'Last shift 14.5h — approaching 14h hard limit', 'OT request auto-blocked pending review'],
    recentShifts: [
      { date: 'Mar 7',  dow: 'Sat', start: '19:00', end: '07:30', hours: 12.5, unit: 'ED', type: 'night',   ot: false },
      { date: 'Mar 8',  dow: 'Sun', start: '07:00', end: '19:30', hours: 12.5, unit: 'ED', type: 'day',     ot: true  },
      { date: 'Mar 9',  dow: 'Mon', start: '19:00', end: '07:30', hours: 12.5, unit: 'ED', type: 'night',   ot: true  },
      { date: 'Mar 10', dow: 'Tue', start: '11:00', end: '23:00', hours: 12.0, unit: 'ED', type: 'evening', ot: true  },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'ED', type: 'day',     ot: false },
      { date: 'Mar 13', dow: 'Fri', start: '15:00', end: '05:30', hours: 14.5, unit: 'ED', type: 'evening', ot: true  },
    ],
  },
  {
    id: 'st-014', name: 'Patricia Moore', initials: 'PM', color: 'from-orange-500 to-orange-700',
    unit: 'Telemetry', role: 'Tele RN',
    hoursThisWeek: 64, hours7d: 70, hours14d: 110,
    hoursLastShift: 12.5, consecutiveDays: 7,
    restStatus: 'blocked', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: '05:30 AM Mar 13', hoursUntilAvail: 1.5,
    fatigueZone: 'critical', fatigueScore: 89, otBlockedBySystem: true, pendingOtRequest: false,
    alerts: ['7 consecutive days worked — mandatory day off required today', '70h in last 7 days — hard cap exceeded', 'Cannot be scheduled until Mar 14'],
    recentShifts: [
      { date: 'Mar 6',  dow: 'Fri', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: false },
      { date: 'Mar 7',  dow: 'Sat', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: false },
      { date: 'Mar 8',  dow: 'Sun', start: '19:00', end: '07:30', hours: 12.5, unit: 'Telemetry', type: 'night', ot: false },
      { date: 'Mar 9',  dow: 'Mon', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: true },
      { date: 'Mar 10', dow: 'Tue', start: '19:00', end: '07:30', hours: 12.5, unit: 'Telemetry', type: 'night', ot: true },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: true },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: true },
    ],
  },
  {
    id: 'st-002', name: 'Marcus Chen', initials: 'MC', color: 'from-blue-500 to-blue-700',
    unit: 'ICU', role: 'ICU RN',
    hoursThisWeek: 58, hours7d: 61, hours14d: 98,
    hoursLastShift: 12.5, consecutiveDays: 5,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'warning', fatigueScore: 76, otBlockedBySystem: false, pendingOtRequest: true,
    alerts: ['61h in last 7 days — 1h above 60h policy', 'OT request pending — recommend denial', '5 consecutive days — review before extending'],
    recentShifts: [
      { date: 'Mar 8',  dow: 'Sun', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: false },
      { date: 'Mar 9',  dow: 'Mon', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: false },
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: true },
      { date: 'Mar 11', dow: 'Wed', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: true },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: true },
    ],
  },
  {
    id: 'st-012', name: 'Amanda White', initials: 'AW', color: 'from-pink-500 to-pink-700',
    unit: 'ICU', role: 'ICU RN',
    hoursThisWeek: 54, hours7d: 57, hours14d: 92,
    hoursLastShift: 12.5, consecutiveDays: 4,
    restStatus: 'resting', lastShiftEndTime: '07:30 AM Mar 13',
    nextAvailableTime: '05:30 PM Mar 13', hoursUntilAvail: 10.5,
    fatigueZone: 'warning', fatigueScore: 72, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: ['Currently in mandatory 10h rest period — cannot start until 05:30 PM', '4 consecutive night shifts — sleep pattern disruption risk'],
    recentShifts: [
      { date: 'Mar 9',  dow: 'Mon', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: false },
      { date: 'Mar 10', dow: 'Tue', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: true },
      { date: 'Mar 13', dow: 'Fri', start: '19:00', end: '07:30', hours: 12.5, unit: 'ICU', type: 'night', ot: true },
    ],
  },
  {
    id: 'st-008', name: 'Kevin Park', initials: 'KP', color: 'from-cyan-500 to-cyan-700',
    unit: 'MS-B', role: 'Med-Surg RN',
    hoursThisWeek: 50, hours7d: 56, hours14d: 90,
    hoursLastShift: 12.5, consecutiveDays: 4,
    restStatus: 'resting', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: '05:30 AM Mar 13', hoursUntilAvail: 0.5,
    fatigueZone: 'warning', fatigueScore: 68, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: ['Rest period ends 05:30 AM — can start Day shift', 'Approaching 60h limit — no more OT this week'],
    recentShifts: [
      { date: 'Mar 9',  dow: 'Mon', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-B', type: 'day', ot: false },
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-B', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-B', type: 'day', ot: true },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-B', type: 'day', ot: true },
    ],
  },
  {
    id: 'st-006', name: 'James Wilson', initials: 'JW', color: 'from-violet-500 to-violet-700',
    unit: 'ED', role: 'ED RN',
    hoursThisWeek: 44, hours7d: 50, hours14d: 86,
    hoursLastShift: 14, consecutiveDays: 4,
    restStatus: 'resting', lastShiftEndTime: '11:00 PM Mar 12',
    nextAvailableTime: '09:00 AM Mar 13', hoursUntilAvail: 2,
    fatigueZone: 'caution', fatigueScore: 61, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: ['14h last shift — extended duration, fatigue risk elevated', 'Rest ends 09:00 AM — on track for Evening shift'],
    recentShifts: [
      { date: 'Mar 9',  dow: 'Mon', start: '07:00', end: '19:30', hours: 12.5, unit: 'ED', type: 'day', ot: false },
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'ED', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '21:00', hours: 14.0, unit: 'ED', type: 'day', ot: true },
      { date: 'Mar 12', dow: 'Thu', start: '11:00', end: '23:00', hours: 12.0, unit: 'ED', type: 'evening', ot: false },
    ],
  },
  {
    id: 'st-009', name: 'Linda Foster', initials: 'LF', color: 'from-teal-500 to-teal-700',
    unit: 'CCU', role: 'CCU RN',
    hoursThisWeek: 44, hours7d: 48, hours14d: 80,
    hoursLastShift: 12.5, consecutiveDays: 4,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'caution', fatigueScore: 54, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: ['4 consecutive days — day 5+ triggers fatigue assessment'],
    recentShifts: [
      { date: 'Mar 9',  dow: 'Mon', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-001', name: 'Sarah Kim', initials: 'SK', color: 'from-emerald-500 to-emerald-700',
    unit: 'ICU', role: 'ICU RN',
    hoursThisWeek: 38, hours7d: 42, hours14d: 76,
    hoursLastShift: 12.5, consecutiveDays: 3,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'caution', fatigueScore: 46, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: ['3 consecutive days — monitor if extended further'],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: false },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'ICU', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-013', name: 'Carlos Rivera', initials: 'CR', color: 'from-amber-500 to-amber-700',
    unit: 'MS-A', role: 'Med-Surg RN',
    hoursThisWeek: 36, hours7d: 40, hours14d: 72,
    hoursLastShift: 12.5, consecutiveDays: 3,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 12',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'caution', fatigueScore: 42, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-A', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-A', type: 'day', ot: false },
      { date: 'Mar 12', dow: 'Thu', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-A', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-003', name: 'Maria Garcia', initials: 'MG', color: 'from-rose-500 to-rose-700',
    unit: 'CCU', role: 'CCU RN',
    hoursThisWeek: 37, hours7d: 39, hours14d: 68,
    hoursLastShift: 12.5, consecutiveDays: 3,
    restStatus: 'available', lastShiftEndTime: '07:30 AM Mar 13',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'safe', fatigueScore: 36, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '19:00', end: '07:30', hours: 12.5, unit: 'CCU', type: 'night', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '19:00', end: '07:30', hours: 12.5, unit: 'CCU', type: 'night', ot: false },
      { date: 'Mar 12', dow: 'Thu', start: '19:00', end: '07:30', hours: 12.5, unit: 'CCU', type: 'night', ot: false },
    ],
  },
  {
    id: 'st-011', name: 'Christina Lee', initials: 'CL', color: 'from-purple-500 to-purple-700',
    unit: 'CCU', role: 'CCU RN',
    hoursThisWeek: 25, hours7d: 38, hours14d: 62,
    hoursLastShift: 12.5, consecutiveDays: 2,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 11',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'safe', fatigueScore: 28, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'CCU', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-007', name: 'Jennifer Martinez', initials: 'JM2', color: 'from-sky-500 to-sky-700',
    unit: 'MS-A', role: 'Med-Surg RN',
    hoursThisWeek: 24, hours7d: 36, hours14d: 60,
    hoursLastShift: 12.5, consecutiveDays: 2,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 11',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'safe', fatigueScore: 24, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-A', type: 'day', ot: false },
      { date: 'Mar 11', dow: 'Wed', start: '07:00', end: '19:30', hours: 12.5, unit: 'MS-A', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-005', name: 'Emily Davis', initials: 'ED2', color: 'from-indigo-500 to-indigo-700',
    unit: 'Telemetry', role: 'Tele RN',
    hoursThisWeek: 12, hours7d: 25, hours14d: 48,
    hoursLastShift: 12.5, consecutiveDays: 1,
    restStatus: 'available', lastShiftEndTime: '19:30 Mar 10',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'safe', fatigueScore: 16, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 10', dow: 'Tue', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: false },
      { date: 'Mar 13', dow: 'Fri', start: '07:00', end: '19:30', hours: 12.5, unit: 'Telemetry', type: 'day', ot: false },
    ],
  },
  {
    id: 'st-010', name: 'Robert Chang', initials: 'RC', color: 'from-slate-500 to-slate-700',
    unit: 'ED', role: 'ED RN',
    hoursThisWeek: 12, hours7d: 24, hours14d: 52,
    hoursLastShift: 12.0, consecutiveDays: 1,
    restStatus: 'available', lastShiftEndTime: '11:00 PM Mar 11',
    nextAvailableTime: 'Available now', hoursUntilAvail: 0,
    fatigueZone: 'safe', fatigueScore: 14, otBlockedBySystem: false, pendingOtRequest: false,
    alerts: [],
    recentShifts: [
      { date: 'Mar 11', dow: 'Wed', start: '11:00', end: '23:00', hours: 12.0, unit: 'ED', type: 'evening', ot: false },
      { date: 'Mar 13', dow: 'Fri', start: '11:00', end: '23:00', hours: 12.0, unit: 'ED', type: 'evening', ot: false },
    ],
  },
]

// ── Mutable state for OT blocks and notifications ────────────────────────────

let _otBlocks: Set<string>       = new Set(['st-004', 'st-014'])
let _notifications: Set<string> = new Set()

export function blockOT(nurseId: string) {
  _otBlocks.add(nurseId)
  const n = _nurses.find(n => n.id === nurseId)
  if (n) { n.otBlockedBySystem = true; n.pendingOtRequest = false }
}

export function unblockOT(nurseId: string) {
  _otBlocks.delete(nurseId)
  const n = _nurses.find(n => n.id === nurseId)
  if (n) n.otBlockedBySystem = false
}

export function sendNotification(nurseId: string) {
  _notifications.add(nurseId)
}

export function hasBeenNotified(nurseId: string) {
  return _notifications.has(nurseId)
}

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getNurses(): NurseHours[] { return _nurses }
export function getNurse(id: string): NurseHours | undefined { return _nurses.find(n => n.id === id) }

export function getStats() {
  const n = _nurses
  const critical = n.filter(x => x.fatigueZone === 'critical').length
  const warning  = n.filter(x => x.fatigueZone === 'warning').length
  const resting  = n.filter(x => x.restStatus !== 'available').length
  const blocked  = n.filter(x => x.otBlockedBySystem).length
  const avgScore = Math.round(n.reduce((s, x) => s + x.fatigueScore, 0) / n.length)
  const pendingOt = n.filter(x => x.pendingOtRequest).length
  return { critical, warning, resting, blocked, avgScore, pendingOt, total: n.length }
}

// ── Zone meta ─────────────────────────────────────────────────────────────────

export const ZONE_META: Record<FatigueZone, {
  label: string; dot: string; badge: string; row: string; score: string
}> = {
  critical: { label: 'Critical', dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 border-red-200',       row: 'border-l-4 border-l-red-500',    score: 'text-red-600' },
  warning:  { label: 'Warning',  dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200', row: 'border-l-4 border-l-amber-500',  score: 'text-amber-600' },
  caution:  { label: 'Caution',  dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', row: 'border-l-4 border-l-yellow-400', score: 'text-yellow-600' },
  safe:     { label: 'Safe',     dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', row: 'border-l-4 border-l-emerald-500', score: 'text-emerald-600' },
}

export const UNIT_COLORS: Record<UnitKey, string> = {
  ICU: 'bg-red-100 text-red-700', CCU: 'bg-orange-100 text-orange-700', ED: 'bg-purple-100 text-purple-700',
  'MS-A': 'bg-sky-100 text-sky-700', 'MS-B': 'bg-teal-100 text-teal-700', Telemetry: 'bg-amber-100 text-amber-700',
}

// ordered days for timeline
export const TIMELINE_DAYS = ['Mar 6', 'Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11', 'Mar 12', 'Mar 13']
export const TIMELINE_DOW  = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
