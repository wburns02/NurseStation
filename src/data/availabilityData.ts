export type SlotState = 'unset' | 'available' | 'preferred' | 'unavailable'
export type ShiftType = 'day' | 'night'
export type ShiftPref = 'day' | 'night' | 'flexible'
export type TOFReason = 'personal' | 'medical' | 'family' | 'vacation' | 'education' | 'other'

export interface WeekDay {
  date: string    // 'YYYY-MM-DD'
  dayLabel: string
  dateLabel: string
  isWeekend: boolean
}

export interface StaffMember {
  staffId: string
  name: string
  initials: string
  color: string
  role: string
  unit: string
}

export interface AvailabilitySettings {
  preferredUnits: string[]
  maxHoursPerWeek: number
  shiftPreference: ShiftPref
}

export interface TimeOffRequest {
  id: string
  startDate: string
  endDate: string
  reason: TOFReason
  notes: string
  status: 'pending' | 'approved' | 'denied'
  submittedAt: string
}

// ── Week definition (Mar 16–22, 2026) ───────────────────────────────────────

export const WEEK_DAYS: WeekDay[] = [
  { date: '2026-03-16', dayLabel: 'Mon', dateLabel: 'Mar 16', isWeekend: false },
  { date: '2026-03-17', dayLabel: 'Tue', dateLabel: 'Mar 17', isWeekend: false },
  { date: '2026-03-18', dayLabel: 'Wed', dateLabel: 'Mar 18', isWeekend: false },
  { date: '2026-03-19', dayLabel: 'Thu', dateLabel: 'Mar 19', isWeekend: false },
  { date: '2026-03-20', dayLabel: 'Fri', dateLabel: 'Mar 20', isWeekend: false },
  { date: '2026-03-21', dayLabel: 'Sat', dateLabel: 'Mar 21', isWeekend: true  },
  { date: '2026-03-22', dayLabel: 'Sun', dateLabel: 'Mar 22', isWeekend: true  },
]

export const SHIFTS = [
  { id: 'day'   as ShiftType, label: 'Day',   icon: '☀️', hours: '07:00 – 19:00' },
  { id: 'night' as ShiftType, label: 'Night',  icon: '🌙', hours: '19:00 – 07:00' },
]

export const ALL_UNITS = ['ICU', 'ED', 'CCU', 'MS-A', 'MS-B', 'Oncology', 'Telemetry']

// ── Staff roster (used for team view) ───────────────────────────────────────

export const STAFF_ROSTER: StaffMember[] = [
  { staffId: 'st-001', name: 'Janet Morrison',  initials: 'JM', color: 'from-violet-500 to-violet-700', role: 'Staff RN',   unit: 'ICU'       },
  { staffId: 'st-002', name: 'Marcus Chen',     initials: 'MC', color: 'from-blue-500 to-blue-700',     role: 'Staff RN',   unit: 'ICU'       },
  { staffId: 'st-003', name: 'Sarah Kim',       initials: 'SK', color: 'from-emerald-500 to-emerald-700',role: 'Charge RN',  unit: 'CCU'       },
  { staffId: 'st-004', name: 'David Thompson',  initials: 'DT', color: 'from-red-500 to-red-700',       role: 'Staff RN',   unit: 'ED'        },
  { staffId: 'st-005', name: 'Priya Patel',     initials: 'PP', color: 'from-amber-500 to-amber-700',   role: 'Staff RN',   unit: 'ED'        },
  { staffId: 'st-006', name: 'Robert Walsh',    initials: 'RW', color: 'from-slate-500 to-slate-700',   role: 'Charge RN',  unit: 'MS-A'      },
  { staffId: 'st-007', name: 'Alicia Rodriguez',initials: 'AR', color: 'from-pink-500 to-pink-700',     role: 'Staff RN',   unit: 'MS-A'      },
  { staffId: 'st-008', name: 'Kevin Park',      initials: 'KP', color: 'from-cyan-500 to-cyan-700',     role: 'Staff RN',   unit: 'MS-B'      },
  { staffId: 'st-009', name: 'Linda Foster',    initials: 'LF', color: 'from-teal-500 to-teal-700',     role: 'LPN',        unit: 'Oncology'  },
  { staffId: 'st-010', name: "James O'Brien",   initials: 'JO', color: 'from-indigo-500 to-indigo-700', role: 'Staff RN',   unit: 'Telemetry' },
  { staffId: 'st-011', name: 'Christina Lee',   initials: 'CL', color: 'from-purple-500 to-purple-700', role: 'Staff RN',   unit: 'CCU'       },
  { staffId: 'st-012', name: 'Miguel Santos',   initials: 'MS', color: 'from-orange-500 to-orange-700', role: 'CNA',        unit: 'MS-B'      },
  { staffId: 'st-013', name: 'Yuki Tanaka',     initials: 'YT', color: 'from-rose-500 to-rose-700',     role: 'Staff RN',   unit: 'ICU'       },
  { staffId: 'st-014', name: 'Beth Anderson',   initials: 'BA', color: 'from-sky-500 to-sky-700',       role: 'Travel RN',  unit: 'ED'        },
]

// ── Slot key helper ──────────────────────────────────────────────────────────

function slotKey(staffId: string, date: string, shift: ShiftType): string {
  return `${staffId}::${date}::${shift}`
}

// ── Janet's editable slots (seeded) ─────────────────────────────────────────

const JANET_SEED: [string, ShiftType, SlotState][] = [
  ['2026-03-16', 'day',   'preferred'],
  ['2026-03-16', 'night', 'unavailable'],
  ['2026-03-17', 'day',   'preferred'],
  ['2026-03-17', 'night', 'unavailable'],
  ['2026-03-18', 'day',   'available'],
  ['2026-03-18', 'night', 'available'],
  ['2026-03-19', 'day',   'available'],
  ['2026-03-19', 'night', 'available'],
  ['2026-03-20', 'day',   'preferred'],
  ['2026-03-20', 'night', 'unavailable'],
  ['2026-03-21', 'day',   'unavailable'],
  ['2026-03-21', 'night', 'available'],
  ['2026-03-22', 'day',   'unavailable'],
  ['2026-03-22', 'night', 'available'],
]

const _mySlots: Map<string, SlotState> = new Map(
  JANET_SEED.map(([d, s, state]) => [slotKey('st-001', d, s), state])
)

// ── Team slots (seeded for all 14 staff) ─────────────────────────────────────

// Seed patterns: each staff member has a characteristic availability shape
// Pattern letters: P=preferred A=available U=unavailable N=unset
// Format: [Mon-day, Mon-night, Tue-day, Tue-night, Wed-day, Wed-night,
//          Thu-day, Thu-night, Fri-day, Fri-night, Sat-day, Sat-night, Sun-day, Sun-night]
const TEAM_PATTERNS: Record<string, string[]> = {
  'st-002': ['P','U','P','U','A','U','A','U','P','U','A','U','A','U'],   // Marcus - day pref
  'st-003': ['P','U','A','U','P','U','P','U','A','U','U','A','U','A'],   // Sarah  - charge mix
  'st-004': ['A','U','A','U','A','A','A','A','A','U','U','P','U','P'],   // David  - flex/nights WE
  'st-005': ['U','P','U','P','U','P','U','A','U','A','A','U','A','U'],   // Priya  - nights weekdays
  'st-006': ['P','U','P','U','P','U','P','U','P','U','U','U','U','U'],   // Robert - Mon-Fri day only
  'st-007': ['A','A','A','A','U','U','A','A','A','A','U','U','U','U'],   // Alicia - Mon-Tue-Thu-Fri
  'st-008': ['U','A','U','P','U','A','U','P','U','A','P','U','P','U'],   // Kevin  - nights pref
  'st-009': ['P','U','P','U','P','U','U','U','P','U','U','U','U','U'],   // Linda  - Mon-Fri days
  'st-010': ['U','A','U','A','U','A','U','P','U','P','U','A','U','A'],   // James  - nights
  'st-011': ['A','U','P','U','A','U','P','U','A','U','A','U','U','U'],   // Christina - mix
  'st-012': ['A','U','A','U','A','U','A','U','U','U','U','U','U','U'],   // Miguel - Mon-Thu days
  'st-013': ['U','P','U','P','A','U','A','U','U','P','U','A','U','A'],   // Yuki   - nights + Fri day
  'st-014': ['A','A','A','A','A','A','A','A','A','A','A','A','A','A'],   // Beth   - travel, all avail
}

const stateMap: Record<string, SlotState> = { P: 'preferred', A: 'available', U: 'unavailable', N: 'unset' }

const _teamSlots: Map<string, SlotState> = new Map()
for (const [staffId, pattern] of Object.entries(TEAM_PATTERNS)) {
  WEEK_DAYS.forEach((day, di) => {
    const dayState  = stateMap[pattern[di * 2]] ?? 'unset'
    const nightState = stateMap[pattern[di * 2 + 1]] ?? 'unset'
    _teamSlots.set(slotKey(staffId, day.date, 'day'),   dayState)
    _teamSlots.set(slotKey(staffId, day.date, 'night'), nightState)
  })
}

// ── Settings (Janet's) ───────────────────────────────────────────────────────

let _settings: AvailabilitySettings = {
  preferredUnits: ['ICU'],
  maxHoursPerWeek: 36,
  shiftPreference: 'day',
}

// ── Time-off requests ────────────────────────────────────────────────────────

let _timeOffRequests: TimeOffRequest[] = [
  {
    id: 'tof-001',
    startDate: '2026-03-28',
    endDate: '2026-03-29',
    reason: 'personal',
    notes: 'Family event out of town.',
    status: 'pending',
    submittedAt: '2026-03-10',
  },
]

// ── Public API ───────────────────────────────────────────────────────────────

export function getMySlot(date: string, shift: ShiftType): SlotState {
  return _mySlots.get(slotKey('st-001', date, shift)) ?? 'unset'
}

export function cycleMySlot(date: string, shift: ShiftType): SlotState {
  const order: SlotState[] = ['unset', 'available', 'preferred', 'unavailable']
  const current = getMySlot(date, shift)
  const next = order[(order.indexOf(current) + 1) % order.length]
  _mySlots.set(slotKey('st-001', date, shift), next)
  return next
}

export function getMySettings(): AvailabilitySettings {
  return { ..._settings, preferredUnits: [..._settings.preferredUnits] }
}

export function updateSettings(patch: Partial<AvailabilitySettings>): void {
  _settings = { ..._settings, ...patch }
  if (patch.preferredUnits) _settings.preferredUnits = [...patch.preferredUnits]
}

export function getTeamSlot(staffId: string, date: string, shift: ShiftType): SlotState {
  if (staffId === 'st-001') return getMySlot(date, shift)
  return _teamSlots.get(slotKey(staffId, date, shift)) ?? 'unset'
}

export interface DayCoverage {
  date: string
  shift: ShiftType
  preferred: number
  available: number
  unavailable: number
  total: number
}

export function getDayCoverage(date: string, shift: ShiftType): DayCoverage {
  let preferred = 0, available = 0, unavailable = 0
  for (const s of STAFF_ROSTER) {
    const st = getTeamSlot(s.staffId, date, shift)
    if (st === 'preferred') preferred++
    else if (st === 'available') available++
    else if (st === 'unavailable') unavailable++
  }
  return { date, shift, preferred, available, unavailable, total: STAFF_ROSTER.length }
}

export function getTimeOffRequests(): TimeOffRequest[] {
  return [..._timeOffRequests]
}

export function submitTimeOffRequest(
  startDate: string,
  endDate: string,
  reason: TOFReason,
  notes: string
): TimeOffRequest {
  const req: TimeOffRequest = {
    id: `tof-${String(_timeOffRequests.length + 1).padStart(3, '0')}`,
    startDate,
    endDate,
    reason,
    notes,
    status: 'pending',
    submittedAt: '2026-03-13',
  }
  _timeOffRequests.push(req)
  return req
}

export function cancelTimeOffRequest(id: string): void {
  _timeOffRequests = _timeOffRequests.filter(r => r.id !== id)
}
