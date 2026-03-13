// recognitionData.ts — Peer Recognition & DAISY Awards
// Reference date: March 12, 2026

export type RecognitionType = 'kudos' | 'daisy' | 'milestone'

export type KudosCategory =
  | 'clinical-excellence'
  | 'teamwork'
  | 'patient-advocate'
  | 'above-beyond'
  | 'compassion'
  | 'leadership'
  | 'lifesaver'
  | 'safety-champion'
  | 'mentor'
  | 'innovation'

export interface Recognition {
  id: string
  type: RecognitionType
  category: KudosCategory | null    // null for milestones
  fromName: string | null           // null = anonymous
  fromInitials: string | null
  fromUnit: string | null
  toName: string
  toInitials: string
  toRole: string
  toUnit: string
  message: string
  createdAt: string                 // ISO datetime
  likes: number
  patientStory: string | null       // DAISY nominations only
  isAnonymous: boolean
  milestoneType: string | null      // 'anniversary-5yr' | 'certification' | etc.
}

// ─── Mutable state ────────────────────────────────────────────────────────────
const _liked = new Set<string>()
const _newRecognitions: Recognition[] = []
let _nextNum = 1

export function hasLiked(id: string): boolean {
  return _liked.has(id)
}

export function toggleLike(id: string): void {
  if (_liked.has(id)) _liked.delete(id)
  else _liked.add(id)
}

export function getLikeCount(rec: Recognition): number {
  const base = rec.likes
  const userLiked = _liked.has(rec.id) ? 1 : 0
  // If originally 0 likes and user liked it, show 1
  return base + userLiked
}

export function submitKudos(data: {
  category: KudosCategory
  toName: string
  toInitials: string
  toRole: string
  toUnit: string
  message: string
  fromName: string | null
  fromInitials: string | null
  fromUnit: string | null
  isAnonymous: boolean
}): Recognition {
  const rec: Recognition = {
    id: `rec-new-${String(_nextNum++).padStart(3, '0')}`,
    type: 'kudos',
    category: data.category,
    fromName: data.isAnonymous ? null : data.fromName,
    fromInitials: data.isAnonymous ? null : data.fromInitials,
    fromUnit: data.isAnonymous ? null : data.fromUnit,
    toName: data.toName,
    toInitials: data.toInitials,
    toRole: data.toRole,
    toUnit: data.toUnit,
    message: data.message,
    createdAt: new Date().toISOString(),
    likes: 0,
    patientStory: null,
    isAnonymous: data.isAnonymous,
    milestoneType: null,
  }
  _newRecognitions.unshift(rec)
  return rec
}

export function submitDaisy(data: {
  toName: string
  toInitials: string
  toRole: string
  toUnit: string
  message: string
  patientStory: string
  fromName: string | null
  fromInitials: string | null
  fromUnit: string | null
  isAnonymous: boolean
}): Recognition {
  const rec: Recognition = {
    id: `rec-new-${String(_nextNum++).padStart(3, '0')}`,
    type: 'daisy',
    category: 'patient-advocate',
    fromName: data.isAnonymous ? null : data.fromName,
    fromInitials: data.isAnonymous ? null : data.fromInitials,
    fromUnit: data.isAnonymous ? null : data.fromUnit,
    toName: data.toName,
    toInitials: data.toInitials,
    toRole: data.toRole,
    toUnit: data.toUnit,
    message: data.message,
    createdAt: new Date().toISOString(),
    likes: 0,
    patientStory: data.patientStory,
    isAnonymous: data.isAnonymous,
    milestoneType: null,
  }
  _newRecognitions.unshift(rec)
  return rec
}

export function getAllRecognitions(): Recognition[] {
  return [..._newRecognitions, ...RECOGNITIONS]
}

export function getSummary() {
  const all = getAllRecognitions()
  const thisWeek = all.filter(r => {
    const d = new Date(r.createdAt)
    return d >= new Date('2026-03-09')
  })
  const daisy = all.filter(r => r.type === 'daisy')
  const uniqueHonored = new Set(all.map(r => r.toName)).size
  const topUnit = (() => {
    const counts: Record<string, number> = {}
    all.forEach(r => { counts[r.toUnit] = (counts[r.toUnit] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ICU'
  })()
  return {
    thisWeek: thisWeek.length,
    total: all.length,
    daisy: daisy.length,
    uniqueHonored,
    topUnit,
  }
}

export function getLeaderboard(): { name: string; initials: string; unit: string; role: string; count: number }[] {
  const all = getAllRecognitions()
  const map = new Map<string, { name: string; initials: string; unit: string; role: string; count: number }>()
  for (const r of all) {
    const existing = map.get(r.toName)
    if (existing) existing.count++
    else map.set(r.toName, { name: r.toName, initials: r.toInitials, unit: r.toUnit, role: r.toRole, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const CATEGORY_META: Record<KudosCategory, { label: string; icon: string; color: string; bg: string }> = {
  'clinical-excellence': { label: 'Clinical Excellence', icon: '⚕️', color: 'text-teal-400',   bg: 'bg-teal-500/15'   },
  'teamwork':            { label: 'Teamwork',            icon: '🤝', color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  'patient-advocate':    { label: 'Patient Advocate',    icon: '🛡️', color: 'text-violet-400', bg: 'bg-violet-500/15' },
  'above-beyond':        { label: 'Above & Beyond',      icon: '⭐', color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  'compassion':          { label: 'Compassion',          icon: '💙', color: 'text-sky-400',    bg: 'bg-sky-500/15'    },
  'leadership':          { label: 'Leadership',          icon: '👑', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'lifesaver':           { label: 'Lifesaver',           icon: '🚑', color: 'text-red-400',    bg: 'bg-red-500/15'    },
  'safety-champion':     { label: 'Safety Champion',     icon: '🦺', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  'mentor':              { label: 'Mentor',              icon: '🎓', color: 'text-emerald-400',bg: 'bg-emerald-500/15'},
  'innovation':          { label: 'Innovation',          icon: '💡', color: 'text-pink-400',   bg: 'bg-pink-500/15'   },
}

export const STAFF_LIST = [
  { name: 'Priya Sharma',    initials: 'PS', role: 'CCRN, Charge',  unit: 'ICU'        },
  { name: 'James Okafor',    initials: 'JO', role: 'CCRN',          unit: 'ICU'        },
  { name: 'Maria Santos',    initials: 'MS', role: 'RN BSN',        unit: 'ICU'        },
  { name: 'Fatima Hassan',   initials: 'FH', role: 'RN',            unit: 'ICU'        },
  { name: 'Rachel Torres',   initials: 'RT', role: 'CCRN, Charge',  unit: 'CCU'        },
  { name: 'Nathan Foster',   initials: 'NF', role: 'Charge RN',     unit: 'ED'         },
  { name: 'Francesca Holt',  initials: 'FH', role: 'ED RN',         unit: 'ED'         },
  { name: 'Carlos Rivera',   initials: 'CR', role: 'RN',            unit: 'ED'         },
  { name: 'Sarah Mitchell',  initials: 'SM', role: 'RN BSN',        unit: 'Med-Surg B' },
  { name: 'Beth Collins',    initials: 'BC', role: 'Charge RN',     unit: 'Med-Surg A' },
  { name: 'Mike Turner',     initials: 'MT', role: 'RN',            unit: 'Med-Surg A' },
  { name: 'Zoe Alvarez',     initials: 'ZA', role: 'LPN',           unit: 'Med-Surg A' },
  { name: 'Helen Forsyth',   initials: 'HF', role: 'Charge RN',     unit: 'Oncology'   },
  { name: 'Marcus Williams', initials: 'MW', role: 'RN',            unit: 'Oncology'   },
]

// ─── Recognition records ─────────────────────────────────────────────────────
export const RECOGNITIONS: Recognition[] = [
  // ── DAISY nominations ─────────────────────────────────────────────────────
  {
    id: 'rec-001',
    type: 'daisy',
    category: 'patient-advocate',
    fromName: null,
    fromInitials: null,
    fromUnit: null,
    toName: 'Priya Sharma',
    toInitials: 'PS',
    toRole: 'CCRN, Charge',
    toUnit: 'ICU',
    message: 'Priya sat with my mother for 45 minutes after her surgery, holding her hand and explaining everything so patiently. She never made us feel rushed. This is what nursing should look like.',
    createdAt: '2026-03-11T14:30:00Z',
    likes: 24,
    patientStory: 'My mother was terrified before her open-heart procedure. Priya noticed she was crying and stayed with her, introducing herself to our whole family and explaining every step of what would happen. After surgery, when Mom was confused and scared in the ICU, Priya was there again — calm, reassuring, never rushing. She even called us at 2 AM to let us know Mom had turned a corner. We will never forget her.',
    isAnonymous: true,
    milestoneType: null,
  },
  {
    id: 'rec-002',
    type: 'daisy',
    category: 'patient-advocate',
    fromName: 'Janet Morrison',
    fromInitials: 'JM',
    fromUnit: 'Administration',
    toName: 'Maria Santos',
    toInitials: 'MS',
    toRole: 'RN BSN',
    toUnit: 'ICU',
    message: 'Maria caught a critical medication interaction that two physicians missed. She respectfully escalated to pharmacy and the attending, and her patient avoided a potentially fatal outcome. This is clinical excellence at its finest.',
    createdAt: '2026-03-10T10:00:00Z',
    likes: 31,
    patientStory: 'Patient in ICU bed 3 was prescribed two medications with a known dangerous interaction. Maria cross-referenced the order against the patient\'s allergy and medication history in the EHR. When the system didn\'t flag it, she looked it up herself. She called pharmacy, then the attending — politely but firmly — and the order was changed within 20 minutes. The patient had no idea how close they came to a serious event. Maria\'s vigilance saved a life that day.',
    isAnonymous: false,
    milestoneType: null,
  },
  // ── Kudos ─────────────────────────────────────────────────────────────────
  {
    id: 'rec-003',
    type: 'kudos',
    category: 'teamwork',
    fromName: 'Rachel Torres',
    fromInitials: 'RT',
    fromUnit: 'CCU',
    toName: 'Nathan Foster',
    toInitials: 'NF',
    toRole: 'Charge RN',
    toUnit: 'ED',
    message: 'Nathan sent two ED nurses to CCU without hesitation when we had a MCI surge last night. No questions, no paperwork delays — just "tell me what you need." That\'s the kind of leader who makes this hospital great.',
    createdAt: '2026-03-12T08:15:00Z',
    likes: 18,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-004',
    type: 'kudos',
    category: 'clinical-excellence',
    fromName: 'Beth Collins',
    fromInitials: 'BC',
    fromUnit: 'Med-Surg A',
    toName: 'Mike Turner',
    toInitials: 'MT',
    toRole: 'RN',
    toUnit: 'Med-Surg A',
    message: 'Mike recognized early signs of sepsis in a post-op patient before any of us did. His quick thinking and SBAR to the attending got the patient to ICU in time. Textbook clinical judgment.',
    createdAt: '2026-03-12T07:30:00Z',
    likes: 22,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-005',
    type: 'kudos',
    category: 'above-beyond',
    fromName: null,
    fromInitials: null,
    fromUnit: null,
    toName: 'James Okafor',
    toInitials: 'JO',
    toRole: 'CCRN',
    toUnit: 'ICU',
    message: 'Stayed 4 extra hours during the MCI event without being asked, without complaining. Your dedication to this team and these patients is extraordinary.',
    createdAt: '2026-03-11T23:45:00Z',
    likes: 35,
    patientStory: null,
    isAnonymous: true,
    milestoneType: null,
  },
  {
    id: 'rec-006',
    type: 'kudos',
    category: 'compassion',
    fromName: 'Fatima Hassan',
    fromInitials: 'FH',
    fromUnit: 'ICU',
    toName: 'Maria Santos',
    toInitials: 'MS',
    toRole: 'RN BSN',
    toUnit: 'ICU',
    message: 'Maria spent 30 minutes helping a non-English-speaking family understand their father\'s diagnosis. She used a translation app, drew diagrams, found a Spanish-speaking volunteer. The family was in tears — tears of gratitude. Compassion like this can\'t be taught.',
    createdAt: '2026-03-11T16:20:00Z',
    likes: 28,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-007',
    type: 'kudos',
    category: 'safety-champion',
    fromName: 'James Okafor',
    fromInitials: 'JO',
    fromUnit: 'ICU',
    toName: 'Priya Sharma',
    toInitials: 'PS',
    toRole: 'CCRN, Charge',
    toUnit: 'ICU',
    message: 'Priya stopped a procedure in the ICU because she had a concern about consent documentation. She was right. It took courage to pause a room full of attendings. That\'s what a safety culture looks like.',
    createdAt: '2026-03-11T11:00:00Z',
    likes: 41,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-008',
    type: 'kudos',
    category: 'mentor',
    fromName: 'Emily Kowalski',
    fromInitials: 'EK',
    fromUnit: 'ICU',
    toName: 'Maria Santos',
    toInitials: 'MS',
    toRole: 'RN BSN',
    toUnit: 'ICU',
    message: 'As a new nurse, I was terrified on my first night charge. Maria stayed close the entire shift, answering every question without making me feel stupid. She\'s the reason I love this unit already.',
    createdAt: '2026-03-10T22:00:00Z',
    likes: 19,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-009',
    type: 'kudos',
    category: 'leadership',
    fromName: 'Maria Santos',
    fromInitials: 'MS',
    fromUnit: 'ICU',
    toName: 'Rachel Torres',
    toInitials: 'RT',
    toRole: 'CCRN, Charge',
    toUnit: 'CCU',
    message: 'Rachel ran a perfect rapid response this morning — calm, organized, didn\'t miss a beat. Watching her work is like watching a masterclass in crisis leadership. The patient is alive because of her.',
    createdAt: '2026-03-10T08:45:00Z',
    likes: 27,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-010',
    type: 'kudos',
    category: 'teamwork',
    fromName: 'Nathan Foster',
    fromInitials: 'NF',
    fromUnit: 'ED',
    toName: 'Carlos Rivera',
    toInitials: 'CR',
    toRole: 'RN',
    toUnit: 'ED',
    message: 'Carlos took on 6 patients when we were short-staffed and didn\'t complain once. Checked on every other nurse\'s patients too. The whole ED ran smoother because of him.',
    createdAt: '2026-03-09T20:00:00Z',
    likes: 15,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-011',
    type: 'kudos',
    category: 'innovation',
    fromName: 'Beth Collins',
    fromInitials: 'BC',
    fromUnit: 'Med-Surg A',
    toName: 'Helen Forsyth',
    toInitials: 'HF',
    toRole: 'Charge RN',
    toUnit: 'Oncology',
    message: 'Helen created a hand-off template that cuts our verbal report time in half AND catches more critical info. She shared it with every unit. That\'s the definition of making your whole hospital better.',
    createdAt: '2026-03-09T14:00:00Z',
    likes: 23,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  {
    id: 'rec-012',
    type: 'kudos',
    category: 'lifesaver',
    fromName: 'Rachel Torres',
    fromInitials: 'RT',
    fromUnit: 'CCU',
    toName: 'Fatima Hassan',
    toInitials: 'FH',
    toRole: 'RN',
    toUnit: 'ICU',
    message: 'Fatima recognized post-cardiac-cath bleeding complications on a patient who was "resting comfortably" per the last note. Her assessment and rapid escalation got the patient back to the cath lab in time. A save, plain and simple.',
    createdAt: '2026-03-08T18:00:00Z',
    likes: 44,
    patientStory: null,
    isAnonymous: false,
    milestoneType: null,
  },
  // ── Milestones ────────────────────────────────────────────────────────────
  {
    id: 'rec-013',
    type: 'milestone',
    category: null,
    fromName: 'NurseStation',
    fromInitials: '🎉',
    fromUnit: null,
    toName: 'Rachel Torres',
    toInitials: 'RT',
    toRole: 'CCRN, Charge',
    toUnit: 'CCU',
    message: 'Rachel Torres is celebrating her 10-year work anniversary at Mercy General Hospital today! A decade of exceptional care, leadership, and mentorship. Thank you for everything you do.',
    createdAt: '2026-03-12T00:01:00Z',
    likes: 52,
    patientStory: null,
    isAnonymous: false,
    milestoneType: 'anniversary-10yr',
  },
  {
    id: 'rec-014',
    type: 'milestone',
    category: null,
    fromName: 'NurseStation',
    fromInitials: '🏅',
    fromUnit: null,
    toName: 'Maria Santos',
    toInitials: 'MS',
    toRole: 'RN BSN',
    toUnit: 'ICU',
    message: 'Congratulations to Maria Santos on earning her CCRN certification! This represents hundreds of hours of study alongside a full patient-care schedule. Mercy General is proud to have you.',
    createdAt: '2026-03-10T09:00:00Z',
    likes: 38,
    patientStory: null,
    isAnonymous: false,
    milestoneType: 'certification',
  },
  {
    id: 'rec-015',
    type: 'milestone',
    category: null,
    fromName: 'NurseStation',
    fromInitials: '🎉',
    fromUnit: null,
    toName: 'Beth Collins',
    toInitials: 'BC',
    toRole: 'Charge RN',
    toUnit: 'Med-Surg A',
    message: 'Beth Collins is celebrating 5 years on Med-Surg A! She\'s mentored over 20 new nurses during that time and built one of the tightest teams in the hospital. Here\'s to 5 more!',
    createdAt: '2026-03-09T00:01:00Z',
    likes: 29,
    patientStory: null,
    isAnonymous: false,
    milestoneType: 'anniversary-5yr',
  },
]
