import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Clock, AlertTriangle, CheckCircle, XCircle,
  Plus, X, Shield, Zap, ChevronDown, User, Calendar,
  ThumbsUp, ThumbsDown, Star,
} from 'lucide-react'
import {
  getOpenSwaps, getApprovalQueue, getMySwaps, getStats,
  claimSwap, approveSwap, denySwap, postSwap,
  MY_UPCOMING_SHIFTS, REASON_LABELS,
  type SwapRequest, type SwapReason,
} from '../data/swapData'

// ── Urgency helpers ───────────────────────────────────────────────────────────

function urgencyLabel(h: number) {
  if (h <= 0)  return 'Past'
  if (h < 12)  return `${h}h — URGENT`
  if (h < 48)  return `${h}h — Soon`
  return `${Math.round(h / 24)}d away`
}
function urgencyColor(h: number, status: string) {
  if (status !== 'open') return 'text-slate-400'
  if (h <= 0)  return 'text-slate-400'
  if (h < 12)  return 'text-red-400'
  if (h < 48)  return 'text-amber-400'
  return 'text-slate-400'
}
function urgencyBorder(h: number, status: string) {
  if (status !== 'open') return ''
  if (h < 12)  return 'border-l-2 border-l-red-500'
  if (h < 48)  return 'border-l-2 border-l-amber-500'
  return ''
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow`}>
      {initials}
    </div>
  )
}

// ── SmartChecks row ───────────────────────────────────────────────────────────

function SmartChecks({ checks }: { checks: NonNullable<SwapRequest['smartChecks']> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {checks.map(c => (
        <span
          key={c.key}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            c.passes
              ? 'bg-emerald-900/40 text-emerald-300'
              : c.warning
              ? 'bg-amber-900/40 text-amber-300'
              : 'bg-red-900/40 text-red-300'
          }`}
        >
          {c.passes
            ? <CheckCircle size={11} />
            : c.warning
            ? <AlertTriangle size={11} />
            : <XCircle size={11} />}
          {c.label}
        </span>
      ))}
    </div>
  )
}

// ── Swap Card ─────────────────────────────────────────────────────────────────

function SwapCard({
  swap,
  view,
  onClaim,
  onApprove,
  onDeny,
}: {
  swap: SwapRequest
  view: 'open' | 'queue' | 'mine'
  onClaim: (id: string) => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}) {
  const isUrgent = swap.status === 'open' && swap.hoursUntilShift < 12
  const shiftTypeColor = swap.shift.shiftType === 'night' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-amber-900/40 text-amber-300'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ease: 'easeOut' as const, duration: 0.2 }}
      data-id={`swap-card-${swap.id}`}
      className={`bg-slate-800 rounded-xl p-4 shadow ${urgencyBorder(swap.hoursUntilShift, swap.status)}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar initials={swap.postedByInitials} color={swap.postedByColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{swap.postedByName}</span>
            <span className="text-slate-500 text-xs">{swap.postedByRole}</span>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 bg-red-900/50 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Zap size={9} /> URGENT
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{swap.postedAgo}</p>
        </div>
        {/* Status badge */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
          swap.status === 'open'      ? 'bg-sky-900/50 text-sky-300' :
          swap.status === 'claimed'   ? 'bg-amber-900/50 text-amber-300' :
          swap.status === 'approved'  ? 'bg-emerald-900/50 text-emerald-300' :
          swap.status === 'denied'    ? 'bg-red-900/50 text-red-300' :
          'bg-slate-700 text-slate-400'
        }`}>
          {swap.status === 'claimed' ? 'Pending' : swap.status}
        </span>
      </div>

      {/* Shift details */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="bg-slate-700/60 rounded-lg px-3 py-2">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Date</p>
          <p className="text-white text-xs font-medium mt-0.5">{swap.shift.dateLabel}</p>
        </div>
        <div className="bg-slate-700/60 rounded-lg px-3 py-2">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Shift</p>
          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${shiftTypeColor}`}>
            {swap.shift.shiftType === 'day' ? '☀ Day' : '🌙 Night'}
          </span>
        </div>
        <div className="bg-slate-700/60 rounded-lg px-3 py-2">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Unit</p>
          <p className="text-white text-xs font-medium mt-0.5">{swap.shift.unit}</p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Clock size={11} className={urgencyColor(swap.hoursUntilShift, swap.status)} />
        <span className={`text-[11px] font-medium ${urgencyColor(swap.hoursUntilShift, swap.status)}`}>
          {urgencyLabel(swap.hoursUntilShift)} · {swap.shift.shiftHours}
        </span>
      </div>

      {/* Reason + notes */}
      <div className="mt-3">
        <span className="text-[11px] text-slate-400 font-medium">{swap.reason}</span>
        {swap.notes && (
          <p className="text-slate-300 text-xs mt-1 italic">"{swap.notes}"</p>
        )}
      </div>

      {/* Claimed-by row */}
      {swap.claimedByName && (
        <div className="mt-3 flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2">
          <Avatar initials={swap.claimedByInitials!} color={swap.claimedByColor!} size="sm" />
          <div>
            <p className="text-slate-400 text-[10px]">Claimed by</p>
            <p className="text-white text-xs font-semibold">{swap.claimedByName}</p>
          </div>
        </div>
      )}

      {/* Smart checks */}
      {swap.smartChecks && swap.smartChecks.length > 0 && (
        <SmartChecks checks={swap.smartChecks} />
      )}

      {/* Manager note */}
      {swap.managerNote && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 ${
          swap.status === 'denied' ? 'bg-red-900/20' : 'bg-amber-900/20'
        }`}>
          <Shield size={13} className={swap.status === 'denied' ? 'text-red-400 mt-0.5' : 'text-amber-400 mt-0.5'} />
          <p className={`text-xs ${swap.status === 'denied' ? 'text-red-300' : 'text-amber-300'}`}>
            {swap.managerNote}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {view === 'open' && swap.status === 'open' && (
          <button
            aria-label={`Claim swap ${swap.id}`}
            onClick={() => onClaim(swap.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2 rounded-lg transition-all active:scale-95"
          >
            <ArrowLeftRight size={14} />
            I'll Take It
          </button>
        )}
        {view === 'queue' && swap.status === 'claimed' && (
          <>
            <button
              aria-label={`Approve swap ${swap.id}`}
              onClick={() => onApprove(swap.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg transition-all active:scale-95"
            >
              <ThumbsUp size={14} /> Approve
            </button>
            <button
              aria-label={`Deny swap ${swap.id}`}
              onClick={() => onDeny(swap.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-800 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition-all active:scale-95"
            >
              <ThumbsDown size={14} /> Deny
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Post Swap Modal ───────────────────────────────────────────────────────────

function PostSwapModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [shiftId, setShiftId] = useState('')
  const [reasonCode, setReasonCode] = useState<SwapReason | ''>('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!shiftId) { setError('Please select a shift.'); return }
    if (!reasonCode) { setError('Please select a reason.'); return }
    postSwap(shiftId, reasonCode as SwapReason, notes)
    onSuccess()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ ease: 'easeOut' as const, duration: 0.2 }}
        id="post-swap-modal"
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-violet-400" />
            <h2 className="text-white font-bold">Post a Shift Swap</h2>
          </div>
          <button
            aria-label="Close post swap modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Shift picker */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">
              <Calendar size={13} className="inline mr-1" />Which shift do you need covered?
            </label>
            <div className="relative">
              <select
                id="post-shift-select"
                value={shiftId}
                onChange={e => setShiftId(e.target.value)}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2.5 pr-8 border border-slate-600 focus:outline-none focus:border-violet-500 appearance-none"
              >
                <option value="">Select a shift…</option>
                {MY_UPCOMING_SHIFTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.dateLabel} · {s.shiftType === 'day' ? '☀' : '🌙'} {s.shiftHours} · {s.unit}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Reason picker */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">
              <Shield size={13} className="inline mr-1" />Reason
            </label>
            <div className="relative">
              <select
                id="post-reason-select"
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value as SwapReason)}
                className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2.5 pr-8 border border-slate-600 focus:outline-none focus:border-violet-500 appearance-none"
              >
                <option value="">Select reason…</option>
                {(Object.entries(REASON_LABELS) as [SwapReason, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">
              Notes <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="post-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add context for colleagues…"
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-violet-500 resize-none placeholder:text-slate-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            aria-label="Submit swap request"
            onClick={handleSubmit}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            Post Swap Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Deny Modal ────────────────────────────────────────────────────────────────

function DenyModal({
  swapId,
  onClose,
  onDenied,
}: {
  swapId: string
  onClose: () => void
  onDenied: () => void
}) {
  const [reason, setReason] = useState('')

  function handleSubmit() {
    denySwap(swapId, reason || 'Denied by manager.')
    onDenied()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ ease: 'easeOut' as const, duration: 0.2 }}
        id="deny-modal"
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-400" />
            <h2 className="text-white font-bold">Deny Swap</h2>
          </div>
          <button aria-label="Close deny modal" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-slate-400 text-sm">
            Provide a reason for denying this swap request. The nurse will be notified.
          </p>
          <textarea
            id="deny-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for denial…"
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-red-500 resize-none placeholder:text-slate-500"
          />
          <button
            aria-label="Confirm deny swap"
            onClick={handleSubmit}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            Confirm Denial
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'open' | 'queue' | 'mine'

export default function Swaps() {
  const [tab, setTab] = useState<Tab>('open')
  const [swapList, setSwapList] = useState(() => ({
    open: getOpenSwaps(),
    queue: getApprovalQueue(),
    mine: getMySwaps(),
    stats: getStats(),
  }))
  const [showPost, setShowPost] = useState(false)
  const [denyTarget, setDenyTarget] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [approveSuccess, setApproveSuccess] = useState(false)
  const [denySuccess, setDenySuccess] = useState(false)
  const [postSuccess, setPostSuccess] = useState(false)

  function refresh() {
    setSwapList({
      open: getOpenSwaps(),
      queue: getApprovalQueue(),
      mine: getMySwaps(),
      stats: getStats(),
    })
  }

  function handleClaim(id: string) {
    claimSwap(id)
    refresh()
    setClaimSuccess(id)
    setTimeout(() => setClaimSuccess(null), 3000)
    setTab('mine')
  }

  function handleApprove(id: string) {
    approveSwap(id)
    refresh()
    setApproveSuccess(true)
    setTimeout(() => setApproveSuccess(false), 3000)
  }

  function handleDeny(id: string) {
    setDenyTarget(id)
  }

  function handleDenied() {
    setDenyTarget(null)
    refresh()
    setDenySuccess(true)
    setTimeout(() => setDenySuccess(false), 3000)
  }

  function handlePostSuccess() {
    setShowPost(false)
    refresh()
    setPostSuccess(true)
    setTab('mine')
    setTimeout(() => setPostSuccess(false), 3500)
  }

  const { open: openSwaps, queue, mine, stats } = swapList

  const currentList = tab === 'open' ? openSwaps : tab === 'queue' ? queue : mine

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'open',  label: 'Open Swaps',     count: stats.open },
    { id: 'queue', label: 'Approval Queue', count: stats.pending },
    { id: 'mine',  label: 'My Swaps',       count: mine.length },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight size={24} className="text-violet-400" />
            Shift Swap Board
          </h1>
          <p className="text-slate-400 text-sm mt-1">Mar 13, 2026 · ICU · Mercy General</p>
        </div>
        <button
          aria-label="Post a shift swap"
          onClick={() => setShowPost(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-900/30"
        >
          <Plus size={16} />
          Post Swap
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { id: 'stat-open',    label: 'Open',    value: stats.open,    color: 'text-sky-400' },
          { id: 'stat-pending', label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { id: 'stat-done',    label: 'Resolved',value: stats.done,    color: 'text-emerald-400' },
          { id: 'stat-urgent',  label: 'Urgent',  value: stats.urgent,  color: 'text-red-400' },
        ].map(s => (
          <div key={s.id} id={s.id} className="bg-slate-800 rounded-xl px-4 py-3 shadow">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {claimSuccess && (
          <motion.div
            key="claim"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id={`claim-success-${claimSuccess}`}
            className="mb-4 flex items-center gap-2 bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-xl"
          >
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Swap claimed! Awaiting manager approval.</span>
          </motion.div>
        )}
        {approveSuccess && (
          <motion.div
            key="approve"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id="approve-success"
            className="mb-4 flex items-center gap-2 bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-xl"
          >
            <ThumbsUp size={16} />
            <span className="text-sm font-medium">Swap approved! Both nurses have been notified.</span>
          </motion.div>
        )}
        {denySuccess && (
          <motion.div
            key="deny"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id="deny-success"
            className="mb-4 flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl"
          >
            <XCircle size={16} />
            <span className="text-sm font-medium">Swap denied. The nurse has been notified.</span>
          </motion.div>
        )}
        {postSuccess && (
          <motion.div
            key="post"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id="post-swap-success"
            className="mb-4 flex items-center gap-2 bg-violet-900/50 border border-violet-700 text-violet-300 px-4 py-3 rounded-xl"
          >
            <Star size={16} />
            <span className="text-sm font-medium">Swap request posted! Colleagues can now claim it.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-5" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            id={`swaps-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Urgent banner */}
      {tab === 'open' && stats.urgent > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-2.5 rounded-xl">
          <AlertTriangle size={15} className="shrink-0" />
          <p className="text-sm">
            <strong>{stats.urgent} urgent</strong> swap{stats.urgent > 1 ? 's' : ''} with less than 12 hours until shift.
            Colleagues need coverage now.
          </p>
        </div>
      )}

      {/* Approval-queue context tip */}
      {tab === 'queue' && queue.length > 0 && (
        <div className="mb-4 flex items-start gap-2 bg-slate-700/40 border border-slate-600/40 px-4 py-2.5 rounded-xl">
          <Shield size={14} className="text-violet-400 mt-0.5 shrink-0" />
          <p className="text-slate-300 text-xs">
            Review credential and overtime checks before approving. Warnings are advisory — you can still approve with oversight.
          </p>
        </div>
      )}

      {/* Empty state */}
      {currentList.length === 0 && (
        <div className="text-center py-16">
          {tab === 'open' ? (
            <>
              <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No open swap requests</p>
              <p className="text-slate-500 text-sm mt-1">All shifts are covered. Need to post one?</p>
            </>
          ) : tab === 'queue' ? (
            <>
              <div className="w-14 h-14 bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-emerald-500" />
              </div>
              <p className="text-slate-400 font-medium">Approval queue is clear</p>
              <p className="text-slate-500 text-sm mt-1">No swaps pending your review.</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No swaps yet</p>
              <p className="text-slate-500 text-sm mt-1">Post a swap or claim one from Open Swaps.</p>
            </>
          )}
        </div>
      )}

      {/* Swap cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {currentList.map(swap => (
            <SwapCard
              key={swap.id}
              swap={swap}
              view={tab}
              onClaim={handleClaim}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Post Swap Modal */}
      <AnimatePresence>
        {showPost && (
          <PostSwapModal
            onClose={() => setShowPost(false)}
            onSuccess={handlePostSuccess}
          />
        )}
      </AnimatePresence>

      {/* Deny Modal */}
      <AnimatePresence>
        {denyTarget && (
          <DenyModal
            swapId={denyTarget}
            onClose={() => setDenyTarget(null)}
            onDenied={handleDenied}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
