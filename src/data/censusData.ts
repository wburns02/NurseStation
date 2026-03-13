// ── Live Census & Bed Board Data ─────────────────────────────────────────────
// Date context: Friday March 13, 2026 — Day Shift 07:00
// Covers current shift and predictions through 19:00

export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry'
export type BedStatus = 'occupied' | 'clean' | 'dirty' | 'blocked' | 'isolation'
export type Disposition = 'stable' | 'discharge-today' | 'transfer-out' | 'upgrade' | 'watchlist' | 'pending-discharge'
export type AdtType = 'admission' | 'discharge' | 'transfer-in' | 'transfer-out' | 'pending-admit' | 'pending-dc'
export type Acuity = 1 | 2 | 3 | 4 | 5

export interface Patient {
  id:          string
  unit:        UnitKey
  room:        string
  lastName:    string
  firstInitial:string
  diagnosis:   string
  acuity:      Acuity
  los:         number        // length of stay in days
  admitDate:   string
  disposition: Disposition
  isolation?:  'Contact' | 'Droplet' | 'Airborne'
  dcTime?:     string        // estimated discharge time if dc-today
  attendingMd: string
  flags:       string[]      // ['fall-risk', 'dnr', 'high-acuity', 'pending-labs', 'consult']
}

export interface Bed {
  id:        string
  unit:      UnitKey
  room:      string
  status:    BedStatus
  patientId?: string
  blockedReason?: string
  cleanSince?:    string
}

export interface AdtEvent {
  id:          string
  type:        AdtType
  patientDisplay: string     // "Smith, J."
  unit:        UnitKey
  room?:       string
  time:        string
  diagnosis?:  string
  acuity?:     Acuity
  fromUnit?:   UnitKey
  toUnit?:     UnitKey
  note?:       string
  isPending:   boolean
}

export interface UnitCensus {
  unit:              UnitKey
  label:             string
  floor:             string
  totalBeds:         number
  occupied:          number
  clean:             number
  dirty:             number
  blocked:           number
  isolation:         number
  avgAcuity:         number
  pendingAdmissions: number
  expectedDischarges:number
  projectedOccupied: number  // after pending admits - expected dc
  staffOnDuty:       number
  requiredStaff:     number  // based on ratio & projected census
  maxRatio:          string  // e.g. '2:1'
  ratioCompliant:    boolean
  projectedCompliant:boolean // after ADT
  color:             string  // Tailwind dot color
  bgLight:           string
}

// ── Beds per unit ──────────────────────────────────────────────────────────────

const _beds: Bed[] = [
  // ICU — 10 beds
  { id: 'icu-401a', unit: 'ICU', room: '401A', status: 'occupied',  patientId: 'pt-001' },
  { id: 'icu-401b', unit: 'ICU', room: '401B', status: 'occupied',  patientId: 'pt-002' },
  { id: 'icu-402a', unit: 'ICU', room: '402A', status: 'occupied',  patientId: 'pt-003' },
  { id: 'icu-402b', unit: 'ICU', room: '402B', status: 'occupied',  patientId: 'pt-004' },
  { id: 'icu-403a', unit: 'ICU', room: '403A', status: 'occupied',  patientId: 'pt-005' },
  { id: 'icu-403b', unit: 'ICU', room: '403B', status: 'occupied',  patientId: 'pt-006' },
  { id: 'icu-404a', unit: 'ICU', room: '404A', status: 'occupied',  patientId: 'pt-007' },
  { id: 'icu-404b', unit: 'ICU', room: '404B', status: 'occupied',  patientId: 'pt-008' },
  { id: 'icu-405a', unit: 'ICU', room: '405A', status: 'clean',     },
  { id: 'icu-405b', unit: 'ICU', room: '405B', status: 'dirty',     cleanSince: '06:30' },

  // CCU — 8 beds
  { id: 'ccu-301a', unit: 'CCU', room: '301A', status: 'occupied',  patientId: 'pt-011' },
  { id: 'ccu-301b', unit: 'CCU', room: '301B', status: 'occupied',  patientId: 'pt-012' },
  { id: 'ccu-302a', unit: 'CCU', room: '302A', status: 'occupied',  patientId: 'pt-013' },
  { id: 'ccu-302b', unit: 'CCU', room: '302B', status: 'occupied',  patientId: 'pt-014' },
  { id: 'ccu-303a', unit: 'CCU', room: '303A', status: 'occupied',  patientId: 'pt-015' },
  { id: 'ccu-303b', unit: 'CCU', room: '303B', status: 'occupied',  patientId: 'pt-016' },
  { id: 'ccu-304a', unit: 'CCU', room: '304A', status: 'clean',     },
  { id: 'ccu-304b', unit: 'CCU', room: '304B', status: 'dirty',     cleanSince: '05:45' },

  // ED — 20 beds
  { id: 'ed-r01',  unit: 'ED', room: 'R01', status: 'occupied',  patientId: 'pt-021' },
  { id: 'ed-r02',  unit: 'ED', room: 'R02', status: 'occupied',  patientId: 'pt-022' },
  { id: 'ed-r03',  unit: 'ED', room: 'R03', status: 'occupied',  patientId: 'pt-023' },
  { id: 'ed-r04',  unit: 'ED', room: 'R04', status: 'occupied',  patientId: 'pt-024' },
  { id: 'ed-r05',  unit: 'ED', room: 'R05', status: 'occupied',  patientId: 'pt-025' },
  { id: 'ed-r06',  unit: 'ED', room: 'R06', status: 'occupied',  patientId: 'pt-026' },
  { id: 'ed-r07',  unit: 'ED', room: 'R07', status: 'occupied',  patientId: 'pt-027' },
  { id: 'ed-r08',  unit: 'ED', room: 'R08', status: 'occupied',  patientId: 'pt-028' },
  { id: 'ed-r09',  unit: 'ED', room: 'R09', status: 'occupied',  patientId: 'pt-029' },
  { id: 'ed-r10',  unit: 'ED', room: 'R10', status: 'occupied',  patientId: 'pt-030' },
  { id: 'ed-r11',  unit: 'ED', room: 'R11', status: 'occupied',  patientId: 'pt-031' },
  { id: 'ed-r12',  unit: 'ED', room: 'R12', status: 'occupied',  patientId: 'pt-032' },
  { id: 'ed-r13',  unit: 'ED', room: 'R13', status: 'occupied',  patientId: 'pt-033' },
  { id: 'ed-r14',  unit: 'ED', room: 'R14', status: 'occupied',  patientId: 'pt-034' },
  { id: 'ed-r15',  unit: 'ED', room: 'R15', status: 'clean',     },
  { id: 'ed-r16',  unit: 'ED', room: 'R16', status: 'dirty',     cleanSince: '06:50' },
  { id: 'ed-r17',  unit: 'ED', room: 'R17', status: 'clean',     },
  { id: 'ed-r18',  unit: 'ED', room: 'R18', status: 'blocked',   blockedReason: 'Equipment maintenance' },
  { id: 'ed-r19',  unit: 'ED', room: 'R19', status: 'clean',     },
  { id: 'ed-r20',  unit: 'ED', room: 'R20', status: 'dirty',     cleanSince: '06:15' },

  // MS-A — 20 beds
  { id: 'msa-201a', unit: 'MS-A', room: '201A', status: 'occupied', patientId: 'pt-041' },
  { id: 'msa-201b', unit: 'MS-A', room: '201B', status: 'occupied', patientId: 'pt-042' },
  { id: 'msa-202a', unit: 'MS-A', room: '202A', status: 'occupied', patientId: 'pt-043' },
  { id: 'msa-202b', unit: 'MS-A', room: '202B', status: 'occupied', patientId: 'pt-044' },
  { id: 'msa-203a', unit: 'MS-A', room: '203A', status: 'occupied', patientId: 'pt-045' },
  { id: 'msa-203b', unit: 'MS-A', room: '203B', status: 'occupied', patientId: 'pt-046' },
  { id: 'msa-204a', unit: 'MS-A', room: '204A', status: 'occupied', patientId: 'pt-047' },
  { id: 'msa-204b', unit: 'MS-A', room: '204B', status: 'occupied', patientId: 'pt-048' },
  { id: 'msa-205a', unit: 'MS-A', room: '205A', status: 'occupied', patientId: 'pt-049' },
  { id: 'msa-205b', unit: 'MS-A', room: '205B', status: 'occupied', patientId: 'pt-050' },
  { id: 'msa-206a', unit: 'MS-A', room: '206A', status: 'occupied', patientId: 'pt-051' },
  { id: 'msa-206b', unit: 'MS-A', room: '206B', status: 'occupied', patientId: 'pt-052' },
  { id: 'msa-207a', unit: 'MS-A', room: '207A', status: 'occupied', patientId: 'pt-053' },
  { id: 'msa-207b', unit: 'MS-A', room: '207B', status: 'occupied', patientId: 'pt-054' },
  { id: 'msa-208a', unit: 'MS-A', room: '208A', status: 'occupied', patientId: 'pt-055' },
  { id: 'msa-208b', unit: 'MS-A', room: '208B', status: 'occupied', patientId: 'pt-056' },
  { id: 'msa-209a', unit: 'MS-A', room: '209A', status: 'clean',    },
  { id: 'msa-209b', unit: 'MS-A', room: '209B', status: 'dirty',    cleanSince: '06:40' },
  { id: 'msa-210a', unit: 'MS-A', room: '210A', status: 'clean',    },
  { id: 'msa-210b', unit: 'MS-A', room: '210B', status: 'clean',    },

  // MS-B — 18 beds
  { id: 'msb-211a', unit: 'MS-B', room: '211A', status: 'occupied', patientId: 'pt-061' },
  { id: 'msb-211b', unit: 'MS-B', room: '211B', status: 'occupied', patientId: 'pt-062' },
  { id: 'msb-212a', unit: 'MS-B', room: '212A', status: 'occupied', patientId: 'pt-063' },
  { id: 'msb-212b', unit: 'MS-B', room: '212B', status: 'occupied', patientId: 'pt-064' },
  { id: 'msb-213a', unit: 'MS-B', room: '213A', status: 'occupied', patientId: 'pt-065' },
  { id: 'msb-213b', unit: 'MS-B', room: '213B', status: 'occupied', patientId: 'pt-066' },
  { id: 'msb-214a', unit: 'MS-B', room: '214A', status: 'occupied', patientId: 'pt-067' },
  { id: 'msb-214b', unit: 'MS-B', room: '214B', status: 'occupied', patientId: 'pt-068' },
  { id: 'msb-215a', unit: 'MS-B', room: '215A', status: 'occupied', patientId: 'pt-069' },
  { id: 'msb-215b', unit: 'MS-B', room: '215B', status: 'occupied', patientId: 'pt-070' },
  { id: 'msb-216a', unit: 'MS-B', room: '216A', status: 'occupied', patientId: 'pt-071' },
  { id: 'msb-216b', unit: 'MS-B', room: '216B', status: 'occupied', patientId: 'pt-072' },
  { id: 'msb-217a', unit: 'MS-B', room: '217A', status: 'occupied', patientId: 'pt-073' },
  { id: 'msb-217b', unit: 'MS-B', room: '217B', status: 'clean',    },
  { id: 'msb-218a', unit: 'MS-B', room: '218A', status: 'dirty',    cleanSince: '06:25' },
  { id: 'msb-218b', unit: 'MS-B', room: '218B', status: 'clean',    },
  { id: 'msb-219a', unit: 'MS-B', room: '219A', status: 'blocked',  blockedReason: 'Deep clean — C. diff' },
  { id: 'msb-219b', unit: 'MS-B', room: '219B', status: 'clean',    },

  // Oncology — 12 beds  ← THE CRISIS UNIT
  { id: 'onc-501a', unit: 'Oncology', room: '501A', status: 'occupied',  patientId: 'pt-081' },
  { id: 'onc-501b', unit: 'Oncology', room: '501B', status: 'occupied',  patientId: 'pt-082' },
  { id: 'onc-502a', unit: 'Oncology', room: '502A', status: 'occupied',  patientId: 'pt-083' },
  { id: 'onc-502b', unit: 'Oncology', room: '502B', status: 'occupied',  patientId: 'pt-084' },
  { id: 'onc-503a', unit: 'Oncology', room: '503A', status: 'occupied',  patientId: 'pt-085' },
  { id: 'onc-503b', unit: 'Oncology', room: '503B', status: 'occupied',  patientId: 'pt-086' },
  { id: 'onc-504a', unit: 'Oncology', room: '504A', status: 'occupied',  patientId: 'pt-087' },
  { id: 'onc-504b', unit: 'Oncology', room: '504B', status: 'occupied',  patientId: 'pt-088' },
  { id: 'onc-505a', unit: 'Oncology', room: '505A', status: 'occupied',  patientId: 'pt-089' },
  { id: 'onc-505b', unit: 'Oncology', room: '505B', status: 'occupied',  patientId: 'pt-090' },
  { id: 'onc-506a', unit: 'Oncology', room: '506A', status: 'clean',     },
  { id: 'onc-506b', unit: 'Oncology', room: '506B', status: 'dirty',     cleanSince: '05:30' },

  // Telemetry — 14 beds
  { id: 'tel-601a', unit: 'Telemetry', room: '601A', status: 'occupied',   patientId: 'pt-091' },
  { id: 'tel-601b', unit: 'Telemetry', room: '601B', status: 'occupied',   patientId: 'pt-092' },
  { id: 'tel-602a', unit: 'Telemetry', room: '602A', status: 'occupied',   patientId: 'pt-093' },
  { id: 'tel-602b', unit: 'Telemetry', room: '602B', status: 'occupied',   patientId: 'pt-094' },
  { id: 'tel-603a', unit: 'Telemetry', room: '603A', status: 'occupied',   patientId: 'pt-095' },
  { id: 'tel-603b', unit: 'Telemetry', room: '603B', status: 'occupied',   patientId: 'pt-096' },
  { id: 'tel-604a', unit: 'Telemetry', room: '604A', status: 'occupied',   patientId: 'pt-097' },
  { id: 'tel-604b', unit: 'Telemetry', room: '604B', status: 'occupied',   patientId: 'pt-098' },
  { id: 'tel-605a', unit: 'Telemetry', room: '605A', status: 'occupied',   patientId: 'pt-099' },
  { id: 'tel-605b', unit: 'Telemetry', room: '605B', status: 'occupied',   patientId: 'pt-100' },
  { id: 'tel-606a', unit: 'Telemetry', room: '606A', status: 'occupied',   patientId: 'pt-101' },
  { id: 'tel-606b', unit: 'Telemetry', room: '606B', status: 'clean',      },
  { id: 'tel-607a', unit: 'Telemetry', room: '607A', status: 'dirty',      cleanSince: '06:55' },
  { id: 'tel-607b', unit: 'Telemetry', room: '607B', status: 'clean',      },
]

// ── Patients ──────────────────────────────────────────────────────────────────

const _patients: Patient[] = [
  // ICU (8 occupied)
  { id:'pt-001', unit:'ICU', room:'401A', lastName:'Chen',      firstInitial:'M', diagnosis:'Septic shock — Klebsiella BSI',     acuity:5, los:3, admitDate:'Mar 10', disposition:'watchlist',       isolation:'Contact', attendingMd:'Dr. Patel',   flags:['dnr','high-acuity','pending-labs'] },
  { id:'pt-002', unit:'ICU', room:'401B', lastName:'Davis',     firstInitial:'R', diagnosis:'Post-CABG Day 2 — 3-vessel disease',acuity:4, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Rashid',  flags:['dnr','fall-risk'] },
  { id:'pt-003', unit:'ICU', room:'402A', lastName:'Wilson',    firstInitial:'J', diagnosis:'DKA — insulin drip',               acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Nguyen',  flags:['pending-labs'] },
  { id:'pt-004', unit:'ICU', room:'402B', lastName:'Moore',     firstInitial:'P', diagnosis:'Acute respiratory failure — ARDS', acuity:5, los:4, admitDate:'Mar 9',  disposition:'watchlist',       isolation:'Droplet', attendingMd:'Dr. Klein',   flags:['high-acuity','dnr'] },
  { id:'pt-005', unit:'ICU', room:'403A', lastName:'Taylor',    firstInitial:'A', diagnosis:'Intracranial hemorrhage',           acuity:5, los:1, admitDate:'Mar 12', disposition:'watchlist',       attendingMd:'Dr. Patel',   flags:['high-acuity'] },
  { id:'pt-006', unit:'ICU', room:'403B', lastName:'Anderson',  firstInitial:'S', diagnosis:'Cardiogenic shock — acute MI',     acuity:5, los:5, admitDate:'Mar 8',  disposition:'upgrade',         attendingMd:'Dr. Rashid',  flags:['high-acuity','pending-labs'] },
  { id:'pt-007', unit:'ICU', room:'404A', lastName:'Jackson',   firstInitial:'L', diagnosis:'Status epilepticus',                acuity:4, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Nguyen',  flags:['fall-risk'] },
  { id:'pt-008', unit:'ICU', room:'404B', lastName:'White',     firstInitial:'K', diagnosis:'Aortic dissection Type B',          acuity:5, los:6, admitDate:'Mar 7',  disposition:'stable',           attendingMd:'Dr. Klein',   flags:['high-acuity'] },

  // CCU (6 occupied)
  { id:'pt-011', unit:'CCU', room:'301A', lastName:'Martinez',  firstInitial:'E', diagnosis:'NSTEMI — troponin trend up',       acuity:4, los:1, admitDate:'Mar 12', disposition:'stable',           attendingMd:'Dr. Rashid',  flags:['pending-labs'] },
  { id:'pt-012', unit:'CCU', room:'301B', lastName:'Thompson',  firstInitial:'D', diagnosis:'CHF exacerbation — EF 15%',        acuity:4, los:3, admitDate:'Mar 10', disposition:'watchlist',       attendingMd:'Dr. Klein',   flags:['high-acuity'] },
  { id:'pt-013', unit:'CCU', room:'302A', lastName:'Garcia',    firstInitial:'C', diagnosis:'Atrial fibrillation + RVR',        acuity:3, los:2, admitDate:'Mar 11', disposition:'discharge-today',  dcTime:'14:00', attendingMd:'Dr. Patel', flags:[] },
  { id:'pt-014', unit:'CCU', room:'302B', lastName:'Robinson',  firstInitial:'F', diagnosis:'Complete heart block — pacemaker', acuity:4, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Rashid',  flags:[] },
  { id:'pt-015', unit:'CCU', room:'303A', lastName:'Lewis',     firstInitial:'B', diagnosis:'Hypertensive emergency — BP 220/130',acuity:3, los:1, admitDate:'Mar 12',disposition:'discharge-today',  dcTime:'16:00', attendingMd:'Dr. Klein', flags:['pending-labs'] },
  { id:'pt-016', unit:'CCU', room:'303B', lastName:'Walker',    firstInitial:'H', diagnosis:'Pulmonary embolism — submassive',  acuity:4, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Nguyen',  flags:['fall-risk'] },

  // ED (14 occupied)
  { id:'pt-021', unit:'ED', room:'R01', lastName:'Hall',        firstInitial:'N', diagnosis:'Chest pain — ruling out ACS',     acuity:3, los:0, admitDate:'Mar 13', disposition:'pending-discharge',  attendingMd:'Dr. Nguyen', flags:['pending-labs'] },
  { id:'pt-022', unit:'ED', room:'R02', lastName:'Young',       firstInitial:'G', diagnosis:'SOB — new O₂ requirement',        acuity:3, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Patel',  flags:['pending-labs'] },
  { id:'pt-023', unit:'ED', room:'R03', lastName:'King',        firstInitial:'R', diagnosis:'MVC — head CT pending',            acuity:4, los:0, admitDate:'Mar 13', disposition:'watchlist',          attendingMd:'Dr. Klein',  flags:['high-acuity','pending-labs'] },
  { id:'pt-024', unit:'ED', room:'R04', lastName:'Wright',      firstInitial:'S', diagnosis:'Acute abdomen — appendicitis',     acuity:4, los:0, admitDate:'Mar 13', disposition:'stable',             attendingMd:'Dr. Rashid', flags:['consult'] },
  { id:'pt-025', unit:'ED', room:'R05', lastName:'Scott',       firstInitial:'A', diagnosis:'Syncope — unknown etiology',       acuity:2, los:0, admitDate:'Mar 13', disposition:'discharge-today',    dcTime:'11:00', attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-026', unit:'ED', room:'R06', lastName:'Green',       firstInitial:'T', diagnosis:'Cellulitis — left lower extremity',acuity:2, los:0, admitDate:'Mar 13', disposition:'discharge-today',   dcTime:'12:00', attendingMd:'Dr. Patel', flags:[] },
  { id:'pt-027', unit:'ED', room:'R07', lastName:'Adams',       firstInitial:'C', diagnosis:'Stroke — LKW 45min ago',          acuity:5, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Klein',  flags:['high-acuity'] },
  { id:'pt-028', unit:'ED', room:'R08', lastName:'Baker',       firstInitial:'M', diagnosis:'Sepsis — source unknown',          acuity:4, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Rashid', flags:['high-acuity','pending-labs'] },
  { id:'pt-029', unit:'ED', room:'R09', lastName:'Gonzalez',    firstInitial:'J', diagnosis:'Pneumonia — O₂ sat 88%',          acuity:3, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Nguyen', flags:['pending-labs'] },
  { id:'pt-030', unit:'ED', room:'R10', lastName:'Nelson',      firstInitial:'P', diagnosis:'Alcohol withdrawal — seizure risk',acuity:3, los:0, admitDate:'Mar 13', disposition:'stable',             attendingMd:'Dr. Patel',  flags:['fall-risk'] },
  { id:'pt-031', unit:'ED', room:'R11', lastName:'Carter',      firstInitial:'L', diagnosis:'Hip fracture — pre-op prep',      acuity:3, los:0, admitDate:'Mar 13', disposition:'stable',             attendingMd:'Dr. Klein',  flags:['fall-risk','consult'] },
  { id:'pt-032', unit:'ED', room:'R12', lastName:'Mitchell',    firstInitial:'K', diagnosis:'Diabetic foot ulcer — infection', acuity:2, los:0, admitDate:'Mar 13', disposition:'stable',             attendingMd:'Dr. Rashid', flags:['consult'] },
  { id:'pt-033', unit:'ED', room:'R13', lastName:'Perez',       firstInitial:'Y', diagnosis:'Acute pancreatitis — lipase 3800',acuity:4, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Nguyen', flags:['pending-labs'] },
  { id:'pt-034', unit:'ED', room:'R14', lastName:'Roberts',     firstInitial:'D', diagnosis:'GI bleed — hemoglobin 6.4',       acuity:4, los:0, admitDate:'Mar 13', disposition:'upgrade',            attendingMd:'Dr. Patel',  flags:['high-acuity','pending-labs'] },

  // MS-A (16 occupied)
  { id:'pt-041', unit:'MS-A', room:'201A', lastName:'Turner',   firstInitial:'W', diagnosis:'Pneumonia — improving, Day 4',    acuity:2, los:4, admitDate:'Mar 9',  disposition:'discharge-today',  dcTime:'12:00', attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-042', unit:'MS-A', room:'201B', lastName:'Phillips', firstInitial:'B', diagnosis:'UTI + urosepsis — improving',     acuity:2, los:3, admitDate:'Mar 10', disposition:'discharge-today',  dcTime:'14:00', attendingMd:'Dr. Klein',  flags:['pending-labs'] },
  { id:'pt-043', unit:'MS-A', room:'202A', lastName:'Campbell', firstInitial:'R', diagnosis:'CHF — diuresing, Day 5',          acuity:3, los:5, admitDate:'Mar 8',  disposition:'stable',           attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-044', unit:'MS-A', room:'202B', lastName:'Parker',   firstInitial:'C', diagnosis:'Hip ORIF — PT/OT consult',        acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Patel',  flags:['fall-risk'] },
  { id:'pt-045', unit:'MS-A', room:'203A', lastName:'Evans',    firstInitial:'J', diagnosis:'Cellulitis — IV antibiotics',     acuity:2, los:3, admitDate:'Mar 10', disposition:'discharge-today',  dcTime:'16:00', attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-046', unit:'MS-A', room:'203B', lastName:'Edwards',  firstInitial:'M', diagnosis:'COPD exacerbation — improving',   acuity:3, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Klein',  flags:['fall-risk'] },
  { id:'pt-047', unit:'MS-A', room:'204A', lastName:'Collins',  firstInitial:'A', diagnosis:'GI bleed — hemoglobin stable',    acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Rashid', flags:['pending-labs'] },
  { id:'pt-048', unit:'MS-A', room:'204B', lastName:'Stewart',  firstInitial:'T', diagnosis:'Dehydration — elderly, fall risk', acuity:2, los:1, admitDate:'Mar 12', disposition:'stable',          attendingMd:'Dr. Patel',  flags:['fall-risk'] },
  { id:'pt-049', unit:'MS-A', room:'205A', lastName:'Sanchez',  firstInitial:'L', diagnosis:'DVT — anticoagulation initiated', acuity:2, los:2, admitDate:'Mar 11', disposition:'discharge-today',  dcTime:'15:00', attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-050', unit:'MS-A', room:'205B', lastName:'Morris',   firstInitial:'G', diagnosis:'Acute kidney injury — improving', acuity:3, los:3, admitDate:'Mar 10', disposition:'stable',           attendingMd:'Dr. Klein',  flags:['pending-labs'] },
  { id:'pt-051', unit:'MS-A', room:'206A', lastName:'Rogers',   firstInitial:'E', diagnosis:'Hypertensive urgency — BP controlled',acuity:2, los:2, admitDate:'Mar 11',disposition:'stable',        attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-052', unit:'MS-A', room:'206B', lastName:'Reed',     firstInitial:'F', diagnosis:'Alcohol hepatitis — improving',   acuity:3, los:5, admitDate:'Mar 8',  disposition:'stable',           attendingMd:'Dr. Patel',  flags:['fall-risk'] },
  { id:'pt-053', unit:'MS-A', room:'207A', lastName:'Cook',     firstInitial:'V', diagnosis:'Anemia — iron infusion series',   acuity:2, los:1, admitDate:'Mar 12', disposition:'discharge-today',  dcTime:'13:00', attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-054', unit:'MS-A', room:'207B', lastName:'Morgan',   firstInitial:'H', diagnosis:'Syncope — EP study ordered',      acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Klein',  flags:['fall-risk','consult'] },
  { id:'pt-055', unit:'MS-A', room:'208A', lastName:'Bell',     firstInitial:'I', diagnosis:'Pyelonephritis — improving',      acuity:2, los:3, admitDate:'Mar 10', disposition:'discharge-today',  dcTime:'11:00', attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-056', unit:'MS-A', room:'208B', lastName:'Murphy',   firstInitial:'O', diagnosis:'Chest pain — musculoskeletal',    acuity:1, los:1, admitDate:'Mar 12', disposition:'discharge-today',  dcTime:'10:30', attendingMd:'Dr. Patel', flags:[] },

  // MS-B (13 occupied)
  { id:'pt-061', unit:'MS-B', room:'211A', lastName:'Bailey',   firstInitial:'P', diagnosis:'TKR post-op — Day 2',             acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Klein',  flags:['fall-risk','consult'] },
  { id:'pt-062', unit:'MS-B', room:'211B', lastName:'Rivera',   firstInitial:'Q', diagnosis:'Hernia repair — Day 1',           acuity:2, los:1, admitDate:'Mar 12', disposition:'discharge-today',  dcTime:'13:00', attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-063', unit:'MS-B', room:'212A', lastName:'Cooper',   firstInitial:'U', diagnosis:'Pancreatitis — improving',        acuity:3, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Patel',  flags:['pending-labs'] },
  { id:'pt-064', unit:'MS-B', room:'212B', lastName:'Richardson',firstInitial:'Z',diagnosis:'Pneumonia — persistent fever',    acuity:3, los:5, admitDate:'Mar 8',  disposition:'stable',           attendingMd:'Dr. Nguyen', flags:['pending-labs'] },
  { id:'pt-065', unit:'MS-B', room:'213A', lastName:'Cox',      firstInitial:'X', diagnosis:'CVA — stable, PT/OT daily',       acuity:3, los:7, admitDate:'Mar 6',  disposition:'stable',           attendingMd:'Dr. Klein',  flags:['fall-risk'] },
  { id:'pt-066', unit:'MS-B', room:'213B', lastName:'Howard',   firstInitial:'Y', diagnosis:'Appendectomy — Day 2',            acuity:2, los:2, admitDate:'Mar 11', disposition:'discharge-today',  dcTime:'14:00', attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-067', unit:'MS-B', room:'214A', lastName:'Ward',     firstInitial:'A', diagnosis:'Cholecystitis — laparoscopic',    acuity:3, los:3, admitDate:'Mar 10', disposition:'stable',           attendingMd:'Dr. Patel',  flags:[] },
  { id:'pt-068', unit:'MS-B', room:'214B', lastName:'Torres',   firstInitial:'B', diagnosis:'Colitis — steroid taper',         acuity:2, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Nguyen', flags:[] },
  { id:'pt-069', unit:'MS-B', room:'215A', lastName:'Peterson', firstInitial:'C', diagnosis:'Wound infection — debridement',   acuity:3, los:6, admitDate:'Mar 7',  disposition:'stable',           isolation:'Contact', attendingMd:'Dr. Klein', flags:['pending-labs'] },
  { id:'pt-070', unit:'MS-B', room:'215B', lastName:'Gray',     firstInitial:'D', diagnosis:'Diverticulitis — NPO, IV fluids', acuity:2, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-071', unit:'MS-B', room:'216A', lastName:'Ramirez',  firstInitial:'E', diagnosis:'Renal colic — stent placed',      acuity:2, los:1, admitDate:'Mar 12', disposition:'discharge-today',  dcTime:'15:00', attendingMd:'Dr. Patel', flags:[] },
  { id:'pt-072', unit:'MS-B', room:'216B', lastName:'James',    firstInitial:'F', diagnosis:'Hyponatremia — sodium correction', acuity:3, los:3, admitDate:'Mar 10', disposition:'stable',          attendingMd:'Dr. Nguyen', flags:['pending-labs'] },
  { id:'pt-073', unit:'MS-B', room:'217A', lastName:'Watson',   firstInitial:'G', diagnosis:'GERD + esophagitis — EGD done',  acuity:2, los:2, admitDate:'Mar 11', disposition:'discharge-today',  dcTime:'11:30', attendingMd:'Dr. Klein', flags:[] },

  // Oncology (10 occupied) ← CRISIS: 2 pending admits, only 1 expected DC
  { id:'pt-081', unit:'Oncology', room:'501A', lastName:'Brooks',    firstInitial:'H', diagnosis:'DLBCL — Cycle 4 R-CHOP Day 3',   acuity:3, los:3, admitDate:'Mar 10', disposition:'stable',           isolation:'Contact', attendingMd:'Dr. Sanjay', flags:['pending-labs'] },
  { id:'pt-082', unit:'Oncology', room:'501B', lastName:'Kelly',     firstInitial:'I', diagnosis:'AML — induction chemo neutropenic',acuity:4, los:8, admitDate:'Mar 5',  disposition:'watchlist',       isolation:'Contact', attendingMd:'Dr. Sanjay', flags:['high-acuity','pending-labs'] },
  { id:'pt-083', unit:'Oncology', room:'502A', lastName:'Sanders',   firstInitial:'J', diagnosis:'Breast CA — Cycle 3 AC-T',        acuity:2, los:2, admitDate:'Mar 11', disposition:'discharge-today',  dcTime:'15:00', attendingMd:'Dr. Sanjay', flags:[] },
  { id:'pt-084', unit:'Oncology', room:'502B', lastName:'Price',     firstInitial:'K', diagnosis:'Lung CA — chemo-induced pneumonitis',acuity:4, los:5, admitDate:'Mar 8', disposition:'watchlist',       isolation:'Droplet', attendingMd:'Dr. Sanjay', flags:['high-acuity'] },
  { id:'pt-085', unit:'Oncology', room:'503A', lastName:'Bennett',   firstInitial:'L', diagnosis:'Colon CA — post-op Day 3',        acuity:3, los:3, admitDate:'Mar 10', disposition:'stable',           attendingMd:'Dr. Sanjay', flags:[] },
  { id:'pt-086', unit:'Oncology', room:'503B', lastName:'Wood',      firstInitial:'M', diagnosis:'Multiple myeloma — hypercalcemia', acuity:3, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Sanjay', flags:['pending-labs'] },
  { id:'pt-087', unit:'Oncology', room:'504A', lastName:'Barnes',    firstInitial:'N', diagnosis:'Lymphoma — PICC line infection',   acuity:4, los:6, admitDate:'Mar 7',  disposition:'watchlist',       isolation:'Contact', attendingMd:'Dr. Sanjay', flags:['high-acuity','pending-labs'] },
  { id:'pt-088', unit:'Oncology', room:'504B', lastName:'Ross',      firstInitial:'O', diagnosis:'Ovarian CA — malignant ascites',   acuity:3, los:9, admitDate:'Mar 4',  disposition:'stable',           attendingMd:'Dr. Sanjay', flags:['consult'] },
  { id:'pt-089', unit:'Oncology', room:'505A', lastName:'Henderson', firstInitial:'P', diagnosis:'Prostate CA — bone pain crisis',   acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Sanjay', flags:['fall-risk'] },
  { id:'pt-090', unit:'Oncology', room:'505B', lastName:'Coleman',   firstInitial:'Q', diagnosis:'Pancreatic CA — pain management',  acuity:3, los:11,admitDate:'Mar 2',  disposition:'stable',           attendingMd:'Dr. Sanjay', flags:['consult'] },

  // Telemetry (11 occupied)
  { id:'pt-091', unit:'Telemetry', room:'601A', lastName:'Jenkins', firstInitial:'R', diagnosis:'Atrial flutter — rate control',    acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Rashid', flags:[] },
  { id:'pt-092', unit:'Telemetry', room:'601B', lastName:'Perry',   firstInitial:'S', diagnosis:'V-tach — EP consult pending',      acuity:4, los:1, admitDate:'Mar 12', disposition:'watchlist',       attendingMd:'Dr. Klein',  flags:['high-acuity','consult'] },
  { id:'pt-093', unit:'Telemetry', room:'602A', lastName:'Powell',  firstInitial:'T', diagnosis:'NSTEMI — medically managed',       acuity:3, los:3, admitDate:'Mar 10', disposition:'discharge-today',  dcTime:'13:00', attendingMd:'Dr. Rashid', flags:['pending-labs'] },
  { id:'pt-094', unit:'Telemetry', room:'602B', lastName:'Long',    firstInitial:'U', diagnosis:'Syncope — holter confirmed VT',    acuity:4, los:2, admitDate:'Mar 11', disposition:'watchlist',       attendingMd:'Dr. Klein',  flags:['high-acuity'] },
  { id:'pt-095', unit:'Telemetry', room:'603A', lastName:'Patterson',firstInitial:'V',diagnosis:'CHF — BiPAP overnight, weaning',   acuity:4, los:4, admitDate:'Mar 9',  disposition:'stable',           attendingMd:'Dr. Rashid', flags:['pending-labs'] },
  { id:'pt-096', unit:'Telemetry', room:'603B', lastName:'Hughes',  firstInitial:'W', diagnosis:'Hypertensive emergency — resolving',acuity:3, los:1, admitDate:'Mar 12',disposition:'discharge-today',  dcTime:'12:00', attendingMd:'Dr. Klein', flags:[] },
  { id:'pt-097', unit:'Telemetry', room:'604A', lastName:'Flores',  firstInitial:'X', diagnosis:'Cardiac tamponade — post-pericardiocentesis',acuity:4, los:3, admitDate:'Mar 10', disposition:'stable', attendingMd:'Dr. Rashid', flags:['high-acuity'] },
  { id:'pt-098', unit:'Telemetry', room:'604B', lastName:'Washington',firstInitial:'Y',diagnosis:'WPW — ablation tomorrow',         acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Klein',  flags:[] },
  { id:'pt-099', unit:'Telemetry', room:'605A', lastName:'Butler',  firstInitial:'Z', diagnosis:'Bradycardia — pacemaker consult',  acuity:3, los:1, admitDate:'Mar 12', disposition:'stable',           attendingMd:'Dr. Rashid', flags:['consult'] },
  { id:'pt-100', unit:'Telemetry', room:'605B', lastName:'Simmons', firstInitial:'A', diagnosis:'SVT — cardioverted, stable',       acuity:2, los:1, admitDate:'Mar 12', disposition:'discharge-today',  dcTime:'14:00', attendingMd:'Dr. Klein', flags:[] },
  { id:'pt-101', unit:'Telemetry', room:'606A', lastName:'Foster',  firstInitial:'B', diagnosis:'AFIB + RVR — amiodarone loading',  acuity:3, los:2, admitDate:'Mar 11', disposition:'stable',           attendingMd:'Dr. Rashid', flags:['pending-labs'] },
]

// ── ADT Events ────────────────────────────────────────────────────────────────

let _adtEvents: AdtEvent[] = [
  // Completed today
  { id:'adt-001', type:'admission',     isPending:false, patientDisplay:'Taylor, A.',    unit:'ICU',       room:'403A', time:'01:48 AM', diagnosis:'Intracranial hemorrhage', acuity:5 },
  { id:'adt-002', type:'admission',     isPending:false, patientDisplay:'Martinez, E.',  unit:'CCU',       room:'301A', time:'03:22 AM', diagnosis:'NSTEMI', acuity:4 },
  { id:'adt-003', type:'discharge',     isPending:false, patientDisplay:'Murphy, O.',    unit:'MS-A',      room:'208B', time:'07:05 AM', note:'DC to home with follow-up' },
  { id:'adt-004', type:'admission',     isPending:false, patientDisplay:'Adams, C.',     unit:'ED',        room:'R07',  time:'06:32 AM', diagnosis:'Stroke — LKW 45min', acuity:5 },
  { id:'adt-005', type:'transfer-in',   isPending:false, patientDisplay:'Young, G.',     unit:'ED',        room:'R02',  time:'07:10 AM', diagnosis:'SOB', fromUnit:'Telemetry' as UnitKey, acuity:3 },
  { id:'adt-006', type:'discharge',     isPending:false, patientDisplay:'Bell, I.',      unit:'MS-A',      room:'208A', time:'07:48 AM', note:'Home — oral antibiotics' },

  // Pending (confirmed)
  { id:'adt-007', type:'pending-admit', isPending:true,  patientDisplay:'Nguyen, T.',    unit:'Oncology',  time:'~10:00 AM', diagnosis:'ALL — relapse, cycle 1 chemo', acuity:4,  note:'Bed 506A — housekeeping in progress' },
  { id:'adt-008', type:'pending-admit', isPending:true,  patientDisplay:'Ortiz, M.',     unit:'Oncology',  time:'~13:00 PM', diagnosis:'Lymphoma — neutropenic fever', acuity:4,  note:'Pending bed 506B — dirty → transfer' },
  { id:'adt-009', type:'pending-admit', isPending:true,  patientDisplay:'Reyes, K.',     unit:'ICU',       time:'~11:00 AM', diagnosis:'Trauma — MVC, intubated', acuity:5,         note:'From ED trauma bay — OR first' },
  { id:'adt-010', type:'pending-admit', isPending:true,  patientDisplay:'Khan, S.',      unit:'MS-A',      time:'~12:00 PM', diagnosis:'Pneumonia from ED', acuity:3,                note:'Awaiting bed 209A clean' },
  { id:'adt-011', type:'pending-admit', isPending:true,  patientDisplay:'Vasquez, C.',   unit:'Telemetry', time:'~14:00 PM', diagnosis:'CHF — admission from clinic', acuity:3,     note:'Bed 607B ready' },
  { id:'adt-012', type:'pending-dc',    isPending:true,  patientDisplay:'Garcia, C.',    unit:'CCU',       room:'302A', time:'~14:00 PM', note:'Scripts sent · Family driving in' },
  { id:'adt-013', type:'pending-dc',    isPending:true,  patientDisplay:'Lewis, B.',     unit:'CCU',       room:'303A', time:'~16:00 PM', note:'Repeat BP check at 15:00' },
  { id:'adt-014', type:'pending-dc',    isPending:true,  patientDisplay:'Sanders, J.',   unit:'Oncology',  room:'502A', time:'~15:00 PM', note:'Education complete · pharmacy reviewing' },
  { id:'adt-015', type:'transfer-out',  isPending:true,  patientDisplay:'Anderson, S.',  unit:'ICU',       room:'403B', time:'~13:00 PM', toUnit:'CCU' as UnitKey, note:'Upgraded — hemodynamically stable' },
]

// ── Unit census derived ───────────────────────────────────────────────────────

const UNIT_META: Record<UnitKey, { label: string; floor: string; totalBeds: number; maxRatio: string; staffOnDuty: number; requiredStaff: number; color: string; bgLight: string }> = {
  ICU:       { label:'ICU',       floor:'4th Floor',  totalBeds:10, maxRatio:'2:1', staffOnDuty:5, requiredStaff:5, color:'bg-red-500',    bgLight:'bg-red-50' },
  CCU:       { label:'CCU',       floor:'3rd Floor',  totalBeds:8,  maxRatio:'2:1', staffOnDuty:4, requiredStaff:4, color:'bg-orange-500', bgLight:'bg-orange-50' },
  ED:        { label:'ED',        floor:'1st Floor',  totalBeds:20, maxRatio:'4:1', staffOnDuty:5, requiredStaff:5, color:'bg-purple-500', bgLight:'bg-purple-50' },
  'MS-A':    { label:'MS-A',      floor:'2nd Floor',  totalBeds:20, maxRatio:'5:1', staffOnDuty:4, requiredStaff:4, color:'bg-sky-500',    bgLight:'bg-sky-50' },
  'MS-B':    { label:'MS-B',      floor:'2nd Floor',  totalBeds:18, maxRatio:'5:1', staffOnDuty:3, requiredStaff:3, color:'bg-teal-500',   bgLight:'bg-teal-50' },
  Oncology:  { label:'Oncology',  floor:'5th Floor',  totalBeds:12, maxRatio:'3:1', staffOnDuty:3, requiredStaff:4, color:'bg-violet-500', bgLight:'bg-violet-50' },
  Telemetry: { label:'Telemetry', floor:'6th Floor',  totalBeds:14, maxRatio:'4:1', staffOnDuty:3, requiredStaff:3, color:'bg-amber-500',  bgLight:'bg-amber-50' },
}

export function getUnitCensus(): UnitCensus[] {
  const units: UnitKey[] = ['ICU','CCU','ED','MS-A','MS-B','Oncology','Telemetry']
  return units.map(unit => {
    const beds    = _beds.filter(b => b.unit === unit)
    const meta    = UNIT_META[unit]
    const occupied   = beds.filter(b => b.status === 'occupied').length
    const clean      = beds.filter(b => b.status === 'clean').length
    const dirty      = beds.filter(b => b.status === 'dirty').length
    const blocked    = beds.filter(b => b.status === 'blocked').length
    const isolation  = beds.filter(b => b.status === 'isolation').length
    const patients   = _patients.filter(p => p.unit === unit)
    const avgAcuity  = patients.length
      ? Math.round((patients.reduce((s,p) => s + p.acuity, 0) / patients.length) * 10) / 10
      : 0

    const pendingAdmissions = _adtEvents.filter(e => e.isPending && (e.type === 'pending-admit') && e.unit === unit).length
    const expectedDischarges= patients.filter(p => p.disposition === 'discharge-today' || p.disposition === 'pending-discharge').length
    const projectedOccupied = occupied + pendingAdmissions - expectedDischarges

    // ratio check: patientsPerNurse = first number (e.g. "3:1" → 3 patients per nurse)
    const patientsPerNurse = parseInt(meta.maxRatio.split(':')[0])
    const requiredNow      = Math.ceil(occupied           / patientsPerNurse)
    const requiredProjected= Math.ceil(projectedOccupied / patientsPerNurse)
    const ratioCompliant   = meta.staffOnDuty >= requiredNow
    const projectedCompliant = meta.staffOnDuty >= requiredProjected

    return {
      unit, ...meta,
      occupied, clean, dirty, blocked, isolation, avgAcuity,
      pendingAdmissions, expectedDischarges, projectedOccupied,
      requiredStaff: requiredProjected,
      ratioCompliant, projectedCompliant,
    }
  })
}

export function getPatients(): Patient[]                            { return _patients }
export function getPatientsByUnit(unit: UnitKey): Patient[]        { return _patients.filter(p => p.unit === unit) }
export function getBeds(): Bed[]                                    { return _beds }
export function getBedsByUnit(unit: UnitKey): Bed[]                { return _beds.filter(b => b.unit === unit) }
export function getAdtEvents(): AdtEvent[]                         { return _adtEvents }
export function getPendingAdt(): AdtEvent[]                        { return _adtEvents.filter(e => e.isPending) }

export function getHospitalStats() {
  const all = getUnitCensus()
  const totalBeds  = all.reduce((s,u) => s + u.totalBeds, 0)
  const occupied   = all.reduce((s,u) => s + u.occupied, 0)
  const available  = all.reduce((s,u) => s + u.clean + u.dirty, 0)
  const pendingAdmits = all.reduce((s,u) => s + u.pendingAdmissions, 0)
  const expectedDc = all.reduce((s,u) => s + u.expectedDischarges, 0)
  const atRisk     = all.filter(u => !u.projectedCompliant).length
  return { totalBeds, occupied, available, pendingAdmits, expectedDc, atRisk, units: all.length }
}

export function markDischargeReady(patientId: string) {
  const pt = _patients.find(p => p.id === patientId)
  if (pt) pt.disposition = 'discharge-today'
}

export function updateAcuity(patientId: string, acuity: Acuity) {
  const pt = _patients.find(p => p.id === patientId)
  if (pt) pt.acuity = acuity
}

export function requestFloat(unit: UnitKey, note: string) {
  _adtEvents.unshift({
    id: `float-req-${Date.now()}`,
    type: 'pending-admit',
    isPending: false,
    patientDisplay: '—',
    unit,
    time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    note: `Float requested: ${note}`,
  })
}

export const UNIT_COLORS: Record<UnitKey, { dot: string; badge: string; border: string; text: string }> = {
  ICU:       { dot:'bg-red-500',    badge:'bg-red-100 text-red-700',       border:'border-red-200',    text:'text-red-700' },
  CCU:       { dot:'bg-orange-500', badge:'bg-orange-100 text-orange-700', border:'border-orange-200', text:'text-orange-700' },
  ED:        { dot:'bg-purple-500', badge:'bg-purple-100 text-purple-700', border:'border-purple-200', text:'text-purple-700' },
  'MS-A':    { dot:'bg-sky-500',    badge:'bg-sky-100 text-sky-700',       border:'border-sky-200',    text:'text-sky-700' },
  'MS-B':    { dot:'bg-teal-500',   badge:'bg-teal-100 text-teal-700',     border:'border-teal-200',   text:'text-teal-700' },
  Oncology:  { dot:'bg-violet-500', badge:'bg-violet-100 text-violet-700', border:'border-violet-200', text:'text-violet-700' },
  Telemetry: { dot:'bg-amber-500',  badge:'bg-amber-100 text-amber-700',   border:'border-amber-200',  text:'text-amber-700' },
}

export const UNITS_ORDER: UnitKey[] = ['ICU','CCU','ED','MS-A','MS-B','Oncology','Telemetry']
