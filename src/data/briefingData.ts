// ── Shift Briefing & Team Broadcast Hub Data ──────────────────────────────────
// Date context: Friday March 13, 2026 — Day Shift 07:00
// Covers: current shift communications + SBAR notes + acknowledgments

export type AnnouncementType = 'urgent' | 'info' | 'reminder' | 'policy' | 'safety'
export type NoteCategory = 'patient-change' | 'handoff' | 'safety' | 'general'
export type TemplateType = 'emergency' | 'diversion' | 'operational' | 'clinical'

export interface Announcement {
  id:           string
  type:         AnnouncementType
  title:        string
  body:         string
  author:       string
  authorRole:   string
  unit:         string           // 'All' | unit name
  postedAt:     string
  expiresAt?:   string
  pinned:       boolean
  acknowledgedBy: string[]       // staff IDs
  totalRecipients: number
}

export interface SbarNote {
  id:             string
  patientRoom?:   string
  patientName?:   string
  category:       NoteCategory
  situation:      string
  background:     string
  assessment:     string
  recommendation: string
  author:         string
  authorRole:     string
  unit:           string
  createdAt:      string
  sharedWith:     string[]       // staff names notified
  acknowledged:   boolean
  priority:       'routine' | 'urgent' | 'critical'
}

export interface BriefTemplate {
  id:    string
  name:  string
  type:  TemplateType
  icon:  string
  body:  string
}

export interface ShiftStaff {
  id:       string
  name:     string
  initials: string
  color:    string
  role:     string
  unit:     string
  arrived:  boolean
  ackBrief: boolean
}

// ── Live Staff for current shift ─────────────────────────────────────────────

const _shiftStaff: ShiftStaff[] = [
  { id:'st-001', name:'Sarah Kim',        initials:'SK', color:'from-emerald-500 to-emerald-700', role:'RN',        unit:'ICU',       arrived:true,  ackBrief:true  },
  { id:'st-002', name:'Marcus Chen',      initials:'MC', color:'from-blue-500 to-blue-700',       role:'RN',        unit:'ICU',       arrived:true,  ackBrief:true  },
  { id:'st-003', name:'Maria Garcia',     initials:'MG', color:'from-rose-500 to-rose-700',       role:'RN',        unit:'CCU',       arrived:true,  ackBrief:false },
  { id:'st-004', name:'David Thompson',   initials:'DT', color:'from-red-500 to-red-700',         role:'RN',        unit:'ED',        arrived:false, ackBrief:false },
  { id:'st-005', name:'Emily Davis',      initials:'ED', color:'from-indigo-500 to-indigo-700',   role:'RN',        unit:'Telemetry', arrived:true,  ackBrief:true  },
  { id:'st-006', name:'James Wilson',     initials:'JW', color:'from-violet-500 to-violet-700',   role:'RN',        unit:'ED',        arrived:true,  ackBrief:false },
  { id:'st-007', name:'Jennifer Martinez',initials:'JM', color:'from-sky-500 to-sky-700',         role:'RN',        unit:'MS-A',      arrived:true,  ackBrief:true  },
  { id:'st-008', name:'Kevin Park',       initials:'KP', color:'from-cyan-500 to-cyan-700',       role:'RN',        unit:'MS-B',      arrived:true,  ackBrief:false },
  { id:'st-009', name:'Linda Foster',     initials:'LF', color:'from-teal-500 to-teal-700',       role:'RN',        unit:'CCU',       arrived:true,  ackBrief:true  },
  { id:'st-010', name:'Robert Chang',     initials:'RC', color:'from-slate-500 to-slate-700',     role:'RN',        unit:'ED',        arrived:true,  ackBrief:false },
  { id:'st-011', name:'Christina Lee',    initials:'CL', color:'from-purple-500 to-purple-700',   role:'Charge RN', unit:'CCU',       arrived:true,  ackBrief:true  },
  { id:'st-012', name:'Amanda White',     initials:'AW', color:'from-pink-500 to-pink-700',       role:'RN',        unit:'ICU',       arrived:false, ackBrief:false },
  { id:'st-013', name:'Carlos Rivera',    initials:'CR', color:'from-amber-500 to-amber-700',     role:'RN',        unit:'MS-A',      arrived:true,  ackBrief:true  },
  { id:'st-014', name:'Patricia Moore',   initials:'PM', color:'from-orange-500 to-orange-700',   role:'RN',        unit:'Telemetry', arrived:false, ackBrief:false },
  { id:'jm-001', name:'Janet Morrison',   initials:'JM', color:'from-violet-600 to-violet-800',   role:'Staffing Coordinator', unit:'Admin', arrived:true, ackBrief:true },
]

// ── Announcements ─────────────────────────────────────────────────────────────

let _announcements: Announcement[] = [
  {
    id:'ann-001',
    type:'urgent',
    title:'ED Surge Protocol ACTIVE — Diversion Status Yellow',
    body:'ED census at 14/20 (70%). All incoming ambulances should be notified of potential diversion. Charge RNs: expect 4–6 additional admits this shift from ED overflow to MS units. Hold all beds that can be cleaned by 10 AM.',
    author:'Janet Morrison', authorRole:'Staffing Coordinator',
    unit:'All', postedAt:'07:00 AM', pinned:true,
    acknowledgedBy:['st-001','st-002','st-005','st-009','st-011','st-013'],
    totalRecipients:15,
  },
  {
    id:'ann-002',
    type:'safety',
    title:'Safe Hours Alert — 3 Nurses Blocked for Overtime',
    body:'David Thompson (ED), Patricia Moore (Telemetry), and Amanda White (ICU) are at critical fatigue scores and CANNOT be assigned overtime or called back. Backup coverage has been arranged via on-call roster. Do not request OT from these nurses.',
    author:'Janet Morrison', authorRole:'Staffing Coordinator',
    unit:'All', postedAt:'07:05 AM', pinned:true,
    acknowledgedBy:['st-001','st-002','st-005','st-007','st-009','st-011','jm-001'],
    totalRecipients:15,
  },
  {
    id:'ann-003',
    type:'policy',
    title:'NEW: Medication Reconciliation Protocol — Effective Today',
    body:'Pharmacy has updated the medication reconciliation workflow. All admitted patients require reconciliation within 2 hours of admission (was 4 hours). New checklist added to EMR admission order set. Questions: contact Dr. Rashid or Clinical Pharmacy.',
    author:'Dr. Rashid', authorRole:'Medical Director',
    unit:'All', postedAt:'06:45 AM', pinned:false,
    acknowledgedBy:['st-001','st-007','st-009','st-013','jm-001'],
    totalRecipients:15,
  },
  {
    id:'ann-004',
    type:'info',
    title:'PPE Restocked — N95 Shortage Resolved',
    body:'Additional N95 respirators now available in Storeroom B (1st Floor, near ED). Contact Supply Chain (ext. 4488) for unit-level delivery. Fit-testing reminder: annual testing due for any nurse hired after March 2025.',
    author:'Infection Control', authorRole:'IPC Department',
    unit:'All', postedAt:'06:30 AM', pinned:false,
    acknowledgedBy:['st-001','st-002','st-003','st-009','st-011','jm-001'],
    totalRecipients:15,
  },
  {
    id:'ann-005',
    type:'reminder',
    title:'Quarterly Skills Fair — Thursday Mar 17, 0800–1600',
    body:'Mandatory skills competency fair for all bedside RNs. Stations: IV certification, ACLS/BLS refresher, defibrillator, fall prevention bundle. Must complete before April 1 or will be flagged in credentialing. Sign up via Training module.',
    author:'Education Dept.', authorRole:'Clinical Education',
    unit:'All', postedAt:'Yesterday', pinned:false,
    acknowledgedBy:['st-001','st-005','st-007','st-009','jm-001'],
    totalRecipients:15,
  },
  {
    id:'ann-006',
    type:'info',
    title:'Oncology: Float Nurse Requested — Ratio Risk',
    body:'Oncology (5th Floor) has 2 pending admissions from ED. Projected census will exceed 3:1 ratio. Float Pool request submitted — awaiting response. If float unavailable by 09:00, consider redirecting one MS-A nurse (Sarah Rodriguez available for cross-assignment).',
    author:'Janet Morrison', authorRole:'Staffing Coordinator',
    unit:'Oncology', postedAt:'07:10 AM', pinned:false,
    acknowledgedBy:['st-009','jm-001'],
    totalRecipients:4,
  },
]

// ── SBAR Notes ────────────────────────────────────────────────────────────────

let _sbarNotes: SbarNote[] = [
  {
    id:'sbar-001',
    patientRoom:'R07', patientName:'Adams, C.',
    category:'patient-change',
    situation:'Patient Adams, C. in ED R07 — acute ischemic stroke, LKW 45 minutes ago. NIH Stroke Scale 14 (right-sided weakness + aphasia). tPA given at 06:47.',
    background:'69-year-old male, HTN, AFib on warfarin (last INR 1.8). Arrived via EMS. CT head negative for hemorrhage. CTA shows left MCA occlusion.',
    assessment:'High-risk post-tPA period. Neuro checks q15 min. Strict BP control (target <180/105). No anticoagulation for 24h. Neurology at bedside.',
    recommendation:'Transfer to Stroke Unit (Telemetry 601 — bed ready). Notify receiving RN at 0800 handoff. Family being driven in from Riverside.',
    author:'James Wilson', authorRole:'RN, ED',
    unit:'ED', createdAt:'07:12 AM',
    sharedWith:['Emily Davis (Telemetry)', 'Dr. Klein (Neurology)'],
    acknowledged:true, priority:'critical',
  },
  {
    id:'sbar-002',
    patientRoom:'401B', patientName:'Davis, R.',
    category:'handoff',
    situation:'Post-CABG Day 2. Hemodynamically stable overnight. HR 62–74 sinus, BP 118–136/70–82. Chest tube output decreased to 15mL/hr (was 45mL at 0300).',
    background:'58-year-old, triple vessel CABG yesterday with Dr. Rashid. No intraop complications. On milrinone 0.375mcg/kg/min (weaning per CT surgery protocol).',
    assessment:'Trending toward extubation readiness. Current vent settings: PC 14, PEEP 5, FiO2 40%. Morning CXR ordered.',
    recommendation:'Milrinone wean to 0.25 per order at 0900 if BP stable. Wean vent to PS 10/5. If extubation criteria met by 1200, notify respiratory and CT surgery. Pain well controlled — PRN morphine only once overnight.',
    author:'Sarah Kim', authorRole:'RN, ICU',
    unit:'ICU', createdAt:'06:58 AM',
    sharedWith:['ICU Day Team', 'Dr. Rashid'],
    acknowledged:false, priority:'urgent',
  },
  {
    id:'sbar-003',
    patientRoom:'501B', patientName:'Kelly, I.',
    category:'safety',
    situation:'Oncology patient Kelly, I. (AML induction Day 8) — new fever 38.9°C at 06:30. ANC last check 0.08 (profound neutropenia). Currently on Contact isolation.',
    background:'31-year-old, AML, Day 8 of 7+3 induction. PICC line in place. Last blood cultures drawn 06:35 — results pending. Started empiric broad-spectrum antibiotics per Oncology protocol.',
    assessment:'High risk for septic shock — neutropenic fever protocol initiated. PICC site clean without erythema. Hemodynamically stable currently (BP 104/68, HR 96, O2 sat 97% RA).',
    recommendation:'Strict contact precautions — double gloving. Repeat vitals q2h. If BP drops below 90 systolic: page Oncology fellow STAT. IV fluid bolus 500mL NS PRN. Family meeting scheduled 1100.',
    author:'Linda Foster', authorRole:'RN, CCU (covering Oncology)',
    unit:'Oncology', createdAt:'06:42 AM',
    sharedWith:['Oncology Team', 'Dr. Sanjay', 'Rapid Response'],
    acknowledged:true, priority:'critical',
  },
  {
    id:'sbar-004',
    patientRoom:'208B', patientName:'Murphy, O.',
    category:'handoff',
    situation:'Murphy, O. (MS-A 208B) — discharge cleared at 07:05. Scripts sent to pharmacy. Discharge instructions given and signed. Ambulating independently.',
    background:'41-year-old, admitted for musculoskeletal chest pain, ruled out ACS. Echo and stress test both negative. Cardiology clearance obtained last night.',
    assessment:'Stable for discharge. Insurance confirmed. Ride arranged (spouse arriving 0800).',
    recommendation:'Complete DC checklist before 0800. Return precautions reviewed. Follow-up with PCP in 5–7 days booked. Bed will be available for pending MS-A admission.',
    author:'Jennifer Martinez', authorRole:'RN, MS-A',
    unit:'MS-A', createdAt:'07:08 AM',
    sharedWith:['Charge RN', 'Case Management'],
    acknowledged:true, priority:'routine',
  },
]

// ── Templates ─────────────────────────────────────────────────────────────────

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id:'tmpl-001', name:'ED Diversion Notice', type:'emergency',
    icon:'🚨',
    body:'DIVERSION STATUS: ED is at capacity. All incoming EMS units are being redirected to [HOSPITAL]. Charge nurses: please hold all clean beds. Expected duration: [TIME]. Census update will follow at [TIME].',
  },
  {
    id:'tmpl-002', name:'Weather Emergency', type:'emergency',
    icon:'⛈',
    body:'WEATHER ALERT: [WEATHER EVENT] expected in our area [TIME FRAME]. Staff scheduling accommodations: notify supervisor by [TIME] if you anticipate travel difficulties. Hospital emergency operations plan activated. Essential staff only on premise. See HR Policy EMG-12.',
  },
  {
    id:'tmpl-003', name:'Rapid Response Activation', type:'clinical',
    icon:'🔴',
    body:'RAPID RESPONSE TEAM ACTIVATED — Room [ROOM]. Reason: [REASON]. RRT members needed: charge RN, respiratory, hospitalist. Responding nurses: please ensure your assigned patients are covered before responding.',
  },
  {
    id:'tmpl-004', name:'Code Gray — Security Event', type:'emergency',
    icon:'🔒',
    body:'CODE GRAY — [LOCATION]. Violent or combative situation. Do NOT approach. Call Security (ext. 4911) immediately. If in area: move to nearest secure zone. All non-essential staff clear the area. Update to follow.',
  },
  {
    id:'tmpl-005', name:'Unit Meeting Reminder', type:'operational',
    icon:'📋',
    body:'REMINDER: Unit staff meeting [DATE] at [TIME] in [LOCATION]. Agenda: [TOPICS]. Attendance expected for all day and evening shift staff. Night shift may attend via Zoom (link sent separately). CNO will be presenting Q1 quality metrics.',
  },
  {
    id:'tmpl-006', name:'New Protocol Announcement', type:'clinical',
    icon:'📄',
    body:'NEW PROTOCOL EFFECTIVE [DATE]: [PROTOCOL NAME]. Summary of changes: [CHANGES]. Training required: [YES/NO]. Resources available on the intranet (Policies > Nursing > [SECTION]). Questions: contact [NAME] at ext. [EXT].',
  },
]

// ── Auto-generated shift brief snapshot ───────────────────────────────────────

export interface ShiftBriefSnapshot {
  date:      string
  shift:     string
  staffing:  { onDuty: number; expected: number; callOuts: number; openGaps: number }
  census:    { total: number; capacity: number; pendingAdmits: number; expectedDc: number }
  safety:    { blockedNurses: number; incidentsOpen: number; ratioAlerts: number }
  onCall:    { activeActivations: number; activatedNurse?: string; activatedUnit?: string }
  highlights:string[]
  generatedAt: string
}

export function getShiftBrief(): ShiftBriefSnapshot {
  return {
    date: 'Friday, March 13, 2026',
    shift: 'Day Shift 07:00–15:00',
    staffing: { onDuty: 14, expected: 17, callOuts: 3, openGaps: 3 },
    census:   { total: 78, capacity: 102, pendingAdmits: 5, expectedDc: 19 },
    safety:   { blockedNurses: 3, incidentsOpen: 2, ratioAlerts: 1 },
    onCall:   { activeActivations: 1, activatedNurse: 'James Wilson', activatedUnit: 'ED' },
    highlights: [
      'ED surge protocol active — diversion yellow, 4–6 overflow admits expected',
      'Oncology ratio risk: 2 pending admits, float nurse requested',
      'Post-tPA patient (Adams, C.) in ED R07 — strict monitoring q15 min',
      'Neutropenic fever alert: Kelly, I. in Oncology 501B — blood cultures pending',
      '3 nurses at critical fatigue — blocked from OT (Thompson, Moore, White)',
      'CCU post-CABG Day 2 (Davis, R.) — milrinone wean, possible extubation by 1200',
    ],
    generatedAt: '07:00 AM',
  }
}

// ── Mutable state ─────────────────────────────────────────────────────────────

export function getAnnouncements(): Announcement[]  { return _announcements }
export function getSbarNotes(): SbarNote[]           { return _sbarNotes }
export function getShiftStaff(): ShiftStaff[]        { return _shiftStaff }

export function acknowledgeAnnouncement(announcementId: string, staffId: string) {
  const ann = _announcements.find(a => a.id === announcementId)
  if (ann && !ann.acknowledgedBy.includes(staffId)) {
    ann.acknowledgedBy.push(staffId)
  }
}

export function postAnnouncement(data: Omit<Announcement, 'id' | 'acknowledgedBy' | 'postedAt'>): Announcement {
  const ann: Announcement = {
    ...data,
    id: `ann-${Date.now()}`,
    acknowledgedBy: [],
    postedAt: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
  }
  _announcements.unshift(ann)
  return ann
}

export function saveSbarNote(data: Omit<SbarNote, 'id' | 'createdAt' | 'acknowledged'>): SbarNote {
  const note: SbarNote = {
    ...data,
    id: `sbar-${Date.now()}`,
    createdAt: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    acknowledged: false,
  }
  _sbarNotes.unshift(note)
  return note
}

export function acknowledgeSbar(noteId: string) {
  const note = _sbarNotes.find(n => n.id === noteId)
  if (note) note.acknowledged = true
}

export function acknowledgeBrief(staffId: string) {
  const staff = _shiftStaff.find(s => s.id === staffId)
  if (staff) staff.ackBrief = true
}

export const PRIORITY_META = {
  critical: { label:'Critical', color:'text-red-700',    bg:'bg-red-100',    border:'border-red-300',   dot:'bg-red-500' },
  urgent:   { label:'Urgent',   color:'text-orange-700', bg:'bg-orange-100', border:'border-orange-300',dot:'bg-orange-500' },
  routine:  { label:'Routine',  color:'text-slate-600',  bg:'bg-slate-100',  border:'border-slate-200', dot:'bg-slate-400' },
}

export const TYPE_META: Record<AnnouncementType, { label:string; color:string; bg:string; border:string; icon:string }> = {
  urgent:   { label:'Urgent',   color:'text-red-700',    bg:'bg-red-50',     border:'border-red-200',    icon:'🚨' },
  safety:   { label:'Safety',   color:'text-orange-700', bg:'bg-orange-50',  border:'border-orange-200', icon:'⚠️' },
  policy:   { label:'Policy',   color:'text-violet-700', bg:'bg-violet-50',  border:'border-violet-200', icon:'📋' },
  info:     { label:'Info',     color:'text-sky-700',    bg:'bg-sky-50',     border:'border-sky-200',    icon:'ℹ️' },
  reminder: { label:'Reminder', color:'text-amber-700',  bg:'bg-amber-50',   border:'border-amber-200',  icon:'🔔' },
}
