// overtimeData.ts — Overtime Approval Center
// Reference date: March 12, 2026 (Thursday, Day Shift)

export type OTStatus = 'pending' | 'approved' | 'denied' | 'auto-approved' | 'escalated'
export type OTReason =
  | 'short-staffed'
  | 'patient-acuity'
  | 'procedure-completion'
  | 'callout-coverage'
  | 'census-surge'
  | 'mandatory'

export type EscalationLevel = 'manager' | 'director' | 'cno'

export interface OTRequest {
  id: string
  nurseId: string
  nurseName: string
  nurseInitials: string
  nurseRole: string
  unit: string
  unitShort: string
  shiftDate: string           // ISO date
  shiftStart: string          // "07:00"
  shiftEnd: string            // "15:00" (scheduled end)
  requestedUntil: string      // "19:00" (asking to stay until)
  extraHours: number          // hours beyond scheduled end
  currentWeekHours: number    // hours worked so far this week including today
  overtimeHours: number       // hours that are OT (above 40/week)
  hourlyRate: number          // base rate
  otMultiplier: number        // 1.5 or 2.0
  estimatedOTCost: number     // total additional cost for these OT hours
  reason: OTReason
  reasonNote: string
  status: OTStatus
  submittedAt: string         // ISO datetime
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  escalationLevel: EscalationLevel
  isMandatory: boolean        // mandatory OT = union contract clause
  coverageFor: string | null  // if covering a callout, who
  budgetCode: string
}

export interface OTBudget {
  period: string              // "Week of Mar 9–15, 2026"
  weeklyBudgetDollars: number
  spentSoFarDollars: number
  pendingApprovalDollars: number
  projectedDollars: number    // spent + pending
  budgetWarningThreshold: number // % at which to warn (0.80)
  budgetCriticalThreshold: number // % at which to alert (0.95)
}

export interface PredictiveAlert {
  id: string
  nurseId: string
  nurseName: string
  nurseRole: string
  unit: string
  currentWeekHours: number
  projectedHoursEOD: number  // projected by end of day
  projectedOTHours: number
  projectedCost: number
  likelihood: number          // 0-100%
  suggestedAction: string
  daysUntilThreshold: number  // 0 = today
}

// ─── Mutable state ────────────────────────────────────────────────────────────
const _statusOverrides = new Map<string, { status: OTStatus; reviewNote: string | null; reviewedBy: string; reviewedAt: string }>()
const _batchApprovedIds = new Set<string>()
let _nextRequestNum = 1

export function getRequestStatus(req: OTRequest): OTStatus {
  return _statusOverrides.get(req.id)?.status ?? req.status
}

export function getReviewNote(req: OTRequest): string | null {
  return _statusOverrides.get(req.id)?.reviewNote ?? req.reviewNote
}

export function approveRequest(id: string, note?: string): void {
  _statusOverrides.set(id, {
    status: 'approved',
    reviewNote: note ?? null,
    reviewedBy: 'Janet Morrison',
    reviewedAt: new Date().toISOString(),
  })
}

export function denyRequest(id: string, reason: string): void {
  _statusOverrides.set(id, {
    status: 'denied',
    reviewNote: reason,
    reviewedBy: 'Janet Morrison',
    reviewedAt: new Date().toISOString(),
  })
}

export function escalateRequest(id: string): void {
  _statusOverrides.set(id, {
    status: 'escalated',
    reviewNote: 'Escalated to Director for approval',
    reviewedBy: 'Janet Morrison',
    reviewedAt: new Date().toISOString(),
  })
}

export function batchApproveAll(ids: string[]): void {
  ids.forEach(id => {
    _batchApprovedIds.add(id)
    approveRequest(id, 'Batch approved — threshold met')
  })
}

export function getAllRequests(): OTRequest[] {
  return [...OT_REQUESTS]
}

export function getPendingRequests(): OTRequest[] {
  return OT_REQUESTS.filter(r => getRequestStatus(r) === 'pending' || getRequestStatus(r) === 'escalated')
}

export function getOTSummary() {
  const all = getAllRequests()
  const pending = all.filter(r => getRequestStatus(r) === 'pending')
  const approved = all.filter(r => getRequestStatus(r) === 'approved' || getRequestStatus(r) === 'auto-approved')
  const denied = all.filter(r => getRequestStatus(r) === 'denied')
  const escalated = all.filter(r => getRequestStatus(r) === 'escalated')
  const approvedCost = approved.reduce((s, r) => s + r.estimatedOTCost, 0)
  const pendingCost = pending.reduce((s, r) => s + r.estimatedOTCost, 0)
  return { pending: pending.length, approved: approved.length, denied: denied.length, escalated: escalated.length, approvedCost, pendingCost }
}

export function addRequest(req: Omit<OTRequest, 'id'>): OTRequest {
  const id = `ot-new-${String(_nextRequestNum).padStart(3, '0')}`
  _nextRequestNum++
  const newReq = { ...req, id }
  OT_REQUESTS.push(newReq)
  return newReq
}

// ─── Budget data ──────────────────────────────────────────────────────────────
export const OT_BUDGET: OTBudget = {
  period: 'Week of Mar 9–15, 2026',
  weeklyBudgetDollars: 18000,
  spentSoFarDollars: 10840,
  pendingApprovalDollars: 4210,
  projectedDollars: 15050,
  budgetWarningThreshold: 0.80,
  budgetCriticalThreshold: 0.95,
}

// ─── Predictive alerts ────────────────────────────────────────────────────────
export const PREDICTIVE_ALERTS: PredictiveAlert[] = [
  {
    id: 'pred-01',
    nurseId: 'n-icu-04',
    nurseName: 'Fatima Hassan',
    nurseRole: 'CCRN',
    unit: 'ICU',
    currentWeekHours: 36.5,
    projectedHoursEOD: 44.5,
    projectedOTHours: 4.5,
    projectedCost: 405,
    likelihood: 92,
    suggestedAction: 'Pre-approve up to 4 hrs or assign float to ICU for evening',
    daysUntilThreshold: 0,
  },
  {
    id: 'pred-02',
    nurseId: 'n-ms-b-02',
    nurseName: 'Camille Portier',
    nurseRole: 'RN BSN',
    unit: 'Med-Surg B',
    currentWeekHours: 34,
    projectedHoursEOD: 42,
    projectedOTHours: 2,
    projectedCost: 146,
    likelihood: 78,
    suggestedAction: 'Med-Surg B has 2 callouts — likely OT. Request float now to avoid',
    daysUntilThreshold: 0,
  },
  {
    id: 'pred-03',
    nurseId: 'n-ed-01',
    nurseName: 'Nathan Foster',
    nurseRole: 'Charge RN',
    unit: 'ED',
    currentWeekHours: 38,
    projectedHoursEOD: 40,
    projectedOTHours: 0,
    projectedCost: 0,
    likelihood: 55,
    suggestedAction: 'Close to threshold — monitor ED census tonight',
    daysUntilThreshold: 0,
  },
]

// ─── Overtime request records ─────────────────────────────────────────────────
const OT_REQUESTS: OTRequest[] = [
  // ── PENDING ──────────────────────────────────────────────────────────────────
  {
    id: 'ot-001',
    nurseId: 'n-icu-02',
    nurseName: 'James Okafor',
    nurseInitials: 'JO',
    nurseRole: 'CCRN',
    unit: 'ICU',
    unitShort: 'ICU',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '19:00',
    extraHours: 4,
    currentWeekHours: 36,
    overtimeHours: 0,    // still under 40
    hourlyRate: 48.50,
    otMultiplier: 1.5,
    estimatedOTCost: 291,
    reason: 'patient-acuity',
    reasonNote: 'Trauma patient in bed 4 requires 1:1 care — acuity escalated to level 5 at 13:30. No float available.',
    status: 'pending',
    submittedAt: '2026-03-12T14:05:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'ICU-OT-2026',
  },
  {
    id: 'ot-002',
    nurseId: 'n-ms-b-01',
    nurseName: 'Sarah Mitchell',
    nurseInitials: 'SM',
    nurseRole: 'RN BSN',
    unit: 'Med-Surg B',
    unitShort: 'MS-B',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '19:00',
    extraHours: 4,
    currentWeekHours: 40,
    overtimeHours: 4,
    hourlyRate: 36.25,
    otMultiplier: 1.5,
    estimatedOTCost: 217.50,
    reason: 'callout-coverage',
    reasonNote: 'Covering call-out from night shift — Tyler Barnes reported sick at 06:15. Census at 24/28 (86%).',
    status: 'pending',
    submittedAt: '2026-03-12T06:30:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: 'Tyler Barnes',
    budgetCode: 'MS-B-OT-2026',
  },
  {
    id: 'ot-003',
    nurseId: 'n-ms-b-03',
    nurseName: 'Natasha Perkins',
    nurseInitials: 'NP',
    nurseRole: 'LPN',
    unit: 'Med-Surg B',
    unitShort: 'MS-B',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '17:00',
    extraHours: 2,
    currentWeekHours: 38,
    overtimeHours: 0,
    hourlyRate: 28.75,
    otMultiplier: 1.5,
    estimatedOTCost: 86.25,
    reason: 'callout-coverage',
    reasonNote: 'Second callout on MS-B — need partial overlap while replacement arrives at 17:00.',
    status: 'pending',
    submittedAt: '2026-03-12T07:15:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: 'Deja Williams',
    budgetCode: 'MS-B-OT-2026',
  },
  {
    id: 'ot-004',
    nurseId: 'n-ed-02',
    nurseName: 'Francesca Holt',
    nurseInitials: 'FH',
    nurseRole: 'ED RN',
    unit: 'ED',
    unitShort: 'ED',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '23:00',
    extraHours: 8,
    currentWeekHours: 40,
    overtimeHours: 8,
    hourlyRate: 42.00,
    otMultiplier: 2.0,
    estimatedOTCost: 672,
    reason: 'census-surge',
    reasonNote: 'ED census at 26/30 — trauma MCI event, 6 patients incoming from Route 9 accident. Code triage needed through 23:00.',
    status: 'escalated',
    submittedAt: '2026-03-12T13:00:00Z',
    reviewedBy: 'Janet Morrison',
    reviewedAt: '2026-03-12T13:05:00Z',
    reviewNote: 'Escalated to Director — MCI event exceeds manager approval authority ($672 OT cost)',
    escalationLevel: 'director',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'ED-OT-2026',
  },
  // ── APPROVED TODAY ────────────────────────────────────────────────────────────
  {
    id: 'ot-005',
    nurseId: 'n-icu-01',
    nurseName: 'Priya Sharma',
    nurseInitials: 'PS',
    nurseRole: 'CCRN, Charge',
    unit: 'ICU',
    unitShort: 'ICU',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '19:00',
    extraHours: 4,
    currentWeekHours: 36,
    overtimeHours: 0,
    hourlyRate: 58.00,
    otMultiplier: 1.5,
    estimatedOTCost: 348,
    reason: 'short-staffed',
    reasonNote: 'ICU running 3/4 nurses — Fatima Hassan called out, float pool request pending.',
    status: 'approved',
    submittedAt: '2026-03-12T05:45:00Z',
    reviewedBy: 'Janet Morrison',
    reviewedAt: '2026-03-12T06:00:00Z',
    reviewNote: 'Approved — ICU patient safety requires coverage until float arrives.',
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'ICU-OT-2026',
  },
  {
    id: 'ot-006',
    nurseId: 'n-ccu-01',
    nurseName: 'Rachel Torres',
    nurseInitials: 'RT',
    nurseRole: 'CCRN, Charge',
    unit: 'CCU',
    unitShort: 'CCU',
    shiftDate: '2026-03-12',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '17:00',
    extraHours: 2,
    currentWeekHours: 38,
    overtimeHours: 0,
    hourlyRate: 55.00,
    otMultiplier: 1.5,
    estimatedOTCost: 165,
    reason: 'procedure-completion',
    reasonNote: 'Post-CABG patient in CCU-3 needs 2-hour monitoring extension — cardiologist request.',
    status: 'auto-approved',
    submittedAt: '2026-03-12T13:20:00Z',
    reviewedBy: 'Auto-Approval Engine',
    reviewedAt: '2026-03-12T13:20:00Z',
    reviewNote: 'Auto-approved: <3 hrs, under weekly threshold, patient safety classification.',
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'CCU-OT-2026',
  },
  {
    id: 'ot-007',
    nurseId: 'n-onc-01',
    nurseName: 'Helen Forsyth',
    nurseInitials: 'HF',
    nurseRole: 'Charge RN',
    unit: 'Oncology',
    unitShort: 'ONC',
    shiftDate: '2026-03-11',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '19:00',
    extraHours: 4,
    currentWeekHours: 40,
    overtimeHours: 4,
    hourlyRate: 46.75,
    otMultiplier: 1.5,
    estimatedOTCost: 280.50,
    reason: 'patient-acuity',
    reasonNote: 'Patient in ONC-12 deteriorating — family conference and care plan update required.',
    status: 'approved',
    submittedAt: '2026-03-11T12:30:00Z',
    reviewedBy: 'Janet Morrison',
    reviewedAt: '2026-03-11T12:45:00Z',
    reviewNote: 'Approved — end-of-life care coordination. Compassionate circumstances.',
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'ONC-OT-2026',
  },
  // ── DENIED ────────────────────────────────────────────────────────────────────
  {
    id: 'ot-008',
    nurseId: 'n-ms-a-03',
    nurseName: 'Zoe Alvarez',
    nurseInitials: 'ZA',
    nurseRole: 'LPN',
    unit: 'Med-Surg A',
    unitShort: 'MS-A',
    shiftDate: '2026-03-11',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    requestedUntil: '19:00',
    extraHours: 4,
    currentWeekHours: 40,
    overtimeHours: 4,
    hourlyRate: 27.50,
    otMultiplier: 1.5,
    estimatedOTCost: 165,
    reason: 'short-staffed',
    reasonNote: 'Unit feels short but wants to get extra hours.',
    status: 'denied',
    submittedAt: '2026-03-11T08:00:00Z',
    reviewedBy: 'Janet Morrison',
    reviewedAt: '2026-03-11T09:00:00Z',
    reviewNote: 'Denied — unit is at ratio. Float pool available. Approved float instead.',
    escalationLevel: 'manager',
    isMandatory: false,
    coverageFor: null,
    budgetCode: 'MS-A-OT-2026',
  },
]

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const OT_REASON_META: Record<OTReason, { label: string; icon: string; color: string }> = {
  'short-staffed':        { label: 'Short Staffed',      icon: '👥', color: 'text-amber-400'  },
  'patient-acuity':       { label: 'Patient Acuity',     icon: '🏥', color: 'text-red-400'    },
  'procedure-completion': { label: 'Procedure Coverage', icon: '⚕️', color: 'text-teal-400'   },
  'callout-coverage':     { label: 'Callout Coverage',   icon: '📞', color: 'text-orange-400' },
  'census-surge':         { label: 'Census Surge',       icon: '📈', color: 'text-violet-400' },
  'mandatory':            { label: 'Mandatory OT',       icon: '⚠️', color: 'text-red-400'    },
}

export const STATUS_META: Record<OTStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:      { label: 'Pending',      color: 'text-amber-300',   bg: 'bg-amber-500/15',   dot: 'bg-amber-500'  },
  approved:     { label: 'Approved',     color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500'},
  denied:       { label: 'Denied',       color: 'text-red-300',     bg: 'bg-red-500/15',     dot: 'bg-red-500'    },
  'auto-approved': { label: 'Auto-Approved', color: 'text-blue-300', bg: 'bg-blue-500/15',  dot: 'bg-blue-500'   },
  escalated:    { label: 'Escalated',    color: 'text-violet-300',  bg: 'bg-violet-500/15',  dot: 'bg-violet-500' },
}

export const DENY_REASONS = [
  'Unit is at ratio — float pool available',
  'Budget threshold exceeded — director approval required',
  'Scheduling conflict — alternative coverage arranged',
  'Non-critical — shift ends as scheduled',
  'Union contract: max consecutive hours reached',
  'Other',
]
