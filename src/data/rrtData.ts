// ── RRT & Code Blue Data ────────────────────────────────────────────────────

export type EventType = 'code-blue' | 'rrt' | 'code-gray' | 'stemi' | 'stroke' | 'trauma'
export type EventStatus = 'active' | 'resolved' | 'cancelled'

export interface RrtTeamMember {
  id:              string
  name:            string
  initials:        string
  color:           string
  role:            string
  respondedAt:     string | null   // "HH:MM AM"
  responseTimeSec: number | null
}

export interface RrtEvent {
  id:                string
  type:              EventType
  status:            EventStatus
  location:          string   // e.g. "ICU – Room 108"
  unit:              string
  room:              string
  patientId?:        string
  patientName?:      string
  calledBy:          string
  calledAt:          string   // display string "HH:MM AM"
  startedAtMs:       number   // Date.now() at call time (for live timer)
  resolvedAt?:       string
  resolvedAtMs?:     number
  team:              RrtTeamMember[]
  outcome?:          string
  notes?:            string
  followUpRequired:  boolean
  followUpNotes?:    string
}

export interface RrtTrend {
  shift: string
  calls: number
}

// ── Event type metadata ──────────────────────────────────────────────────────

export const EVENT_META: Record<EventType, {
  label: string; emoji: string; color: string; bg: string; border: string; ring: string
}> = {
  'code-blue': { label:'Code Blue',  emoji:'💙', color:'text-blue-700',   bg:'bg-blue-50',    border:'border-blue-300',   ring:'ring-blue-500' },
  'rrt':       { label:'RRT',        emoji:'🔴', color:'text-red-700',    bg:'bg-red-50',     border:'border-red-300',    ring:'ring-red-500' },
  'code-gray': { label:'Code Gray',  emoji:'🩶', color:'text-slate-700',  bg:'bg-slate-100',  border:'border-slate-300',  ring:'ring-slate-500' },
  'stemi':     { label:'STEMI',      emoji:'❤️', color:'text-rose-700',   bg:'bg-rose-50',    border:'border-rose-300',   ring:'ring-rose-500' },
  'stroke':    { label:'Stroke',     emoji:'🧠', color:'text-violet-700', bg:'bg-violet-50',  border:'border-violet-300', ring:'ring-violet-500' },
  'trauma':    { label:'Trauma',     emoji:'🟡', color:'text-amber-700',  bg:'bg-amber-50',   border:'border-amber-300',  ring:'ring-amber-500' },
}

// ── Pre-built RRT team templates per event type ──────────────────────────────

const TEAM_TEMPLATES: Record<EventType, Omit<RrtTeamMember, 'respondedAt' | 'responseTimeSec'>[]> = {
  'code-blue': [
    { id:'tm-cb-1', name:'Dr. Angela Reeves',  initials:'AR', color:'from-sky-500 to-sky-700',      role:'Attending Physician' },
    { id:'tm-cb-2', name:'Kevin Park, RN',      initials:'KP', color:'from-violet-500 to-violet-700', role:'Code Team RN' },
    { id:'tm-cb-3', name:'Miguel Santos, RT',   initials:'MS', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy' },
    { id:'tm-cb-4', name:'Priya Nair, RN',      initials:'PN', color:'from-rose-500 to-rose-700',    role:'Charge RN' },
    { id:'tm-cb-5', name:'James Hill, Tech',    initials:'JH', color:'from-amber-500 to-amber-700',  role:'Code Cart / Tech' },
  ],
  'rrt': [
    { id:'tm-rrt-1', name:'Dr. Samuel Wu',      initials:'SW', color:'from-red-500 to-red-700',       role:'Hospitalist' },
    { id:'tm-rrt-2', name:'Linda Chen, RN',     initials:'LC', color:'from-violet-500 to-violet-700', role:'Rapid Response RN' },
    { id:'tm-rrt-3', name:'Omar Reyes, RT',     initials:'OR', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy' },
    { id:'tm-rrt-4', name:'Janet Morrison, RN', initials:'JM', color:'from-violet-600 to-violet-800', role:'Staffing Coordinator' },
  ],
  'stemi': [
    { id:'tm-st-1', name:'Dr. Elena Marchetti', initials:'EM', color:'from-rose-500 to-rose-700',    role:'Interventional Cardiologist' },
    { id:'tm-st-2', name:'Kevin Park, RN',       initials:'KP', color:'from-violet-500 to-violet-700', role:'Cath Lab RN' },
    { id:'tm-st-3', name:'Theresa Banks, RN',   initials:'TB', color:'from-sky-500 to-sky-700',      role:'ED Charge RN' },
    { id:'tm-st-4', name:'Miguel Santos, RT',   initials:'MS', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy' },
  ],
  'stroke': [
    { id:'tm-str-1', name:'Dr. James Okafor',   initials:'JO', color:'from-violet-500 to-violet-700', role:'Neurologist' },
    { id:'tm-str-2', name:'Priya Nair, RN',     initials:'PN', color:'from-rose-500 to-rose-700',    role:'Stroke RN' },
    { id:'tm-str-3', name:'Linda Chen, RN',     initials:'LC', color:'from-amber-500 to-amber-700',  role:'CT Technologist' },
  ],
  'code-gray': [
    { id:'tm-cg-1', name:'Officer T. Morris',   initials:'TM', color:'from-slate-500 to-slate-700',  role:'Security' },
    { id:'tm-cg-2', name:'Janet Morrison, RN',  initials:'JM', color:'from-violet-600 to-violet-800', role:'Charge RN' },
    { id:'tm-cg-3', name:'Dr. Samuel Wu',       initials:'SW', color:'from-sky-500 to-sky-700',      role:'Attending Physician' },
  ],
  'trauma': [
    { id:'tm-tr-1', name:'Dr. Angela Reeves',   initials:'AR', color:'from-amber-500 to-amber-700',  role:'Trauma Surgeon' },
    { id:'tm-tr-2', name:'Kevin Park, RN',       initials:'KP', color:'from-violet-500 to-violet-700', role:'Trauma RN' },
    { id:'tm-tr-3', name:'Miguel Santos, RT',   initials:'MS', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy' },
    { id:'tm-tr-4', name:'James Hill, Tech',    initials:'JH', color:'from-amber-500 to-amber-700',  role:'Trauma Tech' },
    { id:'tm-tr-5', name:'Theresa Banks, RN',   initials:'TB', color:'from-sky-500 to-sky-700',      role:'Charge RN' },
  ],
}

function buildTeam(type: EventType): RrtTeamMember[] {
  return TEAM_TEMPLATES[type].map((m, i) => ({
    ...m,
    respondedAt: i < 2 ? (i === 0 ? '06:52 AM' : '06:54 AM') : null,
    responseTimeSec: i < 2 ? (i === 0 ? 90 : 210) : null,
  }))
}

// ── Live store ───────────────────────────────────────────────────────────────

const NOW = Date.now()

let _events: RrtEvent[] = [
  {
    id: 'evt-001',
    type: 'rrt',
    status: 'active',
    location: 'Oncology – Room 512',
    unit: 'Oncology',
    room: '512',
    patientId: 'p-078',
    patientName: 'Rivera, M.',
    calledBy: 'Nurse K. Park',
    calledAt: '06:50 AM',
    startedAtMs: NOW - 7 * 60 * 1000,   // 7 min ago
    team: buildTeam('rrt'),
    followUpRequired: false,
  },
]

let _history: RrtEvent[] = [
  {
    id: 'hist-001',
    type: 'code-blue',
    status: 'resolved',
    location: 'ICU – Room 108',
    unit: 'ICU',
    room: '108',
    patientName: 'Davis, R.',
    calledBy: 'Nurse L. Chen',
    calledAt: '03:42 AM',
    startedAtMs: NOW - 3.5 * 60 * 60 * 1000,
    resolvedAt: '04:01 AM',
    resolvedAtMs: NOW - 3.2 * 60 * 60 * 1000,
    team: [
      { id:'h1-t1', name:'Dr. Angela Reeves', initials:'AR', color:'from-sky-500 to-sky-700', role:'Attending Physician', respondedAt:'03:44 AM', responseTimeSec:120 },
      { id:'h1-t2', name:'Kevin Park, RN',     initials:'KP', color:'from-violet-500 to-violet-700', role:'Code Team RN', respondedAt:'03:43 AM', responseTimeSec:60 },
      { id:'h1-t3', name:'Miguel Santos, RT',  initials:'MS', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy', respondedAt:'03:45 AM', responseTimeSec:180 },
    ],
    outcome: 'ROSC achieved. Transferred to ICU step-down for monitoring.',
    notes: 'V-fib arrest. Defibrillated x2. ROSC at 03:58.',
    followUpRequired: true,
    followUpNotes: 'Cardiology consult at 0800. Family notification completed.',
  },
  {
    id: 'hist-002',
    type: 'stroke',
    status: 'resolved',
    location: 'ED – Room 7',
    unit: 'ED',
    room: '7',
    patientName: 'Thompson, A.',
    calledBy: 'Dr. R. Kim',
    calledAt: '05:15 AM',
    startedAtMs: NOW - 2 * 60 * 60 * 1000,
    resolvedAt: '05:48 AM',
    resolvedAtMs: NOW - 1.5 * 60 * 60 * 1000,
    team: [
      { id:'h2-t1', name:'Dr. James Okafor', initials:'JO', color:'from-violet-500 to-violet-700', role:'Neurologist', respondedAt:'05:18 AM', responseTimeSec:180 },
      { id:'h2-t2', name:'Priya Nair, RN',   initials:'PN', color:'from-rose-500 to-rose-700', role:'Stroke RN', respondedAt:'05:17 AM', responseTimeSec:120 },
    ],
    outcome: 'tPA administered. NIHSS improved from 14→8 post-treatment.',
    notes: 'Door-to-needle time: 33 minutes. CT confirmed ischemic stroke.',
    followUpRequired: false,
  },
  {
    id: 'hist-003',
    type: 'rrt',
    status: 'resolved',
    location: 'MS-B – Room 234',
    unit: 'MS-B',
    room: '234',
    patientName: 'Patel, S.',
    calledBy: 'Nurse T. Banks',
    calledAt: '01:30 AM',
    startedAtMs: NOW - 5.5 * 60 * 60 * 1000,
    resolvedAt: '01:55 AM',
    resolvedAtMs: NOW - 5 * 60 * 60 * 1000,
    team: [
      { id:'h3-t1', name:'Dr. Samuel Wu',   initials:'SW', color:'from-red-500 to-red-700', role:'Hospitalist', respondedAt:'01:32 AM', responseTimeSec:120 },
      { id:'h3-t2', name:'Linda Chen, RN',  initials:'LC', color:'from-violet-500 to-violet-700', role:'Rapid Response RN', respondedAt:'01:31 AM', responseTimeSec:60 },
      { id:'h3-t3', name:'Omar Reyes, RT',  initials:'OR', color:'from-emerald-500 to-emerald-700', role:'Respiratory Therapy', respondedAt:'01:34 AM', responseTimeSec:240 },
    ],
    outcome: 'SpO2 stabilised to 96%. O2 therapy initiated. Transferred to stepdown.',
    notes: 'SpO2 dropped to 82%. Suspected aspiration. Suctioned and repositioned.',
    followUpRequired: true,
    followUpNotes: 'Aspiration precautions ordered. Speech therapy consult at 0900.',
  },
  {
    id: 'hist-004',
    type: 'stemi',
    status: 'resolved',
    location: 'ED – Room 2',
    unit: 'ED',
    room: '2',
    patientName: 'Wilson, J.',
    calledBy: 'Nurse K. Rodriguez',
    calledAt: 'Yesterday 22:10',
    startedAtMs: NOW - 9 * 60 * 60 * 1000,
    resolvedAt: 'Yesterday 22:48',
    resolvedAtMs: NOW - 8.3 * 60 * 60 * 1000,
    team: [
      { id:'h4-t1', name:'Dr. Elena Marchetti', initials:'EM', color:'from-rose-500 to-rose-700', role:'Interventional Cardiologist', respondedAt:'22:13', responseTimeSec:180 },
      { id:'h4-t2', name:'Kevin Park, RN',       initials:'KP', color:'from-violet-500 to-violet-700', role:'Cath Lab RN', respondedAt:'22:15', responseTimeSec:300 },
    ],
    outcome: 'PCI successful. LAD stented. Transferred to cardiac ICU.',
    notes: 'Door-to-balloon time: 38 minutes.',
    followUpRequired: false,
  },
]

export const CALL_TRENDS: RrtTrend[] = [
  { shift: 'Mon Day',   calls: 1 },
  { shift: 'Mon Eve',   calls: 0 },
  { shift: 'Mon Night', calls: 2 },
  { shift: 'Tue Day',   calls: 1 },
  { shift: 'Tue Eve',   calls: 1 },
  { shift: 'Tue Night', calls: 0 },
  { shift: 'Wed Day',   calls: 2 },
  { shift: 'Wed Eve',   calls: 1 },
  { shift: 'Wed Night', calls: 3 },
  { shift: 'Thu Day',   calls: 0 },
  { shift: 'Thu Eve',   calls: 2 },
  { shift: 'Thu Night', calls: 1 },
  { shift: 'Fri Day',   calls: 2 },  // today
]

export const OUTCOME_OPTIONS = [
  'ROSC achieved — transferred to ICU',
  'Stabilised — continued on unit',
  'Transferred to higher level of care',
  'tPA / PCI administered',
  'Palliative / comfort care transition',
  'Psychiatric hold initiated',
  'Discharged from event — no intervention needed',
  'Other — see notes',
]

// ── Selectors ────────────────────────────────────────────────────────────────

export function getActiveEvents(): RrtEvent[] {
  return _events.filter(e => e.status === 'active')
}

export function getHistoryEvents(): RrtEvent[] {
  return [..._history].reverse()
}

export function getEventById(id: string): RrtEvent | undefined {
  return _events.find(e => e.id === id) ?? _history.find(e => e.id === id)
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function activateEvent(
  type: EventType,
  unit: string,
  room: string,
  calledBy: string,
  patientName?: string,
): RrtEvent {
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  const evt: RrtEvent = {
    id: `evt-${Date.now()}`,
    type,
    status: 'active',
    location: `${unit} – Room ${room}`,
    unit,
    room,
    patientName,
    calledBy,
    calledAt: timeStr,
    startedAtMs: Date.now(),
    team: buildTeam(type).map(m => ({ ...m, respondedAt: null, responseTimeSec: null })),
    followUpRequired: false,
  }
  _events.push(evt)
  return evt
}

export function markTeamArrived(eventId: string, memberId: string): void {
  const evt = _events.find(e => e.id === eventId)
  if (!evt) return
  const member = evt.team.find(m => m.id === memberId)
  if (member && !member.respondedAt) {
    const now = new Date()
    member.respondedAt = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    member.responseTimeSec = Math.round((Date.now() - evt.startedAtMs) / 1000)
  }
}

export function resolveEvent(eventId: string, outcome: string, notes: string, followUpRequired: boolean, followUpNotes?: string): void {
  const idx = _events.findIndex(e => e.id === eventId)
  if (idx === -1) return
  const evt = _events[idx]
  const now = new Date()
  const resolved: RrtEvent = {
    ...evt,
    status: 'resolved',
    resolvedAt: now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
    resolvedAtMs: Date.now(),
    outcome,
    notes,
    followUpRequired,
    followUpNotes: followUpNotes ?? undefined,
  }
  _history.push(resolved)
  _events.splice(idx, 1)
}
