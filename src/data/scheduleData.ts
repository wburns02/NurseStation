// scheduleData.ts — full 7-day schedule for 6 primary clinical units

export type ShiftType = 'day' | 'evening' | 'night'
export type ScheduleStatus = 'draft' | 'published' | 'locked'

export interface ScheduledStaff {
  id: string
  name: string
  role: string
  isCharge: boolean
}

export interface ShiftSlot {
  required: number
  assigned: ScheduledStaff[]
}

export interface ScheduleUnit {
  id: string
  shortName: string
  floor: string
  required: Record<ShiftType, number>
  primaryStaff: Record<ShiftType, ScheduledStaff[]>
}

export function slotKey(unitId: string, dayIdx: number, shift: ShiftType): string {
  return `${unitId}:${dayIdx}:${shift}`
}

function rn(id: string, name: string, isCharge = false): ScheduledStaff {
  return { id, name, role: isCharge ? 'Charge RN' : 'RN', isCharge }
}
function lpn(id: string, name: string): ScheduledStaff {
  return { id, name, role: 'LPN', isCharge: false }
}
function cna(id: string, name: string): ScheduledStaff {
  return { id, name, role: 'CNA', isCharge: false }
}

// ─── Unit Definitions ───────────────────────────────────────────────────────

export const SCHEDULE_UNITS: ScheduleUnit[] = [
  {
    id: 'icu',
    shortName: 'ICU',
    floor: '4th Floor',
    required: { day: 4, evening: 4, night: 3 },
    primaryStaff: {
      day: [
        rn('e001', 'Priya Sharma', true),
        rn('e002', 'James Okafor'),
        rn('e003', 'Maria Santos'),
        rn('s001', 'Sarah Chen'),
      ],
      evening: [
        rn('e004', 'Rachel Torres', true),
        rn('e005', 'Kevin Nguyen'),
        rn('e006', 'Angela White'),
        rn('s002', 'Marcus Williams'),
      ],
      night: [
        rn('n001', 'Layla Chen', true),
        rn('n002', 'Omar Farsi'),
        rn('n003', 'Brenda Liu'),
      ],
    },
  },
  {
    id: 'ccu',
    shortName: 'CCU',
    floor: '4th Floor',
    required: { day: 3, evening: 3, night: 2 },
    primaryStaff: {
      day: [
        rn('e004', 'Rachel Torres', true),
        rn('e005', 'Kevin Nguyen'),
        rn('e006', 'Angela White'),
      ],
      evening: [
        rn('e001', 'Priya Sharma', true),
        rn('n004', 'Dana Hill'),
        rn('n005', 'Leo Santos'),
      ],
      night: [
        rn('e011', 'Beth Collins', true),
        rn('n006', 'Alice Wu'),
      ],
    },
  },
  {
    id: 'ed',
    shortName: 'ED',
    floor: '1st Floor',
    required: { day: 5, evening: 5, night: 4 },
    primaryStaff: {
      day: [
        rn('e007', 'Nathan Foster', true),
        rn('e008', 'Fatima Hassan'),
        rn('e009', 'Carlos Rivera'),
        rn('e010', 'Stacy Powell'),
        rn('s006', 'David Kim'),
      ],
      evening: [
        rn('n007', 'Derek Young', true),
        rn('n008', 'Tia Morris'),
        rn('n009', 'Alan Park'),
        rn('n010', 'Chloe Kim'),
        rn('n011', 'Ben Carter'),
      ],
      night: [
        rn('n012', 'Kira Banks', true),
        rn('n013', 'Jerome Watts'),
        rn('n014', 'Nina Solis'),
        rn('n015', 'Tom Reeves'),
      ],
    },
  },
  {
    id: 'ms-a',
    shortName: 'Med-Surg A',
    floor: '3rd Floor',
    required: { day: 5, evening: 4, night: 3 },
    primaryStaff: {
      day: [
        rn('e011', 'Beth Collins', true),
        rn('e012', 'Mike Turner'),
        rn('e013', 'Zoe Anderson'),
        lpn('e014', 'Omar Abdullah'),
        cna('e015', 'Tanya Brooks'),
      ],
      evening: [
        rn('n016', 'Troy Watkins', true),
        rn('n017', 'Alicia Marsh'),
        rn('s004', 'Jennifer Rodriguez'),
        lpn('n018', 'Pam Nguyen'),
      ],
      night: [
        rn('n019', 'Karen West', true),
        rn('n020', 'Eddie Cruz'),
        cna('n021', 'Donna Parks'),
      ],
    },
  },
  {
    id: 'ms-b',
    shortName: 'Med-Surg B',
    floor: '3rd Floor',
    required: { day: 5, evening: 4, night: 3 },
    primaryStaff: {
      day: [
        rn('e016', 'Christine Park', true),
        rn('e017', 'Sean Murphy'),
        lpn('e018', 'Nina Petrov'),
        rn('s005', 'Tyler Barnes'),
        rn('n022', 'Ryan Hall'),
      ],
      evening: [
        rn('n023', 'Kyle Owens', true),
        rn('n024', 'Sandra Gomez'),
        rn('n025', 'Paul Marsh'),
        rn('n026', 'Donna Fields'),
      ],
      night: [
        rn('n027', 'Teresa Lane', true),
        rn('n028', 'Roy Chen'),
        cna('n029', 'Gina Torres'),
      ],
    },
  },
  {
    id: 'nicu',
    shortName: 'NICU',
    floor: '5th Floor',
    required: { day: 4, evening: 3, night: 3 },
    primaryStaff: {
      day: [
        rn('e021', 'Lisa Greenwald', true),
        rn('e022', 'Paulo Fernandez'),
        rn('e023', 'Hannah Moore'),
        cna('e024', 'Daniel Lee'),
      ],
      evening: [
        rn('n030', 'Angela Torres', true),
        rn('n031', 'Kevin Park'),
        rn('n032', 'Sara Li'),
      ],
      night: [
        rn('n033', 'Chris Ford', true),
        rn('n034', 'Meg Davis'),
        cna('n035', 'Ben Ross'),
      ],
    },
  },
]

// ─── Build This-Week Schedule (Mar 9–15, today = Mar 12 = day index 3) ──────
//
// dayIdx: 0=Sun Mar 9, 1=Mon Mar 10, 2=Tue Mar 11, 3=Wed Mar 12 (today),
//          4=Thu Mar 13, 5=Fri Mar 14, 6=Sat Mar 15

function buildThisWeek(): Record<string, ShiftSlot> {
  const schedule: Record<string, ShiftSlot> = {}

  for (const unit of SCHEDULE_UNITS) {
    for (let d = 0; d < 7; d++) {
      for (const sh of ['day', 'evening', 'night'] as ShiftType[]) {
        const key = slotKey(unit.id, d, sh)
        const pool = unit.primaryStaff[sh]
        const req = unit.required[sh]

        // Today (d=3) gets the "live" scenario from mockData (some gaps)
        // Weekdays slightly vary; weekends slightly thinner
        let assigned = [...pool]

        // Introduce realistic gaps
        if (unit.id === 'icu' && d === 3 && sh === 'day') {
          assigned = pool.slice(0, 3) // 3/4 — 1 gap (matches dashboard)
        } else if (unit.id === 'ms-b' && d === 3 && sh === 'day') {
          assigned = pool.slice(0, 3) // 3/5 — 2 gaps
        } else if (unit.id === 'ed' && d === 4 && sh === 'evening') {
          assigned = pool.slice(0, 4) // 4/5 — 1 gap (Thu evening predictable gap)
        } else if (unit.id === 'nicu' && d === 6 && sh === 'day') {
          assigned = pool.slice(0, 3) // 3/4 — 1 gap (weekend NICU)
        } else if ((d === 0 || d === 6) && sh === 'night') {
          // Weekend nights may be 1 short
          assigned = pool.slice(0, Math.max(req - 1, pool.length - 1))
        } else if (d === 0 || d === 6) {
          // Weekend day/evening: sometimes short
          assigned = d === 0 && sh === 'day' ? pool.slice(0, Math.max(1, req - 1)) : pool.slice(0, req)
        }

        schedule[key] = { required: req, assigned: assigned.slice(0, req) }
      }
    }
  }

  return schedule
}

// ─── Pre-generated Next Week Schedule (Mar 16–22) ───────────────────────────
//
// Intentional gaps: 1 NICU day (Mon), 1 ICU night (Fri)
// Intentional OT flag: Marcus Williams > 40h if assigned

const GENERATED_EXTRAS: ScheduledStaff[] = [
  rn('g001', 'Avery Scott'),
  rn('g002', 'Morgan Blake', true),
  rn('g003', 'Jordan Hayes'),
  rn('g004', 'Casey Willis'),
  rn('g005', 'Quinn Reyes'),
  rn('g006', 'Devon Grant'),
  lpn('g007', 'Taylor Reed'),
  cna('g008', 'Blake Shaw'),
  rn('g009', 'Riley Adams'),
  rn('g010', 'Parker Diaz'),
  rn('g011', 'Cameron Ross'),
  rn('g012', 'Bailey Kim'),
]

function buildNextWeek(): Record<string, ShiftSlot> {
  const schedule: Record<string, ShiftSlot> = {}
  const extras = [...GENERATED_EXTRAS]
  let extraIdx = 0

  const nextExtra = () => extras[extraIdx++ % extras.length]

  for (const unit of SCHEDULE_UNITS) {
    for (let d = 0; d < 7; d++) {
      for (const sh of ['day', 'evening', 'night'] as ShiftType[]) {
        const key = slotKey(unit.id, d, sh)
        const req = unit.required[sh]
        const pool = unit.primaryStaff[sh]

        // Intentional gaps
        if (unit.id === 'nicu' && d === 1 && sh === 'day') {
          // Mon NICU day: 3/4 — needs 1 RN
          const assigned = pool.slice(0, 3)
          schedule[key] = { required: req, assigned }
          continue
        }
        if (unit.id === 'icu' && d === 5 && sh === 'night') {
          // Fri ICU night: 2/3 — needs 1 RN
          const assigned = pool.slice(0, 2)
          schedule[key] = { required: req, assigned }
          continue
        }

        // Fill with primary pool + extras
        const assigned: ScheduledStaff[] = []
        for (let i = 0; i < req; i++) {
          if (i < pool.length) {
            assigned.push(pool[i])
          } else {
            assigned.push(nextExtra())
          }
        }

        schedule[key] = { required: req, assigned }
      }
    }
  }

  return schedule
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const THIS_WEEK_SCHEDULE = buildThisWeek()
export const NEXT_WEEK_SCHEDULE = buildNextWeek()

export function getSlot(
  schedule: Record<string, ShiftSlot>,
  unitId: string,
  dayIdx: number,
  shift: ShiftType
): ShiftSlot {
  const key = slotKey(unitId, dayIdx, shift)
  return schedule[key] ?? { required: 0, assigned: [] }
}

export function getCoveragePercent(schedule: Record<string, ShiftSlot>, unitId: string): number {
  let total = 0
  let filled = 0
  for (let d = 0; d < 7; d++) {
    for (const sh of ['day', 'evening', 'night'] as ShiftType[]) {
      const slot = getSlot(schedule, unitId, d, sh)
      total += slot.required
      filled += Math.min(slot.assigned.length, slot.required)
    }
  }
  return total === 0 ? 100 : Math.round((filled / total) * 100)
}

export function getWeekGapCount(schedule: Record<string, ShiftSlot>): number {
  let gaps = 0
  for (const slot of Object.values(schedule)) {
    gaps += Math.max(0, slot.required - slot.assigned.length)
  }
  return gaps
}

export function getWeekCoveragePercent(schedule: Record<string, ShiftSlot>): number {
  let total = 0
  let filled = 0
  for (const slot of Object.values(schedule)) {
    total += slot.required
    filled += Math.min(slot.assigned.length, slot.required)
  }
  return total === 0 ? 100 : Math.round((filled / total) * 100)
}

// Available float pool staff for adding to any shift
export const FLOAT_POOL: ScheduledStaff[] = [
  rn('s001', 'Sarah Chen'),
  rn('s002', 'Marcus Williams'),
  rn('s003', 'Aisha Patel'),
  rn('s004', 'Jennifer Rodriguez'),
  rn('s005', 'Tyler Barnes'),
  rn('s006', 'David Kim'),
  rn('s007', 'Linda Okonkwo'),
]

// Next week's OT warning: Marcus Williams would hit OT if assigned again
export const OT_FLAGS = ['Marcus Williams']

// Day definitions for this week
export const THIS_WEEK_DAYS = [
  { idx: 0, label: 'Sun', date: 'Mar 9',  dateNum: 9,  isToday: false },
  { idx: 1, label: 'Mon', date: 'Mar 10', dateNum: 10, isToday: false },
  { idx: 2, label: 'Tue', date: 'Mar 11', dateNum: 11, isToday: false },
  { idx: 3, label: 'Wed', date: 'Mar 12', dateNum: 12, isToday: true  },
  { idx: 4, label: 'Thu', date: 'Mar 13', dateNum: 13, isToday: false },
  { idx: 5, label: 'Fri', date: 'Mar 14', dateNum: 14, isToday: false },
  { idx: 6, label: 'Sat', date: 'Mar 15', dateNum: 15, isToday: false },
]

export const NEXT_WEEK_DAYS = [
  { idx: 0, label: 'Sun', date: 'Mar 16', dateNum: 16, isToday: false },
  { idx: 1, label: 'Mon', date: 'Mar 17', dateNum: 17, isToday: false },
  { idx: 2, label: 'Tue', date: 'Mar 18', dateNum: 18, isToday: false },
  { idx: 3, label: 'Wed', date: 'Mar 19', dateNum: 19, isToday: false },
  { idx: 4, label: 'Thu', date: 'Mar 20', dateNum: 20, isToday: false },
  { idx: 5, label: 'Fri', date: 'Mar 21', dateNum: 21, isToday: false },
  { idx: 6, label: 'Sat', date: 'Mar 22', dateNum: 22, isToday: false },
]
