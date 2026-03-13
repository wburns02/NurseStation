// ── Self-Schedule / Open Shift Bidding Data ───────────────────────────────────
//
// Workflow:
//   1. Manager creates a bidding cycle with open slot template
//   2. Bidding window opens — nurses place bids (rank 1st/2nd/3rd choice)
//   3. Window closes → conflicts auto-resolved by seniority
//   4. Manager reviews & publishes final schedule

export type BidWindowStatus = 'upcoming' | 'open' | 'reviewing' | 'published'
export type BidStatus       = 'placed' | 'confirmed' | 'waitlisted' | 'conflict'
export type ShiftType       = 'day' | 'night' | 'evening'

export interface SlotBid {
  nurseId:       string
  nurseName:     string
  nurseInitials: string
  nurseColor:    string
  nurseRole:     string
  seniorityYears: number
  priority:      1 | 2 | 3
  status:        BidStatus
  bidAt:         string  // "2h ago", "4h ago", etc.
}

export interface ScheduleSlot {
  id:         string
  date:       string
  dateLabel:  string
  dayOfWeek:  string
  shiftType:  ShiftType
  shiftHours: string
  unit:       string
  role:       string
  needed:     number
  bids:       SlotBid[]
}

export interface BidCycle {
  id:           string
  label:        string
  periodStart:  string
  periodEnd:    string
  status:       BidWindowStatus
  windowOpens:  string
  windowCloses: string
  hoursRemaining: number
  slots:        ScheduleSlot[]
}

// ── Current user ──────────────────────────────────────────────────────────────
export const CURRENT_USER = {
  id: 'st-001', name: 'Janet Morrison', initials: 'JM',
  color: 'from-violet-500 to-violet-700', role: 'Staff RN', seniorityYears: 6,
}

// ── Active bidding cycle: Week of Mar 23, 2026 ────────────────────────────────

const _cycles: BidCycle[] = [
  {
    id: 'cyc-001',
    label: 'Week of Mar 23 – Mar 29, 2026',
    periodStart: '2026-03-23',
    periodEnd:   '2026-03-29',
    status:      'open',
    windowOpens:  'Mar 12 at 08:00',
    windowCloses: 'Mar 14 at 08:00',
    hoursRemaining: 20,
    slots: [
      // ── MON Mar 23 ──────────────────────────────────────────────────────────
      {
        id: 'sl-001', date: '2026-03-23', dateLabel: 'Mon Mar 23',
        dayOfWeek: 'Mon', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'ICU', role: 'Staff RN', needed: 3,
        bids: [
          { nurseId: 'st-013', nurseName: 'Yuki Tanaka',     nurseInitials: 'YT', nurseColor: 'from-rose-500 to-rose-700',    nurseRole: 'Staff RN', seniorityYears: 4, priority: 1, status: 'confirmed', bidAt: '6h ago' },
          { nurseId: 'st-002', nurseName: 'Marcus Chen',     nurseInitials: 'MC', nurseColor: 'from-blue-500 to-blue-700',    nurseRole: 'Staff RN', seniorityYears: 8, priority: 1, status: 'confirmed', bidAt: '5h ago' },
          { nurseId: 'st-001', nurseName: 'Janet Morrison',  nurseInitials: 'JM', nurseColor: 'from-violet-500 to-violet-700', nurseRole: 'Staff RN', seniorityYears: 6, priority: 1, status: 'confirmed', bidAt: '3h ago' },
        ],
      },
      {
        id: 'sl-002', date: '2026-03-23', dateLabel: 'Mon Mar 23',
        dayOfWeek: 'Mon', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'ICU', role: 'Staff RN', needed: 2,
        bids: [
          { nurseId: 'st-002', nurseName: 'Marcus Chen',     nurseInitials: 'MC', nurseColor: 'from-blue-500 to-blue-700',    nurseRole: 'Staff RN', seniorityYears: 8, priority: 2, status: 'placed',    bidAt: '5h ago' },
          { nurseId: 'st-013', nurseName: 'Yuki Tanaka',     nurseInitials: 'YT', nurseColor: 'from-rose-500 to-rose-700',    nurseRole: 'Staff RN', seniorityYears: 4, priority: 2, status: 'placed',    bidAt: '6h ago' },
          { nurseId: 'st-009', nurseName: 'Linda Foster',    nurseInitials: 'LF', nurseColor: 'from-teal-500 to-teal-700',    nurseRole: 'Staff RN', seniorityYears: 9, priority: 1, status: 'placed',    bidAt: '2h ago' },
        ],
      },
      // ── TUE Mar 24 ──────────────────────────────────────────────────────────
      {
        id: 'sl-003', date: '2026-03-24', dateLabel: 'Tue Mar 24',
        dayOfWeek: 'Tue', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'ED', role: 'Staff RN', needed: 4,
        bids: [
          { nurseId: 'st-004', nurseName: 'David Thompson',  nurseInitials: 'DT', nurseColor: 'from-red-500 to-red-700',     nurseRole: 'Staff RN', seniorityYears: 5, priority: 1, status: 'placed',    bidAt: '4h ago' },
          { nurseId: 'st-005', nurseName: 'Priya Patel',     nurseInitials: 'PP', nurseColor: 'from-amber-500 to-amber-700', nurseRole: 'Staff RN', seniorityYears: 3, priority: 1, status: 'placed',    bidAt: '3h ago' },
          { nurseId: 'st-014', nurseName: 'Beth Anderson',   nurseInitials: 'BA', nurseColor: 'from-sky-500 to-sky-700',     nurseRole: 'Staff RN', seniorityYears: 2, priority: 1, status: 'placed',    bidAt: '7h ago' },
        ],
      },
      {
        id: 'sl-004', date: '2026-03-24', dateLabel: 'Tue Mar 24',
        dayOfWeek: 'Tue', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'ED', role: 'Staff RN', needed: 3,
        bids: [
          { nurseId: 'st-004', nurseName: 'David Thompson',  nurseInitials: 'DT', nurseColor: 'from-red-500 to-red-700',     nurseRole: 'Staff RN', seniorityYears: 5, priority: 2, status: 'placed',    bidAt: '4h ago' },
        ],
      },
      // ── WED Mar 25 ──────────────────────────────────────────────────────────
      {
        id: 'sl-005', date: '2026-03-25', dateLabel: 'Wed Mar 25',
        dayOfWeek: 'Wed', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'CCU', role: 'Staff RN', needed: 3,
        bids: [
          { nurseId: 'st-003', nurseName: 'Sarah Kim',       nurseInitials: 'SK', nurseColor: 'from-emerald-500 to-emerald-700', nurseRole: 'Charge RN', seniorityYears: 11, priority: 1, status: 'placed', bidAt: '8h ago' },
          { nurseId: 'st-011', nurseName: 'Christina Lee',   nurseInitials: 'CL', nurseColor: 'from-purple-500 to-purple-700', nurseRole: 'Staff RN', seniorityYears: 7, priority: 1, status: 'placed',    bidAt: '5h ago' },
          { nurseId: 'st-009', nurseName: 'Linda Foster',    nurseInitials: 'LF', nurseColor: 'from-teal-500 to-teal-700',    nurseRole: 'Staff RN', seniorityYears: 9, priority: 2, status: 'placed',    bidAt: '2h ago' },
          { nurseId: 'st-014', nurseName: 'Beth Anderson',   nurseInitials: 'BA', nurseColor: 'from-sky-500 to-sky-700',     nurseRole: 'Staff RN', seniorityYears: 2, priority: 2, status: 'conflict',   bidAt: '7h ago' },
        ],
      },
      {
        id: 'sl-006', date: '2026-03-25', dateLabel: 'Wed Mar 25',
        dayOfWeek: 'Wed', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'CCU', role: 'Staff RN', needed: 2,
        bids: [
          { nurseId: 'st-011', nurseName: 'Christina Lee',   nurseInitials: 'CL', nurseColor: 'from-purple-500 to-purple-700', nurseRole: 'Staff RN', seniorityYears: 7, priority: 2, status: 'placed', bidAt: '5h ago' },
        ],
      },
      // ── THU Mar 26 ──────────────────────────────────────────────────────────
      {
        id: 'sl-007', date: '2026-03-26', dateLabel: 'Thu Mar 26',
        dayOfWeek: 'Thu', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'MS-A', role: 'Staff RN', needed: 4,
        bids: [
          { nurseId: 'st-006', nurseName: 'Robert Walsh',    nurseInitials: 'RW', nurseColor: 'from-slate-500 to-slate-700',  nurseRole: 'Charge RN', seniorityYears: 13, priority: 1, status: 'placed', bidAt: '9h ago' },
          { nurseId: 'st-007', nurseName: 'Alicia Rodriguez',nurseInitials: 'AR', nurseColor: 'from-pink-500 to-pink-700',   nurseRole: 'Staff RN', seniorityYears: 4, priority: 1, status: 'placed',    bidAt: '6h ago' },
          { nurseId: 'st-012', nurseName: 'Miguel Santos',   nurseInitials: 'MS', nurseColor: 'from-orange-500 to-orange-700', nurseRole: 'Staff RN', seniorityYears: 3, priority: 1, status: 'placed',  bidAt: '4h ago' },
        ],
      },
      {
        id: 'sl-008', date: '2026-03-26', dateLabel: 'Thu Mar 26',
        dayOfWeek: 'Thu', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'MS-A', role: 'Staff RN', needed: 3,
        bids: [],
      },
      // ── FRI Mar 27 ──────────────────────────────────────────────────────────
      {
        id: 'sl-009', date: '2026-03-27', dateLabel: 'Fri Mar 27',
        dayOfWeek: 'Fri', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'MS-B', role: 'Staff RN', needed: 3,
        bids: [
          { nurseId: 'st-008', nurseName: 'Kevin Park',      nurseInitials: 'KP', nurseColor: 'from-cyan-500 to-cyan-700',   nurseRole: 'Staff RN', seniorityYears: 5, priority: 1, status: 'placed',    bidAt: '10h ago' },
        ],
      },
      {
        id: 'sl-010', date: '2026-03-27', dateLabel: 'Fri Mar 27',
        dayOfWeek: 'Fri', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'MS-B', role: 'Staff RN', needed: 2,
        bids: [
          { nurseId: 'st-008', nurseName: 'Kevin Park',      nurseInitials: 'KP', nurseColor: 'from-cyan-500 to-cyan-700',   nurseRole: 'Staff RN', seniorityYears: 5, priority: 2, status: 'placed',    bidAt: '10h ago' },
          { nurseId: 'st-007', nurseName: 'Alicia Rodriguez',nurseInitials: 'AR', nurseColor: 'from-pink-500 to-pink-700',   nurseRole: 'Staff RN', seniorityYears: 4, priority: 2, status: 'placed',    bidAt: '6h ago' },
        ],
      },
      // ── SAT Mar 28 ──────────────────────────────────────────────────────────
      {
        id: 'sl-011', date: '2026-03-28', dateLabel: 'Sat Mar 28',
        dayOfWeek: 'Sat', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'ICU', role: 'Staff RN', needed: 2,
        bids: [],
      },
      {
        id: 'sl-012', date: '2026-03-28', dateLabel: 'Sat Mar 28',
        dayOfWeek: 'Sat', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'ICU', role: 'Staff RN', needed: 2,
        bids: [],
      },
      // ── SUN Mar 29 ──────────────────────────────────────────────────────────
      {
        id: 'sl-013', date: '2026-03-29', dateLabel: 'Sun Mar 29',
        dayOfWeek: 'Sun', shiftType: 'day', shiftHours: '07:00–19:00',
        unit: 'Telemetry', role: 'Staff RN', needed: 3,
        bids: [
          { nurseId: 'st-010', nurseName: "James O'Brien",   nurseInitials: 'JO', nurseColor: 'from-indigo-500 to-indigo-700', nurseRole: 'Staff RN', seniorityYears: 6, priority: 1, status: 'placed',  bidAt: '11h ago' },
          { nurseId: 'st-014', nurseName: 'Beth Anderson',   nurseInitials: 'BA', nurseColor: 'from-sky-500 to-sky-700',     nurseRole: 'Staff RN', seniorityYears: 2, priority: 3, status: 'placed',    bidAt: '7h ago' },
        ],
      },
      {
        id: 'sl-014', date: '2026-03-29', dateLabel: 'Sun Mar 29',
        dayOfWeek: 'Sun', shiftType: 'night', shiftHours: '19:00–07:00',
        unit: 'Telemetry', role: 'Staff RN', needed: 2,
        bids: [],
      },
    ],
  },

  // ── Past published cycle ─────────────────────────────────────────────────────
  {
    id: 'cyc-000',
    label: 'Week of Mar 16 – Mar 22, 2026',
    periodStart: '2026-03-16',
    periodEnd:   '2026-03-22',
    status:      'published',
    windowOpens:  'Mar 5 at 08:00',
    windowCloses: 'Mar 7 at 08:00',
    hoursRemaining: 0,
    slots: [],
  },
]

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getCycles(): BidCycle[] { return _cycles }
export function getCycle(id: string): BidCycle | undefined {
  return _cycles.find(c => c.id === id)
}
export function getActiveCycle(): BidCycle {
  return _cycles.find(c => c.status === 'open') ?? _cycles[0]
}

export function getMyBidsForCycle(cycleId: string): ScheduleSlot[] {
  const cycle = getCycle(cycleId)
  if (!cycle) return []
  return cycle.slots.filter(s =>
    s.bids.some(b => b.nurseId === CURRENT_USER.id)
  )
}

export function getCycleStats(cycleId: string) {
  const cycle = getCycle(cycleId)
  if (!cycle) return { total: 0, filled: 0, unfilled: 0, conflicts: 0, myBids: 0 }
  const total = cycle.slots.reduce((s, sl) => s + sl.needed, 0)
  const filled = cycle.slots.reduce((s, sl) => {
    const confirmedOrPlaced = sl.bids.filter(b =>
      b.status === 'confirmed' || (b.status === 'placed' && sl.bids.length >= sl.needed)
    ).length
    return s + Math.min(confirmedOrPlaced, sl.needed)
  }, 0)
  const conflicts = cycle.slots.reduce((s, sl) =>
    s + (sl.bids.some(b => b.status === 'conflict') ? 1 : 0), 0
  )
  const myBids = cycle.slots.filter(s =>
    s.bids.some(b => b.nurseId === CURRENT_USER.id)
  ).length
  return { total, filled, unfilled: total - filled, conflicts, myBids }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function placeBid(
  cycleId: string,
  slotId: string,
  priority: 1 | 2 | 3,
): void {
  const cycle = _cycles.find(c => c.id === cycleId)
  if (!cycle || cycle.status !== 'open') return
  const slot = cycle.slots.find(s => s.id === slotId)
  if (!slot) return
  // Remove existing bid if any
  slot.bids = slot.bids.filter(b => b.nurseId !== CURRENT_USER.id)
  const existingBids = slot.bids.length
  const status: BidStatus = existingBids >= slot.needed ? 'conflict' : 'placed'
  slot.bids.push({
    nurseId:       CURRENT_USER.id,
    nurseName:     CURRENT_USER.name,
    nurseInitials: CURRENT_USER.initials,
    nurseColor:    CURRENT_USER.color,
    nurseRole:     CURRENT_USER.role,
    seniorityYears: CURRENT_USER.seniorityYears,
    priority,
    status,
    bidAt: 'just now',
  })
}

export function withdrawBid(cycleId: string, slotId: string): void {
  const cycle = _cycles.find(c => c.id === cycleId)
  if (!cycle) return
  const slot = cycle.slots.find(s => s.id === slotId)
  if (!slot) return
  slot.bids = slot.bids.filter(b => b.nurseId !== CURRENT_USER.id)
}

let _publishedCycleIds = new Set<string>()

export function publishSchedule(cycleId: string): void {
  const cycle = _cycles.find(c => c.id === cycleId)
  if (!cycle) return
  cycle.status = 'published'
  // Confirm all placed bids up to needed count (by seniority)
  for (const slot of cycle.slots) {
    const sorted = [...slot.bids].sort((a, b) => b.seniorityYears - a.seniorityYears)
    sorted.forEach((bid, i) => {
      bid.status = i < slot.needed ? 'confirmed' : 'waitlisted'
    })
    slot.bids = sorted
  }
  _publishedCycleIds.add(cycleId)
}

export function isPublished(cycleId: string): boolean {
  return _publishedCycleIds.has(cycleId)
}
