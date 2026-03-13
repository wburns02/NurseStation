// trainingData.ts — Training & Compliance Center data
// Reference date: March 12, 2026

export type TrainingCategory =
  | 'regulatory'    // HIPAA, OSHA, Joint Commission required
  | 'clinical'      // clinical skills, patient care
  | 'safety'        // fire, hazmat, workplace violence
  | 'skills'        // role-specific technical skills

export type CompletionStatus =
  | 'current'       // completed and not expiring
  | 'expiring-soon' // expiring within 60 days
  | 'overdue'       // expired or never completed
  | 'not-required'  // this module doesn't apply to this role

export type DeliveryMethod = 'online' | 'in-person' | 'simulation' | 'self-study'

export interface TrainingModule {
  id: string
  title: string
  shortCode: string
  category: TrainingCategory
  description: string
  durationMinutes: number
  frequency: 'annual' | 'biennial' | 'triennial' | 'one-time' | 'quarterly'
  requiredRoles: string[]   // 'all' | specific roles
  deliveryMethod: DeliveryMethod
  jcahoRequired: boolean    // Joint Commission mandatory
  passScore: number         // minimum % to pass (0 = pass/fail)
  vendorName?: string       // e.g. "HealthStream", "Relias"
}

export interface StaffCompletion {
  moduleId: string
  completedDate: string | null  // ISO date or null = never completed
  expiryDate: string | null
  score: number | null          // 0-100 or null
  method: DeliveryMethod | null
  status: CompletionStatus
  daysTillExpiry: number | null // null if no expiry or not completed
}

export interface StaffTrainingRecord {
  staffId: string
  name: string
  avatarInitials: string
  role: string
  unit: string
  hireDate: string
  completions: StaffCompletion[]
  overallScore: number        // % of required modules current
  overdueCount: number
  expiringSoonCount: number
  lastActivity: string        // 'Mar 8', '2d ago', etc.
}

export interface ModuleSummary {
  moduleId: string
  title: string
  shortCode: string
  category: TrainingCategory
  currentCount: number
  expiringSoonCount: number
  overdueCount: number
  totalRequired: number
  compliancePct: number
  jcahoRequired: boolean
  frequency: string
  durationMinutes: number
}

// ─── Training Modules ─────────────────────────────────────────────────────────

export const trainingModules: TrainingModule[] = [
  {
    id: 'tm001',
    title: 'HIPAA Privacy & Security',
    shortCode: 'HIPAA',
    category: 'regulatory',
    description: 'Annual HIPAA training covering patient privacy, data security, breach notification, and PHI handling requirements.',
    durationMinutes: 45,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 80,
    vendorName: 'HealthStream',
  },
  {
    id: 'tm002',
    title: 'Bloodborne Pathogens',
    shortCode: 'BBP',
    category: 'regulatory',
    description: 'OSHA-required training on bloodborne pathogen exposure control, PPE use, needlestick prevention, and post-exposure protocols.',
    durationMinutes: 60,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 80,
    vendorName: 'HealthStream',
  },
  {
    id: 'tm003',
    title: 'Fire Safety & Evacuation',
    shortCode: 'FIRE',
    category: 'safety',
    description: 'Annual fire prevention, RACE/PASS protocols, evacuation procedures, and fire extinguisher use.',
    durationMinutes: 30,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'in-person',
    jcahoRequired: true,
    passScore: 0,
    vendorName: 'Internal',
  },
  {
    id: 'tm004',
    title: 'Workplace Violence Prevention',
    shortCode: 'WVP',
    category: 'safety',
    description: 'De-escalation techniques, recognizing early warning signs, reporting procedures, and personal safety in patient care environments.',
    durationMinutes: 90,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 75,
    vendorName: 'Relias',
  },
  {
    id: 'tm005',
    title: 'Safe Patient Handling',
    shortCode: 'SPH',
    category: 'clinical',
    description: 'Proper body mechanics, lift equipment use, repositioning techniques, and fall prevention protocols.',
    durationMinutes: 60,
    frequency: 'biennial',
    requiredRoles: ['RN', 'LPN', 'CNA', 'PCT', 'Charge RN'],
    deliveryMethod: 'simulation',
    jcahoRequired: false,
    passScore: 0,
    vendorName: 'Internal',
  },
  {
    id: 'tm006',
    title: 'Cultural Humility & Equity',
    shortCode: 'CHE',
    category: 'regulatory',
    description: 'Implicit bias awareness, cultural competence in patient interactions, health equity principles.',
    durationMinutes: 60,
    frequency: 'biennial',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: false,
    passScore: 75,
    vendorName: 'Relias',
  },
  {
    id: 'tm007',
    title: 'Sepsis Early Recognition',
    shortCode: 'SEP',
    category: 'clinical',
    description: 'Recognition of SIRS criteria, sepsis bundles, time-sensitive interventions, and documentation requirements.',
    durationMinutes: 45,
    frequency: 'annual',
    requiredRoles: ['RN', 'Charge RN'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 85,
    vendorName: 'HealthStream',
  },
  {
    id: 'tm008',
    title: 'Medication Administration Safety',
    shortCode: 'MAS',
    category: 'clinical',
    description: '5 rights of medication administration, high-alert medications, IV push safety, error reporting.',
    durationMinutes: 90,
    frequency: 'annual',
    requiredRoles: ['RN', 'LPN', 'Charge RN'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 90,
    vendorName: 'HealthStream',
  },
  {
    id: 'tm009',
    title: 'Fall Prevention Protocol',
    shortCode: 'FALL',
    category: 'clinical',
    description: 'Morse Fall Scale assessment, environmental modifications, patient and family education, and post-fall huddle process.',
    durationMinutes: 30,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: false,
    passScore: 80,
    vendorName: 'Relias',
  },
  {
    id: 'tm010',
    title: 'Hazardous Materials (HAZMAT)',
    shortCode: 'HAZ',
    category: 'safety',
    description: 'Chemical spill response, SDS sheet use, PPE requirements, proper disposal of hazardous waste.',
    durationMinutes: 45,
    frequency: 'annual',
    requiredRoles: ['all'],
    deliveryMethod: 'online',
    jcahoRequired: false,
    passScore: 75,
    vendorName: 'Internal',
  },
  {
    id: 'tm011',
    title: 'Electronic Health Record (EHR) Updates',
    shortCode: 'EHR',
    category: 'skills',
    description: 'Latest EHR system updates, documentation best practices, order entry workflows.',
    durationMinutes: 60,
    frequency: 'annual',
    requiredRoles: ['RN', 'LPN', 'Charge RN'],
    deliveryMethod: 'online',
    jcahoRequired: false,
    passScore: 80,
    vendorName: 'Epic Systems',
  },
  {
    id: 'tm012',
    title: 'Restraint & Seclusion Policy',
    shortCode: 'RST',
    category: 'regulatory',
    description: 'Legal requirements for restraint use, alternatives, patient monitoring, and documentation for CMS compliance.',
    durationMinutes: 45,
    frequency: 'annual',
    requiredRoles: ['RN', 'Charge RN'],
    deliveryMethod: 'online',
    jcahoRequired: true,
    passScore: 85,
    vendorName: 'HealthStream',
  },
]

// ─── Helper: compute expiry date ─────────────────────────────────────────────

function addYears(date: string, years: number): string {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
}

const TODAY = '2026-03-12'

function computeStatus(completedDate: string | null, expiryDate: string | null): CompletionStatus {
  if (!completedDate) return 'overdue'
  if (!expiryDate) return 'current'
  const days = daysBetween(TODAY, expiryDate)
  if (days < 0) return 'overdue'
  if (days <= 60) return 'expiring-soon'
  return 'current'
}

function makeCompletion(
  moduleId: string,
  completedDate: string | null,
  frequencyYears: number,
  score: number | null = null,
  method: DeliveryMethod | null = 'online',
): StaffCompletion {
  const expiryDate = completedDate && frequencyYears > 0
    ? addYears(completedDate, frequencyYears)
    : null
  const status = computeStatus(completedDate, expiryDate)
  const daysTillExpiry = expiryDate ? daysBetween(TODAY, expiryDate) : null
  return { moduleId, completedDate, expiryDate, score, method, status, daysTillExpiry }
}

const freqMap: Record<string, number> = {
  annual: 1, biennial: 2, triennial: 3, 'one-time': 0, quarterly: 0.25
}
function freq(id: string): number {
  return freqMap[trainingModules.find(m => m.id === id)!.frequency] ?? 1
}

// ─── Staff Training Records ───────────────────────────────────────────────────

function buildRecord(
  staffId: string,
  name: string,
  initials: string,
  role: string,
  unit: string,
  hireDate: string,
  completions: StaffCompletion[],
  lastActivity: string,
): StaffTrainingRecord {
  const overdueCount      = completions.filter(c => c.status === 'overdue').length
  const expiringSoonCount = completions.filter(c => c.status === 'expiring-soon').length
  const currentCount      = completions.filter(c => c.status === 'current').length
  const totalRequired     = completions.filter(c => c.status !== 'not-required').length
  const overallScore      = totalRequired > 0 ? Math.round((currentCount / totalRequired) * 100) : 100
  return { staffId, name, avatarInitials: initials, role, unit, hireDate, completions, overallScore, overdueCount, expiringSoonCount, lastActivity }
}

export const staffTrainingRecords: StaffTrainingRecord[] = [

  // Sarah Chen — mostly current, 1 expiring soon
  buildRecord('s001', 'Sarah Chen', 'SC', 'RN', 'Float Pool', '2022-06-15', [
    makeCompletion('tm001', '2025-03-10', freq('tm001'), 92),
    makeCompletion('tm002', '2025-02-20', freq('tm002'), 88),
    makeCompletion('tm003', '2025-04-08', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-03-01', freq('tm004'), 91),
    makeCompletion('tm005', '2024-11-12', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2024-09-05', freq('tm006'), 85),
    makeCompletion('tm007', '2025-03-10', freq('tm007'), 96),
    makeCompletion('tm008', '2025-03-10', freq('tm008'), 94),
    makeCompletion('tm009', '2025-01-18', freq('tm009'), 88),
    makeCompletion('tm010', '2025-03-10', freq('tm010'), 82),
    makeCompletion('tm011', '2025-01-15', freq('tm011'), 90),  // expires Jan 2026 — overdue!
    makeCompletion('tm012', '2025-03-10', freq('tm012'), 87),
  ], 'Mar 10'),

  // James Okafor — 2 overdue, 1 expiring
  buildRecord('e002', 'James Okafor', 'JO', 'RN', 'ICU', '2021-09-01', [
    makeCompletion('tm001', '2025-01-15', freq('tm001'), 85),
    makeCompletion('tm002', null,         freq('tm002'), null, null),          // NEVER DONE
    makeCompletion('tm003', '2025-02-10', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-01-15', freq('tm004'), 79),
    makeCompletion('tm005', '2024-07-20', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2024-05-10', freq('tm006'), 80),
    makeCompletion('tm007', '2025-01-15', freq('tm007'), 91),
    makeCompletion('tm008', null,         freq('tm008'), null, null),          // NEVER DONE
    makeCompletion('tm009', '2025-01-15', freq('tm009'), 85),
    makeCompletion('tm010', '2025-01-15', freq('tm010'), 78),
    makeCompletion('tm011', '2025-02-01', freq('tm011'), 83),
    makeCompletion('tm012', '2025-01-15', freq('tm012'), 88),
  ], 'Feb 1'),

  // Marcus Williams — 1 overdue
  buildRecord('s002', 'Marcus Williams', 'MW', 'RN', 'Float Pool', '2020-03-10', [
    makeCompletion('tm001', '2025-04-01', freq('tm001'), 90),
    makeCompletion('tm002', '2025-04-01', freq('tm002'), 88),
    makeCompletion('tm003', '2025-05-15', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-04-01', freq('tm004'), 82),
    makeCompletion('tm005', '2024-12-10', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2024-11-20', freq('tm006'), 79),
    makeCompletion('tm007', '2025-04-01', freq('tm007'), 92),
    makeCompletion('tm008', '2025-04-01', freq('tm008'), 91),
    makeCompletion('tm009', '2024-12-15', freq('tm009'), 86),
    makeCompletion('tm010', '2025-04-01', freq('tm010'), 80),
    makeCompletion('tm011', '2025-02-10', freq('tm011'), 88),
    makeCompletion('tm012', '2025-04-01', freq('tm012'), 84),
  ], 'Feb 10'),

  // Christine Park — excellent compliance
  buildRecord('e016', 'Christine Park', 'CP', 'Charge RN', 'Med-Surg B', '2018-07-22', [
    makeCompletion('tm001', '2025-06-10', freq('tm001'), 97),
    makeCompletion('tm002', '2025-06-10', freq('tm002'), 95),
    makeCompletion('tm003', '2025-07-01', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-06-10', freq('tm004'), 94),
    makeCompletion('tm005', '2025-01-15', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2025-01-15', freq('tm006'), 92),
    makeCompletion('tm007', '2025-06-10', freq('tm007'), 98),
    makeCompletion('tm008', '2025-06-10', freq('tm008'), 96),
    makeCompletion('tm009', '2025-06-10', freq('tm009'), 93),
    makeCompletion('tm010', '2025-06-10', freq('tm010'), 91),
    makeCompletion('tm011', '2025-06-10', freq('tm011'), 95),
    makeCompletion('tm012', '2025-06-10', freq('tm012'), 97),
  ], 'Jun 10, 2025'),

  // Lisa Greenwald — 2 expiring soon
  buildRecord('e021', 'Lisa Greenwald', 'LG', 'RN', 'NICU', '2019-11-04', [
    makeCompletion('tm001', '2025-03-20', freq('tm001'), 89),   // expires Mar 20, 2026 — 8 days!
    makeCompletion('tm002', '2025-04-10', freq('tm002'), 86),
    makeCompletion('tm003', '2025-04-22', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-03-20', freq('tm004'), 83),   // expires Mar 20, 2026 — 8 days!
    makeCompletion('tm005', '2024-10-01', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2024-08-15', freq('tm006'), 81),
    makeCompletion('tm007', '2025-03-20', freq('tm007'), 93),
    makeCompletion('tm008', '2025-03-20', freq('tm008'), 90),
    makeCompletion('tm009', '2025-03-20', freq('tm009'), 87),
    makeCompletion('tm010', '2025-03-20', freq('tm010'), 82),
    makeCompletion('tm011', '2025-04-10', freq('tm011'), 88),
    makeCompletion('tm012', '2025-03-20', freq('tm012'), 85),
  ], 'Apr 10, 2025'),

  // Nathan Foster — 1 overdue
  buildRecord('e007', 'Nathan Foster', 'NF', 'Charge RN', 'Med-Surg B', '2017-02-14', [
    makeCompletion('tm001', '2025-05-20', freq('tm001'), 93),
    makeCompletion('tm002', '2025-05-20', freq('tm002'), 91),
    makeCompletion('tm003', '2025-06-05', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-05-20', freq('tm004'), 89),
    makeCompletion('tm005', '2024-12-01', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2024-12-01', freq('tm006'), 84),
    makeCompletion('tm007', '2025-05-20', freq('tm007'), 95),
    makeCompletion('tm008', null,         freq('tm008'), null, null),          // overdue
    makeCompletion('tm009', '2025-05-20', freq('tm009'), 90),
    makeCompletion('tm010', '2025-05-20', freq('tm010'), 86),
    makeCompletion('tm011', '2025-05-20', freq('tm011'), 92),
    makeCompletion('tm012', '2025-05-20', freq('tm012'), 91),
  ], 'May 20, 2025'),

  // Tyler Barnes (CNA) — only subset of modules required
  buildRecord('s005', 'Tyler Barnes', 'TB', 'CNA', 'Med-Surg B', '2023-08-07', [
    makeCompletion('tm001', '2025-08-15', freq('tm001'), 84),
    makeCompletion('tm002', '2025-08-15', freq('tm002'), 82),
    makeCompletion('tm003', '2025-09-01', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-08-15', freq('tm004'), 80),
    makeCompletion('tm005', '2025-01-20', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2025-01-20', freq('tm006'), 78),
    { moduleId: 'tm007', completedDate: null, expiryDate: null, score: null, method: null, status: 'not-required', daysTillExpiry: null },
    { moduleId: 'tm008', completedDate: null, expiryDate: null, score: null, method: null, status: 'not-required', daysTillExpiry: null },
    makeCompletion('tm009', '2025-08-15', freq('tm009'), 84),
    makeCompletion('tm010', '2025-08-15', freq('tm010'), 80),
    { moduleId: 'tm011', completedDate: null, expiryDate: null, score: null, method: null, status: 'not-required', daysTillExpiry: null },
    { moduleId: 'tm012', completedDate: null, expiryDate: null, score: null, method: null, status: 'not-required', daysTillExpiry: null },
  ], 'Jan 20'),

  // Priya Sharma — near-perfect
  buildRecord('e001', 'Priya Sharma', 'PS', 'Charge RN', 'ICU', '2016-04-18', [
    makeCompletion('tm001', '2025-04-18', freq('tm001'), 98),
    makeCompletion('tm002', '2025-04-18', freq('tm002'), 96),
    makeCompletion('tm003', '2025-05-10', freq('tm003'), null, 'in-person'),
    makeCompletion('tm004', '2025-04-18', freq('tm004'), 95),
    makeCompletion('tm005', '2024-11-01', freq('tm005'), null, 'simulation'),
    makeCompletion('tm006', '2025-01-05', freq('tm006'), 93),
    makeCompletion('tm007', '2025-04-18', freq('tm007'), 99),
    makeCompletion('tm008', '2025-04-18', freq('tm008'), 97),
    makeCompletion('tm009', '2025-04-18', freq('tm009'), 95),
    makeCompletion('tm010', '2025-04-18', freq('tm010'), 92),
    makeCompletion('tm011', '2025-04-18', freq('tm011'), 96),
    makeCompletion('tm012', '2025-04-18', freq('tm012'), 98),
  ], 'Apr 18, 2025'),
]

// ─── Module summary stats ─────────────────────────────────────────────────────

export function buildModuleSummaries(): ModuleSummary[] {
  return trainingModules.map(mod => {
    const required = staffTrainingRecords.filter(s =>
      mod.requiredRoles.includes('all') || mod.requiredRoles.includes(s.role)
    )
    const totalRequired = required.length
    const completions = required.flatMap(s => s.completions.filter(c => c.moduleId === mod.id))

    const currentCount      = completions.filter(c => c.status === 'current').length
    const expiringSoonCount = completions.filter(c => c.status === 'expiring-soon').length
    const overdueCount      = completions.filter(c => c.status === 'overdue').length
    const compliancePct     = totalRequired > 0 ? Math.round((currentCount / totalRequired) * 100) : 100

    const freqLabel = mod.frequency === 'annual' ? 'Annual' :
                      mod.frequency === 'biennial' ? 'Every 2 years' :
                      mod.frequency === 'triennial' ? 'Every 3 years' :
                      mod.frequency === 'one-time' ? 'One-time' : 'Quarterly'

    return {
      moduleId: mod.id,
      title: mod.title,
      shortCode: mod.shortCode,
      category: mod.category,
      currentCount,
      expiringSoonCount,
      overdueCount,
      totalRequired,
      compliancePct,
      jcahoRequired: mod.jcahoRequired,
      frequency: freqLabel,
      durationMinutes: mod.durationMinutes,
    }
  })
}

export const moduleSummaries: ModuleSummary[] = buildModuleSummaries()

// ─── Hospital-wide compliance summary ────────────────────────────────────────

export const hospitalCompliance = (() => {
  const allCompletions = staffTrainingRecords.flatMap(s =>
    s.completions.filter(c => c.status !== 'not-required')
  )
  const total          = allCompletions.length
  const current        = allCompletions.filter(c => c.status === 'current').length
  const expiringSoon   = allCompletions.filter(c => c.status === 'expiring-soon').length
  const overdue        = allCompletions.filter(c => c.status === 'overdue').length

  const jcahoModules   = trainingModules.filter(m => m.jcahoRequired).map(m => m.id)
  const jcahoItems     = allCompletions.filter(c => jcahoModules.includes(c.moduleId))
  const jcahoCompliant = jcahoItems.filter(c => c.status === 'current').length
  const jcahoTotal     = jcahoItems.length
  const jcahoScore     = jcahoTotal > 0 ? Math.round((jcahoCompliant / jcahoTotal) * 100) : 100

  return {
    overallPct:     Math.round((current / total) * 100),
    current,
    expiringSoon,
    overdue,
    total,
    jcahoScore,
    jcahoCompliant,
    jcahoTotal,
    staffAtRisk:    staffTrainingRecords.filter(s => s.overdueCount > 0 || s.expiringSoonCount > 0).length,
    fullyCompliant: staffTrainingRecords.filter(s => s.overdueCount === 0 && s.expiringSoonCount === 0).length,
  }
})()

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<TrainingCategory, { label: string; color: string; bg: string }> = {
  regulatory: { label: 'Regulatory',   color: 'text-red-700',    bg: 'bg-red-100' },
  clinical:   { label: 'Clinical',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  safety:     { label: 'Safety',       color: 'text-amber-700',  bg: 'bg-amber-100' },
  skills:     { label: 'Skills',       color: 'text-violet-700', bg: 'bg-violet-100' },
}

export const STATUS_META: Record<CompletionStatus, { label: string; color: string; bg: string; dot: string }> = {
  'current':       { label: 'Current',        color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  'expiring-soon': { label: 'Expiring Soon',  color: 'text-amber-700',  bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  'overdue':       { label: 'Overdue',        color: 'text-red-700',    bg: 'bg-red-100',     dot: 'bg-red-500' },
  'not-required':  { label: 'N/A',            color: 'text-slate-400',  bg: 'bg-slate-100',   dot: 'bg-slate-300' },
}

// ─── Mutable state for reminder sends ────────────────────────────────────────

export const sentReminders = new Set<string>()  // `${staffId}-${moduleId}`

export function sendReminder(staffId: string, moduleId: string): void {
  sentReminders.add(`${staffId}-${moduleId}`)
}

export function sendBulkReminders(moduleId: string): number {
  const mod = trainingModules.find(m => m.id === moduleId)!
  const targets = staffTrainingRecords.filter(s =>
    (mod.requiredRoles.includes('all') || mod.requiredRoles.includes(s.role)) &&
    s.completions.some(c => c.moduleId === moduleId && (c.status === 'overdue' || c.status === 'expiring-soon'))
  )
  targets.forEach(s => sentReminders.add(`${s.staffId}-${moduleId}`))
  return targets.length
}
