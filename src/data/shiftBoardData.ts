// shiftBoardData.ts — Open Shift Board & Swap Marketplace

export type ShiftType = 'day' | 'evening' | 'night'
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low'
export type OpenShiftStatus = 'open' | 'posted' | 'claimed' | 'filled'
export type SwapStatus = 'pending' | 'approved' | 'declined'

export interface StaffSuggestion {
  id: string
  name: string
  initials: string
  role: string
  reliabilityScore: number   // 0-100
  hoursThisWeek: number
  availabilityNote: string
  certifications: string[]
  overtimeCost: number        // extra $ vs base rate
}

export interface OpenShift {
  id: string
  unit: string
  unitShort: string
  unitAccent: string          // tailwind gradient / color class
  date: string                // "Thu Mar 12"
  shift: ShiftType
  shiftTime: string           // "7PM–7AM"
  hours: number
  requiredRole: string
  urgency: UrgencyLevel
  reason: string
  hoursUntil: number          // hours until shift starts (from "now" = 2pm Mar 12)
  status: OpenShiftStatus
  postedAt: string | null
  claimedBy: StaffSuggestion | null
  suggestions: StaffSuggestion[]
}

export interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterInitials: string
  requesterShift: string      // "Day · Wed 3/19 · ICU"
  offererId: string
  offererName: string
  offererInitials: string
  offererShift: string        // "Evening · Thu 3/20 · ICU"
  reason: string
  submittedAt: string         // "2h ago"
  coverageImpact: 'none' | 'minor' | 'risk'
  status: SwapStatus
}

export interface FillHistoryItem {
  id: string
  unit: string
  shift: string
  staffName: string
  staffInitials: string
  filledAt: string
  fillTimeMinutes: number
  method: 'direct' | 'board' | 'alert'
}

// ─── Staff suggestion pools ──────────────────────────────────────────────────

const STAFF_POOL: StaffSuggestion[] = [
  { id: 'sug001', name: 'Carmen Lopez',    initials: 'CL', role: 'Charge RN',  reliabilityScore: 97, hoursThisWeek: 24, availabilityNote: 'Off today, open for OT',        certifications: ['ICU', 'ACLS', 'BLS'],       overtimeCost: 340 },
  { id: 'sug002', name: 'Jaylen Brooks',   initials: 'JB', role: 'Float RN',   reliabilityScore: 94, hoursThisWeek: 28, availabilityNote: 'Float pool, ICU certified',      certifications: ['ICU', 'Float', 'BLS'],      overtimeCost: 285 },
  { id: 'sug003', name: 'Dana Willis',     initials: 'DW', role: 'RN',         reliabilityScore: 88, hoursThisWeek: 36, availabilityNote: 'Day shift done, prefers OT',     certifications: ['ICU', 'PALS', 'BLS'],       overtimeCost: 510 },
  { id: 'sug004', name: 'Rachel Torres',   initials: 'RT', role: 'RN',         reliabilityScore: 91, hoursThisWeek: 20, availabilityNote: 'Scheduled off, willing to cover', certifications: ['Med-Surg', 'BLS'],         overtimeCost: 295 },
  { id: 'sug005', name: 'Kevin Park',      initials: 'KP', role: 'RN',         reliabilityScore: 85, hoursThisWeek: 32, availabilityNote: 'Available, texted willingness',   certifications: ['Med-Surg', 'BLS', 'ACLS'], overtimeCost: 320 },
  { id: 'sug006', name: 'Greg Hall',       initials: 'GH', role: 'Charge RN',  reliabilityScore: 93, hoursThisWeek: 16, availabilityNote: 'Off today, free for night OT',    certifications: ['Med-Surg', 'BLS'],         overtimeCost: 180 },
  { id: 'sug007', name: 'Tina Adams',      initials: 'TA', role: 'RN',         reliabilityScore: 90, hoursThisWeek: 24, availabilityNote: 'Available all Friday',             certifications: ['ICU', 'BLS'],              overtimeCost: 260 },
  { id: 'sug008', name: 'Mia Lord',        initials: 'ML', role: 'Charge RN',  reliabilityScore: 96, hoursThisWeek: 12, availabilityNote: 'Low hours this week, keen',       certifications: ['ED', 'TNCC', 'ACLS'],      overtimeCost: 390 },
  { id: 'sug009', name: 'Jake Moss',       initials: 'JM', role: 'RN',         reliabilityScore: 82, hoursThisWeek: 28, availabilityNote: 'Available, 2 prior ED nights',    certifications: ['ED', 'BLS'],               overtimeCost: 310 },
  { id: 'sug010', name: 'Gina Flores',     initials: 'GF', role: 'Charge RN',  reliabilityScore: 98, hoursThisWeek: 24, availabilityNote: 'PICU lead, happy to cover',       certifications: ['PICU', 'PALS', 'NRP'],     overtimeCost: 420 },
  { id: 'sug011', name: 'Sam Reed',        initials: 'SR', role: 'RN',         reliabilityScore: 87, hoursThisWeek: 20, availabilityNote: 'Acted as charge last month',      certifications: ['PICU', 'PALS'],            overtimeCost: 280 },
  { id: 'sug012', name: 'Oscar Reyes',     initials: 'OR', role: 'RN',         reliabilityScore: 89, hoursThisWeek: 30, availabilityNote: 'Available weekend AM',            certifications: ['Med-Surg', 'BLS'],         overtimeCost: 250 },
]

function suggestion(id: string): StaffSuggestion {
  return STAFF_POOL.find(s => s.id === id)!
}

// ─── Open shifts ─────────────────────────────────────────────────────────────

const _shiftStatuses = new Map<string, OpenShiftStatus>()
const _shiftAssignees = new Map<string, StaffSuggestion>()
const _postedShifts = new Set<string>()
const _alertsSent = new Set<string>()

const BASE_OPEN_SHIFTS: OpenShift[] = [
  {
    id: 'sb001',
    unit: 'ICU',
    unitShort: 'ICU',
    unitAccent: 'bg-violet-600',
    date: 'Thu Mar 12',
    shift: 'night',
    shiftTime: '7PM–7AM',
    hours: 12,
    requiredRole: 'Charge RN / RN (ICU cert)',
    urgency: 'critical',
    reason: 'Call-out: James Okafor (reported sick 11:42 AM)',
    hoursUntil: 5,
    status: 'open',
    postedAt: null,
    claimedBy: null,
    suggestions: [suggestion('sug001'), suggestion('sug002'), suggestion('sug003')],
  },
  {
    id: 'sb002',
    unit: 'Med-Surg B',
    unitShort: 'MS-B',
    unitAccent: 'bg-cyan-600',
    date: 'Fri Mar 13',
    shift: 'day',
    shiftTime: '7AM–7PM',
    hours: 12,
    requiredRole: 'RN (Med-Surg)',
    urgency: 'high',
    reason: 'No-show pattern: Tyler Barnes (3rd instance this month)',
    hoursUntil: 17,
    status: 'open',
    postedAt: null,
    claimedBy: null,
    suggestions: [suggestion('sug004'), suggestion('sug005'), suggestion('sug006')],
  },
  {
    id: 'sb003',
    unit: 'ICU',
    unitShort: 'ICU',
    unitAccent: 'bg-violet-600',
    date: 'Sat Mar 14',
    shift: 'evening',
    shiftTime: '3PM–11PM',
    hours: 8,
    requiredRole: 'RN (ICU cert)',
    urgency: 'high',
    reason: 'Proactive posting — weekend evening traditionally understaffed',
    hoursUntil: 49,
    status: 'open',
    postedAt: null,
    claimedBy: null,
    suggestions: [suggestion('sug007'), suggestion('sug002'), suggestion('sug001')],
  },
  {
    id: 'sb004',
    unit: 'PICU',
    unitShort: 'PICU',
    unitAccent: 'bg-emerald-600',
    date: 'Sun Mar 15',
    shift: 'day',
    shiftTime: '7AM–7PM',
    hours: 12,
    requiredRole: 'Charge RN (PICU cert)',
    urgency: 'medium',
    reason: 'Regular weekend gap — charge rotation needs coverage',
    hoursUntil: 65,
    status: 'open',
    postedAt: null,
    claimedBy: null,
    suggestions: [suggestion('sug010'), suggestion('sug011')],
  },
  {
    id: 'sb005',
    unit: 'Emergency Dept',
    unitShort: 'ED',
    unitAccent: 'bg-red-600',
    date: 'Mon Mar 16',
    shift: 'night',
    shiftTime: '11PM–7AM',
    hours: 8,
    requiredRole: 'Charge RN (ED, TNCC)',
    urgency: 'medium',
    reason: 'Advance planning — Mia Lord requested PTO, not yet approved',
    hoursUntil: 105,
    status: 'open',
    postedAt: null,
    claimedBy: null,
    suggestions: [suggestion('sug008'), suggestion('sug009')],
  },
]

export function getOpenShifts(): OpenShift[] {
  return BASE_OPEN_SHIFTS.map(s => ({
    ...s,
    status: _shiftStatuses.get(s.id) ?? s.status,
    claimedBy: _shiftAssignees.get(s.id) ?? s.claimedBy,
    postedAt: _postedShifts.has(s.id) ? 'Just now' : s.postedAt,
  }))
}

export function postShiftToBoard(shiftId: string): void {
  _postedShifts.add(shiftId)
  _shiftStatuses.set(shiftId, 'posted')
}

export function assignShift(shiftId: string, staff: StaffSuggestion): void {
  _shiftAssignees.set(shiftId, staff)
  _shiftStatuses.set(shiftId, 'filled')
}

export function sendShiftAlert(shiftId: string): void {
  _alertsSent.add(shiftId)
}

export function hasAlertSent(shiftId: string): boolean {
  return _alertsSent.has(shiftId)
}

// ─── Swap requests ────────────────────────────────────────────────────────────

const _swapStatuses = new Map<string, SwapStatus>()

const BASE_SWAPS: SwapRequest[] = [
  {
    id: 'sw001',
    requesterId: 'e021',
    requesterName: 'Lisa Greenwald',
    requesterInitials: 'LG',
    requesterShift: 'Day · Wed Mar 18 · ICU · 7AM–7PM',
    offererId: 'e002',
    offererName: 'James Okafor',
    offererInitials: 'JO',
    offererShift: 'Evening · Thu Mar 19 · ICU · 3PM–11PM',
    reason: "Family appointment — daughter's school event, pre-arranged",
    submittedAt: '2h ago',
    coverageImpact: 'none',
    status: 'pending',
  },
  {
    id: 'sw002',
    requesterId: 'e006',
    requesterName: 'Marcus Williams',
    requesterInitials: 'MW',
    requesterShift: 'Night · Fri Mar 20 · Med-Surg B · 7PM–7AM',
    offererId: 'e004',
    offererName: 'Nathan Foster',
    offererInitials: 'NF',
    offererShift: 'Day · Sat Mar 21 · Med-Surg B · 7AM–7PM',
    reason: 'Medical appointment Friday afternoon — requires day-of change',
    submittedAt: '5h ago',
    coverageImpact: 'minor',
    status: 'pending',
  },
]

export function getSwapRequests(): SwapRequest[] {
  return BASE_SWAPS.map(sw => ({
    ...sw,
    status: _swapStatuses.get(sw.id) ?? sw.status,
  }))
}

export function approveSwap(id: string): void {
  _swapStatuses.set(id, 'approved')
}

export function declineSwap(id: string): void {
  _swapStatuses.set(id, 'declined')
}

// ─── Fill history ─────────────────────────────────────────────────────────────

export const FILL_HISTORY: FillHistoryItem[] = [
  { id: 'fh001', unit: 'ICU',      shift: 'Day · Mon Mar 9',  staffName: 'Dana Willis',   staffInitials: 'DW', filledAt: '3 days ago', fillTimeMinutes: 12, method: 'direct' },
  { id: 'fh002', unit: 'ED',       shift: 'Night · Mon Mar 9',staffName: 'Jake Moss',     staffInitials: 'JM', filledAt: '3 days ago', fillTimeMinutes: 28, method: 'alert' },
  { id: 'fh003', unit: 'Med-Surg A',shift: 'Eve · Tue Mar 10',staffName: 'Oscar Reyes',  staffInitials: 'OR', filledAt: '2 days ago', fillTimeMinutes: 8,  method: 'board' },
  { id: 'fh004', unit: 'PICU',     shift: 'Day · Wed Mar 11', staffName: 'Gina Flores',  staffInitials: 'GF', filledAt: '1 day ago',  fillTimeMinutes: 5,  method: 'direct' },
  { id: 'fh005', unit: 'ICU',      shift: 'Eve · Wed Mar 11', staffName: 'Rachel Torres',staffInitials: 'RT', filledAt: '1 day ago',  fillTimeMinutes: 19, method: 'board' },
]

// ─── Board stats ──────────────────────────────────────────────────────────────

export interface BoardStats {
  openCount: number
  criticalCount: number
  pendingSwaps: number
  filledThisWeek: number
  avgFillMinutes: number
}

export function getBoardStats(): BoardStats {
  const shifts = getOpenShifts()
  const swaps = getSwapRequests()
  const open   = shifts.filter(s => s.status !== 'filled').length
  const critical = shifts.filter(s => s.urgency === 'critical' && s.status !== 'filled').length
  const pending = swaps.filter(s => s.status === 'pending').length
  const filledThisWeek = FILL_HISTORY.length + shifts.filter(s => s.status === 'filled').length
  const avgFill = Math.round(FILL_HISTORY.reduce((a, b) => a + b.fillTimeMinutes, 0) / FILL_HISTORY.length)
  return { openCount: open, criticalCount: critical, pendingSwaps: pending, filledThisWeek, avgFillMinutes: avgFill }
}

export const URGENCY_META: Record<UrgencyLevel, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical',  color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-400',    dot: 'bg-red-500' },
  high:     { label: 'High',      color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-400',  dot: 'bg-amber-500' },
  medium:   { label: 'Medium',    color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-400',   dot: 'bg-blue-400' },
  low:      { label: 'Low',       color: 'text-emerald-700',bg: 'bg-emerald-100',border: 'border-emerald-400',dot: 'bg-emerald-400' },
}

export const SHIFT_META: Record<ShiftType, { label: string; icon: string }> = {
  day:     { label: 'Day',     icon: '☀️' },
  evening: { label: 'Evening', icon: '🌆' },
  night:   { label: 'Night',   icon: '🌙' },
}

export const METHOD_META = {
  direct: { label: 'Direct Assign', color: 'text-violet-600', bg: 'bg-violet-100' },
  board:  { label: 'Board Pickup',  color: 'text-blue-600',   bg: 'bg-blue-100' },
  alert:  { label: 'Alert Sent',    color: 'text-amber-600',  bg: 'bg-amber-100' },
}
