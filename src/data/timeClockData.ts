// ── GPS Time Clock — Shift punch tracking & pay period management ─────────────

export type PunchType = 'clock-in' | 'clock-out'
export type LocationStatus = 'on-premises' | 'near' | 'outside' | 'checking' | 'unknown'

export interface PunchRecord {
  id: string
  type: PunchType
  timestamp: string    // ISO string
  timeLabel: string    // e.g. "07:03 AM"
  dateLabel: string    // e.g. "Thu Mar 12"
  unit: string
  locationStatus: LocationStatus
  lat: number | null
  lng: number | null
  approvedBy: string | null
  note: string | null
}

export interface PayPeriodSummary {
  label: string          // "Mar 1 – Mar 15"
  startDate: string
  endDate: string
  regularHours: number
  overtimeHours: number
  missedPunches: number
  targetHours: number    // full-time = 80 per 2-week period
  projectedHours: number // based on remaining scheduled shifts
}

export interface ScheduledShift {
  date: string           // "Mar 13"
  dayLabel: string       // "Fri"
  unit: string
  startTime: string      // "07:00"
  endTime: string        // "15:00"
  type: 'day' | 'evening' | 'night'
  status: 'upcoming' | 'in-progress' | 'completed'
}

export interface GeofenceConfig {
  name: string
  lat: number
  lng: number
  radiusMeters: number
}

// ── Geofence ─────────────────────────────────────────────────────────────────

export const HOSPITAL_GEOFENCE: GeofenceConfig = {
  name: 'Mercy General Hospital',
  lat: 37.7749,
  lng: -122.4194,
  radiusMeters: 200,
}

// ── Upcoming Schedule (next 7 days from Mar 12) ──────────────────────────────

export const UPCOMING_SHIFTS: ScheduledShift[] = [
  { date: 'Mar 12', dayLabel: 'Thu', unit: 'ICU',  startTime: '07:00', endTime: '15:00', type: 'day',     status: 'in-progress' },
  { date: 'Mar 13', dayLabel: 'Fri', unit: 'ICU',  startTime: '07:00', endTime: '15:00', type: 'day',     status: 'upcoming' },
  { date: 'Mar 14', dayLabel: 'Sat', unit: 'ICU',  startTime: '07:00', endTime: '15:00', type: 'day',     status: 'upcoming' },
  { date: 'Mar 15', dayLabel: 'Sun', unit: '',      startTime: '',      endTime: '',      type: 'day',     status: 'upcoming' }, // OFF
  { date: 'Mar 16', dayLabel: 'Mon', unit: 'MS-A', startTime: '19:00', endTime: '07:00', type: 'night',   status: 'upcoming' },
  { date: 'Mar 17', dayLabel: 'Tue', unit: 'MS-A', startTime: '19:00', endTime: '07:00', type: 'night',   status: 'upcoming' },
  { date: 'Mar 18', dayLabel: 'Wed', unit: '',      startTime: '',      endTime: '',      type: 'day',     status: 'upcoming' }, // OFF
]

// ── Punch History Seed ────────────────────────────────────────────────────────
// Pay period: Mar 1–15 (current). Janet Morrison, Day shift (07:00–15:00)

export const PUNCH_HISTORY_SEED: PunchRecord[] = [
  // Today — Mar 12 — currently clocked IN (no clock-out yet)
  {
    id: 'punch-012-in',
    type: 'clock-in',
    timestamp: '2026-03-12T07:03:00',
    timeLabel: '07:03 AM',
    dateLabel: 'Today',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: null,
    note: null,
  },
  // Mar 11 (Tue)
  {
    id: 'punch-011-out',
    type: 'clock-out',
    timestamp: '2026-03-11T15:06:00',
    timeLabel: '03:06 PM',
    dateLabel: 'Tue Mar 11',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-011-in',
    type: 'clock-in',
    timestamp: '2026-03-11T07:01:00',
    timeLabel: '07:01 AM',
    dateLabel: 'Tue Mar 11',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  // Mar 10 (Mon)
  {
    id: 'punch-010-out',
    type: 'clock-out',
    timestamp: '2026-03-10T15:10:00',
    timeLabel: '03:10 PM',
    dateLabel: 'Mon Mar 10',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-010-in',
    type: 'clock-in',
    timestamp: '2026-03-10T06:59:00',
    timeLabel: '06:59 AM',
    dateLabel: 'Mon Mar 10',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  // Mar 9 (Sun) — off
  // Mar 8 (Sat) — off
  // Mar 7 (Fri)
  {
    id: 'punch-007-out',
    type: 'clock-out',
    timestamp: '2026-03-07T15:14:00',
    timeLabel: '03:14 PM',
    dateLabel: 'Fri Mar 7',
    unit: 'CCU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-007-in',
    type: 'clock-in',
    timestamp: '2026-03-07T07:04:00',
    timeLabel: '07:04 AM',
    dateLabel: 'Fri Mar 7',
    unit: 'CCU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  // Mar 6 (Thu)
  {
    id: 'punch-006-out',
    type: 'clock-out',
    timestamp: '2026-03-06T15:02:00',
    timeLabel: '03:02 PM',
    dateLabel: 'Thu Mar 6',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-006-in',
    type: 'clock-in',
    timestamp: '2026-03-06T07:02:00',
    timeLabel: '07:02 AM',
    dateLabel: 'Thu Mar 6',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  // Mar 5 (Wed) — off
  // Mar 4 (Tue)
  {
    id: 'punch-004-out',
    type: 'clock-out',
    timestamp: '2026-03-04T15:08:00',
    timeLabel: '03:08 PM',
    dateLabel: 'Tue Mar 4',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-004-in',
    type: 'clock-in',
    timestamp: '2026-03-04T07:01:00',
    timeLabel: '07:01 AM',
    dateLabel: 'Tue Mar 4',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  // Mar 3 (Mon)
  {
    id: 'punch-003-out',
    type: 'clock-out',
    timestamp: '2026-03-03T15:11:00',
    timeLabel: '03:11 PM',
    dateLabel: 'Mon Mar 3',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
  {
    id: 'punch-003-in',
    type: 'clock-in',
    timestamp: '2026-03-03T07:02:00',
    timeLabel: '07:02 AM',
    dateLabel: 'Mon Mar 3',
    unit: 'ICU',
    locationStatus: 'on-premises',
    lat: 37.7749,
    lng: -122.4194,
    approvedBy: 'Auto-approved',
    note: null,
  },
]

// ── Pay Period Calculation ────────────────────────────────────────────────────
// Mar 1-15, working shifts: Mar 3,4,6,7,10,11,12 = 7 shifts × ~8h = ~56h
// Regular: 40h in first 5 days, then OT kicks in after 40h/week per CA law
// For simplicity: 45.5h total = 40h regular + 5.5h OT so far (6 shifts complete + today ongoing)

export const PAY_PERIOD: PayPeriodSummary = {
  label: 'Mar 1 – Mar 15',
  startDate: '2026-03-01',
  endDate: '2026-03-15',
  regularHours: 40.0,
  overtimeHours: 5.5,
  missedPunches: 0,
  targetHours: 80,
  projectedHours: 62.5, // after adding remaining shifts this period
}

// ── Mutable State ─────────────────────────────────────────────────────────────

const _punches: PunchRecord[] = [...PUNCH_HISTORY_SEED.map(p => ({ ...p }))]
let _clockedIn = true  // currently clocked in (today's shift in progress)
let _currentSessionStart = '07:03 AM'

// ── Public API ────────────────────────────────────────────────────────────────

export function isClockedIn(): boolean {
  return _clockedIn
}

export function getCurrentSessionStart(): string {
  return _currentSessionStart
}

export function getPunchHistory(): PunchRecord[] {
  return [..._punches]
}

export function clockIn(unit: string): PunchRecord {
  const now = new Date()
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const punch: PunchRecord = {
    id: `punch-new-${Date.now()}`,
    type: 'clock-in',
    timestamp: now.toISOString(),
    timeLabel,
    dateLabel: 'Today',
    unit,
    locationStatus: 'on-premises',
    lat: HOSPITAL_GEOFENCE.lat,
    lng: HOSPITAL_GEOFENCE.lng,
    approvedBy: null,
    note: null,
  }
  _punches.unshift(punch)
  _clockedIn = true
  _currentSessionStart = timeLabel
  return punch
}

export function clockOut(): PunchRecord {
  const now = new Date()
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const lastIn = _punches.find(p => p.type === 'clock-in')
  const punch: PunchRecord = {
    id: `punch-out-${Date.now()}`,
    type: 'clock-out',
    timestamp: now.toISOString(),
    timeLabel,
    dateLabel: 'Today',
    unit: lastIn?.unit ?? 'ICU',
    locationStatus: 'on-premises',
    lat: HOSPITAL_GEOFENCE.lat,
    lng: HOSPITAL_GEOFENCE.lng,
    approvedBy: null,
    note: null,
  }
  _punches.unshift(punch)
  _clockedIn = false
  return punch
}

export function getSessionElapsed(): { hours: number; minutes: number; totalMinutes: number } {
  // Based on 07:03 AM start for seeded state
  const start = new Date('2026-03-12T07:03:00')
  const now = new Date('2026-03-12T13:21:00') // simulate mid-day
  const diffMs = now.getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  }
}
