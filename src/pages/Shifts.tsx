import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  BarChart2,
  X,
  Plus,
  Minus,
  Zap,
  CalendarCheck,
} from 'lucide-react'
import {
  SCHEDULE_UNITS,
  THIS_WEEK_SCHEDULE,
  NEXT_WEEK_SCHEDULE,
  THIS_WEEK_DAYS,
  NEXT_WEEK_DAYS,
  FLOAT_POOL,
  OT_FLAGS,
  getCoveragePercent,
  getWeekGapCount,
  getWeekCoveragePercent,
  type ShiftType,
  type ScheduleStatus,
  type ShiftSlot,
  type ScheduledStaff,
} from '../data/scheduleData'

type WeekView = 'this' | 'next'

interface SelectedCell {
  unitId: string
  unitShortName: string
  dayIdx: number
  dayLabel: string
  dateLabel: string
  shift: ShiftType
  slot: ShiftSlot
}

const SHIFT_LABELS: Record<ShiftType, string> = {
  day: 'Day 07–15',
  evening: 'Eve 15–23',
  night: 'Night 23–07',
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  day: 'text-amber-700',
  evening: 'text-blue-700',
  night: 'text-slate-500',
}

function coverageColor(assigned: number, required: number): string {
  if (required === 0) return 'bg-slate-100 text-slate-400'
  const pct = assigned / required
  if (pct >= 1) return 'bg-emerald-100 text-emerald-700'
  if (pct >= 0.75) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function coverageBorder(assigned: number, required: number): string {
  if (required === 0) return 'border-slate-200'
  const pct = assigned / required
  if (pct >= 1) return 'border-emerald-200'
  if (pct >= 0.75) return 'border-amber-300'
  return 'border-red-300'
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'Charge RN'
      ? 'bg-violet-100 text-violet-700'
      : role === 'RN'
      ? 'bg-blue-50 text-blue-700'
      : role === 'LPN'
      ? 'bg-teal-50 text-teal-700'
      : 'bg-slate-100 text-slate-600'
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>
      {role === 'Charge RN' ? 'Charge' : role}
    </span>
  )
}

// ─── Cell Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({
  cell,
  onClose,
  onAddStaff,
  onRemoveStaff,
  isNextWeek,
  isLocked,
}: {
  cell: SelectedCell
  onClose: () => void
  onAddStaff: (staff: ScheduledStaff) => void
  onRemoveStaff: (staffId: string) => void
  isNextWeek: boolean
  isLocked: boolean
}) {
  const { slot } = cell
  const gaps = Math.max(0, slot.required - slot.assigned.length)
  const assignedIds = new Set(slot.assigned.map(s => s.id))
  const available = FLOAT_POOL.filter(s => !assignedIds.has(s.id))
  const isEditable = isNextWeek && !isLocked

  return (
    <motion.div
      key="detail"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-slate-200 z-30 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{cell.unitShortName}</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">
            {cell.dayLabel} {cell.dateLabel}
          </p>
          <p className={`text-xs font-semibold mt-0.5 ${SHIFT_COLORS[cell.shift]}`}>
            {SHIFT_LABELS[cell.shift]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Coverage summary */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Coverage</span>
            <span
              className={`text-sm font-black ${
                slot.assigned.length >= slot.required
                  ? 'text-emerald-600'
                  : slot.assigned.length / slot.required >= 0.75
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {slot.assigned.length}/{slot.required}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                slot.assigned.length >= slot.required
                  ? 'bg-emerald-500'
                  : slot.assigned.length / slot.required >= 0.75
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (slot.assigned.length / Math.max(1, slot.required)) * 100)}%` }}
            />
          </div>
          {gaps > 0 && (
            <p className="text-xs text-red-600 font-semibold mt-1.5">
              ⚠ {gaps} open gap{gaps > 1 ? 's' : ''} — needs coverage
            </p>
          )}
        </div>

        {/* Assigned staff */}
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
            Assigned ({slot.assigned.length})
          </p>
          {slot.assigned.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No one assigned yet</p>
          ) : (
            <div className="space-y-1.5">
              {slot.assigned.map(staff => (
                <div
                  key={staff.id}
                  className="flex items-center gap-2 px-2.5 py-2 bg-white border border-slate-100 rounded-lg"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      staff.isCharge
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {staff.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{staff.name}</p>
                    <RoleBadge role={staff.role} />
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => onRemoveStaff(staff.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                  )}
                  {OT_FLAGS.includes(staff.name) && (
                    <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1 py-0.5 rounded">OT</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add from float pool */}
        {isEditable && (
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Float Pool — Available
            </p>
            {available.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Float pool fully assigned</p>
            ) : (
              <div className="space-y-1.5">
                {available.map(staff => (
                  <div
                    key={staff.id}
                    className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-violet-200 hover:bg-violet-50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {staff.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{staff.name}</p>
                      <RoleBadge role={staff.role} />
                    </div>
                    <button
                      onClick={() => onAddStaff(staff)}
                      className="p-1 rounded hover:bg-violet-100 text-slate-300 hover:text-violet-600 transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Coverage Cell ────────────────────────────────────────────────────────────

function CoverageCell({
  slot,
  isToday,
  onClick,
  isSelected,
  revealed,
}: {
  slot: ShiftSlot
  isToday: boolean
  onClick: () => void
  isSelected: boolean
  revealed: boolean
}) {
  const assigned = slot.assigned.length
  const required = slot.required
  const gap = Math.max(0, required - assigned)

  return (
    <motion.button
      onClick={onClick}
      initial={revealed ? { scale: 0.7, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 350 }}
      className={`w-full px-1.5 py-1.5 rounded-lg text-center border transition-all hover:scale-105 hover:shadow-sm active:scale-95 ${
        coverageColor(assigned, required)
      } ${coverageBorder(assigned, required)} ${
        isSelected ? 'ring-2 ring-violet-400 ring-offset-1 shadow-md' : ''
      } ${isToday ? 'ring-1 ring-inset ring-violet-300' : ''}`}
    >
      <p className="text-xs font-black tabular-nums leading-none">
        {assigned}/{required}
      </p>
      {gap > 0 && (
        <p className="text-[9px] font-bold mt-0.5 opacity-80">
          {gap} gap{gap > 1 ? 's' : ''}
        </p>
      )}
    </motion.button>
  )
}

// ─── Generate Animation Overlay ──────────────────────────────────────────────

const GENERATE_STEPS = [
  'Analyzing 42 staff members…',
  'Checking credentials & certifications…',
  'Applying OT and fatigue rules…',
  'Matching float pool availability…',
  'Optimizing coverage across all units…',
  'Resolving conflicts…',
  'Finalizing schedule…',
]

function GenerateOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        const next = s + 1
        setProgress(Math.round((next / GENERATE_STEPS.length) * 100))
        if (next >= GENERATE_STEPS.length) {
          clearInterval(interval)
          setTimeout(onDone, 500)
        }
        return next
      })
    }, 340)
    return () => clearInterval(interval)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 w-96 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Generating Schedule</p>
            <p className="text-xs text-slate-500">Week of Mar 16–22, 2026</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-violet-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {GENERATE_STEPS.slice(0, Math.min(step + 1, GENERATE_STEPS.length)).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              {i < step ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full shrink-0"
                />
              )}
              <p className={`text-xs ${i < step ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>{s}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center mt-5">{progress}% complete</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Publish Confirm Modal ────────────────────────────────────────────────────

function PublishModal({
  week,
  gapCount,
  otCount,
  onConfirm,
  onCancel,
}: {
  week: string
  gapCount: number
  otCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Send size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Publish Schedule</p>
            <p className="text-xs text-slate-500">{week}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Publishing will notify all assigned staff of their shifts. This action can be undone within 1 hour.
        </p>

        {(gapCount > 0 || otCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 space-y-1">
            {gapCount > 0 && (
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                {gapCount} open gap{gapCount > 1 ? 's' : ''} remain — these slots will be posted to Marketplace
              </p>
            )}
            {otCount > 0 && (
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                {otCount} OT flag{otCount > 1 ? 's' : ''} detected — HR will be notified
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
          >
            Confirm &amp; Publish
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Shifts() {
  const [weekView, setWeekView] = useState<WeekView>('this')
  const [nextStatus, setNextStatus] = useState<ScheduleStatus>('draft')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [publishDone, setPublishDone] = useState(false)
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set())
  const [nextSchedule, setNextSchedule] = useState<Record<string, { required: number; assigned: ScheduledStaff[] }>>(
    {}
  )

  const days = weekView === 'this' ? THIS_WEEK_DAYS : NEXT_WEEK_DAYS
  const schedule = weekView === 'this' ? THIS_WEEK_SCHEDULE : nextSchedule
  const isNextWeek = weekView === 'next'
  const isLocked = nextStatus === 'locked'

  // Stats
  const weekGaps = getWeekGapCount(schedule)
  const weekCoverage = getWeekCoveragePercent(schedule)
  const otStaff = new Set(
    Object.values(schedule).flatMap(s => s.assigned).filter(s => OT_FLAGS.includes(s.name)).map(s => s.name)
  )
  const otCount = otStaff.size

  const handleGenerate = useCallback(() => {
    setGenerating(true)
    setSelectedCell(null)
  }, [])

  const handleGenerateDone = useCallback(() => {
    setGenerating(false)
    setGenerated(true)

    // Load the pre-generated schedule
    const fullSchedule = { ...NEXT_WEEK_SCHEDULE }
    setNextSchedule(fullSchedule)

    // Animate cells appearing with stagger
    const keys = Object.keys(fullSchedule)
    const revealSet = new Set<string>()
    keys.forEach((key, i) => {
      setTimeout(() => {
        revealSet.add(key)
        setRevealedCells(new Set(revealSet))
      }, i * 18)
    })
  }, [])

  const handleCellClick = (unitId: string, unitShortName: string, dayIdx: number, shift: ShiftType) => {
    const day = days.find(d => d.idx === dayIdx)!
    const src = weekView === 'this' ? THIS_WEEK_SCHEDULE : nextSchedule
    const slot = src[`${unitId}:${dayIdx}:${shift}`] ?? { required: 0, assigned: [] }

    setSelectedCell({
      unitId,
      unitShortName,
      dayIdx,
      dayLabel: day.label,
      dateLabel: day.date,
      shift,
      slot: { ...slot, assigned: [...slot.assigned] },
    })
  }

  const handleAddStaff = (staff: ScheduledStaff) => {
    if (!selectedCell) return
    const key = `${selectedCell.unitId}:${selectedCell.dayIdx}:${selectedCell.shift}`
    const prev = nextSchedule[key] ?? { required: 0, assigned: [] }
    const updated = { ...prev, assigned: [...prev.assigned, staff] }
    setNextSchedule(s => ({ ...s, [key]: updated }))
    setSelectedCell(c => c ? { ...c, slot: updated } : null)
  }

  const handleRemoveStaff = (staffId: string) => {
    if (!selectedCell) return
    const key = `${selectedCell.unitId}:${selectedCell.dayIdx}:${selectedCell.shift}`
    const prev = nextSchedule[key] ?? { required: 0, assigned: [] }
    const updated = { ...prev, assigned: prev.assigned.filter(s => s.id !== staffId) }
    setNextSchedule(s => ({ ...s, [key]: updated }))
    setSelectedCell(c => c ? { ...c, slot: updated } : null)
  }

  const handlePublishConfirm = () => {
    setShowPublish(false)
    setNextStatus('published')
    setPublishDone(true)
    setTimeout(() => setPublishDone(false), 4000)
  }

  const handleLock = () => {
    setNextStatus('locked')
  }

  const statusBadge = weekView === 'this'
    ? { label: 'Published', color: 'bg-emerald-100 text-emerald-700' }
    : nextStatus === 'locked'
    ? { label: 'Locked', color: 'bg-slate-200 text-slate-600' }
    : nextStatus === 'published'
    ? { label: 'Published', color: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Draft', color: 'bg-amber-100 text-amber-700' }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Generate overlay */}
      <AnimatePresence>
        {generating && <GenerateOverlay onDone={handleGenerateDone} />}
      </AnimatePresence>

      {/* Publish modal */}
      <AnimatePresence>
        {showPublish && (
          <PublishModal
            week="Week of Mar 16–22, 2026"
            gapCount={weekGaps}
            otCount={otCount}
            onConfirm={handlePublishConfirm}
            onCancel={() => setShowPublish(false)}
          />
        )}
      </AnimatePresence>

      {/* Cell detail panel */}
      <AnimatePresence>
        {selectedCell && (
          <DetailPanel
            cell={selectedCell}
            onClose={() => setSelectedCell(null)}
            onAddStaff={handleAddStaff}
            onRemoveStaff={handleRemoveStaff}
            isNextWeek={isNextWeek}
            isLocked={isLocked}
          />
        )}
      </AnimatePresence>

      {/* Publish success toast */}
      <AnimatePresence>
        {publishDone && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg"
          >
            <CheckCircle2 size={16} />
            <p className="text-sm font-bold">Schedule published! Staff notified via SMS.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarCheck size={20} className="text-violet-500" />
              Schedule Builder
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">
                {weekView === 'this' ? 'Mar 9 – 15, 2026' : 'Mar 16 – 22, 2026'}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadge.color}`}
              >
                {statusBadge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Week toggles */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setWeekView('this')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  weekView === 'this'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setWeekView('next')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                  weekView === 'next'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Next Week
                {!generated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                )}
              </button>
            </div>

            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <ChevronRight size={16} />
            </button>

            {/* Action buttons */}
            {isNextWeek && !generated && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300"
              >
                <Sparkles size={14} />
                Generate Schedule
              </button>
            )}
            {isNextWeek && generated && nextStatus === 'draft' && (
              <button
                onClick={() => setShowPublish(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-200"
              >
                <Send size={14} />
                Publish to Staff
              </button>
            )}
            {isNextWeek && nextStatus === 'published' && (
              <button
                onClick={handleLock}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all"
              >
                <Lock size={14} />
                Lock Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={`border-b border-slate-200 px-6 py-3 flex items-center gap-6 ${
        weekView === 'this' ? 'bg-white' : generated ? 'bg-white' : 'bg-amber-50'
      }`}>
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-violet-500" />
          <span className="text-xs text-slate-600 font-medium">Coverage</span>
          <span
            className={`text-sm font-black ${
              weekCoverage >= 95 ? 'text-emerald-600' : weekCoverage >= 85 ? 'text-amber-600' : 'text-red-600'
            }`}
          >
            {isNextWeek && !generated ? '—' : `${weekCoverage}%`}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-slate-600 font-medium">Open Gaps</span>
          <span className={`text-sm font-black ${weekGaps > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {isNextWeek && !generated ? '—' : weekGaps}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <Users size={14} className="text-blue-400" />
          <span className="text-xs text-slate-600 font-medium">Shifts Filled</span>
          <span className="text-sm font-black text-slate-900">
            {isNextWeek && !generated ? '0 / 126' : `${126 - weekGaps} / 126`}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-orange-400" />
          <span className="text-xs text-slate-600 font-medium">OT Flags</span>
          <span className={`text-sm font-black ${otCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
            {isNextWeek && !generated ? '0' : otCount}
          </span>
        </div>

        {/* Generate CTA if next week not yet generated */}
        {isNextWeek && !generated && (
          <div className="ml-auto flex items-center gap-2">
            <Zap size={13} className="text-amber-500" />
            <span className="text-xs text-amber-700 font-semibold">
              Next week unscheduled — click Generate to auto-fill
            </span>
          </div>
        )}

        {/* Generated summary */}
        {isNextWeek && generated && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 font-semibold"
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            Schedule generated · {weekGaps > 0 ? `${weekGaps} gap${weekGaps > 1 ? 's' : ''} need attention` : 'Fully covered'}
          </motion.div>
        )}
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Coverage:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" />
            Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
            Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
            Gap
          </span>
          <span className="flex items-center gap-1.5 ml-3">
            <span className="text-[10px] font-bold bg-violet-100 border border-violet-300 px-1 rounded text-violet-600">Today</span>
            Highlighted column
          </span>
        </div>

        {/* Schedule matrix */}
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          style={{ marginRight: selectedCell ? 320 : 0, transition: 'margin 0.3s ease' }}
        >
          {/* Day headers — matches flex layout: 100px unit + 80px shift + 7 day cols */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-[100px] shrink-0 px-3 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-r border-slate-100">Unit</div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            <div className="px-2 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-r border-slate-100">Shift</div>
            {days.map(d => (
              <div
                key={d.idx}
                className={`px-1 py-3 text-center border-l border-slate-100 ${d.isToday ? 'bg-violet-50' : ''}`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wide ${d.isToday ? 'text-violet-500' : 'text-slate-400'}`}>
                  {d.label}
                </p>
                <p className={`text-xs font-black mt-0.5 ${d.isToday ? 'text-violet-700' : 'text-slate-700'}`}>
                  {d.dateNum}
                  {d.isToday && (
                    <span className="ml-1 text-[8px] bg-violet-600 text-white px-1 rounded-full align-middle">
                      Today
                    </span>
                  )}
                </p>
              </div>
            ))}
            </div>
          </div>

          {/* Unit rows — flex approach: fixed unit name + sub-grid per shift */}
          {SCHEDULE_UNITS.map((unit, uIdx) => (
            <motion.div
              key={unit.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: uIdx * 0.05 }}
              className="border-b border-slate-100 last:border-0 flex"
            >
              {/* Unit name (spans all 3 shift rows) */}
              <div className="w-[100px] shrink-0 px-3 py-0 flex flex-col justify-center border-r border-slate-100">
                <p className="text-xs font-black text-slate-800 leading-tight">{unit.shortName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{unit.floor}</p>
              </div>

              {/* 3 shift rows */}
              <div className="flex-1">
                {(['day', 'evening', 'night'] as ShiftType[]).map(shift => (
                  <div
                    key={shift}
                    className="grid border-b border-slate-50 last:border-0"
                    style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
                  >
                    {/* Shift label */}
                    <div className="px-2 py-2 border-r border-slate-100 flex items-center">
                      <span className={`text-[10px] font-bold ${SHIFT_COLORS[shift]}`}>
                        {shift === 'day' ? 'Day' : shift === 'evening' ? 'Eve' : 'Night'}
                      </span>
                    </div>

                    {/* Day cells */}
                    {days.map(d => {
                      const slotData = schedule[`${unit.id}:${d.idx}:${shift}`] ??
                        (isNextWeek && !generated ? { required: unit.required[shift], assigned: [] } : null)
                      const key = `${unit.id}:${d.idx}:${shift}`
                      const isSelected =
                        selectedCell?.unitId === unit.id &&
                        selectedCell?.dayIdx === d.idx &&
                        selectedCell?.shift === shift

                      return (
                        <div
                          key={d.idx}
                          className={`px-1 py-1.5 border-l border-slate-100 ${d.isToday ? 'bg-violet-50/40' : ''}`}
                        >
                          {slotData ? (
                            <CoverageCell
                              slot={slotData}
                              isToday={d.isToday}
                              onClick={() => handleCellClick(unit.id, unit.shortName, d.idx, shift)}
                              isSelected={isSelected}
                              revealed={revealedCells.has(key)}
                            />
                          ) : (
                            <div className="w-full px-1.5 py-1.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
                              <p className="text-[10px] text-slate-300">—</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unit coverage bars */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"
          style={{ marginRight: selectedCell ? 320 : 0, transition: 'margin 0.3s ease' }}
        >
          {SCHEDULE_UNITS.map(unit => {
            const pct = isNextWeek && !generated ? 0 : getCoveragePercent(schedule, unit.id)
            return (
              <div key={unit.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                <p className="text-xs font-bold text-slate-800">{unit.shortName}</p>
                <p className="text-[11px] text-slate-500">{unit.floor}</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' as const }}
                    className={`h-full rounded-full ${
                      pct >= 95 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                  />
                </div>
                <p
                  className={`text-sm font-black mt-1.5 ${
                    pct >= 95 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-red-600'
                  }`}
                >
                  {isNextWeek && !generated ? '—' : `${pct}%`}
                </p>
              </div>
            )
          })}
        </motion.div>

        {/* OT Warning */}
        {isNextWeek && generated && otCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3"
            style={{ marginRight: selectedCell ? 320 : 0, transition: 'margin 0.3s ease' }}
          >
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-800">Overtime Flag</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Marcus Williams is scheduled 44 hrs this week. HR policy requires manager approval for OT.
                {' '}<button className="underline font-semibold">Review →</button>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
