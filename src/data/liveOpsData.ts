// liveOpsData.ts — Live Shift Operations Center
// Reference: Day Shift, March 13 2026, 7:00 AM – 7:00 PM
// Simulates a hospital floor that is breathing in real-time

export type UnitId = 'ICU' | 'CCU' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry' | 'ED'

export type StaffStatus =
  | 'on-floor'    // checked in and on duty
  | 'scheduled'   // expected, not yet arrived
  | 'late'        // past check-in window, not arrived
  | 'on-break'    // temporarily off floor
  | 'callout'     // called out sick
  | 'float-in'    // float nurse from another unit

export type EventType =
  | 'shift-start'
  | 'checkin'
  | 'late-checkin'
  | 'callout'
  | 'float-assign'
  | 'ratio-alert'
  | 'ratio-clear'
  | 'ot-warning'
  | 'census-up'
  | 'census-down'
  | 'relief-request'
  | 'incident'
  | 'break-relief'
  | 'marketplace-fill'

export type EventSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface LiveStaff {
  id: string
  name: string
  initials: string
  role: 'RN' | 'CNA' | 'Charge RN' | 'Float RN'
  status: StaffStatus
  checkInTime?: string
  minutesLate?: number
  hoursThisWeek?: number
  breakStart?: string
}

export interface UnitLiveStatus {
  id: UnitId
  label: string
  abbr: string
  color: string       // text class
  bgLight: string     // bg light class
  borderColor: string // border class
  ringColor: string   // ring class for alerts
  scheduledCount: number
  onFloorCount: number
  lateCount: number
  calloutCount: number
  census: number
  capacity: number
  targetRatio: string
  currentRatio: string
  ratioOk: boolean
  hppdBudget: number
  hppdActual: number
  staff: LiveStaff[]
}

export interface LiveEvent {
  id: string
  time: string         // '7:15 AM'
  minutesAgo: number
  type: EventType
  severity: EventSeverity
  unitId?: UnitId
  staffName?: string
  message: string
  detail?: string
  actionLabel?: string
  actionDone: boolean
  isNew?: boolean      // briefly true when first added
}

// ── Unit meta ─────────────────────────────────────────────────────────────────

export const UNIT_META: Record<UnitId, { color: string; bgLight: string; border: string; ring: string; abbr: string }> = {
  ICU:       { color: 'text-violet-700', bgLight: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-400', abbr: 'ICU' },
  CCU:       { color: 'text-blue-700',   bgLight: 'bg-blue-50',   border: 'border-blue-200',   ring: 'ring-blue-400',   abbr: 'CCU' },
  'MS-A':    { color: 'text-emerald-700',bgLight: 'bg-emerald-50',border: 'border-emerald-200',ring: 'ring-emerald-400',abbr: 'MS-A' },
  'MS-B':    { color: 'text-teal-700',   bgLight: 'bg-teal-50',   border: 'border-teal-200',   ring: 'ring-teal-400',   abbr: 'MS-B' },
  Oncology:  { color: 'text-rose-700',   bgLight: 'bg-rose-50',   border: 'border-rose-200',   ring: 'ring-rose-400',   abbr: 'ONC' },
  Telemetry: { color: 'text-amber-700',  bgLight: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-400',  abbr: 'TEL' },
  ED:        { color: 'text-red-700',    bgLight: 'bg-red-50',    border: 'border-red-200',    ring: 'ring-red-400',    abbr: 'ED' },
}

export const EVENT_META: Record<EventType, { icon: string; label: string }> = {
  'shift-start':     { icon: '🌅', label: 'Shift Start' },
  'checkin':         { icon: '✓', label: 'Check-In' },
  'late-checkin':    { icon: '⏱', label: 'Late Arrival' },
  'callout':         { icon: '🔴', label: 'Call-Out' },
  'float-assign':    { icon: '→', label: 'Float Assigned' },
  'ratio-alert':     { icon: '⚠', label: 'Ratio Alert' },
  'ratio-clear':     { icon: '✓', label: 'Ratio Cleared' },
  'ot-warning':      { icon: '$', label: 'OT Warning' },
  'census-up':       { icon: '↑', label: 'Census Up' },
  'census-down':     { icon: '↓', label: 'Census Down' },
  'relief-request':  { icon: '🙋', label: 'Relief Request' },
  'incident':        { icon: '!', label: 'Incident' },
  'break-relief':    { icon: '☕', label: 'Break Relief' },
  'marketplace-fill':{ icon: '🏪', label: 'Marketplace Fill' },
}

// ── Initial staff for each unit ───────────────────────────────────────────────

const ICU_STAFF: LiveStaff[] = [
  { id: 'i1', name: 'Rachel Torres',  initials: 'RT', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:54 AM', hoursThisWeek: 36 },
  { id: 'i2', name: 'Marcus Williams',initials: 'MW', role: 'RN',        status: 'on-floor',  checkInTime: '7:03 AM', hoursThisWeek: 24 },
  { id: 'i3', name: 'Priya Sharma',   initials: 'PS', role: 'RN',        status: 'on-floor',  checkInTime: '7:11 AM', minutesLate: 11, hoursThisWeek: 32 },
  { id: 'i4', name: 'Elena Vasquez',  initials: 'EV', role: 'RN',        status: 'on-floor',  checkInTime: '6:58 AM', hoursThisWeek: 28 },
  { id: 'i5', name: 'Tom Bradley',    initials: 'TB', role: 'RN',        status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 40 },
  { id: 'i6', name: 'Laura Kim',      initials: 'LK', role: 'CNA',       status: 'on-floor',  checkInTime: '6:57 AM', hoursThisWeek: 32 },
  { id: 'i7', name: 'Devon Grant',    initials: 'DG', role: 'CNA',       status: 'on-floor',  checkInTime: '7:02 AM', hoursThisWeek: 20 },
  { id: 'i8', name: 'Chris Park',     initials: 'CP', role: 'RN',        status: 'on-break',  checkInTime: '6:59 AM', breakStart: '7:30 AM', hoursThisWeek: 36 },
]

const CCU_STAFF: LiveStaff[] = [
  { id: 'c1', name: 'Janet Morrison', initials: 'JM', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:52 AM', hoursThisWeek: 36 },
  { id: 'c2', name: 'Amy Johnson',    initials: 'AJ', role: 'RN',        status: 'on-floor',  checkInTime: '7:01 AM', hoursThisWeek: 38 },
  { id: 'c3', name: 'James Okafor',   initials: 'JO', role: 'RN',        status: 'callout',   hoursThisWeek: 24 },
  { id: 'c4', name: 'Michelle Lee',   initials: 'ML', role: 'RN',        status: 'on-floor',  checkInTime: '7:04 AM', hoursThisWeek: 30 },
  { id: 'c5', name: 'Sandra White',   initials: 'SW', role: 'Float RN',  status: 'float-in',  checkInTime: '7:22 AM', hoursThisWeek: 20 },
  { id: 'c6', name: 'Kevin Moss',     initials: 'KM', role: 'CNA',       status: 'on-floor',  checkInTime: '6:58 AM', hoursThisWeek: 28 },
]

const MSA_STAFF: LiveStaff[] = [
  { id: 'a1', name: 'Joyce Kim',      initials: 'JK', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:55 AM', hoursThisWeek: 36 },
  { id: 'a2', name: 'Robert Chen',    initials: 'RC', role: 'RN',        status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 28 },
  { id: 'a3', name: 'Felicia Burns',  initials: 'FB', role: 'RN',        status: 'on-floor',  checkInTime: '7:06 AM', hoursThisWeek: 32 },
  { id: 'a4', name: 'Sam Rivera',     initials: 'SR', role: 'RN',        status: 'on-floor',  checkInTime: '7:03 AM', hoursThisWeek: 24 },
  { id: 'a5', name: 'Theresa Nguyen', initials: 'TN', role: 'RN',        status: 'on-floor',  checkInTime: '6:59 AM', hoursThisWeek: 36 },
  { id: 'a6', name: 'Dan Kowalski',   initials: 'DK', role: 'RN',        status: 'on-floor',  checkInTime: '7:02 AM', hoursThisWeek: 20 },
  { id: 'a7', name: 'Gina Patel',     initials: 'GP', role: 'CNA',       status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 32 },
  { id: 'a8', name: 'Mike Torres',    initials: 'MT', role: 'CNA',       status: 'on-floor',  checkInTime: '7:01 AM', hoursThisWeek: 16 },
]

const MSB_STAFF: LiveStaff[] = [
  { id: 'b1', name: 'Denise Porter',  initials: 'DP', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:56 AM', hoursThisWeek: 36 },
  { id: 'b2', name: 'Leon Jackson',   initials: 'LJ', role: 'RN',        status: 'on-floor',  checkInTime: '7:04 AM', hoursThisWeek: 30 },
  { id: 'b3', name: 'Claire Adams',   initials: 'CA', role: 'RN',        status: 'on-floor',  checkInTime: '7:08 AM', hoursThisWeek: 28 },
  { id: 'b4', name: 'Rodrigo Vega',   initials: 'RV', role: 'RN',        status: 'late',      minutesLate: 22, hoursThisWeek: 32 },
  { id: 'b5', name: 'Hannah Scott',   initials: 'HS', role: 'RN',        status: 'on-floor',  checkInTime: '6:57 AM', hoursThisWeek: 24 },
  { id: 'b6', name: 'Alicia Croft',   initials: 'AC', role: 'RN',        status: 'on-floor',  checkInTime: '7:01 AM', hoursThisWeek: 20 },
  { id: 'b7', name: 'Paul Winters',   initials: 'PW', role: 'CNA',       status: 'on-floor',  checkInTime: '7:03 AM', hoursThisWeek: 24 },
]

const ONC_STAFF: LiveStaff[] = [
  { id: 'o1', name: 'Sarah Chen',     initials: 'SC', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:50 AM', hoursThisWeek: 36 },
  { id: 'o2', name: 'Victor Ruiz',    initials: 'VR', role: 'RN',        status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 28 },
  { id: 'o3', name: 'Brianna Cook',   initials: 'BC', role: 'RN',        status: 'on-floor',  checkInTime: '7:05 AM', hoursThisWeek: 32 },
  { id: 'o4', name: 'Aaron Walsh',    initials: 'AW', role: 'RN',        status: 'on-floor',  checkInTime: '6:58 AM', hoursThisWeek: 24 },
  { id: 'o5', name: 'Nadia Frost',    initials: 'NF', role: 'RN',        status: 'on-floor',  checkInTime: '7:02 AM', hoursThisWeek: 20 },
  { id: 'o6', name: 'Quinn Bell',     initials: 'QB', role: 'CNA',       status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 28 },
]

const TEL_STAFF: LiveStaff[] = [
  { id: 't1', name: 'Paul Monroe',    initials: 'PM', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:53 AM', hoursThisWeek: 40 },
  { id: 't2', name: 'Isabel Flores',  initials: 'IF', role: 'RN',        status: 'on-floor',  checkInTime: '7:02 AM', hoursThisWeek: 24 },
  { id: 't3', name: 'Anthony Cruz',   initials: 'AC', role: 'RN',        status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 36 },
  { id: 't4', name: 'Kara Simmons',   initials: 'KS', role: 'RN',        status: 'on-floor',  checkInTime: '6:59 AM', hoursThisWeek: 28 },
  { id: 't5', name: 'Omar Hassan',    initials: 'OH', role: 'CNA',       status: 'on-floor',  checkInTime: '7:01 AM', hoursThisWeek: 20 },
]

const ED_STAFF: LiveStaff[] = [
  { id: 'e1', name: 'Dante Rivera',   initials: 'DR', role: 'Charge RN', status: 'on-floor',  checkInTime: '6:45 AM', hoursThisWeek: 36 },
  { id: 'e2', name: 'Lena Park',      initials: 'LP', role: 'RN',        status: 'on-floor',  checkInTime: '6:58 AM', hoursThisWeek: 28 },
  { id: 'e3', name: 'Tyler Brooks',   initials: 'TB', role: 'RN',        status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 32 },
  { id: 'e4', name: 'Chloe Manning',  initials: 'CM', role: 'RN',        status: 'on-floor',  checkInTime: '6:56 AM', hoursThisWeek: 40 },
  { id: 'e5', name: 'Marcus Webb',    initials: 'MW', role: 'RN',        status: 'late',      minutesLate: 31, hoursThisWeek: 24 },
  { id: 'e6', name: 'Jasmine Reed',   initials: 'JR', role: 'RN',        status: 'on-floor',  checkInTime: '6:55 AM', hoursThisWeek: 36 },
  { id: 'e7', name: 'Caleb Stone',    initials: 'CS', role: 'RN',        status: 'on-floor',  checkInTime: '7:03 AM', hoursThisWeek: 20 },
  { id: 'e8', name: 'Nina Patel',     initials: 'NP', role: 'RN',        status: 'on-floor',  checkInTime: '6:59 AM', hoursThisWeek: 28 },
  { id: 'e9', name: 'Derek Walsh',    initials: 'DW', role: 'CNA',       status: 'on-floor',  checkInTime: '7:00 AM', hoursThisWeek: 32 },
  { id:'e10', name: 'Vivian Chang',   initials: 'VC', role: 'CNA',       status: 'on-floor',  checkInTime: '6:57 AM', hoursThisWeek: 24 },
]

// ── Unit live status (initial state) ─────────────────────────────────────────

const _units: UnitLiveStatus[] = [
  {
    id: 'ICU', label: 'ICU', abbr: 'ICU',
    color: 'text-violet-700', bgLight: 'bg-violet-50', borderColor: 'border-violet-200', ringColor: 'ring-violet-400',
    scheduledCount: 8, onFloorCount: 7, lateCount: 0, calloutCount: 0,
    census: 14, capacity: 16, targetRatio: '1:2', currentRatio: '1:2', ratioOk: true,
    hppdBudget: 11.5, hppdActual: 11.2,
    staff: ICU_STAFF,
  },
  {
    id: 'CCU', label: 'CCU', abbr: 'CCU',
    color: 'text-blue-700', bgLight: 'bg-blue-50', borderColor: 'border-blue-200', ringColor: 'ring-blue-400',
    scheduledCount: 6, onFloorCount: 5, lateCount: 0, calloutCount: 1,
    census: 10, capacity: 12, targetRatio: '1:2', currentRatio: '1:2', ratioOk: true,
    hppdBudget: 9.5, hppdActual: 10.1,
    staff: CCU_STAFF,
  },
  {
    id: 'MS-A', label: 'Med-Surg A', abbr: 'MS-A',
    color: 'text-emerald-700', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200', ringColor: 'ring-emerald-400',
    scheduledCount: 8, onFloorCount: 8, lateCount: 0, calloutCount: 0,
    census: 28, capacity: 32, targetRatio: '1:4', currentRatio: '1:4', ratioOk: true,
    hppdBudget: 7.2, hppdActual: 7.0,
    staff: MSA_STAFF,
  },
  {
    id: 'MS-B', label: 'Med-Surg B', abbr: 'MS-B',
    color: 'text-teal-700', bgLight: 'bg-teal-50', borderColor: 'border-teal-200', ringColor: 'ring-teal-400',
    scheduledCount: 7, onFloorCount: 6, lateCount: 1, calloutCount: 0,
    census: 27, capacity: 32, targetRatio: '1:4', currentRatio: '1:5', ratioOk: false,
    hppdBudget: 7.2, hppdActual: 6.8,
    staff: MSB_STAFF,
  },
  {
    id: 'Oncology', label: 'Oncology', abbr: 'ONC',
    color: 'text-rose-700', bgLight: 'bg-rose-50', borderColor: 'border-rose-200', ringColor: 'ring-rose-400',
    scheduledCount: 6, onFloorCount: 6, lateCount: 0, calloutCount: 0,
    census: 18, capacity: 20, targetRatio: '1:3', currentRatio: '1:3', ratioOk: true,
    hppdBudget: 9.0, hppdActual: 9.0,
    staff: ONC_STAFF,
  },
  {
    id: 'Telemetry', label: 'Telemetry', abbr: 'TEL',
    color: 'text-amber-700', bgLight: 'bg-amber-50', borderColor: 'border-amber-200', ringColor: 'ring-amber-400',
    scheduledCount: 5, onFloorCount: 5, lateCount: 0, calloutCount: 0,
    census: 15, capacity: 18, targetRatio: '1:3', currentRatio: '1:3', ratioOk: true,
    hppdBudget: 8.0, hppdActual: 7.9,
    staff: TEL_STAFF,
  },
  {
    id: 'ED', label: 'Emergency Dept', abbr: 'ED',
    color: 'text-red-700', bgLight: 'bg-red-50', borderColor: 'border-red-200', ringColor: 'ring-red-400',
    scheduledCount: 10, onFloorCount: 9, lateCount: 1, calloutCount: 0,
    census: 22, capacity: 30, targetRatio: '1:4', currentRatio: '1:3', ratioOk: true,
    hppdBudget: 8.5, hppdActual: 8.2,
    staff: ED_STAFF,
  },
]

// ── Initial event log (what happened 7:00 AM → 7:47 AM) ──────────────────────

const _events: LiveEvent[] = [
  {
    id: 'ev-001', time: '7:00 AM', minutesAgo: 47, type: 'shift-start',
    severity: 'info', message: 'Day Shift started — 7:00 AM to 7:00 PM',
    detail: '44 of 50 scheduled staff checked in within window', actionLabel: undefined, actionDone: false,
  },
  {
    id: 'ev-002', time: '7:03 AM', minutesAgo: 44, type: 'checkin',
    severity: 'success', unitId: 'ICU', staffName: 'Marcus Williams',
    message: 'Marcus Williams checked in — ICU',
    detail: 'On time · 24h this week', actionLabel: undefined, actionDone: false,
  },
  {
    id: 'ev-003', time: '7:08 AM', minutesAgo: 39, type: 'checkin',
    severity: 'success', unitId: 'MS-A', staffName: 'Joyce Kim',
    message: 'Joyce Kim checked in — Med-Surg A (Charge)',
    detail: 'On time · Unit fully staffed', actionLabel: undefined, actionDone: false,
  },
  {
    id: 'ev-004', time: '7:11 AM', minutesAgo: 36, type: 'late-checkin',
    severity: 'warning', unitId: 'ICU', staffName: 'Priya Sharma',
    message: 'Priya Sharma arrived late — ICU',
    detail: '11 minutes past scheduled time', actionLabel: 'Acknowledge', actionDone: false,
  },
  {
    id: 'ev-005', time: '7:15 AM', minutesAgo: 32, type: 'callout',
    severity: 'critical', unitId: 'CCU', staffName: 'James Okafor',
    message: 'James Okafor called out sick — CCU gap created',
    detail: 'Reason: Illness · CCU now 5 of 6 scheduled · Ratio at risk',
    actionLabel: 'Find Coverage', actionDone: false,
  },
  {
    id: 'ev-006', time: '7:21 AM', minutesAgo: 26, type: 'float-assign',
    severity: 'success', unitId: 'CCU', staffName: 'Sandra White',
    message: 'Sandra White (Float) assigned to CCU',
    detail: 'Filling Okafor gap · Verified CCU competency · En route',
    actionLabel: undefined, actionDone: false,
  },
  {
    id: 'ev-007', time: '7:28 AM', minutesAgo: 19, type: 'census-up',
    severity: 'warning', unitId: 'MS-B',
    message: 'Census increased in Med-Surg B — now 27 patients',
    detail: 'Ratio at 1:5 · 2 above target (1:4) · Rodrigo Vega still outstanding',
    actionLabel: 'Request Float', actionDone: false,
  },
  {
    id: 'ev-008', time: '7:34 AM', minutesAgo: 13, type: 'ot-warning',
    severity: 'warning', unitId: 'CCU', staffName: 'Amy Johnson',
    message: 'OT threshold alert — Amy Johnson (CCU)',
    detail: '38h this week + today\'s 12h shift = 50h · $124 OT premium',
    actionLabel: 'Review OT', actionDone: false,
  },
  {
    id: 'ev-009', time: '7:39 AM', minutesAgo: 8, type: 'checkin',
    severity: 'success', unitId: 'CCU', staffName: 'Sandra White',
    message: 'Sandra White checked in — CCU',
    detail: 'Float coverage confirmed · CCU ratio restored 1:2', actionLabel: undefined, actionDone: false,
  },
  {
    id: 'ev-010', time: '7:44 AM', minutesAgo: 3, type: 'relief-request',
    severity: 'warning', unitId: 'MS-B',
    message: 'Rodrigo Vega (MS-B) still not arrived — 22 min late',
    detail: 'No contact made · Last worked Mar 10 · No callout received',
    actionLabel: 'Contact Now', actionDone: false,
  },
]

// ── Pending events (auto-generate during session) ─────────────────────────────

export type PendingEvent = Omit<LiveEvent, 'id' | 'time' | 'minutesAgo' | 'isNew'>

export const PENDING_EVENTS: PendingEvent[] = [
  {
    type: 'late-checkin', severity: 'info', unitId: 'ED', staffName: 'Marcus Webb',
    message: 'Marcus Webb arrived — ED (31 min late)',
    detail: 'Checked in at 7:52 AM · Traffic reported', actionLabel: 'Acknowledge', actionDone: false,
  },
  {
    type: 'ratio-alert', severity: 'critical', unitId: 'MS-B',
    message: 'Ratio violation persists — Med-Surg B',
    detail: '27 patients · 5 nurses · 1:5 ratio (target 1:4) · 2nd alert',
    actionLabel: 'Post to Float', actionDone: false,
  },
  {
    type: 'ot-warning', severity: 'warning', unitId: 'ICU', staffName: 'Tom Bradley',
    message: 'OT watch — Tom Bradley (ICU)',
    detail: '40h this week · At threshold · Today\'s shift will trigger OT',
    actionLabel: 'Review OT', actionDone: false,
  },
  {
    type: 'census-down', severity: 'success', unitId: 'ICU',
    message: 'Discharge: ICU census decreased to 13',
    detail: 'Patient transferred to step-down · Ratio now 1:1.6 → consider early release',
    actionLabel: 'Early Release?', actionDone: false,
  },
  {
    type: 'break-relief', severity: 'info', unitId: 'ICU', staffName: 'Chris Park',
    message: 'Chris Park returning from break — ICU',
    detail: 'Break started 7:30 AM · Returning to patient assignment', actionLabel: undefined, actionDone: false,
  },
  {
    type: 'marketplace-fill', severity: 'success', unitId: 'MS-B',
    message: 'Marketplace nurse confirmed — Med-Surg B',
    detail: 'Rodrigo Vega slot filled by agency RN · Shift 7A-7P · Rate: $78/hr',
    actionLabel: 'Approve Rate', actionDone: false,
  },
  {
    type: 'incident', severity: 'critical', unitId: 'ED',
    message: 'Patient safety event reported — ED Bay 4',
    detail: 'Near-miss medication event · Charge notified · Incident #INC-2026-0847',
    actionLabel: 'View Incident', actionDone: false,
  },
  {
    type: 'census-up', severity: 'warning', unitId: 'Oncology',
    message: 'Pending admission — Oncology (Room 312)',
    detail: 'Transfer from ICU expected 10:30 AM · Ratio will shift to 1:3.3',
    actionLabel: 'Prepare Room', actionDone: false,
  },
]

// ── Mutable state ─────────────────────────────────────────────────────────────

let _eventLog: LiveEvent[] = [..._events]
let _pendingIdx = 0
let _idCounter = 11
let _unitState: UnitLiveStatus[] = _units.map(u => ({ ...u, staff: [...u.staff] }))
let _actionsDone: Set<string> = new Set()

export function getUnits(): UnitLiveStatus[] {
  return _unitState
}

export function getEventLog(): LiveEvent[] {
  return [..._eventLog]
}

export function fireNextEvent(now: string): LiveEvent | null {
  if (_pendingIdx >= PENDING_EVENTS.length) return null
  const pending = PENDING_EVENTS[_pendingIdx++]
  const ev: LiveEvent = {
    ...pending,
    id: `ev-${String(_idCounter++).padStart(3, '0')}`,
    time: now,
    minutesAgo: 0,
    isNew: true,
  }
  _eventLog = [ev, ..._eventLog]
  return ev
}

export function doAction(eventId: string): void {
  _actionsDone.add(eventId)
  _eventLog = _eventLog.map(e =>
    e.id === eventId ? { ...e, actionDone: true } : e
  )
}

export function isActionDone(eventId: string): boolean {
  return _actionsDone.has(eventId)
}

export function clearNewFlag(eventId: string): void {
  _eventLog = _eventLog.map(e =>
    e.id === eventId ? { ...e, isNew: false } : e
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────

export interface ShiftStats {
  totalScheduled: number
  totalOnFloor: number
  totalCallouts: number
  totalLate: number
  totalCensus: number
  totalCapacity: number
  ratioAlerts: number
  coveragePct: number
  activeAlerts: number
}

export function getShiftStats(): ShiftStats {
  const units = _unitState
  const totalScheduled = units.reduce((s, u) => s + u.scheduledCount, 0)
  const totalOnFloor = units.reduce((s, u) => s + u.onFloorCount, 0)
  const totalCallouts = units.reduce((s, u) => s + u.calloutCount, 0)
  const totalLate = units.reduce((s, u) => s + u.lateCount, 0)
  const totalCensus = units.reduce((s, u) => s + u.census, 0)
  const totalCapacity = units.reduce((s, u) => s + u.capacity, 0)
  const ratioAlerts = units.filter(u => !u.ratioOk).length
  const coveragePct = Math.round((totalOnFloor / totalScheduled) * 100)
  const activeAlerts = _eventLog.filter(e => e.actionLabel && !e.actionDone && ['critical','warning'].includes(e.severity)).length
  return { totalScheduled, totalOnFloor, totalCallouts, totalLate, totalCensus, totalCapacity, ratioAlerts, coveragePct, activeAlerts }
}

// shift start: 7:00 AM, duration: 12h
export const SHIFT_START_HOUR = 7   // 7 AM
export const SHIFT_DURATION_H = 12  // 12 hours
