export type ShiftType = 'day' | 'evening' | 'night'
export type StaffStatus = 'on-duty' | 'available' | 'off-duty' | 'called-out'
export type UnitStatus = 'critical' | 'warning' | 'adequate' | 'surplus'
export type StaffRole = 'Charge RN' | 'RN' | 'LPN' | 'CNA' | 'PCT'
export type ActionStatus = 'pending' | 'requested' | 'confirmed' | 'declined'

export interface ShiftDef {
  type: ShiftType
  label: string
  start: string
  end: string
}

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  status: StaffStatus
  phone: string
  certifications: string[]
  unitExperience: string[]
  hoursThisWeek: number
  overtimeHours: number
  avatarInitials: string
}

export interface SuggestedFill {
  staff: StaffMember
  score: number
  reasons: string[]
  riskFlags: string[]
}

export interface Gap {
  id: string
  unitId: string
  unitName: string
  role: StaffRole
  shift: ShiftDef
  openedAt: Date
  severity: 'critical' | 'warning'
  suggestedFills: SuggestedFill[]
  actionStatus: ActionStatus
}

export interface Unit {
  id: string
  name: string
  shortName: string
  floor: string
  capacity: number
  currentCensus: number
  staffed: number
  required: number
  status: UnitStatus
  currentStaff: StaffMember[]
  openGaps: number
  notes?: string
}
