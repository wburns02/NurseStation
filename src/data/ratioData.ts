// ── Ratio Command — Real-time patient:nurse ratio data ──────────────────────

export type RatioStatus = 'compliant' | 'warning' | 'violation'
export type FloatAvailability = 'available' | 'on-break' | 'filling' | 'unavailable'
export type FillRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'filled'
export type AgencyTier = 'preferred' | 'backup' | 'emergency'

export interface UnitRatioConfig {
  unit: string
  unitFull: string
  color: string
  bg: string
  mandatedRatio: number   // max patients per nurse (e.g. 2 = "2:1")
  mandatedLabel: string   // display string e.g. "2:1"
  specialtyRequired: string[]
  acuityWeight: number    // 1 = low acuity, 3 = high acuity
}

export interface UnitSnapshot {
  unit: string
  census: number           // current patient count
  nurses: number           // on-floor nurses right now
  ratioNow: number         // census / nurses
  availableBeds: number
  pendingAdmits: number    // incoming in next 2 hours
  pendingDischarges: number
  ratioHistory: number[]   // last 8 hours, hourly (most recent last)
  lastUpdated: string
}

export interface FloatNurse {
  id: string
  name: string
  initials: string
  yearsExp: number
  certifications: string[]
  units: string[]         // qualified for these units
  availability: FloatAvailability
  availableAt: string     // "Now" or "in 15 min" etc.
  phone: string
  lastFilled: string      // unit last filled
  fillsThisWeek: number
  hourlyRate: number
}

export interface AgencyContact {
  id: string
  name: string
  tier: AgencyTier
  availableNurses: number
  specialties: string[]
  hourlyRate: number
  minHours: number
  responseTimeMin: number
  contractedUnits: string[]
  contractExpiry: string
  ytdSpend: number
}

export interface FillRequest {
  id: string
  unit: string
  shiftNeeded: string
  targetRatio: number
  requestedAt: string
  requestedBy: string
  floatNurseId: string | null
  agencyId: string | null
  status: FillRequestStatus
  respondedAt: string | null
  estimatedArrival: string | null
  hourlyRate: number
  note: string
}

export interface RatioAlert {
  id: string
  unit: string
  type: 'violation' | 'warning' | 'forecast'
  message: string
  triggeredAt: string
  acknowledged: boolean
}

// ── Unit Configuration ───────────────────────────────────────────────────────

export const UNIT_CONFIGS: UnitRatioConfig[] = [
  {
    unit: 'ICU',
    unitFull: 'Intensive Care Unit',
    color: 'text-violet-300',
    bg: 'bg-violet-500/10',
    mandatedRatio: 2,
    mandatedLabel: '2:1',
    specialtyRequired: ['ICU', 'CCRN'],
    acuityWeight: 3,
  },
  {
    unit: 'CCU',
    unitFull: 'Cardiac Care Unit',
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    mandatedRatio: 2,
    mandatedLabel: '2:1',
    specialtyRequired: ['CCU', 'CCRN', 'ICU'],
    acuityWeight: 3,
  },
  {
    unit: 'ED',
    unitFull: 'Emergency Department',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
    mandatedRatio: 4,
    mandatedLabel: '4:1',
    specialtyRequired: ['ED', 'CEN'],
    acuityWeight: 2,
  },
  {
    unit: 'MS-A',
    unitFull: 'Med-Surg A',
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    mandatedRatio: 5,
    mandatedLabel: '5:1',
    specialtyRequired: ['MS', 'RN'],
    acuityWeight: 1,
  },
  {
    unit: 'MS-B',
    unitFull: 'Med-Surg B',
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    mandatedRatio: 5,
    mandatedLabel: '5:1',
    specialtyRequired: ['MS', 'RN'],
    acuityWeight: 1,
  },
  {
    unit: 'ONC',
    unitFull: 'Oncology',
    color: 'text-teal-300',
    bg: 'bg-teal-500/10',
    mandatedRatio: 5,
    mandatedLabel: '5:1',
    specialtyRequired: ['ONC', 'OCN', 'RN'],
    acuityWeight: 2,
  },
  {
    unit: 'TELE',
    unitFull: 'Telemetry',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    mandatedRatio: 4,
    mandatedLabel: '4:1',
    specialtyRequired: ['TELE', 'RN'],
    acuityWeight: 2,
  },
]

// ── Unit Snapshots ───────────────────────────────────────────────────────────

export const UNIT_SNAPSHOTS: UnitSnapshot[] = [
  {
    unit: 'ICU',
    census: 8,
    nurses: 4,
    ratioNow: 2.0,
    availableBeds: 2,
    pendingAdmits: 1,
    pendingDischarges: 0,
    ratioHistory: [1.5, 1.5, 2.0, 2.0, 2.0, 2.5, 2.0, 2.0],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'CCU',
    census: 6,
    nurses: 2,
    ratioNow: 3.0,
    availableBeds: 2,
    pendingAdmits: 0,
    pendingDischarges: 1,
    ratioHistory: [2.0, 2.0, 2.0, 2.5, 2.5, 3.0, 3.0, 3.0],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'ED',
    census: 14,
    nurses: 3,
    ratioNow: 4.67,
    availableBeds: 0,
    pendingAdmits: 3,
    pendingDischarges: 2,
    ratioHistory: [3.5, 3.5, 4.0, 4.0, 4.5, 4.67, 4.67, 4.67],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'MS-A',
    census: 10,
    nurses: 2,
    ratioNow: 5.0,
    availableBeds: 4,
    pendingAdmits: 2,
    pendingDischarges: 1,
    ratioHistory: [4.0, 4.0, 4.5, 5.0, 5.0, 5.0, 5.0, 5.0],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'MS-B',
    census: 8,
    nurses: 1,
    ratioNow: 8.0,
    availableBeds: 6,
    pendingAdmits: 0,
    pendingDischarges: 0,
    ratioHistory: [4.0, 4.0, 4.0, 5.0, 5.0, 5.0, 8.0, 8.0],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'ONC',
    census: 4,
    nurses: 2,
    ratioNow: 2.0,
    availableBeds: 8,
    pendingAdmits: 0,
    pendingDischarges: 2,
    ratioHistory: [2.5, 2.5, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0],
    lastUpdated: '07:54 AM',
  },
  {
    unit: 'TELE',
    census: 6,
    nurses: 2,
    ratioNow: 3.0,
    availableBeds: 2,
    pendingAdmits: 1,
    pendingDischarges: 0,
    ratioHistory: [3.0, 3.0, 3.0, 3.0, 3.0, 3.5, 3.0, 3.0],
    lastUpdated: '07:54 AM',
  },
]

// ── Float Pool ───────────────────────────────────────────────────────────────

export const FLOAT_NURSES: FloatNurse[] = [
  {
    id: 'float-001',
    name: 'Maria Santos',
    initials: 'MS',
    yearsExp: 9,
    certifications: ['CCRN', 'BLS', 'ACLS'],
    units: ['ICU', 'CCU', 'TELE'],
    availability: 'available',
    availableAt: 'Now',
    phone: '(555) 391-4820',
    lastFilled: 'CCU',
    fillsThisWeek: 2,
    hourlyRate: 58,
  },
  {
    id: 'float-002',
    name: 'David Chen',
    initials: 'DC',
    yearsExp: 6,
    certifications: ['CEN', 'BLS', 'ACLS', 'PALS'],
    units: ['ED', 'TELE', 'MS-A'],
    availability: 'on-break',
    availableAt: 'in 15 min',
    phone: '(555) 204-7763',
    lastFilled: 'ED',
    fillsThisWeek: 3,
    hourlyRate: 56,
  },
  {
    id: 'float-003',
    name: 'Rachel Torres',
    initials: 'RT',
    yearsExp: 11,
    certifications: ['OCN', 'BLS', 'ACLS'],
    units: ['MS-A', 'MS-B', 'ONC', 'TELE'],
    availability: 'filling',
    availableAt: 'Assigned → MS-B',
    phone: '(555) 873-0234',
    lastFilled: 'MS-A',
    fillsThisWeek: 4,
    hourlyRate: 54,
  },
  {
    id: 'float-004',
    name: 'James Williams',
    initials: 'JW',
    yearsExp: 14,
    certifications: ['CCRN', 'TNCC', 'BLS', 'ACLS'],
    units: ['ICU', 'CCU', 'ED'],
    availability: 'available',
    availableAt: 'Now',
    phone: '(555) 509-1182',
    lastFilled: 'ICU',
    fillsThisWeek: 1,
    hourlyRate: 62,
  },
  {
    id: 'float-005',
    name: 'Priya Patel',
    initials: 'PP',
    yearsExp: 5,
    certifications: ['BLS', 'ACLS'],
    units: ['MS-A', 'MS-B', 'TELE', 'ONC'],
    availability: 'available',
    availableAt: 'Now',
    phone: '(555) 731-6640',
    lastFilled: 'MS-B',
    fillsThisWeek: 2,
    hourlyRate: 52,
  },
  {
    id: 'float-006',
    name: 'Carlos Rivera',
    initials: 'CR',
    yearsExp: 7,
    certifications: ['CEN', 'TNCC', 'BLS'],
    units: ['ED', 'MS-A', 'TELE'],
    availability: 'unavailable',
    availableAt: 'Off today',
    phone: '(555) 447-3385',
    lastFilled: 'ED',
    fillsThisWeek: 0,
    hourlyRate: 54,
  },
  {
    id: 'float-007',
    name: 'Beth Collins',
    initials: 'BC',
    yearsExp: 18,
    certifications: ['CCRN', 'OCN', 'BLS', 'ACLS'],
    units: ['ICU', 'CCU', 'MS-A', 'MS-B', 'ONC', 'TELE'],
    availability: 'available',
    availableAt: 'Now',
    phone: '(555) 682-9117',
    lastFilled: 'ONC',
    fillsThisWeek: 1,
    hourlyRate: 68,
  },
]

// ── Agency Contacts ──────────────────────────────────────────────────────────

export const AGENCIES: AgencyContact[] = [
  {
    id: 'agency-001',
    name: 'MedPro Staffing',
    tier: 'preferred',
    availableNurses: 3,
    specialties: ['ICU', 'CCU', 'CCRN'],
    hourlyRate: 89,
    minHours: 12,
    responseTimeMin: 120,
    contractedUnits: ['ICU', 'CCU'],
    contractExpiry: '2026-12-31',
    ytdSpend: 142800,
  },
  {
    id: 'agency-002',
    name: 'HealthForce Pro',
    tier: 'preferred',
    availableNurses: 5,
    specialties: ['MS', 'TELE', 'ONC', 'ED'],
    hourlyRate: 72,
    minHours: 8,
    responseTimeMin: 60,
    contractedUnits: ['MS-A', 'MS-B', 'TELE', 'ONC', 'ED'],
    contractExpiry: '2026-09-30',
    ytdSpend: 98400,
  },
  {
    id: 'agency-003',
    name: 'NurseNow 24/7',
    tier: 'backup',
    availableNurses: 12,
    specialties: ['MS', 'TELE', 'ED', 'ONC'],
    hourlyRate: 68,
    minHours: 4,
    responseTimeMin: 45,
    contractedUnits: ['MS-A', 'MS-B', 'TELE', 'ONC', 'ED'],
    contractExpiry: '2026-06-30',
    ytdSpend: 61200,
  },
]

// ── Active Fill Requests ─────────────────────────────────────────────────────

export const FILL_REQUESTS_SEED: FillRequest[] = [
  {
    id: 'fill-001',
    unit: 'MS-B',
    shiftNeeded: 'Day Shift 07:00–15:00',
    targetRatio: 5,
    requestedAt: '07:12 AM',
    requestedBy: 'Janet Morrison',
    floatNurseId: 'float-003',
    agencyId: null,
    status: 'accepted',
    respondedAt: '07:19 AM',
    estimatedArrival: '07:35 AM',
    hourlyRate: 54,
    note: 'Callout: James Okafor (sick). Rachel Torres confirmed, on route.',
  },
  {
    id: 'fill-002',
    unit: 'CCU',
    shiftNeeded: 'Day Shift 07:00–15:00',
    targetRatio: 2,
    requestedAt: '07:24 AM',
    requestedBy: 'Janet Morrison',
    floatNurseId: 'float-004',
    agencyId: null,
    status: 'pending',
    respondedAt: null,
    estimatedArrival: null,
    hourlyRate: 62,
    note: 'Awaiting James Williams response. Called at 07:24.',
  },
]

// ── Active Alerts ────────────────────────────────────────────────────────────

export const RATIO_ALERTS_SEED: RatioAlert[] = [
  {
    id: 'alert-001',
    unit: 'MS-B',
    type: 'violation',
    message: 'MS-B ratio 8:1 exceeds mandate of 5:1 — callout by James Okafor at 06:58 AM',
    triggeredAt: '06:58 AM',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    unit: 'CCU',
    type: 'violation',
    message: 'CCU ratio 3:1 exceeds mandate of 2:1 — overnight callout not filled',
    triggeredAt: '06:15 AM',
    acknowledged: false,
  },
  {
    id: 'alert-003',
    unit: 'ED',
    type: 'warning',
    message: 'ED ratio 4.7:1 approaching mandate of 4:1 — 3 pending admissions in queue',
    triggeredAt: '07:31 AM',
    acknowledged: false,
  },
  {
    id: 'alert-004',
    unit: 'MS-A',
    type: 'forecast',
    message: 'MS-A forecasted ratio 7:1 in 90 min — 2 pending admits, 1 discharge delayed',
    triggeredAt: '07:45 AM',
    acknowledged: false,
  },
]

// ── Mutable State ────────────────────────────────────────────────────────────

const _snapshots: Map<string, UnitSnapshot> = new Map(
  UNIT_SNAPSHOTS.map(s => [s.unit, { ...s }])
)
const _fillRequests: FillRequest[] = [...FILL_REQUESTS_SEED.map(r => ({ ...r }))]
const _alerts: Map<string, RatioAlert> = new Map(
  RATIO_ALERTS_SEED.map(a => [a.id, { ...a }])
)
const _requestedFloats: Set<string> = new Set()
const _requestedAgencies: Set<string> = new Set()

// ── Computed Helpers ─────────────────────────────────────────────────────────

export function getRatioStatus(ratio: number, mandate: number): RatioStatus {
  if (ratio > mandate) return 'violation'
  if (ratio >= mandate * 0.9) return 'warning'
  return 'compliant'
}

export function getSnapshot(unit: string): UnitSnapshot {
  return _snapshots.get(unit) ?? UNIT_SNAPSHOTS.find(s => s.unit === unit)!
}

export function getAllSnapshots(): UnitSnapshot[] {
  return UNIT_SNAPSHOTS.map(s => _snapshots.get(s.unit) ?? s)
}

export function getUnitConfig(unit: string): UnitRatioConfig {
  return UNIT_CONFIGS.find(c => c.unit === unit)!
}

export function getComplianceSummary() {
  const snapshots = getAllSnapshots()
  const configs = UNIT_CONFIGS
  let violations = 0, warnings = 0, compliant = 0, forecasted = 0
  for (const s of snapshots) {
    const cfg = configs.find(c => c.unit === s.unit)!
    const status = getRatioStatus(s.ratioNow, cfg.mandatedRatio)
    if (status === 'violation') violations++
    else if (status === 'warning') warnings++
    else compliant++
    // Forecast: census + pending admits - pending discharges / nurses
    const forecastCensus = s.census + s.pendingAdmits - s.pendingDischarges
    const forecastRatio = forecastCensus / s.nurses
    if (forecastRatio > cfg.mandatedRatio * 1.1) forecasted++
  }
  return { violations, warnings, compliant, forecasted, total: snapshots.length }
}

export function getAllFillRequests(): FillRequest[] {
  return [..._fillRequests]
}

export function getAlerts(): RatioAlert[] {
  return Array.from(_alerts.values())
}

export function acknowledgeAlert(id: string): void {
  const a = _alerts.get(id)
  if (a) _alerts.set(id, { ...a, acknowledged: true })
}

export function hasRequestedFloat(floatId: string): boolean {
  return _requestedFloats.has(floatId)
}

export function hasRequestedAgency(agencyId: string): boolean {
  return _requestedAgencies.has(agencyId)
}

export function requestFloat(floatNurseId: string, unit: string, shiftNeeded: string): FillRequest {
  const nurse = FLOAT_NURSES.find(n => n.id === floatNurseId)!
  const req: FillRequest = {
    id: `fill-${Date.now()}`,
    unit,
    shiftNeeded,
    targetRatio: UNIT_CONFIGS.find(c => c.unit === unit)!.mandatedRatio,
    requestedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    requestedBy: 'Janet Morrison',
    floatNurseId,
    agencyId: null,
    status: 'pending',
    respondedAt: null,
    estimatedArrival: null,
    hourlyRate: nurse.hourlyRate,
    note: `Float request sent to ${nurse.name} for ${unit}`,
  }
  _fillRequests.push(req)
  _requestedFloats.add(floatNurseId)
  return req
}

export function requestAgency(agencyId: string, unit: string, shiftNeeded: string): FillRequest {
  const agency = AGENCIES.find(a => a.id === agencyId)!
  const eta = new Date(Date.now() + agency.responseTimeMin * 60 * 1000)
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const req: FillRequest = {
    id: `fill-agency-${Date.now()}`,
    unit,
    shiftNeeded,
    targetRatio: UNIT_CONFIGS.find(c => c.unit === unit)!.mandatedRatio,
    requestedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    requestedBy: 'Janet Morrison',
    floatNurseId: null,
    agencyId,
    status: 'pending',
    respondedAt: null,
    estimatedArrival: eta,
    hourlyRate: agency.hourlyRate,
    note: `Agency order placed with ${agency.name} — ${agency.availableNurses} available, ETA ~${agency.responseTimeMin} min`,
  }
  _fillRequests.push(req)
  _requestedAgencies.add(agencyId)
  return req
}

export function cancelRequest(requestId: string): void {
  const req = _fillRequests.find(r => r.id === requestId)
  if (req) {
    req.status = 'cancelled'
    if (req.floatNurseId) _requestedFloats.delete(req.floatNurseId)
    if (req.agencyId) _requestedAgencies.delete(req.agencyId)
  }
}
