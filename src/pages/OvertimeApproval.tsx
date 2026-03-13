// OvertimeApproval.tsx — Overtime Approval Center
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
  X,
  ArrowUpRight,
  Filter,
  History,
  Brain,
} from 'lucide-react'
import {
  getAllRequests,
  getRequestStatus,
  getReviewNote,
  approveRequest,
  denyRequest,
  escalateRequest,
  batchApproveAll,
  getOTSummary,
  OT_BUDGET,
  PREDICTIVE_ALERTS,
  OT_REASON_META,
  STATUS_META,
  DENY_REASONS,
  type OTRequest,
} from '../data/overtimeData'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}
function minsAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 60) return `${Math.round(diff)}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  return `${Math.round(diff / 1440)}d ago`
}

// ─── Budget gauge ─────────────────────────────────────────────────────────────
function BudgetGauge({ budget }: { budget: typeof OT_BUDGET }) {
  const spentPct = (budget.spentSoFarDollars / budget.weeklyBudgetDollars) * 100
  const pendingPct = (budget.pendingApprovalDollars / budget.weeklyBudgetDollars) * 100
  const projectedPct = Math.min((budget.projectedDollars / budget.weeklyBudgetDollars) * 100, 100)
  const isWarning = projectedPct >= budget.budgetWarningThreshold * 100
  const isCritical = projectedPct >= budget.budgetCriticalThreshold * 100
  const color = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div id="budget-gauge" className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Weekly OT Budget</span>
        </div>
        <span className="text-xs text-slate-500">{budget.period}</span>
      </div>

      {/* Bar */}
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative mb-2">
        {/* Spent */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${spentPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' as const }}
          className={`absolute left-0 top-0 h-full ${color} rounded-full`}
        />
        {/* Pending (lighter overlay) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(spentPct + pendingPct, 100)}%` }}
          transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' as const }}
          className={`absolute left-0 top-0 h-full ${color} opacity-30 rounded-full`}
        />
        {/* Warning line */}
        <div
          className="absolute top-0 h-full w-px bg-amber-400/60"
          style={{ left: `${budget.budgetWarningThreshold * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-slate-400">Spent: <span className="text-white font-semibold">{fmt$(budget.spentSoFarDollars)}</span></span>
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color} opacity-40`} />
            <span className="text-slate-400">Pending: <span className="text-white font-semibold">{fmt$(budget.pendingApprovalDollars)}</span></span>
          </span>
        </div>
        <span className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`}>
          {Math.round(projectedPct)}% of {fmt$(budget.weeklyBudgetDollars)}
        </span>
      </div>

      {isCritical && (
        <div className="mt-2 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={12} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-xs">Budget critical — new OT requires director approval</p>
        </div>
      )}
    </div>
  )
}

// ─── Predictive alert card ────────────────────────────────────────────────────
function PredictiveCard({ alert }: { alert: typeof PREDICTIVE_ALERTS[number] }) {
  const likelihood = alert.likelihood
  const color = likelihood >= 85 ? 'border-red-500/40 bg-red-500/5' : likelihood >= 65 ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/40'
  const dotColor = likelihood >= 85 ? 'bg-red-500' : likelihood >= 65 ? 'bg-amber-500' : 'bg-blue-500'

  return (
    <motion.div
      data-id={`pred-card-${alert.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${color}`}
    >
      <div className="mt-1 shrink-0">
        <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{alert.nurseName}
            <span className="text-slate-500 font-normal text-xs ml-1.5">· {alert.unit}</span>
          </p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dotColor} bg-opacity-20 ${likelihood >= 85 ? 'text-red-300' : likelihood >= 65 ? 'text-amber-300' : 'text-blue-300'}`}>
            {likelihood}% likely
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {alert.currentWeekHours}h this week → projected {alert.projectedHoursEOD}h EOD
          {alert.projectedOTHours > 0 && <span className="text-red-400 font-semibold"> (+{alert.projectedOTHours}h OT · {fmt$(alert.projectedCost)})</span>}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 italic">{alert.suggestedAction}</p>
      </div>
    </motion.div>
  )
}

// ─── Deny modal ───────────────────────────────────────────────────────────────
function DenyModal({ request, onConfirm, onCancel }: {
  request: OTRequest; onConfirm: (reason: string) => void; onCancel: () => void
}) {
  const [selectedReason, setSelectedReason] = useState(DENY_REASONS[0])
  const [custom, setCustom] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        id="deny-modal"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold">Deny OT Request</h2>
            <p className="text-slate-400 text-xs mt-0.5">{request.nurseName} · {request.extraHours}h · {request.unitShort}</p>
          </div>
          <button onClick={onCancel} aria-label="Close deny modal" className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-2 font-medium">Reason for denial:</p>
        <div className="space-y-2 mb-4">
          {DENY_REASONS.map(r => (
            <label key={r} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="deny-reason"
                value={r}
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="mt-0.5 accent-violet-500"
              />
              <span className={`text-sm ${selectedReason === r ? 'text-white' : 'text-slate-400'}`}>{r}</span>
            </label>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <textarea
            id="deny-custom-reason"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Describe the reason…"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-4 resize-none"
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            aria-label={`Confirm deny ${request.id}`}
            onClick={() => onConfirm(selectedReason === 'Other' ? (custom || 'Other reason') : selectedReason)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Deny Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── OT Request card ──────────────────────────────────────────────────────────
function OTCard({
  request,
  onApprove,
  onDeny,
  onEscalate,
}: {
  request: OTRequest
  onApprove: (id: string) => void
  onDeny: (req: OTRequest) => void
  onEscalate: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [approving, setApproving] = useState(false)
  const [justDone, setJustDone] = useState<'approved' | 'denied' | null>(null)

  const status = getRequestStatus(request)
  const statusMeta = STATUS_META[status]
  const reasonMeta = OT_REASON_META[request.reason]
  const isPending = status === 'pending' || status === 'escalated'
  const reviewNote = getReviewNote(request)

  function handleApprove() {
    if (!isPending) return
    setApproving(true)
    setTimeout(() => {
      setJustDone('approved')
      setApproving(false)
      // Delay parent removal so "Approved!" state is visible before card exits
      setTimeout(() => onApprove(request.id), 1400)
    }, 600)
  }

  const bgClass = status === 'escalated' ? 'border-violet-500/40 bg-violet-500/5'
    : status === 'approved' || status === 'auto-approved' ? 'border-emerald-500/20 bg-emerald-500/5'
    : status === 'denied' ? 'border-red-500/20 bg-red-500/5'
    : 'border-slate-700/50 bg-slate-800/50'

  return (
    <motion.div
      layout
      data-id={`ot-card-${request.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`rounded-2xl border overflow-hidden ${bgClass} transition-colors`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
            {request.nurseInitials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white">{request.nurseName}</p>
              <span className="text-slate-500 text-xs">{request.nurseRole}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
                <span className={`w-1 h-1 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{request.unitShort}</span>
              <span>·</span>
              <span>{fmtTime(request.shiftEnd)} → {fmtTime(request.requestedUntil)}</span>
              <span>·</span>
              <span className="font-semibold text-white">{request.extraHours}h extra</span>
              {request.overtimeHours > 0 && (
                <>
                  <span>·</span>
                  <span className="text-red-400 font-semibold">{request.overtimeHours}h OT rate</span>
                </>
              )}
            </div>
          </div>

          {/* Cost badge */}
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-white">{fmt$(request.estimatedOTCost)}</p>
            <p className="text-[10px] text-slate-500">est. cost</p>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs ${reasonMeta.color}`}>{reasonMeta.icon} {reasonMeta.label}</span>
          {request.coverageFor && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Covering: <span className="text-slate-300">{request.coverageFor}</span></span>
            </>
          )}
          <span className="ml-auto text-[11px] text-slate-500">{minsAgo(request.submittedAt)}</span>
        </div>

        {/* Expand/collapse reason note */}
        {request.reasonNote && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>{expanded ? 'Hide' : 'Show'} details</span>
            <ChevronUp size={11} className={`transition-transform ${expanded ? '' : 'rotate-180'}`} />
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30">
                <p className="text-xs text-slate-300 leading-relaxed">{request.reasonNote}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Week total: {request.currentWeekHours}h → {request.currentWeekHours + request.extraHours}h</span>
                  <span>·</span>
                  <span>{request.otMultiplier}× rate @ {fmt$(request.hourlyRate)}/hr</span>
                  <span>·</span>
                  <span className="text-slate-400">{request.budgetCode}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review note (if decided) */}
        {reviewNote && !isPending && (
          <div className={`mt-3 flex items-start gap-2 px-3 py-2 rounded-lg ${
            status === 'denied' ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
          }`}>
            {status === 'denied' ? <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" /> : <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />}
            <p className="text-xs text-slate-300">{reviewNote}</p>
          </div>
        )}

        {/* Action buttons */}
        {isPending && (
          <div className="mt-3 flex gap-2">
            <motion.button
              aria-label={`Approve request ${request.id}`}
              onClick={handleApprove}
              disabled={approving || justDone !== null}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 rounded-xl transition-all text-sm ${
                justDone === 'approved'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
                  : approving
                  ? 'bg-emerald-600/50 text-emerald-300 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {justDone === 'approved' ? (
                <><CheckCircle2 size={14} /> Approved!</>
              ) : approving ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}><Clock size={14} /></motion.div> Approving…</>
              ) : (
                <><CheckCircle2 size={14} /> Approve</>
              )}
            </motion.button>

            {request.escalationLevel !== 'director' && request.escalationLevel !== 'cno' ? (
              <motion.button
                aria-label={`Deny request ${request.id}`}
                onClick={() => onDeny(request)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-900/40 border border-slate-600 hover:border-red-500/40 text-slate-300 hover:text-red-300 font-semibold py-2 rounded-xl transition-all text-sm"
              >
                <XCircle size={14} />
                Deny
              </motion.button>
            ) : (
              <motion.button
                aria-label={`Escalate request ${request.id}`}
                onClick={() => onEscalate(request.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 text-violet-100 font-semibold py-2 rounded-xl transition-all text-sm border border-violet-500/40"
              >
                <ArrowUpRight size={14} />
                Escalate ↑
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabKey = 'pending' | 'all' | 'history'

export default function OvertimeApproval() {
  const [requests, setRequests] = useState(getAllRequests)
  const [tab, setTab] = useState<TabKey>('pending')
  const [denyTarget, setDenyTarget] = useState<OTRequest | null>(null)
  const [batchApproving, setBatchApproving] = useState(false)
  const [batchDone, setBatchDone] = useState(false)
  const [filterUnit, setFilterUnit] = useState('all')
  const tickRef = useRef(0)

  function refresh() {
    tickRef.current++
    setRequests([...getAllRequests()])
  }

  function handleApprove(id: string) {
    approveRequest(id)
    refresh()
  }

  function handleDenyConfirm(reason: string) {
    if (!denyTarget) return
    denyRequest(denyTarget.id, reason)
    setDenyTarget(null)
    refresh()
  }

  function handleEscalate(id: string) {
    escalateRequest(id)
    refresh()
  }

  function handleBatchApprove() {
    const pendingIds = getPendingList().map(r => r.id)
    if (pendingIds.length === 0) return
    setBatchApproving(true)
    setTimeout(() => {
      batchApproveAll(pendingIds)
      setBatchDone(true)
      setBatchApproving(false)
      refresh()
    }, 1200)
  }

  const summary = getOTSummary()
  const units = [...new Set(requests.map(r => r.unitShort))]

  function getPendingList() {
    return requests.filter(r => getRequestStatus(r) === 'pending')
  }

  function getFilteredList(): OTRequest[] {
    let list = tab === 'pending'
      ? requests.filter(r => ['pending', 'escalated'].includes(getRequestStatus(r)))
      : tab === 'history'
      ? requests.filter(r => ['approved', 'denied', 'auto-approved'].includes(getRequestStatus(r)))
      : requests
    if (filterUnit !== 'all') {
      list = list.filter(r => r.unitShort === filterUnit)
    }
    return list
  }

  const displayList = getFilteredList()
  const pendingCount = getPendingList().length

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Overtime Approval</h1>
            <p className="text-slate-400 text-sm mt-0.5">Real-time OT requests · Budget tracking · Predictive alerts</p>
          </div>
          {pendingCount > 0 && !batchDone && (
            <motion.button
              aria-label="Batch approve all pending"
              onClick={handleBatchApprove}
              disabled={batchApproving}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm shadow-lg ${
                batchApproving
                  ? 'bg-emerald-600/50 text-emerald-300 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {batchApproving ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}><Clock size={15} /></motion.div> Approving…</>
              ) : (
                <><CheckCircle2 size={15} /> Approve All ({pendingCount})</>
              )}
            </motion.button>
          )}
          {batchDone && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold px-4 py-2.5 rounded-xl text-sm">
              <CheckCircle2 size={15} /> All Approved!
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { id: 'stat-pending',   icon: Clock,        label: 'Pending',        value: summary.pending,   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
            { id: 'stat-approved',  icon: CheckCircle2, label: 'Approved Today', value: summary.approved,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { id: 'stat-cost',      icon: DollarSign,   label: 'Approved Cost',  value: fmt$(summary.approvedCost), color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { id: 'stat-escalated', icon: ArrowUpRight, label: 'Escalated',      value: summary.escalated, color: 'text-violet-400',   bg: 'bg-violet-500/10' },
          ].map(({ id, icon: Icon, label, value, color, bg }) => (
            <div key={id} id={id} className={`${bg} rounded-xl p-3 border border-slate-700/50`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Budget gauge */}
        <BudgetGauge budget={OT_BUDGET} />
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left — request queue */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tabs + filter */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center gap-3 flex-wrap shrink-0">
            <div className="flex gap-1">
              {([
                { key: 'pending' as TabKey,  label: 'Needs Action', count: pendingCount },
                { key: 'all' as TabKey,      label: 'All',          count: requests.length },
                { key: 'history' as TabKey,  label: 'History',      count: summary.approved + summary.denied },
              ]).map(t => (
                <button
                  key={t.key}
                  aria-label={`Tab ${t.label}`}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    tab === t.key ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-slate-700'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Unit filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <Filter size={12} className="text-slate-500" />
              <select
                aria-label="Filter by unit"
                value={filterUnit}
                onChange={e => setFilterUnit(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Units</option>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {displayList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-slate-500"
              >
                <CheckCircle2 size={40} className="mb-3 text-emerald-500/40" />
                <p className="text-sm font-medium">
                  {tab === 'pending' ? 'All caught up — no pending requests' : 'No requests in this view'}
                </p>
                <p className="text-xs mt-1 text-slate-600">New OT requests will appear here in real time</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {displayList.map(req => (
                    <OTCard
                      key={req.id}
                      request={req}
                      onApprove={handleApprove}
                      onDeny={setDenyTarget}
                      onEscalate={handleEscalate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — AI alerts + summary */}
        <div className="w-80 border-l border-slate-800 flex flex-col shrink-0">
          {/* Predictive */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={15} className="text-violet-400" />
              <span className="text-sm font-semibold text-slate-200">AI OT Predictions</span>
              <span className="ml-auto text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Today</span>
            </div>
            <div className="space-y-2">
              {PREDICTIVE_ALERTS.map(a => (
                <PredictiveCard key={a.id} alert={a} />
              ))}
            </div>
          </div>

          {/* This week summary */}
          <div className="px-4 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-200">This Week</span>
            </div>

            {/* Unit breakdown */}
            <div className="space-y-2">
              {[
                { unit: 'ICU',  hours: 8,  cost: 639,  color: 'bg-red-500' },
                { unit: 'MS-B', hours: 6,  cost: 303.75, color: 'bg-amber-500' },
                { unit: 'ED',   hours: 8,  cost: 672,  color: 'bg-violet-500' },
                { unit: 'CCU',  hours: 2,  cost: 165,  color: 'bg-blue-500' },
                { unit: 'ONC',  hours: 4,  cost: 280.50, color: 'bg-teal-500' },
              ].map(item => {
                const pct = Math.round((item.cost / OT_BUDGET.spentSoFarDollars) * 100)
                return (
                  <div key={item.unit} id={`unit-row-${item.unit.toLowerCase()}`} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-10 shrink-0">{item.unit}</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' as const }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-14 text-right shrink-0">{fmt$(item.cost)}</span>
                  </div>
                )
              })}
            </div>

            {/* Policy reference */}
            <div id="ot-policy" className="mt-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <History size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">OT Policy Reference</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  { rule: 'Manager auto-approves ≤ 2 hrs, patient safety', level: 'auto' },
                  { rule: 'Manager approval required: 2–6 hrs', level: 'manager' },
                  { rule: 'Director approval: > 6 hrs or > 2× rate', level: 'director' },
                  { rule: 'CNO approval: mandatory OT > 16 hrs/event', level: 'cno' },
                  { rule: 'Budget alert at 80% — notify director', level: 'budget' },
                ].map(item => (
                  <li key={item.rule} className="flex items-start gap-2">
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      item.level === 'auto' ? 'bg-blue-500'
                      : item.level === 'manager' ? 'bg-amber-500'
                      : item.level === 'director' ? 'bg-violet-500'
                      : item.level === 'cno' ? 'bg-red-500'
                      : 'bg-emerald-500'
                    }`} />
                    <span className="text-[11px] text-slate-400 leading-relaxed">{item.rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Units legend */}
            <div className="mt-3 flex items-center gap-2">
              <Users size={13} className="text-slate-500" />
              <span className="text-[11px] text-slate-500">
                {requests.filter(r => getRequestStatus(r) === 'approved' || getRequestStatus(r) === 'auto-approved').length} approvals ·
                {' '}{requests.filter(r => getRequestStatus(r) === 'denied').length} denied this week
              </span>
            </div>

            {/* Methodology section */}
            <div id="ot-methodology" className="mt-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap size={13} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-slate-300">Cost Intelligence</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                OT cost = base rate × multiplier × extra hours. Predictions use rolling 7-day schedule data.
                Auto-approval fires for ≤ 2 hrs patient safety extensions under budget threshold.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                <ChevronRight size={10} />
                <span>Budget resets every Monday 00:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deny modal */}
      <AnimatePresence>
        {denyTarget && (
          <DenyModal
            request={denyTarget}
            onConfirm={handleDenyConfirm}
            onCancel={() => setDenyTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
