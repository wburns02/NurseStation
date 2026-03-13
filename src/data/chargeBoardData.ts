// chargeBoardData.ts — Charge Board: Real-Time Patient Assignment
// Reference date: March 12, 2026 — Day Shift 07:00–15:00
// The charge nurse's morning board: who has what, ratio safety, one-click balance

export type AcuityLevel = 1 | 2 | 3 | 4 | 5
export type PatientFlag = 'ISO' | 'FALL' | 'NPO' | 'VENT' | 'DNR' | 'IV' | 'ALLERGY'
export type NurseStatus = 'active' | 'break' | 'called-out'

export interface Patient {
  id: string
  room: string
  lastName: string
  firstName: string
  age: number
  sex: 'M' | 'F'
  diagnosis: string
  acuity: AcuityLevel
  flags: PatientFlag[]
  dayOfStay: number
  attendingMD: string
  note: string
}

export interface BoardNurse {
  id: string
  name: string
  initials: string
  role: 'Charge RN' | 'RN' | 'LPN'
  status: NurseStatus
  hoursWorked: number
}

export interface UnitConfig {
  id: string
  name: string
  shortName: string
  floor: string
  maxRatio: number   // safe patients per nurse
  totalBeds: number
  color: string      // accent color name (tailwind)
}

// ─── Units ──────────────────────────────────────────────────────────────────
export const UNITS: UnitConfig[] = [
  { id: 'icu',      name: 'Intensive Care Unit',  shortName: 'ICU',  floor: '4th Floor',  maxRatio: 2,  totalBeds: 10, color: 'violet'  },
  { id: 'ccu',      name: 'Cardiac Care Unit',    shortName: 'CCU',  floor: '4th Floor',  maxRatio: 2,  totalBeds: 8,  color: 'red'     },
  { id: 'ed',       name: 'Emergency Dept',        shortName: 'ED',   floor: '1st Floor',  maxRatio: 4,  totalBeds: 22, color: 'orange'  },
  { id: 'medsurga', name: 'Med-Surg A',            shortName: 'MS-A', floor: '3rd Floor',  maxRatio: 5,  totalBeds: 22, color: 'blue'    },
  { id: 'medsurgb', name: 'Med-Surg B',            shortName: 'MS-B', floor: '3rd Floor',  maxRatio: 5,  totalBeds: 22, color: 'sky'     },
  { id: 'oncology', name: 'Oncology',              shortName: 'ONC',  floor: '5th Floor',  maxRatio: 4,  totalBeds: 16, color: 'teal'    },
  { id: 'tele',     name: 'Telemetry',             shortName: 'TELE', floor: '2nd Floor',  maxRatio: 4,  totalBeds: 18, color: 'emerald' },
]

// ─── ICU Patients (rich data) ────────────────────────────────────────────────
export const ICU_PATIENTS: Patient[] = [
  {
    id: 'p-icu-01', room: '401A', lastName: 'Chen', firstName: 'Margaret', age: 68, sex: 'F',
    diagnosis: 'Septic shock — Klebsiella BSI', acuity: 5,
    flags: ['ISO', 'IV'], dayOfStay: 3, attendingMD: 'Dr. Patel',
    note: 'Vasopressor dependent. Cultures day 3. Nephrology consult requested.',
  },
  {
    id: 'p-icu-02', room: '401B', lastName: 'Davis', firstName: 'Robert', age: 54, sex: 'M',
    diagnosis: 'Post-CABG Day 2 — 3-vessel disease', acuity: 3,
    flags: ['DNR'], dayOfStay: 2, attendingMD: 'Dr. Rashid',
    note: "Chest tubes removed AM. Family meeting re: code status at 1400. Wife is primary contact.",
  },
  {
    id: 'p-icu-03', room: '402A', lastName: 'Moore', firstName: 'Patricia', age: 72, sex: 'F',
    diagnosis: 'Acute respiratory failure — COPD exacerbation', acuity: 4,
    flags: ['FALL', 'NPO'], dayOfStay: 1, attendingMD: 'Dr. Kowalski',
    note: 'BiPAP 15/5 FiO2 40%. RT q4h. High fall risk — bilateral lower extremity weakness.',
  },
  {
    id: 'p-icu-04', room: '402B', lastName: 'Wilson', firstName: 'James', age: 61, sex: 'M',
    diagnosis: 'Diabetic ketoacidosis — insulin drip', acuity: 3,
    flags: ['IV'], dayOfStay: 2, attendingMD: 'Dr. Nguyen',
    note: 'Anion gap closing. BG q1h insulin drip protocol. Anticipate step-down AM.',
  },
  {
    id: 'p-icu-05', room: '403A', lastName: 'Thompson', firstName: 'Barbara', age: 79, sex: 'F',
    diagnosis: 'STEMI — primary PCI Day 1', acuity: 4,
    flags: ['VENT'], dayOfStay: 1, attendingMD: 'Dr. Rashid',
    note: 'Intubated post-cath. Weaning attempt planned 0900. Cardiology rounding 0800.',
  },
  {
    id: 'p-icu-06', room: '403B', lastName: 'Johnson', firstName: 'Michael', age: 66, sex: 'M',
    diagnosis: 'Acute liver failure — multiorgan dysfunction', acuity: 5,
    flags: ['DNR', 'ISO'], dayOfStay: 5, attendingMD: 'Dr. Kowalski',
    note: 'Hepatic encephalopathy grade 3. Family aware of prognosis. Comfort measures discussed.',
  },
  {
    id: 'p-icu-07', room: '404A', lastName: 'Martinez', firstName: 'Linda', age: 58, sex: 'F',
    diagnosis: 'ARDS — ventilator dependent Day 7', acuity: 5,
    flags: ['VENT', 'ISO'], dayOfStay: 7, attendingMD: 'Dr. Patel',
    note: 'ARDSnet protocol. Prone positioning q8h. Trach consult pending pulm approval.',
  },
  {
    id: 'p-icu-08', room: '404B', lastName: 'Brown', firstName: 'Richard', age: 71, sex: 'M',
    diagnosis: 'Open AAA repair — post-op Day 1', acuity: 4,
    flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Singh',
    note: 'Epidural intact. Urine output adequate. Vascular surgery rounding 0730.',
  },
]

// ─── ICU Nurses ──────────────────────────────────────────────────────────────
export const ICU_NURSES: BoardNurse[] = [
  { id: 'n-icu-01', name: 'Priya Sharma', initials: 'PS', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-icu-02', name: 'James Okafor', initials: 'JO', role: 'RN',        status: 'active', hoursWorked: 1.5 },
  { id: 'n-icu-03', name: 'Maria Santos', initials: 'MS', role: 'RN',        status: 'break',  hoursWorked: 1.5 },
  { id: 'n-icu-04', name: 'Fatima Hassan', initials: 'FH', role: 'RN',       status: 'active', hoursWorked: 1.5 },
]

// ─── CCU Patients ────────────────────────────────────────────────────────────
export const CCU_PATIENTS: Patient[] = [
  { id: 'p-ccu-01', room: '411A', lastName: 'Rodriguez', firstName: 'Elena', age: 64, sex: 'F', diagnosis: 'Acute decompensated HF', acuity: 4, flags: ['IV', 'FALL'], dayOfStay: 2, attendingMD: 'Dr. Rashid', note: 'BNP trending down. IV Lasix protocol. Daily weights.' },
  { id: 'p-ccu-02', room: '411B', lastName: 'Nakamura', firstName: 'Ken', age: 71, sex: 'M', diagnosis: 'Atrial fibrillation with RVR', acuity: 3, flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'Amiodarone drip. HR 82 — controlled. EP consult placed.' },
  { id: 'p-ccu-03', room: '412A', lastName: 'Williams', firstName: 'Dorothy', age: 78, sex: 'F', diagnosis: 'Unstable angina — NSTEMI', acuity: 4, flags: ['DNR', 'FALL'], dayOfStay: 3, attendingMD: 'Dr. Kim', note: 'Cardiac cath scheduled 1100 today. NPO since midnight.' },
  { id: 'p-ccu-04', room: '412B', lastName: 'Garcia', firstName: 'Miguel', age: 55, sex: 'M', diagnosis: 'Complete heart block — pacemaker Day 1', acuity: 3, flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Kim', note: 'Pacing threshold check 0800. Pocket site intact. Ambulated x1.' },
  { id: 'p-ccu-05', room: '413A', lastName: 'Osei', firstName: 'Abena', age: 48, sex: 'F', diagnosis: 'Hypertensive emergency — encephalopathy', acuity: 4, flags: ['IV', 'FALL'], dayOfStay: 2, attendingMD: 'Dr. Patel', note: 'BP goal <160/100. Nicardipine drip titrating. Neuro consult today.' },
  { id: 'p-ccu-06', room: '413B', lastName: 'Kovacs', firstName: 'Stefan', age: 62, sex: 'M', diagnosis: 'Cardiac arrest — post-ROSC cooling', acuity: 5, flags: ['VENT', 'NPO'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'TTM protocol. Target temp 33°C. Neuro prognosis at 72h.' },
]

export const CCU_NURSES: BoardNurse[] = [
  { id: 'n-ccu-01', name: 'Rachel Torres', initials: 'RT', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-ccu-02', name: 'Kevin Nguyen', initials: 'KN', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-ccu-03', name: 'Angela White', initials: 'AW', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

// ─── ED, Med-Surg, Oncology, Tele (abbreviated for sidebar display) ──────────
export const ED_PATIENTS: Patient[] = [
  { id: 'p-ed-01', room: 'Bay 1', lastName: 'Foster', firstName: 'Diane', age: 45, sex: 'F', diagnosis: 'Chest pain — r/o ACS', acuity: 3, flags: ['IV'], dayOfStay: 0, attendingMD: 'Dr. Okafor', note: 'Serial troponins. EKG unchanged. Stress test ordered.' },
  { id: 'p-ed-02', room: 'Bay 2', lastName: 'Park', firstName: 'Thomas', age: 34, sex: 'M', diagnosis: 'Acute appendicitis', acuity: 3, flags: ['NPO'], dayOfStay: 0, attendingMD: 'Dr. Singh', note: 'Surgery consult. OR holding bay. NPO 0200.' },
  { id: 'p-ed-03', room: 'Bay 3', lastName: 'Ahmed', firstName: 'Yusra', age: 28, sex: 'F', diagnosis: 'Severe asthma exacerbation', acuity: 4, flags: ['IV'], dayOfStay: 0, attendingMD: 'Dr. Kowalski', note: 'Continuous albuterol. SpO2 94% on 4L NC. Pulm admission likely.' },
  { id: 'p-ed-04', room: 'Bay 4', lastName: 'Reyes', firstName: 'Carlos', age: 52, sex: 'M', diagnosis: 'Hypertensive urgency', acuity: 2, flags: [], dayOfStay: 0, attendingMD: 'Dr. Patel', note: 'BP 198/112. Oral meds. Monitoring x4h. Likely discharge.' },
  { id: 'p-ed-05', room: 'Bay 5', lastName: 'Kim', firstName: 'Susan', age: 67, sex: 'F', diagnosis: 'Altered mental status — UTI', acuity: 3, flags: ['FALL'], dayOfStay: 0, attendingMD: 'Dr. Nguyen', note: 'UA positive. Antibiotics started. Family at bedside.' },
  { id: 'p-ed-06', room: 'Bay 6', lastName: 'Washington', firstName: 'Marcus', age: 41, sex: 'M', diagnosis: 'Closed head injury', acuity: 3, flags: ['ISO'], dayOfStay: 0, attendingMD: 'Dr. Kowalski', note: 'CT head negative. GCS 14. Neuro checks q1h. Admit for obs.' },
  { id: 'p-ed-07', room: 'Bay 7', lastName: 'Okonkwo', firstName: 'Chidi', age: 29, sex: 'M', diagnosis: 'Sickle cell crisis', acuity: 3, flags: ['IV'], dayOfStay: 0, attendingMD: 'Dr. Rashid', note: 'PCA morphine. Hydration. Hematology consult. Admitted to floor.' },
  { id: 'p-ed-08', room: 'Bay 8', lastName: 'Hernandez', firstName: 'Rosa', age: 73, sex: 'F', diagnosis: 'Hip fracture — fall', acuity: 3, flags: ['FALL'], dayOfStay: 0, attendingMD: 'Dr. Singh', note: 'Ortho eval done. OR tomorrow AM. Pre-op ordered.' },
  { id: 'p-ed-09', room: 'Bay 10', lastName: 'Spencer', firstName: 'Alan', age: 58, sex: 'M', diagnosis: 'GI bleed — hematemesis', acuity: 4, flags: ['NPO', 'IV'], dayOfStay: 0, attendingMD: 'Dr. Kim', note: 'Hgb 7.8. 2u pRBC ordered. GI scoped 1300. ICU monitoring.' },
  { id: 'p-ed-10', room: 'Bay 11', lastName: 'Petrov', firstName: 'Natasha', age: 36, sex: 'F', diagnosis: 'Ectopic pregnancy — ruptured', acuity: 4, flags: ['IV', 'NPO'], dayOfStay: 0, attendingMD: 'Dr. Singh', note: 'OBGYN to OR now. Blood bank notified. OR 2 holding.' },
  { id: 'p-ed-11', room: 'Bay 12', lastName: 'Chang', firstName: 'Wei', age: 63, sex: 'M', diagnosis: 'Acute pancreatitis', acuity: 2, flags: ['NPO', 'IV'], dayOfStay: 0, attendingMD: 'Dr. Nguyen', note: 'Lipase 1,240. IVF aggressive. Lipids pending. Stable.' },
  { id: 'p-ed-12', room: 'Bay 14', lastName: 'Bishop', firstName: 'Claire', age: 81, sex: 'F', diagnosis: 'COPD exacerbation', acuity: 3, flags: ['FALL'], dayOfStay: 0, attendingMD: 'Dr. Kowalski', note: 'Duonebs q4h. SpO2 91% on 2L. Steroid course. Likely admit.' },
  { id: 'p-ed-13', room: 'Bay 15', lastName: 'Morton', firstName: 'Patrick', age: 44, sex: 'M', diagnosis: 'Alcohol withdrawal — seizure', acuity: 4, flags: ['IV', 'FALL', 'ISO'], dayOfStay: 0, attendingMD: 'Dr. Patel', note: 'CIWA 22. Ativan PRN. 1:1 sitter requested. Telemetry monitor.' },
  { id: 'p-ed-14', room: 'Bay 16', lastName: 'Adeyemi', firstName: 'Kemi', age: 55, sex: 'F', diagnosis: 'Pulmonary embolism — submassive', acuity: 4, flags: ['IV'], dayOfStay: 0, attendingMD: 'Dr. Rashid', note: 'Heparin drip started. Echo shows RV strain. IR consult placed.' },
]

export const ED_NURSES: BoardNurse[] = [
  { id: 'n-ed-01', name: 'Nathan Foster', initials: 'NF', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-ed-02', name: 'Carlos Rivera', initials: 'CR', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-ed-03', name: 'Stacy Powell', initials: 'SP', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-ed-04', name: 'David Kim', initials: 'DK', role: 'RN', status: 'break', hoursWorked: 1.5 },
  { id: 'n-ed-05', name: 'Sarah Chen', initials: 'SC', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

// Med-Surg A, B, Oncology, Tele — abbreviated patients for tab display
export const MEDSURGA_PATIENTS: Patient[] = [
  { id: 'p-msa-01', room: '301', lastName: 'Daniels', firstName: 'Ruth', age: 74, sex: 'F', diagnosis: 'Hip replacement post-op Day 2', acuity: 2, flags: ['FALL'], dayOfStay: 2, attendingMD: 'Dr. Singh', note: 'PT eval 0900. Ambulated 50 feet. Foley removed.' },
  { id: 'p-msa-02', room: '302', lastName: 'Harris', firstName: 'Gregory', age: 56, sex: 'M', diagnosis: 'Pneumonia — CAP moderate', acuity: 3, flags: ['IV'], dayOfStay: 3, attendingMD: 'Dr. Kowalski', note: 'Ceftriaxone day 3. Afebrile x24h. O2 weaning.' },
  { id: 'p-msa-03', room: '303', lastName: 'Patel', firstName: 'Anika', age: 39, sex: 'F', diagnosis: 'Crohn\'s flare — IV steroids', acuity: 2, flags: ['IV', 'NPO'], dayOfStay: 4, attendingMD: 'Dr. Nguyen', note: 'GI follow-up today. Considering biologics adjustment.' },
  { id: 'p-msa-04', room: '304', lastName: 'Thompson', firstName: 'Wendell', age: 68, sex: 'M', diagnosis: 'COPD — step down from ICU', acuity: 2, flags: ['FALL'], dayOfStay: 6, attendingMD: 'Dr. Kowalski', note: 'Transferred from ICU Day 2. SpO2 94% on 2L. Stable.' },
  { id: 'p-msa-05', room: '305', lastName: 'Castillo', firstName: 'Maria', age: 51, sex: 'F', diagnosis: 'Cholecystectomy post-op Day 1', acuity: 2, flags: [], dayOfStay: 1, attendingMD: 'Dr. Singh', note: 'Tolerating clears. Pain controlled. Discharge planning.' },
  { id: 'p-msa-06', room: '306', lastName: 'Webb', firstName: 'Derek', age: 77, sex: 'M', diagnosis: 'Cellulitis — IV antibiotics', acuity: 2, flags: ['IV', 'ALLERGY'], dayOfStay: 2, attendingMD: 'Dr. Patel', note: 'Penicillin allergy — on Vancomycin. Erythema improving.' },
  { id: 'p-msa-07', room: '307', lastName: 'Freeman', firstName: 'Joy', age: 45, sex: 'F', diagnosis: 'Acute CVA — ischemic', acuity: 3, flags: ['FALL', 'IV'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'tPA given 0235. Neuro checks q2h. CT head 1200.' },
  { id: 'p-msa-08', room: '308', lastName: 'Murphy', firstName: 'Sean', age: 63, sex: 'M', diagnosis: 'Lumbar fusion post-op Day 3', acuity: 2, flags: [], dayOfStay: 3, attendingMD: 'Dr. Singh', note: 'PT/OT x2/day. Discharge planning started. Home PT ordered.' },
  { id: 'p-msa-09', room: '309', lastName: 'Lindqvist', firstName: 'Ingrid', age: 82, sex: 'F', diagnosis: 'AKI on CKD — fluid overload', acuity: 3, flags: ['IV', 'FALL'], dayOfStay: 4, attendingMD: 'Dr. Kim', note: 'Nephrology following. Daily Cr trending. Foley for strict I&O.' },
  { id: 'p-msa-10', room: '310', lastName: 'Burke', firstName: 'Timothy', age: 58, sex: 'M', diagnosis: 'Type 2 DM — hyperglycemia', acuity: 1, flags: [], dayOfStay: 2, attendingMD: 'Dr. Nguyen', note: 'Insulin teaching today. Diabetic educator 1000. Discharge tomorrow.' },
]

export const MEDSURGA_NURSES: BoardNurse[] = [
  { id: 'n-msa-01', name: 'Beth Collins', initials: 'BC', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-msa-02', name: 'Mike Turner', initials: 'MT', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-msa-03', name: 'Aisha Patel', initials: 'AP', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

export const MEDSURGB_PATIENTS: Patient[] = [
  { id: 'p-msb-01', room: '311', lastName: 'Lewis', firstName: 'Carol', age: 69, sex: 'F', diagnosis: 'Colostomy takedown post-op Day 2', acuity: 2, flags: [], dayOfStay: 2, attendingMD: 'Dr. Singh', note: 'Bowel function returning. Diet advanced to soft. Wound care AM.' },
  { id: 'p-msb-02', room: '312', lastName: 'Barnes', firstName: 'Albert', age: 74, sex: 'M', diagnosis: 'TIA — observation', acuity: 2, flags: ['FALL'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'MRI negative. Echo pending. Aspirin started. Neurology 1300.' },
  { id: 'p-msb-03', room: '313', lastName: 'Coleman', firstName: 'Tanya', age: 43, sex: 'F', diagnosis: 'Lupus flare — SLE', acuity: 3, flags: ['IV'], dayOfStay: 3, attendingMD: 'Dr. Kim', note: 'Pulse steroids day 3. Rheum following. CBC improving.' },
  { id: 'p-msb-04', room: '314', lastName: 'Hoffman', firstName: 'Eric', age: 52, sex: 'M', diagnosis: 'ETOH hepatitis — Maddrey 48', acuity: 3, flags: ['IV', 'FALL'], dayOfStay: 5, attendingMD: 'Dr. Nguyen', note: 'Prednisolone day 5. LFTs slowly improving. Social work involved.' },
  { id: 'p-msb-05', room: '315', lastName: 'Nguyen', firstName: 'Thu', age: 31, sex: 'F', diagnosis: 'Hyperemesis gravidarum — 14wk', acuity: 2, flags: ['IV'], dayOfStay: 2, attendingMD: 'Dr. Patel', note: 'OB following. Zofran IV. PO trials q4h. Tolerating sips.' },
  { id: 'p-msb-06', room: '316', lastName: 'Russell', firstName: 'Walter', age: 79, sex: 'M', diagnosis: 'Pyelonephritis — sepsis r/o', acuity: 3, flags: ['IV', 'ALLERGY'], dayOfStay: 1, attendingMD: 'Dr. Patel', note: 'PCN allergy — Cipro IV. Blood cultures pending. T 38.9 trending down.' },
  { id: 'p-msb-07', room: '317', lastName: 'Irving', firstName: 'Dana', age: 55, sex: 'F', diagnosis: 'Bowel obstruction — conservative Rx', acuity: 3, flags: ['NPO', 'IV'], dayOfStay: 3, attendingMD: 'Dr. Singh', note: 'NG tube to LIWS. Surgery on hold. Serial abdominal exams.' },
  { id: 'p-msb-08', room: '318', lastName: 'Quinn', firstName: 'James', age: 61, sex: 'M', diagnosis: 'COPD — moderate exacerbation', acuity: 2, flags: [], dayOfStay: 2, attendingMD: 'Dr. Kowalski', note: 'Duonebs QID. Prednisone burst. SpO2 95% room air. Near discharge.' },
]

export const MEDSURGB_NURSES: BoardNurse[] = [
  { id: 'n-msb-01', name: 'Jennifer Rodriguez', initials: 'JR', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-msb-02', name: 'Tyler Barnes', initials: 'TB', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-msb-03', name: 'Linda Okonkwo', initials: 'LO', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

export const ONCOLOGY_PATIENTS: Patient[] = [
  { id: 'p-onc-01', room: '501', lastName: 'Yamamoto', firstName: 'Hana', age: 58, sex: 'F', diagnosis: 'Breast CA — chemo Day 2 (AC-T)', acuity: 2, flags: ['ISO', 'IV'], dayOfStay: 2, attendingMD: 'Dr. Kim', note: 'ANC 800 — neutropenic precautions. Nausea controlled. Cycle 3 of 6.' },
  { id: 'p-onc-02', room: '502', lastName: 'Graves', firstName: 'Harold', age: 71, sex: 'M', diagnosis: 'NHL — R-CHOP cycle 4', acuity: 3, flags: ['IV'], dayOfStay: 3, attendingMD: 'Dr. Kim', note: 'Fever 38.2 overnight. Blood cultures sent. Broad-spectrum abx started.' },
  { id: 'p-onc-03', room: '503', lastName: 'Ferreira', firstName: 'Ana', age: 44, sex: 'F', diagnosis: 'Ovarian CA — carboplatin/taxol', acuity: 3, flags: ['ISO', 'IV', 'NPO'], dayOfStay: 1, attendingMD: 'Dr. Kowalski', note: 'Pre-meds complete. Chemo infusion starting 0800. 6h infusion.' },
  { id: 'p-onc-04', room: '504', lastName: 'Hutchinson', firstName: 'Paul', age: 65, sex: 'M', diagnosis: 'Colon CA — post-op Day 4 (hemicolectomy)', acuity: 2, flags: [], dayOfStay: 4, attendingMD: 'Dr. Singh', note: 'Flatus present. Advancing diet. Wound clean. Likely discharge tomorrow.' },
]

export const ONCOLOGY_NURSES: BoardNurse[] = [
  { id: 'n-onc-01', name: 'Marcus Williams', initials: 'MW', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-onc-02', name: 'Linda Okonkwo', initials: 'LO', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

export const TELE_PATIENTS: Patient[] = [
  { id: 'p-tel-01', room: '201', lastName: 'Stone', firstName: 'Barbara', age: 72, sex: 'F', diagnosis: 'A-fib — rate control', acuity: 2, flags: ['FALL'], dayOfStay: 2, attendingMD: 'Dr. Rashid', note: 'Metoprolol adjusted. HR 78. Echo scheduled. Anticoag discussed.' },
  { id: 'p-tel-02', room: '202', lastName: 'Grant', firstName: 'Philip', age: 60, sex: 'M', diagnosis: 'SVT — post ablation Day 1', acuity: 2, flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Kim', note: 'Telemetry clear. No recurrence. Discharge criteria met. Awaiting ride.' },
  { id: 'p-tel-03', room: '203', lastName: 'Webb', firstName: 'Tina', age: 49, sex: 'F', diagnosis: 'Chest pain observation — troponin trending', acuity: 3, flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'Troponin 0.04 → 0.07. Serial EKGs. Cardiology consult placed.' },
  { id: 'p-tel-04', room: '204', lastName: 'Owens', firstName: 'Curtis', age: 83, sex: 'M', diagnosis: '2nd-degree AV block — pacing eval', acuity: 3, flags: ['FALL', 'DNR'], dayOfStay: 3, attendingMD: 'Dr. Kim', note: 'EP considering PPM. Family meeting today. DNR confirmed.' },
  { id: 'p-tel-05', room: '205', lastName: 'Ingram', firstName: 'Denise', age: 55, sex: 'F', diagnosis: 'Syncope workup — vasovagal likely', acuity: 1, flags: ['FALL'], dayOfStay: 1, attendingMD: 'Dr. Rashid', note: 'Tilt table negative. Echo normal. Discharge today. Instructions given.' },
  { id: 'p-tel-06', room: '206', lastName: 'Bridges', firstName: 'Frank', age: 67, sex: 'M', diagnosis: 'Hypokalemia — cardiac monitoring', acuity: 2, flags: ['IV'], dayOfStay: 1, attendingMD: 'Dr. Nguyen', note: 'K+ 2.8 on admission. Repleting x3. Follow-up BMP 1000.' },
]

export const TELE_NURSES: BoardNurse[] = [
  { id: 'n-tel-01', name: 'Marcus Williams', initials: 'MW', role: 'Charge RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-tel-02', name: 'Aisha Patel', initials: 'AP', role: 'RN', status: 'active', hoursWorked: 1.5 },
  { id: 'n-tel-03', name: 'Sarah Chen', initials: 'SC', role: 'RN', status: 'active', hoursWorked: 1.5 },
]

// ─── Unit data lookup ─────────────────────────────────────────────────────────
export const UNIT_PATIENTS: Record<string, Patient[]> = {
  icu: ICU_PATIENTS,
  ccu: CCU_PATIENTS,
  ed: ED_PATIENTS,
  medsurga: MEDSURGA_PATIENTS,
  medsurgb: MEDSURGB_PATIENTS,
  oncology: ONCOLOGY_PATIENTS,
  tele: TELE_PATIENTS,
}

export const UNIT_NURSES: Record<string, BoardNurse[]> = {
  icu: ICU_NURSES,
  ccu: CCU_NURSES,
  ed: ED_NURSES,
  medsurga: MEDSURGA_NURSES,
  medsurgb: MEDSURGB_NURSES,
  oncology: ONCOLOGY_NURSES,
  tele: TELE_NURSES,
}

// ─── Initial assignments ──────────────────────────────────────────────────────
const INITIAL_ASSIGNMENTS: Record<string, Record<string, string[]>> = {
  icu: {
    // Maria is over ratio (3/2) — shows the ratio warning, balance button fixes it
    // James has room (1/2) — allows reassign
    'n-icu-01': ['p-icu-01', 'p-icu-02'],
    'n-icu-02': ['p-icu-04'],
    'n-icu-03': ['p-icu-03', 'p-icu-05', 'p-icu-06'],
    'n-icu-04': ['p-icu-07', 'p-icu-08'],
  },
  ccu: {
    'n-ccu-01': ['p-ccu-01', 'p-ccu-02'],
    'n-ccu-02': ['p-ccu-03', 'p-ccu-04'],
    'n-ccu-03': ['p-ccu-05', 'p-ccu-06'],
  },
  ed: {
    'n-ed-01': ['p-ed-01', 'p-ed-02', 'p-ed-03'],
    'n-ed-02': ['p-ed-04', 'p-ed-05', 'p-ed-06'],
    'n-ed-03': ['p-ed-07', 'p-ed-08', 'p-ed-09'],
    'n-ed-04': ['p-ed-10', 'p-ed-11', 'p-ed-12'],
    'n-ed-05': ['p-ed-13', 'p-ed-14'],
  },
  medsurga: {
    'n-msa-01': ['p-msa-01', 'p-msa-02', 'p-msa-03', 'p-msa-04'],
    'n-msa-02': ['p-msa-05', 'p-msa-06', 'p-msa-07'],
    'n-msa-03': ['p-msa-08', 'p-msa-09', 'p-msa-10'],
  },
  medsurgb: {
    'n-msb-01': ['p-msb-01', 'p-msb-02', 'p-msb-03'],
    'n-msb-02': ['p-msb-04', 'p-msb-05', 'p-msb-06'],
    'n-msb-03': ['p-msb-07', 'p-msb-08'],
  },
  oncology: {
    'n-onc-01': ['p-onc-01', 'p-onc-02'],
    'n-onc-02': ['p-onc-03', 'p-onc-04'],
  },
  tele: {
    'n-tel-01': ['p-tel-01', 'p-tel-02'],
    'n-tel-02': ['p-tel-03', 'p-tel-04'],
    'n-tel-03': ['p-tel-05', 'p-tel-06'],
  },
}

// ─── Mutable state ────────────────────────────────────────────────────────────
// Deep-clone initial assignments into mutable maps
const _assignments: Record<string, Record<string, string[]>> = {}
for (const [uid, nurseMap] of Object.entries(INITIAL_ASSIGNMENTS)) {
  _assignments[uid] = {}
  for (const [nid, pids] of Object.entries(nurseMap)) {
    _assignments[uid][nid] = [...pids]
  }
}

const _discharged = new Set<string>()
const _extraPatients: Patient[] = []
let _nextAdmitNum = 1
const _nurseStatuses = new Map<string, NurseStatus>()
const _shareStates = new Map<string, boolean>()  // unitId → shared

// ─── State accessors / mutators ───────────────────────────────────────────────
export function getAssignments(unitId: string): Record<string, string[]> {
  return _assignments[unitId] ?? {}
}

export function getPatient(patientId: string): Patient | undefined {
  for (const patients of Object.values(UNIT_PATIENTS)) {
    const found = patients.find(p => p.id === patientId)
    if (found) return found
  }
  return _extraPatients.find(p => p.id === patientId)
}

export function getNurseStatus(nurseId: string, defaultStatus: NurseStatus): NurseStatus {
  return _nurseStatuses.get(nurseId) ?? defaultStatus
}

export function isPatientDischarged(patientId: string): boolean {
  return _discharged.has(patientId)
}

export function reassignPatient(unitId: string, patientId: string, fromNurseId: string, toNurseId: string): void {
  if (fromNurseId === toNurseId) return
  const unit = _assignments[unitId]
  if (!unit) return
  if (unit[fromNurseId]) {
    unit[fromNurseId] = unit[fromNurseId].filter(id => id !== patientId)
  }
  if (!unit[toNurseId]) unit[toNurseId] = []
  unit[toNurseId] = [...unit[toNurseId], patientId]
}

export function unassignPatient(unitId: string, patientId: string): void {
  const unit = _assignments[unitId]
  if (!unit) return
  for (const nurseId of Object.keys(unit)) {
    unit[nurseId] = unit[nurseId].filter(id => id !== patientId)
  }
  if (!unit['unassigned']) unit['unassigned'] = []
  unit['unassigned'] = [...unit['unassigned'], patientId]
}

export function dischargePatient(unitId: string, patientId: string): void {
  _discharged.add(patientId)
  const unit = _assignments[unitId]
  if (!unit) return
  for (const nurseId of Object.keys(unit)) {
    unit[nurseId] = unit[nurseId].filter(id => id !== patientId)
  }
}

export function admitPatient(
  unitId: string,
  patient: Omit<Patient, 'id'>,
  nurseId: string,
): Patient {
  const id = `p-new-${String(_nextAdmitNum).padStart(3, '0')}`
  _nextAdmitNum++
  const newPt: Patient = { ...patient, id }
  _extraPatients.push(newPt)
  if (!_assignments[unitId]) _assignments[unitId] = {}
  if (!_assignments[unitId][nurseId]) _assignments[unitId][nurseId] = []
  _assignments[unitId][nurseId] = [..._assignments[unitId][nurseId], id]
  return newPt
}

export function balanceLoad(unitId: string): void {
  const nurses = (UNIT_NURSES[unitId] ?? []).filter(n => getNurseStatus(n.id, n.status) !== 'called-out')
  const allPids: string[] = []
  const unit = _assignments[unitId] ?? {}
  for (const nid of nurses.map(n => n.id)) {
    allPids.push(...(unit[nid] ?? []))
    unit[nid] = []
  }
  // Also grab unassigned
  allPids.push(...(unit['unassigned'] ?? []))
  unit['unassigned'] = []

  // Sort by acuity descending (highest first)
  const allPatients = allPids.map(pid => getPatient(pid)).filter(Boolean) as Patient[]
  allPatients.sort((a, b) => b.acuity - a.acuity)

  const maxRatio = UNITS.find(u => u.id === unitId)?.maxRatio ?? 4

  // Greedy: assign each patient to nurse with lowest acuity total who isn't full
  const nurseAcuity: Record<string, number> = {}
  for (const n of nurses) nurseAcuity[n.id] = 0

  for (const pt of allPatients) {
    const eligible = nurses.filter(n => (unit[n.id]?.length ?? 0) < maxRatio)
    if (eligible.length === 0) {
      if (!unit['unassigned']) unit['unassigned'] = []
      unit['unassigned'] = [...unit['unassigned'], pt.id]
      continue
    }
    eligible.sort((a, b) => (nurseAcuity[a.id] ?? 0) - (nurseAcuity[b.id] ?? 0))
    const target = eligible[0]
    if (!unit[target.id]) unit[target.id] = []
    unit[target.id] = [...unit[target.id], pt.id]
    nurseAcuity[target.id] = (nurseAcuity[target.id] ?? 0) + pt.acuity
  }
}

export function markShared(unitId: string): void {
  _shareStates.set(unitId, true)
  setTimeout(() => _shareStates.delete(unitId), 4000)
}

export function wasShared(unitId: string): boolean {
  return _shareStates.get(unitId) ?? false
}

export function getUnassigned(unitId: string): string[] {
  return _assignments[unitId]?.['unassigned'] ?? []
}

// ─── Derived stats ────────────────────────────────────────────────────────────
export function getUnitStats(unitId: string) {
  const nurses = UNIT_NURSES[unitId] ?? []
  const unit = _assignments[unitId] ?? {}
  const allActive = nurses.filter(n => getNurseStatus(n.id, n.status) !== 'called-out')
  const unassigned = getUnassigned(unitId)
  const totalPatients = allActive.reduce((sum, n) => sum + (unit[n.id]?.length ?? 0), 0)
    + unassigned.length

  let totalAcuity = 0
  let maxNursePatients = 0
  let overRatioCount = 0
  const maxRatio = UNITS.find(u => u.id === unitId)?.maxRatio ?? 4

  for (const n of allActive) {
    const pids = unit[n.id] ?? []
    const pts = pids.map(pid => getPatient(pid)).filter(Boolean) as Patient[]
    const acuity = pts.reduce((s, p) => s + p.acuity, 0)
    totalAcuity += acuity
    maxNursePatients = Math.max(maxNursePatients, pids.length)
    if (pids.length > maxRatio) overRatioCount++
  }

  const totalBeds = UNITS.find(u => u.id === unitId)?.totalBeds ?? 0

  return {
    census: totalPatients,
    totalBeds,
    availableBeds: totalBeds - totalPatients,
    avgAcuity: totalPatients > 0 ? (totalAcuity / totalPatients).toFixed(1) : '0.0',
    overRatioCount,
    unassignedCount: unassigned.length,
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const ACUITY_META: Record<AcuityLevel, { label: string; color: string; bg: string; dot: string }> = {
  5: { label: 'Critical',  color: 'text-red-300',    bg: 'bg-red-500/20 border-red-500/40',    dot: 'bg-red-500'    },
  4: { label: 'High',      color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/30', dot: 'bg-orange-500' },
  3: { label: 'Moderate',  color: 'text-amber-300',  bg: 'bg-amber-500/10 border-amber-500/25',  dot: 'bg-amber-500'  },
  2: { label: 'Stable',    color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/25',   dot: 'bg-blue-500'   },
  1: { label: 'Discharge', color: 'text-emerald-300',bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-500'},
}

export const FLAG_META: Record<PatientFlag, { label: string; bg: string; color: string }> = {
  ISO:     { label: 'ISO',     bg: 'bg-orange-500/20', color: 'text-orange-300' },
  FALL:    { label: 'FALL',    bg: 'bg-yellow-500/20', color: 'text-yellow-300' },
  NPO:     { label: 'NPO',     bg: 'bg-blue-500/20',   color: 'text-blue-300'   },
  VENT:    { label: 'VENT',    bg: 'bg-red-500/20',    color: 'text-red-300'    },
  DNR:     { label: 'DNR',     bg: 'bg-slate-500/30',  color: 'text-slate-300'  },
  IV:      { label: 'IV',      bg: 'bg-violet-500/20', color: 'text-violet-300' },
  ALLERGY: { label: 'ALG',     bg: 'bg-pink-500/20',   color: 'text-pink-300'   },
}
