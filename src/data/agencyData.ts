// ── Agency & Travel Nurse Command Data ──────────────────────────────────────
// Date context: March 13, 2026

export type AgencyStatus = 'active' | 'expiring' | 'completed' | 'pending' | 'no-return'
export type ManagerInterest = 'hire' | 'extend' | 'neutral' | 'no-return'
export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Telemetry'

export interface OrientationItem {
  label: string
  done: boolean
  completedDate?: string
}

export interface AgencyNurse {
  id: string
  name: string
  initials: string
  color: string
  agency: string
  agencyShort: string
  unit: UnitKey
  specialty: string
  startDate: string
  endDate: string
  weeksTotal: number
  weeksRemaining: number
  ratePerHour: number    // what we pay the agency per bill hour
  yearsExp: number
  phone: string
  status: AgencyStatus
  rating: number
  attendance: number    // 0–100%
  incidentCount: number
  nurseWantsPerm: boolean
  managerInterest: ManagerInterest
  orientation: OrientationItem[]
  certifications: string[]
  notes?: string
  pastContracts?: number  // prior contracts at this facility
}

// ── Agency companies ─────────────────────────────────────────────────────────

export const AGENCIES = {
  amn:  { name: 'AMN Healthcare',                   short: 'AMN',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  cc:   { name: 'Cross Country Nurses',              short: 'CCN',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  aya:  { name: 'Aya Healthcare',                    short: 'AYA',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
  tnaa: { name: 'Travel Nurse Across America',        short: 'TNAA', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  msn:  { name: 'Medical Staffing Network',           short: 'MSN',  color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

// ── Nurse roster ─────────────────────────────────────────────────────────────

const _nurses: AgencyNurse[] = [
  {
    id: 'ag-001', name: 'Jennifer Holt', initials: 'JH',
    color: 'from-violet-500 to-violet-700',
    agency: 'AMN Healthcare', agencyShort: 'AMN', unit: 'ICU', specialty: 'ICU RN',
    startDate: 'Jan 13, 2026', endDate: 'Apr 13, 2026', weeksTotal: 13, weeksRemaining: 4,
    ratePerHour: 89, yearsExp: 7, phone: '(555) 204-9371', status: 'expiring',
    rating: 4.8, attendance: 98, incidentCount: 0, nurseWantsPerm: true,
    managerInterest: 'hire', pastContracts: 1,
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Jan 13' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Jan 14' },
      { label: 'Unit orientation — ICU protocols', done: true, completedDate: 'Jan 15' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Jan 16' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Jan 17' },
    ],
    certifications: ['ACLS', 'CCRN', 'TNCC', 'BLS'],
    notes: 'Exceptional ICU nurse — charge-level skills. Unit director flagged her as top hire candidate. Offered $88k base + $5k sign-on. Competing offer from UCSF.',
  },
  {
    id: 'ag-002', name: 'Chris Nakamura', initials: 'CN',
    color: 'from-sky-500 to-sky-700',
    agency: 'Cross Country Nurses', agencyShort: 'CCN', unit: 'ED', specialty: 'ED RN',
    startDate: 'Dec 30, 2025', endDate: 'Mar 30, 2026', weeksTotal: 13, weeksRemaining: 2,
    ratePerHour: 94, yearsExp: 5, phone: '(555) 317-8812', status: 'expiring',
    rating: 4.6, attendance: 96, incidentCount: 1, nurseWantsPerm: false,
    managerInterest: 'extend', pastContracts: 0,
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Dec 30' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Dec 31' },
      { label: 'Unit orientation — ED protocols', done: true, completedDate: 'Jan 2' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Jan 3' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Jan 4' },
    ],
    certifications: ['ACLS', 'TNCC', 'ENPC', 'BLS'],
    notes: '1 medication documentation incident (Dec — resolved). Strong ED nurse, handles trauma well. Wants to travel for another 6–12 months before settling. Could extend 8 more weeks.',
  },
  {
    id: 'ag-003', name: 'Olivia Grant', initials: 'OG',
    color: 'from-emerald-500 to-emerald-700',
    agency: 'Aya Healthcare', agencyShort: 'AYA', unit: 'CCU', specialty: 'CCU RN',
    startDate: 'Jan 27, 2026', endDate: 'Apr 27, 2026', weeksTotal: 13, weeksRemaining: 6,
    ratePerHour: 91, yearsExp: 9, phone: '(555) 491-0043', status: 'active',
    rating: 4.7, attendance: 100, incidentCount: 0, nurseWantsPerm: true,
    managerInterest: 'hire', pastContracts: 0,
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Jan 27' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Jan 28' },
      { label: 'Unit orientation — CCU protocols', done: true, completedDate: 'Jan 29' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Jan 30' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Jan 31' },
    ],
    certifications: ['ACLS', 'CCRN', 'NRP', 'BLS'],
    notes: 'Perfect attendance, zero incidents. CCU team loves her. Expressed interest in permanent position. HR conversation scheduled for Mar 20.',
  },
  {
    id: 'ag-004', name: 'Ryan Sullivan', initials: 'RS',
    color: 'from-orange-500 to-orange-700',
    agency: 'Travel Nurse Across America', agencyShort: 'TNAA', unit: 'MS-A', specialty: 'Med-Surg RN',
    startDate: 'Dec 16, 2025', endDate: 'Mar 16, 2026', weeksTotal: 13, weeksRemaining: 0,
    ratePerHour: 82, yearsExp: 4, phone: '(555) 628-7741', status: 'expiring',
    rating: 3.8, attendance: 91, incidentCount: 2, nurseWantsPerm: false,
    managerInterest: 'neutral', pastContracts: 0,
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Dec 16' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Dec 17' },
      { label: 'Unit orientation — MS protocols', done: true, completedDate: 'Dec 18' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Dec 19' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Dec 20' },
    ],
    certifications: ['BLS', 'ACLS'],
    notes: 'Contract ends Mar 16 (today). Two attendance incidents (Jan, Feb). Performance meets minimum standards. Unit manager recommends not extending. Backfill needed.',
  },
  {
    id: 'ag-005', name: 'Maya Richardson', initials: 'MR',
    color: 'from-rose-500 to-rose-700',
    agency: 'AMN Healthcare', agencyShort: 'AMN', unit: 'Telemetry', specialty: 'Telemetry RN',
    startDate: 'Feb 10, 2026', endDate: 'May 10, 2026', weeksTotal: 13, weeksRemaining: 8,
    ratePerHour: 86, yearsExp: 6, phone: '(555) 752-4490', status: 'active',
    rating: 4.9, attendance: 100, incidentCount: 0, nurseWantsPerm: false,
    managerInterest: 'extend',
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Feb 10' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Feb 11' },
      { label: 'Unit orientation — Tele protocols', done: true, completedDate: 'Feb 12' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Feb 13' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Feb 14' },
    ],
    certifications: ['ACLS', 'BLS', 'PALS'],
    notes: 'Highest rated agency nurse on staff. Tele unit running near perfect. Prefers travel lifestyle but may consider repeat contracts.',
  },
  {
    id: 'ag-006', name: 'Keisha Williams', initials: 'KW',
    color: 'from-teal-500 to-teal-700',
    agency: 'Aya Healthcare', agencyShort: 'AYA', unit: 'ICU', specialty: 'ICU RN',
    startDate: 'Jan 6, 2026', endDate: 'Apr 6, 2026', weeksTotal: 13, weeksRemaining: 3,
    ratePerHour: 93, yearsExp: 11, phone: '(555) 883-6612', status: 'expiring',
    rating: 4.5, attendance: 95, incidentCount: 0, nurseWantsPerm: false,
    managerInterest: 'hire',
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Jan 6' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Jan 7' },
      { label: 'Unit orientation — ICU protocols', done: true, completedDate: 'Jan 8' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Jan 9' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Jan 10' },
    ],
    certifications: ['ACLS', 'CCRN', 'NRP', 'BLS'],
    notes: 'Senior ICU experience. Not actively pursuing perm but unit director made offer. Evaluating. Decision by Mar 31.',
  },
  {
    id: 'ag-007', name: 'Daniel Park', initials: 'DP',
    color: 'from-indigo-500 to-indigo-700',
    agency: 'Medical Staffing Network', agencyShort: 'MSN', unit: 'MS-B', specialty: 'Med-Surg RN',
    startDate: 'Mar 17, 2026', endDate: 'Jun 16, 2026', weeksTotal: 13, weeksRemaining: 13,
    ratePerHour: 84, yearsExp: 3, phone: '(555) 340-2218', status: 'pending',
    rating: 0, attendance: 100, incidentCount: 0, nurseWantsPerm: false,
    managerInterest: 'neutral',
    orientation: [
      { label: 'HR paperwork & badge', done: false },
      { label: 'EHR (Epic) training', done: false },
      { label: 'Unit orientation — MS protocols', done: false },
      { label: 'Safety & compliance modules', done: false },
      { label: 'Preceptor sign-off', done: false },
    ],
    certifications: ['BLS', 'ACLS'],
    notes: 'Starting Mar 17. Placed to replace Ryan Sullivan. Backfill for MS-B. Orientation checklist pending.',
  },
  {
    id: 'ag-008', name: 'Brian Torres', initials: 'BT',
    color: 'from-slate-500 to-slate-700',
    agency: 'Cross Country Nurses', agencyShort: 'CCN', unit: 'ED', specialty: 'ED RN',
    startDate: 'Oct 14, 2025', endDate: 'Jan 13, 2026', weeksTotal: 13, weeksRemaining: 0,
    ratePerHour: 91, yearsExp: 4, phone: '(555) 592-1147', status: 'no-return',
    rating: 3.2, attendance: 84, incidentCount: 3, nurseWantsPerm: false,
    managerInterest: 'no-return',
    orientation: [
      { label: 'HR paperwork & badge', done: true, completedDate: 'Oct 14' },
      { label: 'EHR (Epic) training', done: true, completedDate: 'Oct 15' },
      { label: 'Unit orientation — ED protocols', done: true, completedDate: 'Oct 16' },
      { label: 'Safety & compliance modules', done: true, completedDate: 'Oct 17' },
      { label: 'Preceptor sign-off', done: true, completedDate: 'Oct 18' },
    ],
    certifications: ['BLS', 'ACLS', 'ENPC'],
    notes: 'DNR — do not re-engage. 3 incidents including patient complaint. Contract not renewed Jan 13. Agency notified.',
  },
]

// ── Session-mutable state ────────────────────────────────────────────────────

let _extensions: { nurseId: string; weeks: number; date: string }[] = []
let _hireActions: { nurseId: string; action: ManagerInterest; date: string }[] = []

// ── Actions ──────────────────────────────────────────────────────────────────

export function extendContract(nurseId: string, weeks: number) {
  const nurse = _nurses.find(n => n.id === nurseId)
  if (!nurse) return
  nurse.weeksRemaining += weeks
  nurse.status = 'active'
  _extensions.push({ nurseId, weeks, date: 'Mar 13, 2026' })
}

export function setManagerInterest(nurseId: string, interest: ManagerInterest) {
  const nurse = _nurses.find(n => n.id === nurseId)
  if (!nurse) return
  nurse.managerInterest = interest
  _hireActions.push({ nurseId, action: interest, date: 'Mar 13, 2026' })
}

export function markOrientation(nurseId: string, index: number) {
  const nurse = _nurses.find(n => n.id === nurseId)
  if (!nurse || !nurse.orientation[index]) return
  nurse.orientation[index].done = true
  nurse.orientation[index].completedDate = 'Mar 13'
}

// ── Accessors ────────────────────────────────────────────────────────────────

export function getNurses(): AgencyNurse[] { return _nurses }
export function getNurse(id: string): AgencyNurse | undefined { return _nurses.find(n => n.id === id) }
export function getActiveNurses(): AgencyNurse[] { return _nurses.filter(n => n.status === 'active' || n.status === 'expiring' || n.status === 'pending') }
export function getExpiringNurses(): AgencyNurse[] { return _nurses.filter(n => n.status === 'expiring' || (n.weeksRemaining <= 4 && n.status === 'active')) }
export function getCompletedNurses(): AgencyNurse[] { return _nurses.filter(n => n.status === 'completed' || n.status === 'no-return') }
export function getConversionCandidates(): AgencyNurse[] {
  return _nurses.filter(n => (n.managerInterest === 'hire') && (n.status === 'active' || n.status === 'expiring'))
}

export function getStats() {
  const active = _nurses.filter(n => n.status === 'active' || n.status === 'expiring').length
  const expiring30 = _nurses.filter(n => (n.status === 'expiring' || n.status === 'active') && n.weeksRemaining <= 4).length
  const pending = _nurses.filter(n => n.status === 'pending').length
  const conversion = getConversionCandidates().length
  // Cost metrics
  const activeNurses = _nurses.filter(n => n.status === 'active' || n.status === 'expiring')
  const avgRate = activeNurses.reduce((s, n) => s + n.ratePerHour, 0) / (activeNurses.length || 1)
  const monthlySpend = activeNurses.reduce((s, n) => s + n.ratePerHour * 36 * 4, 0)  // ~36h/week * 4 weeks
  const floatRate = 55  // float pool blended rate
  const premiumPct = Math.round(((avgRate - floatRate) / floatRate) * 100)
  return { active, expiring30, pending, conversion, avgRate: Math.round(avgRate), monthlySpend, premiumPct }
}

// ── Cost comparison data ─────────────────────────────────────────────────────

export const COST_COMPARISON = [
  { label: 'Agency/Travel',  rate: 91, color: 'bg-red-500',    lightColor: 'bg-red-100',    textColor: 'text-red-700' },
  { label: 'OT (Internal)',  rate: 68, color: 'bg-amber-500',  lightColor: 'bg-amber-100',  textColor: 'text-amber-700' },
  { label: 'Float Pool',     rate: 55, color: 'bg-sky-500',    lightColor: 'bg-sky-100',    textColor: 'text-sky-700' },
  { label: 'Perm Staff',     rate: 44, color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
]

export const MONTHLY_SPEND_TREND = [
  { month: 'Oct', spend: 42_000, nurses: 5 },
  { month: 'Nov', spend: 48_000, nurses: 5 },
  { month: 'Dec', spend: 55_000, nurses: 6 },
  { month: 'Jan', spend: 62_000, nurses: 7 },
  { month: 'Feb', spend: 58_000, nurses: 6 },
  { month: 'Mar', spend: 44_000, nurses: 5, current: true },
]

// ── Unit badge colors ────────────────────────────────────────────────────────

export const UNIT_COLORS: Record<UnitKey, string> = {
  'ICU':       'bg-red-100 text-red-700 border-red-200',
  'CCU':       'bg-orange-100 text-orange-700 border-orange-200',
  'ED':        'bg-purple-100 text-purple-700 border-purple-200',
  'MS-A':      'bg-sky-100 text-sky-700 border-sky-200',
  'MS-B':      'bg-teal-100 text-teal-700 border-teal-200',
  'Telemetry': 'bg-amber-100 text-amber-700 border-amber-200',
}

export const STATUS_META: Record<AgencyStatus, { label: string; dot: string; badge: string }> = {
  active:     { label: 'Active',     dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  expiring:   { label: 'Expiring',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  pending:    { label: 'Pending',    dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700' },
  completed:  { label: 'Completed',  dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600' },
  'no-return':{ label: 'DNR',        dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700' },
}

export const MANAGER_INTEREST_META: Record<ManagerInterest, { label: string; color: string }> = {
  hire:      { label: 'Hire Perm',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  extend:    { label: 'Extend',      color: 'text-sky-600 bg-sky-50 border-sky-200' },
  neutral:   { label: 'Neutral',     color: 'text-slate-500 bg-slate-50 border-slate-200' },
  'no-return': { label: 'DNR',       color: 'text-red-600 bg-red-50 border-red-200' },
}

export function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
}
