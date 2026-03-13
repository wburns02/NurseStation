// staffIntelligenceData.ts — Staff Intelligence: 360° Performance View
// Reference date: March 12, 2026
// Composite score synthesizes: attendance, wellbeing, training compliance,
// credential currency, reliability, and engagement trend.

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'good' | 'star'
export type StaffStatus = 'on-duty' | 'available' | 'off-duty' | 'called-out'
export type ActionState = 'idle' | 'pending' | 'done'
export type FlagSeverity = 'critical' | 'warning' | 'info'
export type FlagCategory = 'attendance' | 'wellbeing' | 'training' | 'credential' | 'performance' | 'engagement'

export interface StaffFlag {
  id: string
  category: FlagCategory
  severity: FlagSeverity
  text: string
  date: string
}

export interface SuggestedAction {
  id: string
  label: string
  icon: 'message' | 'calendar' | 'document' | 'star' | 'alert' | 'phone'
  urgency: 'urgent' | 'recommended' | 'optional'
}

export interface StaffIntelligenceRecord {
  id: string
  name: string
  initials: string
  role: string
  unit: string
  status: StaffStatus
  // Composite performance
  performanceScore: number        // 0–100
  scoreTrend: number[]            // 8-week weekly scores, oldest → newest
  riskLevel: RiskLevel
  flightRiskPercent: number | null  // null if not at-risk
  // Component scores (0–100 each)
  attendanceScore: number
  trainingScore: number
  wellbeingScore: number
  credentialScore: number
  reliabilityScore: number
  engagementScore: number
  // Raw metrics
  calloutsThisMonth: number
  overtimeHours: number
  hoursThisWeek: number
  ptoDaysUsed: number
  completedModules: number
  totalModules: number
  flags: StaffFlag[]
  suggestedActions: SuggestedAction[]
  lastReviewDate: string | null
  hireDate: string
  tenure: string  // e.g. "2y 3m"
}

// ─── Mutable action states ──────────────────────────────────────────────────
const _actionStates = new Map<string, ActionState>()

export function getActionState(staffId: string, actionId: string): ActionState {
  return _actionStates.get(`${staffId}:${actionId}`) ?? 'idle'
}

export function fireAction(staffId: string, actionId: string): void {
  _actionStates.set(`${staffId}:${actionId}`, 'pending')
  setTimeout(() => {
    _actionStates.set(`${staffId}:${actionId}`, 'done')
  }, 1000)
}

// ─── Data ───────────────────────────────────────────────────────────────────
export const STAFF_INTELLIGENCE: StaffIntelligenceRecord[] = [
  {
    id: 'e002',
    name: 'James Okafor',
    initials: 'JO',
    role: 'RN',
    unit: 'ICU',
    status: 'on-duty',
    performanceScore: 38,
    scoreTrend: [64, 60, 55, 51, 48, 44, 41, 38],
    riskLevel: 'critical',
    flightRiskPercent: 78,
    attendanceScore: 35,
    trainingScore: 45,
    wellbeingScore: 28,
    credentialScore: 72,
    reliabilityScore: 30,
    engagementScore: 40,
    calloutsThisMonth: 4,
    overtimeHours: 18,
    hoursThisWeek: 44,
    ptoDaysUsed: 0,
    completedModules: 3,
    totalModules: 7,
    flags: [
      { id: 'f-jo-1', category: 'attendance', severity: 'critical', text: '4 call-outs in 30 days (threshold: 2)', date: '2026-03-10' },
      { id: 'f-jo-2', category: 'wellbeing', severity: 'critical', text: 'Burnout score 82/100 — critical burnout zone', date: '2026-03-08' },
      { id: 'f-jo-3', category: 'training', severity: 'warning', text: '4 of 7 required modules incomplete — due Mar 31', date: '2026-03-01' },
      { id: 'f-jo-4', category: 'engagement', severity: 'warning', text: 'No PTO taken in 2026 — zero recovery time', date: '2026-02-15' },
    ],
    suggestedActions: [
      { id: 'act-jo-1', label: 'Schedule check-in', icon: 'calendar', urgency: 'urgent' },
      { id: 'act-jo-2', label: 'Send wellness resource', icon: 'message', urgency: 'urgent' },
      { id: 'act-jo-3', label: 'Document concern', icon: 'document', urgency: 'recommended' },
    ],
    lastReviewDate: '2025-12-10',
    hireDate: '2021-06-14',
    tenure: '4y 9m',
  },
  {
    id: 's005',
    name: 'Tyler Barnes',
    initials: 'TB',
    role: 'RN',
    unit: 'Med-Surg B',
    status: 'available',
    performanceScore: 44,
    scoreTrend: [58, 54, 52, 50, 49, 47, 45, 44],
    riskLevel: 'critical',
    flightRiskPercent: 65,
    attendanceScore: 30,
    trainingScore: 60,
    wellbeingScore: 42,
    credentialScore: 55,
    reliabilityScore: 38,
    engagementScore: 50,
    calloutsThisMonth: 3,
    overtimeHours: 4,
    hoursThisWeek: 20,
    ptoDaysUsed: 1,
    completedModules: 4,
    totalModules: 6,
    flags: [
      { id: 'f-tb-1', category: 'attendance', severity: 'critical', text: '3 call-outs this month — progressive attendance pattern', date: '2026-03-11' },
      { id: 'f-tb-2', category: 'credential', severity: 'warning', text: 'ACLS certification expires in 22 days', date: '2026-03-05' },
      { id: 'f-tb-3', category: 'engagement', severity: 'warning', text: 'Hours dropped to 20/wk — possible disengagement signal', date: '2026-03-07' },
    ],
    suggestedActions: [
      { id: 'act-tb-1', label: 'Schedule check-in', icon: 'calendar', urgency: 'urgent' },
      { id: 'act-tb-2', label: 'ACLS renewal reminder', icon: 'alert', urgency: 'urgent' },
      { id: 'act-tb-3', label: 'Document attendance', icon: 'document', urgency: 'recommended' },
    ],
    lastReviewDate: '2025-11-20',
    hireDate: '2022-09-01',
    tenure: '3y 6m',
  },
  {
    id: 's007',
    name: 'Linda Okonkwo',
    initials: 'LO',
    role: 'RN',
    unit: 'Oncology',
    status: 'available',
    performanceScore: 52,
    scoreTrend: [68, 65, 62, 60, 58, 55, 53, 52],
    riskLevel: 'high',
    flightRiskPercent: 48,
    attendanceScore: 55,
    trainingScore: 50,
    wellbeingScore: 45,
    credentialScore: 60,
    reliabilityScore: 52,
    engagementScore: 55,
    calloutsThisMonth: 2,
    overtimeHours: 8,
    hoursThisWeek: 32,
    ptoDaysUsed: 2,
    completedModules: 3,
    totalModules: 6,
    flags: [
      { id: 'f-lo-1', category: 'training', severity: 'warning', text: 'Chemotherapy safety module overdue by 14 days', date: '2026-02-26' },
      { id: 'f-lo-2', category: 'wellbeing', severity: 'warning', text: 'Engagement trend declining 4 consecutive weeks', date: '2026-03-09' },
      { id: 'f-lo-3', category: 'attendance', severity: 'info', text: '2 call-outs this month — at threshold', date: '2026-03-08' },
    ],
    suggestedActions: [
      { id: 'act-lo-1', label: 'Training follow-up', icon: 'message', urgency: 'urgent' },
      { id: 'act-lo-2', label: 'Schedule check-in', icon: 'calendar', urgency: 'recommended' },
      { id: 'act-lo-3', label: 'Recognize effort', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2025-12-05',
    hireDate: '2020-04-20',
    tenure: '5y 11m',
  },
  {
    id: 'e009',
    name: 'Carlos Rivera',
    initials: 'CR',
    role: 'RN',
    unit: 'ED',
    status: 'on-duty',
    performanceScore: 61,
    scoreTrend: [65, 63, 62, 62, 60, 61, 60, 61],
    riskLevel: 'moderate',
    flightRiskPercent: 28,
    attendanceScore: 72,
    trainingScore: 55,
    wellbeingScore: 58,
    credentialScore: 65,
    reliabilityScore: 62,
    engagementScore: 60,
    calloutsThisMonth: 1,
    overtimeHours: 6,
    hoursThisWeek: 36,
    ptoDaysUsed: 3,
    completedModules: 4,
    totalModules: 7,
    flags: [
      { id: 'f-cr-1', category: 'training', severity: 'warning', text: 'Trauma triage module 60% complete — due Apr 5', date: '2026-03-02' },
      { id: 'f-cr-2', category: 'credential', severity: 'info', text: 'TNCC renewal due in 45 days', date: '2026-03-12' },
    ],
    suggestedActions: [
      { id: 'act-cr-1', label: 'Training nudge', icon: 'message', urgency: 'recommended' },
      { id: 'act-cr-2', label: 'TNCC renewal info', icon: 'alert', urgency: 'optional' },
    ],
    lastReviewDate: '2026-01-15',
    hireDate: '2023-01-09',
    tenure: '3y 2m',
  },
  {
    id: 'e010',
    name: 'Stacy Powell',
    initials: 'SP',
    role: 'RN',
    unit: 'ED',
    status: 'on-duty',
    performanceScore: 63,
    scoreTrend: [60, 61, 62, 61, 63, 62, 64, 63],
    riskLevel: 'moderate',
    flightRiskPercent: 22,
    attendanceScore: 75,
    trainingScore: 62,
    wellbeingScore: 60,
    credentialScore: 70,
    reliabilityScore: 65,
    engagementScore: 62,
    calloutsThisMonth: 1,
    overtimeHours: 4,
    hoursThisWeek: 32,
    ptoDaysUsed: 5,
    completedModules: 5,
    totalModules: 8,
    flags: [
      { id: 'f-sp-1', category: 'training', severity: 'info', text: '3 modules pending completion — due end of Q1', date: '2026-03-01' },
    ],
    suggestedActions: [
      { id: 'act-sp-1', label: 'Training reminder', icon: 'message', urgency: 'recommended' },
      { id: 'act-sp-2', label: 'Recognize progress', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-01-20',
    hireDate: '2022-05-16',
    tenure: '3y 10m',
  },
  {
    id: 'e012',
    name: 'Mike Turner',
    initials: 'MT',
    role: 'RN',
    unit: 'Med-Surg A',
    status: 'on-duty',
    performanceScore: 66,
    scoreTrend: [62, 63, 64, 65, 64, 66, 67, 66],
    riskLevel: 'moderate',
    flightRiskPercent: 18,
    attendanceScore: 78,
    trainingScore: 65,
    wellbeingScore: 62,
    credentialScore: 68,
    reliabilityScore: 70,
    engagementScore: 65,
    calloutsThisMonth: 1,
    overtimeHours: 6,
    hoursThisWeek: 36,
    ptoDaysUsed: 4,
    completedModules: 5,
    totalModules: 7,
    flags: [
      { id: 'f-mt-1', category: 'credential', severity: 'info', text: 'BLS certification renewal in 60 days', date: '2026-03-10' },
    ],
    suggestedActions: [
      { id: 'act-mt-1', label: 'BLS renewal info', icon: 'alert', urgency: 'optional' },
      { id: 'act-mt-2', label: 'Recognize consistency', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-02-01',
    hireDate: '2021-11-02',
    tenure: '4y 4m',
  },
  {
    id: 'e006',
    name: 'Angela White',
    initials: 'AW',
    role: 'RN',
    unit: 'CCU',
    status: 'on-duty',
    performanceScore: 74,
    scoreTrend: [70, 71, 72, 72, 73, 74, 74, 74],
    riskLevel: 'good',
    flightRiskPercent: null,
    attendanceScore: 85,
    trainingScore: 72,
    wellbeingScore: 70,
    credentialScore: 80,
    reliabilityScore: 78,
    engagementScore: 72,
    calloutsThisMonth: 0,
    overtimeHours: 8,
    hoursThisWeek: 40,
    ptoDaysUsed: 6,
    completedModules: 6,
    totalModules: 8,
    flags: [
      { id: 'f-aw-1', category: 'training', severity: 'info', text: '2 elective modules available — recommended by manager', date: '2026-03-06' },
    ],
    suggestedActions: [
      { id: 'act-aw-1', label: 'Recommend training', icon: 'message', urgency: 'optional' },
      { id: 'act-aw-2', label: 'Recognize performance', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-02-10',
    hireDate: '2020-08-17',
    tenure: '5y 7m',
  },
  {
    id: 'e005',
    name: 'Kevin Nguyen',
    initials: 'KN',
    role: 'RN',
    unit: 'CCU',
    status: 'on-duty',
    performanceScore: 76,
    scoreTrend: [73, 74, 75, 74, 76, 75, 76, 76],
    riskLevel: 'good',
    flightRiskPercent: null,
    attendanceScore: 88,
    trainingScore: 75,
    wellbeingScore: 72,
    credentialScore: 82,
    reliabilityScore: 80,
    engagementScore: 74,
    calloutsThisMonth: 0,
    overtimeHours: 4,
    hoursThisWeek: 36,
    ptoDaysUsed: 7,
    completedModules: 6,
    totalModules: 7,
    flags: [],
    suggestedActions: [
      { id: 'act-kn-1', label: 'Recognize performance', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-02-15',
    hireDate: '2019-03-04',
    tenure: '7y 0m',
  },
  {
    id: 'e003',
    name: 'Maria Santos',
    initials: 'MS',
    role: 'RN',
    unit: 'ICU',
    status: 'on-duty',
    performanceScore: 78,
    scoreTrend: [75, 76, 76, 77, 77, 78, 78, 78],
    riskLevel: 'good',
    flightRiskPercent: null,
    attendanceScore: 90,
    trainingScore: 78,
    wellbeingScore: 74,
    credentialScore: 85,
    reliabilityScore: 82,
    engagementScore: 76,
    calloutsThisMonth: 0,
    overtimeHours: 6,
    hoursThisWeek: 36,
    ptoDaysUsed: 8,
    completedModules: 7,
    totalModules: 8,
    flags: [
      { id: 'f-ms-1', category: 'performance', severity: 'info', text: 'Peer mentorship nomination received — Jan 2026', date: '2026-01-22' },
    ],
    suggestedActions: [
      { id: 'act-ms-1', label: 'Explore mentorship role', icon: 'message', urgency: 'optional' },
      { id: 'act-ms-2', label: 'Formal recognition', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-02-20',
    hireDate: '2018-07-09',
    tenure: '7y 8m',
  },
  {
    id: 'e008',
    name: 'Fatima Hassan',
    initials: 'FH',
    role: 'RN',
    unit: 'ED',
    status: 'on-duty',
    performanceScore: 80,
    scoreTrend: [76, 77, 78, 78, 79, 80, 80, 80],
    riskLevel: 'good',
    flightRiskPercent: null,
    attendanceScore: 92,
    trainingScore: 80,
    wellbeingScore: 76,
    credentialScore: 88,
    reliabilityScore: 84,
    engagementScore: 78,
    calloutsThisMonth: 0,
    overtimeHours: 4,
    hoursThisWeek: 40,
    ptoDaysUsed: 9,
    completedModules: 7,
    totalModules: 8,
    flags: [],
    suggestedActions: [
      { id: 'act-fh-1', label: 'Recognize excellence', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-02-25',
    hireDate: '2020-01-13',
    tenure: '6y 2m',
  },
  {
    id: 's006',
    name: 'David Kim',
    initials: 'DK',
    role: 'RN',
    unit: 'ED',
    status: 'available',
    performanceScore: 82,
    scoreTrend: [79, 80, 81, 80, 82, 81, 82, 82],
    riskLevel: 'good',
    flightRiskPercent: null,
    attendanceScore: 93,
    trainingScore: 82,
    wellbeingScore: 78,
    credentialScore: 90,
    reliabilityScore: 86,
    engagementScore: 80,
    calloutsThisMonth: 0,
    overtimeHours: 8,
    hoursThisWeek: 40,
    ptoDaysUsed: 10,
    completedModules: 8,
    totalModules: 9,
    flags: [],
    suggestedActions: [
      { id: 'act-dk-1', label: 'Recognize excellence', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-03-01',
    hireDate: '2017-04-22',
    tenure: '8y 11m',
  },
  {
    id: 'e007',
    name: 'Nathan Foster',
    initials: 'NF',
    role: 'Charge RN',
    unit: 'ED',
    status: 'on-duty',
    performanceScore: 88,
    scoreTrend: [84, 85, 86, 87, 87, 88, 88, 88],
    riskLevel: 'star',
    flightRiskPercent: null,
    attendanceScore: 96,
    trainingScore: 90,
    wellbeingScore: 84,
    credentialScore: 95,
    reliabilityScore: 92,
    engagementScore: 88,
    calloutsThisMonth: 0,
    overtimeHours: 4,
    hoursThisWeek: 40,
    ptoDaysUsed: 12,
    completedModules: 9,
    totalModules: 9,
    flags: [
      { id: 'f-nf-1', category: 'performance', severity: 'info', text: 'Leadership development track — recommended by DON', date: '2026-02-28' },
    ],
    suggestedActions: [
      { id: 'act-nf-1', label: 'Leadership conversation', icon: 'calendar', urgency: 'recommended' },
      { id: 'act-nf-2', label: 'Formal recognition', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-03-05',
    hireDate: '2015-09-14',
    tenure: '10y 6m',
  },
  {
    id: 'e004',
    name: 'Rachel Torres',
    initials: 'RT',
    role: 'Charge RN',
    unit: 'CCU',
    status: 'on-duty',
    performanceScore: 91,
    scoreTrend: [88, 89, 90, 90, 91, 91, 91, 91],
    riskLevel: 'star',
    flightRiskPercent: null,
    attendanceScore: 98,
    trainingScore: 92,
    wellbeingScore: 88,
    credentialScore: 96,
    reliabilityScore: 94,
    engagementScore: 90,
    calloutsThisMonth: 0,
    overtimeHours: 2,
    hoursThisWeek: 36,
    ptoDaysUsed: 14,
    completedModules: 9,
    totalModules: 9,
    flags: [
      { id: 'f-rt-1', category: 'performance', severity: 'info', text: 'DAISY Award nominee — March 2026', date: '2026-03-03' },
    ],
    suggestedActions: [
      { id: 'act-rt-1', label: 'DAISY nomination', icon: 'star', urgency: 'recommended' },
      { id: 'act-rt-2', label: 'Career development talk', icon: 'calendar', urgency: 'optional' },
    ],
    lastReviewDate: '2026-03-08',
    hireDate: '2014-02-18',
    tenure: '12y 1m',
  },
  {
    id: 'e001',
    name: 'Priya Sharma',
    initials: 'PS',
    role: 'Charge RN',
    unit: 'ICU',
    status: 'on-duty',
    performanceScore: 96,
    scoreTrend: [92, 93, 94, 95, 95, 96, 96, 96],
    riskLevel: 'star',
    flightRiskPercent: null,
    attendanceScore: 100,
    trainingScore: 96,
    wellbeingScore: 92,
    credentialScore: 98,
    reliabilityScore: 96,
    engagementScore: 95,
    calloutsThisMonth: 0,
    overtimeHours: 0,
    hoursThisWeek: 40,
    ptoDaysUsed: 15,
    completedModules: 10,
    totalModules: 10,
    flags: [
      { id: 'f-ps-1', category: 'performance', severity: 'info', text: 'Charge Nurse of the Quarter — Q4 2025', date: '2026-01-05' },
    ],
    suggestedActions: [
      { id: 'act-ps-1', label: 'ANM pathway discussion', icon: 'calendar', urgency: 'recommended' },
      { id: 'act-ps-2', label: 'Formal recognition', icon: 'star', urgency: 'optional' },
    ],
    lastReviewDate: '2026-03-10',
    hireDate: '2012-06-01',
    tenure: '13y 9m',
  },
]

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical Risk', color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-500' },
  high:     { label: 'High Risk',     color: 'text-orange-400', bg: 'bg-orange-500/15', dot: 'bg-orange-500' },
  moderate: { label: 'Moderate',      color: 'text-amber-400',  bg: 'bg-amber-500/15',  dot: 'bg-amber-500' },
  good:     { label: 'Good',          color: 'text-emerald-400',bg: 'bg-emerald-500/15',dot: 'bg-emerald-500' },
  star:     { label: 'Star',          color: 'text-violet-400', bg: 'bg-violet-500/15', dot: 'bg-violet-500' },
}

export const FLAG_META: Record<FlagCategory, { label: string; icon: string }> = {
  attendance:  { label: 'Attendance',   icon: '🗓️' },
  wellbeing:   { label: 'Wellbeing',    icon: '❤️' },
  training:    { label: 'Training',     icon: '📚' },
  credential:  { label: 'Credential',   icon: '🛡️' },
  performance: { label: 'Performance',  icon: '⭐' },
  engagement:  { label: 'Engagement',   icon: '💬' },
}

export function getAtRiskStaff(): StaffIntelligenceRecord[] {
  return STAFF_INTELLIGENCE.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
}

export function getIntelligenceSummary() {
  const total = STAFF_INTELLIGENCE.length
  const critical = STAFF_INTELLIGENCE.filter(s => s.riskLevel === 'critical').length
  const high = STAFF_INTELLIGENCE.filter(s => s.riskLevel === 'high').length
  const stars = STAFF_INTELLIGENCE.filter(s => s.riskLevel === 'star').length
  const avgScore = Math.round(STAFF_INTELLIGENCE.reduce((a, s) => a + s.performanceScore, 0) / total)
  const flightRisks = STAFF_INTELLIGENCE.filter(s => s.flightRiskPercent !== null && s.flightRiskPercent >= 50).length
  return { total, critical, high, atRisk: critical + high, stars, avgScore, flightRisks }
}
