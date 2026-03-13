// incidentData.ts — Incident & Safety Hub
// Reference date: March 12, 2026

export type IncidentType =
  | 'medication-error'
  | 'patient-fall'
  | 'near-miss'
  | 'equipment-failure'
  | 'staff-injury'
  | 'patient-complaint'
  | 'infection-control'
  | 'security'
  | 'elopement'
  | 'pressure-injury'

export type IncidentSeverity = 1 | 2 | 3 | 4 | 5
// 1 = No harm (near-miss / caught before reaching patient)
// 2 = Minor harm (required minimal intervention)
// 3 = Moderate harm (required additional treatment)
// 4 = Major harm (caused permanent or prolonged harm)
// 5 = Catastrophic (death or severe permanent disability)

export type IncidentStatus = 'submitted' | 'investigating' | 'resolved' | 'escalated' | 'closed'

export interface IncidentNote {
  id: string
  author: string
  text: string
  createdAt: string
}

export interface Incident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  unit: string
  unitShort: string
  location: string              // e.g. "Bed 4", "Med Room B", "Hallway near elevator"
  occurredAt: string            // ISO datetime
  reportedAt: string            // ISO datetime
  reportedBy: string | null     // null = anonymous
  reportedByInitials: string | null
  involvedPatient: string | null // Patient name or "Anonymous Patient"
  title: string
  description: string
  immediateActions: string
  witnesses: string[]
  assignedTo: string | null
  resolvedAt: string | null
  notes: IncidentNote[]
  jcahoCategory: string         // Joint Commission reporting category
  rootCause: string | null
  preventionMeasures: string | null
}

// ─── Mutable state ────────────────────────────────────────────────────────────
const _statusOverrides = new Map<string, IncidentStatus>()
const _extraNotes = new Map<string, IncidentNote[]>()
const _extraIncidents: Incident[] = []
let _nextIncidentNum = 1
let _nextNoteNum = 1

export function getStatus(incident: Incident): IncidentStatus {
  return _statusOverrides.get(incident.id) ?? incident.status
}

export function updateStatus(id: string, status: IncidentStatus): void {
  _statusOverrides.set(id, status)
}

export function addNote(incidentId: string, author: string, text: string): IncidentNote {
  const note: IncidentNote = {
    id: `note-new-${String(_nextNoteNum++).padStart(3, '0')}`,
    author,
    text,
    createdAt: new Date().toISOString(),
  }
  const existing = _extraNotes.get(incidentId) ?? []
  _extraNotes.set(incidentId, [...existing, note])
  return note
}

export function getNotes(incident: Incident): IncidentNote[] {
  const extra = _extraNotes.get(incident.id) ?? []
  return [...incident.notes, ...extra]
}

export function submitIncident(data: {
  type: IncidentType
  severity: IncidentSeverity
  unit: string
  unitShort: string
  location: string
  title: string
  description: string
  immediateActions: string
  reportedBy: string | null
  reportedByInitials: string | null
  involvedPatient: string | null
}): Incident {
  const id = `inc-new-${String(_nextIncidentNum++).padStart(3, '0')}`
  const now = new Date().toISOString()
  const incident: Incident = {
    ...data,
    id,
    status: 'submitted',
    occurredAt: now,
    reportedAt: now,
    witnesses: [],
    assignedTo: null,
    resolvedAt: null,
    notes: [],
    jcahoCategory: TYPE_META[data.type].jcahoCategory,
    rootCause: null,
    preventionMeasures: null,
  }
  _extraIncidents.push(incident)
  return incident
}

export function getAllIncidents(): Incident[] {
  return [...INCIDENTS, ..._extraIncidents]
}

export function getIncidentSummary() {
  const all = getAllIncidents()
  const open = all.filter(i => ['submitted', 'investigating', 'escalated'].includes(getStatus(i)))
  const today = all.filter(i => i.reportedAt.startsWith('2026-03-12'))
  const critical = all.filter(i => i.severity >= 4)
  const resolutionRate = all.length > 0
    ? Math.round((all.filter(i => ['resolved', 'closed'].includes(getStatus(i))).length / all.length) * 100)
    : 0
  return { open: open.length, today: today.length, critical: critical.length, resolutionRate }
}

// ─── Trend data (30 days, by type) ───────────────────────────────────────────
export const TREND_DATA: { week: string; medication: number; fall: number; nearMiss: number; other: number }[] = [
  { week: 'Feb 10', medication: 2, fall: 1, nearMiss: 3, other: 1 },
  { week: 'Feb 17', medication: 3, fall: 2, nearMiss: 4, other: 2 },
  { week: 'Feb 24', medication: 1, fall: 3, nearMiss: 2, other: 1 },
  { week: 'Mar 3',  medication: 4, fall: 1, nearMiss: 5, other: 3 },
  { week: 'Mar 10', medication: 2, fall: 2, nearMiss: 3, other: 2 },
]

// ─── Incident records ─────────────────────────────────────────────────────────
export const INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    type: 'medication-error',
    severity: 3,
    status: 'investigating',
    unit: 'ICU',
    unitShort: 'ICU',
    location: 'Medication Room, Bed 4',
    occurredAt: '2026-03-12T08:15:00Z',
    reportedAt: '2026-03-12T08:45:00Z',
    reportedBy: 'Priya Sharma',
    reportedByInitials: 'PS',
    involvedPatient: 'Patient A (anonymized)',
    title: 'Incorrect insulin dose administered',
    description: 'RN administered 10 units of insulin glargine instead of prescribed 5 units. Discrepancy discovered during end-of-shift med reconciliation. Blood glucose checked immediately — 68 mg/dL. Physician notified within 5 minutes.',
    immediateActions: 'Blood glucose monitoring q30min × 2 hrs. Endocrinology consulted. Incident reported to charge nurse and attending physician. Patient stable at time of report.',
    witnesses: ['Maria Santos', 'Dr. Reyes'],
    assignedTo: 'Janet Morrison',
    resolvedAt: null,
    jcahoCategory: 'Medication Management',
    rootCause: null,
    preventionMeasures: null,
    notes: [
      { id: 'note-001', author: 'Janet Morrison', text: 'Pharmacy notified. Double-check protocol review scheduled for AM team huddle tomorrow.', createdAt: '2026-03-12T09:30:00Z' },
    ],
  },
  {
    id: 'inc-002',
    type: 'patient-fall',
    severity: 2,
    status: 'submitted',
    unit: 'Med-Surg B',
    unitShort: 'MS-B',
    location: 'Patient Room 312, en route to bathroom',
    occurredAt: '2026-03-12T06:30:00Z',
    reportedAt: '2026-03-12T07:00:00Z',
    reportedBy: 'Sarah Mitchell',
    reportedByInitials: 'SM',
    involvedPatient: 'Patient B (anonymized)',
    title: 'Unassisted patient fall — low injury',
    description: 'Patient (72F, post-op day 2) attempted to get out of bed unassisted at 0630. Found on floor by incoming shift nurse. Patient alert and oriented. Mild bruising to left hip. No head trauma. Fall risk Morse Score was 45 (moderate).',
    immediateActions: 'Full body assessment completed. Vital signs stable. X-ray ordered for left hip — results pending. Physician notified. Bed alarm re-enabled. Family notified.',
    witnesses: ['Natasha Perkins'],
    assignedTo: null,
    resolvedAt: null,
    jcahoCategory: 'Patient Safety Event',
    rootCause: null,
    preventionMeasures: null,
    notes: [],
  },
  {
    id: 'inc-003',
    type: 'near-miss',
    severity: 1,
    status: 'resolved',
    unit: 'ED',
    unitShort: 'ED',
    location: 'Triage Station 2',
    occurredAt: '2026-03-11T14:20:00Z',
    reportedAt: '2026-03-11T14:55:00Z',
    reportedBy: null,
    reportedByInitials: null,
    involvedPatient: null,
    title: 'Near-miss: wrong patient allergy alert bypassed',
    description: 'Allergy alert for penicillin appeared on screen during order entry for Patient C. Alert was initially clicked through ("override") before the nurse caught the error and stopped. Correct antibiotic (azithromycin) was ordered. No medication administered.',
    immediateActions: 'Correct order placed. EHR alert override workflow flagged for IT review. Anonymous report submitted per hospital policy.',
    witnesses: [],
    assignedTo: 'Beth Collins',
    resolvedAt: '2026-03-11T17:00:00Z',
    jcahoCategory: 'Near Miss',
    rootCause: 'Alert fatigue — EHR system generating excessive non-critical alerts leading to bypass behavior.',
    preventionMeasures: 'IT team reviewing alert thresholds. Targeted re-education for ED staff on allergy alert protocols.',
    notes: [
      { id: 'note-003a', author: 'Beth Collins', text: 'IT ticket submitted for EHR alert fatigue review. Expected resolution: 2 weeks.', createdAt: '2026-03-11T15:30:00Z' },
      { id: 'note-003b', author: 'Beth Collins', text: 'Root cause identified: alert fatigue. Prevention measures documented. Closing this incident.', createdAt: '2026-03-11T17:00:00Z' },
    ],
  },
  {
    id: 'inc-004',
    type: 'equipment-failure',
    severity: 2,
    status: 'escalated',
    unit: 'ICU',
    unitShort: 'ICU',
    location: 'Bed 7, ICU',
    occurredAt: '2026-03-12T05:45:00Z',
    reportedAt: '2026-03-12T06:00:00Z',
    reportedBy: 'James Okafor',
    reportedByInitials: 'JO',
    involvedPatient: 'Patient D (anonymized)',
    title: 'Ventilator low-pressure alarm — faulty sensor',
    description: 'Ventilator (Puritan Bennett 980) on ICU bed 7 triggered persistent low-pressure alarm at 0545. Biomedical engineering called. Sensor failure confirmed. Patient transferred to Bed 6 (available ventilator). Biomedical response time: 22 minutes.',
    immediateActions: 'Patient transferred to Bed 6 immediately. Manual bagging performed for 4 minutes during transfer. Respiratory therapy at bedside. Faulty ventilator tagged out of service.',
    witnesses: ['Maria Santos', 'RT On-Call'],
    assignedTo: 'Engineering',
    resolvedAt: null,
    jcahoCategory: 'Medical Equipment',
    rootCause: null,
    preventionMeasures: null,
    notes: [
      { id: 'note-004a', author: 'James Okafor', text: 'Biomedical engineering confirmed sensor failure. Unit PB-7 quarantined for full inspection.', createdAt: '2026-03-12T06:30:00Z' },
      { id: 'note-004b', author: 'Janet Morrison', text: 'Escalated to Risk Management due to patient transfer under vent. Director of Nursing notified.', createdAt: '2026-03-12T08:00:00Z' },
    ],
  },
  {
    id: 'inc-005',
    type: 'staff-injury',
    severity: 2,
    status: 'submitted',
    unit: 'Med-Surg A',
    unitShort: 'MS-A',
    location: 'Patient Room 224, repositioning',
    occurredAt: '2026-03-12T10:00:00Z',
    reportedAt: '2026-03-12T10:30:00Z',
    reportedBy: 'Mike Turner',
    reportedByInitials: 'MT',
    involvedPatient: null,
    title: 'RN back strain during patient repositioning',
    description: 'RN experienced acute lower-back pain while manually repositioning a 280 lb patient (post-stroke, minimal assist). Second staff member was not available for the two-person lift. Injury occurred when patient shifted unexpectedly.',
    immediateActions: 'RN relieved of patient care duties. Occupational health referral placed. Ice pack applied. Incident reported per Workers\' Comp protocol. Lift team policy reinforced with charge nurse.',
    witnesses: ['Zoe Alvarez'],
    assignedTo: null,
    resolvedAt: null,
    jcahoCategory: 'Workplace Safety',
    rootCause: null,
    preventionMeasures: null,
    notes: [],
  },
  {
    id: 'inc-006',
    type: 'infection-control',
    severity: 3,
    status: 'investigating',
    unit: 'Oncology',
    unitShort: 'ONC',
    location: 'ONC Unit, Rooms 501–506',
    occurredAt: '2026-03-10T00:00:00Z',
    reportedAt: '2026-03-10T14:00:00Z',
    reportedBy: 'Helen Forsyth',
    reportedByInitials: 'HF',
    involvedPatient: 'Multiple patients (3)',
    title: 'Cluster of GI symptoms — possible C. diff',
    description: 'Three oncology patients in adjacent rooms (501, 503, 505) developed GI symptoms (watery diarrhea, cramping) within 48 hours. Stool cultures ordered. Infection control team notified. Contact precautions implemented for all three rooms pending results.',
    immediateActions: 'Contact precautions (gown/glove) for Rooms 501, 503, 505. Stool cultures sent. Infection control nurse on-site. Enhanced environmental cleaning protocol activated. Results expected 24–48 hrs.',
    witnesses: ['Marcus Williams'],
    assignedTo: 'Infection Control Dept.',
    resolvedAt: null,
    jcahoCategory: 'Infection Prevention',
    rootCause: null,
    preventionMeasures: null,
    notes: [
      { id: 'note-006a', author: 'Helen Forsyth', text: 'All three patients on contact precautions. Family members educated on hand hygiene before room entry.', createdAt: '2026-03-10T15:00:00Z' },
      { id: 'note-006b', author: 'Infection Control', text: 'Environmental cultures swabbed from shared equipment. Preliminary stool results: C. diff PCR pending.', createdAt: '2026-03-11T09:00:00Z' },
    ],
  },
  {
    id: 'inc-007',
    type: 'patient-complaint',
    severity: 1,
    status: 'closed',
    unit: 'CCU',
    unitShort: 'CCU',
    location: 'CCU Family Waiting Area',
    occurredAt: '2026-03-09T15:30:00Z',
    reportedAt: '2026-03-09T16:00:00Z',
    reportedBy: 'Rachel Torres',
    reportedByInitials: 'RT',
    involvedPatient: 'Patient E family member',
    title: 'Family complaint: inadequate communication regarding care plan',
    description: 'Patient family member reported feeling uninformed about care plan changes made during rounds. Family was present at bedside but not included in the care discussion. Expressed frustration to charge nurse at 1530.',
    immediateActions: 'Charge nurse met with family for 20-minute care plan discussion. Attending physician paged to answer questions. Patient experience advocate notified.',
    witnesses: [],
    assignedTo: 'Rachel Torres',
    resolvedAt: '2026-03-10T10:00:00Z',
    jcahoCategory: 'Patient/Family Complaint',
    rootCause: 'Inconsistent family inclusion in bedside rounds.',
    preventionMeasures: 'Bedside rounding checklist updated to include family communication step. Reviewed at unit huddle Mar 11.',
    notes: [
      { id: 'note-007a', author: 'Rachel Torres', text: 'Family met with Dr. Chen and attending. Much more satisfied. Care plan printed and given to family.', createdAt: '2026-03-09T17:30:00Z' },
      { id: 'note-007b', author: 'Rachel Torres', text: 'Follow-up call to family — satisfied with resolution. Closing incident.', createdAt: '2026-03-10T10:00:00Z' },
    ],
  },
  {
    id: 'inc-008',
    type: 'pressure-injury',
    severity: 3,
    status: 'investigating',
    unit: 'ICU',
    unitShort: 'ICU',
    location: 'ICU Bed 2, sacral area',
    occurredAt: '2026-03-11T07:00:00Z',
    reportedAt: '2026-03-11T08:30:00Z',
    reportedBy: 'Maria Santos',
    reportedByInitials: 'MS',
    involvedPatient: 'Patient F (anonymized)',
    title: 'Stage 2 pressure injury — sacral area identified',
    description: 'During routine skin assessment at 0700, Stage 2 pressure injury (2cm × 1.5cm) identified on sacral area of patient (ICU day 14, sedated, minimal mobility). Area was documented as intact on previous assessment 12 hours prior.',
    immediateActions: 'Wound care nurse consulted. Wound photographed and documented. Off-loading protocol initiated. Specialty mattress ordered. Turn schedule increased to q1h. Physician and family notified.',
    witnesses: ['Priya Sharma'],
    assignedTo: 'Wound Care Nurse',
    resolvedAt: null,
    jcahoCategory: 'Pressure Injury',
    rootCause: null,
    preventionMeasures: null,
    notes: [
      { id: 'note-008a', author: 'Maria Santos', text: 'Specialty pressure-relieving mattress in place. Family updated and educated on repositioning importance.', createdAt: '2026-03-11T10:00:00Z' },
    ],
  },
]

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const TYPE_META: Record<IncidentType, {
  label: string; icon: string; color: string; bg: string; jcahoCategory: string
}> = {
  'medication-error':  { label: 'Medication Error',    icon: '💊', color: 'text-red-400',    bg: 'bg-red-500/15',    jcahoCategory: 'Medication Management' },
  'patient-fall':      { label: 'Patient Fall',         icon: '🏃', color: 'text-orange-400', bg: 'bg-orange-500/15', jcahoCategory: 'Patient Safety Event' },
  'near-miss':         { label: 'Near Miss',            icon: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-500/15', jcahoCategory: 'Near Miss' },
  'equipment-failure': { label: 'Equipment Failure',   icon: '⚙️', color: 'text-blue-400',   bg: 'bg-blue-500/15',   jcahoCategory: 'Medical Equipment' },
  'staff-injury':      { label: 'Staff Injury',         icon: '🩹', color: 'text-amber-400',  bg: 'bg-amber-500/15',  jcahoCategory: 'Workplace Safety' },
  'patient-complaint': { label: 'Patient Complaint',   icon: '💬', color: 'text-violet-400', bg: 'bg-violet-500/15', jcahoCategory: 'Patient/Family Complaint' },
  'infection-control': { label: 'Infection Control',   icon: '🦠', color: 'text-teal-400',   bg: 'bg-teal-500/15',   jcahoCategory: 'Infection Prevention' },
  'security':          { label: 'Security',             icon: '🔒', color: 'text-slate-400',  bg: 'bg-slate-500/15',  jcahoCategory: 'Security/Safety' },
  'elopement':         { label: 'Patient Elopement',   icon: '🚶', color: 'text-pink-400',   bg: 'bg-pink-500/15',   jcahoCategory: 'Patient Safety Event' },
  'pressure-injury':   { label: 'Pressure Injury',     icon: '🩺', color: 'text-rose-400',   bg: 'bg-rose-500/15',   jcahoCategory: 'Pressure Injury' },
}

export const SEVERITY_META: Record<IncidentSeverity, { label: string; color: string; bg: string; ring: string }> = {
  1: { label: 'No Harm',        color: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40' },
  2: { label: 'Minor Harm',     color: 'text-blue-400',    bg: 'bg-blue-500/15',    ring: 'ring-blue-500/40'    },
  3: { label: 'Moderate Harm',  color: 'text-amber-400',   bg: 'bg-amber-500/15',   ring: 'ring-amber-500/40'   },
  4: { label: 'Major Harm',     color: 'text-orange-400',  bg: 'bg-orange-500/15',  ring: 'ring-orange-500/40'  },
  5: { label: 'Catastrophic',   color: 'text-red-400',     bg: 'bg-red-500/15',     ring: 'ring-red-500/40'     },
}

export const STATUS_META: Record<IncidentStatus, { label: string; color: string; bg: string; dot: string }> = {
  submitted:    { label: 'Submitted',    color: 'text-amber-300',   bg: 'bg-amber-500/15',   dot: 'bg-amber-500'   },
  investigating:{ label: 'Investigating',color: 'text-blue-300',    bg: 'bg-blue-500/15',    dot: 'bg-blue-500'    },
  resolved:     { label: 'Resolved',    color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
  escalated:    { label: 'Escalated',   color: 'text-violet-300',  bg: 'bg-violet-500/15',  dot: 'bg-violet-500'  },
  closed:       { label: 'Closed',      color: 'text-slate-400',   bg: 'bg-slate-500/15',   dot: 'bg-slate-500'   },
}

export const INCIDENT_TYPES: IncidentType[] = [
  'medication-error', 'patient-fall', 'near-miss', 'equipment-failure',
  'staff-injury', 'patient-complaint', 'infection-control', 'security',
  'elopement', 'pressure-injury',
]

export const UNIT_OPTIONS = ['ICU', 'CCU', 'ED', 'Med-Surg A', 'Med-Surg B', 'Oncology', 'NICU', 'PACU', 'Ortho', 'Telemetry']
