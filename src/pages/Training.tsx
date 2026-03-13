// Training & Compliance Center — Round 10
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  GraduationCap, CheckCircle2, AlertTriangle, XCircle, Clock,
  ChevronDown, ChevronUp, Send, Bell, FileText, BarChart3,
  Shield, Users, BookOpen, Zap, ChevronRight, ExternalLink,
} from 'lucide-react'
import {
  hospitalCompliance, moduleSummaries, staffTrainingRecords,
  CATEGORY_META, STATUS_META, trainingModules,
  sendReminder, sendBulkReminders, sentReminders,
  type TrainingCategory,
} from '../data/trainingData'

// ─── Animated compliance ring ─────────────────────────────────────────────────

function ComplianceRing({
  pct,
  size = 120,
  stroke = 10,
  label,
  sublabel,
  color,
}: {
  pct: number
  size?: number
  stroke?: number
  label: string
  sublabel?: string
  color: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [drawn, setDrawn] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(pct), 200)
    return () => clearTimeout(timer)
  }, [pct])

  const offset = circ - (drawn / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 leading-tight">{pct}%</span>
          {sublabel && <span className="text-[10px] text-slate-500 leading-tight">{sublabel}</span>}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
    </div>
  )
}

// ─── Module compliance card ────────────────────────────────────────────────────

function ModuleCard({ summary }: { summary: (typeof moduleSummaries)[0] }) {
  const [expanded, setExpanded] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [sending, setSending] = useState(false)

  const catMeta = CATEGORY_META[summary.category]
  const pct = summary.compliancePct

  const barColor = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
  const borderColor = summary.overdueCount > 0
    ? 'border-l-red-400'
    : summary.expiringSoonCount > 0
    ? 'border-l-amber-400'
    : 'border-l-emerald-400'

  function handleBulkReminder() {
    setSending(true)
    setTimeout(() => {
      const n = sendBulkReminders(summary.moduleId)
      setSending(false)
      setReminderSent(true)
      setTimeout(() => setReminderSent(false), 3000)
      // suppress unused warning
      void n
    }, 700)
  }

  // Staff with issues for this module
  const staffWithIssues = staffTrainingRecords
    .filter(s => {
      const mod = trainingModules.find(m => m.id === summary.moduleId)!
      if (!mod.requiredRoles.includes('all') && !mod.requiredRoles.includes(s.role)) return false
      const c = s.completions.find(c => c.moduleId === summary.moduleId)
      return c && (c.status === 'overdue' || c.status === 'expiring-soon')
    })
    .map(s => {
      const c = s.completions.find(c => c.moduleId === summary.moduleId)!
      return { ...s, completion: c }
    })

  return (
    <motion.div
      layout
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColor} shadow-sm overflow-hidden`}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? `Collapse ${summary.shortCode}` : `Expand ${summary.shortCode}`}
      >
        {/* Badge */}
        <div className={`${catMeta.bg} ${catMeta.color} text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0`}>
          {summary.shortCode}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">{summary.title}</p>
            {summary.jcahoRequired && (
              <span className="text-[9px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                JCAHO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ maxWidth: 120 }}>
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.1 }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-600">{pct}%</span>
            <span className="text-[10px] text-slate-400">{summary.frequency} · {summary.durationMinutes}min</span>
          </div>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-2 shrink-0">
          {summary.overdueCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
              <XCircle size={11} /> {summary.overdueCount}
            </span>
          )}
          {summary.expiringSoonCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              <Clock size={11} /> {summary.expiringSoonCount}
            </span>
          )}
          <span className="text-[11px] text-slate-400">{summary.currentCount}/{summary.totalRequired}</span>
          {expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' as const }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
              {staffWithIssues.length === 0 ? (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                  <CheckCircle2 size={14} /> All staff current on this module
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Needing Attention</p>
                  {staffWithIssues.map(s => {
                    const sent = sentReminders.has(`${s.staffId}-${summary.moduleId}`)
                    return (
                      <div key={s.staffId} className="flex items-center gap-3 py-1.5 px-3 bg-slate-50 rounded-lg">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                          s.completion.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
                        }`}>
                          {s.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-500">{s.role} · {s.unit}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-semibold ${STATUS_META[s.completion.status].color} ${STATUS_META[s.completion.status].bg} px-2 py-0.5 rounded-full`}>
                            {s.completion.status === 'overdue'
                              ? s.completion.completedDate ? 'Expired' : 'Never done'
                              : `${s.completion.daysTillExpiry}d left`}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); sendReminder(s.staffId, summary.moduleId) }}
                          disabled={sent}
                          aria-label={`Send reminder to ${s.name}`}
                          className={`p-1.5 rounded-lg transition-colors ${sent ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}
                        >
                          {sent ? <CheckCircle2 size={14} /> : <Bell size={14} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Bulk reminder */}
              {staffWithIssues.length > 1 && (
                <button
                  onClick={handleBulkReminder}
                  disabled={sending || reminderSent}
                  aria-label={`Send bulk reminder for ${summary.shortCode}`}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    reminderSent
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {sending ? (
                    <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : reminderSent ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Send size={13} />
                  )}
                  {reminderSent
                    ? `Reminders sent to ${staffWithIssues.length} staff`
                    : sending
                    ? 'Sending…'
                    : `Send reminder to all ${staffWithIssues.length} staff`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Staff compliance row ──────────────────────────────────────────────────────

function StaffRow({
  record,
  onRowClick,
}: {
  record: (typeof staffTrainingRecords)[0]
  onRowClick: (id: string) => void
}) {
  const scoreColor =
    record.overallScore >= 90 ? 'text-emerald-600' :
    record.overallScore >= 70 ? 'text-amber-600' : 'text-red-600'
  const scoreBg =
    record.overallScore >= 90 ? 'bg-emerald-50' :
    record.overallScore >= 70 ? 'bg-amber-50' : 'bg-red-50'

  return (
    <tr
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => onRowClick(record.staffId)}
      data-staffid={record.staffId}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
            record.overdueCount > 0 ? 'bg-red-400' :
            record.expiringSoonCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'
          }`}>
            {record.avatarInitials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{record.name}</p>
            <p className="text-xs text-slate-400">{record.role} · {record.unit}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-bold ${scoreColor} ${scoreBg} px-2 py-0.5 rounded-full`}>
          {record.overallScore}%
        </span>
      </td>
      <td className="px-4 py-3">
        {record.overdueCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
            <XCircle size={12} /> {record.overdueCount}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {record.expiringSoonCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
            <Clock size={12} /> {record.expiringSoonCount}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{record.lastActivity}</td>
      <td className="px-4 py-3">
        <Link
          to={`/staff/${record.staffId}`}
          onClick={e => e.stopPropagation()}
          className="text-violet-600 hover:text-violet-700 p-1 rounded hover:bg-violet-50 inline-flex"
        >
          <ExternalLink size={13} />
        </Link>
      </td>
    </tr>
  )
}

// ─── Staff detail panel ────────────────────────────────────────────────────────

function StaffDetailPanel({
  staffId,
  onClose,
}: {
  staffId: string
  onClose: () => void
}) {
  const record = staffTrainingRecords.find(s => s.staffId === staffId)
  if (!record) return null

  return (
    <motion.div
      key="staff-panel"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22, ease: 'easeOut' as const }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
          record.overdueCount > 0 ? 'bg-red-400' :
          record.expiringSoonCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'
        }`}>
          {record.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{record.name}</p>
          <p className="text-xs text-slate-500">{record.role} · {record.unit}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close staff detail"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>

      {/* Score */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-slate-100">
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-1">Overall Compliance</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  record.overallScore >= 90 ? 'bg-emerald-500' :
                  record.overallScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${record.overallScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' as const }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700">{record.overallScore}%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Overdue</p>
          <p className="text-xl font-bold text-red-600">{record.overdueCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Expiring</p>
          <p className="text-xl font-bold text-amber-600">{record.expiringSoonCount}</p>
        </div>
      </div>

      {/* Module list */}
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {record.completions.map(comp => {
          const mod = trainingModules.find(m => m.id === comp.moduleId)
          if (!mod) return null
          const sMeta = STATUS_META[comp.status]
          const sent = sentReminders.has(`${record.staffId}-${comp.moduleId}`)
          return (
            <div key={comp.moduleId} className="flex items-center gap-3 px-4 py-2.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${sMeta.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-700 truncate">{mod.title}</p>
                  {mod.jcahoRequired && (
                    <span className="text-[9px] bg-violet-100 text-violet-600 px-1 rounded font-bold shrink-0">JC</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {comp.completedDate
                    ? `Completed ${comp.completedDate}${comp.expiryDate ? ` · expires ${comp.expiryDate}` : ''}`
                    : comp.status === 'not-required' ? 'Not required for this role' : 'Never completed'}
                  {comp.score !== null ? ` · ${comp.score}%` : ''}
                </p>
              </div>
              <span className={`text-[10px] font-semibold ${sMeta.color} ${sMeta.bg} px-1.5 py-0.5 rounded-full shrink-0`}>
                {comp.status === 'expiring-soon' && comp.daysTillExpiry !== null
                  ? `${comp.daysTillExpiry}d`
                  : sMeta.label}
              </span>
              {(comp.status === 'overdue' || comp.status === 'expiring-soon') && (
                <button
                  onClick={() => sendReminder(record.staffId, comp.moduleId)}
                  disabled={sent}
                  aria-label={`Remind ${record.name} for ${mod.shortCode}`}
                  className={`p-1 rounded transition-colors ${sent ? 'text-emerald-500' : 'text-slate-300 hover:text-violet-600'}`}
                >
                  {sent ? <CheckCircle2 size={12} /> : <Bell size={12} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type SortField = 'name' | 'score' | 'overdue' | 'expiring'

export default function Training() {
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'all'>('all')
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [staffSort, setStaffSort] = useState<SortField>('overdue')
  const [, forceUpdate] = useState(0)

  // Compute ring color
  const overallColor =
    hospitalCompliance.overallPct >= 90 ? '#10b981' :
    hospitalCompliance.overallPct >= 70 ? '#f59e0b' : '#ef4444'

  const jcahoColor =
    hospitalCompliance.jcahoScore >= 90 ? '#10b981' :
    hospitalCompliance.jcahoScore >= 70 ? '#f59e0b' : '#ef4444'

  // Category filter tabs
  const categories: { key: TrainingCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Modules' },
    { key: 'regulatory', label: 'Regulatory' },
    { key: 'clinical', label: 'Clinical' },
    { key: 'safety', label: 'Safety' },
    { key: 'skills', label: 'Skills' },
  ]

  const filteredModules = categoryFilter === 'all'
    ? moduleSummaries
    : moduleSummaries.filter(m => m.category === categoryFilter)

  // Expiring-soon alerts across all staff
  const expiringAlerts = staffTrainingRecords
    .flatMap(s => s.completions
      .filter(c => c.status === 'expiring-soon' && c.daysTillExpiry !== null)
      .map(c => ({
        staffId: s.staffId,
        name: s.name,
        initials: s.avatarInitials,
        role: s.role,
        unit: s.unit,
        completion: c,
        module: trainingModules.find(m => m.id === c.moduleId)!,
      }))
    )
    .sort((a, b) => (a.completion.daysTillExpiry ?? 999) - (b.completion.daysTillExpiry ?? 999))

  // Sort staff
  const sortedStaff = [...staffTrainingRecords].sort((a, b) => {
    if (staffSort === 'name')     return a.name.localeCompare(b.name)
    if (staffSort === 'score')    return a.overallScore - b.overallScore
    if (staffSort === 'overdue')  return b.overdueCount - a.overdueCount
    if (staffSort === 'expiring') return b.expiringSoonCount - a.expiringSoonCount
    return 0
  })

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const active = staffSort === field
    return (
      <th
        className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none"
        onClick={() => setStaffSort(field)}
      >
        <span className="flex items-center gap-1">
          {label}
          {active && <ChevronDown size={11} className="text-violet-500" />}
        </span>
      </th>
    )
  }

  const overdueModules = moduleSummaries.filter(m => m.overdueCount > 0)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={20} className="text-violet-600" />
              <h1 className="text-xl font-bold text-slate-800">Training & Compliance Center</h1>
            </div>
            <p className="text-sm text-slate-500">JCAHO-ready compliance tracking · Mercy General Hospital</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Export compliance report"
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <FileText size={13} /> Export Report
            </button>
            <Link
              to="/staff"
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Users size={13} /> Staff Directory
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Critical alert banner ── */}
        {overdueModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            aria-label="Critical compliance alert"
          >
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">
                {hospitalCompliance.overdue} overdue training items across {overdueModules.length} module{overdueModules.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Joint Commission audit readiness at risk. Staff must complete overdue training before next survey window.
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full shrink-0">
              Action Required
            </span>
          </motion.div>
        )}

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Overall Compliance',
              value: `${hospitalCompliance.overallPct}%`,
              sub: `${hospitalCompliance.current} of ${hospitalCompliance.total} items current`,
              icon: BarChart3,
              color: hospitalCompliance.overallPct >= 90 ? 'text-emerald-600' : hospitalCompliance.overallPct >= 70 ? 'text-amber-600' : 'text-red-600',
              bg:   hospitalCompliance.overallPct >= 90 ? 'bg-emerald-50' : hospitalCompliance.overallPct >= 70 ? 'bg-amber-50' : 'bg-red-50',
              id: 'stat-overall',
            },
            {
              label: 'JCAHO Readiness',
              value: `${hospitalCompliance.jcahoScore}%`,
              sub: `${hospitalCompliance.jcahoCompliant}/${hospitalCompliance.jcahoTotal} JCAHO items met`,
              icon: Shield,
              color: hospitalCompliance.jcahoScore >= 90 ? 'text-emerald-600' : 'text-amber-600',
              bg:   hospitalCompliance.jcahoScore >= 90 ? 'bg-emerald-50' : 'bg-amber-50',
              id: 'stat-jcaho',
            },
            {
              label: 'Overdue Items',
              value: hospitalCompliance.overdue.toString(),
              sub: `${staffTrainingRecords.filter(s => s.overdueCount > 0).length} staff with overdue training`,
              icon: XCircle,
              color: hospitalCompliance.overdue > 0 ? 'text-red-600' : 'text-emerald-600',
              bg:   hospitalCompliance.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50',
              id: 'stat-overdue',
            },
            {
              label: 'Expiring ≤60 Days',
              value: hospitalCompliance.expiringSoon.toString(),
              sub: `${expiringAlerts.length} certification renewal${expiringAlerts.length !== 1 ? 's' : ''} needed`,
              icon: Clock,
              color: hospitalCompliance.expiringSoon > 0 ? 'text-amber-600' : 'text-emerald-600',
              bg:   hospitalCompliance.expiringSoon > 0 ? 'bg-amber-50' : 'bg-emerald-50',
              id: 'stat-expiring',
            },
          ].map(stat => (
            <div key={stat.id} id={stat.id} className={`${stat.bg} rounded-xl px-4 py-3 border border-slate-200`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{stat.sub}</p>
                </div>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Compliance rings + expiring alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Compliance rings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Compliance Overview</p>
            <div className="flex items-center justify-around">
              <ComplianceRing
                pct={hospitalCompliance.overallPct}
                color={overallColor}
                label="Overall"
                sublabel="all modules"
              />
              <ComplianceRing
                pct={hospitalCompliance.jcahoScore}
                color={jcahoColor}
                label="JCAHO"
                sublabel="required only"
                size={100}
                stroke={8}
              />
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600">{hospitalCompliance.fullyCompliant} fully compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600">{hospitalCompliance.expiringSoon} expiring soon</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-slate-600">{hospitalCompliance.overdue} overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-slate-600">{hospitalCompliance.staffAtRisk} staff at risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring soon alerts */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-amber-500" />
                <p className="text-sm font-semibold text-slate-700">Expiring Within 60 Days</p>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">
                  {expiringAlerts.length}
                </span>
              </div>
            </div>
            {expiringAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 size={28} className="text-emerald-400 mb-2" />
                <p className="text-sm">No certifications expiring soon</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto" id="expiring-list">
                {expiringAlerts.map((alert, i) => {
                  const sent = sentReminders.has(`${alert.staffId}-${alert.completion.moduleId}`)
                  const urgent = (alert.completion.daysTillExpiry ?? 999) <= 14
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${urgent ? 'bg-red-50/50' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {alert.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{alert.name}</p>
                        <p className="text-[10px] text-slate-400">{alert.module.shortCode} · {alert.role}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.completion.daysTillExpiry}d
                      </span>
                      <button
                        onClick={() => { sendReminder(alert.staffId, alert.completion.moduleId); forceUpdate(n => n + 1) }}
                        disabled={sent}
                        aria-label={`Remind ${alert.name} about ${alert.module.shortCode}`}
                        className={`p-1.5 rounded-lg transition-colors ${sent ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}
                      >
                        {sent ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Module cards */}
          <div className="xl:col-span-2 space-y-3">
            {/* Category filter */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm w-fit">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  aria-label={`Filter by ${cat.label}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === cat.key
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Module list */}
            <div className="space-y-2">
              {filteredModules.map(mod => (
                <ModuleCard key={mod.moduleId} summary={mod} />
              ))}
            </div>
          </div>

          {/* Right column: Staff table + detail panel */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
              <div className="space-y-1.5">
                {[
                  { icon: Zap, label: 'Assign overdue training', color: 'text-red-600', action: 'assign-overdue' },
                  { icon: Bell, label: 'Notify all at-risk staff', color: 'text-amber-600', action: 'notify-all' },
                  { icon: BookOpen, label: 'View JCAHO checklist', color: 'text-violet-600', action: 'jcaho-checklist' },
                  { icon: FileText, label: 'Generate audit report', color: 'text-slate-600', action: 'audit-report' },
                ].map(({ icon: Icon, label, color, action }) => (
                  <button
                    key={action}
                    aria-label={label}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <Icon size={14} className={color} />
                    <span className="text-xs font-medium text-slate-700">{label}</span>
                    <ChevronRight size={12} className="text-slate-300 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Staff compliance table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Staff Compliance</p>
                </div>
                <span className="text-[10px] text-slate-400">{staffTrainingRecords.length} staff</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" id="staff-compliance-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <SortHeader field="name" label="Staff" />
                      <SortHeader field="score" label="Score" />
                      <SortHeader field="overdue" label="Overdue" />
                      <SortHeader field="expiring" label="Expiring" />
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Last</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedStaff.map(record => (
                      <StaffRow
                        key={record.staffId}
                        record={record}
                        onRowClick={(id) => setSelectedStaff(prev => prev === id ? null : id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff detail panel */}
            <AnimatePresence mode="wait">
              {selectedStaff && (
                <StaffDetailPanel
                  key={selectedStaff}
                  staffId={selectedStaff}
                  onClose={() => setSelectedStaff(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}
