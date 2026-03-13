export type SwapStatus = 'open' | 'claimed' | 'approved' | 'denied' | 'completed'
export type SwapReason = 'family-emergency' | 'medical' | 'personal' | 'vacation' | 'childcare' | 'educational' | 'other'

export interface SwapShift {
  date: string
  dateLabel: string
  shiftType: 'day' | 'night' | 'evening'
  shiftHours: string
  unit: string
  role: string
}

export interface SmartCheck {
  key: string
  label: string
  passes: boolean
  warning?: boolean
}

export interface SwapRequest {
  id: string
  postedById: string
  postedByName: string
  postedByInitials: string
  postedByColor: string
  postedByRole: string
  shift: SwapShift
  reason: string
  reasonCode: SwapReason
  notes: string
  status: SwapStatus
  postedAgo: string
  hoursUntilShift: number
  claimedById?: string
  claimedByName?: string
  claimedByInitials?: string
  claimedByColor?: string
  smartChecks?: SmartCheck[]
  managerNote?: string
}

export interface MyShift {
  id: string
  dateLabel: string
  date: string
  shiftType: 'day' | 'night'
  shiftHours: string
  unit: string
}

// ── Swappable upcoming shifts for Janet Morrison ─────────────────────────────

export const MY_UPCOMING_SHIFTS: MyShift[] = [
  { id: 'js-001', date: '2026-03-14', dateLabel: 'Sat Mar 14', shiftType: 'day',   shiftHours: '07:00–19:00', unit: 'ICU' },
  { id: 'js-002', date: '2026-03-15', dateLabel: 'Sun Mar 15', shiftType: 'night', shiftHours: '19:00–07:00', unit: 'ICU' },
  { id: 'js-003', date: '2026-03-17', dateLabel: 'Tue Mar 17', shiftType: 'day',   shiftHours: '07:00–19:00', unit: 'ICU' },
  { id: 'js-004', date: '2026-03-19', dateLabel: 'Thu Mar 19', shiftType: 'day',   shiftHours: '07:00–19:00', unit: 'ICU' },
]

export const REASON_LABELS: Record<SwapReason, string> = {
  'family-emergency': 'Family Emergency',
  'medical':          'Medical Appointment',
  'personal':         'Personal',
  'vacation':         'Vacation / Travel',
  'childcare':        'Childcare',
  'educational':      'Educational / Conference',
  'other':            'Other',
}

// ── Seeded swap requests ──────────────────────────────────────────────────────

let _swaps: SwapRequest[] = [
  // ── OPEN – URGENT (< 12h) ────────────────────────────────────────────────
  {
    id: 'sw-001',
    postedById: 'st-008', postedByName: 'Kevin Park', postedByInitials: 'KP',
    postedByColor: 'from-cyan-500 to-cyan-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-13', dateLabel: 'Fri Mar 13', shiftType: 'night',
             shiftHours: '19:00–07:00', unit: 'MS-B', role: 'Staff RN' },
    reason: 'Family Emergency', reasonCode: 'family-emergency',
    notes: 'Wife went into labor early — need coverage tonight urgently.',
    status: 'open', postedAgo: '45m ago', hoursUntilShift: 5,
  },
  // ── OPEN – NEAR (< 48h) ──────────────────────────────────────────────────
  {
    id: 'sw-002',
    postedById: 'st-004', postedByName: 'David Thompson', postedByInitials: 'DT',
    postedByColor: 'from-red-500 to-red-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-15', dateLabel: 'Sun Mar 15', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'ED', role: 'Staff RN' },
    reason: 'Medical Appointment', reasonCode: 'medical',
    notes: 'Pre-op appointment for knee surgery. Can\'t reschedule.',
    status: 'open', postedAgo: '3h ago', hoursUntilShift: 44,
  },
  // ── OPEN – NORMAL ────────────────────────────────────────────────────────
  {
    id: 'sw-003',
    postedById: 'st-003', postedByName: 'Sarah Kim', postedByInitials: 'SK',
    postedByColor: 'from-emerald-500 to-emerald-700', postedByRole: 'Charge RN',
    shift: { date: '2026-03-18', dateLabel: 'Wed Mar 18', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'CCU', role: 'Charge RN' },
    reason: 'Personal', reasonCode: 'personal',
    notes: 'Daughter\'s school play. Can cover another day in exchange.',
    status: 'open', postedAgo: '1d ago', hoursUntilShift: 118,
  },
  {
    id: 'sw-004',
    postedById: 'st-007', postedByName: 'Alicia Rodriguez', postedByInitials: 'AR',
    postedByColor: 'from-pink-500 to-pink-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-20', dateLabel: 'Fri Mar 20', shiftType: 'night',
             shiftHours: '19:00–07:00', unit: 'MS-A', role: 'Staff RN' },
    reason: 'Vacation / Travel', reasonCode: 'vacation',
    notes: 'Flight leaves Fri evening — booked before schedule posted.',
    status: 'open', postedAgo: '2d ago', hoursUntilShift: 164,
  },
  {
    id: 'sw-005',
    postedById: 'st-005', postedByName: 'Priya Patel', postedByInitials: 'PP',
    postedByColor: 'from-amber-500 to-amber-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-19', dateLabel: 'Thu Mar 19', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'ED', role: 'Staff RN' },
    reason: 'Childcare', reasonCode: 'childcare',
    notes: 'School is closed — babysitter not available.',
    status: 'open', postedAgo: '6h ago', hoursUntilShift: 140,
  },
  // ── CLAIMED – Pending manager approval ───────────────────────────────────
  {
    id: 'sw-006',
    postedById: 'st-002', postedByName: 'Marcus Chen', postedByInitials: 'MC',
    postedByColor: 'from-blue-500 to-blue-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-16', dateLabel: 'Mon Mar 16', shiftType: 'night',
             shiftHours: '19:00–07:00', unit: 'ICU', role: 'Staff RN' },
    reason: 'Medical Appointment', reasonCode: 'medical',
    notes: 'Specialist follow-up — only daytime slot available.',
    status: 'claimed', postedAgo: '2d ago', hoursUntilShift: 72,
    claimedById: 'st-013', claimedByName: 'Yuki Tanaka',
    claimedByInitials: 'YT', claimedByColor: 'from-rose-500 to-rose-700',
    smartChecks: [
      { key: 'creds', label: 'CCRN certified ✓', passes: true },
      { key: 'ot',    label: 'No OT risk',        passes: true },
      { key: 'avail', label: 'Available Mon night', passes: true },
    ],
  },
  {
    id: 'sw-007',
    postedById: 'st-011', postedByName: 'Christina Lee', postedByInitials: 'CL',
    postedByColor: 'from-purple-500 to-purple-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-17', dateLabel: 'Tue Mar 17', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'CCU', role: 'Staff RN' },
    reason: 'Family Emergency', reasonCode: 'family-emergency',
    notes: 'Father hospitalized — family needs me Monday.',
    status: 'claimed', postedAgo: '1d ago', hoursUntilShift: 88,
    claimedById: 'st-009', claimedByName: 'Linda Foster',
    claimedByInitials: 'LF', claimedByColor: 'from-teal-500 to-teal-700',
    smartChecks: [
      { key: 'creds', label: 'CCU step-down cert', passes: true },
      { key: 'ot',    label: 'OT risk: +4h over limit', passes: false, warning: true },
      { key: 'avail', label: 'Marked available Tue', passes: true },
    ],
    managerNote: 'OT alert — Linda would exceed 40h/wk. Review before approving.',
  },
  // ── APPROVED ────────────────────────────────────────────────────────────
  {
    id: 'sw-008',
    postedById: 'st-006', postedByName: 'Robert Walsh', postedByInitials: 'RW',
    postedByColor: 'from-slate-500 to-slate-700', postedByRole: 'Charge RN',
    shift: { date: '2026-03-14', dateLabel: 'Sat Mar 14', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'MS-A', role: 'Charge RN' },
    reason: 'Personal', reasonCode: 'personal',
    notes: '',
    status: 'approved', postedAgo: '3d ago', hoursUntilShift: 24,
    claimedById: 'st-012', claimedByName: 'Miguel Santos',
    claimedByInitials: 'MS', claimedByColor: 'from-orange-500 to-orange-700',
    smartChecks: [
      { key: 'creds', label: 'Charge-eligible ✓', passes: true },
      { key: 'ot',    label: 'No OT risk', passes: true },
      { key: 'avail', label: 'Available Sat', passes: true },
    ],
  },
  // ── DENIED ───────────────────────────────────────────────────────────────
  {
    id: 'sw-009',
    postedById: 'st-010', postedByName: "James O'Brien", postedByInitials: 'JO',
    postedByColor: 'from-indigo-500 to-indigo-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-13', dateLabel: 'Fri Mar 13', shiftType: 'day',
             shiftHours: '07:00–19:00', unit: 'Telemetry', role: 'Staff RN' },
    reason: 'Personal', reasonCode: 'personal',
    notes: '',
    status: 'denied', postedAgo: '1d ago', hoursUntilShift: 0,
    claimedById: 'st-014', claimedByName: 'Beth Anderson',
    claimedByInitials: 'BA', claimedByColor: 'from-sky-500 to-sky-700',
    smartChecks: [
      { key: 'creds', label: 'Tele cert required', passes: false },
      { key: 'ot',    label: 'OT risk', passes: false, warning: true },
    ],
    managerNote: 'Beth does not hold Telemetry certification.',
  },
  // ── COMPLETED ────────────────────────────────────────────────────────────
  {
    id: 'sw-010',
    postedById: 'st-013', postedByName: 'Yuki Tanaka', postedByInitials: 'YT',
    postedByColor: 'from-rose-500 to-rose-700', postedByRole: 'Staff RN',
    shift: { date: '2026-03-12', dateLabel: 'Thu Mar 12', shiftType: 'night',
             shiftHours: '19:00–07:00', unit: 'ICU', role: 'Staff RN' },
    reason: 'Medical Appointment', reasonCode: 'medical',
    notes: '',
    status: 'completed', postedAgo: '4d ago', hoursUntilShift: -12,
    claimedById: 'st-001', claimedByName: 'Janet Morrison',
    claimedByInitials: 'JM', claimedByColor: 'from-violet-500 to-violet-700',
    smartChecks: [
      { key: 'creds', label: 'CCRN certified ✓', passes: true },
      { key: 'ot',    label: 'No OT risk', passes: true },
      { key: 'avail', label: 'Available', passes: true },
    ],
  },
]

// ── Module-level session counter ─────────────────────────────────────────────

let _nextId = 11

// ── Accessors ────────────────────────────────────────────────────────────────

export function getSwaps(): SwapRequest[] { return _swaps }
export function getSwap(id: string): SwapRequest | undefined { return _swaps.find(s => s.id === id) }

export function getOpenSwaps(): SwapRequest[] {
  return _swaps.filter(s => s.status === 'open').sort((a, b) => a.hoursUntilShift - b.hoursUntilShift)
}

export function getApprovalQueue(): SwapRequest[] {
  return _swaps.filter(s => s.status === 'claimed')
}

export function getMySwaps(): SwapRequest[] {
  // Swaps posted BY me OR claimed BY me (using 'st-001' as current user)
  return _swaps.filter(s =>
    s.postedById === 'st-001' ||
    s.claimedById === 'st-001'
  )
}

export function claimSwap(swapId: string): void {
  const s = _swaps.find(s => s.id === swapId)
  if (!s || s.status !== 'open') return
  s.status = 'claimed'
  s.claimedById = 'st-001'
  s.claimedByName = 'Janet Morrison'
  s.claimedByInitials = 'JM'
  s.claimedByColor = 'from-violet-500 to-violet-700'
  s.smartChecks = [
    { key: 'creds', label: 'Credentials verified ✓', passes: true },
    { key: 'ot',    label: s.hoursUntilShift < 24 ? 'Near OT limit' : 'No OT risk',
                    passes: s.hoursUntilShift >= 24, warning: s.hoursUntilShift < 24 },
    { key: 'avail', label: 'Marked available', passes: true },
  ]
}

export function approveSwap(swapId: string): void {
  const s = _swaps.find(s => s.id === swapId)
  if (!s || s.status !== 'claimed') return
  s.status = 'approved'
}

export function denySwap(swapId: string, reason: string): void {
  const s = _swaps.find(s => s.id === swapId)
  if (!s || s.status !== 'claimed') return
  s.status = 'denied'
  s.managerNote = reason || 'Denied by manager.'
}

export function postSwap(
  shiftId: string,
  reasonCode: SwapReason,
  notes: string
): SwapRequest {
  const myShift = MY_UPCOMING_SHIFTS.find(s => s.id === shiftId)!
  const newSwap: SwapRequest = {
    id: `sw-${String(_nextId++).padStart(3, '0')}`,
    postedById: 'st-001', postedByName: 'Janet Morrison',
    postedByInitials: 'JM', postedByColor: 'from-violet-500 to-violet-700',
    postedByRole: 'Staff RN',
    shift: {
      date: myShift.date, dateLabel: myShift.dateLabel,
      shiftType: myShift.shiftType, shiftHours: myShift.shiftHours,
      unit: myShift.unit, role: 'Staff RN',
    },
    reason: REASON_LABELS[reasonCode],
    reasonCode,
    notes,
    status: 'open',
    postedAgo: 'just now',
    hoursUntilShift: 72,
  }
  _swaps = [newSwap, ..._swaps]
  return newSwap
}

export function getStats() {
  const open    = _swaps.filter(s => s.status === 'open').length
  const pending = _swaps.filter(s => s.status === 'claimed').length
  const done    = _swaps.filter(s => s.status === 'approved' || s.status === 'completed').length
  const urgent  = _swaps.filter(s => s.status === 'open' && s.hoursUntilShift <= 24).length
  return { open, pending, done, urgent, avgFillHours: 4.2 }
}
