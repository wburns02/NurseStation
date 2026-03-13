import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wand2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Activity,
  Stethoscope,
  FileText,
  ShieldCheck,
  Send,
  User,
  Thermometer,
  Heart,
  Wind,
} from 'lucide-react'
import {
  PATIENTS,
  WATCH_ITEMS,
  GENERATE_TEMPLATES,
  getHandoff,
  saveHandoff,
  markComplete,
  acknowledgeHandoff,
  type Patient,
  type HandoffRecord,
  type HandoffStatus,
} from '../data/handoffData'

// ── Acuity Badge ─────────────────────────────────────────────────────────────

function AcuityBadge({ level }: { level: number }) {
  const map: Record<number, string> = {
    1: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    2: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    3: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    4: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    5: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full border ${map[level]}`}>
      ACUITY {level}
    </span>
  )
}

// ── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: HandoffStatus }) {
  const map: Record<HandoffStatus, { color: string; label: string }> = {
    pending: { color: 'bg-slate-600', label: 'Not started' },
    draft: { color: 'bg-amber-400', label: 'Draft' },
    complete: { color: 'bg-violet-500', label: 'Complete' },
    acknowledged: { color: 'bg-emerald-500', label: 'Acknowledged' },
  }
  const { color } = map[status]
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
}

// ── Status Chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: HandoffStatus }) {
  const map: Record<HandoffStatus, { label: string; cls: string }> = {
    pending: { label: 'Not started', cls: 'bg-slate-800 text-slate-500 border-slate-700' },
    draft: { label: 'In progress', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    complete: { label: 'Complete', cls: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
    acknowledged: { label: '✓ Acknowledged', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

// ── Vitals Strip ─────────────────────────────────────────────────────────────

function VitalsStrip({ patient }: { patient: Patient }) {
  const latest = patient.vitals[patient.vitals.length - 1]
  const oldest = patient.vitals[0]
  const hrTrend = latest.hr - oldest.hr
  const spoTrend = latest.spo2 - oldest.spo2

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${latest.hr > 100 ? 'bg-orange-500/10 text-orange-300' : 'bg-slate-800 text-slate-300'}`}>
        <Heart size={10} className={latest.hr > 100 ? 'text-orange-400' : 'text-slate-500'} />
        <span className="font-bold">{latest.hr}</span>
        <span className="text-slate-500">bpm</span>
        {hrTrend !== 0 && <span className={hrTrend < 0 ? 'text-emerald-400' : 'text-red-400'}>{hrTrend > 0 ? '↑' : '↓'}</span>}
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${latest.bpSys > 140 ? 'bg-orange-500/10 text-orange-300' : 'bg-slate-800 text-slate-300'}`}>
        <Activity size={10} className="text-slate-500" />
        <span className="font-bold">{latest.bpSys}/{latest.bpDia}</span>
        <span className="text-slate-500">mmHg</span>
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${latest.spo2 < 94 ? 'bg-red-500/10 text-red-300' : latest.spo2 < 96 ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
        <Wind size={10} className={latest.spo2 < 94 ? 'text-red-400' : 'text-slate-500'} />
        <span className="font-bold">{latest.spo2}%</span>
        <span className="text-slate-500">SpO₂</span>
        {spoTrend !== 0 && <span className={spoTrend > 0 ? 'text-emerald-400' : 'text-red-400'}>{spoTrend > 0 ? '↑' : '↓'}</span>}
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${latest.tempF > 100.4 ? 'bg-orange-500/10 text-orange-300' : 'bg-slate-800 text-slate-300'}`}>
        <Thermometer size={10} className={latest.tempF > 100.4 ? 'text-orange-400' : 'text-slate-500'} />
        <span className="font-bold">{latest.tempF.toFixed(1)}°F</span>
        <span className="text-slate-500">updated {patient.vitals[patient.vitals.length - 1].time}</span>
      </div>
    </div>
  )
}

// ── SBAR Section ─────────────────────────────────────────────────────────────

function SBARSection({
  label,
  letter,
  description,
  value,
  textareaId,
  generating,
  onGenerate,
  onChange,
  placeholder,
  readonly,
}: {
  label: string
  letter: string
  description: string
  value: string
  textareaId: string
  generating: boolean
  onGenerate: () => void
  onChange: (v: string) => void
  placeholder: string
  readonly: boolean
}) {
  const [open, setOpen] = useState(true)
  const letterColors: Record<string, string> = {
    S: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    B: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    A: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    R: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  }

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${letterColors[letter]}`}>
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{label}</p>
          <p className="text-slate-600 text-xs truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {value.trim() && <CheckCircle2 size={13} className="text-emerald-500" />}
          {open ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800/60">
              <textarea
                id={textareaId}
                value={value}
                onChange={e => onChange(e.target.value)}
                readOnly={readonly}
                placeholder={placeholder}
                rows={4}
                className={`w-full mt-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {!readonly && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-xs">{value.length} chars</span>
                  <button
                    onClick={onGenerate}
                    disabled={generating}
                    aria-label={`Generate ${label.toLowerCase()}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {generating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }}
                      >
                        <Activity size={11} />
                      </motion.div>
                    ) : (
                      <Wand2 size={11} />
                    )}
                    AI Fill
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Watch Items ───────────────────────────────────────────────────────────────

function WatchItemsSection({
  items,
  onAdd,
  onRemove,
  readonly,
}: {
  items: string[]
  onAdd: (item: string) => void
  onRemove: (item: string) => void
  readonly: boolean
}) {
  const [customInput, setCustomInput] = useState('')
  const [showAll, setShowAll] = useState(false)
  const available = WATCH_ITEMS.filter(w => !items.includes(w))
  const visible = showAll ? available : available.slice(0, 10)

  return (
    <div className="border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={13} className="text-amber-400" />
        <p className="text-white font-semibold text-sm">Watch Items</p>
        <span className="text-slate-600 text-xs">Flag critical items for incoming nurse</span>
      </div>

      {/* Active tags */}
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <p className="text-slate-600 text-xs italic">No watch items added</p>}
        {items.map(item => (
          <motion.span
            key={item}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium px-2.5 py-1 rounded-lg"
          >
            {item}
            {!readonly && (
              <button
                onClick={() => onRemove(item)}
                aria-label={`Remove watch item ${item}`}
                className="text-amber-500 hover:text-amber-200 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </motion.span>
        ))}
      </div>

      {/* Add predefined tags */}
      {!readonly && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visible.map(item => (
              <button
                key={item}
                onClick={() => onAdd(item)}
                aria-label={`Add watch item ${item}`}
                className="text-xs text-slate-500 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <Plus size={9} />
                {item}
              </button>
            ))}
            {available.length > 10 && (
              <button
                onClick={() => setShowAll(s => !s)}
                className="text-xs text-slate-600 hover:text-slate-400 px-2 py-1 transition-colors"
              >
                {showAll ? 'Show less' : `+${available.length - 10} more`}
              </button>
            )}
          </div>

          {/* Custom tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customInput.trim()) {
                  onAdd(customInput.trim())
                  setCustomInput('')
                }
              }}
              placeholder="Add custom watch item…"
              id="custom-watch-input"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all"
            />
            <button
              onClick={() => { if (customInput.trim()) { onAdd(customInput.trim()); setCustomInput('') } }}
              aria-label="Add custom watch item"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Pending Orders ────────────────────────────────────────────────────────────

function PendingOrders({ patient }: { patient: Patient }) {
  const priorityColors: Record<string, string> = {
    stat: 'text-red-400 bg-red-500/10',
    urgent: 'text-amber-400 bg-amber-500/10',
    routine: 'text-slate-400 bg-slate-800',
  }
  return (
    <div className="border border-slate-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={13} className="text-sky-400" />
        <p className="text-white font-semibold text-sm">Pending Orders</p>
        <span className="text-slate-600 text-xs">Incoming nurse must acknowledge</span>
      </div>
      {patient.pendingOrders.map(order => (
        <div key={order.id} className="flex items-start gap-3 py-2 border-b border-slate-800/50 last:border-0">
          <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${priorityColors[order.priority]}`}>
            {order.priority.toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs">{order.description}</p>
            <p className="text-slate-600 text-[10px] flex items-center gap-1 mt-0.5">
              <Clock size={9} />{order.due}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Patient List Item ─────────────────────────────────────────────────────────

function PatientListItem({
  patient,
  handoff,
  isSelected,
  onClick,
}: {
  patient: Patient
  handoff: HandoffRecord
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      data-id={`patient-card-${patient.id}`}
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
        isSelected
          ? 'bg-violet-600/15 border-violet-500/50 ring-1 ring-violet-500/30'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <StatusDot status={handoff.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-white text-sm font-semibold truncate">{patient.name}</p>
            <span className="text-slate-500 text-xs shrink-0 font-mono">Rm {patient.room}</span>
          </div>
          <p className="text-slate-400 text-xs truncate">{patient.diagnosis}</p>
          <div className="flex items-center justify-between mt-1.5">
            <AcuityBadge level={patient.acuity} />
            <StatusChip status={handoff.status} />
          </div>
          <p className="text-slate-600 text-[10px] mt-1.5 flex items-center gap-1">
            <User size={9} />→ {patient.incomingNurse}
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <motion.div
      id="handoff-success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 280, delay: 0.15 }}
        className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6"
      >
        <ShieldCheck size={36} className="text-emerald-400" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-black text-white mb-2"
      >
        Handoff Package Submitted
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-slate-400 text-sm max-w-md"
      >
        All 6 patient handoffs submitted and logged. JCAHO-compliant documentation record created. Evening shift notified.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm"
      >
        {[
          { label: 'Patients', value: '6' },
          { label: 'Watch Items', value: '12' },
          { label: 'Pending Orders', value: '18' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <p className="text-emerald-400 text-2xl font-black">{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex items-center gap-2 text-slate-600 text-xs"
      >
        <ShieldCheck size={12} className="text-slate-600" />
        Record ID: HO-{Math.random().toString(36).slice(2,8).toUpperCase()} · Submitted {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Handoff() {
  const [selectedId, setSelectedId] = useState('pt-001')
  const [handoffMap, setHandoffMap] = useState<Map<string, HandoffRecord>>(() => {
    const m = new Map<string, HandoffRecord>()
    for (const p of PATIENTS) m.set(p.id, getHandoff(p.id))
    return m
  })
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const patient = PATIENTS.find(p => p.id === selectedId)!
  const handoff = handoffMap.get(selectedId) ?? getHandoff(selectedId)
  const summary = (() => {
    const all = Array.from(handoffMap.values())
    return {
      complete: all.filter(h => h.status === 'complete' || h.status === 'acknowledged').length,
      acknowledged: all.filter(h => h.status === 'acknowledged').length,
      draft: all.filter(h => h.status === 'draft').length,
      pending: all.filter(h => h.status === 'pending').length,
      total: all.length,
    }
  })()
  const allComplete = summary.complete === summary.total
  const readonly = handoff.status === 'acknowledged'

  const refreshMap = useCallback(() => {
    const m = new Map<string, HandoffRecord>()
    for (const p of PATIENTS) m.set(p.id, getHandoff(p.id))
    setHandoffMap(m)
  }, [])

  function handleFieldChange(field: 'situation' | 'background' | 'assessment' | 'recommendation', value: string) {
    saveHandoff(selectedId, { [field]: value })
    refreshMap()
  }

  function handleGenerate(field: 'situation' | 'background' | 'assessment' | 'recommendation') {
    const key = `${selectedId}-${field}`
    setGenerating(g => ({ ...g, [key]: true }))
    setTimeout(() => {
      const template = GENERATE_TEMPLATES[selectedId]?.[field] ?? ''
      saveHandoff(selectedId, { [field]: template })
      setGenerating(g => ({ ...g, [key]: false }))
      refreshMap()
    }, 700)
  }

  function handleAddWatchItem(item: string) {
    const current = getHandoff(selectedId)
    if (!current.watchItems.includes(item)) {
      saveHandoff(selectedId, { watchItems: [...current.watchItems, item] })
      refreshMap()
    }
  }

  function handleRemoveWatchItem(item: string) {
    const current = getHandoff(selectedId)
    saveHandoff(selectedId, { watchItems: current.watchItems.filter(w => w !== item) })
    refreshMap()
  }

  function handleMarkComplete() {
    markComplete(selectedId)
    refreshMap()
  }

  function handleAcknowledge() {
    acknowledgeHandoff(selectedId)
    refreshMap()
  }

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 1200)
  }

  const progressPct = summary.total > 0 ? Math.round((summary.complete / summary.total) * 100) : 0

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <ClipboardList size={17} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Shift Handoff</h1>
              <p className="text-slate-500 text-xs">Day Shift → Evening · Janet Morrison, RN · Thu Mar 12, 2026</p>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              <Clock size={11} className="text-amber-400" />
              <span className="text-amber-300 text-xs font-medium">Shift ends 15:00 · 1h 38m</span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {[
                { color: 'bg-slate-600', label: 'Pending', count: summary.pending },
                { color: 'bg-amber-400', label: 'Draft', count: summary.draft },
                { color: 'bg-violet-500', label: 'Complete', count: summary.complete - summary.acknowledged },
                { color: 'bg-emerald-500', label: 'Acknowledged', count: summary.acknowledged },
              ].map(({ color, label, count }) => (
                count > 0 && (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-slate-400 text-xs">{count} {label}</span>
                  </div>
                )
              ))}
            </div>
            <div id="handoff-progress" className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-white text-sm font-bold">{summary.complete}/{summary.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Patient list sidebar */}
        <div className="w-72 shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">My Patients · {summary.total}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {PATIENTS.map(p => (
              <PatientListItem
                key={p.id}
                patient={p}
                handoff={handoffMap.get(p.id) ?? getHandoff(p.id)}
                isSelected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>

          {/* Submit button */}
          <div className="p-4 border-t border-slate-800">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 justify-center text-emerald-400 text-sm font-semibold py-2.5"
                >
                  <CheckCircle2 size={16} />
                  Handoff Submitted!
                </motion.div>
              ) : (
                <motion.button
                  key="submit-btn"
                  onClick={handleSubmit}
                  disabled={!allComplete || submitting || submitted}
                  aria-label="Submit shift handoff"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }}
                    >
                      <Activity size={15} />
                    </motion.div>
                  ) : (
                    <>
                      <Send size={15} />
                      {allComplete ? 'Submit Handoff Package' : `${summary.pending + summary.draft} remaining`}
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
            {!allComplete && (
              <p className="text-slate-600 text-[10px] text-center mt-2">
                Complete all handoffs to submit
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" className="h-full">
                <SuccessScreen />
              </motion.div>
            ) : (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4 max-w-3xl"
              >
                {/* Patient header card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-lg">
                        {patient.room}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-white font-black text-lg">{patient.name}</p>
                          <AcuityBadge level={patient.acuity} />
                          <StatusChip status={handoff.status} />
                        </div>
                        <p className="text-slate-400 text-sm">{patient.age}y · MRN ****{patient.mrn} · {patient.unit}</p>
                        <p className="text-violet-300 text-sm font-medium mt-0.5">{patient.diagnosis}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p className="text-slate-500"><span className="text-slate-300">Physician:</span> {patient.physician}</p>
                      <p className="text-slate-500"><span className="text-slate-300">Admit:</span> {patient.admitDate}</p>
                      <p className="text-slate-500"><span className="text-slate-300">Allergies:</span> {patient.allergies.join(', ')}</p>
                      <p className={`font-semibold ${patient.codeStatus.includes('DNR') || patient.codeStatus.includes('DNI') ? 'text-red-400' : 'text-slate-400'}`}>
                        {patient.codeStatus}
                      </p>
                    </div>
                  </div>

                  <VitalsStrip patient={patient} />

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                    <User size={12} className="text-slate-600" />
                    <p className="text-slate-500 text-xs">Incoming nurse: <span className="text-slate-200 font-semibold">{patient.incomingNurse}</span></p>

                    {handoff.status === 'complete' && (
                      <button
                        onClick={handleAcknowledge}
                        aria-label={`Acknowledge handoff for ${patient.id}`}
                        className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Stethoscope size={11} />
                        Acknowledge as {patient.incomingNurse}
                      </button>
                    )}
                    {handoff.status === 'acknowledged' && handoff.acknowledgedAt && (
                      <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Acknowledged by {patient.incomingNurse} at {handoff.acknowledgedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* SBAR Sections */}
                <SBARSection
                  label="Situation"
                  letter="S"
                  description="What is happening right now with this patient?"
                  value={handoff.situation}
                  textareaId={`sbar-s-${selectedId}`}
                  generating={!!generating[`${selectedId}-situation`]}
                  onGenerate={() => handleGenerate('situation')}
                  onChange={v => handleFieldChange('situation', v)}
                  placeholder="Briefly describe the current patient situation — diagnosis, chief complaint, immediate concerns…"
                  readonly={readonly}
                />
                <SBARSection
                  label="Background"
                  letter="B"
                  description="Relevant clinical history and context"
                  value={handoff.background}
                  textareaId={`sbar-b-${selectedId}`}
                  generating={!!generating[`${selectedId}-background`]}
                  onGenerate={() => handleGenerate('background')}
                  onChange={v => handleFieldChange('background', v)}
                  placeholder="PMH, medications, allergies, procedures, lab results, relevant history…"
                  readonly={readonly}
                />
                <SBARSection
                  label="Assessment"
                  letter="A"
                  description="Your clinical assessment of the patient's current condition"
                  value={handoff.assessment}
                  textareaId={`sbar-a-${selectedId}`}
                  generating={!!generating[`${selectedId}-assessment`]}
                  onGenerate={() => handleGenerate('assessment')}
                  onChange={v => handleFieldChange('assessment', v)}
                  placeholder="Your clinical assessment — trends, concerns, system-by-system if appropriate…"
                  readonly={readonly}
                />
                <SBARSection
                  label="Recommendation"
                  letter="R"
                  description="What should the incoming nurse do or watch for?"
                  value={handoff.recommendation}
                  textareaId={`sbar-r-${selectedId}`}
                  generating={!!generating[`${selectedId}-recommendation`]}
                  onGenerate={() => handleGenerate('recommendation')}
                  onChange={v => handleFieldChange('recommendation', v)}
                  placeholder="Priority action items, call parameters, pending decisions, things not to forget…"
                  readonly={readonly}
                />

                {/* Watch Items */}
                <WatchItemsSection
                  items={handoff.watchItems}
                  onAdd={handleAddWatchItem}
                  onRemove={handleRemoveWatchItem}
                  readonly={readonly}
                />

                {/* Pending Orders */}
                <PendingOrders patient={patient} />

                {/* Mark Complete */}
                {!readonly && handoff.status !== 'complete' && (
                  <motion.div layout className="pb-8">
                    <button
                      onClick={handleMarkComplete}
                      aria-label={`Mark handoff complete ${selectedId}`}
                      className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
                    >
                      <CheckCircle2 size={17} />
                      Mark Handoff Complete
                    </button>
                    {(handoff.situation || handoff.background || handoff.assessment || handoff.recommendation) ? null : (
                      <p className="text-slate-600 text-xs text-center mt-2">Fill in SBAR details before marking complete</p>
                    )}
                  </motion.div>
                )}

                {handoff.status === 'complete' && !readonly && (
                  <div className="flex items-center gap-2 py-4 text-emerald-400 text-sm font-semibold justify-center pb-8">
                    <CheckCircle2 size={16} />
                    Handoff complete · Completed at {handoff.completedAt}
                  </div>
                )}

                {readonly && (
                  <div className="flex items-center gap-2 py-4 text-emerald-400 text-sm font-semibold justify-center pb-8">
                    <ShieldCheck size={16} />
                    Handoff acknowledged by {patient.incomingNurse} · {handoff.acknowledgedAt}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
