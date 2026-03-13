// staffProfileData.ts — extended intelligence data for staff profiles
// Reference date: March 12, 2026 (Thursday)
// Calendar range: Feb 23 – Mar 22 (28 days, index 0 = Feb 23 Mon)

export type DayStatus =
  | 'D'   // day shift worked/scheduled
  | 'E'   // evening shift worked/scheduled
  | 'N'   // night shift worked/scheduled
  | '.'   // scheduled day off
  | 'A'   // available (no shift, willing to pick up)
  | 'X'   // called out / no-show

export interface RecentShift {
  date: string          // "Mar 12"
  dateSort: number      // for sorting, days since epoch
  unit: string
  shiftType: 'D' | 'E' | 'N'
  hours: number
  outcome: 'completed' | 'called-out' | 'swap-given' | 'swap-received' | 'in-progress'
}

export interface StaffProfileExtended {
  staffId: string
  employeeCode: string
  hireDate: string      // "Mar 2023"
  department: string    // "Float Pool" | "ICU" | etc.
  supervisor: string
  payGrade: string      // "RN-II" | "RN-III" | etc.
  // Pay & Hours
  hourlyRate: number    // base $/hr
  otMultiplier: number  // 1.5
  payPeriodLabel: string          // "Mar 8 – Mar 21"
  payPeriodHoursWorked: number    // hours since pay period start (Mar 8)
  payPeriodOtThreshold: number    // 80h for full-time (2 weeks × 40h)
  ytdOtHours: number
  ytdOtCost: number
  // Reliability metrics
  reliabilityScore: number    // 0–100
  calloutRatePct: number      // % of shifts called out in 90 days
  avgResponseMin: number      // avg minutes to respond to gap fill request
  shiftsCompleted90d: number
  calloutsLast90d: number
  lastCalloutDate?: string    // "Feb 14"
  // 28-day calendar: Feb 23 – Mar 22
  calendar28: DayStatus[]
  // Recent shifts (most recent first, max 10)
  recentShifts: RecentShift[]
  // Open gaps this person is eligible for
  openGapIds?: string[]
  notes?: string
}

// ─── Calendar date helpers ───────────────────────────────────────────────────
// index 0 = Feb 23, index 17 = Mar 12 (today), index 27 = Mar 22

export const CALENDAR_DATES: string[] = [
  'Feb 23','Feb 24','Feb 25','Feb 26','Feb 27','Feb 28','Mar 1',
  'Mar 2','Mar 3','Mar 4','Mar 5','Mar 6','Mar 7','Mar 8',
  'Mar 9','Mar 10','Mar 11','Mar 12','Mar 13','Mar 14','Mar 15',
  'Mar 16','Mar 17','Mar 18','Mar 19','Mar 20','Mar 21','Mar 22',
]
export const TODAY_IDX = 17  // Mar 12

// ─── Extended Profiles ───────────────────────────────────────────────────────

const PROFILES: StaffProfileExtended[] = [

  // ── Sarah Chen — Float Pool RN (s001) ──────────────────────────────────────
  {
    staffId: 's001',
    employeeCode: 'S-001',
    hireDate: 'Mar 2023',
    department: 'Float Pool',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-II',
    hourlyRate: 43,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 32,
    payPeriodOtThreshold: 80,
    ytdOtHours: 14,
    ytdOtCost: 903,
    reliabilityScore: 96,
    calloutRatePct: 4.1,
    avgResponseMin: 9,
    shiftsCompleted90d: 36,
    calloutsLast90d: 1,
    lastCalloutDate: 'Jan 22',
    calendar28: [
      'D','D','.','D','.','A','A',  // Feb 23–Mar 1
      'D','.','D','D','.','A','A',  // Mar 2–8
      'D','D','.','D','.','A','A',  // Mar 9–15 (today = Mar 12 = index 17)
      'D','D','.','D','.','A','A',  // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'ICU', shiftType:'D', hours:8, outcome:'in-progress' },
      { date:'Mar 10', dateSort:20260310, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 5', dateSort:20260305, unit:'CCU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 2', dateSort:20260302, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 26', dateSort:20260226, unit:'CCU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 24', dateSort:20260224, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
    ],
    openGapIds: ['g001'],
    notes: 'Preferred float for ICU/CCU. CCRN-certified. Highly reliable — supervisor\'s first call for critical gaps.',
  },

  // ── James Okafor — ICU RN (e002) ───────────────────────────────────────────
  {
    staffId: 'e002',
    employeeCode: 'E-002',
    hireDate: 'Jun 2021',
    department: 'ICU',
    supervisor: 'Priya Sharma (Charge RN)',
    payGrade: 'RN-III',
    hourlyRate: 46,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 36,
    payPeriodOtThreshold: 80,
    ytdOtHours: 22,
    ytdOtCost: 1518,
    reliabilityScore: 91,
    calloutRatePct: 6.2,
    avgResponseMin: 18,
    shiftsCompleted90d: 31,
    calloutsLast90d: 2,
    lastCalloutDate: 'Feb 14',
    calendar28: [
      'D','.','D','D','.','.','.', // Feb 23–Mar 1
      '.','D','.','D','D','.','.',  // Mar 2–8
      'D','.','D','D','.','.','.', // Mar 9–15
      'D','.','.','.','D','.','.',  // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'ICU', shiftType:'D', hours:12, outcome:'in-progress' },
      { date:'Mar 11', dateSort:20260311, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 5', dateSort:20260305, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 2', dateSort:20260302, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Feb 26', dateSort:20260226, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Feb 14', dateSort:20260214, unit:'ICU', shiftType:'D', hours:12, outcome:'called-out' },
    ],
    openGapIds: [],
    notes: 'Shift swap request pending for Mar 14 (family obligation). BLS expired Feb 28 — follow up.',
  },

  // ── Marcus Williams — Float Pool RN (s002) ─────────────────────────────────
  {
    staffId: 's002',
    employeeCode: 'S-002',
    hireDate: 'Aug 2020',
    department: 'Float Pool',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-III',
    hourlyRate: 47,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 36,
    payPeriodOtThreshold: 80,
    ytdOtHours: 48,
    ytdOtCost: 3384,
    reliabilityScore: 88,
    calloutRatePct: 9.1,
    avgResponseMin: 22,
    shiftsCompleted90d: 28,
    calloutsLast90d: 3,
    lastCalloutDate: 'Mar 3',
    calendar28: [
      'D','D','.','.','D','A','.',  // Feb 23–Mar 1
      'D','D','.','.','D','.','.', // Mar 2–8
      'D','D','.','D','.','A','.',  // Mar 9–15
      'D','.','.','D','.','A','.',  // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'ICU', shiftType:'D', hours:12, outcome:'in-progress' },
      { date:'Mar 10', dateSort:20260310, unit:'ED', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 5', dateSort:20260305, unit:'ED', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 3', dateSort:20260303, unit:'ICU', shiftType:'D', hours:12, outcome:'called-out' },
      { date:'Mar 2', dateSort:20260302, unit:'ICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Feb 27', dateSort:20260227, unit:'ED', shiftType:'D', hours:12, outcome:'completed' },
    ],
    notes: 'High OT year-to-date. Flagged for OT review. Close to weekly threshold — consider alternatives for non-critical fills.',
  },

  // ── Lisa Greenwald — NICU Charge RN (e021) ────────────────────────────────
  {
    staffId: 'e021',
    employeeCode: 'E-021',
    hireDate: 'Feb 2018',
    department: 'NICU',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-IV',
    hourlyRate: 52,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 36,
    payPeriodOtThreshold: 80,
    ytdOtHours: 6,
    ytdOtCost: 468,
    reliabilityScore: 97,
    calloutRatePct: 2.8,
    avgResponseMin: 14,
    shiftsCompleted90d: 33,
    calloutsLast90d: 1,
    lastCalloutDate: 'Jan 6',
    calendar28: [
      'D','.','.','D','.','.','D', // Feb 23–Mar 1
      '.','D','.','.','D','.','.', // Mar 2–8
      'D','.','.','D','.','.','D', // Mar 9–15
      '.','D','.','.','D','.','.', // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'NICU', shiftType:'D', hours:12, outcome:'in-progress' },
      { date:'Mar 9', dateSort:20260309, unit:'NICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 5', dateSort:20260305, unit:'NICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Mar 3', dateSort:20260303, unit:'NICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Feb 28', dateSort:20260228, unit:'NICU', shiftType:'D', hours:12, outcome:'completed' },
      { date:'Feb 24', dateSort:20260224, unit:'NICU', shiftType:'D', hours:12, outcome:'completed' },
    ],
    notes: 'RNC-NIC expiring Apr 2, 2026 (21 days). Renewal exam scheduled Mar 20. Critical — unit cannot be staffed without RNC-NIC certified charge.',
  },

  // ── Christine Park — Med-Surg B Charge RN (e016) ──────────────────────────
  {
    staffId: 'e016',
    employeeCode: 'E-016',
    hireDate: 'Sep 2019',
    department: 'Med-Surg B',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-III',
    hourlyRate: 47,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 28,
    payPeriodOtThreshold: 80,
    ytdOtHours: 8,
    ytdOtCost: 564,
    reliabilityScore: 93,
    calloutRatePct: 5.4,
    avgResponseMin: 11,
    shiftsCompleted90d: 35,
    calloutsLast90d: 2,
    calendar28: [
      'D','D','.','D','.','.','.',  // Feb 23–Mar 1
      '.','D','D','.','D','.','.',  // Mar 2–8
      '.','D','.','D','.','.','.',  // Mar 9–15
      'D','.','D','.','.','.','.', // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'in-progress' },
      { date:'Mar 11', dateSort:20260311, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 3', dateSort:20260303, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 26', dateSort:20260226, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 25', dateSort:20260225, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
    ],
    notes: 'Handles 2 unit callouts daily — strong unit coordinator. Available for charge floats on Med-Surg A.',
  },

  // ── Nathan Foster — ED Charge RN (e007) ───────────────────────────────────
  {
    staffId: 'e007',
    employeeCode: 'E-007',
    hireDate: 'Jan 2017',
    department: 'Emergency Dept.',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-IV',
    hourlyRate: 54,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 28,
    payPeriodOtThreshold: 80,
    ytdOtHours: 3,
    ytdOtCost: 243,
    reliabilityScore: 99,
    calloutRatePct: 1.0,
    avgResponseMin: 7,
    shiftsCompleted90d: 38,
    calloutsLast90d: 0,
    calendar28: [
      'D','.','D','.','.','D','.',  // Feb 23–Mar 1
      'D','.','D','.','.','D','.',  // Mar 2–8
      'D','.','D','.','.','.','.',  // Mar 9–15
      'D','.','D','.','.','.','.', // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'ED', shiftType:'D', hours:8, outcome:'in-progress' },
      { date:'Mar 11', dateSort:20260311, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 7', dateSort:20260307, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 2', dateSort:20260302, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 25', dateSort:20260225, unit:'ED', shiftType:'D', hours:8, outcome:'completed' },
    ],
    notes: 'Zero callouts in 90 days. Veteran of 9 years. Preferred charge for mass casualty protocols.',
  },

  // ── Priya Sharma — ICU Charge RN (e001) ───────────────────────────────────
  {
    staffId: 'e001',
    employeeCode: 'E-001',
    hireDate: 'Apr 2016',
    department: 'ICU',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-IV',
    hourlyRate: 52,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 32,
    payPeriodOtThreshold: 80,
    ytdOtHours: 0,
    ytdOtCost: 0,
    reliabilityScore: 99,
    calloutRatePct: 0.8,
    avgResponseMin: 5,
    shiftsCompleted90d: 39,
    calloutsLast90d: 0,
    calendar28: [
      'D','.','D','.','D','.','.',  // Feb 23–Mar 1
      'D','.','D','.','D','.','.',  // Mar 2–8
      'D','.','D','.','D','.','.',  // Mar 9–15
      'D','.','D','.','D','.','.',  // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 12', dateSort:20260312, unit:'ICU', shiftType:'D', hours:8, outcome:'in-progress' },
      { date:'Mar 11', dateSort:20260311, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 9', dateSort:20260309, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 6', dateSort:20260306, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 2', dateSort:20260302, unit:'ICU', shiftType:'D', hours:8, outcome:'completed' },
    ],
    notes: '10-year veteran. Only CCRN charge on day shifts. Critical to ICU operations. Do not schedule away from unit without backup.',
  },

  // ── Tyler Barnes — Float Pool RN (s005) ───────────────────────────────────
  {
    staffId: 's005',
    employeeCode: 'S-005',
    hireDate: 'Nov 2024',
    department: 'Float Pool',
    supervisor: 'Janet Morrison, RN',
    payGrade: 'RN-I',
    hourlyRate: 38,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: 20,
    payPeriodOtThreshold: 80,
    ytdOtHours: 0,
    ytdOtCost: 0,
    reliabilityScore: 92,
    calloutRatePct: 5.5,
    avgResponseMin: 25,
    shiftsCompleted90d: 22,
    calloutsLast90d: 1,
    lastCalloutDate: 'Feb 3',
    calendar28: [
      '.','D','.','.','D','.','.', // Feb 23–Mar 1
      'D','.','.','D','.','.','.',  // Mar 2–8
      '.','D','.','D','.','.','.', // Mar 9–15
      'D','.','.','D','.','.','.', // Mar 16–22 (scheduled)
    ],
    recentShifts: [
      { date:'Mar 11', dateSort:20260311, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 10', dateSort:20260310, unit:'Orthopedics', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 4', dateSort:20260304, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Mar 2', dateSort:20260302, unit:'Med-Surg A', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 27', dateSort:20260227, unit:'Med-Surg B', shiftType:'D', hours:8, outcome:'completed' },
      { date:'Feb 3', dateSort:20260203, unit:'Orthopedics', shiftType:'D', hours:8, outcome:'called-out' },
    ],
    notes: 'Newest float pool member. Good performance so far. Med-Surg units preferred.',
  },
]

// ─── Lookup / Generator ───────────────────────────────────────────────────────

const PROFILE_MAP = new Map(PROFILES.map(p => [p.staffId, p]))

const HOURLY_BY_ROLE: Record<string, number> = {
  'Charge RN': 50, 'RN': 43, 'LPN': 29, 'CNA': 22, 'PCT': 20,
}

/** Returns extended profile data for any staff member.
 *  Uses specific data for key staff, generates plausible defaults for all others. */
export function getProfileData(staffId: string, fallback?: {
  name: string
  role: string
  hoursThisWeek: number
  overtimeHours: number
  hireDate?: string
}): StaffProfileExtended {
  const specific = PROFILE_MAP.get(staffId)
  if (specific) return specific

  // Generate a plausible default profile
  const h = fallback?.hoursThisWeek ?? 28
  const otThreshold = fallback?.overtimeHours ?? 40
  const hourlyRate = HOURLY_BY_ROLE[fallback?.role ?? 'RN'] ?? 43
  // Use staffId as seed for semi-random but stable values
  const seed = staffId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const reliability = 82 + (seed % 16)

  // Simple repeating pattern based on hours
  const patternsPerWeek = h <= 24 ? 3 : h <= 32 ? 4 : 5
  const cal: DayStatus[] = []
  for (let w = 0; w < 4; w++) {
    const shifts = [0,1,2,3,4,5,6].map(d => {
      if (d >= 5) return 'A' as DayStatus // weekends available
      return (d % (7 - patternsPerWeek) === 0) ? 'D' as DayStatus : '.' as DayStatus
    })
    cal.push(...shifts)
  }

  return {
    staffId,
    employeeCode: `E-${staffId.replace(/\D/g,'').padStart(3,'0')}`,
    hireDate: fallback?.hireDate ?? 'Jan 2022',
    department: 'Mercy General',
    supervisor: 'Janet Morrison, RN',
    payGrade: fallback?.role?.startsWith('Charge') ? 'RN-III' : 'RN-II',
    hourlyRate,
    otMultiplier: 1.5,
    payPeriodLabel: 'Mar 8 – Mar 21',
    payPeriodHoursWorked: h,
    payPeriodOtThreshold: otThreshold * 2, // biweekly
    ytdOtHours: Math.max(0, h - 36) * 2,
    ytdOtCost: Math.max(0, h - 36) * 2 * hourlyRate * 0.5,
    reliabilityScore: reliability,
    calloutRatePct: 100 - reliability,
    avgResponseMin: 10 + (seed % 20),
    shiftsCompleted90d: 28 + (seed % 12),
    calloutsLast90d: Math.floor((100 - reliability) / 10),
    calendar28: cal,
    recentShifts: [],
  }
}
