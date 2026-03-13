// onboardingData.ts — Smart Onboarding Hub
// Reference date: March 12, 2026
// Tracks new hire onboarding progress with task checklists,
// auto-assigned tasks by category, and overdue detection.

export type OnboardingStatus = 'pre-start' | 'in-progress' | 'at-risk' | 'completed'
export type TaskCategory = 'hr-legal' | 'it-setup' | 'clinical' | 'unit-intro' | 'compliance'
export type TaskAssignee = 'hr' | 'manager' | 'education' | 'it' | 'new-hire' | 'buddy'

export interface OnboardingTask {
  id: string
  category: TaskCategory
  title: string
  description: string
  assignee: TaskAssignee
  dueDay: number        // day relative to start date
  completedDate: string | null
  completedBy: string | null
  required: boolean
}

export interface NewHire {
  id: string
  name: string
  initials: string
  role: string
  unit: string
  manager: string
  startDate: string        // ISO date
  daysSinceStart: number   // negative = pre-start
  status: OnboardingStatus
  email: string
  phone: string
  buddy: string | null
  tasks: OnboardingTask[]
}

// ─── Mutable state ────────────────────────────────────────────────────────────
const _completedTasks = new Set<string>()
const _reminderSent = new Set<string>()       // hireId
const _extraHires: NewHire[] = []
let _nextHireNum = 1

export function completeTask(taskId: string): void {
  _completedTasks.add(taskId)
}

export function isTaskCompleted(task: OnboardingTask): boolean {
  return _completedTasks.has(task.id) || task.completedDate !== null
}

export function hasReminderSent(hireId: string): boolean {
  return _reminderSent.has(hireId)
}

export function sendReminder(hireId: string): void {
  _reminderSent.add(hireId)
  setTimeout(() => _reminderSent.delete(hireId), 5000)
}

export function getProgress(hire: NewHire): number {
  const total = hire.tasks.length
  if (total === 0) return 0
  const done = hire.tasks.filter(t => isTaskCompleted(t)).length
  return Math.round((done / total) * 100)
}

export function getOverdueTasks(hire: NewHire): OnboardingTask[] {
  if (hire.daysSinceStart < 0) return []
  return hire.tasks.filter(t => !isTaskCompleted(t) && t.dueDay < hire.daysSinceStart)
}

export function addHire(hire: Omit<NewHire, 'id' | 'tasks' | 'status'> & { role: NewHire['role'] }): NewHire {
  const id = `hire-new-${String(_nextHireNum).padStart(3, '0')}`
  _nextHireNum++
  const tasks = generateDefaultTasks(id, hire.role)
  const newHire: NewHire = {
    ...hire,
    id,
    tasks,
    status: hire.daysSinceStart < 0 ? 'pre-start' : 'in-progress',
  }
  _extraHires.push(newHire)
  return newHire
}

export function getAllHires(): NewHire[] {
  return [...HIRES, ..._extraHires]
}

export function getSummary() {
  const all = getAllHires()
  const active = all.filter(h => h.status !== 'completed')
  const atRisk = active.filter(h => getOverdueTasks(h).length > 0)
  const completedThisMonth = all.filter(h => h.status === 'completed').length
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((s, h) => s + getProgress(h), 0) / active.length)
    : 0
  return { total: active.length, atRisk: atRisk.length, completedThisMonth, avgProgress }
}

// ─── Default task template (generic for new hires) ────────────────────────────
function generateDefaultTasks(hireId: string, _role: string): OnboardingTask[] {
  return [
    { id: `${hireId}-t01`, category: 'hr-legal',   title: 'I-9 Employment Verification',       description: 'Verify identity and employment authorization documents.', assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t02`, category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',        description: 'Complete federal income tax withholding form.', assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t03`, category: 'hr-legal',   title: 'Benefits Enrollment',                description: 'Select health, dental, vision, and 401k options.', assignee: 'new-hire', dueDay: 3,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t04`, category: 'it-setup',   title: 'Epic EHR Access Request',            description: 'Submit EHR system access and role assignment.', assignee: 'it',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t05`, category: 'it-setup',   title: 'ID Badge & Door Access',             description: 'Issue photo ID badge and unit door access card.', assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t06`, category: 'clinical',   title: 'Hospital Safety Orientation',        description: 'Complete 4-hour general safety and emergency procedures.', assignee: 'education', dueDay: 3,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t07`, category: 'clinical',   title: 'Infection Control & Hand Hygiene',   description: 'Complete CDC-aligned infection prevention training module.', assignee: 'education', dueDay: 5,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t08`, category: 'clinical',   title: 'Medication Administration Test',     description: 'Pass 80% on medication safety competency assessment.', assignee: 'education', dueDay: 7,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t09`, category: 'unit-intro', title: 'Buddy Nurse Assignment',             description: 'Assign experienced peer mentor for first 30 days.', assignee: 'manager',  dueDay: 1,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t10`, category: 'unit-intro', title: 'Unit Tour & Charge Nurse Meet',      description: 'Walk the unit, meet charge nurses, locate emergency equipment.', assignee: 'buddy',    dueDay: 3,  completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t11`, category: 'compliance', title: 'HIPAA Privacy Training',             description: 'Complete annual HIPAA compliance and patient privacy module.', assignee: 'education', dueDay: 14, completedDate: null, completedBy: null, required: true  },
    { id: `${hireId}-t12`, category: 'compliance', title: 'Unit Competency Checklist',          description: 'Complete all role-specific skills and competency sign-offs.', assignee: 'manager',  dueDay: 30, completedDate: null, completedBy: null, required: true  },
  ]
}

// ─── Hire records ─────────────────────────────────────────────────────────────
export const HIRES: NewHire[] = [
  {
    id: 'hire-ek',
    name: 'Emily Kowalski',
    initials: 'EK',
    role: 'RN',
    unit: 'ICU',
    manager: 'Priya Sharma',
    startDate: '2026-03-09',
    daysSinceStart: 3,
    status: 'at-risk',
    email: 'emily.kowalski@mercygeneral.org',
    phone: '(555) 847-3021',
    buddy: 'Maria Santos',
    tasks: [
      { id: 'ek-t01', category: 'hr-legal',   title: 'I-9 Employment Verification',      description: 'Identity and work authorization documents verified.',       assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-09', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'ek-t02', category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',       description: 'Federal income tax withholding election completed.',         assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-09', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'ek-t03', category: 'hr-legal',   title: 'Benefits Enrollment',               description: 'Select health, dental, vision, and 401k options.',          assignee: 'new-hire', dueDay: 2,  completedDate: null,         completedBy: null,            required: true  },
      { id: 'ek-t04', category: 'it-setup',   title: 'Epic EHR Access Request',           description: 'System access submitted — provisioning in progress.',       assignee: 'it',       dueDay: 1,  completedDate: '2026-03-09', completedBy: 'IT Help Desk',  required: true  },
      { id: 'ek-t05', category: 'it-setup',   title: 'ID Badge & Door Access',            description: 'Photo ID badge issued, ICU door access active.',            assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-09', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'ek-t06', category: 'clinical',   title: 'Hospital Safety Orientation',       description: 'General safety and emergency procedures completed.',         assignee: 'education', dueDay: 2, completedDate: '2026-03-10', completedBy: 'Education Dept', required: true },
      { id: 'ek-t07', category: 'clinical',   title: 'Infection Control & Hand Hygiene',  description: 'Complete CDC-aligned infection prevention training.',         assignee: 'education', dueDay: 2, completedDate: null,         completedBy: null,            required: true  },
      { id: 'ek-t08', category: 'clinical',   title: 'Medication Administration Test',    description: 'Pass 80% on medication safety competency assessment.',       assignee: 'education', dueDay: 7, completedDate: null,         completedBy: null,            required: false },
      { id: 'ek-t09', category: 'unit-intro', title: 'Buddy Nurse Assignment',            description: 'Assigned: Maria Santos (CCRN, 7y ICU experience).',         assignee: 'manager',  dueDay: 1,  completedDate: '2026-03-09', completedBy: 'Priya Sharma',  required: true  },
      { id: 'ek-t10', category: 'unit-intro', title: 'Unit Tour & Charge Nurse Meet',     description: 'Walk the unit, meet charge nurses, locate emergency equipment.', assignee: 'buddy', dueDay: 3, completedDate: '2026-03-11', completedBy: 'Maria Santos', required: true  },
      { id: 'ek-t11', category: 'compliance', title: 'HIPAA Privacy Training',            description: 'Annual HIPAA compliance and patient privacy module.',         assignee: 'education', dueDay: 14, completedDate: null, completedBy: null, required: true  },
      { id: 'ek-t12', category: 'compliance', title: 'ICU Competency Checklist',          description: 'All ICU role-specific skills and competency sign-offs.',     assignee: 'manager',  dueDay: 30, completedDate: null, completedBy: null, required: true  },
    ],
  },
  {
    id: 'hire-mb',
    name: 'Marcus Brown',
    initials: 'MB',
    role: 'RN',
    unit: 'ED',
    manager: 'Nathan Foster',
    startDate: '2026-03-05',
    daysSinceStart: 7,
    status: 'at-risk',
    email: 'marcus.brown@mercygeneral.org',
    phone: '(555) 302-7841',
    buddy: 'Carlos Rivera',
    tasks: [
      { id: 'mb-t01', category: 'hr-legal',   title: 'I-9 Employment Verification',      description: 'Identity and work authorization documents verified.',       assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-05', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'mb-t02', category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',       description: 'Federal income tax withholding election completed.',         assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-05', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'mb-t03', category: 'hr-legal',   title: 'Benefits Enrollment',               description: 'Select health, dental, vision, and 401k options.',          assignee: 'new-hire', dueDay: 3,  completedDate: '2026-03-08', completedBy: 'Marcus Brown', required: true  },
      { id: 'mb-t04', category: 'it-setup',   title: 'Epic EHR Access Request',           description: 'EHR access provisioned and tested.',                        assignee: 'it',       dueDay: 1,  completedDate: '2026-03-05', completedBy: 'IT Help Desk',  required: true  },
      { id: 'mb-t05', category: 'it-setup',   title: 'ID Badge & Door Access',            description: 'Photo ID badge issued, ED door access active.',             assignee: 'hr',       dueDay: 1,  completedDate: '2026-03-05', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'mb-t06', category: 'clinical',   title: 'Hospital Safety Orientation',       description: 'General safety and emergency procedures completed.',         assignee: 'education', dueDay: 3, completedDate: '2026-03-07', completedBy: 'Education Dept', required: true },
      { id: 'mb-t07', category: 'clinical',   title: 'Infection Control & Hand Hygiene',  description: 'Complete CDC-aligned infection prevention training.',         assignee: 'education', dueDay: 5, completedDate: '2026-03-09', completedBy: 'Education Dept', required: true },
      { id: 'mb-t08', category: 'clinical',   title: 'Trauma Nursing Core Course',        description: 'Complete TNCC prerequisites and register for next course.',  assignee: 'education', dueDay: 7, completedDate: null,         completedBy: null,            required: false },
      { id: 'mb-t09', category: 'unit-intro', title: 'Buddy Nurse Assignment',            description: 'Assigned: Carlos Rivera (TNCC, 3y ED experience).',         assignee: 'manager',  dueDay: 1,  completedDate: '2026-03-05', completedBy: 'Nathan Foster',  required: true  },
      { id: 'mb-t10', category: 'unit-intro', title: 'ED Triage Protocol Training',       description: 'ESI triage scale training and shadow triage sessions.',      assignee: 'buddy',    dueDay: 5,  completedDate: null,         completedBy: null,            required: true  },
      { id: 'mb-t11', category: 'compliance', title: 'HIPAA Privacy Training',            description: 'Annual HIPAA compliance and patient privacy module.',         assignee: 'education', dueDay: 14, completedDate: null, completedBy: null, required: true  },
      { id: 'mb-t12', category: 'compliance', title: 'ED Competency Checklist',           description: 'All ED role-specific skills and competency sign-offs.',      assignee: 'manager',  dueDay: 30, completedDate: null, completedBy: null, required: true  },
    ],
  },
  {
    id: 'hire-pv',
    name: 'Priscilla Vargas',
    initials: 'PV',
    role: 'LPN',
    unit: 'Med-Surg A',
    manager: 'Beth Collins',
    startDate: '2026-02-26',
    daysSinceStart: 14,
    status: 'in-progress',
    email: 'priscilla.vargas@mercygeneral.org',
    phone: '(555) 519-2047',
    buddy: 'Mike Turner',
    tasks: [
      { id: 'pv-t01', category: 'hr-legal',   title: 'I-9 Employment Verification',      description: 'Identity and work authorization documents verified.',       assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-26', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'pv-t02', category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',       description: 'Federal income tax withholding election completed.',         assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-26', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'pv-t03', category: 'hr-legal',   title: 'Benefits Enrollment',               description: 'Selected PPO plan, dental, vision. 401k at 4%.',           assignee: 'new-hire', dueDay: 3,  completedDate: '2026-02-28', completedBy: 'Priscilla Vargas', required: true },
      { id: 'pv-t04', category: 'it-setup',   title: 'Epic EHR Access Request',           description: 'EHR access provisioned with LPN role template.',            assignee: 'it',       dueDay: 1,  completedDate: '2026-02-26', completedBy: 'IT Help Desk',  required: true  },
      { id: 'pv-t05', category: 'it-setup',   title: 'ID Badge & Door Access',            description: 'Photo ID badge issued, Med-Surg A access active.',          assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-26', completedBy: 'Linda H. (HR)', required: true  },
      { id: 'pv-t06', category: 'clinical',   title: 'Hospital Safety Orientation',       description: 'General safety and emergency procedures completed.',         assignee: 'education', dueDay: 3, completedDate: '2026-02-28', completedBy: 'Education Dept', required: true },
      { id: 'pv-t07', category: 'clinical',   title: 'Infection Control & Hand Hygiene',  description: 'CDC infection prevention training completed and passed.',    assignee: 'education', dueDay: 5, completedDate: '2026-03-02', completedBy: 'Education Dept', required: true },
      { id: 'pv-t08', category: 'clinical',   title: 'Medication Administration Test',    description: 'Scored 91% — passed. Certificate issued.',                  assignee: 'education', dueDay: 7, completedDate: '2026-03-04', completedBy: 'Education Dept', required: true },
      { id: 'pv-t09', category: 'unit-intro', title: 'Buddy Nurse Assignment',            description: 'Assigned: Mike Turner (BSN, 4y Med-Surg experience).',      assignee: 'manager',  dueDay: 1,  completedDate: '2026-02-26', completedBy: 'Beth Collins',  required: true  },
      { id: 'pv-t10', category: 'unit-intro', title: 'Unit Tour & Charge Nurse Meet',     description: 'Unit tour completed. Met all charge nurses.',               assignee: 'buddy',    dueDay: 3,  completedDate: '2026-02-28', completedBy: 'Mike Turner',  required: true  },
      { id: 'pv-t11', category: 'compliance', title: 'HIPAA Privacy Training',            description: 'HIPAA training assigned — due March 11.',                   assignee: 'education', dueDay: 14, completedDate: null, completedBy: null, required: true  },
      { id: 'pv-t12', category: 'compliance', title: 'Med-Surg Competency Checklist',     description: 'Skills checklist in progress with Mike Turner.',             assignee: 'manager',  dueDay: 30, completedDate: null, completedBy: null, required: true  },
    ],
  },
  {
    id: 'hire-dw',
    name: 'Darius Webb',
    initials: 'DW',
    role: 'RN',
    unit: 'CCU',
    manager: 'Rachel Torres',
    startDate: '2026-03-15',
    daysSinceStart: -3,
    status: 'pre-start',
    email: 'darius.webb@mercygeneral.org',
    phone: '(555) 674-8820',
    buddy: null,
    tasks: [
      { id: 'dw-t01', category: 'hr-legal',   title: 'I-9 Employment Verification',      description: 'Scheduled for Day 1 — documents received pre-start.',       assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t02', category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',       description: 'Sent via DocuSign — pending signature.',                    assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t03', category: 'hr-legal',   title: 'Benefits Enrollment',               description: 'Enrollment window opens Day 1.',                            assignee: 'new-hire', dueDay: 3,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t04', category: 'it-setup',   title: 'Epic EHR Access Request',           description: 'Access request pre-submitted — activates Day 1.',           assignee: 'it',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t05', category: 'it-setup',   title: 'ID Badge & Door Access',            description: 'Photo appointment scheduled for 7:30 AM Day 1.',           assignee: 'hr',       dueDay: 1,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t06', category: 'clinical',   title: 'Hospital Safety Orientation',       description: 'Registered for Day 3 orientation class (8:00 AM).',         assignee: 'education', dueDay: 3, completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t07', category: 'clinical',   title: 'Infection Control & Hand Hygiene',  description: 'Online module available in LMS — complete by Day 5.',       assignee: 'education', dueDay: 5, completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t08', category: 'clinical',   title: 'Medication Administration Test',    description: 'Competency exam scheduled for Day 7.',                      assignee: 'education', dueDay: 7, completedDate: null, completedBy: null, required: false },
      { id: 'dw-t09', category: 'unit-intro', title: 'Buddy Nurse Assignment',            description: 'Pending — assign a CCU buddy before start date.',           assignee: 'manager',  dueDay: 1,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t10', category: 'unit-intro', title: 'Unit Tour & Charge Nurse Meet',     description: 'Schedule for Day 3 with Rachel Torres.',                    assignee: 'buddy',    dueDay: 3,  completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t11', category: 'compliance', title: 'HIPAA Privacy Training',            description: 'Online module — complete by Day 14.',                       assignee: 'education', dueDay: 14, completedDate: null, completedBy: null, required: true  },
      { id: 'dw-t12', category: 'compliance', title: 'CCU Competency Checklist',          description: 'Complete all CCU skills sign-offs by Day 30.',              assignee: 'manager',  dueDay: 30, completedDate: null, completedBy: null, required: true  },
    ],
  },
  {
    id: 'hire-hf',
    name: 'Helen Forsyth',
    initials: 'HF',
    role: 'Charge RN',
    unit: 'Oncology',
    manager: 'Janet Morrison',
    startDate: '2026-02-10',
    daysSinceStart: 30,
    status: 'completed',
    email: 'helen.forsyth@mercygeneral.org',
    phone: '(555) 291-6034',
    buddy: 'Marcus Williams',
    tasks: [
      { id: 'hf-t01', category: 'hr-legal',   title: 'I-9 Employment Verification',      description: 'Completed Day 1.',  assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-10', completedBy: 'Linda H. (HR)',       required: true  },
      { id: 'hf-t02', category: 'hr-legal',   title: 'W-4 Federal Tax Withholding',       description: 'Completed Day 1.',  assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-10', completedBy: 'Linda H. (HR)',       required: true  },
      { id: 'hf-t03', category: 'hr-legal',   title: 'Benefits Enrollment',               description: 'Completed Day 2.',  assignee: 'new-hire', dueDay: 3,  completedDate: '2026-02-11', completedBy: 'Helen Forsyth',       required: true  },
      { id: 'hf-t04', category: 'it-setup',   title: 'Epic EHR Access Request',           description: 'Completed Day 1.',  assignee: 'it',       dueDay: 1,  completedDate: '2026-02-10', completedBy: 'IT Help Desk',        required: true  },
      { id: 'hf-t05', category: 'it-setup',   title: 'ID Badge & Door Access',            description: 'Completed Day 1.',  assignee: 'hr',       dueDay: 1,  completedDate: '2026-02-10', completedBy: 'Linda H. (HR)',       required: true  },
      { id: 'hf-t06', category: 'clinical',   title: 'Hospital Safety Orientation',       description: 'Completed Day 3.',  assignee: 'education', dueDay: 3, completedDate: '2026-02-12', completedBy: 'Education Dept',     required: true  },
      { id: 'hf-t07', category: 'clinical',   title: 'Infection Control & Hand Hygiene',  description: 'Completed Day 4.',  assignee: 'education', dueDay: 5, completedDate: '2026-02-13', completedBy: 'Education Dept',     required: true  },
      { id: 'hf-t08', category: 'clinical',   title: 'Oncology Medication Safety',        description: 'Passed Day 7.',     assignee: 'education', dueDay: 7, completedDate: '2026-02-17', completedBy: 'Education Dept',     required: true  },
      { id: 'hf-t09', category: 'unit-intro', title: 'Buddy Nurse Assignment',            description: 'Marcus Williams.',  assignee: 'manager',  dueDay: 1,  completedDate: '2026-02-10', completedBy: 'Janet Morrison',     required: true  },
      { id: 'hf-t10', category: 'unit-intro', title: 'Unit Tour & Charge Nurse Meet',     description: 'Completed Day 2.',  assignee: 'buddy',    dueDay: 3,  completedDate: '2026-02-11', completedBy: 'Marcus Williams',    required: true  },
      { id: 'hf-t11', category: 'compliance', title: 'HIPAA Privacy Training',            description: 'Completed Day 12.', assignee: 'education', dueDay: 14, completedDate: '2026-02-22', completedBy: 'Education Dept',    required: true  },
      { id: 'hf-t12', category: 'compliance', title: 'Oncology Charge RN Competency',     description: 'All sign-offs complete. Cleared for independent charge.', assignee: 'manager', dueDay: 30, completedDate: '2026-03-11', completedBy: 'Janet Morrison', required: true },
    ],
  },
]

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const STATUS_META: Record<OnboardingStatus, { label: string; color: string; bg: string; dot: string }> = {
  'pre-start':   { label: 'Pre-Start',   color: 'text-blue-300',    bg: 'bg-blue-500/15',    dot: 'bg-blue-500'    },
  'in-progress': { label: 'In Progress', color: 'text-violet-300',  bg: 'bg-violet-500/15',  dot: 'bg-violet-500'  },
  'at-risk':     { label: 'At Risk',     color: 'text-red-300',     bg: 'bg-red-500/15',     dot: 'bg-red-500'     },
  'completed':   { label: 'Completed',   color: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
}

export const CATEGORY_META: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  'hr-legal':   { label: 'HR & Legal',          icon: '📋', color: 'text-amber-400'  },
  'it-setup':   { label: 'IT Setup',            icon: '💻', color: 'text-blue-400'   },
  'clinical':   { label: 'Clinical Training',   icon: '🏥', color: 'text-teal-400'   },
  'unit-intro': { label: 'Unit Introduction',   icon: '👥', color: 'text-violet-400' },
  'compliance': { label: 'Compliance',          icon: '🛡️', color: 'text-orange-400' },
}

export const ASSIGNEE_META: Record<TaskAssignee, { label: string; color: string }> = {
  hr:       { label: 'HR',           color: 'text-amber-400'  },
  manager:  { label: 'Manager',      color: 'text-violet-400' },
  education:{ label: 'Education',    color: 'text-teal-400'   },
  it:       { label: 'IT',           color: 'text-blue-400'   },
  'new-hire':{ label: 'New Hire',    color: 'text-slate-300'  },
  buddy:    { label: 'Buddy Nurse',  color: 'text-pink-400'   },
}
