// ── Patient Experience & HCAHPS Intelligence ────────────────────────────────

export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry'
export type ActionStatus = 'open' | 'in-progress' | 'complete'
export type ActionType = 'staffing' | 'training' | 'process' | 'recognition' | 'rounding'

export interface HcahpsDomain {
  id:         string
  label:      string
  shortLabel: string
  score:      number   // 0-100 (top-box %)
  benchmark:  number   // national average
  prev:       number   // prior quarter
  weight:     number   // CMS composite weight
  description:string
  impactUnits: UnitKey[]
}

export interface UnitExperience {
  unit:         UnitKey
  color:        string
  bgLight:      string
  borderColor:  string
  composite:    number
  trend:        number[]  // 12 months
  responseRate: number    // survey response rate %
  surveys:      number    // surveys received this quarter
  floatRatio:   number    // % shifts covered by float nurses
  nursesTenure: number    // avg tenure in years
  callOutRate:  number    // call-outs per shift avg
  insights:     string[]
}

export interface StaffingCorrelation {
  id:          string
  finding:     string
  detail:      string
  impact:      string
  units:       UnitKey[]
  severity:    'critical' | 'warning' | 'positive'
  dataPoints:  number
  revenueImpact: string
}

export interface ActionItem {
  id:          string
  title:       string
  detail:      string
  type:        ActionType
  unit?:       UnitKey
  owner:       string
  dueDate:     string
  status:      ActionStatus
  projectedGain: number  // HCAHPS points
  effort:      'low' | 'medium' | 'high'
}

export interface MonthlyScore {
  month:       string
  score:       number
  annotation?: string
}

// ── HCAHPS Domains ────────────────────────────────────────────────────────────

export const HCAHPS_DOMAINS: HcahpsDomain[] = [
  { id:'nurse-comm',   label:'Nurse Communication',         shortLabel:'Nurse Comm.',   score:76, benchmark:81, prev:79, weight:0.22,
    description:'Nurses always explained things clearly, listened carefully, and treated patients with courtesy and respect.',
    impactUnits:['MS-A','Telemetry','MS-B'] },
  { id:'staff-resp',   label:'Staff Responsiveness',        shortLabel:'Responsiveness', score:62, benchmark:69, prev:66, weight:0.12,
    description:'Staff always responded when the call button was pressed within a reasonable time.',
    impactUnits:['MS-A','Telemetry','ED'] },
  { id:'med-comm',     label:'Communication About Medicines', shortLabel:'Med. Comm.',   score:68, benchmark:65, prev:65, weight:0.15,
    description:'Staff always explained what new medicines were for and potential side effects.',
    impactUnits:['ICU','Oncology'] },
  { id:'pain-mgmt',    label:'Pain Management',             shortLabel:'Pain Mgmt.',    score:71, benchmark:74, prev:70, weight:0.12,
    description:'Staff always did everything they could to help with pain and always controlled pain well.',
    impactUnits:['Oncology','CCU'] },
  { id:'discharge',    label:'Discharge Information',       shortLabel:'Discharge',     score:83, benchmark:86, prev:82, weight:0.10,
    description:'Patients received written information about what to do after discharge; staff explained symptoms.',
    impactUnits:['MS-A','MS-B','ED'] },
  { id:'care-trans',   label:'Care Transitions',            shortLabel:'Transitions',   score:48, benchmark:52, prev:51, weight:0.12,
    description:'Staff clearly explained responsibilities after discharge, understood purpose of medicines.',
    impactUnits:['ED','Telemetry','MS-B'] },
  { id:'environment',  label:'Cleanliness & Quietness',     shortLabel:'Environment',   score:74, benchmark:72, prev:73, weight:0.08,
    description:'Room and bathroom were always clean; area was always quiet at night.',
    impactUnits:['MS-A','MS-B'] },
  { id:'overall',      label:'Overall Hospital Rating',     shortLabel:'Overall (9-10)', score:70, benchmark:73, prev:72, weight:0.09,
    description:'Patients who gave the hospital a rating of 9 or 10 on a 0–10 scale.',
    impactUnits:['MS-A','Telemetry','ED'] },
]

// ── Unit Scores ───────────────────────────────────────────────────────────────

export const UNIT_EXPERIENCE: UnitExperience[] = [
  { unit:'Oncology',  color:'from-violet-500 to-violet-700', bgLight:'bg-violet-50', borderColor:'border-violet-200',
    composite:85, responseRate:42, surveys:38, floatRatio:8, nursesTenure:4.2, callOutRate:0.4,
    trend:[80,81,82,83,83,84,85,84,85,86,85,85],
    insights:['Highest composite in hospital','Long-tenured team drives consistency','Low float ratio protects continuity'] },
  { unit:'ICU',       color:'from-sky-500 to-sky-700', bgLight:'bg-sky-50', borderColor:'border-sky-200',
    composite:82, responseRate:28, surveys:22, floatRatio:12, nursesTenure:3.8, callOutRate:0.5,
    trend:[79,80,80,81,82,82,83,82,83,82,82,82],
    insights:['Strong med communication scores','Low census makes 1:2 ratio achievable','Response rate limited by sedated patients'] },
  { unit:'CCU',       color:'from-indigo-500 to-indigo-700', bgLight:'bg-indigo-50', borderColor:'border-indigo-200',
    composite:78, responseRate:31, surveys:24, floatRatio:15, nursesTenure:3.1, callOutRate:0.6,
    trend:[75,76,77,76,78,78,79,78,79,78,78,78],
    insights:['Above benchmark on pain management','Declining tenure trend to watch','Float ratio rising this quarter'] },
  { unit:'MS-B',      color:'from-teal-500 to-teal-700', bgLight:'bg-teal-50', borderColor:'border-teal-200',
    composite:74, responseRate:38, surveys:52, floatRatio:22, nursesTenure:2.9, callOutRate:0.7,
    trend:[73,74,74,75,74,75,75,74,74,74,74,74],
    insights:['Stable but stagnant — 12mo plateau','Float ratio creeping up','Discharge communication gap'] },
  { unit:'Telemetry', color:'from-pink-500 to-pink-700', bgLight:'bg-pink-50', borderColor:'border-pink-200',
    composite:70, responseRate:35, surveys:48, floatRatio:28, nursesTenure:2.4, callOutRate:0.9,
    trend:[74,73,72,72,71,71,70,70,70,71,70,70],
    insights:['Declining 12-month trend 📉','High float ratio correlates with low comm scores','Below matrix staffing drives responsiveness issues'] },
  { unit:'ED',        color:'from-orange-500 to-orange-700', bgLight:'bg-orange-50', borderColor:'border-orange-200',
    composite:68, responseRate:22, surveys:61, floatRatio:18, nursesTenure:2.7, callOutRate:1.1,
    trend:[70,69,68,68,67,68,68,67,68,68,68,68],
    insights:['Lowest response rate — survey fatigue','Throughput & wait times drive perception','Care transition scores critical post-ED'] },
  { unit:'MS-A',      color:'from-emerald-500 to-emerald-700', bgLight:'bg-emerald-50', borderColor:'border-emerald-200',
    composite:66, responseRate:40, surveys:58, floatRatio:38, nursesTenure:2.1, callOutRate:1.2,
    trend:[72,71,70,69,68,68,67,67,66,66,66,66],
    insights:['🔴 Declining 12 months straight','Highest float ratio → lowest comm scores','Staffing instability is root cause'] },
]

// ── 12-Month Hospital Composite ──────────────────────────────────────────────

export const HOSPITAL_TREND: MonthlyScore[] = [
  { month:'Apr',  score:74 },
  { month:'May',  score:74, annotation:'Float surge +12%' },
  { month:'Jun',  score:73 },
  { month:'Jul',  score:72 },
  { month:'Aug',  score:72, annotation:'2 charge RNs left' },
  { month:'Sep',  score:73 },
  { month:'Oct',  score:73 },
  { month:'Nov',  score:72 },
  { month:'Dec',  score:71, annotation:'Holiday call-outs peak' },
  { month:'Jan',  score:72 },
  { month:'Feb',  score:73 },
  { month:'Mar',  score:74, annotation:'Today' },
]

// ── Staffing Correlations (The AI Magic) ─────────────────────────────────────

export const CORRELATIONS: StaffingCorrelation[] = [
  { id:'corr-001',
    finding:'High float ratio → lower nurse communication',
    detail:'Units averaging >25% float nurse coverage score 9.3 pts lower on Nurse Communication. Float nurses lack unit-specific knowledge and patient rapport that drives top-box responses.',
    impact:'MS-A (38% float) scores 16 pts below Oncology (8% float) on Nurse Comm.',
    units:['MS-A','Telemetry','MS-B'],
    severity:'critical',
    dataPoints:847,
    revenueImpact:'Est. -$184K value-based payment risk' },
  { id:'corr-002',
    finding:'Below-matrix staffing → responsiveness drop',
    detail:'Every shift where Telemetry runs 1 RN below the matrix (17+ pts, 4 RNs), responsiveness scores drop 8.6 pts the following week. Call light response time exceeds 8 min avg vs. 4 min when fully staffed.',
    impact:'Telemetry responsiveness: 62 when understaffed vs. 71 when at matrix',
    units:['Telemetry','MS-A'],
    severity:'critical',
    dataPoints:312,
    revenueImpact:'Est. -$96K in value-based payments' },
  { id:'corr-003',
    finding:'Nurse tenure >2yr correlates with +4.1 composite pts',
    detail:'Analysis of 3,200 surveys shows composite scores are consistently 4.1 pts higher for patients cared for primarily by nurses with 2+ years on that specific unit. Unit-specific experience matters more than total nursing experience.',
    impact:'Oncology avg tenure 4.2yr → 85 composite. MS-A avg 2.1yr → 66 composite.',
    units:['Oncology','ICU','CCU'],
    severity:'positive',
    dataPoints:3200,
    revenueImpact:'Est. +$220K in value-based payments if maintained' },
  { id:'corr-004',
    finding:'High overtime → next-shift communication scores drop',
    detail:'When nurses work >4hrs of OT in a shift, their subsequent shift communication scores (patient-reported) are 6.2 pts lower. Fatigue directly impacts patient interactions measured in HCAHPS.',
    impact:'3 nurses currently averaging >16 OT hrs/week — risk to communication scores',
    units:['MS-A','Telemetry'],
    severity:'warning',
    dataPoints:618,
    revenueImpact:'Est. -$48K score degradation if OT continues' },
  { id:'corr-005',
    finding:'Call-out rate >0.8/shift predicts score decline',
    detail:'Units with call-out rates exceeding 0.8 per shift show composite score declines averaging 1.8 pts/quarter. ED (1.1/shift) and MS-A (1.2/shift) are above threshold. The disruption to care continuity compounds over time.',
    impact:'MS-A call-out rate 1.2 → projected -3.6 pts next quarter if unaddressed',
    units:['ED','MS-A'],
    severity:'warning',
    dataPoints:1104,
    revenueImpact:'Est. -$72K over 3 quarters' },
]

// ── Action Items ──────────────────────────────────────────────────────────────

let _actions: ActionItem[] = [
  { id:'act-001', title:'Reduce MS-A float ratio to <20%',
    detail:'Replace 3 recurring float assignments with unit-dedicated per-diem staff. Projected: +4-6 HCAHPS pts in Nurse Communication within 2 quarters.',
    type:'staffing', unit:'MS-A', owner:'Janet Morrison, RN', dueDate:'Apr 15',
    status:'open', projectedGain:5.2, effort:'high' },
  { id:'act-002', title:'Staff Telemetry to matrix every shift',
    detail:'Ensure 5 RNs on all Telemetry shifts with 17+ patients. Pull from float pool or post to marketplace proactively. Current -1 RN gaps are directly driving responsiveness score decline.',
    type:'staffing', unit:'Telemetry', owner:'Janet Morrison, RN', dueDate:'Mar 20',
    status:'in-progress', projectedGain:8.6, effort:'medium' },
  { id:'act-003', title:'Launch call-light responsiveness huddle in MS-A',
    detail:'10-min daily huddle at shift start focused on call-light response times. Goal: <5 min avg. Track in real-time, post unit scorecard visible to all staff.',
    type:'rounding', unit:'MS-A', owner:'Charge RN – MS-A', dueDate:'Mar 18',
    status:'open', projectedGain:3.8, effort:'low' },
  { id:'act-004', title:'Implement bedside shift report in Telemetry & MS-A',
    detail:'Move shift handoff to bedside with patient participation. Evidence shows 6-8 pt improvement in Nurse Communication and Care Transitions domains. Pilot 2-week trial.',
    type:'process', unit:'Telemetry', owner:'CNO – Dr. Williams', dueDate:'Apr 1',
    status:'open', projectedGain:6.5, effort:'medium' },
  { id:'act-005', title:'OT cap: 16hr/week max for MS-A, Telemetry RNs',
    detail:'Enforce 16hr OT cap via Safe Hours monitoring. Fatigue-driven communication decline is measurable in HCAHPS data. 6 nurses currently above threshold.',
    type:'staffing', owner:'Janet Morrison, RN', dueDate:'Mar 15',
    status:'complete', projectedGain:4.0, effort:'low' },
  { id:'act-006', title:'Peer recognition program — Oncology model',
    detail:'Export Oncology\'s DAISY nomination culture to MS-B and Telemetry. Recognized nurses score 5.2 pts higher avg on patient communication. Replicate monthly shoutout system.',
    type:'recognition', owner:'Education Dept.', dueDate:'Apr 1',
    status:'in-progress', projectedGain:2.8, effort:'low' },
]

// ── Selectors ─────────────────────────────────────────────────────────────────

export function getCompositeScore(): number {
  const weighted = HCAHPS_DOMAINS.reduce((sum, d) => sum + d.score * d.weight, 0)
  const totalWeight = HCAHPS_DOMAINS.reduce((sum, d) => sum + d.weight, 0)
  return Math.round(weighted / totalWeight * 10) / 10
}

export function getHospitalTrend() { return HOSPITAL_TREND }
export function getDomains()       { return HCAHPS_DOMAINS }
export function getUnitScores()    { return UNIT_EXPERIENCE }
export function getCorrelations()  { return CORRELATIONS }
export function getActions()       { return [..._actions] }

export function getNationalComposite(): number {
  const weighted = HCAHPS_DOMAINS.reduce((sum, d) => sum + d.benchmark * d.weight, 0)
  const totalWeight = HCAHPS_DOMAINS.reduce((sum, d) => sum + d.weight, 0)
  return Math.round(weighted / totalWeight * 10) / 10
}

export function getScorePercentile(score: number): number {
  // Simplified percentile mapping based on CMS distributions
  if (score >= 85) return 90
  if (score >= 82) return 80
  if (score >= 79) return 70
  if (score >= 76) return 60
  if (score >= 73) return 50
  if (score >= 70) return 40
  if (score >= 67) return 30
  return 20
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function updateActionStatus(id: string, status: ActionStatus): void {
  const a = _actions.find(a => a.id === id)
  if (a) a.status = status
}

export function addAction(data: Omit<ActionItem, 'id' | 'status'>): ActionItem {
  const a: ActionItem = { ...data, id: `act-${Date.now()}`, status: 'open' }
  _actions.push(a)
  return a
}
