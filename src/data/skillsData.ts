// ── Clinical Competency & Float Intelligence ─────────────────────────────────

export type UnitKey = 'ICU' | 'CCU' | 'ED' | 'MS-A' | 'MS-B' | 'Oncology' | 'Telemetry'
export type CompStatus = 'primary' | 'verified' | 'in-progress' | 'expired' | 'none'

export interface Competency {
  unit:          UnitKey
  status:        CompStatus
  verifiedDate?: string
  expiryDate?:   string
  verifiedBy?:   string
  floatCount:    number
  lastFloat?:    string
  notes?:        string
}

export interface SkillsStaff {
  id:           string
  name:         string
  initials:     string
  color:        string
  role:         string
  primaryUnit:  UnitKey
  yearsExp:     number
  certifications: string[]
  competencies: Record<UnitKey, Competency>
  floatScore:   number   // 0-100 composite readiness
  crossTrainGoal?: UnitKey
}

export interface CrossTrainEnrollment {
  id:         string
  staffId:    string
  staffName:  string
  initials:   string
  color:      string
  fromUnit:   UnitKey
  toUnit:     UnitKey
  startDate:  string
  targetDate: string
  progress:   number   // 0-100 %
  checkOffs:  { label: string; done: boolean }[]
  mentor:     string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function comp(
  unit: UnitKey,
  status: CompStatus,
  opts?: Partial<Omit<Competency, 'unit' | 'status'>>
): Competency {
  return { unit, status, floatCount: 0, ...opts }
}

function allNone(): Record<UnitKey, Competency> {
  return {
    ICU:      comp('ICU',      'none'),
    CCU:      comp('CCU',      'none'),
    ED:       comp('ED',       'none'),
    'MS-A':   comp('MS-A',     'none'),
    'MS-B':   comp('MS-B',     'none'),
    Oncology: comp('Oncology', 'none'),
    Telemetry:comp('Telemetry','none'),
  }
}

// ── Staff competency matrix (20 nurses) ──────────────────────────────────────

let _staff: SkillsStaff[] = [
  {
    id:'sk-001', name:'Priya Sharma',     initials:'PS', color:'from-violet-500 to-violet-700',
    role:'Charge RN', primaryUnit:'ICU', yearsExp:7, certifications:['CCRN','BLS','ACLS'],
    floatScore:88,
    competencies: { ...allNone(),
      ICU:       comp('ICU',       'primary',    { verifiedDate:'2024-01-15', verifiedBy:'DON', floatCount:0 }),
      CCU:       comp('CCU',       'verified',   { verifiedDate:'2023-06-10', expiryDate:'2025-06-10', verifiedBy:'Charge Mgr', floatCount:14, lastFloat:'Feb 28' }),
      Telemetry: comp('Telemetry', 'verified',   { verifiedDate:'2024-03-01', expiryDate:'2026-03-01', verifiedBy:'Charge Mgr', floatCount:6, lastFloat:'Jan 15' }),
      'MS-B':    comp('MS-B',      'in-progress',{ startedDate:'2025-01-10', notes:'Completing med-surg orientation week 6/8' } as never),
    },
  },
  {
    id:'sk-002', name:'James Okafor',     initials:'JO', color:'from-sky-500 to-sky-700',
    role:'RN', primaryUnit:'ICU', yearsExp:5, certifications:['CCRN','BLS','ACLS'],
    floatScore:72,
    competencies: { ...allNone(),
      ICU:       comp('ICU',       'primary',    { verifiedDate:'2023-03-22', floatCount:0 }),
      CCU:       comp('CCU',       'verified',   { verifiedDate:'2023-09-14', expiryDate:'2025-09-14', verifiedBy:'Charge Mgr', floatCount:9, lastFloat:'Mar 5' }),
      ED:        comp('ED',        'expired',    { verifiedDate:'2022-05-01', expiryDate:'2024-05-01', verifiedBy:'ED Charge', floatCount:3 }),
    },
  },
  {
    id:'sk-003', name:'Maria Santos',     initials:'MS', color:'from-rose-500 to-rose-700',
    role:'RN', primaryUnit:'ICU', yearsExp:4, certifications:['CCRN','BLS'],
    floatScore:55,
    competencies: { ...allNone(),
      ICU:       comp('ICU',       'primary',    { verifiedDate:'2024-02-01', floatCount:0 }),
      CCU:       comp('CCU',       'in-progress',{ notes:'Week 3 of 6 orientation' } as never),
    },
  },
  {
    id:'sk-004', name:'Rachel Torres',    initials:'RT', color:'from-indigo-500 to-indigo-700',
    role:'Charge RN', primaryUnit:'CCU', yearsExp:9, certifications:['CCRN','BLS','ACLS'],
    floatScore:91,
    competencies: { ...allNone(),
      CCU:       comp('CCU',       'primary',    { verifiedDate:'2021-06-01', floatCount:0 }),
      ICU:       comp('ICU',       'verified',   { verifiedDate:'2023-11-20', expiryDate:'2025-11-20', verifiedBy:'ICU Mgr', floatCount:22, lastFloat:'Mar 10' }),
      Telemetry: comp('Telemetry', 'verified',   { verifiedDate:'2024-01-15', expiryDate:'2026-01-15', verifiedBy:'Tele Charge', floatCount:11, lastFloat:'Feb 20' }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2024-06-01', expiryDate:'2026-06-01', verifiedBy:'MS Charge', floatCount:4, lastFloat:'Jan 8' }),
    },
  },
  {
    id:'sk-005', name:'Kevin Nguyen',     initials:'KN', color:'from-emerald-500 to-emerald-700',
    role:'RN', primaryUnit:'CCU', yearsExp:3, certifications:['BLS','ACLS'],
    floatScore:44,
    competencies: { ...allNone(),
      CCU:       comp('CCU',       'primary',    { verifiedDate:'2024-05-01', floatCount:0 }),
      Telemetry: comp('Telemetry', 'in-progress',{ notes:'Week 5 of 6 — final check-off due Mar 20' } as never),
    },
  },
  {
    id:'sk-006', name:'Angela White',     initials:'AW', color:'from-pink-500 to-pink-700',
    role:'RN', primaryUnit:'CCU', yearsExp:6, certifications:['CCRN','BLS','ACLS'],
    floatScore:78,
    competencies: { ...allNone(),
      CCU:       comp('CCU',       'primary',    { verifiedDate:'2022-08-01', floatCount:0 }),
      ICU:       comp('ICU',       'verified',   { verifiedDate:'2024-02-14', expiryDate:'2026-02-14', verifiedBy:'ICU Mgr', floatCount:7, lastFloat:'Mar 1' }),
      Telemetry: comp('Telemetry', 'verified',   { verifiedDate:'2023-10-01', expiryDate:'2025-10-01', verifiedBy:'Tele Charge', floatCount:18, lastFloat:'Mar 8' }),
    },
  },
  {
    id:'sk-007', name:'Nathan Foster',    initials:'NF', color:'from-orange-500 to-orange-700',
    role:'Charge RN', primaryUnit:'ED', yearsExp:8, certifications:['CEN','TNCC','BLS'],
    floatScore:60,
    competencies: { ...allNone(),
      ED:        comp('ED',        'primary',    { verifiedDate:'2020-03-01', floatCount:0 }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2023-07-01', expiryDate:'2025-07-01', verifiedBy:'MS Charge', floatCount:8, lastFloat:'Feb 14' }),
      'MS-B':    comp('MS-B',      'verified',   { verifiedDate:'2023-07-01', expiryDate:'2025-07-01', verifiedBy:'MS Charge', floatCount:6, lastFloat:'Jan 22' }),
    },
  },
  {
    id:'sk-008', name:'Fatima Hassan',    initials:'FH', color:'from-teal-500 to-teal-700',
    role:'RN', primaryUnit:'ED', yearsExp:5, certifications:['CEN','BLS','ACLS'],
    floatScore:68,
    competencies: { ...allNone(),
      ED:        comp('ED',        'primary',    { verifiedDate:'2022-09-01', floatCount:0 }),
      ICU:       comp('ICU',       'expired',    { verifiedDate:'2021-11-01', expiryDate:'2023-11-01', verifiedBy:'ICU Mgr', floatCount:2 }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2024-03-01', expiryDate:'2026-03-01', verifiedBy:'MS Charge', floatCount:12, lastFloat:'Mar 7' }),
    },
  },
  {
    id:'sk-009', name:'Carlos Rivera',    initials:'CR', color:'from-amber-500 to-amber-700',
    role:'RN', primaryUnit:'MS-A', yearsExp:4, certifications:['BLS'],
    floatScore:38,
    competencies: { ...allNone(),
      'MS-A':    comp('MS-A',      'primary',    { verifiedDate:'2024-01-10', floatCount:0 }),
      'MS-B':    comp('MS-B',      'verified',   { verifiedDate:'2024-01-10', expiryDate:'2026-01-10', verifiedBy:'MS Charge', floatCount:7, lastFloat:'Mar 12' }),
    },
  },
  {
    id:'sk-010', name:'Linda Chen',       initials:'LC', color:'from-cyan-500 to-cyan-700',
    role:'Charge RN', primaryUnit:'MS-A', yearsExp:11, certifications:['BLS','ACLS'],
    floatScore:82,
    competencies: { ...allNone(),
      'MS-A':    comp('MS-A',      'primary',    { verifiedDate:'2018-05-01', floatCount:0 }),
      'MS-B':    comp('MS-B',      'verified',   { verifiedDate:'2020-06-01', expiryDate:'2026-06-01', verifiedBy:'MS Charge', floatCount:31, lastFloat:'Mar 11' }),
      ED:        comp('ED',        'verified',   { verifiedDate:'2022-08-01', expiryDate:'2025-08-01', verifiedBy:'ED Charge', floatCount:5, lastFloat:'Jan 30' }),
      Telemetry: comp('Telemetry', 'expired',    { verifiedDate:'2021-03-01', expiryDate:'2023-03-01', verifiedBy:'Tele Charge', floatCount:8 }),
    },
  },
  {
    id:'sk-011', name:'Omar Reyes',       initials:'OR', color:'from-fuchsia-500 to-fuchsia-700',
    role:'RN', primaryUnit:'MS-A', yearsExp:2, certifications:['BLS'],
    floatScore:22,
    competencies: { ...allNone(),
      'MS-A':    comp('MS-A',      'primary',    { verifiedDate:'2025-01-20', floatCount:0 }),
      'MS-B':    comp('MS-B',      'in-progress',{ notes:'Week 2 of 6 orientation' } as never),
    },
  },
  {
    id:'sk-012', name:'Theresa Banks',    initials:'TB', color:'from-lime-500 to-lime-700',
    role:'RN', primaryUnit:'MS-B', yearsExp:6, certifications:['BLS','ACLS'],
    floatScore:70,
    competencies: { ...allNone(),
      'MS-B':    comp('MS-B',      'primary',    { verifiedDate:'2022-02-01', floatCount:0 }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2022-02-01', expiryDate:'2026-02-01', verifiedBy:'MS Charge', floatCount:19, lastFloat:'Mar 9' }),
      ED:        comp('ED',        'verified',   { verifiedDate:'2023-11-01', expiryDate:'2025-11-01', verifiedBy:'ED Charge', floatCount:4, lastFloat:'Feb 3' }),
    },
  },
  {
    id:'sk-013', name:'Sandra Kim',       initials:'SK', color:'from-red-500 to-red-700',
    role:'Charge RN', primaryUnit:'Oncology', yearsExp:13, certifications:['OCN','BLS','ACLS'],
    floatScore:48,
    competencies: { ...allNone(),
      Oncology:  comp('Oncology',  'primary',    { verifiedDate:'2015-08-01', floatCount:0 }),
      'MS-B':    comp('MS-B',      'verified',   { verifiedDate:'2023-05-01', expiryDate:'2025-05-01', verifiedBy:'MS Charge', floatCount:3, lastFloat:'Nov 14' }),
    },
  },
  {
    id:'sk-014', name:'Patricia Moore',   initials:'PM', color:'from-purple-500 to-purple-700',
    role:'RN', primaryUnit:'Oncology', yearsExp:5, certifications:['OCN','BLS'],
    floatScore:30,
    competencies: { ...allNone(),
      Oncology:  comp('Oncology',  'primary',    { verifiedDate:'2022-10-01', floatCount:0 }),
      'MS-B':    comp('MS-B',      'in-progress',{ notes:'Cross-training week 4 of 6' } as never),
    },
  },
  {
    id:'sk-015', name:'Daniel Park',      initials:'DP', color:'from-slate-500 to-slate-700',
    role:'RN', primaryUnit:'Telemetry', yearsExp:3, certifications:['BLS','ACLS'],
    floatScore:42,
    competencies: { ...allNone(),
      Telemetry: comp('Telemetry', 'primary',    { verifiedDate:'2023-12-01', floatCount:0 }),
      'MS-B':    comp('MS-B',      'verified',   { verifiedDate:'2024-05-01', expiryDate:'2026-05-01', verifiedBy:'MS Charge', floatCount:6, lastFloat:'Mar 6' }),
      CCU:       comp('CCU',       'expired',    { verifiedDate:'2022-06-01', expiryDate:'2024-06-01', verifiedBy:'CCU Charge', floatCount:1 }),
    },
  },
  {
    id:'sk-016', name:'Michelle Lee',     initials:'ML', color:'from-teal-400 to-teal-600',
    role:'RN', primaryUnit:'Telemetry', yearsExp:8, certifications:['BLS','ACLS','CCRN'],
    floatScore:85,
    competencies: { ...allNone(),
      Telemetry: comp('Telemetry', 'primary',    { verifiedDate:'2020-04-01', floatCount:0 }),
      CCU:       comp('CCU',       'verified',   { verifiedDate:'2023-04-01', expiryDate:'2025-04-01', verifiedBy:'CCU Charge', floatCount:16, lastFloat:'Mar 4' }),
      ICU:       comp('ICU',       'verified',   { verifiedDate:'2024-01-10', expiryDate:'2026-01-10', verifiedBy:'ICU Mgr', floatCount:8, lastFloat:'Feb 25' }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2022-09-01', expiryDate:'2026-09-01', verifiedBy:'MS Charge', floatCount:9, lastFloat:'Jan 19' }),
    },
  },
  {
    id:'sk-017', name:'Brian Wong',       initials:'BW', color:'from-yellow-500 to-yellow-700',
    role:'RN', primaryUnit:'Telemetry', yearsExp:2, certifications:['BLS'],
    floatScore:18,
    competencies: { ...allNone(),
      Telemetry: comp('Telemetry', 'primary',    { verifiedDate:'2025-02-01', floatCount:0 }),
    },
  },
  {
    id:'sk-018', name:'Grace Thompson',   initials:'GT', color:'from-rose-400 to-rose-600',
    role:'RN', primaryUnit:'CCU', yearsExp:6, certifications:['CCRN','BLS','ACLS'],
    floatScore:65,
    competencies: { ...allNone(),
      CCU:       comp('CCU',       'primary',    { verifiedDate:'2022-01-15', floatCount:0 }),
      ICU:       comp('ICU',       'expired',    { verifiedDate:'2021-09-01', expiryDate:'2023-09-01', verifiedBy:'ICU Mgr', floatCount:5 }),
      Telemetry: comp('Telemetry', 'verified',   { verifiedDate:'2024-06-15', expiryDate:'2026-06-15', verifiedBy:'Tele Charge', floatCount:10, lastFloat:'Mar 3' }),
    },
  },
  {
    id:'sk-019', name:'Victor Diaz',      initials:'VD', color:'from-green-500 to-green-700',
    role:'RN', primaryUnit:'ED', yearsExp:4, certifications:['CEN','BLS'],
    floatScore:50,
    competencies: { ...allNone(),
      ED:        comp('ED',        'primary',    { verifiedDate:'2023-08-01', floatCount:0 }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2024-02-01', expiryDate:'2026-02-01', verifiedBy:'MS Charge', floatCount:5, lastFloat:'Feb 18' }),
      'MS-B':    comp('MS-B',      'in-progress',{ notes:'Completing final skills checklist' } as never),
    },
  },
  {
    id:'sk-020', name:'Amy Johnson',      initials:'AJ', color:'from-indigo-400 to-indigo-600',
    role:'RN', primaryUnit:'MS-B', yearsExp:7, certifications:['BLS','ACLS'],
    floatScore:74,
    competencies: { ...allNone(),
      'MS-B':    comp('MS-B',      'primary',    { verifiedDate:'2021-11-01', floatCount:0 }),
      'MS-A':    comp('MS-A',      'verified',   { verifiedDate:'2021-11-01', expiryDate:'2025-11-01', verifiedBy:'MS Charge', floatCount:22, lastFloat:'Mar 13' }),
      Telemetry: comp('Telemetry', 'verified',   { verifiedDate:'2023-02-01', expiryDate:'2025-02-01', verifiedBy:'Tele Charge', floatCount:7, lastFloat:'Mar 2' }),
      ED:        comp('ED',        'in-progress',{ notes:'ED cross-training week 1 of 6' } as never),
    },
  },
]

// ── Cross-training enrollments ────────────────────────────────────────────────

let _crossTrain: CrossTrainEnrollment[] = [
  { id:'ct-001', staffId:'sk-001', staffName:'Priya Sharma',    initials:'PS', color:'from-violet-500 to-violet-700',
    fromUnit:'ICU', toUnit:'MS-B', startDate:'Jan 20', targetDate:'Mar 14',
    progress:75, mentor:'Linda Chen',
    checkOffs:[
      { label:'Unit orientation & safety', done:true },
      { label:'Medication administration', done:true },
      { label:'IV therapy skills',         done:true },
      { label:'Documentation competency',  done:false },
      { label:'Patient ratio management',  done:false },
      { label:'Final preceptor sign-off',  done:false },
    ]},
  { id:'ct-002', staffId:'sk-005', staffName:'Kevin Nguyen',    initials:'KN', color:'from-emerald-500 to-emerald-700',
    fromUnit:'CCU', toUnit:'Telemetry', startDate:'Feb 3', targetDate:'Mar 20',
    progress:83, mentor:'Michelle Lee',
    checkOffs:[
      { label:'Telemetry monitoring basics',  done:true },
      { label:'Arrhythmia recognition',       done:true },
      { label:'Rhythm strip documentation',   done:true },
      { label:'Emergency response protocols', done:true },
      { label:'Shift charge responsibilities',done:false },
      { label:'Final preceptor sign-off',     done:false },
    ]},
  { id:'ct-003', staffId:'sk-011', staffName:'Omar Reyes',      initials:'OR', color:'from-fuchsia-500 to-fuchsia-700',
    fromUnit:'MS-A', toUnit:'MS-B', startDate:'Feb 28', targetDate:'Apr 11',
    progress:33, mentor:'Amy Johnson',
    checkOffs:[
      { label:'Unit orientation & policies',  done:true },
      { label:'Medication administration',    done:true },
      { label:'IV therapy & wound care',      done:false },
      { label:'Documentation competency',     done:false },
      { label:'Patient assignment handoff',   done:false },
      { label:'Final preceptor sign-off',     done:false },
    ]},
  { id:'ct-004', staffId:'sk-014', staffName:'Patricia Moore',  initials:'PM', color:'from-purple-500 to-purple-700',
    fromUnit:'Oncology', toUnit:'MS-B', startDate:'Feb 10', targetDate:'Mar 25',
    progress:67, mentor:'Amy Johnson',
    checkOffs:[
      { label:'Unit orientation & policies',  done:true },
      { label:'Non-oncology medication admin',done:true },
      { label:'IV therapy skills',            done:true },
      { label:'Patient ratio management',     done:true },
      { label:'Documentation competency',     done:false },
      { label:'Final preceptor sign-off',     done:false },
    ]},
  { id:'ct-005', staffId:'sk-019', staffName:'Victor Diaz',     initials:'VD', color:'from-green-500 to-green-700',
    fromUnit:'ED', toUnit:'MS-B', startDate:'Mar 3', targetDate:'Apr 14',
    progress:17, mentor:'Theresa Banks',
    checkOffs:[
      { label:'Unit orientation & policies',  done:true },
      { label:'Medication administration',    done:false },
      { label:'IV therapy & wound care',      done:false },
      { label:'Documentation competency',     done:false },
      { label:'Patient assignment handoff',   done:false },
      { label:'Final preceptor sign-off',     done:false },
    ]},
  { id:'ct-006', staffId:'sk-020', staffName:'Amy Johnson',     initials:'AJ', color:'from-indigo-400 to-indigo-600',
    fromUnit:'MS-B', toUnit:'ED', startDate:'Mar 10', targetDate:'Apr 21',
    progress:17, mentor:'Nathan Foster',
    checkOffs:[
      { label:'ED orientation & triage basics', done:true },
      { label:'Emergency medication protocols', done:false },
      { label:'Trauma assessment skills',       done:false },
      { label:'Rapid assessment documentation', done:false },
      { label:'Code team participation',        done:false },
      { label:'Final preceptor sign-off',       done:false },
    ]},
]

// ── Computed stats ─────────────────────────────────────────────────────────────

export function getExpiringWithin(days: number): { staff: SkillsStaff; comp: Competency }[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  const results: { staff: SkillsStaff; comp: Competency }[] = []
  for (const s of _staff) {
    for (const c of Object.values(s.competencies)) {
      if (c.status === 'verified' && c.expiryDate) {
        const exp = new Date(c.expiryDate)
        if (exp <= cutoff) results.push({ staff: s, comp: c })
      }
    }
  }
  return results.sort((a, b) => new Date(a.comp.expiryDate!).getTime() - new Date(b.comp.expiryDate!).getTime())
}

export function getFloatCandidates(unit: UnitKey): SkillsStaff[] {
  return _staff
    .filter(s => s.competencies[unit].status === 'verified' && s.primaryUnit !== unit)
    .sort((a, b) => {
      // Sort: most floats to this unit first, then highest float score
      const ac = a.competencies[unit].floatCount
      const bc = b.competencies[unit].floatCount
      if (bc !== ac) return bc - ac
      return b.floatScore - a.floatScore
    })
}

// ── Selectors ─────────────────────────────────────────────────────────────────

export function getAllStaff(): SkillsStaff[] { return [..._staff] }
export function getCrossTraining(): CrossTrainEnrollment[] { return [..._crossTrain] }

export const UNITS: UnitKey[] = ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Oncology', 'Telemetry']

export const UNIT_META: Record<UnitKey, { color: string; bgLight: string; border: string; abbr: string }> = {
  ICU:       { color:'text-sky-700',    bgLight:'bg-sky-50',     border:'border-sky-300',    abbr:'ICU' },
  CCU:       { color:'text-indigo-700', bgLight:'bg-indigo-50',  border:'border-indigo-300', abbr:'CCU' },
  ED:        { color:'text-orange-700', bgLight:'bg-orange-50',  border:'border-orange-300', abbr:'ED' },
  'MS-A':    { color:'text-emerald-700',bgLight:'bg-emerald-50', border:'border-emerald-300',abbr:'MS-A' },
  'MS-B':    { color:'text-teal-700',   bgLight:'bg-teal-50',    border:'border-teal-300',   abbr:'MS-B' },
  Oncology:  { color:'text-violet-700', bgLight:'bg-violet-50',  border:'border-violet-300', abbr:'ONC' },
  Telemetry: { color:'text-pink-700',   bgLight:'bg-pink-50',    border:'border-pink-300',   abbr:'TELE' },
}

export const STATUS_META: Record<CompStatus, { label: string; short: string; bg: string; text: string; border: string; dot: string }> = {
  primary:    { label:'Primary Unit', short:'P',  bg:'bg-violet-100', text:'text-violet-700', border:'border-violet-300', dot:'bg-violet-500' },
  verified:   { label:'Verified',     short:'✓',  bg:'bg-emerald-100',text:'text-emerald-700',border:'border-emerald-300',dot:'bg-emerald-500' },
  'in-progress':{ label:'In Progress',short:'→', bg:'bg-amber-100',  text:'text-amber-700',  border:'border-amber-300',  dot:'bg-amber-500' },
  expired:    { label:'Expired',      short:'!',  bg:'bg-red-100',    text:'text-red-700',    border:'border-red-300',    dot:'bg-red-500' },
  none:       { label:'Not Trained',  short:'—',  bg:'bg-slate-100',  text:'text-slate-400',  border:'border-slate-200',  dot:'bg-slate-300' },
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function markVerified(staffId: string, unit: UnitKey, verifiedBy: string): void {
  const s = _staff.find(s => s.id === staffId)
  if (!s) return
  const today = new Date()
  const expiry = new Date(today)
  expiry.setFullYear(expiry.getFullYear() + 2)
  s.competencies[unit] = {
    unit, status: 'verified',
    verifiedDate: today.toISOString().slice(0, 10),
    expiryDate:   expiry.toISOString().slice(0, 10),
    verifiedBy, floatCount: s.competencies[unit].floatCount,
  }
}

export function enrollCrossTrain(staffId: string, unit: UnitKey, mentor: string): CrossTrainEnrollment {
  const s = _staff.find(s => s.id === staffId)!
  s.competencies[unit] = { unit, status: 'in-progress', floatCount: 0, notes: 'Week 1 of 6 orientation' }
  const today = new Date()
  const target = new Date(today)
  target.setDate(target.getDate() + 42)
  const enrollment: CrossTrainEnrollment = {
    id: `ct-${Date.now()}`,
    staffId, staffName: s.name, initials: s.initials, color: s.color,
    fromUnit: s.primaryUnit, toUnit: unit,
    startDate: today.toLocaleDateString('en-US', { month:'short', day:'numeric' }),
    targetDate: target.toLocaleDateString('en-US', { month:'short', day:'numeric' }),
    progress: 0, mentor,
    checkOffs: [
      { label:'Unit orientation & policies', done:false },
      { label:'Medication administration',   done:false },
      { label:'IV therapy & clinical skills',done:false },
      { label:'Documentation competency',    done:false },
      { label:'Patient management',          done:false },
      { label:'Final preceptor sign-off',    done:false },
    ],
  }
  _crossTrain.push(enrollment)
  return enrollment
}

export function toggleCheckOff(enrollmentId: string, checkIdx: number): void {
  const e = _crossTrain.find(e => e.id === enrollmentId)
  if (!e) return
  e.checkOffs[checkIdx].done = !e.checkOffs[checkIdx].done
  e.progress = Math.round((e.checkOffs.filter(c => c.done).length / e.checkOffs.length) * 100)
}
