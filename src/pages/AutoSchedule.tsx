import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2, CheckCircle2, AlertTriangle, XCircle, ChevronRight,
  Clock, Users, DollarSign, Zap, Bell, Check, RefreshCw,
  CalendarDays, Shield, Loader2, Send,
} from 'lucide-react'
import {
  AUTO_UNITS, SCHEDULE_CELLS, WEEK_DAYS, WEEK_SHORT, WEEK_LABEL,
  getConflicts, resolveConflict, getScheduleStats,
  setPublished, isPublished,
  type ShiftType, type CellStatus, type ScheduleConflict,
} from '../data/autoScheduleData'

// ─── Generation steps ─────────────────────────────────────────────────────────

const GEN_STEPS = [
  { id: 1, label: 'Analyzing staff availability & certifications…',  ms: 900 },
  { id: 2, label: 'Cross-checking PTO & time-off requests…',         ms: 800 },
  { id: 3, label: 'Applying coverage rules & fatigue limits…',        ms: 900 },
  { id: 4, label: 'Resolving scheduling conflicts…',                  ms: 800 },
]

// ─── Cell status helpers ──────────────────────────────────────────────────────

function statusDot(status: CellStatus): string {
  switch (status) {
    case 'full':      return 'bg-emerald-400'
    case 'short':     return 'bg-amber-400'
    case 'no-charge': return 'bg-amber-500'
    case 'critical':  return 'bg-red-500'
  }
}

function cellLabel(status: CellStatus, assigned: number, required: number): string {
  if (status === 'full')      return `${assigned}/${required}`
  if (status === 'no-charge') return `${assigned}/${required}★`
  return `${assigned}/${required}`
}

// ─── Mini shift cell ──────────────────────────────────────────────────────────

interface ShiftDotProps {
  status: CellStatus
  assigned: number
  required: number
  shiftLabel: string
}
function ShiftDot({ status, assigned, required, shiftLabel }: ShiftDotProps) {
  const [hover, setHover] = useState(false)
  return (
    <div
      className="relative flex flex-col items-center cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' as const }}
            className="absolute bottom-full mb-1 z-20 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-xl"
          >
            {shiftLabel} · {cellLabel(status, assigned, required)}
            {status === 'critical' && ' ⚠ Critical'}
            {status === 'short'    && ' ⚠ Short'}
            {status === 'no-charge'&& ' ★ No Charge'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Schedule grid cell ───────────────────────────────────────────────────────

interface GridCellProps {
  unitId: string
  dayIdx: number
  onClickCell: (unitId: string, dayIdx: number) => void
  highlighted: boolean
}
function GridCell({ unitId, dayIdx, onClickCell, highlighted }: GridCellProps) {
  const shifts: ShiftType[] = ['day', 'evening', 'night']
  const cells = shifts.map(sh =>
    SCHEDULE_CELLS.find(c => c.unitId === unitId && c.dayIdx === dayIdx && c.shift === sh)
  )
  const hasIssue = cells.some(c => c && (c.status === 'critical' || c.status === 'short' || c.status === 'no-charge'))
  const hasCritical = cells.some(c => c && c.status === 'critical')

  return (
    <motion.button
      onClick={() => onClickCell(unitId, dayIdx)}
      className={`relative w-full h-14 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
        highlighted
          ? 'ring-2 ring-violet-400 border-violet-400 bg-violet-50'
          : hasCritical
          ? 'border-red-300 bg-red-50 hover:bg-red-100'
          : hasIssue
          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1, ease: 'easeOut' as const }}
    >
      <div className="flex gap-1.5">
        {shifts.map((sh, i) => {
          const cell = cells[i]
          if (!cell) return <span key={sh} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          return (
            <ShiftDot
              key={sh}
              status={cell.status}
              assigned={cell.assigned}
              required={cell.required}
              shiftLabel={sh === 'day' ? 'Day' : sh === 'evening' ? 'Eve' : 'Night'}
            />
          )
        })}
      </div>
      {hasCritical && (
        <span className="text-[9px] font-bold text-red-600 leading-none">CRITICAL</span>
      )}
      {!hasCritical && hasIssue && (
        <span className="text-[9px] font-bold text-amber-600 leading-none">SHORT</span>
      )}
      {!hasIssue && (
        <span className="text-[9px] text-emerald-600 leading-none">OK</span>
      )}
    </motion.button>
  )
}

// ─── Conflict card ────────────────────────────────────────────────────────────

interface ConflictCardProps {
  conflict: ScheduleConflict
  onAutoFix: (id: string) => void
  fixing: string | null
}
function ConflictCard({ conflict, onAutoFix, fixing }: ConflictCardProps) {
  const isCritical = conflict.severity === 'critical'
  const isFixing = fixing === conflict.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      data-id={`conflict-${conflict.id}`}
      className={`rounded-xl border p-4 ${
        isCritical ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {isCritical
          ? <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          : <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {conflict.severity}
            </span>
            <span className="text-xs font-semibold text-slate-700">{conflict.unitName}</span>
            <span className="text-xs text-slate-500">
              {WEEK_DAYS[conflict.dayIdx]} · {conflict.shift === 'evening' ? 'Eve' : conflict.shift === 'night' ? 'Night' : 'Day'}
            </span>
          </div>
          <p className="text-sm text-slate-800 font-medium leading-snug mb-1">{conflict.description}</p>
          <p className="text-xs text-slate-500 mb-3">{conflict.impact}</p>
          <div className={`rounded-lg p-2.5 mb-3 ${
            isCritical ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Suggested fix:</p>
            <p className="text-xs text-slate-600">{conflict.autoFix}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{conflict.fixDetail}</p>
          </div>
          <button
            onClick={() => onAutoFix(conflict.id)}
            disabled={isFixing}
            aria-label={`Auto-fix conflict ${conflict.id}`}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              isFixing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isCritical
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isFixing
              ? <><Loader2 size={12} className="animate-spin" /> Applying fix…</>
              : <><Zap size={12} /> Auto-Fix</>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type GenPhase = 'idle' | 'generating' | 'done'

export default function AutoSchedule() {
  const [phase, setPhase] = useState<GenPhase>(() => isPublished() ? 'done' : 'idle')
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [conflicts, setConflicts] = useState(getConflicts())
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [highlightedCell, setHighlightedCell] = useState<{ unitId: string; dayIdx: number } | null>(null)
  const [publishState, setPublishState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [stats, setStats] = useState(getScheduleStats())
  const gridRef = useRef<HTMLDivElement>(null)

  // Animate generation steps
  useEffect(() => {
    if (phase !== 'generating') return
    let stepIdx = 0
    let timeoutId: ReturnType<typeof setTimeout>
    function runStep() {
      if (stepIdx >= GEN_STEPS.length) {
        timeoutId = setTimeout(() => setPhase('done'), 300)
        return
      }
      setCurrentStep(stepIdx + 1)
      timeoutId = setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIdx + 1])
        stepIdx++
        timeoutId = setTimeout(runStep, 150)
      }, GEN_STEPS[stepIdx].ms)
    }
    timeoutId = setTimeout(runStep, 200)
    return () => clearTimeout(timeoutId)
  }, [phase])

  function handleGenerate() {
    setPhase('generating')
    setCompletedSteps([])
    setCurrentStep(0)
    setConflicts(getConflicts())
    setStats(getScheduleStats())
    setPublishState('idle')
  }

  function handleAutoFix(id: string) {
    setFixingId(id)
    setTimeout(() => {
      resolveConflict(id)
      setConflicts(getConflicts())
      setStats(getScheduleStats())
      setFixingId(null)
      setHighlightedCell(null)
    }, 1_100)
  }

  function handleCellClick(unitId: string, dayIdx: number) {
    if (highlightedCell?.unitId === unitId && highlightedCell?.dayIdx === dayIdx) {
      setHighlightedCell(null)
    } else {
      setHighlightedCell({ unitId, dayIdx })
    }
  }

  function handlePublish() {
    setPublishState('sending')
    setTimeout(() => {
      setPublishState('done')
      setPublished(true)
    }, 1_800)
  }

  const remainingConflicts = conflicts.length
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wand2 size={22} className="text-violet-600" />
              Smart Schedule Generator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              AI-powered weekly scheduling · {WEEK_LABEL}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'done' && remainingConflicts > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                <AlertTriangle size={14} />
                {remainingConflicts} conflict{remainingConflicts !== 1 ? 's' : ''} remaining
              </span>
            )}
            {phase === 'done' && remainingConflicts === 0 && publishState !== 'done' && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={14} />
                All conflicts resolved
              </span>
            )}
            {publishState === 'done' && (
              <span
                id="publish-success-banner"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg"
              >
                <Check size={14} />
                Schedule published
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

        {/* ── IDLE: Hero generate panel ── */}
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
            className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <Wand2 size={32} className="text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Next Week's Schedule</h2>
            <p className="text-slate-500 max-w-md mb-2">
              The AI will analyze staff availability, PTO requests, certification requirements, and
              fatigue rules to build an optimal schedule for {WEEK_LABEL}.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Covers 5 units · 7 days · 105 shift slots · ~28 staff members
            </p>
            <div className="flex items-center gap-4 mb-8">
              {[
                { icon: Users, label: '28 Staff', sub: 'Analyzed' },
                { icon: CalendarDays, label: '7 Days', sub: WEEK_LABEL },
                { icon: Shield, label: 'Rules', sub: 'Applied' },
                { icon: Clock, label: 'Fatigue', sub: 'Checked' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl px-5 py-3">
                  <Icon size={20} className="text-violet-500" />
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <span className="text-xs text-slate-400">{sub}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              aria-label="Generate schedule"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-violet-200 transition-all hover:shadow-violet-300 text-base"
            >
              <Wand2 size={18} />
              Generate Schedule
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── GENERATING: Steps animation ── */}
        {phase === 'generating' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' as const }}
            className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center shadow-sm"
          >
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
              <Wand2 size={28} className="text-violet-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-8">Generating Optimal Schedule…</h2>
            <div className="w-full max-w-md space-y-4">
              {GEN_STEPS.map(step => {
                const done = completedSteps.includes(step.id)
                const active = currentStep === step.id && !done
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: step.id * 0.05, ease: 'easeOut' as const }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      done    ? 'bg-emerald-500' :
                      active  ? 'bg-violet-500 ring-4 ring-violet-100' :
                      'bg-slate-200'
                    }`}>
                      {done   ? <Check size={13} className="text-white" /> :
                       active ? <Loader2 size={12} className="text-white animate-spin" /> :
                       <span className="text-xs text-slate-400 font-bold">{step.id}</span>}
                    </div>
                    <span className={`text-sm transition-all ${
                      done   ? 'text-emerald-700 font-medium' :
                      active ? 'text-violet-700 font-semibold' :
                      'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── DONE: Schedule grid + conflicts ── */}
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="space-y-6"
          >
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { id: 'stat-total-cells',   icon: CalendarDays, label: 'Total Shifts',      value: stats.totalCells.toString(),                color: 'text-slate-700',   bg: 'bg-slate-100' },
                { id: 'stat-fully-covered', icon: CheckCircle2, label: 'Fully Covered',     value: `${stats.fullyCovered}/${stats.totalCells}`,color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { id: 'stat-conflicts',     icon: AlertTriangle,label: 'Conflicts',         value: remainingConflicts.toString(),               color: criticalCount > 0 ? 'text-red-700' : 'text-amber-700', bg: criticalCount > 0 ? 'bg-red-50' : 'bg-amber-50' },
                { id: 'stat-est-cost',      icon: DollarSign,   label: 'Est. Labor Cost',  value: `$${stats.estimatedCost.toLocaleString()}`,  color: 'text-violet-700',  bg: 'bg-violet-50' },
              ].map(({ id, icon: Icon, label, value, color, bg }) => (
                <div key={id} id={id} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
                  <Icon size={20} className={color} />
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-6">
              {/* Schedule grid */}
              <div ref={gridRef} className="flex-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 text-base">Schedule Grid — {WEEK_LABEL}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Full</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Short</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                  </div>
                </div>

                {/* Day header */}
                <div className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, minmax(72px,1fr))' }}>
                  <div />
                  {WEEK_SHORT.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-500 pb-1">{d}</div>
                  ))}

                  {AUTO_UNITS.map(unit => (
                    <>
                      <div
                        key={`label-${unit.id}`}
                        className={`${unit.accent} text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center justify-center text-center leading-tight h-14`}
                      >
                        {unit.shortName}
                      </div>
                      {Array.from({ length: 7 }, (_, d) => (
                        <GridCell
                          key={`${unit.id}-${d}`}
                          unitId={unit.id}
                          dayIdx={d}
                          onClickCell={handleCellClick}
                          highlighted={highlightedCell?.unitId === unit.id && highlightedCell?.dayIdx === d}
                        />
                      ))}
                    </>
                  ))}
                </div>

                {/* Legend note */}
                <p className="text-[11px] text-slate-400 mt-3">
                  Each cell shows Day · Evening · Night staff dots. Click a cell to highlight. Hover a dot for details.
                </p>
              </div>

              {/* Conflict panel */}
              <div className="w-80 shrink-0 space-y-4">
                <div id="conflict-panel" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Conflicts to Resolve
                    {remainingConflicts > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {remainingConflicts}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {remainingConflicts > 0
                      ? `${remainingConflicts} issue${remainingConflicts !== 1 ? 's' : ''} need attention before publishing.`
                      : 'All conflicts resolved — ready to publish!'}
                  </p>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {conflicts.map(c => (
                        <ConflictCard
                          key={c.id}
                          conflict={c}
                          onAutoFix={handleAutoFix}
                          fixing={fixingId}
                        />
                      ))}
                    </AnimatePresence>
                    {remainingConflicts === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' as const }}
                        id="all-conflicts-resolved"
                        className="flex flex-col items-center gap-2 py-6 text-center"
                      >
                        <CheckCircle2 size={36} className="text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-700">All conflicts resolved!</p>
                        <p className="text-xs text-slate-500">Schedule is ready to publish</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Publish card */}
                <div id="publish-card" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Bell size={16} className="text-violet-500" />
                    Publish Schedule
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Notifies all assigned staff via SMS and app push notification.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-1.5">
                    {[
                      { label: 'Staff notified', value: '28' },
                      { label: 'Channels', value: 'SMS + App' },
                      { label: 'Effective', value: WEEK_LABEL },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {publishState === 'idle' && (
                      <motion.button
                        key="publish-btn"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handlePublish}
                        disabled={remainingConflicts > 0}
                        aria-label="Publish schedule and notify staff"
                        className={`w-full flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm ${
                          remainingConflicts > 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200'
                        }`}
                      >
                        <Send size={14} />
                        {remainingConflicts > 0 ? 'Resolve conflicts first' : 'Publish & Notify Staff'}
                      </motion.button>
                    )}
                    {publishState === 'sending' && (
                      <motion.div
                        key="publish-sending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-violet-700 font-medium py-2.5"
                      >
                        <Loader2 size={14} className="animate-spin" />
                        Sending notifications…
                      </motion.div>
                    )}
                    {publishState === 'done' && (
                      <motion.div
                        key="publish-done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' as const }}
                        id="publish-confirmation"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 font-semibold text-sm py-2.5 rounded-xl"
                      >
                        <CheckCircle2 size={14} />
                        Sent to 28 staff members
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Re-generate button */}
                <button
                  onClick={handleGenerate}
                  aria-label="Regenerate schedule"
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 font-medium transition-all"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
