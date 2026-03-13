import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, AlertTriangle, Users, Activity,
  X, Check, BarChart2, UserMinus, Plus, Share2,
  ChevronRight, Zap,
} from 'lucide-react'
import {
  UNITS, UNIT_PATIENTS, UNIT_NURSES,
  ACUITY_META, FLAG_META,
  getAssignments, getPatient, getNurseStatus,
  isPatientDischarged, reassignPatient, dischargePatient,
  admitPatient, balanceLoad, markShared, wasShared,
  getUnassigned, getUnitStats,
  type Patient, type AcuityLevel, type BoardNurse,
} from '../data/chargeBoardData'

// ─── Acuity pips ─────────────────────────────────────────────────────────────
function AcuityPips({ level }: { level: AcuityLevel }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? ACUITY_META[level].dot : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Patient card ─────────────────────────────────────────────────────────────
function PatientCard({
  patient,
  onClick,
  compact = false,
}: {
  patient: Patient
  onClick: () => void
  compact?: boolean
}) {
  const meta = ACUITY_META[patient.acuity]
  return (
    <motion.button
      layout
      data-id={`patient-card-${patient.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer hover:border-slate-500 group ${meta.bg}`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-400 text-[10px] font-mono shrink-0">{patient.room}</span>
          <span className="text-white text-xs font-semibold truncate group-hover:text-violet-300 transition-colors">
            {patient.lastName}, {patient.firstName[0]}.
          </span>
        </div>
        <AcuityPips level={patient.acuity} />
      </div>
      <p className="text-slate-400 text-[10px] leading-snug mb-1.5 truncate">{patient.diagnosis}</p>
      {!compact && patient.flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {patient.flags.map(f => {
            const fm = FLAG_META[f]
            return (
              <span key={f} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${fm.bg} ${fm.color}`}>
                {fm.label}
              </span>
            )
          })}
        </div>
      )}
      {!compact && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-slate-600 text-[9px]">Day {patient.dayOfStay}</span>
          <span className="text-slate-700 text-[9px]">·</span>
          <span className="text-slate-600 text-[9px]">{patient.attendingMD}</span>
        </div>
      )}
      <ChevronRight size={10} className="absolute right-2 bottom-2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  )
}

// ─── Nurse column ─────────────────────────────────────────────────────────────
function NurseColumn({
  nurse,
  patients,
  maxRatio,
  onPatientClick,
}: {
  nurse: BoardNurse
  patients: Patient[]
  maxRatio: number
  onPatientClick: (p: Patient, nurseId: string) => void
}) {
  const status = getNurseStatus(nurse.id, nurse.status)
  const count = patients.length
  const totalAcuity = patients.reduce((s, p) => s + p.acuity, 0)
  const isOver = count > maxRatio
  const isFull = count === maxRatio
  const statusColor = status === 'active' ? 'bg-emerald-500' : status === 'break' ? 'bg-amber-500' : 'bg-red-500'
  const statusLabel = status === 'active' ? 'Active' : status === 'break' ? 'On break' : 'Called out'

  return (
    <div
      data-id={`nurse-column-${nurse.id}`}
      className={`flex flex-col min-w-0 ${status === 'called-out' ? 'opacity-50' : ''}`}
    >
      {/* Nurse header */}
      <div className={`rounded-xl border p-3 mb-2 ${isOver ? 'bg-red-500/10 border-red-500/40' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {nurse.initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{nurse.name}</p>
            <p className="text-slate-500 text-[10px]">{nurse.role}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <span className="text-slate-400 text-[10px]">{statusLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${isOver ? 'text-red-400' : isFull ? 'text-amber-400' : 'text-emerald-400'}`}>
              {count}/{maxRatio}
            </span>
            {isOver && <AlertTriangle size={10} className="text-red-400" />}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-slate-500 text-[10px]">Acuity:</span>
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalAcuity >= (maxRatio * 4) ? 'bg-red-500' :
                totalAcuity >= (maxRatio * 3) ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (totalAcuity / (maxRatio * 5)) * 100)}%` }}
            />
          </div>
          <span className="text-slate-400 text-[10px] w-4 text-right">{totalAcuity}</span>
        </div>
      </div>

      {/* Patient cards */}
      <div className="flex-1 space-y-2">
        <AnimatePresence>
          {patients.map(p => (
            <PatientCard
              key={p.id}
              patient={p}
              onClick={() => onPatientClick(p, nurse.id)}
            />
          ))}
        </AnimatePresence>
        {patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-slate-600 text-xs">
            No patients
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reassign panel ───────────────────────────────────────────────────────────
function ReassignPanel({
  patient,
  currentNurseId,
  unitId,
  onClose,
  onReassign,
  onDischarge,
}: {
  patient: Patient
  currentNurseId: string
  unitId: string
  onClose: () => void
  onReassign: (toNurseId: string) => void
  onDischarge: () => void
}) {
  const meta = ACUITY_META[patient.acuity]
  const nurses = UNIT_NURSES[unitId] ?? []
  const assignments = getAssignments(unitId)
  const maxRatio = UNITS.find(u => u.id === unitId)?.maxRatio ?? 4
  const [dischargeConfirm, setDischargeConfirm] = useState(false)

  return (
    <motion.aside
      id="reassign-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' as const }}
      className="fixed right-0 top-0 bottom-0 w-88 bg-slate-900 border-l border-slate-700 flex flex-col z-50 shadow-2xl"
      style={{ width: '360px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400 text-xs font-mono">{patient.room}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.bg} ${meta.color}`}>
              Acuity {patient.acuity} — {meta.label}
            </span>
          </div>
          <h2 className="text-white font-bold text-base">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-slate-400 text-xs">{patient.age}{patient.sex} · {patient.diagnosis}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {patient.flags.map(f => {
              const fm = FLAG_META[f]
              return (
                <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${fm.bg} ${fm.color}`}>
                  {fm.label}
                </span>
              )
            })}
          </div>
        </div>
        <button
          aria-label="Close reassign panel"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Clinical note */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Clinical Note</p>
          <p className="text-slate-300 text-sm leading-relaxed">{patient.note}</p>
          <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
            <span>Day {patient.dayOfStay}</span>
            <span>·</span>
            <span>{patient.attendingMD}</span>
          </div>
        </div>

        {/* Reassign to */}
        <div>
          <p className="text-white text-sm font-semibold mb-3">Reassign to</p>
          <div className="space-y-2">
            {nurses.map(nurse => {
              const isCurrent = nurse.id === currentNurseId
              const pts = (assignments[nurse.id] ?? [])
                .map(pid => getPatient(pid))
                .filter(Boolean) as Patient[]
              const count = pts.length
              const acuityTotal = pts.reduce((s, p) => s + p.acuity, 0)
              const isFull = count >= maxRatio
              const nStatus = getNurseStatus(nurse.id, nurse.status)
              const isCalledOut = nStatus === 'called-out'

              return (
                <button
                  key={nurse.id}
                  aria-label={`Reassign to ${nurse.name}`}
                  onClick={() => !isCurrent && !isFull && !isCalledOut && onReassign(nurse.id)}
                  disabled={isCurrent || isCalledOut}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-violet-600/20 border-violet-600/40 cursor-default'
                      : isFull || isCalledOut
                      ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800 border-slate-700 hover:border-violet-500/50 hover:bg-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {nurse.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium leading-tight truncate">
                      {nurse.name}
                      {isCurrent && <span className="text-violet-400 ml-1">(current)</span>}
                    </p>
                    <p className="text-slate-500 text-[10px]">{nurse.role} · Acuity load: {acuityTotal}</p>
                  </div>
                  <div className={`text-xs font-bold ${count >= maxRatio ? 'text-red-400' : count === maxRatio - 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {count}/{maxRatio}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Discharge */}
        <div className="border-t border-slate-800 pt-4">
          <p className="text-slate-400 text-xs mb-2">Patient Status Actions</p>
          {!dischargeConfirm ? (
            <button
              aria-label={`Discharge patient ${patient.id}`}
              onClick={() => setDischargeConfirm(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <UserMinus size={14} />
              Mark as Discharged
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-sm font-semibold mb-3">Confirm discharge?</p>
              <p className="text-slate-400 text-xs mb-3">
                {patient.firstName} {patient.lastName} will be removed from the board.
              </p>
              <div className="flex gap-2">
                <button
                  aria-label={`Confirm discharge ${patient.id}`}
                  onClick={onDischarge}
                  className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes, Discharge
                </button>
                <button
                  aria-label="Cancel discharge"
                  onClick={() => setDischargeConfirm(false)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Admit patient modal ──────────────────────────────────────────────────────
function AdmitModal({
  unitId,
  onClose,
  onAdmit,
}: {
  unitId: string
  onClose: () => void
  onAdmit: (patient: Patient, nurseId: string) => void
}) {
  const nurses = UNIT_NURSES[unitId] ?? []
  const [room, setRoom] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('F')
  const [diagnosis, setDiagnosis] = useState('')
  const [acuity, setAcuity] = useState<AcuityLevel>(3)
  const [nurseId, setNurseId] = useState(nurses[0]?.id ?? '')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!room || !lastName || !firstName || !age || !diagnosis) return
    const newPt = admitPatient(
      unitId,
      {
        room, lastName, firstName, age: Number(age), sex, diagnosis,
        acuity, flags: [], dayOfStay: 0, attendingMD: 'Dr. TBD', note: 'New admission.',
      },
      nurseId,
    )
    setSubmitted(true)
    setTimeout(() => onAdmit(newPt, nurseId), 800)
  }

  return (
    <motion.div
      id="admit-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' as const }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-bold text-lg">Patient Admitted</p>
            <p className="text-slate-400 text-sm mt-1">
              {firstName} {lastName} added to the board
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-white font-bold text-base">Admit New Patient</h2>
                <p className="text-slate-400 text-xs mt-0.5">{UNITS.find(u => u.id === unitId)?.name}</p>
              </div>
              <button
                aria-label="Close admit modal"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Room *</label>
                  <input
                    id="admit-room"
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. 405A"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Age *</label>
                  <input
                    id="admit-age"
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="65"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Last Name *</label>
                  <input
                    id="admit-last-name"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Smith"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">First Name *</label>
                  <input
                    id="admit-first-name"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Diagnosis *</label>
                <input
                  id="admit-diagnosis"
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Septic shock — Gram-negative"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Sex</label>
                  <select
                    id="admit-sex"
                    value={sex}
                    onChange={e => setSex(e.target.value as 'M' | 'F')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Acuity</label>
                  <select
                    id="admit-acuity"
                    value={acuity}
                    onChange={e => setAcuity(Number(e.target.value) as AcuityLevel)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value={5}>5 — Critical</option>
                    <option value={4}>4 — High</option>
                    <option value={3}>3 — Moderate</option>
                    <option value={2}>2 — Stable</option>
                    <option value={1}>1 — Discharge</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Assign to Nurse</label>
                <select
                  id="admit-assign"
                  value={nurseId}
                  onChange={e => setNurseId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  {nurses.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.role})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                aria-label="Submit admit patient"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors"
              >
                Admit to Board
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChargeBoard() {
  const [unitId, setUnitId] = useState('icu')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedNurseId, setSelectedNurseId] = useState<string>('')
  const [showAdmit, setShowAdmit] = useState(false)
  const [balancing, setBalancing] = useState(false)
  const [balancedMsg, setBalancedMsg] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  const unit = UNITS.find(u => u.id === unitId)!
  const nurses = UNIT_NURSES[unitId] ?? []
  const assignments = getAssignments(unitId)
  const stats = getUnitStats(unitId)
  const unassigned = getUnassigned(unitId)
    .map(pid => getPatient(pid))
    .filter(Boolean) as Patient[]

  // All patients for this unit (including newly admitted)
  const allPatients = UNIT_PATIENTS[unitId] ?? []

  function getPatientList(nurseId: string): Patient[] {
    return (assignments[nurseId] ?? [])
      .map(pid => getPatient(pid))
      .filter((p): p is Patient => !!p && !isPatientDischarged(p.id))
  }

  function handlePatientClick(p: Patient, nurseId: string) {
    setSelectedPatient(p)
    setSelectedNurseId(nurseId)
  }

  function handleReassign(toNurseId: string) {
    if (!selectedPatient) return
    reassignPatient(unitId, selectedPatient.id, selectedNurseId, toNurseId)
    setSelectedPatient(null)
    refresh()
  }

  function handleDischarge() {
    if (!selectedPatient) return
    dischargePatient(unitId, selectedPatient.id)
    setSelectedPatient(null)
    refresh()
  }

  function handleBalance() {
    setBalancing(true)
    setTimeout(() => {
      balanceLoad(unitId)
      setBalancing(false)
      setBalancedMsg(true)
      refresh()
      setTimeout(() => setBalancedMsg(false), 3000)
    }, 1200)
  }

  function handleShare() {
    setSharing(true)
    setTimeout(() => {
      markShared(unitId)
      setSharing(false)
      refresh()
    }, 900)
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 px-6 pt-5 pb-3 border-b border-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardList size={18} className="text-violet-400" />
              <h1 className="text-xl font-black text-white tracking-tight">Charge Board</h1>
              <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30">
                LIVE
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Patient assignment · Day Shift 07:00–15:00 · Mercy General · Thu Mar 12, 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Balance load */}
            <button
              aria-label="Balance load"
              onClick={handleBalance}
              disabled={balancing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                balancedMsg
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 disabled:opacity-70'
              }`}
            >
              {balancing ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : balancedMsg ? (
                <Check size={12} />
              ) : (
                <Zap size={12} />
              )}
              {balancedMsg ? 'Balanced!' : 'Balance Load'}
            </button>
            {/* Admit */}
            <button
              aria-label="Admit patient"
              onClick={() => setShowAdmit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white border border-violet-500 transition-all"
            >
              <Plus size={12} />
              Admit Patient
            </button>
            {/* Share */}
            <button
              aria-label="Share assignment board"
              onClick={handleShare}
              disabled={sharing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                wasShared(unitId)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-70'
              }`}
            >
              {sharing ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : wasShared(unitId) ? (
                <Check size={12} />
              ) : (
                <Share2 size={12} />
              )}
              {wasShared(unitId) ? 'Sent!' : 'Share Board'}
            </button>
          </div>
        </div>

        {/* Unit tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {UNITS.map(u => {
            const uStats = getUnitStats(u.id)
            const isActive = u.id === unitId
            return (
              <button
                key={u.id}
                aria-label={`Select unit ${u.shortName}`}
                onClick={() => { setUnitId(u.id); setSelectedPatient(null) }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {u.shortName}
                <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                  uStats.overRatioCount > 0
                    ? 'bg-red-500 text-white'
                    : isActive
                    ? 'bg-violet-700 text-violet-200'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {uStats.census}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
        {[
          { id: 'stat-census',   icon: <Users size={12} />,    label: 'Census',      value: `${stats.census}/${stats.totalBeds}`, warn: false },
          { id: 'stat-avail',    icon: <Activity size={12} />, label: 'Available',   value: stats.availableBeds, warn: false },
          { id: 'stat-acuity',   icon: <BarChart2 size={12} />,label: 'Avg Acuity',  value: stats.avgAcuity, warn: Number(stats.avgAcuity) >= 4 },
          { id: 'stat-ratio',    icon: <AlertTriangle size={12} />, label: 'Over Ratio', value: stats.overRatioCount, warn: stats.overRatioCount > 0 },
          { id: 'stat-unassigned', icon: <UserMinus size={12} />, label: 'Unassigned', value: stats.unassignedCount, warn: stats.unassignedCount > 0 },
        ].map(s => (
          <div key={s.id} id={s.id} className="flex items-center gap-2">
            <span className={s.warn ? 'text-red-400' : 'text-slate-500'}>{s.icon}</span>
            <div>
              <p className={`text-sm font-bold leading-tight ${s.warn ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
              <p className="text-slate-500 text-[10px]">{s.label}</p>
            </div>
          </div>
        ))}
        <div className="ml-auto text-right">
          <p className="text-white text-xs font-semibold">{unit.name}</p>
          <p className="text-slate-500 text-[10px]">{unit.floor} · {unit.maxRatio}:1 max ratio</p>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-5">
        {/* Unassigned strip */}
        <AnimatePresence>
          {unassigned.length > 0 && (
            <motion.div
              id="unassigned-strip"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-red-300 text-sm font-bold">
                  {unassigned.length} Unassigned Patient{unassigned.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {unassigned.map(p => (
                  <div key={p.id} className="w-52">
                    <PatientCard patient={p} onClick={() => handlePatientClick(p, 'unassigned')} compact />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nurse columns */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${nurses.length}, minmax(200px, 1fr))` }}
        >
          {nurses.map(nurse => {
            const statusNurse = { ...nurse, status: getNurseStatus(nurse.id, nurse.status) }
            const patients = getPatientList(nurse.id)
            return (
              <NurseColumn
                key={nurse.id}
                nurse={statusNurse}
                patients={patients}
                maxRatio={unit.maxRatio}
                onPatientClick={handlePatientClick}
              />
            )
          })}
        </div>

        {/* Methodology */}
        <div id="charge-methodology" className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={13} className="text-violet-400" />
            <p className="text-white text-xs font-semibold">Acuity Reference</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {([5, 4, 3, 2, 1] as AcuityLevel[]).map(level => {
              const m = ACUITY_META[level]
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span className={`text-[10px] font-semibold ${m.color}`}>{level} — {m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recently discharged patients count */}
        {allPatients.filter(p => isPatientDischarged(p.id)).length > 0 && (
          <div id="discharge-summary" className="mt-3 text-center text-slate-600 text-xs">
            {allPatients.filter(p => isPatientDischarged(p.id)).length} patient(s) discharged this session
          </div>
        )}
      </div>

      {/* Overlay + panels */}
      <AnimatePresence>
        {selectedPatient && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedPatient(null)}
            />
            <ReassignPanel
              key={selectedPatient.id}
              patient={selectedPatient}
              currentNurseId={selectedNurseId}
              unitId={unitId}
              onClose={() => setSelectedPatient(null)}
              onReassign={handleReassign}
              onDischarge={handleDischarge}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmit && (
          <AdmitModal
            unitId={unitId}
            onClose={() => setShowAdmit(false)}
            onAdmit={() => {
              setShowAdmit(false)
              refresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
