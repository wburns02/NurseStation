// ── On-Call Rotation Manager Data ────────────────────────────────────────────
// Date context: Friday March 13, 2026 — Day Shift 07:00
// Covers: Mar 13–26, 2026 (14-day rolling window)

export type OnCallStatus = 'scheduled' | 'activated' | 'completed' | 'declined' | 'blocked'
export type ActivationStatus = 'calling' | 'accepted' | 'declined' | 'en-route' | 'arrived' | 'completed'
export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Telemetry'
export type SlotType = 'primary' | 'backup'
export type ShiftWindow = 'day' | 'evening' | 'night'

export interface OnCallNurse {
  id:          string
  name:        string
  initials:    string
  color:       string
  unit:        UnitKey
  phone:       string
  callsThisMonth: number
  callsTarget:    number  // fair-share target
  lastCallDate:   string  // 'Mar 8'
  safeHoursBlocked: boolean
  available:      boolean
}

export interface OnCallSlot {
  id:       string
  unit:     UnitKey
  date:     string      // 'Mar 13'
  dateKey:  string      // 'fri-13'
  shift:    ShiftWindow
  type:     SlotType
  nurseId:  string
  status:   OnCallStatus
  activatedAt?:  string
  arrivedAt?:    string
  callReason?:   string
}

export interface ActivationEvent {
  id:          string
  slotId:      string
  nurseId:     string
  nurseName:   string
  unit:        UnitKey
  date:        string
  shift:       ShiftWindow
  status:      ActivationStatus
  calledAt:    string
  acceptedAt?: string
  arrivedAt?:  string
  reason:      string
  completedAt?: string
}

// ── Nurse roster for on-call ─────────────────────────────────────────────────

const _nurses: OnCallNurse[] = [
  { id: 'st-001', name: 'Sarah Kim',         initials: 'SK', color: 'from-emerald-500 to-emerald-700', unit: 'ICU',       phone: '(555) 112-4401', callsThisMonth: 3, callsTarget: 4, lastCallDate: 'Mar 10', safeHoursBlocked: false, available: true },
  { id: 'st-002', name: 'Marcus Chen',        initials: 'MC', color: 'from-blue-500 to-blue-700',       unit: 'ICU',       phone: '(555) 228-7732', callsThisMonth: 5, callsTarget: 4, lastCallDate: 'Mar 12', safeHoursBlocked: false, available: true },
  { id: 'st-003', name: 'Maria Garcia',       initials: 'MG', color: 'from-rose-500 to-rose-700',       unit: 'CCU',       phone: '(555) 334-9910', callsThisMonth: 2, callsTarget: 4, lastCallDate: 'Mar 6',  safeHoursBlocked: false, available: true },
  { id: 'st-004', name: 'David Thompson',     initials: 'DT', color: 'from-red-500 to-red-700',         unit: 'ED',        phone: '(555) 441-5523', callsThisMonth: 6, callsTarget: 4, lastCallDate: 'Mar 13', safeHoursBlocked: true,  available: false },
  { id: 'st-005', name: 'Emily Davis',        initials: 'ED', color: 'from-indigo-500 to-indigo-700',   unit: 'Telemetry', phone: '(555) 557-8841', callsThisMonth: 1, callsTarget: 4, lastCallDate: 'Feb 28', safeHoursBlocked: false, available: true },
  { id: 'st-006', name: 'James Wilson',       initials: 'JW', color: 'from-violet-500 to-violet-700',   unit: 'ED',        phone: '(555) 663-2204', callsThisMonth: 3, callsTarget: 4, lastCallDate: 'Mar 9',  safeHoursBlocked: false, available: true },
  { id: 'st-007', name: 'Jennifer Martinez',  initials: 'JM', color: 'from-sky-500 to-sky-700',         unit: 'MS-A',      phone: '(555) 779-1157', callsThisMonth: 2, callsTarget: 4, lastCallDate: 'Mar 7',  safeHoursBlocked: false, available: true },
  { id: 'st-008', name: 'Kevin Park',         initials: 'KP', color: 'from-cyan-500 to-cyan-700',       unit: 'MS-B',      phone: '(555) 882-6630', callsThisMonth: 4, callsTarget: 4, lastCallDate: 'Mar 11', safeHoursBlocked: false, available: true },
  { id: 'st-009', name: 'Linda Foster',       initials: 'LF', color: 'from-teal-500 to-teal-700',       unit: 'CCU',       phone: '(555) 994-3398', callsThisMonth: 3, callsTarget: 4, lastCallDate: 'Mar 10', safeHoursBlocked: false, available: true },
  { id: 'st-010', name: 'Robert Chang',       initials: 'RC', color: 'from-slate-500 to-slate-700',     unit: 'ED',        phone: '(555) 105-7765', callsThisMonth: 2, callsTarget: 4, lastCallDate: 'Mar 5',  safeHoursBlocked: false, available: true },
  { id: 'st-011', name: 'Christina Lee',      initials: 'CL', color: 'from-purple-500 to-purple-700',   unit: 'CCU',       phone: '(555) 211-0043', callsThisMonth: 1, callsTarget: 4, lastCallDate: 'Feb 25', safeHoursBlocked: false, available: true },
  { id: 'st-012', name: 'Amanda White',       initials: 'AW', color: 'from-pink-500 to-pink-700',       unit: 'ICU',       phone: '(555) 327-3316', callsThisMonth: 4, callsTarget: 4, lastCallDate: 'Mar 11', safeHoursBlocked: false, available: false },  // in rest
  { id: 'st-013', name: 'Carlos Rivera',      initials: 'CR', color: 'from-amber-500 to-amber-700',     unit: 'MS-A',      phone: '(555) 438-6682', callsThisMonth: 2, callsTarget: 4, lastCallDate: 'Mar 4',  safeHoursBlocked: false, available: true },
  { id: 'st-014', name: 'Patricia Moore',     initials: 'PM', color: 'from-orange-500 to-orange-700',   unit: 'Telemetry', phone: '(555) 544-9951', callsThisMonth: 5, callsTarget: 4, lastCallDate: 'Mar 12', safeHoursBlocked: true,  available: false },
]

// ── 14-day on-call schedule ───────────────────────────────────────────────────
// Each day: primary + backup per unit, evening + night windows
// Abbreviated for clarity; tonight (Mar 13) is fully populated

const _slots: OnCallSlot[] = [
  // ── TODAY Mar 13 (Friday) ──
  // ICU
  { id: 'oc-001', unit: 'ICU', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-002', unit: 'ICU', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-003', unit: 'ICU', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-012', status: 'blocked' },   // Amanda - rest
  { id: 'oc-004', unit: 'ICU', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-002', status: 'scheduled' },
  // CCU
  { id: 'oc-005', unit: 'CCU', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-009', status: 'scheduled' },
  { id: 'oc-006', unit: 'CCU', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-011', status: 'scheduled' },
  { id: 'oc-007', unit: 'CCU', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-003', status: 'scheduled' },
  { id: 'oc-008', unit: 'CCU', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-011', status: 'scheduled' },
  // ED
  { id: 'oc-009', unit: 'ED',  date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-010', status: 'scheduled' },
  { id: 'oc-010', unit: 'ED',  date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-011', unit: 'ED',  date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-004', status: 'blocked' },   // David - safe hours
  { id: 'oc-012', unit: 'ED',  date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-006', status: 'activated', activatedAt: '07:15 AM', callReason: 'ED surge — trauma night expected' },
  // MS-A
  { id: 'oc-013', unit: 'MS-A', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-007', status: 'scheduled' },
  { id: 'oc-014', unit: 'MS-A', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-015', unit: 'MS-A', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-016', unit: 'MS-A', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-007', status: 'scheduled' },
  // MS-B
  { id: 'oc-017', unit: 'MS-B', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-008', status: 'scheduled' },
  { id: 'oc-018', unit: 'MS-B', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-019', unit: 'MS-B', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-008', status: 'scheduled' },
  { id: 'oc-020', unit: 'MS-B', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-007', status: 'scheduled' },
  // Telemetry
  { id: 'oc-021', unit: 'Telemetry', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'primary', nurseId: 'st-014', status: 'blocked' }, // Patricia blocked
  { id: 'oc-022', unit: 'Telemetry', date: 'Mar 13', dateKey: 'fri-13', shift: 'evening', type: 'backup',  nurseId: 'st-005', status: 'scheduled' },
  { id: 'oc-023', unit: 'Telemetry', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'primary', nurseId: 'st-005', status: 'scheduled' },
  { id: 'oc-024', unit: 'Telemetry', date: 'Mar 13', dateKey: 'fri-13', shift: 'night',   type: 'backup',  nurseId: 'st-010', status: 'scheduled' },

  // ── Mar 14 (Saturday) ──
  { id: 'oc-025', unit: 'ICU',  date: 'Mar 14', dateKey: 'sat-14', shift: 'evening', type: 'primary', nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-026', unit: 'ICU',  date: 'Mar 14', dateKey: 'sat-14', shift: 'evening', type: 'backup',  nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-027', unit: 'ICU',  date: 'Mar 14', dateKey: 'sat-14', shift: 'night',   type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-028', unit: 'CCU',  date: 'Mar 14', dateKey: 'sat-14', shift: 'evening', type: 'primary', nurseId: 'st-011', status: 'scheduled' },
  { id: 'oc-029', unit: 'CCU',  date: 'Mar 14', dateKey: 'sat-14', shift: 'night',   type: 'primary', nurseId: 'st-009', status: 'scheduled' },
  { id: 'oc-030', unit: 'ED',   date: 'Mar 14', dateKey: 'sat-14', shift: 'evening', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-031', unit: 'ED',   date: 'Mar 14', dateKey: 'sat-14', shift: 'night',   type: 'primary', nurseId: 'st-010', status: 'scheduled' },
  { id: 'oc-032', unit: 'MS-A', date: 'Mar 14', dateKey: 'sat-14', shift: 'night',   type: 'primary', nurseId: 'st-007', status: 'scheduled' },
  { id: 'oc-033', unit: 'MS-B', date: 'Mar 14', dateKey: 'sat-14', shift: 'night',   type: 'primary', nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-034', unit: 'Telemetry', date: 'Mar 14', dateKey: 'sat-14', shift: 'night', type: 'primary', nurseId: 'st-005', status: 'scheduled' },

  // ── Mar 15 (Sunday) ──
  { id: 'oc-035', unit: 'ICU',  date: 'Mar 15', dateKey: 'sun-15', shift: 'night',   type: 'primary', nurseId: 'st-012', status: 'scheduled' },
  { id: 'oc-036', unit: 'CCU',  date: 'Mar 15', dateKey: 'sun-15', shift: 'night',   type: 'primary', nurseId: 'st-003', status: 'scheduled' },
  { id: 'oc-037', unit: 'ED',   date: 'Mar 15', dateKey: 'sun-15', shift: 'night',   type: 'primary', nurseId: 'st-004', status: 'scheduled' },
  { id: 'oc-038', unit: 'MS-A', date: 'Mar 15', dateKey: 'sun-15', shift: 'night',   type: 'primary', nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-039', unit: 'Telemetry', date: 'Mar 15', dateKey: 'sun-15', shift: 'night', type: 'primary', nurseId: 'st-014', status: 'scheduled' },

  // ── Mar 16–19 abbreviated ──
  { id: 'oc-040', unit: 'ICU',  date: 'Mar 16', dateKey: 'mon-16', shift: 'night', type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-041', unit: 'ED',   date: 'Mar 16', dateKey: 'mon-16', shift: 'night', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-042', unit: 'CCU',  date: 'Mar 16', dateKey: 'mon-16', shift: 'night', type: 'primary', nurseId: 'st-009', status: 'scheduled' },
  { id: 'oc-043', unit: 'MS-A', date: 'Mar 17', dateKey: 'tue-17', shift: 'night', type: 'primary', nurseId: 'st-007', status: 'scheduled' },
  { id: 'oc-044', unit: 'ICU',  date: 'Mar 17', dateKey: 'tue-17', shift: 'night', type: 'primary', nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-045', unit: 'ED',   date: 'Mar 17', dateKey: 'tue-17', shift: 'night', type: 'primary', nurseId: 'st-010', status: 'scheduled' },
  { id: 'oc-046', unit: 'ICU',  date: 'Mar 18', dateKey: 'wed-18', shift: 'night', type: 'primary', nurseId: 'st-012', status: 'scheduled' },
  { id: 'oc-047', unit: 'ED',   date: 'Mar 18', dateKey: 'wed-18', shift: 'night', type: 'primary', nurseId: 'st-004', status: 'scheduled' },
  { id: 'oc-048', unit: 'CCU',  date: 'Mar 18', dateKey: 'wed-18', shift: 'night', type: 'primary', nurseId: 'st-011', status: 'scheduled' },
  { id: 'oc-049', unit: 'ICU',  date: 'Mar 19', dateKey: 'thu-19', shift: 'night', type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-050', unit: 'ED',   date: 'Mar 19', dateKey: 'thu-19', shift: 'night', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-051', unit: 'Telemetry', date: 'Mar 19', dateKey: 'thu-19', shift: 'night', type: 'primary', nurseId: 'st-005', status: 'scheduled' },
  { id: 'oc-052', unit: 'MS-B', date: 'Mar 20', dateKey: 'fri-20', shift: 'night', type: 'primary', nurseId: 'st-008', status: 'scheduled' },
  { id: 'oc-053', unit: 'ICU',  date: 'Mar 20', dateKey: 'fri-20', shift: 'night', type: 'primary', nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-054', unit: 'ED',   date: 'Mar 20', dateKey: 'fri-20', shift: 'night', type: 'primary', nurseId: 'st-010', status: 'scheduled' },
  { id: 'oc-055', unit: 'ICU',  date: 'Mar 21', dateKey: 'sat-21', shift: 'night', type: 'primary', nurseId: 'st-012', status: 'scheduled' },
  { id: 'oc-056', unit: 'CCU',  date: 'Mar 21', dateKey: 'sat-21', shift: 'night', type: 'primary', nurseId: 'st-003', status: 'scheduled' },
  { id: 'oc-057', unit: 'ED',   date: 'Mar 21', dateKey: 'sat-21', shift: 'night', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-058', unit: 'ICU',  date: 'Mar 22', dateKey: 'sun-22', shift: 'night', type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-059', unit: 'ED',   date: 'Mar 22', dateKey: 'sun-22', shift: 'night', type: 'primary', nurseId: 'st-004', status: 'scheduled' },
  { id: 'oc-060', unit: 'Telemetry', date: 'Mar 22', dateKey: 'sun-22', shift: 'night', type: 'primary', nurseId: 'st-014', status: 'scheduled' },
  { id: 'oc-061', unit: 'ICU',  date: 'Mar 23', dateKey: 'mon-23', shift: 'night', type: 'primary', nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-062', unit: 'CCU',  date: 'Mar 23', dateKey: 'mon-23', shift: 'night', type: 'primary', nurseId: 'st-009', status: 'scheduled' },
  { id: 'oc-063', unit: 'ED',   date: 'Mar 23', dateKey: 'mon-23', shift: 'night', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-064', unit: 'ICU',  date: 'Mar 24', dateKey: 'tue-24', shift: 'night', type: 'primary', nurseId: 'st-001', status: 'scheduled' },
  { id: 'oc-065', unit: 'ED',   date: 'Mar 24', dateKey: 'tue-24', shift: 'night', type: 'primary', nurseId: 'st-010', status: 'scheduled' },
  { id: 'oc-066', unit: 'MS-A', date: 'Mar 24', dateKey: 'tue-24', shift: 'night', type: 'primary', nurseId: 'st-013', status: 'scheduled' },
  { id: 'oc-067', unit: 'ICU',  date: 'Mar 25', dateKey: 'wed-25', shift: 'night', type: 'primary', nurseId: 'st-012', status: 'scheduled' },
  { id: 'oc-068', unit: 'ED',   date: 'Mar 25', dateKey: 'wed-25', shift: 'night', type: 'primary', nurseId: 'st-006', status: 'scheduled' },
  { id: 'oc-069', unit: 'CCU',  date: 'Mar 25', dateKey: 'wed-25', shift: 'night', type: 'primary', nurseId: 'st-011', status: 'scheduled' },
  { id: 'oc-070', unit: 'ICU',  date: 'Mar 26', dateKey: 'thu-26', shift: 'night', type: 'primary', nurseId: 'st-002', status: 'scheduled' },
  { id: 'oc-071', unit: 'ED',   date: 'Mar 26', dateKey: 'thu-26', shift: 'night', type: 'primary', nurseId: 'st-004', status: 'scheduled' },
  { id: 'oc-072', unit: 'Telemetry', date: 'Mar 26', dateKey: 'thu-26', shift: 'night', type: 'primary', nurseId: 'st-005', status: 'scheduled' },
]

// ── Activation log ─────────────────────────────────────────────────────────

let _activations: ActivationEvent[] = [
  { id: 'act-001', slotId: 'oc-012', nurseId: 'st-006', nurseName: 'James Wilson', unit: 'ED', date: 'Mar 13', shift: 'night', status: 'accepted', calledAt: '07:15 AM', acceptedAt: '07:18 AM', reason: 'ED surge — trauma night expected', arrivedAt: undefined },
  { id: 'act-hist-001', slotId: 'hist-01', nurseId: 'st-001', nurseName: 'Sarah Kim', unit: 'ICU', date: 'Mar 12', shift: 'night', status: 'completed', calledAt: '10:42 PM', acceptedAt: '10:45 PM', arrivedAt: '11:20 PM', reason: 'ICU patient deterioration — extra hands needed', completedAt: '07:15 AM' },
  { id: 'act-hist-002', slotId: 'hist-02', nurseId: 'st-009', nurseName: 'Linda Foster', unit: 'CCU', date: 'Mar 11', shift: 'night', status: 'completed', calledAt: '01:30 AM', acceptedAt: '01:33 AM', arrivedAt: '02:05 AM', reason: 'Unexpected CCU admit from ED — census +2', completedAt: '07:00 AM' },
  { id: 'act-hist-003', slotId: 'hist-03', nurseId: 'st-004', nurseName: 'David Thompson', unit: 'ED', date: 'Mar 10', shift: 'evening', status: 'completed', calledAt: '05:48 PM', acceptedAt: '05:51 PM', arrivedAt: '06:20 PM', reason: 'MVC multi-casualty event', completedAt: '11:30 PM' },
  { id: 'act-hist-004', slotId: 'hist-04', nurseId: 'st-014', nurseName: 'Patricia Moore', unit: 'Telemetry', date: 'Mar 9', shift: 'night', status: 'completed', calledAt: '11:15 PM', acceptedAt: '11:17 PM', arrivedAt: '11:55 PM', reason: 'Float nurse no-show — Telemetry short one RN', completedAt: '07:10 AM' },
  { id: 'act-hist-005', slotId: 'hist-05', nurseId: 'st-012', nurseName: 'Amanda White', unit: 'ICU', date: 'Mar 8', shift: 'night', status: 'declined', calledAt: '02:10 AM', reason: 'ICU ARDS patient — extra monitoring needed' },
]

// ── Mutable state ────────────────────────────────────────────────────────────

export function activateSlot(slotId: string, reason: string): ActivationEvent | null {
  const slot = _slots.find(s => s.id === slotId)
  if (!slot) return null
  slot.status   = 'activated'
  slot.activatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  slot.callReason  = reason
  const nurse = _nurses.find(n => n.id === slot.nurseId)
  if (nurse) nurse.callsThisMonth++
  const event: ActivationEvent = {
    id: `act-${Date.now()}`,
    slotId, nurseId: slot.nurseId,
    nurseName: nurse?.name ?? 'Unknown',
    unit: slot.unit, date: slot.date, shift: slot.shift,
    status: 'accepted',
    calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    acceptedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    reason,
  }
  _activations.unshift(event)
  return event
}

export function markArrived(activationId: string) {
  const ev = _activations.find(a => a.id === activationId)
  if (ev) {
    ev.status = 'arrived'
    ev.arrivedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}

// ── Accessors ────────────────────────────────────────────────────────────────

export function getNurses(): OnCallNurse[] { return _nurses }
export function getNurse(id: string): OnCallNurse | undefined { return _nurses.find(n => n.id === id) }
export function getSlots(): OnCallSlot[] { return _slots }
export function getTodaySlots(): OnCallSlot[] { return _slots.filter(s => s.date === 'Mar 13') }
export function getActivations(): ActivationEvent[] { return _activations }

export function getStats() {
  const today = getTodaySlots()
  const active  = today.filter(s => s.status === 'activated').length
  const blocked = today.filter(s => s.status === 'blocked').length
  const ready   = today.filter(s => s.status === 'scheduled').length
  const activationsToday = _activations.filter(a => a.date === 'Mar 13').length
  return { active, blocked, ready, activationsToday, totalNurses: _nurses.length }
}

export function getCalendarDates(): string[] {
  return ['Mar 13', 'Mar 14', 'Mar 15', 'Mar 16', 'Mar 17', 'Mar 18', 'Mar 19', 'Mar 20', 'Mar 21', 'Mar 22', 'Mar 23', 'Mar 24', 'Mar 25', 'Mar 26']
}

export function getCalendarDOW(): string[] {
  return ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const UNIT_COLORS: Record<UnitKey, string> = {
  ICU: 'bg-red-100 text-red-700 border-red-200',
  CCU: 'bg-orange-100 text-orange-700 border-orange-200',
  ED:  'bg-purple-100 text-purple-700 border-purple-200',
  'MS-A': 'bg-sky-100 text-sky-700 border-sky-200',
  'MS-B': 'bg-teal-100 text-teal-700 border-teal-200',
  Telemetry: 'bg-amber-100 text-amber-700 border-amber-200',
}

export const UNIT_DOT: Record<UnitKey, string> = {
  ICU: 'bg-red-500', CCU: 'bg-orange-500', ED: 'bg-purple-500',
  'MS-A': 'bg-sky-500', 'MS-B': 'bg-teal-500', Telemetry: 'bg-amber-500',
}
