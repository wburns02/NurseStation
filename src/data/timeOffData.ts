// timeOffData.ts — PTO & Time-Off Management data layer
// Reference date: March 12, 2026 (Thursday)

// ─── Types ────────────────────────────────────────────────────────────────────

export type PTOType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'fmla' | 'jury'
export type PTOStatus = 'pending' | 'approved' | 'denied'
export type ImpactSeverity = 'critical' | 'warning' | 'none'

export interface SuggestedCoverage {
  staffName: string
  staffId?: string
  type: 'float' | 'ot' | 'per-diem' | 'existing'
  cost: number  // shift cost
  note: string
}

export interface CoverageImpact {
  severity: ImpactSeverity
  description: string
  affectedShifts: number
  unitCoverage: string  // e.g. "3/4 staffed"
  unitCoverageAfter: string // how it looks after applying best coverage
  suggestedCoverage: SuggestedCoverage[]
  netCost: number  // additional cost to cover (vs just paying PTO)
}

export interface PTORequest {
  id: string
  staffId: string
  staffName: string
  avatarInitials: string
  role: string
  unit: string
  type: PTOType
  startDate: string   // 'Mar 19', etc.
  endDate: string
  startDateISO: string  // for sorting
  totalDays: number
  totalHours: number
  submittedAt: string  // '2 days ago', '1h ago', etc.
  submittedSort: number // timestamp ms for sort
  status: PTOStatus
  reason?: string
  managerNote?: string
  impact: CoverageImpact
  ptoCost: number   // pay cost for the employee while out (from accrued PTO)
  coverageCost: number  // total cost to cover their shifts
  ptoBalanceRemaining: number  // hours remaining after this request
}

export interface PTOBalance {
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
  hourlyRate: number
  accrualRatePerPeriod: number  // hours earned per biweekly period
  balanceHours: number           // current accrued balance
  usedHoursYTD: number
  pendingHours: number           // submitted but not yet approved
  scheduledHours: number         // approved future time off already scheduled
  maxCarryover: number           // max hours allowed to carry into next year
}

// ─── PTO type metadata ────────────────────────────────────────────────────────

export const PTO_TYPE_META: Record<PTOType, { label: string; color: string; bg: string; icon: string }> = {
  vacation:    { label: 'Vacation',    color: 'text-blue-700',    bg: 'bg-blue-100',    icon: '🌴' },
  sick:        { label: 'Sick Leave',  color: 'text-red-700',     bg: 'bg-red-100',     icon: '🤒' },
  personal:    { label: 'Personal',    color: 'text-violet-700',  bg: 'bg-violet-100',  icon: '👤' },
  bereavement: { label: 'Bereavement', color: 'text-slate-700',   bg: 'bg-slate-100',   icon: '🕊' },
  fmla:        { label: 'FMLA',        color: 'text-amber-700',   bg: 'bg-amber-100',   icon: '⚕' },
  jury:        { label: 'Jury Duty',   color: 'text-teal-700',    bg: 'bg-teal-100',    icon: '⚖' },
}

// ─── PTO Requests ────────────────────────────────────────────────────────────

const NOW = Date.now()
const hrs = (n: number) => NOW - n * 3_600_000
const days = (n: number) => NOW - n * 86_400_000

export const allPTORequests: PTORequest[] = [

  // ── PENDING ────────────────────────────────────────────────────────────────

  {
    id: 'pto001',
    staffId: 'e002',
    staffName: 'James Okafor',
    avatarInitials: 'JO',
    role: 'RN',
    unit: 'ICU',
    type: 'vacation',
    startDate: 'Mar 19',
    endDate: 'Mar 21',
    startDateISO: '2026-03-19',
    totalDays: 3,
    totalHours: 24,
    submittedAt: '2h ago',
    submittedSort: hrs(2),
    status: 'pending',
    reason: 'Family trip planned for spring break.',
    impact: {
      severity: 'critical',
      description: 'ICU would drop to 2/4 staffed on Mar 19 Day shift. Trauma census is typically elevated mid-week. Joint Commission minimum requires 3 RNs for current acuity.',
      affectedShifts: 3,
      unitCoverage: '2/4',
      unitCoverageAfter: '3/4',
      suggestedCoverage: [
        { staffName: 'Sarah Chen',   staffId: 's001', type: 'float',    cost: 344, note: '8h left before OT, ICU certified' },
        { staffName: 'Aisha Patel',  staffId: 'e023', type: 'float',    cost: 392, note: 'Available all 3 days, no OT risk' },
        { staffName: 'Linda M.',                      type: 'per-diem', cost: 576, note: 'ICU experience, per-diem rate $72/hr' },
      ],
      netCost: 1_032,
    },
    ptoCost: 3_312,   // 24h × $46/hr × 3 = full day rate
    coverageCost: 1_032,
    ptoBalanceRemaining: 40,
  },

  {
    id: 'pto002',
    staffId: 'e016',
    staffName: 'Christine Park',
    avatarInitials: 'CP',
    role: 'Charge RN',
    unit: 'Med-Surg B',
    type: 'personal',
    startDate: 'Mar 22',
    endDate: 'Mar 22',
    startDateISO: '2026-03-22',
    totalDays: 1,
    totalHours: 8,
    submittedAt: '1d ago',
    submittedSort: days(1),
    status: 'pending',
    reason: 'Personal appointment, cannot reschedule.',
    impact: {
      severity: 'warning',
      description: 'Med-Surg B will need a charge RN on Mar 22. No other charge-qualified nurse is currently scheduled on that shift.',
      affectedShifts: 1,
      unitCoverage: 'No Charge RN',
      unitCoverageAfter: 'Charge covered',
      suggestedCoverage: [
        { staffName: 'Nathan Foster', staffId: 'e007', type: 'ot', cost: 432, note: 'Charge-qualified, 2h OT, manageable' },
        { staffName: 'Priya Sharma',  staffId: 'e001', type: 'existing', cost: 0, note: 'Can cross-cover from ICU for charge duties' },
      ],
      netCost: 432,
    },
    ptoCost: 416,
    coverageCost: 432,
    ptoBalanceRemaining: 96,
  },

  {
    id: 'pto003',
    staffId: 's001',
    staffName: 'Sarah Chen',
    avatarInitials: 'SC',
    role: 'RN',
    unit: 'Float Pool',
    type: 'vacation',
    startDate: 'Apr 1',
    endDate: 'Apr 7',
    startDateISO: '2026-04-01',
    totalDays: 5,
    totalHours: 40,
    submittedAt: '3d ago',
    submittedSort: days(3),
    status: 'pending',
    reason: 'Spring vacation — 2 months advance notice.',
    impact: {
      severity: 'warning',
      description: 'Sarah is the top float pool RN (ICU/ED certified, 95% match scores). Losing her for 5 days reduces float pool coverage by 30% during spring census peak.',
      affectedShifts: 5,
      unitCoverage: 'Float pool -30%',
      unitCoverageAfter: 'Float pool -10%',
      suggestedCoverage: [
        { staffName: 'Aisha Patel',  staffId: 'e023', type: 'float',    cost: 1_960, note: '5 shifts, no OT risk, good match scores' },
        { staffName: 'Derrick Obi',  staffId: 'e031', type: 'float',    cost: 1_840, note: '5 shifts, available, med-surg background' },
      ],
      netCost: 400,
    },
    ptoCost: 1_720,
    coverageCost: 400,
    ptoBalanceRemaining: 64,
  },

  {
    id: 'pto004',
    staffId: 'e021',
    staffName: 'Lisa Greenwald',
    avatarInitials: 'LG',
    role: 'RN',
    unit: 'NICU',
    type: 'personal',
    startDate: 'Mar 20',
    endDate: 'Mar 20',
    startDateISO: '2026-03-20',
    totalDays: 1,
    totalHours: 8,
    submittedAt: '4h ago',
    submittedSort: hrs(4),
    status: 'pending',
    reason: 'Credential renewal exam — scheduled to recertify RNC-NIC.',
    impact: {
      severity: 'none',
      description: 'NICU remains at 4/4 on Mar 20. Hannah Moore covers RNC-NIC minimum requirement.',
      affectedShifts: 0,
      unitCoverage: '4/4',
      unitCoverageAfter: '4/4',
      suggestedCoverage: [],
      netCost: 0,
    },
    ptoCost: 424,
    coverageCost: 0,
    ptoBalanceRemaining: 88,
  },

  {
    id: 'pto005',
    staffId: 's002',
    staffName: 'Marcus Williams',
    avatarInitials: 'MW',
    role: 'RN',
    unit: 'Float Pool',
    type: 'sick',
    startDate: 'Mar 13',
    endDate: 'Mar 13',
    startDateISO: '2026-03-13',
    totalDays: 1,
    totalHours: 8,
    submittedAt: '23m ago',
    submittedSort: hrs(0.4),
    status: 'pending',
    reason: 'Not feeling well — fever this morning.',
    impact: {
      severity: 'warning',
      description: 'Marcus is scheduled to cover the ICU Day gap on Mar 13. His absence removes the best float pool option without a critical replacement.',
      affectedShifts: 1,
      unitCoverage: '3/4',
      unitCoverageAfter: '4/4',
      suggestedCoverage: [
        { staffName: 'Sarah Chen', staffId: 's001', type: 'float', cost: 344, note: 'Next best float option, ICU certified' },
        { staffName: 'Linda M.', type: 'per-diem', cost: 576, note: 'Per-diem, available same-day' },
      ],
      netCost: 344,
    },
    ptoCost: 376,
    coverageCost: 344,
    ptoBalanceRemaining: 48,
  },

  // ── APPROVED ───────────────────────────────────────────────────────────────

  {
    id: 'pto006',
    staffId: 'e001',
    staffName: 'Priya Sharma',
    avatarInitials: 'PS',
    role: 'Charge RN',
    unit: 'ICU',
    type: 'vacation',
    startDate: 'Mar 24',
    endDate: 'Mar 28',
    startDateISO: '2026-03-24',
    totalDays: 5,
    totalHours: 40,
    submittedAt: '2 weeks ago',
    submittedSort: days(14),
    status: 'approved',
    managerNote: 'Approved. Cross-training with Marcus Williams as acting charge.',
    impact: {
      severity: 'warning',
      description: 'ICU Charge RN coverage arranged with Marcus Williams for 5 days.',
      affectedShifts: 5,
      unitCoverage: 'Charge covered',
      unitCoverageAfter: 'Charge covered',
      suggestedCoverage: [],
      netCost: 560,
    },
    ptoCost: 2_080,
    coverageCost: 560,
    ptoBalanceRemaining: 72,
  },

  {
    id: 'pto007',
    staffId: 'e007',
    staffName: 'Nathan Foster',
    avatarInitials: 'NF',
    role: 'Charge RN',
    unit: 'Med-Surg B',
    type: 'bereavement',
    startDate: 'Mar 16',
    endDate: 'Mar 18',
    startDateISO: '2026-03-16',
    totalDays: 3,
    totalHours: 24,
    submittedAt: '5d ago',
    submittedSort: days(5),
    status: 'approved',
    reason: 'Family bereavement.',
    managerNote: 'Approved immediately. Deepest condolences. Coverage arranged.',
    impact: {
      severity: 'none',
      description: 'Coverage arranged with Tyler Barnes (acting charge) for 3 days.',
      affectedShifts: 3,
      unitCoverage: 'Charge covered',
      unitCoverageAfter: 'Charge covered',
      suggestedCoverage: [],
      netCost: 0,
    },
    ptoCost: 1_296,
    coverageCost: 0,
    ptoBalanceRemaining: 56,
  },

  {
    id: 'pto008',
    staffId: 's005',
    staffName: 'Tyler Barnes',
    avatarInitials: 'TB',
    role: 'CNA',
    unit: 'Med-Surg B',
    type: 'vacation',
    startDate: 'Mar 30',
    endDate: 'Apr 3',
    startDateISO: '2026-03-30',
    totalDays: 5,
    totalHours: 40,
    submittedAt: '1 week ago',
    submittedSort: days(7),
    status: 'approved',
    managerNote: 'Approved. Float CNA assigned for coverage.',
    impact: {
      severity: 'none',
      description: 'Float CNA coverage arranged for all 5 days.',
      affectedShifts: 5,
      unitCoverage: '5/5',
      unitCoverageAfter: '5/5',
      suggestedCoverage: [],
      netCost: 200,
    },
    ptoCost: 1_520,
    coverageCost: 200,
    ptoBalanceRemaining: 80,
  },

  // ── DENIED ─────────────────────────────────────────────────────────────────

  {
    id: 'pto009',
    staffId: 'e008',
    staffName: 'Fatima Hassan',
    avatarInitials: 'FH',
    role: 'RN',
    unit: 'ED',
    type: 'vacation',
    startDate: 'Mar 14',
    endDate: 'Mar 15',
    startDateISO: '2026-03-14',
    totalDays: 2,
    totalHours: 16,
    submittedAt: '3d ago',
    submittedSort: days(3),
    status: 'denied',
    reason: 'Spring weekend trip.',
    managerNote: 'Denied — ED is already at minimum staffing Mar 14–15 weekend. Please resubmit for a non-critical period.',
    impact: {
      severity: 'critical',
      description: 'ED would be at 3/5 on a weekend — below safe minimum for anticipated census.',
      affectedShifts: 2,
      unitCoverage: '3/5',
      unitCoverageAfter: '4/5',
      suggestedCoverage: [],
      netCost: 0,
    },
    ptoCost: 704,
    coverageCost: 0,
    ptoBalanceRemaining: 72,
  },
]

// ─── PTO Balance ledger ────────────────────────────────────────────────────────

export const ptoBalances: PTOBalance[] = [
  { staffId: 's001', name: 'Sarah Chen',      avatarInitials: 'SC', role: 'RN',        unit: 'Float Pool',  hourlyRate: 43, accrualRatePerPeriod: 4,   balanceHours: 104, usedHoursYTD: 16,  pendingHours: 40, scheduledHours: 0,  maxCarryover: 160 },
  { staffId: 'e001', name: 'Priya Sharma',    avatarInitials: 'PS', role: 'Charge RN', unit: 'ICU',         hourlyRate: 52, accrualRatePerPeriod: 5,   balanceHours: 112, usedHoursYTD: 24,  pendingHours: 0,  scheduledHours: 40, maxCarryover: 200 },
  { staffId: 'e002', name: 'James Okafor',    avatarInitials: 'JO', role: 'RN',        unit: 'ICU',         hourlyRate: 46, accrualRatePerPeriod: 4,   balanceHours: 64,  usedHoursYTD: 32,  pendingHours: 24, scheduledHours: 0,  maxCarryover: 160 },
  { staffId: 's002', name: 'Marcus Williams', avatarInitials: 'MW', role: 'RN',        unit: 'Float Pool',  hourlyRate: 47, accrualRatePerPeriod: 4,   balanceHours: 56,  usedHoursYTD: 8,   pendingHours: 8,  scheduledHours: 0,  maxCarryover: 160 },
  { staffId: 'e016', name: 'Christine Park',  avatarInitials: 'CP', role: 'Charge RN', unit: 'Med-Surg B',  hourlyRate: 52, accrualRatePerPeriod: 5,   balanceHours: 104, usedHoursYTD: 16,  pendingHours: 8,  scheduledHours: 0,  maxCarryover: 200 },
  { staffId: 'e007', name: 'Nathan Foster',   avatarInitials: 'NF', role: 'Charge RN', unit: 'Med-Surg B',  hourlyRate: 54, accrualRatePerPeriod: 5,   balanceHours: 80,  usedHoursYTD: 40,  pendingHours: 0,  scheduledHours: 24, maxCarryover: 200 },
  { staffId: 'e021', name: 'Lisa Greenwald',  avatarInitials: 'LG', role: 'RN',        unit: 'NICU',        hourlyRate: 52, accrualRatePerPeriod: 4,   balanceHours: 96,  usedHoursYTD: 8,   pendingHours: 8,  scheduledHours: 0,  maxCarryover: 160 },
  { staffId: 's005', name: 'Tyler Barnes',    avatarInitials: 'TB', role: 'CNA',       unit: 'Med-Surg B',  hourlyRate: 38, accrualRatePerPeriod: 3,   balanceHours: 120, usedHoursYTD: 0,   pendingHours: 0,  scheduledHours: 40, maxCarryover: 120 },
  { staffId: 'e008', name: 'Fatima Hassan',   avatarInitials: 'FH', role: 'RN',        unit: 'ED',          hourlyRate: 44, accrualRatePerPeriod: 4,   balanceHours: 88,  usedHoursYTD: 16,  pendingHours: 0,  scheduledHours: 0,  maxCarryover: 160 },
  { staffId: 'e023', name: 'Aisha Patel',     avatarInitials: 'AP', role: 'RN',        unit: 'Float Pool',  hourlyRate: 44, accrualRatePerPeriod: 4,   balanceHours: 40,  usedHoursYTD: 24,  pendingHours: 0,  scheduledHours: 0,  maxCarryover: 160 },
]

// ─── Upcoming absences calendar (next 30 days) ────────────────────────────────

export interface CalendarAbsence {
  staffName: string
  unit: string
  startISO: string
  endISO: string
  type: PTOType
  status: PTOStatus
  days: number
}

export const upcomingAbsences: CalendarAbsence[] = [
  { staffName: 'Marcus Williams', unit: 'Float',      startISO: '2026-03-13', endISO: '2026-03-13', type: 'sick',        status: 'pending',  days: 1 },
  { staffName: 'James Okafor',    unit: 'ICU',        startISO: '2026-03-19', endISO: '2026-03-21', type: 'vacation',    status: 'pending',  days: 3 },
  { staffName: 'Lisa Greenwald',  unit: 'NICU',       startISO: '2026-03-20', endISO: '2026-03-20', type: 'personal',    status: 'pending',  days: 1 },
  { staffName: 'Christine Park',  unit: 'Med-Surg B', startISO: '2026-03-22', endISO: '2026-03-22', type: 'personal',    status: 'pending',  days: 1 },
  { staffName: 'Nathan Foster',   unit: 'Med-Surg B', startISO: '2026-03-16', endISO: '2026-03-18', type: 'bereavement', status: 'approved', days: 3 },
  { staffName: 'Priya Sharma',    unit: 'ICU',        startISO: '2026-03-24', endISO: '2026-03-28', type: 'vacation',    status: 'approved', days: 5 },
  { staffName: 'Tyler Barnes',    unit: 'Med-Surg B', startISO: '2026-03-30', endISO: '2026-04-03', type: 'vacation',    status: 'approved', days: 5 },
  { staffName: 'Sarah Chen',      unit: 'Float',      startISO: '2026-04-01', endISO: '2026-04-07', type: 'vacation',    status: 'pending',  days: 5 },
]

// ─── Summary stats ────────────────────────────────────────────────────────────

export const ptoSummary = {
  pendingCount:  allPTORequests.filter(r => r.status === 'pending').length,
  approvedCount: allPTORequests.filter(r => r.status === 'approved').length,
  deniedCount:   allPTORequests.filter(r => r.status === 'denied').length,
  criticalImpact: allPTORequests.filter(r => r.status === 'pending' && r.impact.severity === 'critical').length,
  totalCoverageCostPending: allPTORequests
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.coverageCost, 0),
  avgPTOBalance: Math.round(
    ptoBalances.reduce((s, b) => s + b.balanceHours, 0) / ptoBalances.length
  ),
}

// ─── Module-level mutable state for approve/deny actions ──────────────────────

export let mutableRequests: PTORequest[] = allPTORequests.map(r => ({ ...r }))

export function approveRequest(id: string, note: string): void {
  const req = mutableRequests.find(r => r.id === id)
  if (req) {
    req.status = 'approved'
    req.managerNote = note || 'Approved.'
  }
}

export function denyRequest(id: string, note: string): void {
  const req = mutableRequests.find(r => r.id === id)
  if (req) {
    req.status = 'denied'
    req.managerNote = note || 'Denied.'
  }
}
