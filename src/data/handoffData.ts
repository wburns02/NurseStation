// ── SBAR Shift Handoff Documentation ────────────────────────────────────────

export type HandoffStatus = 'pending' | 'draft' | 'complete' | 'acknowledged'
export type AcuityLevel = 1 | 2 | 3 | 4 | 5

export interface VitalReading {
  time: string
  hr: number
  bpSys: number
  bpDia: number
  spo2: number
  rr: number
  tempF: number
}

export interface PendingOrder {
  id: string
  description: string
  due: string
  priority: 'routine' | 'urgent' | 'stat'
}

export interface Patient {
  id: string
  room: string
  name: string
  firstName: string
  age: number
  mrn: string       // last 4 digits displayed
  diagnosis: string
  unit: string
  acuity: AcuityLevel
  physician: string
  assignedNurse: string
  incomingNurse: string
  admitDate: string
  vitals: VitalReading[]
  pendingOrders: PendingOrder[]
  allergies: string[]
  codeStatus: string
}

export interface HandoffRecord {
  patientId: string
  situation: string
  background: string
  assessment: string
  recommendation: string
  watchItems: string[]
  status: HandoffStatus
  completedAt: string | null
  acknowledgedAt: string | null
}

// ── Watch Item Library ───────────────────────────────────────────────────────

export const WATCH_ITEMS = [
  'Fall Risk',
  'Aspiration Risk',
  'O2 Requirement',
  'Insulin Drip Active',
  'Awaiting Lab Results',
  'Awaiting CT Results',
  'Awaiting Echo Results',
  'Foley Catheter',
  'IV Access Check',
  'Skin Integrity Concern',
  'Pain Protocol',
  'NPO Status',
  'Fluid Restriction',
  'DVT Prophylaxis',
  'Isolation Precautions',
  'Code Status: DNR',
  'Code Status: DNI',
  'Pacer Pads In Place',
  'Post-op Monitoring',
  'Sternal Wound Check',
  'Febrile',
  'Restraints in Use',
]

// ── Patient Data ─────────────────────────────────────────────────────────────

export const PATIENTS: Patient[] = [
  {
    id: 'pt-001',
    room: '201',
    name: 'Robert Chen',
    firstName: 'Robert',
    age: 67,
    mrn: '8834',
    diagnosis: 'Pneumonia + CHF Exacerbation',
    unit: 'ICU',
    acuity: 4,
    physician: 'Dr. Sarah Kaplan',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Marcus Webb',
    admitDate: '03/11/26',
    allergies: ['Penicillin', 'Sulfa'],
    codeStatus: 'Full Code',
    vitals: [
      { time: '07:00', hr: 98, bpSys: 142, bpDia: 88, spo2: 91, rr: 22, tempF: 101.4 },
      { time: '09:00', hr: 94, bpSys: 138, bpDia: 84, spo2: 93, rr: 20, tempF: 101.1 },
      { time: '11:00', hr: 90, bpSys: 134, bpDia: 82, spo2: 94, rr: 18, tempF: 100.8 },
      { time: '13:00', hr: 88, bpSys: 130, bpDia: 80, spo2: 95, rr: 17, tempF: 100.4 },
    ],
    pendingOrders: [
      { id: 'ord-001a', description: 'Echo scheduled 06:00 tomorrow', due: '06:00 3/13', priority: 'routine' },
      { id: 'ord-001b', description: 'Repeat CXR 06:00 tomorrow', due: '06:00 3/13', priority: 'routine' },
      { id: 'ord-001c', description: 'BMP at 1800', due: '18:00 today', priority: 'urgent' },
    ],
  },
  {
    id: 'pt-002',
    room: '203',
    name: 'Sandra Williams',
    firstName: 'Sandra',
    age: 54,
    mrn: '4471',
    diagnosis: 'Post-op CABG ×3, Day 2',
    unit: 'ICU',
    acuity: 3,
    physician: 'Dr. David Nguyen',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Marcus Webb',
    admitDate: '03/10/26',
    allergies: ['Morphine'],
    codeStatus: 'Full Code',
    vitals: [
      { time: '07:00', hr: 76, bpSys: 118, bpDia: 72, spo2: 98, rr: 16, tempF: 98.6 },
      { time: '09:00', hr: 74, bpSys: 116, bpDia: 70, spo2: 98, rr: 15, tempF: 98.4 },
      { time: '11:00', hr: 73, bpSys: 115, bpDia: 71, spo2: 99, rr: 15, tempF: 98.3 },
      { time: '13:00', hr: 72, bpSys: 114, bpDia: 70, spo2: 99, rr: 14, tempF: 98.2 },
    ],
    pendingOrders: [
      { id: 'ord-002a', description: 'NPO after midnight for repeat echo', due: '00:00 3/13', priority: 'urgent' },
      { id: 'ord-002b', description: 'PT/OT consult in AM', due: '08:00 3/13', priority: 'routine' },
      { id: 'ord-002c', description: 'Heparin drip — therapeutic range check at 1800', due: '18:00 today', priority: 'urgent' },
    ],
  },
  {
    id: 'pt-003',
    room: '412',
    name: 'Michael Torres',
    firstName: 'Michael',
    age: 71,
    mrn: '2259',
    diagnosis: 'COPD Exacerbation, O₂-Dependent',
    unit: 'MS-A',
    acuity: 3,
    physician: 'Dr. Priya Mehta',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Lisa Chen',
    admitDate: '03/12/26',
    allergies: ['Codeine'],
    codeStatus: 'DNI / Full Code otherwise',
    vitals: [
      { time: '07:00', hr: 92, bpSys: 148, bpDia: 92, spo2: 88, rr: 24, tempF: 99.2 },
      { time: '09:00', hr: 88, bpSys: 144, bpDia: 90, spo2: 91, rr: 22, tempF: 99.0 },
      { time: '11:00', hr: 86, bpSys: 140, bpDia: 88, spo2: 93, rr: 20, tempF: 98.8 },
      { time: '13:00', hr: 84, bpSys: 138, bpDia: 86, spo2: 94, rr: 19, tempF: 98.6 },
    ],
    pendingOrders: [
      { id: 'ord-003a', description: 'Pulmonology consult — awaiting callback', due: 'ASAP', priority: 'urgent' },
      { id: 'ord-003b', description: 'ABG at 1600', due: '16:00 today', priority: 'urgent' },
      { id: 'ord-003c', description: 'Repeat albuterol/ipratropium SVN q4h', due: 'q4h', priority: 'routine' },
    ],
  },
  {
    id: 'pt-004',
    room: '415',
    name: 'Eleanor Hayes',
    firstName: 'Eleanor',
    age: 82,
    mrn: '6612',
    diagnosis: 'L. Hip ORIF, Post-op Day 1',
    unit: 'MS-A',
    acuity: 3,
    physician: 'Dr. Thomas Reed',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Lisa Chen',
    admitDate: '03/12/26',
    allergies: ['Latex', 'NSAIDS'],
    codeStatus: 'DNR / DNI',
    vitals: [
      { time: '07:00', hr: 84, bpSys: 126, bpDia: 78, spo2: 96, rr: 16, tempF: 98.8 },
      { time: '09:00', hr: 82, bpSys: 124, bpDia: 76, spo2: 97, rr: 15, tempF: 98.6 },
      { time: '11:00', hr: 80, bpSys: 122, bpDia: 74, spo2: 97, rr: 15, tempF: 98.5 },
      { time: '13:00', hr: 79, bpSys: 120, bpDia: 74, spo2: 98, rr: 14, tempF: 98.4 },
    ],
    pendingOrders: [
      { id: 'ord-004a', description: 'OT for hip precautions teaching', due: '15:00 today', priority: 'routine' },
      { id: 'ord-004b', description: 'Hemoglobin check at 1600', due: '16:00 today', priority: 'urgent' },
      { id: 'ord-004c', description: 'Foley discontinued — monitor for void', due: 'Ongoing', priority: 'routine' },
    ],
  },
  {
    id: 'pt-005',
    room: '418',
    name: 'James Okafor',
    firstName: 'James',
    age: 45,
    mrn: '9103',
    diagnosis: 'Diabetic Ketoacidosis (DKA)',
    unit: 'MS-A',
    acuity: 4,
    physician: 'Dr. Priya Mehta',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Lisa Chen',
    admitDate: '03/12/26',
    allergies: ['NKDA'],
    codeStatus: 'Full Code',
    vitals: [
      { time: '07:00', hr: 112, bpSys: 102, bpDia: 64, spo2: 97, rr: 22, tempF: 99.8 },
      { time: '09:00', hr: 106, bpSys: 108, bpDia: 68, spo2: 98, rr: 20, tempF: 99.4 },
      { time: '11:00', hr: 98, bpSys: 114, bpDia: 72, spo2: 98, rr: 18, tempF: 99.1 },
      { time: '13:00', hr: 94, bpSys: 118, bpDia: 74, spo2: 98, rr: 17, tempF: 98.9 },
    ],
    pendingOrders: [
      { id: 'ord-005a', description: 'BMP + ketones q2h — next at 15:00', due: '15:00 today', priority: 'stat' },
      { id: 'ord-005b', description: 'Insulin drip — current rate 2u/hr, titrate per DKA protocol', due: 'Ongoing', priority: 'urgent' },
      { id: 'ord-005c', description: 'Endocrinology consult in AM', due: '08:00 3/13', priority: 'routine' },
    ],
  },
  {
    id: 'pt-006',
    room: '421',
    name: 'Dorothy Park',
    firstName: 'Dorothy',
    age: 78,
    mrn: '3345',
    diagnosis: 'UTI + Altered Mental Status',
    unit: 'MS-A',
    acuity: 2,
    physician: 'Dr. Anne Kowalski',
    assignedNurse: 'Janet Morrison',
    incomingNurse: 'Lisa Chen',
    admitDate: '03/11/26',
    allergies: ['Sulfa', 'Bactrim'],
    codeStatus: 'DNR / DNI',
    vitals: [
      { time: '07:00', hr: 88, bpSys: 132, bpDia: 84, spo2: 95, rr: 18, tempF: 100.2 },
      { time: '09:00', hr: 86, bpSys: 130, bpDia: 82, spo2: 96, rr: 17, tempF: 100.0 },
      { time: '11:00', hr: 84, bpSys: 128, bpDia: 80, spo2: 97, rr: 16, tempF: 99.8 },
      { time: '13:00', hr: 82, bpSys: 126, bpDia: 78, spo2: 97, rr: 16, tempF: 99.6 },
    ],
    pendingOrders: [
      { id: 'ord-006a', description: 'Urine culture — results pending', due: 'Pending', priority: 'routine' },
      { id: 'ord-006b', description: 'UA + culture repeat if febrile', due: 'PRN', priority: 'routine' },
      { id: 'ord-006c', description: 'Soft wrist restraints — family at bedside, may remove', due: 'Reassess q1h', priority: 'routine' },
    ],
  },
]

// ── AI Generate Templates ────────────────────────────────────────────────────

export const GENERATE_TEMPLATES: Record<string, Record<'situation' | 'background' | 'assessment' | 'recommendation', string>> = {
  'pt-001': {
    situation:
      'Mr. Chen is a 67-year-old male admitted for community-acquired pneumonia with underlying CHF exacerbation. Currently febrile (100.4°F, trending down from 101.4°F). O₂ requirements decreased from 4L/min to 2L/min NC this shift — positive response to IV Zosyn. Dr. Kaplan aware and satisfied with trajectory.',
    background:
      'PMH: CHF (EF 35%), HTN, Type 2 DM. Admitted 03/11. Chest X-ray today showed mild improvement in bilateral infiltrates. Echo still pending. On IV furosemide, Zosyn, and metoprolol. Cardiology consulted. Allergies: Penicillin, Sulfa — Zosyn sensitivity discussed and cleared by pharmacy.',
    assessment:
      'Improving but requires close monitoring. Temp trending down (101.4°F→100.4°F), SpO₂ improved to 95%, HR stabilizing at 88. Fluid balance: +320mL net this shift — watch for volume overload given EF 35%. Lungs: decreased crackles bilaterally. Mental status intact. Diet: low-sodium cardiac, tolerating.',
    recommendation:
      '1. Titrate O₂ to maintain SpO₂ ≥94%, wean toward room air as tolerated. 2. Strict I/O — notify Dr. Kaplan if net positive >500mL this shift. 3. BMP ordered for 18:00 — check K+ given furosemide. 4. Echo and CXR scheduled for 06:00 tomorrow. 5. Family very engaged — avoid quoting discharge timeline.',
  },
  'pt-002': {
    situation:
      'Ms. Williams is a 54-year-old female, post-op day 2 following CABG ×3. Hemodynamically stable all shift. Ambulated once to bathroom with PT assist — tolerated well without chest pain or dyspnea. Pain currently 3/10, managed with scheduled Tylenol 1g q6h and PRN Dilaudid 0.2mg IV.',
    background:
      'PMH: CAD, HTN, hyperlipidemia. CABG performed 03/10 by Dr. Nguyen. All grafts patent per OR report. Chest tube removed POD1 — CXR post-pull clear. Sternal wound: intact, steri-strips clean and dry. Pacer pads in place but not used. Heparin drip for DVT prophylaxis — therapeutic. Allergy: Morphine (nausea/vomiting).',
    assessment:
      'Clinically progressing appropriately for CABG POD2. VS stable throughout shift. Incision pain well-controlled. Incentive spirometry compliance excellent — 1250mL consistently. Mild bilateral lower-extremity edema, unchanged. Appetite improving. Mental status fully intact.',
    recommendation:
      '1. Continue chest PT q4h and deep breathing exercises. 2. IS goal: 1500mL — encourage q1h while awake. 3. Ambulate twice more this evening with assistance. 4. Heparin drip therapeutic range check at 18:00. 5. NPO after midnight for repeat echo tomorrow. 6. Call MD for HR >110 or <55, SBP <90 or >160, chest pain, or acute respiratory change.',
  },
  'pt-003': {
    situation:
      'Mr. Torres is a 71-year-old male admitted this morning with acute COPD exacerbation. Currently on 3L/min O₂ via NC — SpO₂ improved from 88% to 94% since admission. Received albuterol/ipratropium SVN q4h with modest improvement in wheeze. Pulmonology consult placed — awaiting callback.',
    background:
      'PMH: COPD (GOLD Stage III), HTN. 40 pack-year smoking history (quit 5 years ago). On advair, spiriva, albuterol PRN at home. Admitted for 3-day history of worsening dyspnea, increased sputum production, and wheezing. No intubation history. Code status confirmed: DNI / Full Code otherwise. Allergy: Codeine.',
    assessment:
      'Respiratory status improving but not yet at baseline. O₂ requirements higher than his home baseline of room air. ABG ordered for 16:00 to assess ventilation. Accessory muscle use: mild, decreasing. Sputum: thick, yellow-green. Incentive spirometry: 800mL (reduced from estimated baseline). No signs of pneumonia on admission CXR.',
    recommendation:
      '1. Maintain O₂ at 3L/min — target SpO₂ 92-95% (avoid over-oxygenation in COPD). 2. SVN albuterol/ipratropium q4h — next due 15:00. 3. Review ABG results at 16:00 — call Dr. Mehta if pH <7.35 or pCO₂ >50. 4. CRITICAL: Patient is DNI — confirm goals of care if respiratory status worsens. 5. Pulm consult — follow up with answering service if no callback by 17:00.',
  },
  'pt-004': {
    situation:
      'Ms. Hayes is an 82-year-old female, post-op day 1 from left hip ORIF following a fall at home. Hemodynamically stable. Pain managed at 4/10 with Tylenol scheduled and oxycodone 2.5mg PRN (used twice today). Ambulated with PT to chair — tolerated 20 minutes without complaint.',
    background:
      'PMH: Osteoporosis, HTN, mild cognitive impairment (baseline). Hip ORIF performed 03/12 by Dr. Reed — uncomplicated. Foley catheter discontinued this AM. Allergies: Latex, NSAIDs (contraindicated — use acetaminophen only). Code status: DNR/DNI (patient-directed, family confirmed). Family at bedside — very attentive.',
    assessment:
      'Recovering appropriately for POD1 hip ORIF. VS stable. Hemoglobin check pending at 16:00 — estimated blood loss 250mL intraoperatively. Fall risk HIGH — cognitive impairment + post-op analgesics + hip precautions. Hip wound: dressing intact, no drainage. Voiding without catheter — first void 200mL at 10:30. Mild delirium risk given age and hospitalization.',
    recommendation:
      '1. Hip precautions STRICT — no hip flexion >90°, no internal rotation. 2. Fall precautions: bed alarm on, call light in reach, non-skid socks, frequent rounding. 3. Hemoglobin at 16:00 — notify Dr. Reed if <8.0. 4. OT for hip teaching this afternoon. 5. Monitor cognition — baseline mild impairment, watch for acute worsening (delirium). 6. Family present — they are helpful with redirection.',
  },
  'pt-005': {
    situation:
      'Mr. Okafor is a 45-year-old male admitted today for DKA. Responding to treatment — glucose down from 487 to 218 mg/dL since admission. Insulin drip currently at 2u/hr per DKA protocol. Anion gap closing (last check: 14). Still requiring q2h BMP per protocol. Mental status improving significantly since admission.',
    background:
      'PMH: Type 1 DM (diagnosed at age 12), on home insulin pump. Insulin pump held on admission per protocol. Trigger: missed pump site change for 36 hours. Current therapy: NS IV at 150mL/hr, insulin drip 2u/hr, KCl supplementation per sliding scale. Allergies: NKDA. Full Code.',
    assessment:
      'Clinically improving. Glucose trending down appropriately. Anion gap closing — approaching resolution. Tachycardia improving (112→94 bpm). Nausea resolved since 10:00 — taking small sips of clear liquid. Repeat BMP due at 15:00. Urine output adequate. K+ currently 3.6 — monitoring closely with insulin therapy.',
    recommendation:
      '1. BMP + ketones STAT at 15:00 — critical to track anion gap closure. 2. Insulin drip at 2u/hr — do NOT discontinue until anion gap <12 AND patient tolerating PO carbs. 3. Advance diet as tolerated: clear liquids → regular when nausea-free >4h. 4. Endocrinology consult in AM for insulin pump restart plan. 5. Patient education opportunity on pump site rotation — he is receptive and asking good questions.',
  },
  'pt-006': {
    situation:
      'Ms. Park is a 78-year-old female admitted for UTI with associated altered mental status. Has been more alert and oriented this shift — a positive change from admission confusion. Currently on ceftriaxone IV. Afebrile since 11:00 (was 100.2°F at 07:00). Urine culture results still pending.',
    background:
      'PMH: HTN, mild dementia (baseline A&Ox2). Admitted 03/11 from assisted living with dysuria, fever, and acute-on-chronic confusion. UA on admission: large bacteria, >100 WBC. Blood cultures ×2 drawn — no growth to date. Allergies: Sulfa, Bactrim (rash) — on ceftriaxone. Code status: DNR/DNI. Family (son) visiting daily.',
    assessment:
      'Improving from baseline AMS. More conversant and recognizing family today. Temp trending down (100.2→99.6°F). Urine output adequate. Tolerating oral intake — eating 75% of meals. Still at mild fall risk and aspiration risk given age and underlying dementia. Soft wrist restraints for IV safety — family at bedside reassessing need.',
    recommendation:
      '1. Continue ceftriaxone IV until culture sensitivity confirmed — may transition to PO when sensitivities available. 2. Frequent reorientation — family involvement is key. 3. Fall precautions maintained — ensure call light accessible. 4. Review culture results when available — contact Dr. Kowalski with sensitivities. 5. Restraint reassessment q1h — discontinue when family present at bedside. 6. Discharge planning: coordinate with social work for ALF return — target tomorrow if improving.',
  },
}

// ── Seeded Handoff Records ───────────────────────────────────────────────────

const SEED_HANDOFFS: HandoffRecord[] = [
  {
    patientId: 'pt-001',
    situation: GENERATE_TEMPLATES['pt-001'].situation,
    background: GENERATE_TEMPLATES['pt-001'].background,
    assessment: GENERATE_TEMPLATES['pt-001'].assessment,
    recommendation: GENERATE_TEMPLATES['pt-001'].recommendation,
    watchItems: ['O2 Requirement', 'Fluid Restriction', 'Awaiting Echo Results', 'Febrile'],
    status: 'complete',
    completedAt: '12:48 PM',
    acknowledgedAt: null,
  },
  {
    patientId: 'pt-002',
    situation: GENERATE_TEMPLATES['pt-002'].situation,
    background: GENERATE_TEMPLATES['pt-002'].background,
    assessment: GENERATE_TEMPLATES['pt-002'].assessment,
    recommendation: GENERATE_TEMPLATES['pt-002'].recommendation,
    watchItems: ['Post-op Monitoring', 'DVT Prophylaxis', 'Sternal Wound Check', 'Pacer Pads In Place'],
    status: 'acknowledged',
    completedAt: '11:32 AM',
    acknowledgedAt: '12:04 PM',
  },
  {
    patientId: 'pt-003',
    situation: GENERATE_TEMPLATES['pt-003'].situation,
    background: GENERATE_TEMPLATES['pt-003'].background,
    assessment: '',
    recommendation: '',
    watchItems: ['O2 Requirement', 'Code Status: DNI', 'Awaiting Lab Results'],
    status: 'draft',
    completedAt: null,
    acknowledgedAt: null,
  },
  {
    patientId: 'pt-004',
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    watchItems: ['Fall Risk', 'Post-op Monitoring', 'Code Status: DNR'],
    status: 'pending',
    completedAt: null,
    acknowledgedAt: null,
  },
  {
    patientId: 'pt-005',
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    watchItems: ['Insulin Drip Active', 'Awaiting Lab Results'],
    status: 'pending',
    completedAt: null,
    acknowledgedAt: null,
  },
  {
    patientId: 'pt-006',
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    watchItems: ['Fall Risk', 'Aspiration Risk', 'Code Status: DNR'],
    status: 'pending',
    completedAt: null,
    acknowledgedAt: null,
  },
]

// ── Mutable State ────────────────────────────────────────────────────────────

const _handoffs: Map<string, HandoffRecord> = new Map(
  SEED_HANDOFFS.map(h => [h.patientId, { ...h, watchItems: [...h.watchItems] }])
)

// ── Public API ───────────────────────────────────────────────────────────────

export function getHandoff(patientId: string): HandoffRecord {
  return _handoffs.get(patientId) ?? {
    patientId,
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    watchItems: [],
    status: 'pending',
    completedAt: null,
    acknowledgedAt: null,
  }
}

export function saveHandoff(patientId: string, fields: Partial<HandoffRecord>): void {
  const current = getHandoff(patientId)
  const updated: HandoffRecord = { ...current, ...fields }
  if (updated.status === 'pending' && (updated.situation || updated.background || updated.assessment || updated.recommendation)) {
    updated.status = 'draft'
  }
  _handoffs.set(patientId, updated)
}

export function markComplete(patientId: string): void {
  const current = getHandoff(patientId)
  _handoffs.set(patientId, {
    ...current,
    status: 'complete',
    completedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  })
}

export function acknowledgeHandoff(patientId: string): void {
  const current = getHandoff(patientId)
  _handoffs.set(patientId, {
    ...current,
    status: 'acknowledged',
    acknowledgedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  })
}

export function getCompletionSummary() {
  const all = Array.from(_handoffs.values())
  const complete = all.filter(h => h.status === 'complete' || h.status === 'acknowledged').length
  const acknowledged = all.filter(h => h.status === 'acknowledged').length
  const draft = all.filter(h => h.status === 'draft').length
  const pending = all.filter(h => h.status === 'pending').length
  return { complete, acknowledged, draft, pending, total: all.length }
}
