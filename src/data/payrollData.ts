export type PayrollStatus = 'approved' | 'pending' | 'flagged' | 'under-review'
export type ExceptionType = 'missing-punch' | 'unapproved-ot' | 'unscheduled-shift' | 'early-departure' | 'schedule-mismatch'
export type ResolutionType = 'approve-asis' | 'adjust-hours' | 'flag-payroll'

export interface TimesheetException {
  id: string
  type: ExceptionType
  description: string
  date: string
  impact: 'low' | 'medium' | 'high'
  resolved: boolean
  resolution?: ResolutionType
}

export interface StaffTimesheet {
  staffId: string
  name: string
  role: string
  unit: string
  initials: string
  color: string
  scheduledHours: number
  actualHours: number
  regularHours: number
  otHours: number
  baseRate: number
  regularPay: number
  otPay: number
  totalPay: number
  status: PayrollStatus
  exceptions: TimesheetException[]
  approvedBy?: string
  approvedAt?: string
}

export interface PayPeriodSummary {
  totalStaff: number
  approved: number
  pending: number
  flagged: number
  underReview: number
  totalScheduledHours: number
  totalActualHours: number
  totalRegularHours: number
  totalOtHours: number
  totalRegularPay: number
  totalOtPay: number
  totalCost: number
  budgetTotal: number
  budgetVariance: number
  unresolvedExceptions: number
}

export const PAY_PERIOD = {
  id: 'pp-2026-03-01',
  start: 'Mar 1',
  end: 'Mar 15',
  year: '2026',
  label: 'Mar 1 – 15, 2026',
  budgetTotal: 44000,
}

// Module-level mutable state (persists across renders)
let _timesheets: StaffTimesheet[] = [
  {
    staffId: 'st-001', name: 'Janet Morrison', role: 'Staff RN', unit: 'ICU',
    initials: 'JM', color: 'from-violet-500 to-violet-700',
    scheduledHours: 72, actualHours: 75, regularHours: 75, otHours: 0,
    baseRate: 38, regularPay: 2850, otPay: 0, totalPay: 2850,
    status: 'pending', exceptions: [],
  },
  {
    staffId: 'st-002', name: 'Marcus Chen', role: 'Staff RN', unit: 'ICU',
    initials: 'MC', color: 'from-blue-500 to-blue-700',
    scheduledHours: 72, actualHours: 84, regularHours: 80, otHours: 4,
    baseRate: 38, regularPay: 3040, otPay: 228, totalPay: 3268,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-12 08:30',
  },
  {
    staffId: 'st-003', name: 'Sarah Kim', role: 'Charge RN', unit: 'CCU',
    initials: 'SK', color: 'from-emerald-500 to-emerald-700',
    scheduledHours: 72, actualHours: 76, regularHours: 76, otHours: 0,
    baseRate: 45, regularPay: 3420, otPay: 0, totalPay: 3420,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-11 16:45',
  },
  {
    staffId: 'st-004', name: 'David Thompson', role: 'Staff RN', unit: 'ED',
    initials: 'DT', color: 'from-red-500 to-red-700',
    scheduledHours: 72, actualHours: 72, regularHours: 72, otHours: 0,
    baseRate: 38, regularPay: 2736, otPay: 0, totalPay: 2736,
    status: 'flagged',
    exceptions: [{
      id: 'exc-dt-001', type: 'missing-punch',
      description: 'No clock-out recorded for Mar 8 Day shift (07:00). End time unknown — system used scheduled end (19:00) as estimate.',
      date: 'Mar 8, 2026', impact: 'high', resolved: false,
    }],
  },
  {
    staffId: 'st-005', name: 'Priya Patel', role: 'Staff RN', unit: 'ED',
    initials: 'PP', color: 'from-amber-500 to-amber-700',
    scheduledHours: 72, actualHours: 92, regularHours: 80, otHours: 12,
    baseRate: 38, regularPay: 3040, otPay: 684, totalPay: 3724,
    status: 'flagged',
    exceptions: [{
      id: 'exc-pp-001', type: 'unapproved-ot',
      description: 'Worked 12h OT over pay period — only 4h was pre-approved. 8h additional OT requires retroactive manager authorization.',
      date: 'Mar 3–11, 2026', impact: 'high', resolved: false,
    }],
  },
  {
    staffId: 'st-006', name: 'Robert Walsh', role: 'Charge RN', unit: 'MS-A',
    initials: 'RW', color: 'from-slate-500 to-slate-600',
    scheduledHours: 76, actualHours: 76, regularHours: 76, otHours: 0,
    baseRate: 45, regularPay: 3420, otPay: 0, totalPay: 3420,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-10 09:00',
  },
  {
    staffId: 'st-007', name: 'Alicia Rodriguez', role: 'Staff RN', unit: 'MS-A',
    initials: 'AR', color: 'from-pink-500 to-pink-700',
    scheduledHours: 60, actualHours: 60, regularHours: 60, otHours: 0,
    baseRate: 38, regularPay: 2280, otPay: 0, totalPay: 2280,
    status: 'pending', exceptions: [],
  },
  {
    staffId: 'st-008', name: 'Kevin Park', role: 'Staff RN', unit: 'MS-B',
    initials: 'KP', color: 'from-cyan-500 to-cyan-700',
    scheduledHours: 72, actualHours: 84, regularHours: 80, otHours: 4,
    baseRate: 38, regularPay: 3040, otPay: 228, totalPay: 3268,
    status: 'flagged',
    exceptions: [{
      id: 'exc-kp-001', type: 'unscheduled-shift',
      description: 'Worked full 12h shift on Mar 10 (not on schedule). Shift added informally for MS-B coverage crisis. Requires retroactive scheduling documentation.',
      date: 'Mar 10, 2026', impact: 'medium', resolved: false,
    }],
  },
  {
    staffId: 'st-009', name: 'Linda Foster', role: 'LPN', unit: 'Oncology',
    initials: 'LF', color: 'from-teal-500 to-teal-700',
    scheduledHours: 80, actualHours: 80, regularHours: 80, otHours: 0,
    baseRate: 28, regularPay: 2240, otPay: 0, totalPay: 2240,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-11 14:20',
  },
  {
    staffId: 'st-010', name: "James O'Brien", role: 'Staff RN', unit: 'Telemetry',
    initials: 'JO', color: 'from-indigo-500 to-indigo-700',
    scheduledHours: 72, actualHours: 72, regularHours: 72, otHours: 0,
    baseRate: 38, regularPay: 2736, otPay: 0, totalPay: 2736,
    status: 'pending', exceptions: [],
  },
  {
    staffId: 'st-011', name: 'Christina Lee', role: 'Staff RN', unit: 'CCU',
    initials: 'CL', color: 'from-purple-500 to-purple-700',
    scheduledHours: 80, actualHours: 80, regularHours: 80, otHours: 0,
    baseRate: 38, regularPay: 3040, otPay: 0, totalPay: 3040,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-12 07:45',
  },
  {
    staffId: 'st-012', name: 'Miguel Santos', role: 'CNA', unit: 'MS-B',
    initials: 'MS', color: 'from-orange-500 to-orange-700',
    scheduledHours: 80, actualHours: 80, regularHours: 80, otHours: 0,
    baseRate: 22, regularPay: 1760, otPay: 0, totalPay: 1760,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-11 17:30',
  },
  {
    staffId: 'st-013', name: 'Yuki Tanaka', role: 'Staff RN', unit: 'ICU',
    initials: 'YT', color: 'from-rose-500 to-rose-700',
    scheduledHours: 72, actualHours: 72, regularHours: 72, otHours: 0,
    baseRate: 38, regularPay: 2736, otPay: 0, totalPay: 2736,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-12 09:15',
  },
  {
    staffId: 'st-014', name: 'Beth Anderson', role: 'Travel RN', unit: 'ED',
    initials: 'BA', color: 'from-sky-500 to-sky-700',
    scheduledHours: 84, actualHours: 84, regularHours: 80, otHours: 4,
    baseRate: 52, regularPay: 4160, otPay: 312, totalPay: 4472,
    status: 'approved', exceptions: [],
    approvedBy: 'Janet Morrison', approvedAt: '2026-03-12 08:00',
  },
]

let _periodClosed = false
let _closedAt: string | null = null

// ── Accessors ────────────────────────────────────────────────────────────────

export function getTimesheets(): StaffTimesheet[] {
  return _timesheets
}

export function getTimesheet(staffId: string): StaffTimesheet | undefined {
  return _timesheets.find(t => t.staffId === staffId)
}

export function approveTimesheet(staffId: string): void {
  const t = _timesheets.find(t => t.staffId === staffId)
  if (t && t.status === 'pending') {
    t.status = 'approved'
    t.approvedBy = 'Janet Morrison'
    t.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
}

export function resolveException(
  staffId: string,
  exceptionId: string,
  resolution: ResolutionType
): void {
  const t = _timesheets.find(ts => ts.staffId === staffId)
  if (!t) return
  const exc = t.exceptions.find(e => e.id === exceptionId)
  if (!exc) return
  exc.resolved = true
  exc.resolution = resolution
  if (t.exceptions.every(e => e.resolved)) {
    if (resolution === 'flag-payroll') {
      t.status = 'pending'
    } else {
      t.status = 'approved'
      t.approvedBy = 'Janet Morrison'
      t.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
  }
}

export function getUnresolvedExceptions(): number {
  return _timesheets.reduce(
    (sum, t) => sum + t.exceptions.filter(e => !e.resolved).length,
    0
  )
}

export function canClosePeriod(): boolean {
  return !_periodClosed && getUnresolvedExceptions() === 0
}

export function closePayPeriod(): void {
  _periodClosed = true
  _closedAt = new Date().toISOString()
}

export function isPeriodClosed(): boolean {
  return _periodClosed
}

export function getClosedAt(): string | null {
  return _closedAt
}

export function getSummary(): PayPeriodSummary {
  const ts = _timesheets
  return {
    totalStaff: ts.length,
    approved: ts.filter(t => t.status === 'approved').length,
    pending: ts.filter(t => t.status === 'pending').length,
    flagged: ts.filter(t => t.status === 'flagged').length,
    underReview: ts.filter(t => t.status === 'under-review').length,
    totalScheduledHours: ts.reduce((s, t) => s + t.scheduledHours, 0),
    totalActualHours: ts.reduce((s, t) => s + t.actualHours, 0),
    totalRegularHours: ts.reduce((s, t) => s + t.regularHours, 0),
    totalOtHours: ts.reduce((s, t) => s + t.otHours, 0),
    totalRegularPay: ts.reduce((s, t) => s + t.regularPay, 0),
    totalOtPay: ts.reduce((s, t) => s + t.otPay, 0),
    totalCost: ts.reduce((s, t) => s + t.totalPay, 0),
    budgetTotal: PAY_PERIOD.budgetTotal,
    budgetVariance: PAY_PERIOD.budgetTotal - ts.reduce((s, t) => s + t.totalPay, 0),
    unresolvedExceptions: getUnresolvedExceptions(),
  }
}
