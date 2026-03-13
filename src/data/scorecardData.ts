// ── Nurse Scorecard / 360 Peer Feedback Data ─────────────────────────────────
//
// Five performance dimensions scored 1–5:
//   1. Reliability      — attendance, punctuality, shift completion
//   2. Clinical         — incident rate (inv), ratio compliance, cert currency
//   3. Teamwork         — peer ratings avg, swap helpfulness, recognition
//   4. Growth           — training %, CEUs, certifications earned
//   5. Leadership       — charge coverage, mentoring, onboarding support
//
// Auto-generated highlights reference real operational data from other modules.

export type Trend  = 'up' | 'down' | 'stable'
export type Period = 'q1-2026' | 'annual-2025' | 'q4-2025'

export interface Dimension {
  key:   'reliability' | 'clinical' | 'teamwork' | 'growth' | 'leadership'
  label: string
  score: number   // 1.0–5.0
  icon:  string   // emoji
}

export interface PeerFeedback {
  id:           string
  fromId:       string
  fromName:     string
  fromInitials: string
  fromColor:    string
  period:       Period
  ratings: {
    communication:  number // 1–5
    reliability:    number
    clinical:       number
    collaboration:  number
    attitude:       number
  }
  overallRating: number
  comment:       string
  submittedAt:   string
}

export interface OperationalHighlights {
  attendanceRate:    number   // %
  shiftsWorked:      number
  otHours:           number
  incidentCount:     number
  swapsHelped:       number
  recognitionCount:  number
  trainingCompletion: number // %
  credsCompliant:    boolean
  chargeShifts:      number
  mentees:           number
}

export interface NurseScorecard {
  id:          string
  name:        string
  initials:    string
  color:       string
  role:        string
  unit:        string
  seniorityYears: number
  dimensions:  Dimension[]
  overallScore: number
  trend:       Trend
  trendDelta:  number  // change from last period
  managerRating: number | null
  managerNote:   string
  highlights:    OperationalHighlights
  peerFeedback:  PeerFeedback[]
  reviewDraft?:  string
}

// ── Seeded scorecards ─────────────────────────────────────────────────────────

let _scorecards: NurseScorecard[] = [
  // ── Sarah Kim — st-003 ────────────────────────────────────────────────────
  {
    id: 'st-003', name: 'Sarah Kim', initials: 'SK',
    color: 'from-emerald-500 to-emerald-700', role: 'Charge RN', unit: 'CCU',
    seniorityYears: 11,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.9, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.8, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.9, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.5, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 4.8, icon: '⭐' },
    ],
    overallScore: 4.78, trend: 'stable', trendDelta: 0.02,
    managerRating: 5, managerNote: 'Sarah is our most reliable charge RN. She mentored 3 new nurses this quarter and maintained perfect attendance through a difficult census period.',
    highlights: { attendanceRate: 99, shiftsWorked: 24, otHours: 4, incidentCount: 0, swapsHelped: 3, recognitionCount: 5, trainingCompletion: 100, credsCompliant: true, chargeShifts: 24, mentees: 3 },
    peerFeedback: [
      { id: 'pf-001', fromId: 'st-011', fromName: 'Christina Lee', fromInitials: 'CL', fromColor: 'from-purple-500 to-purple-700', period: 'q1-2026',
        ratings: { communication: 5, reliability: 5, clinical: 5, collaboration: 5, attitude: 5 }, overallRating: 5.0,
        comment: 'Sarah always has the unit organized perfectly at handoff. Her situational awareness is unmatched.', submittedAt: '3 days ago' },
      { id: 'pf-002', fromId: 'st-009', fromName: 'Linda Foster', fromInitials: 'LF', fromColor: 'from-teal-500 to-teal-700', period: 'q1-2026',
        ratings: { communication: 5, reliability: 5, clinical: 4, collaboration: 5, attitude: 5 }, overallRating: 4.8,
        comment: 'A true leader. She advocated for our team during the staffing shortage last month.', submittedAt: '5 days ago' },
    ],
  },

  // ── Robert Walsh — st-006 ─────────────────────────────────────────────────
  {
    id: 'st-006', name: 'Robert Walsh', initials: 'RW',
    color: 'from-slate-500 to-slate-700', role: 'Charge RN', unit: 'MS-A',
    seniorityYears: 13,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.8, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.7, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.5, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.2, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 4.9, icon: '⭐' },
    ],
    overallScore: 4.62, trend: 'stable', trendDelta: 0.0,
    managerRating: 4, managerNote: 'Robert is the backbone of MS-A. 13 years of institutional knowledge. Encourage more CEU engagement — only at 70% this quarter.',
    highlights: { attendanceRate: 98, shiftsWorked: 22, otHours: 6, incidentCount: 0, swapsHelped: 1, recognitionCount: 3, trainingCompletion: 70, credsCompliant: true, chargeShifts: 22, mentees: 2 },
    peerFeedback: [
      { id: 'pf-003', fromId: 'st-007', fromName: 'Alicia Rodriguez', fromInitials: 'AR', fromColor: 'from-pink-500 to-pink-700', period: 'q1-2026',
        ratings: { communication: 5, reliability: 5, clinical: 5, collaboration: 4, attitude: 4 }, overallRating: 4.6,
        comment: 'Robert knows every policy by memory. My go-to for clinical questions.', submittedAt: '1 week ago' },
    ],
  },

  // ── Linda Foster — st-009 ────────────────────────────────────────────────
  {
    id: 'st-009', name: 'Linda Foster', initials: 'LF',
    color: 'from-teal-500 to-teal-700', role: 'Staff RN', unit: 'CCU',
    seniorityYears: 9,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.6, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.8, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.7, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.4, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 4.2, icon: '⭐' },
    ],
    overallScore: 4.54, trend: 'up', trendDelta: 0.18,
    managerRating: 5, managerNote: 'Linda stepped up significantly this quarter — great clinical judgment and she submitted 3 policy improvement suggestions.',
    highlights: { attendanceRate: 97, shiftsWorked: 23, otHours: 9, incidentCount: 0, swapsHelped: 4, recognitionCount: 4, trainingCompletion: 90, credsCompliant: true, chargeShifts: 4, mentees: 1 },
    peerFeedback: [
      { id: 'pf-004', fromId: 'st-003', fromName: 'Sarah Kim', fromInitials: 'SK', fromColor: 'from-emerald-500 to-emerald-700', period: 'q1-2026',
        ratings: { communication: 5, reliability: 4, clinical: 5, collaboration: 5, attitude: 5 }, overallRating: 4.8,
        comment: 'Linda is becoming one of our strongest clinical nurses. Tremendous improvement in ACLS scenarios.', submittedAt: '2 days ago' },
    ],
  },

  // ── Marcus Chen — st-002 ─────────────────────────────────────────────────
  {
    id: 'st-002', name: 'Marcus Chen', initials: 'MC',
    color: 'from-blue-500 to-blue-700', role: 'Staff RN', unit: 'ICU',
    seniorityYears: 8,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.5, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.7, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.4, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.3, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 4.0, icon: '⭐' },
    ],
    overallScore: 4.38, trend: 'stable', trendDelta: 0.05,
    managerRating: 4, managerNote: 'Consistent high performer in ICU. Marcus is being considered for charge RN role.',
    highlights: { attendanceRate: 96, shiftsWorked: 21, otHours: 11, incidentCount: 0, swapsHelped: 2, recognitionCount: 3, trainingCompletion: 88, credsCompliant: true, chargeShifts: 2, mentees: 1 },
    peerFeedback: [
      { id: 'pf-005', fromId: 'st-013', fromName: 'Yuki Tanaka', fromInitials: 'YT', fromColor: 'from-rose-500 to-rose-700', period: 'q1-2026',
        ratings: { communication: 4, reliability: 5, clinical: 5, collaboration: 4, attitude: 4 }, overallRating: 4.4,
        comment: 'Marcus is highly reliable and I can always count on him during a code.', submittedAt: '4 days ago' },
    ],
  },

  // ── Janet Morrison — st-001 (current user) ───────────────────────────────
  {
    id: 'st-001', name: 'Janet Morrison', initials: 'JM',
    color: 'from-violet-500 to-violet-700', role: 'Staff RN', unit: 'ICU',
    seniorityYears: 6,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.4, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.5, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.6, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.2, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.9, icon: '⭐' },
    ],
    overallScore: 4.32, trend: 'up', trendDelta: 0.12,
    managerRating: 4, managerNote: 'Janet is a strong ICU nurse with excellent coordination skills. She took on the staffing coordinator role this quarter and has shown exceptional initiative.',
    highlights: { attendanceRate: 96, shiftsWorked: 20, otHours: 8, incidentCount: 0, swapsHelped: 3, recognitionCount: 2, trainingCompletion: 85, credsCompliant: true, chargeShifts: 1, mentees: 0 },
    peerFeedback: [
      { id: 'pf-006', fromId: 'st-002', fromName: 'Marcus Chen', fromInitials: 'MC', fromColor: 'from-blue-500 to-blue-700', period: 'q1-2026',
        ratings: { communication: 5, reliability: 4, clinical: 4, collaboration: 5, attitude: 5 }, overallRating: 4.6,
        comment: 'Janet communicates clearly under pressure and always supports her colleagues.', submittedAt: '1 week ago' },
      { id: 'pf-007', fromId: 'st-013', fromName: 'Yuki Tanaka', fromInitials: 'YT', fromColor: 'from-rose-500 to-rose-700', period: 'q1-2026',
        ratings: { communication: 4, reliability: 5, clinical: 4, collaboration: 5, attitude: 5 }, overallRating: 4.6,
        comment: 'Great team player. Always willing to help when the unit is short.', submittedAt: '5 days ago' },
    ],
  },

  // ── Yuki Tanaka — st-013 ─────────────────────────────────────────────────
  {
    id: 'st-013', name: 'Yuki Tanaka', initials: 'YT',
    color: 'from-rose-500 to-rose-700', role: 'Staff RN', unit: 'ICU',
    seniorityYears: 4,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.3, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.6, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.5, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.8, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.7, icon: '⭐' },
    ],
    overallScore: 4.38, trend: 'up', trendDelta: 0.31,
    managerRating: 4, managerNote: 'Yuki is one of our fastest-growing nurses. Completed 3 additional certifications this quarter. Leadership pipeline candidate.',
    highlights: { attendanceRate: 95, shiftsWorked: 21, otHours: 6, incidentCount: 0, swapsHelped: 2, recognitionCount: 4, trainingCompletion: 100, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [
      { id: 'pf-008', fromId: 'st-001', fromName: 'Janet Morrison', fromInitials: 'JM', fromColor: 'from-violet-500 to-violet-700', period: 'q1-2026',
        ratings: { communication: 4, reliability: 4, clinical: 5, collaboration: 5, attitude: 5 }, overallRating: 4.6,
        comment: 'Yuki asks the right questions and is always eager to learn. Outstanding clinical instincts.', submittedAt: '3 days ago' },
    ],
  },

  // ── Christina Lee — st-011 ───────────────────────────────────────────────
  {
    id: 'st-011', name: 'Christina Lee', initials: 'CL',
    color: 'from-purple-500 to-purple-700', role: 'Staff RN', unit: 'CCU',
    seniorityYears: 7,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.9, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.3, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.4, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 4.1, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.8, icon: '⭐' },
    ],
    overallScore: 4.10, trend: 'stable', trendDelta: -0.05,
    managerRating: 4, managerNote: 'Christina had 2 emergency call-outs this quarter due to family situation (father hospitalized). Clinical work remains strong.',
    highlights: { attendanceRate: 91, shiftsWorked: 19, otHours: 3, incidentCount: 0, swapsHelped: 1, recognitionCount: 2, trainingCompletion: 82, credsCompliant: true, chargeShifts: 0, mentees: 1 },
    peerFeedback: [],
  },

  // ── Kevin Park — st-008 ──────────────────────────────────────────────────
  {
    id: 'st-008', name: 'Kevin Park', initials: 'KP',
    color: 'from-cyan-500 to-cyan-700', role: 'Staff RN', unit: 'MS-B',
    seniorityYears: 5,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 4.1, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 3.9, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.2, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.8, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.5, icon: '⭐' },
    ],
    overallScore: 3.90, trend: 'up', trendDelta: 0.14,
    managerRating: 4, managerNote: 'Kevin has improved significantly since his family circumstances impacted him last quarter. His initiative on the MS-B floor has been noticed.',
    highlights: { attendanceRate: 93, shiftsWorked: 20, otHours: 5, incidentCount: 1, swapsHelped: 2, recognitionCount: 1, trainingCompletion: 75, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },

  // ── David Thompson — st-004 ──────────────────────────────────────────────
  {
    id: 'st-004', name: 'David Thompson', initials: 'DT',
    color: 'from-red-500 to-red-700', role: 'Staff RN', unit: 'ED',
    seniorityYears: 5,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.6, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 4.2, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 3.8, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.5, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.3, icon: '⭐' },
    ],
    overallScore: 3.68, trend: 'down', trendDelta: -0.22,
    managerRating: 3, managerNote: 'David is dealing with knee surgery recovery affecting attendance. Strong clinical skills when present. Needs an attendance improvement plan.',
    highlights: { attendanceRate: 88, shiftsWorked: 17, otHours: 2, incidentCount: 1, swapsHelped: 0, recognitionCount: 1, trainingCompletion: 65, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [
      { id: 'pf-009', fromId: 'st-005', fromName: 'Priya Patel', fromInitials: 'PP', fromColor: 'from-amber-500 to-amber-700', period: 'q1-2026',
        ratings: { communication: 4, reliability: 3, clinical: 4, collaboration: 4, attitude: 4 }, overallRating: 3.8,
        comment: 'Clinically strong but has been absent frequently. When present, he is a good partner.', submittedAt: '2 weeks ago' },
    ],
  },

  // ── Alicia Rodriguez — st-007 ────────────────────────────────────────────
  {
    id: 'st-007', name: 'Alicia Rodriguez', initials: 'AR',
    color: 'from-pink-500 to-pink-700', role: 'Staff RN', unit: 'MS-A',
    seniorityYears: 4,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.9, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 3.7, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.1, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.6, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.4, icon: '⭐' },
    ],
    overallScore: 3.74, trend: 'stable', trendDelta: 0.04,
    managerRating: 4, managerNote: 'Solid team player on MS-A. Encourage CEU engagement and leadership opportunities.',
    highlights: { attendanceRate: 94, shiftsWorked: 20, otHours: 4, incidentCount: 0, swapsHelped: 2, recognitionCount: 1, trainingCompletion: 72, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },

  // ── James O'Brien — st-010 ───────────────────────────────────────────────
  {
    id: 'st-010', name: "James O'Brien", initials: 'JO',
    color: 'from-indigo-500 to-indigo-700', role: 'Staff RN', unit: 'Telemetry',
    seniorityYears: 6,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.7, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 3.5, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 3.6, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.3, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.4, icon: '⭐' },
    ],
    overallScore: 3.50, trend: 'stable', trendDelta: 0.00,
    managerRating: 3, managerNote: 'James meets expectations. He declined the Telemetry cert refresh which is now flagged. Needs development conversation.',
    highlights: { attendanceRate: 92, shiftsWorked: 18, otHours: 3, incidentCount: 1, swapsHelped: 0, recognitionCount: 0, trainingCompletion: 60, credsCompliant: false, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },

  // ── Priya Patel — st-005 ─────────────────────────────────────────────────
  {
    id: 'st-005', name: 'Priya Patel', initials: 'PP',
    color: 'from-amber-500 to-amber-700', role: 'Staff RN', unit: 'ED',
    seniorityYears: 3,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.2, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 3.8, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 4.0, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.5, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 3.0, icon: '⭐' },
    ],
    overallScore: 3.50, trend: 'stable', trendDelta: -0.08,
    managerRating: 3, managerNote: 'Priya has 3 childcare-related call-outs this quarter. Clinical performance is solid. Exploring flexible scheduling options.',
    highlights: { attendanceRate: 87, shiftsWorked: 17, otHours: 1, incidentCount: 0, swapsHelped: 1, recognitionCount: 1, trainingCompletion: 78, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },

  // ── Miguel Santos — st-012 ───────────────────────────────────────────────
  {
    id: 'st-012', name: 'Miguel Santos', initials: 'MS',
    color: 'from-orange-500 to-orange-700', role: 'Staff RN', unit: 'MS-A',
    seniorityYears: 3,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.4, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 3.2, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 3.6, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.9, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 2.8, icon: '⭐' },
    ],
    overallScore: 3.38, trend: 'up', trendDelta: 0.22,
    managerRating: 3, managerNote: 'Miguel is newer but shows strong growth trajectory. He needs more clinical experience — pair with Robert or Linda.',
    highlights: { attendanceRate: 92, shiftsWorked: 18, otHours: 2, incidentCount: 1, swapsHelped: 1, recognitionCount: 0, trainingCompletion: 82, credsCompliant: true, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },

  // ── Beth Anderson — st-014 ───────────────────────────────────────────────
  {
    id: 'st-014', name: 'Beth Anderson', initials: 'BA',
    color: 'from-sky-500 to-sky-700', role: 'Staff RN', unit: 'Telemetry',
    seniorityYears: 2,
    dimensions: [
      { key: 'reliability',  label: 'Reliability',  score: 3.5, icon: '📅' },
      { key: 'clinical',     label: 'Clinical',     score: 2.8, icon: '🩺' },
      { key: 'teamwork',     label: 'Teamwork',     score: 3.7, icon: '🤝' },
      { key: 'growth',       label: 'Growth',       score: 3.6, icon: '📈' },
      { key: 'leadership',   label: 'Leadership',   score: 2.5, icon: '⭐' },
    ],
    overallScore: 3.22, trend: 'up', trendDelta: 0.28,
    managerRating: 3, managerNote: 'Beth is in her second year. Missing Telemetry cert is a priority — she was denied a swap over it. Development plan in place.',
    highlights: { attendanceRate: 93, shiftsWorked: 18, otHours: 2, incidentCount: 2, swapsHelped: 1, recognitionCount: 0, trainingCompletion: 70, credsCompliant: false, chargeShifts: 0, mentees: 0 },
    peerFeedback: [],
  },
]

// ── Peer feedback next ID counter ─────────────────────────────────────────────
let _nextFeedbackId = 10

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getScorecards(): NurseScorecard[] {
  return [..._scorecards].sort((a, b) => b.overallScore - a.overallScore)
}

export function getScorecard(id: string): NurseScorecard | undefined {
  return _scorecards.find(s => s.id === id)
}

export function getScorecardStats() {
  const cards = getScorecards()
  const avgScore = cards.reduce((s, c) => s + c.overallScore, 0) / cards.length
  const reviewsDone = cards.filter(c => c.managerRating !== null).length
  const pendingFeedback = cards.filter(c => c.peerFeedback.length === 0).length
  const topPerformer = cards[0]
  const needsAttention = cards.filter(c => c.overallScore < 3.5).length
  return { avgScore, reviewsDone, pendingFeedback, topPerformer, needsAttention }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface PeerFeedbackInput {
  communication: number
  reliability:   number
  clinical:      number
  collaboration: number
  attitude:      number
  comment:       string
}

export function submitPeerFeedback(
  nurseId: string,
  input: PeerFeedbackInput,
): void {
  const card = _scorecards.find(s => s.id === nurseId)
  if (!card) return
  const overallRating = (input.communication + input.reliability + input.clinical + input.collaboration + input.attitude) / 5
  const newFeedback: PeerFeedback = {
    id:           `pf-${String(_nextFeedbackId++).padStart(3, '0')}`,
    fromId:       'st-001',
    fromName:     'Janet Morrison',
    fromInitials: 'JM',
    fromColor:    'from-violet-500 to-violet-700',
    period:       'q1-2026',
    ratings:      { communication: input.communication, reliability: input.reliability, clinical: input.clinical, collaboration: input.collaboration, attitude: input.attitude },
    overallRating: Math.round(overallRating * 10) / 10,
    comment:      input.comment,
    submittedAt:  'just now',
  }
  card.peerFeedback = [...card.peerFeedback, newFeedback]
}

export function updateManagerNote(nurseId: string, note: string): void {
  const card = _scorecards.find(s => s.id === nurseId)
  if (!card) return
  card.managerNote = note
}

export function generateReviewDraft(nurseId: string): string {
  const card = _scorecards.find(s => s.id === nurseId)
  if (!card) return ''
  const h = card.highlights
  const score = card.overallScore
  const topDim = [...card.dimensions].sort((a, b) => b.score - a.score)[0]
  const lowDim = [...card.dimensions].sort((a, b) => a.score - b.score)[0]
  const trendWord = card.trend === 'up' ? 'an upward trend' : card.trend === 'down' ? 'a declining trend' : 'consistent performance'

  return `PERFORMANCE REVIEW DRAFT — Q1 2026
${card.name} | ${card.role} | ${card.unit} | ${card.seniorityYears} years of service

OVERALL RATING: ${score.toFixed(1)} / 5.0

SUMMARY
${card.name} demonstrated ${trendWord} this quarter with an overall score of ${score.toFixed(1)}.
${h.attendanceRate >= 95 ? `Attendance was excellent at ${h.attendanceRate}%` : `Attendance was ${h.attendanceRate}%${h.attendanceRate < 90 ? ', which requires attention' : ''}`}, completing ${h.shiftsWorked} of scheduled shifts.

KEY STRENGTHS
• ${topDim.label}: Scored ${topDim.score.toFixed(1)}/5.0 — ${topDim.key === 'reliability' ? 'demonstrates consistent dependability' : topDim.key === 'clinical' ? 'exhibits strong clinical judgment and patient safety focus' : topDim.key === 'teamwork' ? 'is a valued collaborator and team resource' : topDim.key === 'growth' ? 'shows exceptional commitment to professional development' : 'demonstrates natural leadership abilities'}
${h.recognitionCount > 0 ? `• Received ${h.recognitionCount} peer recognition badge${h.recognitionCount > 1 ? 's' : ''} this quarter` : ''}
${h.chargeShifts > 0 ? `• Led ${h.chargeShifts} charge shifts demonstrating leadership readiness` : ''}
${h.mentees > 0 ? `• Mentored ${h.mentees} newer staff member${h.mentees > 1 ? 's' : ''}` : ''}
${h.incidentCount === 0 ? '• Zero incident reports — excellent patient safety record' : ''}

AREAS FOR DEVELOPMENT
• ${lowDim.label}: Scored ${lowDim.score.toFixed(1)}/5.0 — ${lowDim.key === 'growth' ? 'encourage additional CEU completion and certification pursuit' : lowDim.key === 'leadership' ? 'consider leadership development opportunities and charge RN shadowing' : lowDim.key === 'reliability' ? 'attendance improvement plan recommended for next quarter' : lowDim.key === 'clinical' ? 'recommend clinical simulation lab participation' : 'focus on interprofessional collaboration'}
${!h.credsCompliant ? '• Credential compliance gap requires immediate attention before next shift' : ''}
${h.trainingCompletion < 80 ? `• Training completion at ${h.trainingCompletion}% — below the 85% departmental target` : ''}

PEER FEEDBACK SUMMARY
${card.peerFeedback.length > 0 ? `${card.peerFeedback.length} peer review${card.peerFeedback.length > 1 ? 's' : ''} submitted with an average rating of ${(card.peerFeedback.reduce((s, f) => s + f.overallRating, 0) / card.peerFeedback.length).toFixed(1)}/5.0.` : 'No peer feedback collected this period.'}

RECOMMENDED GOALS FOR NEXT QUARTER
1. ${lowDim.key === 'leadership' ? 'Complete charge RN orientation module' : lowDim.key === 'growth' ? 'Complete 4 additional CEU credits' : lowDim.key === 'reliability' ? 'Maintain 95%+ attendance for 60 consecutive days' : 'Schedule development conversation with manager'}
2. ${h.trainingCompletion < 85 ? 'Bring training module completion to ≥85%' : 'Pursue one additional specialty certification'}
3. ${h.mentees === 0 && card.seniorityYears >= 4 ? 'Consider mentoring a newer team member' : 'Continue current performance trajectory'}

— Auto-generated by NurseStation on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} —
Manager review and signature required before sharing with employee.`
}
