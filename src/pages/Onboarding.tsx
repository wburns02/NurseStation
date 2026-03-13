// Onboarding.tsx — Smart Onboarding Hub
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Send,
  CheckCheck,
  Plus,
  Calendar,
  Users,
  Briefcase,
  Phone,
  Mail,
  User,
} from 'lucide-react'
import {
  getAllHires,
  getProgress,
  getOverdueTasks,
  isTaskCompleted,
  completeTask,
  hasReminderSent,
  sendReminder,
  addHire,
  getSummary,
  STATUS_META,
  CATEGORY_META,
  ASSIGNEE_META,
  type NewHire,
  type OnboardingTask,
  type TaskCategory,
} from '../data/onboardingData'

// ─── Progress ring SVG ────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 48, stroke = 4, color = 'stroke-violet-500' }: {
  pct: number; size?: number; stroke?: number; color?: string
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const cx = size / 2
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-700" />
      <circle
        cx={cx} cy={cx} r={r} fill="none" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${color} transition-all duration-700`}
      />
    </svg>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, hire, onComplete }: {
  task: OnboardingTask; hire: NewHire; onComplete: (taskId: string) => void
}) {
  const [justDone, setJustDone] = useState(false)
  const done = isTaskCompleted(task)
  const isOverdue = !done && task.dueDay < hire.daysSinceStart && hire.daysSinceStart >= 0
  const catMeta = CATEGORY_META[task.category]
  const assigneeMeta = ASSIGNEE_META[task.assignee]

  function handleComplete() {
    if (done || justDone) return
    setJustDone(true)
    completeTask(task.id)
    setTimeout(() => setJustDone(false), 2000)
    onComplete(task.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        done
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : isOverdue
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-slate-800/40 border-slate-700/50'
      }`}
    >
      {/* Complete button */}
      <button
        aria-label={`Complete task ${task.id}`}
        onClick={handleComplete}
        disabled={done}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          done
            ? 'border-emerald-500 bg-emerald-500 cursor-default'
            : 'border-slate-500 hover:border-violet-400 hover:bg-violet-500/20 cursor-pointer'
        }`}
      >
        {done && <CheckCheck size={11} className="text-white" />}
        {justDone && !done && <motion.div animate={{ scale: [0, 1.2, 1] }} className="w-2 h-2 bg-emerald-400 rounded-full" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight ${done ? 'line-through text-slate-500' : isOverdue ? 'text-red-300' : 'text-slate-200'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {isOverdue && !done && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">OVERDUE</span>
            )}
            {task.required && !done && !isOverdue && (
              <span className="text-[10px] font-medium text-slate-500">REQ</span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[10px] font-medium ${catMeta.color}`}>{catMeta.icon} {catMeta.label}</span>
          <span className="text-slate-600">·</span>
          <span className={`text-[10px] ${assigneeMeta.color}`}>{assigneeMeta.label}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[10px] text-slate-500">Day {task.dueDay}</span>
        </div>
        {done && task.completedDate && (
          <p className="text-[10px] text-emerald-400 mt-0.5">
            ✓ {task.completedDate.slice(5).replace('-', '/')} by {task.completedBy}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── New Hire Modal ───────────────────────────────────────────────────────────
function NewHireModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: '', role: '', unit: '', manager: '', email: '', phone: '', startDate: '', buddy: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.role || !form.unit || !form.startDate) return
    const today = new Date('2026-03-12')
    const start = new Date(form.startDate)
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / 86400000)
    const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    addHire({
      name: form.name, initials, role: form.role, unit: form.unit,
      manager: form.manager || 'Janet Morrison',
      startDate: form.startDate, daysSinceStart,
      email: form.email || `${form.name.toLowerCase().replace(' ', '.')}@mercygeneral.org`,
      phone: form.phone || '(555) 000-0000',
      buddy: form.buddy || null,
    })
    setSubmitted(true)
    setTimeout(() => { onAdded(); onClose() }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        id="new-hire-modal"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Add New Hire</h2>
            <p className="text-slate-400 text-xs mt-0.5">Start the onboarding checklist</p>
          </div>
          <button onClick={onClose} aria-label="Close new hire modal" className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-semibold">Onboarding Started!</p>
            <p className="text-slate-400 text-sm mt-1">Checklist created and team notified.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
                <input id="new-hire-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="First Last" required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Role *</label>
                <input id="new-hire-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="RN, LPN, NP…" required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Unit *</label>
                <input id="new-hire-unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="ICU, ED, MS-A…" required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Start Date *</label>
                <input id="new-hire-start-date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Manager</label>
              <input id="new-hire-manager" value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                placeholder="Hiring manager name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Buddy Nurse</label>
              <input id="new-hire-buddy" value={form.buddy} onChange={e => setForm(f => ({ ...f, buddy: e.target.value }))}
                placeholder="Assign a peer mentor (optional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <button
              type="submit"
              aria-label="Submit new hire"
              className="w-full mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Start Onboarding Checklist
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ hire, onClose, onTaskComplete }: {
  hire: NewHire; onClose: () => void; onTaskComplete: (taskId: string) => void
}) {
  const [reminderState, setReminderState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const progress = getProgress(hire)
  const overdue = getOverdueTasks(hire)
  const statusMeta = STATUS_META[hire.status]

  function handleReminder() {
    if (reminderState !== 'idle') return
    setReminderState('sending')
    sendReminder(hire.id)
    setTimeout(() => setReminderState('sent'), 800)
    setTimeout(() => setReminderState('idle'), 3000)
  }

  // Group tasks by category
  const grouped = Object.entries(
    hire.tasks.reduce<Record<TaskCategory, OnboardingTask[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    }, {} as Record<TaskCategory, OnboardingTask[]>)
  ) as [TaskCategory, OnboardingTask[]][]

  const ringColor = hire.status === 'completed' ? 'stroke-emerald-500'
    : hire.status === 'at-risk' ? 'stroke-red-500'
    : hire.status === 'pre-start' ? 'stroke-blue-500'
    : 'stroke-violet-500'

  return (
    <motion.div
      id="onboarding-detail-panel"
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Panel header */}
      <div className="p-5 border-b border-slate-700/50 shrink-0">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <ProgressRing pct={progress} size={56} stroke={5} color={ringColor} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{progress}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-white font-bold text-base leading-tight">{hire.name}</h2>
              <button onClick={onClose} aria-label="Close onboarding detail" className="text-slate-400 hover:text-white transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{hire.role} · {hire.unit}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
              {hire.daysSinceStart >= 0 ? (
                <span className="text-slate-500 text-[11px]">Day {hire.daysSinceStart}</span>
              ) : (
                <span className="text-blue-400 text-[11px]">Starts {hire.startDate.slice(5).replace('-', '/')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { icon: Briefcase, label: hire.manager },
            { icon: Users, label: hire.buddy ?? 'No buddy assigned' },
            { icon: Mail, label: hire.email.split('@')[0] + '…' },
            { icon: Phone, label: hire.phone },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Icon size={11} className="text-slate-500 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs font-medium">
              {overdue.length} task{overdue.length > 1 ? 's' : ''} overdue — action required
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {hasReminderSent(hire.id) || reminderState !== 'idle' ? (
            <button
              aria-label={`Send reminder ${hire.id}`}
              disabled
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold py-2 rounded-lg"
            >
              <CheckCircle2 size={13} />
              {reminderState === 'sent' || hasReminderSent(hire.id) ? 'Reminder Sent!' : 'Sending…'}
            </button>
          ) : (
            <button
              aria-label={`Send reminder ${hire.id}`}
              onClick={handleReminder}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <Send size={12} />
              Send Reminder
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {grouped.map(([cat, tasks]) => {
          const meta = CATEGORY_META[cat]
          const doneCount = tasks.filter(t => isTaskCompleted(t)).length
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{meta.icon}</span>
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                <span className="text-xs text-slate-500 ml-auto">{doneCount}/{tasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {tasks.map(task => (
                  <TaskRow key={task.id} task={task} hire={hire} onComplete={onTaskComplete} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Hire Card ────────────────────────────────────────────────────────────────
function HireCard({ hire, selected, onClick }: {
  hire: NewHire; selected: boolean; onClick: () => void
}) {
  const progress = getProgress(hire)
  const overdue = getOverdueTasks(hire)
  const statusMeta = STATUS_META[hire.status]
  const ringColor = hire.status === 'completed' ? 'stroke-emerald-500'
    : hire.status === 'at-risk' ? 'stroke-red-500'
    : hire.status === 'pre-start' ? 'stroke-blue-500'
    : 'stroke-violet-500'

  return (
    <motion.button
      data-id={`hire-card-${hire.id}`}
      layout
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
        selected
          ? 'bg-violet-600/15 border-violet-500/40 shadow-lg shadow-violet-900/20'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Progress ring */}
        <div className="relative shrink-0">
          <ProgressRing pct={progress} size={44} stroke={4} color={ringColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{progress}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <p className="text-sm font-semibold text-white truncate">{hire.name}</p>
            {selected && <ChevronRight size={13} className="text-violet-400 shrink-0" />}
          </div>
          <p className="text-xs text-slate-400 truncate">{hire.role} · {hire.unit}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
              <span className={`w-1 h-1 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            {overdue.length > 0 && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">
                {overdue.length} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 h-1 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className={`h-full rounded-full ${
            hire.status === 'completed' ? 'bg-emerald-500'
            : hire.status === 'at-risk' ? 'bg-red-500'
            : hire.status === 'pre-start' ? 'bg-blue-500'
            : 'bg-violet-500'
          }`}
        />
      </div>
    </motion.button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [hires, setHires] = useState<NewHire[]>(getAllHires)
  const [selectedId, setSelectedId] = useState<string | null>('hire-ek')
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'at-risk' | 'pre-start' | 'in-progress' | 'completed'>('all')
  const [tick, setTick] = useState(0)

  const summary = getSummary()

  // Refresh after task completions / reminder
  function refresh() {
    setHires(getAllHires())
    setTick(t => t + 1)
  }

  function handleTaskComplete(_taskId: string) {
    refresh()
  }

  const filtered = filterStatus === 'all' ? hires : hires.filter(h => h.status === filterStatus)
  const selected = hires.find(h => h.id === selectedId) ?? null

  const filters: { key: typeof filterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'at-risk', label: 'At Risk' },
    { key: 'pre-start', label: 'Pre-Start' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  // Keep tick dependency to silence linter — used to force re-render
  useEffect(() => {}, [tick])

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Onboarding Hub</h1>
            <p className="text-slate-400 text-sm mt-0.5">Track and accelerate new hire progress</p>
          </div>
          <motion.button
            aria-label="Add new hire"
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-violet-900/30"
          >
            <Plus size={16} />
            Add New Hire
          </motion.button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'stat-active',       label: 'Active',         value: summary.total,             icon: Users,         color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { id: 'stat-at-risk',      label: 'At Risk',        value: summary.atRisk,            icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10'    },
            { id: 'stat-completed',    label: 'Completed',      value: summary.completedThisMonth, icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
            { id: 'stat-avg-progress', label: 'Avg Progress',   value: `${summary.avgProgress}%`,  icon: Clock,         color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
          ].map(({ id, label, value, icon: Icon, color, bg }) => (
            <div key={id} id={id} className={`${bg} rounded-xl p-3 border border-slate-700/50`}>
              <div className="flex items-center gap-2">
                <Icon size={15} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left — hire list */}
        <div className="w-80 border-r border-slate-800 flex flex-col shrink-0">
          {/* Filters */}
          <div className="px-3 py-3 border-b border-slate-800 flex gap-1 flex-wrap">
            {filters.map(f => (
              <button
                key={f.key}
                aria-label={`Filter ${f.label}`}
                onClick={() => setFilterStatus(f.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  filterStatus === f.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map(hire => (
                <HireCard
                  key={hire.id}
                  hire={hire}
                  selected={selectedId === hire.id}
                  onClick={() => setSelectedId(hire.id)}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <User size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hires in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — detail panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AnimatePresence mode="wait">
            {selected ? (
              <DetailPanel
                key={selected.id}
                hire={selected}
                onClose={() => setSelectedId(null)}
                onTaskComplete={handleTaskComplete}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-slate-500"
              >
                <UserPlus size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a hire to view progress</p>
                <p className="text-xs mt-1 text-slate-600">Click any card on the left</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Methodology */}
          <div id="onboarding-methodology" className="border-t border-slate-800 px-5 py-4 shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Onboarding Framework</p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: '📋', label: 'HR & Legal', sub: 'Days 1–3' },
                { icon: '💻', label: 'IT Setup', sub: 'Day 1' },
                { icon: '🏥', label: 'Clinical', sub: 'Days 2–7' },
                { icon: '👥', label: 'Unit Intro', sub: 'Days 1–3' },
                { icon: '🛡️', label: 'Compliance', sub: 'Days 7–30' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-medium text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.sub}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 ml-auto">
                <Calendar size={13} className="text-slate-400" />
                <div>
                  <p className="text-[11px] font-medium text-slate-300">30-Day Program</p>
                  <p className="text-[10px] text-slate-500">Joint Commission compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Hire Modal */}
      <AnimatePresence>
        {showModal && (
          <NewHireModal onClose={() => setShowModal(false)} onAdded={refresh} />
        )}
      </AnimatePresence>
    </div>
  )
}
