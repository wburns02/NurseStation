import type { StaffRole } from '../types'

export interface CredentialRecord {
  id: string
  staffId: string
  staffName: string
  staffInitials: string
  staffRole: StaffRole
  primaryUnit: string
  cert: string
  certFullName: string
  expiryDate: string        // ISO "YYYY-MM-DD"
  daysUntilExpiry: number   // negative = expired
  status: 'expired' | 'critical' | 'expiring' | 'current'
  reminderSent: boolean
}

export interface UnitComplianceData {
  unitId: string
  unitName: string
  floor: string
  score: number             // 0–100
  expiredCount: number
  criticalCount: number     // 0–30 days
  expiringCount: number     // 31–90 days
  totalTracked: number
  topRisk?: string          // short description of the biggest issue
}

export interface ImpactAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  unit: string
  title: string
  description: string
  daysToAct: number
  credential: string
  staffName: string
  action: string
}

// ─── Lookup tables ───────────────────────────────────────────────────────────

export const CERT_FULL_NAMES: Record<string, string> = {
  BLS: 'Basic Life Support',
  ACLS: 'Advanced Cardiac Life Support',
  CCRN: 'Critical Care Registered Nurse',
  CEN: 'Certified Emergency Nurse',
  TNCC: 'Trauma Nursing Core Course',
  CPAN: 'Certified Post Anesthesia Nurse',
  'RNC-NIC': 'RN Certified — Neonatal Intensive Care',
  NRP: 'Neonatal Resuscitation Program',
  OCN: 'Oncology Certified Nurse',
  ONC: 'Orthopaedic Nurses Certification',
  CNA: 'Certified Nursing Assistant',
}

// Reference date: March 12, 2026
const REF = new Date('2026-03-12')

function days(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - REF.getTime()) / 86400000)
}

function status(d: number): CredentialRecord['status'] {
  if (d < 0) return 'expired'
  if (d <= 30) return 'critical'
  if (d <= 90) return 'expiring'
  return 'current'
}

function c(
  id: string, sid: string, name: string, initials: string,
  role: StaffRole, unit: string, cert: string, expiry: string,
  reminderSent = false,
): CredentialRecord {
  const d = days(expiry)
  return {
    id, staffId: sid, staffName: name, staffInitials: initials,
    staffRole: role, primaryUnit: unit,
    cert, certFullName: CERT_FULL_NAMES[cert] ?? cert,
    expiryDate: expiry, daysUntilExpiry: d,
    status: status(d), reminderSent,
  }
}

// ─── Credential records ───────────────────────────────────────────────────────

export const allCredentials: CredentialRecord[] = [
  // ══ EXPIRED ══════════════════════════════════════════════════════════
  c('cr001', 'e002', 'James Okafor',  'JO', 'RN',        'ICU',        'BLS',     '2026-02-28'),
  c('cr002', 'e015', 'Tanya Brooks',  'TB', 'CNA',       'Med-Surg A', 'CNA',     '2026-01-15'),

  // ══ CRITICAL (0–30 days) ═════════════════════════════════════════════
  c('cr003', 'e021', 'Lisa Greenwald',   'LG', 'Charge RN', 'NICU', 'RNC-NIC', '2026-04-02'),
  c('cr004', 'e022', 'Paulo Fernandez',  'PF', 'RN',        'NICU', 'NRP',     '2026-04-10'),

  // ══ EXPIRING (31–90 days) ════════════════════════════════════════════
  c('cr005', 'e004', 'Rachel Torres',   'RT', 'Charge RN', 'CCU',        'CCRN', '2026-05-01'),
  c('cr006', 'e007', 'Nathan Foster',   'NF', 'Charge RN', 'ED',         'TNCC', '2026-05-15'),
  c('cr007', 'e011', 'Beth Collins',    'BC', 'Charge RN', 'Med-Surg A', 'ACLS', '2026-05-20'),
  c('cr008', 'e005', 'Kevin Nguyen',    'KN', 'RN',        'CCU',        'ACLS', '2026-05-28'),
  c('cr009', 'e009', 'Carlos Rivera',   'CR', 'RN',        'ED',         'TNCC', '2026-06-01'),
  c('cr010', 'e025', 'Grace Washington','GW', 'Charge RN', 'Oncology',   'OCN',  '2026-06-10'),

  // ══ CURRENT (> 90 days) ══════════════════════════════════════════════
  // ICU
  c('cr011', 'e001', 'Priya Sharma',  'PS', 'Charge RN', 'ICU', 'CCRN', '2027-06-15'),
  c('cr012', 'e001', 'Priya Sharma',  'PS', 'Charge RN', 'ICU', 'BLS',  '2027-09-01'),
  c('cr013', 'e001', 'Priya Sharma',  'PS', 'Charge RN', 'ICU', 'ACLS', '2027-03-20'),
  c('cr014', 'e002', 'James Okafor',  'JO', 'RN',        'ICU', 'ACLS', '2027-01-10'),
  c('cr015', 'e003', 'Maria Santos',  'MS', 'RN',        'ICU', 'BLS',  '2027-05-18'),
  c('cr016', 'e003', 'Maria Santos',  'MS', 'RN',        'ICU', 'CCRN', '2028-02-14'),

  // CCU
  c('cr017', 'e004', 'Rachel Torres', 'RT', 'Charge RN', 'CCU', 'BLS',  '2027-11-30'),
  c('cr018', 'e004', 'Rachel Torres', 'RT', 'Charge RN', 'CCU', 'ACLS', '2027-08-15'),
  c('cr019', 'e005', 'Kevin Nguyen',  'KN', 'RN',        'CCU', 'BLS',  '2027-04-22'),
  c('cr020', 'e006', 'Angela White',  'AW', 'RN',        'CCU', 'BLS',  '2027-07-10'),
  c('cr021', 'e006', 'Angela White',  'AW', 'RN',        'CCU', 'ACLS', '2027-07-10'),

  // ED
  c('cr022', 'e007', 'Nathan Foster', 'NF', 'Charge RN', 'ED', 'BLS',  '2027-03-25'),
  c('cr023', 'e007', 'Nathan Foster', 'NF', 'Charge RN', 'ED', 'ACLS', '2027-08-01'),
  c('cr024', 'e007', 'Nathan Foster', 'NF', 'Charge RN', 'ED', 'CEN',  '2027-12-01'),
  c('cr025', 'e008', 'Fatima Hassan', 'FH', 'RN',        'ED', 'BLS',  '2027-09-15'),
  c('cr026', 'e008', 'Fatima Hassan', 'FH', 'RN',        'ED', 'ACLS', '2027-09-15'),
  c('cr027', 'e008', 'Fatima Hassan', 'FH', 'RN',        'ED', 'CEN',  '2028-01-05'),
  c('cr028', 'e009', 'Carlos Rivera', 'CR', 'RN',        'ED', 'BLS',  '2027-06-10'),
  c('cr029', 'e009', 'Carlos Rivera', 'CR', 'RN',        'ED', 'ACLS', '2027-06-10'),

  // NICU
  c('cr030', 'e021', 'Lisa Greenwald',  'LG', 'Charge RN', 'NICU', 'BLS',     '2027-10-20'),
  c('cr031', 'e021', 'Lisa Greenwald',  'LG', 'Charge RN', 'NICU', 'NRP',     '2027-04-02'),
  c('cr032', 'e022', 'Paulo Fernandez', 'PF', 'RN',        'NICU', 'RNC-NIC', '2027-11-18'),
  c('cr033', 'e022', 'Paulo Fernandez', 'PF', 'RN',        'NICU', 'BLS',     '2027-08-30'),
  c('cr034', 'e023', 'Hannah Moore',    'HM', 'RN',        'NICU', 'NRP',     '2027-05-15'),
  c('cr035', 'e023', 'Hannah Moore',    'HM', 'RN',        'NICU', 'BLS',     '2028-01-10'),
  c('cr036', 'e023', 'Hannah Moore',    'HM', 'RN',        'NICU', 'RNC-NIC', '2027-09-25'),

  // Oncology
  c('cr037', 'e025', 'Grace Washington', 'GW', 'Charge RN', 'Oncology', 'BLS',  '2027-04-10'),
  c('cr038', 'e025', 'Grace Washington', 'GW', 'Charge RN', 'Oncology', 'ACLS', '2027-04-10'),
  c('cr039', 'e026', 'Robert Klein',     'RK', 'RN',        'Oncology', 'OCN',  '2028-03-01'),
  c('cr040', 'e026', 'Robert Klein',     'RK', 'RN',        'Oncology', 'BLS',  '2027-11-22'),

  // PACU
  c('cr041', 'e019', 'Diane Fletcher',  'DF', 'Charge RN', 'PACU', 'CPAN', '2027-10-01'),
  c('cr042', 'e019', 'Diane Fletcher',  'DF', 'Charge RN', 'PACU', 'BLS',  '2027-12-15'),
  c('cr043', 'e019', 'Diane Fletcher',  'DF', 'Charge RN', 'PACU', 'ACLS', '2027-12-15'),
  c('cr044', 'e020', 'Antoine Leblanc', 'AL', 'RN',        'PACU', 'CPAN', '2028-02-20'),
  c('cr045', 'e020', 'Antoine Leblanc', 'AL', 'RN',        'PACU', 'BLS',  '2027-07-08'),

  // Med-Surg A
  c('cr046', 'e011', 'Beth Collins', 'BC', 'Charge RN', 'Med-Surg A', 'BLS', '2027-08-14'),
  c('cr047', 'e012', 'Mike Turner',  'MT', 'RN',        'Med-Surg A', 'BLS', '2027-06-22'),
  c('cr048', 'e013', 'Zoe Anderson', 'ZA', 'RN',        'Med-Surg A', 'BLS', '2027-09-09'),
  c('cr049', 'e013', 'Zoe Anderson', 'ZA', 'RN',        'Med-Surg A', 'ACLS','2027-09-09'),

  // Telemetry
  c('cr050', 'e032', 'Diana Foster', 'DF', 'Charge RN', 'Telemetry', 'BLS',  '2027-11-04'),
  c('cr051', 'e032', 'Diana Foster', 'DF', 'Charge RN', 'Telemetry', 'ACLS', '2027-11-04'),
  c('cr052', 'e033', 'Brian Walsh',  'BW', 'RN',        'Telemetry', 'BLS',  '2028-02-17'),
  c('cr053', 'e033', 'Brian Walsh',  'BW', 'RN',        'Telemetry', 'ACLS', '2028-02-17'),
]

// ─── Unit compliance summaries ────────────────────────────────────────────────

export const unitCompliance: UnitComplianceData[] = [
  { unitId: 'icu',   unitName: 'ICU',        floor: '4th', score: 88, expiredCount: 1, criticalCount: 0, expiringCount: 0, totalTracked: 8,  topRisk: "James Okafor's BLS expired Feb 28" },
  { unitId: 'ccu',   unitName: 'CCU',        floor: '4th', score: 83, expiredCount: 0, criticalCount: 0, expiringCount: 2, totalTracked: 7,  topRisk: "Rachel Torres' CCRN expires May 1" },
  { unitId: 'ed',    unitName: 'ED',         floor: '1st', score: 85, expiredCount: 0, criticalCount: 0, expiringCount: 2, totalTracked: 8,  topRisk: 'Nathan Foster & Carlos Rivera TNCC expiring' },
  { unitId: 'ms-a',  unitName: 'Med-Surg A', floor: '3rd', score: 80, expiredCount: 1, criticalCount: 0, expiringCount: 1, totalTracked: 6,  topRisk: "Tanya Brooks' CNA certification expired" },
  { unitId: 'ms-b',  unitName: 'Med-Surg B', floor: '3rd', score: 100,expiredCount: 0, criticalCount: 0, expiringCount: 0, totalTracked: 4,  topRisk: undefined },
  { unitId: 'nicu',  unitName: 'NICU',       floor: '5th', score: 72, expiredCount: 0, criticalCount: 2, expiringCount: 0, totalTracked: 8,  topRisk: 'RNC-NIC & NRP both expiring within 30 days' },
  { unitId: 'onco',  unitName: 'Oncology',   floor: '5th', score: 90, expiredCount: 0, criticalCount: 0, expiringCount: 1, totalTracked: 4,  topRisk: "Grace Washington's OCN expires Jun 10" },
  { unitId: 'pacu',  unitName: 'PACU',       floor: '2nd', score: 100,expiredCount: 0, criticalCount: 0, expiringCount: 0, totalTracked: 5,  topRisk: undefined },
  { unitId: 'ortho', unitName: 'Ortho',      floor: '2nd', score: 100,expiredCount: 0, criticalCount: 0, expiringCount: 0, totalTracked: 3,  topRisk: undefined },
  { unitId: 'tele',  unitName: 'Telemetry',  floor: '3rd', score: 100,expiredCount: 0, criticalCount: 0, expiringCount: 0, totalTracked: 4,  topRisk: undefined },
]

export const overallScore = 87

// ─── Impact analysis alerts ───────────────────────────────────────────────────

export const impactAlerts: ImpactAlert[] = [
  {
    id: 'ia001',
    severity: 'critical',
    unit: 'ICU',
    title: "James Okafor's BLS is EXPIRED",
    description:
      "Per JCAHO standard RC.02.01.01, RNs with expired Basic Life Support cannot be assigned to direct patient care. James is currently listed as on-duty in ICU and assigned to patients. This is an immediate compliance violation — he must not be reassigned until BLS is renewed.",
    daysToAct: 0,
    credential: 'BLS',
    staffName: 'James Okafor',
    action: 'Schedule BLS renewal immediately — classes available Mar 14 & Mar 16',
  },
  {
    id: 'ia002',
    severity: 'critical',
    unit: 'NICU',
    title: 'NICU dropping to minimum RNC-NIC coverage in 21 days',
    description:
      "Lisa Greenwald's RNC-NIC expires Apr 2 (21 days). NICU policy requires a minimum of 2 RNC-NIC certified nurses per shift. Currently 2 nurses hold this certification (Lisa + Hannah Moore). Once Lisa's expires, only Hannah remains — at the absolute minimum. A single call-out from Hannah would leave NICU non-compliant and require census reduction.",
    daysToAct: 21,
    credential: 'RNC-NIC',
    staffName: 'Lisa Greenwald',
    action: 'Send renewal reminder now — ANCC renewal window opens 3 months before expiry',
  },
  {
    id: 'ia003',
    severity: 'warning',
    unit: 'CCU',
    title: 'CCU CCRN buffer reduces to minimum by May 1',
    description:
      "Rachel Torres' CCRN expires May 1 (50 days). CCU currently has 3 CCRN-certified nurses — above the minimum of 1 per shift. After expiry, 2 remain, still compliant. However, without renewal the buffer is reduced. If Angela White or Kevin Nguyen take leave, CCU risks a shift with no CCRN coverage.",
    daysToAct: 50,
    credential: 'CCRN',
    staffName: 'Rachel Torres',
    action: 'Schedule ANCC renewal exam before April 15 to maintain buffer',
  },
]

// Derived helpers
export function getExpiringWithin(days: number): CredentialRecord[] {
  return allCredentials
    .filter(r => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= days)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

export function getExpired(): CredentialRecord[] {
  return allCredentials
    .filter(r => r.daysUntilExpiry < 0)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

// Group credentials by staff ID
export function getByStaff(): Map<string, CredentialRecord[]> {
  const map = new Map<string, CredentialRecord[]>()
  for (const cr of allCredentials) {
    const list = map.get(cr.staffId) ?? []
    list.push(cr)
    map.set(cr.staffId, list)
  }
  return map
}

export function worstStatus(records: CredentialRecord[]): CredentialRecord['status'] {
  const order: CredentialRecord['status'][] = ['expired', 'critical', 'expiring', 'current']
  for (const s of order) {
    if (records.some(r => r.status === s)) return s
  }
  return 'current'
}
