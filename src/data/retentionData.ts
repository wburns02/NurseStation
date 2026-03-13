// retentionData.ts — Nurse Retention & Flight Risk Intelligence
// Predictive turnover modeling for nursing leadership

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'stable'
export type UnitId = 'ICU' | 'CCU' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry' | 'ED'
export type InterventionType = 'checkin' | 'pay-review' | 'schedule' | 'recognition' | 'growth'

export const RISK_META: Record<RiskLevel, {
  label: string; short: string; color: string; bg: string; border: string; dot: string; textDark: string
}> = {
  critical: { label: 'Critical Risk',   short: 'Critical', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     textDark: 'text-red-700' },
  high:     { label: 'High Risk',       short: 'High',     color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500',  textDark: 'text-orange-700' },
  moderate: { label: 'Moderate',        short: 'Moderate', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',   textDark: 'text-amber-700' },
  stable:   { label: 'Stable',          short: 'Stable',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', textDark: 'text-emerald-700' },
}

export const WEEK_LABELS = ['W-11','W-10','W-9','W-8','W-7','W-6','W-5','W-4','W-3','W-2','W-1','Now']

export const HOSP_WEEKS = [77, 76, 76, 75, 75, 74, 74, 74, 74, 74, 74, 74]

export const UNIT_WEEK_DATA: Record<UnitId, number[]> = {
  ICU:       [78, 77, 76, 75, 74, 73, 72, 72, 72, 72, 72, 72],
  CCU:       [83, 83, 84, 84, 85, 85, 85, 85, 86, 86, 86, 86],
  'MS-A':    [74, 74, 74, 75, 75, 75, 76, 76, 76, 77, 77, 77],
  'MS-B':    [74, 73, 72, 71, 70, 70, 69, 69, 69, 69, 69, 69],
  Oncology:  [77, 77, 78, 78, 77, 77, 78, 78, 78, 78, 78, 78],
  Telemetry: [79, 79, 80, 80, 80, 81, 81, 81, 81, 81, 81, 81],
  ED:        [74, 73, 71, 70, 69, 68, 66, 65, 64, 63, 63, 63],
}

export interface RiskFactor {
  label: string
  score: number   // 0–20, higher = better
  value: string   // human-readable current value
  icon: 'clock' | 'dollar' | 'calendar' | 'star' | 'trending'
}

export interface Intervention {
  id: string
  type: InterventionType
  label: string
  description: string
  estimatedCostLabel: string
  scoreLift: number
  timeToImpact: string
}

export interface StaffRetention {
  id: string
  name: string
  role: 'RN' | 'LPN' | 'NP' | 'CNA'
  unit: UnitId
  tenureMonths: number
  retentionScore: number   // 0–100, lower = higher flight risk
  riskLevel: RiskLevel
  workload: RiskFactor
  payEquity: RiskFactor
  schedule: RiskFactor
  recognition: RiskFactor
  growth: RiskFactor
  topRisks: string[]
  recommendedAction: string
  interventions: Intervention[]
  replacementCost: number   // dollars
  flaggedThisWeek: boolean
  scoreHistory: number[]   // 12 weeks, index 0 = oldest
}

export interface UnitRetentionSummary {
  unit: UnitId
  label: string
  abbr: string
  avgScore: number
  staffCount: number
  criticalCount: number
  highCount: number
  moderateCount: number
  stableCount: number
  trend: 'improving' | 'declining' | 'stable'
  color: string
  bg: string
  border: string
}

export interface HospitalRetentionSummary {
  avgScore: number
  atRiskCount: number
  projectedCost: number
  flaggedThisWeek: number
  totalStaff: number
}

// ── Module-level executed interventions ───────────────────────────────────────
const _executed = new Set<string>()

export function executeIntervention(intId: string): void {
  _executed.add(intId)
}

export function isExecuted(intId: string): boolean {
  return _executed.has(intId)
}

// ── Staff data ─────────────────────────────────────────────────────────────────
const STAFF_DATA: StaffRetention[] = [
  // ─── Critical Risk ──────────────────────────────────────────────────────────
  {
    id: 'staff-001', name: 'Marcus Webb', role: 'RN', unit: 'ED', tenureMonths: 96,
    retentionScore: 18, riskLevel: 'critical', flaggedThisWeek: false,
    replacementCost: 52000,
    workload:    { label: 'Workload',           score: 4,  value: '73h overtime last 4 wks · Mandatory OT ×3', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',         score: 3,  value: '$11.20/hr below market · 24 months, no raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit',       score: 7,  value: 'Swap denied ×8 · Float forced ×4', icon: 'calendar' },
    recognition: { label: 'Recognition',        score: 2,  value: '0 recognitions in 94 days', icon: 'star' },
    growth:      { label: 'Career Growth',      score: 2,  value: 'Charge-ready · Preceptor role denied twice', icon: 'trending' },
    topRisks: [
      '$11.20/hr below market — 24 months without a raise',
      '73h overtime last 4 weeks — acute burnout signal',
      'Charge-ready for 2 years, advancement blocked',
    ],
    recommendedAction: 'Priority: Pay Review + Float Restriction',
    scoreHistory: [42, 40, 38, 35, 32, 30, 28, 26, 24, 22, 20, 18],
    interventions: [
      { id: 'int-001-a', type: 'pay-review', label: 'Initiate Pay Review', description: 'Open compensation review process — HR notified, market data attached', estimatedCostLabel: '$6,800/yr raise', scoreLift: 8, timeToImpact: '2–3 weeks' },
      { id: 'int-001-b', type: 'schedule',   label: 'Restrict Float Assignments', description: 'Remove Marcus from ED float pool for 30 days — workload relief', estimatedCostLabel: 'No cost', scoreLift: 4, timeToImpact: 'Immediate' },
      { id: 'int-001-c', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Schedule a direct manager conversation to surface concerns', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
      { id: 'int-001-d', type: 'recognition',label: 'Nominate for Recognition', description: 'Submit for Nurse of the Month — 8-year service recognition', estimatedCostLabel: '$250 award', scoreLift: 2, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-002', name: 'Keisha Thompson', role: 'RN', unit: 'ICU', tenureMonths: 36,
    retentionScore: 22, riskLevel: 'critical', flaggedThisWeek: false,
    replacementCost: 48000,
    workload:    { label: 'Workload',      score: 5,  value: '8 float assignments in 6 weeks', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 6,  value: '$8.80/hr below market · 18 months, no raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 4,  value: '3 consecutive weekends · PTO denied ×2', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 2,  value: 'Manager conflict note on file · 0 recognitions', icon: 'star' },
    growth:      { label: 'Career Growth',score: 5,  value: 'BSN complete · No advancement path offered', icon: 'trending' },
    topRisks: [
      '8 float assignments in 6 weeks — exhaustion pattern',
      '$8.80/hr below market, 18 months without raise',
      'Consecutive weekends + PTO denials — schedule discontent',
    ],
    recommendedAction: 'Priority: Reduce Float + Pay Review',
    scoreHistory: [45, 43, 41, 38, 35, 32, 30, 27, 25, 24, 23, 22],
    interventions: [
      { id: 'int-002-a', type: 'schedule',   label: 'Restrict Float Eligibility', description: 'Exempt Keisha from ICU float for 6 weeks — targeted relief', estimatedCostLabel: 'No cost', scoreLift: 6, timeToImpact: 'Immediate' },
      { id: 'int-002-b', type: 'pay-review', label: 'Initiate Pay Review', description: 'Expedite compensation review — BSN completion justifies reclassification', estimatedCostLabel: '$5,200/yr raise', scoreLift: 7, timeToImpact: '2–3 weeks' },
      { id: 'int-002-c', type: 'growth',     label: 'Offer Charge Rotation', description: 'Add Keisha to charge nurse rotation — $2/hr differential', estimatedCostLabel: '$2/hr differential', scoreLift: 4, timeToImpact: 'Next schedule' },
      { id: 'int-002-d', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Direct conversation with manager to address conflict note', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },

  // ─── High Risk ───────────────────────────────────────────────────────────────
  {
    id: 'staff-003', name: 'Priya Nair', role: 'RN', unit: 'MS-A', tenureMonths: 72,
    retentionScore: 31, riskLevel: 'high', flaggedThisWeek: true,
    replacementCost: 44000,
    workload:    { label: 'Workload',      score: 8,  value: 'Charge 14/20 shifts — no differential', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 5,  value: '$9.50/hr below market · 18 months, no raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 8,  value: 'Mandatory charge × forced, swap denied ×6', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 6,  value: '1 peer recognition in 60 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 4,  value: 'Applied for charge position — not offered', icon: 'trending' },
    topRisks: [
      'Charge nurse 14/20 shifts without title or differential',
      '$9.50/hr below market — 18 months without raise',
      'Swap requests denied ×6 — schedule dissatisfaction escalating',
    ],
    recommendedAction: 'Priority: Charge Role Offer + Pay Review',
    scoreHistory: [42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31],
    interventions: [
      { id: 'int-003-a', type: 'growth',     label: 'Offer Charge Nurse Position', description: 'Formal charge nurse title + $2.50/hr differential — retroactive consideration', estimatedCostLabel: '$2.50/hr diff', scoreLift: 7, timeToImpact: 'Next schedule' },
      { id: 'int-003-b', type: 'pay-review', label: 'Initiate Pay Review', description: '6-year tenure + charge responsibilities justify market adjustment', estimatedCostLabel: '$5,700/yr raise', scoreLift: 6, timeToImpact: '2–3 weeks' },
      { id: 'int-003-c', type: 'schedule',   label: 'Remove Mandatory Charge Coverage', description: 'Transition charge from mandatory to voluntary until title is resolved', estimatedCostLabel: 'No cost', scoreLift: 4, timeToImpact: 'Immediate' },
      { id: 'int-003-d', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Acknowledge charge contributions — set expectations for title review', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-004', name: 'Devon Castillo', role: 'RN', unit: 'CCU', tenureMonths: 60,
    retentionScore: 38, riskLevel: 'high', flaggedThisWeek: false,
    replacementCost: 46000,
    workload:    { label: 'Workload',      score: 10, value: 'Avg 52h/wk · High acuity burden (avg 3.4)', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 7,  value: '$7.20/hr below market · 22 months, no raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 9,  value: 'PTO denied ×3 including family event', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 6,  value: 'Last recognition 78 days ago', icon: 'star' },
    growth:      { label: 'Career Growth',score: 6,  value: 'Stable but no advancement path visible', icon: 'trending' },
    topRisks: [
      'PTO denied ×3 including family emergency — disengagement signal',
      '$7.20/hr below market, 22 months without raise',
      'High acuity patient load — sustainable capacity concern',
    ],
    recommendedAction: 'Priority: Approve PTO + Pay Review',
    scoreHistory: [50, 49, 48, 46, 45, 44, 43, 42, 41, 40, 39, 38],
    interventions: [
      { id: 'int-004-a', type: 'pay-review', label: 'Initiate Pay Review', description: '5 years of service, 22 months without raise — immediate compensation review', estimatedCostLabel: '$4,320/yr raise', scoreLift: 7, timeToImpact: '2–3 weeks' },
      { id: 'int-004-b', type: 'schedule',   label: 'Approve Pending PTO', description: 'Override previous denials — approve next PTO request as goodwill gesture', estimatedCostLabel: 'No cost', scoreLift: 5, timeToImpact: 'Immediate' },
      { id: 'int-004-c', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Acknowledge PTO denials — explain context and commit to improvement', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
      { id: 'int-004-d', type: 'recognition',label: 'Nominate for Recognition', description: '5-year anniversary recognition overdue — formal acknowledgment', estimatedCostLabel: '$250 award', scoreLift: 2, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-005', name: 'Sandra Li', role: 'LPN', unit: 'Oncology', tenureMonths: 48,
    retentionScore: 44, riskLevel: 'high', flaggedThisWeek: false,
    replacementCost: 32000,
    workload:    { label: 'Workload',      score: 12, value: '3 unit transfer requests filed in 6 months', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 8,  value: '$5.80/hr below market · 14 months, no raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 10, value: 'Schedule changed without notice ×2', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 7,  value: '1 recognition in 45 days — improving', icon: 'star' },
    growth:      { label: 'Career Growth',score: 7,  value: 'Training backlog: 6 courses incomplete', icon: 'trending' },
    topRisks: [
      '3 unit transfer requests — strong signal of unit culture issue',
      'Training backlog of 6 courses — career stagnation',
      '$5.80/hr below market, 14 months without raise',
    ],
    recommendedAction: 'Priority: Training Acceleration + Culture Check',
    scoreHistory: [55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44],
    interventions: [
      { id: 'int-005-a', type: 'growth',     label: 'Expedited Training Enrollment', description: 'Fast-track Sandra through 6 backlogged courses — assign learning time in schedule', estimatedCostLabel: '$400 training', scoreLift: 5, timeToImpact: '2 weeks' },
      { id: 'int-005-b', type: 'pay-review', label: 'Initiate Pay Review', description: 'LPN market rates increased 12% YoY — urgent adjustment needed', estimatedCostLabel: '$3,480/yr raise', scoreLift: 5, timeToImpact: '2–3 weeks' },
      { id: 'int-005-c', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Understand transfer request drivers — unit culture, workload, or interpersonal', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-006', name: 'Jerome Carter', role: 'RN', unit: 'ED', tenureMonths: 24,
    retentionScore: 47, riskLevel: 'high', flaggedThisWeek: true,
    replacementCost: 40000,
    workload:    { label: 'Workload',      score: 12, value: '5 consecutive weekend assignments', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 9,  value: '$4.40/hr below market — new grad gap', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 11, value: 'Weekend ratio 3× peers · No accommodation', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 7,  value: 'No recognition in 62 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 8,  value: '2yr mark — no formal performance review', icon: 'trending' },
    topRisks: [
      'Score dropped 11 points this week — sudden escalation (new flag)',
      '5 consecutive weekend shifts — highest ratio in ED cohort',
      '2-year mark without formal performance or pay review',
    ],
    recommendedAction: 'Priority: Schedule Equity + Pay Review',
    scoreHistory: [58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47],
    interventions: [
      { id: 'int-006-a', type: 'schedule',   label: 'Rebalance Weekend Distribution', description: 'Reduce Jerome\'s weekend ratio to match ED peers — next 4 weeks', estimatedCostLabel: 'No cost', scoreLift: 4, timeToImpact: 'Next schedule' },
      { id: 'int-006-b', type: 'pay-review', label: 'Initiate Pay Review', description: '2-year anniversary review — market adjustment for ED specialty', estimatedCostLabel: '$2,600/yr raise', scoreLift: 4, timeToImpact: '2–3 weeks' },
      { id: 'int-006-c', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Urgent — sudden score drop warrants immediate manager touchpoint', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-007', name: 'Yuki Tanaka', role: 'RN', unit: 'MS-B', tenureMonths: 84,
    retentionScore: 49, riskLevel: 'high', flaggedThisWeek: false,
    replacementCost: 42000,
    workload:    { label: 'Workload',      score: 13, value: 'Normal hours — non-workload risk', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 9,  value: '$6.50/hr below market for 7yr experience', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 11, value: 'Childcare conflicts not accommodated ×4', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 8,  value: '7-year milestone not formally recognized', icon: 'star' },
    growth:      { label: 'Career Growth',score: 8,  value: 'No promotion track despite strong reviews', icon: 'trending' },
    topRisks: [
      '$6.50/hr below market — significant gap for 7-year experienced RN',
      '7-year tenure milestone not formally recognized',
      'Childcare-related schedule conflicts not accommodated ×4',
    ],
    recommendedAction: 'Priority: Pay Review + Tenure Recognition',
    scoreHistory: [58, 57, 56, 55, 54, 53, 52, 51, 50, 50, 49, 49],
    interventions: [
      { id: 'int-007-a', type: 'pay-review', label: 'Initiate Pay Review', description: '7 years of service with strong reviews — market correction overdue', estimatedCostLabel: '$4,160/yr raise', scoreLift: 5, timeToImpact: '2–3 weeks' },
      { id: 'int-007-b', type: 'recognition',label: 'Recognize 7-Year Milestone', description: 'Formal tenure recognition ceremony + award — leadership acknowledgment', estimatedCostLabel: '$500 award', scoreLift: 4, timeToImpact: 'This week' },
      { id: 'int-007-c', type: 'schedule',   label: 'Accommodate Schedule Preferences', description: 'Prioritize Yuki\'s childcare availability windows in next build', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'Next schedule' },
    ],
  },
  {
    id: 'staff-008', name: 'Aisha Rahman', role: 'RN', unit: 'ICU', tenureMonths: 14,
    retentionScore: 50, riskLevel: 'high', flaggedThisWeek: true,
    replacementCost: 38000,
    workload:    { label: 'Workload',      score: 12, value: 'Float assigned ×5 — high for new nurse', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 10, value: 'New grad rate — 14 months, no review', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 12, value: '3 missed breaks in 2 weeks — overloaded', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 8,  value: 'No formal mentor support assigned', icon: 'star' },
    growth:      { label: 'Career Growth',score: 8,  value: 'No growth path — first position', icon: 'trending' },
    topRisks: [
      'Float assigned ×5 — very high for a 14-month nurse (new flag)',
      'No formal mentor assigned — new grad support gap',
      '3 missed breaks in 2 weeks — acute workload overload',
    ],
    recommendedAction: 'Priority: Assign Mentor + Pay Review',
    scoreHistory: [55, 54, 53, 52, 52, 52, 51, 51, 51, 51, 50, 50],
    interventions: [
      { id: 'int-008-a', type: 'growth',     label: 'Assign Formal Preceptor', description: 'Pair with Rachel Torres as preceptor — structured 90-day support plan', estimatedCostLabel: '$1/hr preceptor diff', scoreLift: 6, timeToImpact: 'Immediate' },
      { id: 'int-008-b', type: 'schedule',   label: 'Reduce Float Assignments', description: 'Limit float eligibility while under 18 months tenure — policy clarification', estimatedCostLabel: 'No cost', scoreLift: 4, timeToImpact: 'Immediate' },
      { id: 'int-008-c', type: 'checkin',    label: 'Schedule 1:1 Meeting', description: 'Check-in on workload experience — first-year nurse adjustment support', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },

  // ─── Moderate Risk ───────────────────────────────────────────────────────────
  {
    id: 'staff-009', name: 'James Okafor', role: 'RN', unit: 'Telemetry', tenureMonths: 26,
    retentionScore: 53, riskLevel: 'moderate', flaggedThisWeek: false,
    replacementCost: 36000,
    workload:    { label: 'Workload',      score: 13, value: 'Normal hours — monitoring closely', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 10, value: '$3.20/hr below market', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 12, value: 'Schedule preferences met 70% of time', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 9,  value: '1 recognition in 30 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 9,  value: '2-year mark — review pending', icon: 'trending' },
    topRisks: ['New grad adjustment — 2-year mark approaching, no formal review', 'Schedule preference gaps noted ×3 this quarter'],
    recommendedAction: 'Proactive 1:1 recommended before decline',
    scoreHistory: [58, 57, 57, 56, 55, 55, 54, 54, 54, 53, 53, 53],
    interventions: [
      { id: 'int-009-a', type: 'checkin',  label: 'Schedule 1:1 Meeting',         description: '2-year milestone conversation — career goals and satisfaction check', estimatedCostLabel: 'No cost',    scoreLift: 3, timeToImpact: 'This week' },
      { id: 'int-009-b', type: 'schedule', label: 'Optimize Schedule Preferences', description: 'Review and accommodate top 3 scheduling preferences', estimatedCostLabel: 'No cost',    scoreLift: 2, timeToImpact: 'Next schedule' },
    ],
  },
  {
    id: 'staff-010', name: 'Maria Reyes', role: 'RN', unit: 'MS-B', tenureMonths: 132,
    retentionScore: 61, riskLevel: 'moderate', flaggedThisWeek: false,
    replacementCost: 48000,
    workload:    { label: 'Workload',      score: 14, value: 'Consistent load — sustainable', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 11, value: '$2.80/hr below market', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 13, value: 'Schedule preferences met 80%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 11, value: '2 recognitions — but 11yr milestone missed', icon: 'star' },
    growth:      { label: 'Career Growth',score: 12, value: '11-year veteran — no succession path offered', icon: 'trending' },
    topRisks: ['11-year veteran — recognition plateau and tenure fatigue risk', 'No succession planning conversation in 3 years'],
    recommendedAction: 'Tenure recognition + succession planning',
    scoreHistory: [65, 64, 63, 63, 62, 62, 62, 61, 61, 61, 61, 61],
    interventions: [
      { id: 'int-010-a', type: 'recognition', label: 'Recognize 11-Year Milestone', description: 'Public recognition ceremony — leadership acknowledgment of tenure', estimatedCostLabel: '$500 award', scoreLift: 4, timeToImpact: 'This week' },
      { id: 'int-010-b', type: 'growth',      label: 'Offer Preceptor Role',        description: 'Formal preceptor for new graduates — meaningful responsibility', estimatedCostLabel: '$1/hr diff', scoreLift: 3, timeToImpact: 'Next schedule' },
    ],
  },
  {
    id: 'staff-011', name: 'Tom Brennan', role: 'RN', unit: 'ED', tenureMonths: 60,
    retentionScore: 67, riskLevel: 'moderate', flaggedThisWeek: false,
    replacementCost: 46000,
    workload:    { label: 'Workload',      score: 15, value: 'Hours trending up last 3 weeks', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 12, value: '$2.40/hr below market', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 13, value: 'Pending PTO request unanswered ×1', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 13, value: '1 recognition last 30 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 14, value: 'Stable — exploring charge opportunities', icon: 'trending' },
    topRisks: ['ED workload hours trending up for 3 consecutive weeks', 'Pending PTO request unanswered — creates uncertainty'],
    recommendedAction: 'Approve PTO + workload monitoring',
    scoreHistory: [70, 69, 68, 68, 68, 67, 67, 67, 67, 67, 67, 67],
    interventions: [
      { id: 'int-011-a', type: 'schedule', label: 'Approve Pending PTO',   description: 'Approve outstanding time-off request — clear the queue', estimatedCostLabel: 'No cost', scoreLift: 3, timeToImpact: 'Immediate' },
      { id: 'int-011-b', type: 'checkin',  label: 'Schedule 1:1 Meeting', description: 'Proactive check-in on workload trends — get ahead of potential issue', estimatedCostLabel: 'No cost', scoreLift: 2, timeToImpact: 'This week' },
    ],
  },
  {
    id: 'staff-012', name: 'Fatima Hassan', role: 'RN', unit: 'ICU', tenureMonths: 84,
    retentionScore: 71, riskLevel: 'moderate', flaggedThisWeek: false,
    replacementCost: 52000,
    workload:    { label: 'Workload',      score: 15, value: 'Recent charge fatigue pattern noted', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 14, value: 'At market — recent adjustment', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 14, value: 'Schedule satisfaction 85%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 14, value: 'Last recognition 45 days ago', icon: 'star' },
    growth:      { label: 'Career Growth',score: 14, value: '7-year career — stable but not advancing', icon: 'trending' },
    topRisks: ['Charge fatigue pattern — frequency may be unsustainable', 'Recognition gap: 45 days — maintain cadence'],
    recommendedAction: 'Reduce charge frequency + recognize',
    scoreHistory: [73, 73, 72, 72, 72, 71, 71, 71, 71, 71, 71, 71],
    interventions: [
      { id: 'int-012-a', type: 'recognition', label: 'Nominate for Recognition', description: '7-year ICU veteran — nominate for clinical excellence award', estimatedCostLabel: '$250 award', scoreLift: 3, timeToImpact: 'This week' },
      { id: 'int-012-b', type: 'schedule',    label: 'Reduce Charge Frequency', description: 'Cap charge assignments at 8/20 shifts for next 4 weeks', estimatedCostLabel: 'No cost', scoreLift: 2, timeToImpact: 'Next schedule' },
    ],
  },
  {
    id: 'staff-013', name: 'Lisa Park', role: 'RN', unit: 'MS-A', tenureMonths: 108,
    retentionScore: 73, riskLevel: 'moderate', flaggedThisWeek: false,
    replacementCost: 50000,
    workload:    { label: 'Workload',      score: 16, value: 'Consistent — well managed', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 14, value: 'Slightly below market ($1.80/hr gap)', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 14, value: 'Preferences honored 85% of time', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 15, value: '2 recognitions last 30 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 14, value: '9-year plateau — no promotion track', icon: 'trending' },
    topRisks: ['9-year tenure without promotion or succession discussion', 'Career growth stagnation — talent retention risk medium-term'],
    recommendedAction: 'Career development discussion needed',
    scoreHistory: [73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 73],
    interventions: [
      { id: 'int-013-a', type: 'growth',     label: 'Schedule Career Path Meeting', description: 'Explore charge, educator, or clinical lead path — 9yr expertise', estimatedCostLabel: 'No cost', scoreLift: 4, timeToImpact: 'This week' },
      { id: 'int-013-b', type: 'recognition',label: 'Recognize 9-Year Tenure',     description: '9-year anniversary recognition — public acknowledgment', estimatedCostLabel: '$500 award', scoreLift: 3, timeToImpact: 'This week' },
    ],
  },

  // ─── Stable ──────────────────────────────────────────────────────────────────
  {
    id: 'staff-014', name: 'Carlos Vega', role: 'RN', unit: 'CCU', tenureMonths: 72,
    retentionScore: 84, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 50000,
    workload:    { label: 'Workload',      score: 17, value: 'Well-managed — sustainable pace', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 16, value: 'At market — recent adjustment', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 17, value: 'Schedule satisfaction 92%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 17, value: '4 recognitions last 90 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 17, value: 'Charge rotation — growing well', icon: 'trending' },
    topRisks: ['Strong performer — monitor for competitor recruitment'],
    recommendedAction: 'Continue current engagement — succession planning',
    scoreHistory: [80, 81, 82, 82, 83, 83, 83, 84, 84, 84, 84, 84],
    interventions: [{ id: 'int-014-a', type: 'growth', label: 'Schedule Career Path Review', description: 'Plan next 12 months of development goals', estimatedCostLabel: 'No cost', scoreLift: 2, timeToImpact: 'This month' }],
  },
  {
    id: 'staff-015', name: 'Amy Chen', role: 'RN', unit: 'MS-B', tenureMonths: 36,
    retentionScore: 88, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 42000,
    workload:    { label: 'Workload',      score: 18, value: 'Thriving — engaged and energized', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 17, value: 'Competitive — recent raise', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 18, value: 'Preferences met 95%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 17, value: '5 recognitions last 90 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 18, value: 'Charge candidate — high trajectory', icon: 'trending' },
    topRisks: ['High performer — charge promotion candidate'],
    recommendedAction: 'Nominate for charge program',
    scoreHistory: [82, 83, 84, 85, 86, 86, 87, 87, 87, 88, 88, 88],
    interventions: [{ id: 'int-015-a', type: 'growth', label: 'Nominate for Charge Program', description: 'Fast-track charge nurse candidacy — 3yr strong performer', estimatedCostLabel: '$2/hr diff', scoreLift: 3, timeToImpact: 'Next schedule' }],
  },
  {
    id: 'staff-016', name: 'Rachel Torres', role: 'RN', unit: 'ICU', tenureMonths: 48,
    retentionScore: 91, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 48000,
    workload:    { label: 'Workload',      score: 19, value: 'High energy — handles complexity well', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 18, value: 'At market — satisfied', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 18, value: 'Schedule satisfaction 96%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 18, value: 'Top recognition recipient — 6 in 90 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 18, value: 'Float Pool lead candidate — high growth', icon: 'trending' },
    topRisks: ['Top performer — Float Pool lead role available'],
    recommendedAction: 'Assign Float Pool leadership role',
    scoreHistory: [88, 89, 89, 90, 90, 90, 91, 91, 91, 91, 91, 91],
    interventions: [{ id: 'int-016-a', type: 'growth', label: 'Assign Float Pool Lead Role', description: 'Leverage ICU expertise in Float Pool leadership — strategic retention', estimatedCostLabel: '$2/hr lead diff', scoreLift: 3, timeToImpact: 'Next schedule' }],
  },
  {
    id: 'staff-017', name: 'David Kim', role: 'RN', unit: 'Oncology', tenureMonths: 96,
    retentionScore: 86, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 52000,
    workload:    { label: 'Workload',      score: 17, value: 'Consistent — sustainable', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 17, value: 'Above market — recent adjustment', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 17, value: 'Preferences met 90%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 18, value: '3 recognitions last 90 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 17, value: '8yr Oncology expertise — mentor candidate', icon: 'trending' },
    topRisks: ['8-year Oncology veteran — formal mentor role needed for succession'],
    recommendedAction: 'Assign formal mentor role',
    scoreHistory: [84, 84, 85, 85, 85, 85, 86, 86, 86, 86, 86, 86],
    interventions: [{ id: 'int-017-a', type: 'growth', label: 'Assign Formal Mentor Role', description: 'Pair with 2 new ONC nurses — preserve institutional knowledge', estimatedCostLabel: '$1/hr diff', scoreLift: 2, timeToImpact: 'Immediate' }],
  },
  {
    id: 'staff-018', name: 'Nicole Brown', role: 'RN', unit: 'Telemetry', tenureMonths: 60,
    retentionScore: 79, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 44000,
    workload:    { label: 'Workload',      score: 16, value: 'Balanced — engaged on floor', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 15, value: 'Slightly below market ($1.40/hr)', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 16, value: 'Schedule satisfaction 88%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 16, value: '2 recognitions last 30 days', icon: 'star' },
    growth:      { label: 'Career Growth',score: 16, value: 'Steady — charge preparation beginning', icon: 'trending' },
    topRisks: ['Strong unit culture contributor — maintain engagement'],
    recommendedAction: 'Maintain current engagement pace',
    scoreHistory: [78, 78, 78, 79, 79, 79, 79, 79, 79, 79, 79, 79],
    interventions: [{ id: 'int-018-a', type: 'recognition', label: 'Schedule Appreciation Recognition', description: 'Recognize 5-year contribution — team culture anchor', estimatedCostLabel: '$150 award', scoreLift: 2, timeToImpact: 'This week' }],
  },
  {
    id: 'staff-019', name: 'Luis Rodriguez', role: 'RN', unit: 'MS-A', tenureMonths: 144,
    retentionScore: 82, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 54000,
    workload:    { label: 'Workload',      score: 17, value: 'Expert pace — experienced self-manager', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 16, value: 'At market — satisfied with comp', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 16, value: 'Preferences met 91%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 17, value: '12-yr recognized — senior contributor', icon: 'star' },
    growth:      { label: 'Career Growth',score: 16, value: '12-year career — mentor and succession needed', icon: 'trending' },
    topRisks: ['12-year tenure — succession planning conversation needed'],
    recommendedAction: 'Succession planning discussion',
    scoreHistory: [80, 80, 80, 81, 81, 81, 82, 82, 82, 82, 82, 82],
    interventions: [{ id: 'int-019-a', type: 'growth', label: 'Schedule Succession Planning', description: 'Discuss 5-year career path — leverage 12yr expertise for hospital', estimatedCostLabel: 'No cost', scoreLift: 2, timeToImpact: 'This month' }],
  },
  {
    id: 'staff-020', name: 'Sarah Mitchell', role: 'RN', unit: 'CCU', tenureMonths: 108,
    retentionScore: 94, riskLevel: 'stable', flaggedThisWeek: false, replacementCost: 56000,
    workload:    { label: 'Workload',      score: 19, value: 'Outstanding — thriving at high complexity', icon: 'clock' },
    payEquity:   { label: 'Pay Equity',   score: 19, value: 'Top-of-range compensation — satisfied', icon: 'dollar' },
    schedule:    { label: 'Schedule Fit', score: 19, value: 'Preferences met 98%', icon: 'calendar' },
    recognition: { label: 'Recognition',  score: 18, value: '7 recognitions last 90 days — top unit', icon: 'star' },
    growth:      { label: 'Career Growth',score: 19, value: 'CCU charge lead — growing into leadership', icon: 'trending' },
    topRisks: ['Top performer — competitive market recruitment risk'],
    recommendedAction: 'Executive recognition meeting',
    scoreHistory: [92, 92, 93, 93, 93, 94, 94, 94, 94, 94, 94, 94],
    interventions: [{ id: 'int-020-a', type: 'recognition', label: 'Schedule Executive Recognition', description: 'CNO-level recognition — reinforce commitment to top performers', estimatedCostLabel: '$1,000 award', scoreLift: 2, timeToImpact: 'This month' }],
  },
]

// ── Unit summaries ─────────────────────────────────────────────────────────────
const UNIT_SUMMARIES: UnitRetentionSummary[] = [
  { unit: 'ICU',       label: 'Intensive Care Unit',    abbr: 'ICU',  avgScore: 72, staffCount: 8,  criticalCount: 1, highCount: 1, moderateCount: 2, stableCount: 4, trend: 'declining',  color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  { unit: 'CCU',       label: 'Cardiac Care Unit',      abbr: 'CCU',  avgScore: 86, staffCount: 6,  criticalCount: 0, highCount: 1, moderateCount: 0, stableCount: 5, trend: 'stable',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { unit: 'MS-A',      label: 'Med-Surg A',             abbr: 'MS-A', avgScore: 77, staffCount: 8,  criticalCount: 0, highCount: 1, moderateCount: 2, stableCount: 5, trend: 'improving',  color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  { unit: 'MS-B',      label: 'Med-Surg B',             abbr: 'MS-B', avgScore: 69, staffCount: 7,  criticalCount: 0, highCount: 2, moderateCount: 1, stableCount: 4, trend: 'declining',  color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  { unit: 'Oncology',  label: 'Oncology',               abbr: 'ONC',  avgScore: 78, staffCount: 6,  criticalCount: 0, highCount: 1, moderateCount: 0, stableCount: 5, trend: 'stable',     color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  { unit: 'Telemetry', label: 'Telemetry',              abbr: 'TEL',  avgScore: 81, staffCount: 5,  criticalCount: 0, highCount: 0, moderateCount: 1, stableCount: 4, trend: 'improving',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  { unit: 'ED',        label: 'Emergency Department',   abbr: 'ED',   avgScore: 63, staffCount: 10, criticalCount: 1, highCount: 1, moderateCount: 1, stableCount: 7, trend: 'declining',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
]

// ── Accessors ──────────────────────────────────────────────────────────────────
export function getStaff(): StaffRetention[] { return STAFF_DATA }

export function getStaffById(id: string): StaffRetention | undefined {
  return STAFF_DATA.find(s => s.id === id)
}

export function getUnitSummaries(): UnitRetentionSummary[] { return UNIT_SUMMARIES }

export function getHospitalSummary(): HospitalRetentionSummary {
  const atRisk = STAFF_DATA.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
  const projectedCost = atRisk.reduce((sum, s) => sum + s.replacementCost, 0)
  const flagged = STAFF_DATA.filter(s => s.flaggedThisWeek).length
  return {
    avgScore: 74,
    atRiskCount: atRisk.length,
    projectedCost,
    flaggedThisWeek: flagged,
    totalStaff: 50,
  }
}
