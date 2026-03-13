// acuityData.ts — Patient Acuity & Dynamic Staffing Intelligence
// Reference: Day Shift, March 13 2026
//
// NURSING CARE HOURS MODEL (per patient per 12h shift):
//   Acuity 1 — Stable:   2.5h  (routine care, stable vitals)
//   Acuity 2 — Moderate: 4.0h  (frequent assessment, some complexity)
//   Acuity 3 — Complex:  6.0h  (high-frequency monitoring, multi-system)
//   Acuity 4 — Critical: 9.0h  (1:1 attention, active interventions)
//
// FTE needed = total_care_hours / 12h shift

export type AcuityLevel = 1 | 2 | 3 | 4
export type UnitId = 'ICU' | 'CCU' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry' | 'ED'
export type DiagCategory = 'cardiac' | 'surgical' | 'respiratory' | 'neuro' | 'sepsis' | 'oncology' | 'trauma' | 'medical' | 'ortho'
export type ActionType = 'float-in' | 'release-early' | 'marketplace' | 'overtime' | 'monitor' | 'float-out'

export interface AcuityPatient {
  bedId: string
  acuity: AcuityLevel
  diagCategory: DiagCategory
  diagLabel: string          // brief, anonymized description
  admitShiftsAgo: number    // how many 12h shifts since admission
  dischargeReady: boolean
  isolationPrecautions: boolean
}

export interface AcuityRecommendation {
  id: string
  unitId: UnitId
  type: ActionType
  priority: 'critical' | 'high' | 'normal'
  title: string
  detail: string
  savingsDollars: number     // positive = savings, 0 = cost avoidance / quality
  qualityRisk: boolean
  executed: boolean
  fromUnit?: UnitId          // for float-in/out
}

export interface UnitAcuityData {
  id: UnitId
  label: string
  abbr: string
  color: string              // tailwind text class
  bgLight: string
  border: string
  baseRatio: string          // e.g. '1:2'
  fteOnFloor: number
  census: number
  capacity: number
  patients: AcuityPatient[]
  trendScores: number[]      // 7 shifts, oldest → newest (avg acuity per shift)
}

// ── Acuity metadata ──────────────────────────────────────────────────────────

export const ACUITY_META: Record<AcuityLevel, {
  label: string; short: string; color: string; bg: string; border: string;
  dot: string; careHours: number; description: string
}> = {
  1: { label: 'Stable',   short: '1', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-500', careHours: 2.5,  description: 'Stable vitals, routine care, may be discharge-ready' },
  2: { label: 'Moderate', short: '2', color: 'text-sky-700',     bg: 'bg-sky-100',     border: 'border-sky-300',     dot: 'bg-sky-500',     careHours: 4.0,  description: 'Frequent monitoring, some complexity, moderate interventions' },
  3: { label: 'Complex',  short: '3', color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-300',   dot: 'bg-amber-500',   careHours: 6.0,  description: 'Multi-system involvement, high-frequency assessment' },
  4: { label: 'Critical', short: '4', color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300',     dot: 'bg-red-500',     careHours: 9.0,  description: 'Continuous monitoring, active interventions, 1:1 attention' },
}

// ── Patient data per unit ────────────────────────────────────────────────────

const ICU_PATIENTS: AcuityPatient[] = [
  { bedId: 'ICU-1',  acuity: 4, diagCategory: 'surgical',    diagLabel: 'Post-CABG day 1',         admitShiftsAgo: 2,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-2',  acuity: 4, diagCategory: 'respiratory', diagLabel: 'ARDS on ventilator',       admitShiftsAgo: 6,  dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ICU-3',  acuity: 4, diagCategory: 'sepsis',      diagLabel: 'Septic shock, pressors',   admitShiftsAgo: 3,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-4',  acuity: 3, diagCategory: 'cardiac',     diagLabel: 'Post-cath, monitoring',    admitShiftsAgo: 1,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-5',  acuity: 3, diagCategory: 'neuro',       diagLabel: 'CVA, neuro checks q1h',    admitShiftsAgo: 4,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-6',  acuity: 4, diagCategory: 'sepsis',      diagLabel: 'Multi-organ failure',      admitShiftsAgo: 8,  dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ICU-7',  acuity: 3, diagCategory: 'surgical',    diagLabel: 'Post-liver resection',     admitShiftsAgo: 2,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-8',  acuity: 3, diagCategory: 'respiratory', diagLabel: 'Intubated, weaning',       admitShiftsAgo: 5,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-9',  acuity: 2, diagCategory: 'cardiac',     diagLabel: 'Heart failure, diuresing', admitShiftsAgo: 3,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-10', acuity: 3, diagCategory: 'neuro',       diagLabel: 'Intracranial bleed',       admitShiftsAgo: 10, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-11', acuity: 2, diagCategory: 'respiratory', diagLabel: 'Pneumonia, hypoxia',       admitShiftsAgo: 4,  dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ICU-12', acuity: 3, diagCategory: 'sepsis',      diagLabel: 'SIRS, blood cultures',     admitShiftsAgo: 1,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-13', acuity: 2, diagCategory: 'cardiac',     diagLabel: 'STEMI recovery',           admitShiftsAgo: 6,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ICU-14', acuity: 1, diagCategory: 'medical',     diagLabel: 'Step-down candidate',      admitShiftsAgo: 12, dischargeReady: true,  isolationPrecautions: false },
]
// ICU care hours: 4×9 + 7×6 + 3×4 + 1×2.5 = 36+42+12+2.5 = 92.5h → 7.7 FTE needed, 7 on floor

const CCU_PATIENTS: AcuityPatient[] = [
  { bedId: 'CCU-1', acuity: 3, diagCategory: 'cardiac',     diagLabel: 'NSTEMI, continuous drip',   admitShiftsAgo: 2,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-2', acuity: 3, diagCategory: 'cardiac',     diagLabel: 'CHF exacerbation',           admitShiftsAgo: 5,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-3', acuity: 4, diagCategory: 'cardiac',     diagLabel: 'Cardiogenic shock',          admitShiftsAgo: 1,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-4', acuity: 2, diagCategory: 'cardiac',     diagLabel: 'A-fib, rate control',        admitShiftsAgo: 3,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-5', acuity: 3, diagCategory: 'cardiac',     diagLabel: 'Post-EP study',              admitShiftsAgo: 1,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-6', acuity: 2, diagCategory: 'cardiac',     diagLabel: 'Chest pain rule-out',        admitShiftsAgo: 2,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-7', acuity: 2, diagCategory: 'cardiac',     diagLabel: 'VT, ICD check',              admitShiftsAgo: 4,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-8', acuity: 1, diagCategory: 'cardiac',     diagLabel: 'Post-pacemaker, stable',     admitShiftsAgo: 8,  dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'CCU-9', acuity: 3, diagCategory: 'cardiac',     diagLabel: 'Aortic dissection',          admitShiftsAgo: 3,  dischargeReady: false, isolationPrecautions: false },
  { bedId: 'CCU-10',acuity: 1, diagCategory: 'cardiac',     diagLabel: 'Transfer ready to floor',    admitShiftsAgo: 14, dischargeReady: true,  isolationPrecautions: false },
]
// CCU care hours: 1×9 + 5×6 + 3×4 + 2×2.5 = 9+30+12+5 = 56h → 4.7 FTE needed, 5 on floor (slightly over)

const MSA_PATIENTS: AcuityPatient[] = [
  { bedId: 'MSA-1', acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-hip replacement day 3', admitShiftsAgo: 6, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-2', acuity: 2, diagCategory: 'medical', diagLabel: 'UTI, IV antibiotics',         admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-3', acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-knee repair day 2',      admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-4', acuity: 2, diagCategory: 'medical', diagLabel: 'Cellulitis, wound care',      admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-5', acuity: 1, diagCategory: 'medical', diagLabel: 'Anemia, transfusion done',    admitShiftsAgo: 5, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-6', acuity: 2, diagCategory: 'surgical',diagLabel: 'Post-appy day 2, ambulating', admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-7', acuity: 1, diagCategory: 'medical', diagLabel: 'Dehydration, oral tolerated', admitShiftsAgo: 3, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-8', acuity: 2, diagCategory: 'medical', diagLabel: 'Constipation, bowel prep',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-9', acuity: 3, diagCategory: 'medical', diagLabel: 'GI bleed, hemoglobin check',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-10',acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-shoulder day 1, stable', admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-11',acuity: 2, diagCategory: 'medical', diagLabel: 'Chest wall pain, ruled out',  admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-12',acuity: 1, diagCategory: 'medical', diagLabel: 'Post-endoscopy, stable',      admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-13',acuity: 2, diagCategory: 'surgical',diagLabel: 'Post-hernia day 1',           admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-14',acuity: 1, diagCategory: 'medical', diagLabel: 'Mild asthma exacerbation',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-15',acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-wrist fix, stable',      admitShiftsAgo: 3, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-16',acuity: 2, diagCategory: 'medical', diagLabel: 'Diabetes, insulin drip done', admitShiftsAgo: 5, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-17',acuity: 1, diagCategory: 'medical', diagLabel: 'Low-back pain, PT today',     admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-18',acuity: 2, diagCategory: 'surgical',diagLabel: 'Bowel resection day 3',       admitShiftsAgo: 6, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-19',acuity: 1, diagCategory: 'medical', diagLabel: 'Pancreatitis, improving',     admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-20',acuity: 2, diagCategory: 'medical', diagLabel: 'Hypertensive urgency, BP ctl',admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-21',acuity: 1, diagCategory: 'medical', diagLabel: 'Mild syncope, telemetry done',admitShiftsAgo: 3, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-22',acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-ankle ORIF stable',      admitShiftsAgo: 5, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-23',acuity: 2, diagCategory: 'medical', diagLabel: 'Pneumonia, improving',        admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-24',acuity: 1, diagCategory: 'surgical',diagLabel: 'Post-lap chole day 2',        admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-25',acuity: 2, diagCategory: 'medical', diagLabel: 'AKI, improving UO',           admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-26',acuity: 1, diagCategory: 'ortho',   diagLabel: 'Spinal fusion day 4, PT OK',  admitShiftsAgo: 8, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSA-27',acuity: 1, diagCategory: 'medical', diagLabel: 'Social admit, awaiting SNF',  admitShiftsAgo: 10,dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSA-28',acuity: 2, diagCategory: 'medical', diagLabel: 'TIA work-up, stable',         admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
]
// MS-A care hours: 0×9 + 1×6 + 12×4 + 15×2.5 = 0+6+48+37.5 = 91.5h → 7.6 FTE needed, 8 on floor (over by 0.4)
// After discharge-ready patients leave: ~24 patients → 6.1 FTE needed

const MSB_PATIENTS: AcuityPatient[] = [
  { bedId: 'MSB-1', acuity: 3, diagCategory: 'medical', diagLabel: 'COPD exacerbation, bipap',   admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-2', acuity: 2, diagCategory: 'medical', diagLabel: 'Pneumonia, IV abx day 2',    admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-3', acuity: 2, diagCategory: 'ortho',   diagLabel: 'Femur fracture post-op',     admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-4', acuity: 3, diagCategory: 'medical', diagLabel: 'DKA resolving, sliding scale',admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-5', acuity: 2, diagCategory: 'medical', diagLabel: 'CHF, daily weights, diuresing',admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-6', acuity: 1, diagCategory: 'ortho',   diagLabel: 'Post-knee, discharge today', admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSB-7', acuity: 2, diagCategory: 'medical', diagLabel: 'Cellulitis, oral abx now',   admitShiftsAgo: 5, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-8', acuity: 3, diagCategory: 'neuro',   diagLabel: 'TIA with neuro symptoms',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-9', acuity: 2, diagCategory: 'surgical',diagLabel: 'Bowel perf post-op day 2',   admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'MSB-10',acuity: 2, diagCategory: 'medical', diagLabel: 'Chest pain, troponin neg',   admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-11',acuity: 1, diagCategory: 'medical', diagLabel: 'UTI, oral antibiotics',      admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-12',acuity: 2, diagCategory: 'medical', diagLabel: 'Syncope work-up, stable',    admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-13',acuity: 3, diagCategory: 'respiratory',diagLabel:'Asthma severe, Mg sulfate', admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-14',acuity: 2, diagCategory: 'medical', diagLabel: 'Anemia, post-transfusion',   admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-15',acuity: 1, diagCategory: 'ortho',   diagLabel: 'Wrist fx, pain controlled',  admitShiftsAgo: 6, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSB-16',acuity: 2, diagCategory: 'medical', diagLabel: 'Hypertension, IV meds',      admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-17',acuity: 3, diagCategory: 'medical', diagLabel: 'GI bleed, NPO',              admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-18',acuity: 2, diagCategory: 'medical', diagLabel: 'Abdominal pain, imaging',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-19',acuity: 2, diagCategory: 'surgical',diagLabel: 'Hernia repair day 1',        admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-20',acuity: 1, diagCategory: 'medical', diagLabel: 'Mild dehydration, oral',     admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSB-21',acuity: 2, diagCategory: 'medical', diagLabel: 'Atrial fib, rate control',   admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-22',acuity: 2, diagCategory: 'ortho',   diagLabel: 'Spinal steno, pain mgmt',    admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-23',acuity: 1, diagCategory: 'medical', diagLabel: 'Post-procedure, stable',     admitShiftsAgo: 5, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'MSB-24',acuity: 2, diagCategory: 'medical', diagLabel: 'Diabetes type 1, stabilizing',admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-25',acuity: 3, diagCategory: 'neuro',   diagLabel: 'Stroke w/ deficits',         admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-26',acuity: 2, diagCategory: 'medical', diagLabel: 'Renal failure, HD today',    admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'MSB-27',acuity: 1, diagCategory: 'medical', diagLabel: 'Electrolyte imbalance, OK',  admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
]
// MS-B: 0×9 + 7×6 + 13×4 + 7×2.5 = 0+42+52+17.5 = 111.5h → 9.3 FTE needed, 6 on floor — showing as critical

const ONC_PATIENTS: AcuityPatient[] = [
  { bedId: 'ONC-1', acuity: 3, diagCategory: 'oncology', diagLabel: 'Chemo day 2, nausea mgmt',   admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ONC-2', acuity: 2, diagCategory: 'oncology', diagLabel: 'Post-biopsymonitoring',       admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-3', acuity: 3, diagCategory: 'oncology', diagLabel: 'Neutropenic fever, CBC q6h', admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ONC-4', acuity: 2, diagCategory: 'oncology', diagLabel: 'Blood transfusion in progress',admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-5', acuity: 3, diagCategory: 'oncology', diagLabel: 'Chemo cycle 1 day 1',        admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-6', acuity: 1, diagCategory: 'oncology', diagLabel: 'Scheduled chemo, stable',    admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-7', acuity: 2, diagCategory: 'oncology', diagLabel: 'Pain mgmt, oral meds',       admitShiftsAgo: 5, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-8', acuity: 2, diagCategory: 'oncology', diagLabel: 'Port flush, monitoring',     admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-9', acuity: 3, diagCategory: 'oncology', diagLabel: 'Tumor lysis monitoring',     admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-10',acuity: 2, diagCategory: 'oncology', diagLabel: 'Post-radiation monitoring',  admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-11',acuity: 1, diagCategory: 'oncology', diagLabel: 'Oral chemo, education',      admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'ONC-12',acuity: 3, diagCategory: 'oncology', diagLabel: 'Bone marrow transplant day 3',admitShiftsAgo: 6, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ONC-13',acuity: 2, diagCategory: 'oncology', diagLabel: 'Hypercalcemia, IV fluids',   admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-14',acuity: 4, diagCategory: 'oncology', diagLabel: 'Septic shock, oncology pt',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ONC-15',acuity: 2, diagCategory: 'oncology', diagLabel: 'Immunotherapy, monitoring',  admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-16',acuity: 1, diagCategory: 'oncology', diagLabel: 'Platelet transfusion done',  admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ONC-17',acuity: 2, diagCategory: 'oncology', diagLabel: 'Mucositis, pain control',    admitShiftsAgo: 4, dischargeReady: false, isolationPrecautions: true  },
  { bedId: 'ONC-18',acuity: 3, diagCategory: 'oncology', diagLabel: 'PICC line infection suspect', admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
]
// ONC care hours: 1×9 + 7×6 + 7×4 + 3×2.5 = 9+42+28+7.5 = 86.5h → 7.2 FTE needed, 6 on floor (under by 1.2)

const TEL_PATIENTS: AcuityPatient[] = [
  { bedId: 'TEL-1', acuity: 2, diagCategory: 'cardiac', diagLabel: 'Monitored a-fib, stable',   admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-2', acuity: 2, diagCategory: 'cardiac', diagLabel: 'SVT, rate controlled',       admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-3', acuity: 1, diagCategory: 'cardiac', diagLabel: 'Post-ablation, stable',      admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'TEL-4', acuity: 3, diagCategory: 'cardiac', diagLabel: 'NSTEMI, heparin drip',       admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-5', acuity: 2, diagCategory: 'cardiac', diagLabel: 'Chest pain, serial EKGs',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-6', acuity: 1, diagCategory: 'cardiac', diagLabel: 'Bradycardia, monitoring',    admitShiftsAgo: 5, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-7', acuity: 2, diagCategory: 'cardiac', diagLabel: 'PVC burden, eval',           admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-8', acuity: 2, diagCategory: 'cardiac', diagLabel: 'Syncope, ruled out cardiac', admitShiftsAgo: 3, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'TEL-9', acuity: 1, diagCategory: 'cardiac', diagLabel: 'Palpitations, holter done',  admitShiftsAgo: 4, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'TEL-10',acuity: 2, diagCategory: 'cardiac', diagLabel: 'Heart block, pacer eval',    admitShiftsAgo: 2, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-11',acuity: 3, diagCategory: 'cardiac', diagLabel: 'Hypertensive crisis, titr.',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-12',acuity: 1, diagCategory: 'cardiac', diagLabel: 'Benign rhythm, education',   admitShiftsAgo: 6, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'TEL-13',acuity: 2, diagCategory: 'cardiac', diagLabel: 'CHF compensated, stable',    admitShiftsAgo: 3, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-14',acuity: 2, diagCategory: 'cardiac', diagLabel: 'Cardiomyopathy, new dx',     admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'TEL-15',acuity: 1, diagCategory: 'cardiac', diagLabel: 'Pre-cath observation',       admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
]
// TEL care hours: 0×9 + 2×6 + 8×4 + 5×2.5 = 0+12+32+12.5 = 56.5h → 4.7 FTE needed, 5 on floor (slightly over)

const ED_PATIENTS: AcuityPatient[] = [
  { bedId: 'ED-1',  acuity: 4, diagCategory: 'trauma',   diagLabel: 'MVC, multi-trauma bay 1',    admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-2',  acuity: 3, diagCategory: 'medical',  diagLabel: 'Altered mental status',       admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-3',  acuity: 4, diagCategory: 'cardiac',  diagLabel: 'STEMI, cath lab pending',     admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-4',  acuity: 2, diagCategory: 'medical',  diagLabel: 'Abdominal pain, CT pending',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-5',  acuity: 3, diagCategory: 'respiratory',diagLabel:'Respiratory distress, O2',   admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-6',  acuity: 2, diagCategory: 'medical',  diagLabel: 'Chest pain, low risk',        admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-7',  acuity: 3, diagCategory: 'neuro',    diagLabel: 'Stroke code activated',       admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-8',  acuity: 2, diagCategory: 'ortho',    diagLabel: 'Ankle fracture, ortho eval',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-9',  acuity: 1, diagCategory: 'medical',  diagLabel: 'Minor laceration, repair',    admitShiftsAgo: 0, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'ED-10', acuity: 3, diagCategory: 'medical',  diagLabel: 'Sepsis, blood cultures, abx', admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-11', acuity: 2, diagCategory: 'medical',  diagLabel: 'Nausea/vomiting, hydration',  admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-12', acuity: 4, diagCategory: 'trauma',   diagLabel: 'Fall head injury, CT head',   admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-13', acuity: 2, diagCategory: 'medical',  diagLabel: 'UTI, IV abx dose',            admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-14', acuity: 3, diagCategory: 'medical',  diagLabel: 'Diabetic ketoacidosis',       admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-15', acuity: 1, diagCategory: 'medical',  diagLabel: 'Rash assessment, stable',     admitShiftsAgo: 0, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'ED-16', acuity: 2, diagCategory: 'cardiac',  diagLabel: 'Palpitations, monitoring',    admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-17', acuity: 3, diagCategory: 'surgical', diagLabel: 'Acute abdomen, surgery eval', admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-18', acuity: 2, diagCategory: 'ortho',    diagLabel: 'Back pain, imaging',          admitShiftsAgo: 1, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-19', acuity: 1, diagCategory: 'medical',  diagLabel: 'Mild vertigo, stable',        admitShiftsAgo: 0, dischargeReady: true,  isolationPrecautions: false },
  { bedId: 'ED-20', acuity: 3, diagCategory: 'neuro',    diagLabel: 'Severe headache, LP',         admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-21', acuity: 4, diagCategory: 'trauma',   diagLabel: 'Overdose, intubated',         admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
  { bedId: 'ED-22', acuity: 2, diagCategory: 'medical',  diagLabel: 'Hypertensive urgency',        admitShiftsAgo: 0, dischargeReady: false, isolationPrecautions: false },
]
// ED care hours: 4×9 + 8×6 + 7×4 + 3×2.5 = 36+48+28+7.5 = 119.5h → 10.0 FTE needed, 9 on floor (under by 1.0)

// ── Unit data (mutable - acuity can be updated) ──────────────────────────────

const _unitData: UnitAcuityData[] = [
  {
    id: 'ICU', label: 'ICU', abbr: 'ICU',
    color: 'text-violet-700', bgLight: 'bg-violet-50', border: 'border-violet-200',
    baseRatio: '1:2', fteOnFloor: 7, census: 14, capacity: 16,
    patients: ICU_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.8, 2.9, 3.1, 2.7, 3.0, 3.2, 2.9],
  },
  {
    id: 'CCU', label: 'CCU', abbr: 'CCU',
    color: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200',
    baseRatio: '1:2', fteOnFloor: 5, census: 10, capacity: 12,
    patients: CCU_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.4, 2.6, 2.5, 2.7, 2.8, 2.9, 2.8],
  },
  {
    id: 'MS-A', label: 'Med-Surg A', abbr: 'MS-A',
    color: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200',
    baseRatio: '1:4', fteOnFloor: 8, census: 28, capacity: 32,
    patients: MSA_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.2, 1.9, 2.1, 2.0, 1.8, 1.9, 1.8],
  },
  {
    id: 'MS-B', label: 'Med-Surg B', abbr: 'MS-B',
    color: 'text-teal-700', bgLight: 'bg-teal-50', border: 'border-teal-200',
    baseRatio: '1:4', fteOnFloor: 6, census: 27, capacity: 32,
    patients: MSB_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.0, 2.2, 2.1, 2.3, 2.4, 2.5, 2.4],
  },
  {
    id: 'Oncology', label: 'Oncology', abbr: 'ONC',
    color: 'text-rose-700', bgLight: 'bg-rose-50', border: 'border-rose-200',
    baseRatio: '1:3', fteOnFloor: 6, census: 18, capacity: 20,
    patients: ONC_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.5, 2.7, 2.8, 2.6, 2.7, 2.8, 2.9],
  },
  {
    id: 'Telemetry', label: 'Telemetry', abbr: 'TEL',
    color: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200',
    baseRatio: '1:3', fteOnFloor: 5, census: 15, capacity: 18,
    patients: TEL_PATIENTS.map(p => ({ ...p })),
    trendScores: [1.9, 2.0, 2.1, 1.9, 2.0, 1.9, 2.0],
  },
  {
    id: 'ED', label: 'Emergency Dept', abbr: 'ED',
    color: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200',
    baseRatio: '1:4', fteOnFloor: 9, census: 22, capacity: 30,
    patients: ED_PATIENTS.map(p => ({ ...p })),
    trendScores: [2.5, 2.8, 2.6, 3.0, 2.9, 3.1, 3.0],
  },
]

// ── Calculations ─────────────────────────────────────────────────────────────

export function calcFteNeeded(patients: AcuityPatient[]): number {
  const totalHours = patients.reduce((s, p) => s + ACUITY_META[p.acuity].careHours, 0)
  return Math.round((totalHours / 12) * 10) / 10
}

export function calcAvgAcuity(patients: AcuityPatient[]): number {
  if (patients.length === 0) return 0
  return Math.round((patients.reduce((s, p) => s + p.acuity, 0) / patients.length) * 10) / 10
}

export function getAcuityDistribution(patients: AcuityPatient[]): Record<AcuityLevel, number> {
  return {
    1: patients.filter(p => p.acuity === 1).length,
    2: patients.filter(p => p.acuity === 2).length,
    3: patients.filter(p => p.acuity === 3).length,
    4: patients.filter(p => p.acuity === 4).length,
  }
}

export type StaffingStatus = 'critical-under' | 'under' | 'balanced' | 'over' | 'critical-over'

export function getStaffingStatus(fteOnFloor: number, fteNeeded: number): StaffingStatus {
  const gap = fteOnFloor - fteNeeded
  if (gap < -1.5) return 'critical-under'
  if (gap < -0.5) return 'under'
  if (gap > 2.0)  return 'critical-over'
  if (gap > 0.5)  return 'over'
  return 'balanced'
}

export const STATUS_META: Record<StaffingStatus, {
  label: string; color: string; bg: string; border: string; dot: string
}> = {
  'critical-under': { label: 'Critical Short', color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-300',    dot: 'bg-red-500' },
  'under':          { label: 'Short-Staffed',  color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-300',  dot: 'bg-amber-500' },
  'balanced':       { label: 'Balanced',        color: 'text-emerald-700',bg:'bg-emerald-50',border:'border-emerald-300', dot: 'bg-emerald-500' },
  'over':           { label: 'Over-Staffed',    color: 'text-sky-700',   bg: 'bg-sky-50',    border: 'border-sky-300',    dot: 'bg-sky-500' },
  'critical-over':  { label: 'Significantly Over',color:'text-blue-700', bg: 'bg-blue-50',   border: 'border-blue-300',   dot: 'bg-blue-500' },
}

// ── Recommendations (generated) ───────────────────────────────────────────────

const _recommendations: AcuityRecommendation[] = [
  {
    id: 'rec-001', unitId: 'MS-A', type: 'float-out', priority: 'high',
    title: 'Float 1 RN from Med-Surg A → Oncology',
    detail: 'MS-A avg acuity 1.8 — 1.8 FTE excess. Oncology is 1.2 FTE short. Both units benefit.',
    savingsDollars: 0, qualityRisk: false, executed: false, fromUnit: 'MS-A',
  },
  {
    id: 'rec-002', unitId: 'MS-A', type: 'release-early', priority: 'normal',
    title: 'Release 1 RN from Med-Surg A 2 hours early',
    detail: '8 patients discharge-ready today. MS-A needs only 6.1 FTE adjusted. Release at 1 PM.',
    savingsDollars: 119, qualityRisk: false, executed: false,
  },
  {
    id: 'rec-003', unitId: 'MS-B', type: 'overtime', priority: 'critical',
    title: 'Add 1 RN to Med-Surg B (acuity surge)',
    detail: 'Avg acuity jumped to 2.4 with 7 complex/critical patients. Needs 9.3 FTE vs 6 on floor.',
    savingsDollars: 0, qualityRisk: true, executed: false,
  },
  {
    id: 'rec-004', unitId: 'ED', type: 'marketplace', priority: 'high',
    title: 'Post 1 ED gap to Marketplace',
    detail: 'Acuity 3.0 avg with 4 critical patients. ED needs 10.0 FTE, has 9. Post 4-hour fill.',
    savingsDollars: 0, qualityRisk: true, executed: false,
  },
  {
    id: 'rec-005', unitId: 'Oncology', type: 'float-in', priority: 'high',
    title: 'Float 1 Oncology-certified RN from pool',
    detail: 'Oncology 1 critical (septic shock) shifted avg acuity to 2.7. Needs 7.2 FTE, has 6.',
    savingsDollars: 0, qualityRisk: true, executed: false,
  },
  {
    id: 'rec-006', unitId: 'Telemetry', type: 'release-early', priority: 'normal',
    title: 'Early release eligible — Telemetry (3 discharge-ready)',
    detail: 'Telemetry avg acuity 2.0. 3 patients discharge-ready. Needs 4.7 FTE, has 5.',
    savingsDollars: 89, qualityRisk: false, executed: false,
  },
]

// ── Accessors & mutations ─────────────────────────────────────────────────────

export function getUnits(): UnitAcuityData[] {
  return _unitData.map(u => ({ ...u, patients: [...u.patients] }))
}

export function getUnit(id: UnitId): UnitAcuityData | undefined {
  return _unitData.find(u => u.id === id)
}

export function getRecommendations(): AcuityRecommendation[] {
  return [..._recommendations]
}

export function updatePatientAcuity(unitId: UnitId, bedId: string, newAcuity: AcuityLevel): void {
  const unit = _unitData.find(u => u.id === unitId)
  if (!unit) return
  const patient = unit.patients.find(p => p.bedId === bedId)
  if (patient) patient.acuity = newAcuity
}

export function executeRecommendation(recId: string): void {
  const rec = _recommendations.find(r => r.id === recId)
  if (rec) rec.executed = true
}

export interface HospitalSummary {
  totalCensus: number
  totalFteOnFloor: number
  totalFteNeeded: number
  avgAcuity: number
  criticalUnits: number
  underUnits: number
  overUnits: number
  totalSavingsOpportunity: number
  qualityRisks: number
}

export function getHospitalSummary(): HospitalSummary {
  const units = _unitData
  const totalCensus = units.reduce((s, u) => s + u.census, 0)
  const totalFteOnFloor = units.reduce((s, u) => s + u.fteOnFloor, 0)
  const totalFteNeeded = units.reduce((s, u) => s + calcFteNeeded(u.patients), 0)
  const avgAcuity = Math.round((units.reduce((s, u) => s + calcAvgAcuity(u.patients), 0) / units.length) * 10) / 10
  const statuses = units.map(u => getStaffingStatus(u.fteOnFloor, calcFteNeeded(u.patients)))
  const criticalUnits = statuses.filter(s => s === 'critical-under').length
  const underUnits = statuses.filter(s => s === 'under').length
  const overUnits = statuses.filter(s => s === 'over' || s === 'critical-over').length
  const totalSavingsOpportunity = _recommendations.filter(r => !r.executed && r.savingsDollars > 0).reduce((s, r) => s + r.savingsDollars, 0)
  const qualityRisks = _recommendations.filter(r => !r.executed && r.qualityRisk).length
  return { totalCensus, totalFteOnFloor, totalFteNeeded: Math.round(totalFteNeeded * 10) / 10, avgAcuity, criticalUnits, underUnits, overUnits, totalSavingsOpportunity, qualityRisks }
}

export const UNIT_ORDER: UnitId[] = ['ICU', 'CCU', 'MS-A', 'MS-B', 'Oncology', 'Telemetry', 'ED']
export const DIAG_LABELS: Record<DiagCategory, string> = {
  cardiac: 'Cardiac', surgical: 'Surgical', respiratory: 'Respiratory', neuro: 'Neuro',
  sepsis: 'Sepsis', oncology: 'Oncology', trauma: 'Trauma', medical: 'Medical', ortho: 'Ortho',
}
