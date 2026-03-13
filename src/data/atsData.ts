export type CandidateStage =
  | 'applied'
  | 'phone-screen'
  | 'interview'
  | 'background'
  | 'offer'
  | 'hired'
  | 'rejected'

export type ReqPriority = 'critical' | 'high' | 'normal'

export interface StageEvent {
  stage: CandidateStage
  date: string
  note?: string
}

export interface Candidate {
  id: string
  name: string
  initials: string
  color: string
  role: string
  unit: string
  yearsExp: number
  certs: string[]
  email: string
  phone: string
  source: string
  stage: CandidateStage
  daysInStage: number
  history: StageEvent[]
  notes: string[]
  appliedDate: string
  movedToOnboarding: boolean
}

export interface Requisition {
  id: string
  unit: string
  role: string
  daysOpen: number
  priority: ReqPriority
  slots: number
}

// ── Requisitions ────────────────────────────────────────────────────────────

const _requisitions: Requisition[] = [
  { id: 'req-001', unit: 'ICU',        role: 'Staff RN',  daysOpen: 14, priority: 'high',     slots: 1 },
  { id: 'req-002', unit: 'ED',         role: 'Staff RN',  daysOpen: 21, priority: 'high',     slots: 2 },
  { id: 'req-003', unit: 'MS-B',       role: 'Staff RN',  daysOpen: 8,  priority: 'normal',   slots: 1 },
  { id: 'req-004', unit: 'CCU',        role: 'Charge RN', daysOpen: 31, priority: 'critical', slots: 1 },
  { id: 'req-005', unit: 'Telemetry',  role: 'Staff RN',  daysOpen: 5,  priority: 'normal',   slots: 1 },
  { id: 'req-006', unit: 'Oncology',   role: 'Staff RN',  daysOpen: 17, priority: 'high',     slots: 1 },
]

// ── Candidates ──────────────────────────────────────────────────────────────

let _candidates: Candidate[] = [
  // Applied (5)
  {
    id: 'c-001', name: 'Michael Rivera', initials: 'MR', color: 'from-blue-500 to-blue-700',
    role: 'Staff RN', unit: 'ED', yearsExp: 3, certs: ['BLS', 'ACLS', 'TNCC'],
    email: 'm.rivera@mail.com', phone: '(415) 555-0132', source: 'Indeed',
    stage: 'applied', daysInStage: 2,
    history: [{ stage: 'applied', date: 'Mar 11, 2026' }],
    notes: ['3 years ED experience at St. Mary\'s. Strong TNCC.'],
    appliedDate: 'Mar 11, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-002', name: 'Anna Kowalski', initials: 'AK', color: 'from-violet-500 to-violet-700',
    role: 'Staff RN', unit: 'ICU', yearsExp: 5, certs: ['BLS', 'ACLS', 'CCRN'],
    email: 'a.kowalski@mail.com', phone: '(415) 555-0187', source: 'LinkedIn',
    stage: 'applied', daysInStage: 1,
    history: [{ stage: 'applied', date: 'Mar 12, 2026' }],
    notes: ['CCRN certified. 5 years MICU at General. Excellent references.'],
    appliedDate: 'Mar 12, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-003', name: 'David Lee', initials: 'DL', color: 'from-teal-500 to-teal-700',
    role: 'Staff RN', unit: 'MS-B', yearsExp: 2, certs: ['BLS', 'ACLS'],
    email: 'd.lee@mail.com', phone: '(415) 555-0254', source: 'Hospital Website',
    stage: 'applied', daysInStage: 4,
    history: [{ stage: 'applied', date: 'Mar 9, 2026' }],
    notes: ['New grad + 2y floor experience. Eager to learn.'],
    appliedDate: 'Mar 9, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-004', name: 'Fatima Hassan', initials: 'FH', color: 'from-amber-500 to-amber-700',
    role: 'Charge RN', unit: 'CCU', yearsExp: 7, certs: ['BLS', 'ACLS', 'CCRN', 'CMC'],
    email: 'f.hassan@mail.com', phone: '(415) 555-0391', source: 'Nurse.com',
    stage: 'applied', daysInStage: 6,
    history: [{ stage: 'applied', date: 'Mar 7, 2026' }],
    notes: ['7 years CCU, CCRN + CMC certified. Previous charge at Oakland Med. HIGH PRIORITY.'],
    appliedDate: 'Mar 7, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-005', name: 'James Wu', initials: 'JW', color: 'from-cyan-500 to-cyan-700',
    role: 'Staff RN', unit: 'Telemetry', yearsExp: 4, certs: ['BLS', 'ACLS'],
    email: 'j.wu@mail.com', phone: '(415) 555-0467', source: 'LinkedIn',
    stage: 'applied', daysInStage: 3,
    history: [{ stage: 'applied', date: 'Mar 10, 2026' }],
    notes: ['4 years tele, previously at UCSF.'],
    appliedDate: 'Mar 10, 2026', movedToOnboarding: false,
  },
  // Phone Screen (3)
  {
    id: 'c-006', name: "Sarah O'Connor", initials: 'SO', color: 'from-pink-500 to-pink-700',
    role: 'Staff RN', unit: 'ED', yearsExp: 8, certs: ['BLS', 'ACLS', 'TNCC', 'CEN'],
    email: 's.oconnor@mail.com', phone: '(415) 555-0513', source: 'Indeed',
    stage: 'phone-screen', daysInStage: 5,
    history: [
      { stage: 'applied', date: 'Mar 1, 2026' },
      { stage: 'phone-screen', date: 'Mar 8, 2026', note: 'Moved to phone screen after strong resume review' },
    ],
    notes: ['8 years ED. CEN certified. Level I trauma experience. Needs callback.'],
    appliedDate: 'Mar 1, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-007', name: 'Carlos Mendez', initials: 'CM', color: 'from-emerald-500 to-emerald-700',
    role: 'Staff RN', unit: 'ICU', yearsExp: 6, certs: ['BLS', 'ACLS', 'CCRN'],
    email: 'c.mendez@mail.com', phone: '(415) 555-0624', source: 'Nurse.com',
    stage: 'phone-screen', daysInStage: 3,
    history: [
      { stage: 'applied', date: 'Mar 4, 2026' },
      { stage: 'phone-screen', date: 'Mar 10, 2026', note: 'Excellent application, fast-tracked' },
    ],
    notes: ['CCRN. 6 years MICU/SICU. Bilingual (English/Spanish). Available Apr 1.'],
    appliedDate: 'Mar 4, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-008', name: 'Rachel Kim', initials: 'RK', color: 'from-rose-500 to-rose-700',
    role: 'Staff RN', unit: 'MS-B', yearsExp: 3, certs: ['BLS', 'ACLS'],
    email: 'r.kim@mail.com', phone: '(415) 555-0712', source: 'Hospital Website',
    stage: 'phone-screen', daysInStage: 2,
    history: [
      { stage: 'applied', date: 'Mar 5, 2026' },
      { stage: 'phone-screen', date: 'Mar 11, 2026', note: 'Good fit for MS-B night shift' },
    ],
    notes: ['3 years MS-B equivalent. Night shift preferred. Good culture fit per recruiter.'],
    appliedDate: 'Mar 5, 2026', movedToOnboarding: false,
  },
  // Interview (4)
  {
    id: 'c-009', name: 'Thomas Okafor', initials: 'TO', color: 'from-indigo-500 to-indigo-700',
    role: 'Charge RN', unit: 'CCU', yearsExp: 10, certs: ['BLS', 'ACLS', 'CCRN', 'CMC'],
    email: 't.okafor@mail.com', phone: '(415) 555-0831', source: 'LinkedIn',
    stage: 'interview', daysInStage: 8,
    history: [
      { stage: 'applied', date: 'Feb 21, 2026' },
      { stage: 'phone-screen', date: 'Feb 28, 2026', note: 'Excellent screen. Charge experience confirmed.' },
      { stage: 'interview', date: 'Mar 5, 2026', note: 'Panel interview scheduled. Awaiting feedback.' },
    ],
    notes: ['10 years CCU. Previous charge role at SF General. CCRN+CMC. Top candidate for CCU Charge.', 'Interview feedback pending from Dr. Patel.'],
    appliedDate: 'Feb 21, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-010', name: 'Priya Singh', initials: 'PS', color: 'from-orange-500 to-orange-700',
    role: 'Staff RN', unit: 'ED', yearsExp: 4, certs: ['BLS', 'ACLS', 'TNCC'],
    email: 'p.singh@mail.com', phone: '(415) 555-0948', source: 'Indeed',
    stage: 'interview', daysInStage: 4,
    history: [
      { stage: 'applied', date: 'Feb 28, 2026' },
      { stage: 'phone-screen', date: 'Mar 5, 2026', note: 'Strong screen. ED trauma background.' },
      { stage: 'interview', date: 'Mar 9, 2026', note: '1:1 interview with ED nurse manager.' },
    ],
    notes: ['4 years Level II ED. TNCC. Handles high volume well. Good fit per manager.'],
    appliedDate: 'Feb 28, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-011', name: 'Marcus Williams', initials: 'MW', color: 'from-purple-500 to-purple-700',
    role: 'Staff RN', unit: 'ICU', yearsExp: 2, certs: ['BLS', 'ACLS'],
    email: 'm.williams@mail.com', phone: '(415) 555-1023', source: 'LinkedIn',
    stage: 'interview', daysInStage: 6,
    history: [
      { stage: 'applied', date: 'Feb 26, 2026' },
      { stage: 'phone-screen', date: 'Mar 3, 2026', note: 'Promising. 2 years ICU step-down.' },
      { stage: 'interview', date: 'Mar 7, 2026', note: 'Peer interview completed. References outstanding.' },
    ],
    notes: ['2 years ICU step-down. Motivated, growth mindset. References called excellent.'],
    appliedDate: 'Feb 26, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-012', name: 'Lisa Chen', initials: 'LC', color: 'from-sky-500 to-sky-700',
    role: 'Staff RN', unit: 'Oncology', yearsExp: 5, certs: ['BLS', 'ACLS', 'OCN'],
    email: 'l.chen@mail.com', phone: '(415) 555-1156', source: 'Nurse.com',
    stage: 'interview', daysInStage: 1,
    history: [
      { stage: 'applied', date: 'Mar 2, 2026' },
      { stage: 'phone-screen', date: 'Mar 8, 2026', note: 'OCN certification — excellent match for Oncology.' },
      { stage: 'interview', date: 'Mar 12, 2026', note: 'Just scheduled. Meeting tomorrow.' },
    ],
    notes: ['OCN certified — rare. 5 years oncology. Perfect match for Oncology req.'],
    appliedDate: 'Mar 2, 2026', movedToOnboarding: false,
  },
  // Background Check (2)
  {
    id: 'c-013', name: 'Jennifer Walsh', initials: 'JWa', color: 'from-teal-600 to-teal-800',
    role: 'Staff RN', unit: 'ICU', yearsExp: 7, certs: ['BLS', 'ACLS', 'CCRN'],
    email: 'j.walsh@mail.com', phone: '(415) 555-1274', source: 'LinkedIn',
    stage: 'background', daysInStage: 4,
    history: [
      { stage: 'applied', date: 'Feb 18, 2026' },
      { stage: 'phone-screen', date: 'Feb 23, 2026' },
      { stage: 'interview', date: 'Mar 2, 2026', note: 'Strong interview. Team loved her.' },
      { stage: 'background', date: 'Mar 9, 2026', note: 'Background check initiated. Estimated 5-7 days.' },
    ],
    notes: ['CCRN. 7 years MICU. Near-perfect candidate. Just waiting on background results.'],
    appliedDate: 'Feb 18, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-014', name: 'Robert Diaz', initials: 'RD', color: 'from-slate-500 to-slate-700',
    role: 'Staff RN', unit: 'ED', yearsExp: 3, certs: ['BLS', 'ACLS', 'TNCC'],
    email: 'r.diaz@mail.com', phone: '(415) 555-1388', source: 'Indeed',
    stage: 'background', daysInStage: 2,
    history: [
      { stage: 'applied', date: 'Feb 22, 2026' },
      { stage: 'phone-screen', date: 'Feb 27, 2026' },
      { stage: 'interview', date: 'Mar 5, 2026', note: 'Good energy. ED manager approved.' },
      { stage: 'background', date: 'Mar 11, 2026', note: 'Sent background check authorization.' },
    ],
    notes: ['3 years Level II ED. TNCC. Background check sent — awaiting results.'],
    appliedDate: 'Feb 22, 2026', movedToOnboarding: false,
  },
  // Offer Sent (2)
  {
    id: 'c-015', name: 'Emily Park', initials: 'EP', color: 'from-emerald-600 to-emerald-800',
    role: 'Charge RN', unit: 'CCU', yearsExp: 12, certs: ['BLS', 'ACLS', 'CCRN', 'CMC', 'FCCM'],
    email: 'e.park@mail.com', phone: '(415) 555-1492', source: 'LinkedIn',
    stage: 'offer', daysInStage: 3,
    history: [
      { stage: 'applied', date: 'Feb 8, 2026' },
      { stage: 'phone-screen', date: 'Feb 13, 2026' },
      { stage: 'interview', date: 'Feb 20, 2026', note: 'Exceptional candidate. Unanimous hire.' },
      { stage: 'background', date: 'Feb 27, 2026', note: 'Background clear.' },
      { stage: 'offer', date: 'Mar 10, 2026', note: 'Offer sent: $48/hr base + $5k sign-on. Start Apr 7.' },
    ],
    notes: ['FCCM — exceptionally rare. 12 years CCU. Perfect for Charge role. Offer sent $48/hr + $5k sign-on.', 'Deadline: Mar 17.'],
    appliedDate: 'Feb 8, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-016', name: 'Nathan Brooks', initials: 'NB', color: 'from-blue-600 to-blue-800',
    role: 'Staff RN', unit: 'ICU', yearsExp: 5, certs: ['BLS', 'ACLS', 'CCRN'],
    email: 'n.brooks@mail.com', phone: '(415) 555-1617', source: 'Nurse.com',
    stage: 'offer', daysInStage: 1,
    history: [
      { stage: 'applied', date: 'Feb 14, 2026' },
      { stage: 'phone-screen', date: 'Feb 19, 2026' },
      { stage: 'interview', date: 'Feb 26, 2026', note: 'Strong ICU background. 3 panel interviews.' },
      { stage: 'background', date: 'Mar 5, 2026', note: 'Background clear. References excellent.' },
      { stage: 'offer', date: 'Mar 12, 2026', note: 'Offer sent: $41/hr base + $3k sign-on. Start Apr 14.' },
    ],
    notes: ['CCRN. 5 years MICU. Just sent offer today. Expecting quick response.'],
    appliedDate: 'Feb 14, 2026', movedToOnboarding: false,
  },
  // Hired (2)
  {
    id: 'c-017', name: 'Aisha Johnson', initials: 'AJ', color: 'from-green-500 to-green-700',
    role: 'Staff RN', unit: 'MS-B', yearsExp: 4, certs: ['BLS', 'ACLS'],
    email: 'a.johnson@mercy.org', phone: '(415) 555-1734', source: 'Indeed',
    stage: 'hired', daysInStage: 5,
    history: [
      { stage: 'applied', date: 'Feb 2, 2026' },
      { stage: 'phone-screen', date: 'Feb 7, 2026' },
      { stage: 'interview', date: 'Feb 14, 2026' },
      { stage: 'background', date: 'Feb 21, 2026', note: 'Background clear.' },
      { stage: 'offer', date: 'Feb 27, 2026', note: 'Offer accepted: $39/hr + $2k sign-on.' },
      { stage: 'hired', date: 'Mar 8, 2026', note: 'Signed offer. Start Apr 7. Move to Onboarding.' },
    ],
    notes: ['Accepted offer. Start date Apr 7. Need to move to Onboarding checklist.'],
    appliedDate: 'Feb 2, 2026', movedToOnboarding: false,
  },
  {
    id: 'c-018', name: 'Tyler Nguyen', initials: 'TN', color: 'from-lime-500 to-lime-700',
    role: 'Staff RN', unit: 'Telemetry', yearsExp: 3, certs: ['BLS', 'ACLS'],
    email: 't.nguyen@mercy.org', phone: '(415) 555-1851', source: 'LinkedIn',
    stage: 'hired', daysInStage: 2,
    history: [
      { stage: 'applied', date: 'Feb 8, 2026' },
      { stage: 'phone-screen', date: 'Feb 13, 2026' },
      { stage: 'interview', date: 'Feb 20, 2026' },
      { stage: 'background', date: 'Feb 27, 2026' },
      { stage: 'offer', date: 'Mar 5, 2026', note: 'Offer accepted same day.' },
      { stage: 'hired', date: 'Mar 11, 2026', note: 'Signed. Start Apr 14. Ready for Onboarding.' },
    ],
    notes: ['Fast process — offer accepted day-of. Start Apr 14. Onboarding ready.'],
    appliedDate: 'Feb 8, 2026', movedToOnboarding: false,
  },
]

// ── Accessors ────────────────────────────────────────────────────────────────

export function getRequisitions(): Requisition[] {
  return _requisitions
}

export function getCandidates(): Candidate[] {
  return _candidates
}

export function getCandidate(id: string): Candidate | undefined {
  return _candidates.find(c => c.id === id)
}

export function advanceStage(id: string): void {
  const stageOrder: CandidateStage[] = ['applied','phone-screen','interview','background','offer','hired']
  const c = _candidates.find(c => c.id === id)
  if (!c) return
  const idx = stageOrder.indexOf(c.stage as CandidateStage)
  if (idx === -1 || idx >= stageOrder.length - 1) return
  const next = stageOrder[idx + 1]
  c.stage = next
  c.daysInStage = 0
  c.history.push({ stage: next, date: 'Mar 13, 2026', note: 'Advanced via pipeline' })
}

export function rejectCandidate(id: string): void {
  const c = _candidates.find(c => c.id === id)
  if (!c) return
  c.stage = 'rejected'
  c.history.push({ stage: 'rejected', date: 'Mar 13, 2026' })
}

export function moveToOnboarding(id: string): void {
  const c = _candidates.find(c => c.id === id)
  if (!c || c.stage !== 'hired') return
  c.movedToOnboarding = true
}

export function addNote(id: string, note: string): void {
  const c = _candidates.find(c => c.id === id)
  if (!c || !note.trim()) return
  c.notes.push(note.trim())
}

export function getPipelineStats() {
  const active = _candidates.filter(c => c.stage !== 'rejected')
  const hired  = active.filter(c => c.stage === 'hired')
  // avg time to fill = avg daysInStage for hired candidates (proxy)
  const avgTTF = hired.length
    ? Math.round(hired.reduce((s, c) => s + c.history.length * 7, 0) / hired.length)
    : 23
  return {
    openReqs: _requisitions.length,
    inPipeline: active.filter(c => c.stage !== 'hired').length,
    avgTimeToFill: avgTTF,
    offerAcceptance: 85, // 2 of 2 recent offers accepted + Emily pending
    urgentCandidates: active.filter(c => c.daysInStage >= 5).length,
  }
}

export const STAGE_CONFIG: {
  id: CandidateStage
  label: string
  shortLabel: string
  color: string
  bg: string
  border: string
  dotColor: string
  advanceLabel: string
}[] = [
  { id: 'applied',      label: 'Applied',          shortLabel: 'Applied',   color: 'text-slate-700',   bg: 'bg-slate-50',    border: 'border-slate-200', dotColor: 'bg-slate-400',  advanceLabel: 'Screen →'       },
  { id: 'phone-screen', label: 'Phone Screen',      shortLabel: 'Screening', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',  dotColor: 'bg-blue-500',   advanceLabel: 'Interview →'    },
  { id: 'interview',    label: 'Interview',         shortLabel: 'Interview', color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',dotColor: 'bg-violet-500', advanceLabel: 'Bg Check →'     },
  { id: 'background',   label: 'Background Check',  shortLabel: 'Bg Check',  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200', dotColor: 'bg-amber-500',  advanceLabel: 'Send Offer →'   },
  { id: 'offer',        label: 'Offer Sent',        shortLabel: 'Offer',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',dotColor:'bg-emerald-500',advanceLabel: 'Mark Hired ✓'  },
  { id: 'hired',        label: 'Hired ✓',           shortLabel: 'Hired',     color: 'text-green-700',   bg: 'bg-green-50',    border: 'border-green-200', dotColor: 'bg-green-500',  advanceLabel: 'Onboard →'      },
]
