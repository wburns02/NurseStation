import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, AlertTriangle, Clock, CheckCircle2, Users, ArrowLeftRight,
  Bell, Zap, X, TrendingDown, Send,
  Shield, Star, Check, Loader2, History, UserCheck,
} from 'lucide-react'
import {
  getOpenShifts, getSwapRequests, getBoardStats, postShiftToBoard,
  assignShift, sendShiftAlert, hasAlertSent, approveSwap, declineSwap,
  FILL_HISTORY, URGENCY_META, SHIFT_META, METHOD_META,
  type OpenShift, type SwapRequest, type StaffSuggestion, type UrgencyLevel,
} from '../data/shiftBoardData'

// ─── Countdown display ────────────────────────────────────────────────────────

function formatCountdown(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// ─── Reliability bar ──────────────────────────────────────────────────────────

function ReliabilityBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' as const, delay: 0.1 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-600 w-7 text-right">{score}%</span>
    </div>
  )
}

// ─── Urgency badge ────────────────────────────────────────────────────────────

function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  const meta = URGENCY_META[level]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

// ─── Assign Panel (slides in from right) ─────────────────────────────────────

interface AssignPanelProps {
  shift: OpenShift | null
  onClose: () => void
  onAssigned: (shiftId: string, staff: StaffSuggestion) => void
}
function AssignPanel({ shift, onClose, onAssigned }: AssignPanelProps) {
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignedId, setAssignedId] = useState<string | null>(null)

  // Reset when shift changes
  useEffect(() => {
    setAssigningId(null)
    setAssignedId(null)
  }, [shift?.id])

  function handleAssign(staff: StaffSuggestion) {
    setAssigningId(staff.id)
    setTimeout(() => {
      assignShift(shift!.id, staff)
      setAssigningId(null)
      setAssignedId(staff.id)
      setTimeout(() => {
        onAssigned(shift!.id, staff)
      }, 1_200)
    }, 1_000)
  }

  return (
    <AnimatePresence>
      {shift && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-30"
          />
          {/* Panel */}
          <motion.div
            key="panel"
            id="assign-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
            className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            {/* Panel header */}
            <div className={`${shift.unitAccent} px-5 py-4`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-semibold uppercase opacity-80">Direct Assign</span>
                <button
                  onClick={onClose}
                  aria-label="Close assign panel"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {shift.unit} · {shift.shiftTime}
              </h2>
              <p className="text-white/80 text-sm">{shift.date} · {shift.hours}h shift</p>
            </div>

            {/* Shift summary */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <UrgencyBadge level={shift.urgency} />
                {shift.urgency === 'critical' && (
                  <span className="text-red-600 text-xs font-bold">
                    ⏰ {formatCountdown(shift.hoursUntil)} until start
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">{shift.reason}</p>
              <p className="text-xs text-slate-500 mt-0.5">Required: {shift.requiredRole}</p>
            </div>

            {/* Suggestions */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
                {shift.suggestions.length} Qualified Staff Available
              </h3>
              <div className="space-y-3">
                {shift.suggestions.map((staff, rank) => {
                  const isAssigning = assigningId === staff.id
                  const isDone = assignedId === staff.id
                  const isDisabled = !!assigningId || !!assignedId

                  return (
                    <motion.div
                      key={staff.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: rank * 0.05, ease: 'easeOut' as const }}
                      data-id={`suggestion-${staff.id}`}
                      className={`rounded-xl border p-4 transition-all ${
                        isDone    ? 'border-emerald-300 bg-emerald-50' :
                        rank === 0 ? 'border-violet-200 bg-violet-50' :
                        'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                          rank === 0 ? 'bg-violet-600' : 'bg-slate-400'
                        }`}>
                          {staff.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{staff.name}</p>
                            {rank === 0 && (
                              <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full shrink-0">
                                Best Match
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{staff.role}</p>
                          <p className="text-xs text-slate-500 mt-0.5 italic">{staff.availabilityNote}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Reliability</span>
                          <span className="font-semibold text-slate-700">{staff.reliabilityScore}%</span>
                        </div>
                        <ReliabilityBar score={staff.reliabilityScore} />
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>Hours this week</span>
                          <span className={`font-semibold ${staff.hoursThisWeek >= 40 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {staff.hoursThisWeek}h {staff.hoursThisWeek >= 40 ? '(OT)' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>OT premium</span>
                          <span className="font-semibold text-slate-700">+${staff.overtimeCost}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {staff.certifications.map(cert => (
                          <span key={cert} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {cert}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleAssign(staff)}
                        disabled={isDisabled}
                        aria-label={`Assign ${staff.name} to shift ${shift.id}`}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isDone     ? 'bg-emerald-500 text-white' :
                          isAssigning ? 'bg-slate-200 text-slate-400 cursor-wait' :
                          isDisabled  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
                          rank === 0  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' :
                          'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        {isDone      ? <><Check size={14} /> Assigned!</> :
                         isAssigning ? <><Loader2 size={14} className="animate-spin" /> Assigning…</> :
                         <><UserCheck size={14} /> Assign {staff.name.split(' ')[0]}</>}
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {assignedId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' as const }}
                  id="assign-success-banner"
                  className="mt-4 rounded-xl bg-emerald-100 border border-emerald-300 p-4 text-center"
                >
                  <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-700 text-sm">Shift Filled!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    SMS & push notification sent to {shift.suggestions.find(s => s.id === assignedId)?.name}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Open shift card ──────────────────────────────────────────────────────────

type PostState = 'idle' | 'posting' | 'posted'
type AlertState = 'idle' | 'sending' | 'sent'

interface OpenShiftCardProps {
  shift: OpenShift
  onDirectAssign: (shift: OpenShift) => void
  onFilled: () => void
}
function OpenShiftCard({ shift, onDirectAssign, onFilled: _onFilled }: OpenShiftCardProps) {
  const [postState, setPostState] = useState<PostState>(
    shift.status === 'posted' || shift.status === 'claimed' ? 'posted' : 'idle'
  )
  const [alertState, setAlertState] = useState<AlertState>(
    hasAlertSent(shift.id) ? 'sent' : 'idle'
  )
  const [localStatus, setLocalStatus] = useState(shift.status)
  const meta = URGENCY_META[shift.urgency]
  const isFilled = localStatus === 'filled'

  function handlePost() {
    setPostState('posting')
    setTimeout(() => {
      postShiftToBoard(shift.id)
      setPostState('posted')
    }, 700)
  }

  function handleAlert() {
    setAlertState('sending')
    setTimeout(() => {
      sendShiftAlert(shift.id)
      setAlertState('sent')
    }, 800)
  }

  // Listen for fill completion
  useEffect(() => {
    if (shift.status === 'filled') {
      setLocalStatus('filled')
    }
  }, [shift.status])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isFilled ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' as const }}
      data-id={`open-shift-${shift.id}`}
      className={`bg-white rounded-xl border-l-4 border border-slate-200 p-4 shadow-sm transition-all ${meta.border} ${
        isFilled ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Unit badge */}
        <div className={`${shift.unitAccent} text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0 text-center min-w-[44px]`}>
          {shift.unitShort}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <UrgencyBadge level={shift.urgency} />
            {isFilled ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Check size={10} /> Filled
              </span>
            ) : localStatus === 'posted' ? (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                Posted to Board
              </span>
            ) : null}
            {shift.urgency === 'critical' && !isFilled && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <Clock size={11} className="animate-pulse" />
                {formatCountdown(shift.hoursUntil)} until start
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-900">
            {shift.unit} · {SHIFT_META[shift.shift].icon} {SHIFT_META[shift.shift].label} · {shift.shiftTime}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{shift.date} · {shift.hours}h · {shift.requiredRole}</p>
          <p className="text-xs text-slate-500 mt-1 italic">{shift.reason}</p>

          {/* Suggestion avatars */}
          {!isFilled && shift.suggestions.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-1.5">
                {shift.suggestions.slice(0, 3).map(s => (
                  <div key={s.id} title={s.name}
                    className="w-6 h-6 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    {s.initials}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {shift.suggestions.length} qualified staff available
              </span>
            </div>
          )}

          {isFilled && shift.claimedBy && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                {shift.claimedBy.initials}
              </div>
              <span className="text-xs text-emerald-700 font-medium">
                Filled by {shift.claimedBy.name}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isFilled && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onDirectAssign(shift)}
              aria-label={`Direct assign shift ${shift.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            >
              <UserCheck size={12} />
              Direct Assign
            </button>

            <button
              onClick={handlePost}
              disabled={postState !== 'idle'}
              aria-label={`Post shift ${shift.id} to board`}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap border ${
                postState === 'posted'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-default'
                  : postState === 'posting'
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              {postState === 'posting' ? <Loader2 size={11} className="animate-spin" /> :
               postState === 'posted'  ? <Check size={11} /> :
               <Layers size={11} />}
              {postState === 'posted' ? 'Posted' : 'Post to Board'}
            </button>

            <button
              onClick={handleAlert}
              disabled={alertState !== 'idle'}
              aria-label={`Send alert for shift ${shift.id}`}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap border ${
                alertState === 'sent'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-default'
                  : alertState === 'sending'
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              {alertState === 'sending' ? <Loader2 size={11} className="animate-spin" /> :
               alertState === 'sent'    ? <Check size={11} /> :
               <Bell size={11} />}
              {alertState === 'sent' ? 'Alert Sent' : 'Send Alert'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Swap request card ────────────────────────────────────────────────────────

type SwapActionState = 'idle' | 'approving' | 'declining' | 'done'

interface SwapCardProps {
  swap: SwapRequest
  onAction: () => void
}
function SwapCard({ swap, onAction }: SwapCardProps) {
  const [actionState, setActionState] = useState<SwapActionState>('idle')
  const [result, setResult] = useState<'approved' | 'declined' | null>(null)
  const [declineNote, setDeclineNote] = useState('')
  const [showDecline, setShowDecline] = useState(false)

  function handleApprove() {
    setActionState('approving')
    setTimeout(() => {
      approveSwap(swap.id)
      setResult('approved')
      setActionState('done')
      setTimeout(onAction, 1_000)
    }, 900)
  }

  function handleDecline() {
    if (!showDecline) { setShowDecline(true); return }
    setActionState('declining')
    setTimeout(() => {
      declineSwap(swap.id)
      setResult('declined')
      setActionState('done')
      setTimeout(onAction, 1_000)
    }, 700)
  }

  const impactColor = swap.coverageImpact === 'none' ? 'text-emerald-600' :
                      swap.coverageImpact === 'minor' ? 'text-amber-600' : 'text-red-600'
  const impactLabel = swap.coverageImpact === 'none' ? 'No coverage impact' :
                      swap.coverageImpact === 'minor' ? 'Minor coverage impact' : 'Coverage risk'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' as const }}
      data-id={`swap-${swap.id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
    >
      {/* Swap visualization */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {swap.requesterInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{swap.requesterName}</p>
              <p className="text-[11px] text-slate-500">{swap.requesterShift}</p>
            </div>
          </div>
        </div>
        <ArrowLeftRight size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {swap.offererInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{swap.offererName}</p>
              <p className="text-[11px] text-slate-500">{swap.offererShift}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs text-slate-600 flex-1">{swap.reason}</p>
        <span className={`text-[11px] font-medium ${impactColor} flex items-center gap-1 shrink-0`}>
          <Shield size={11} />
          {impactLabel}
        </span>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">Submitted {swap.submittedAt}</p>

      <AnimatePresence mode="wait">
        {actionState === 'done' ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' as const }}
            className={`flex items-center gap-2 text-sm font-semibold py-1.5 rounded-lg justify-center ${
              result === 'approved' ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {result === 'approved' ? <><Check size={15} /> Swap approved! Notifications sent.</> : <><X size={15} /> Swap declined.</>}
          </motion.div>
        ) : (
          <motion.div key="actions" layout className="space-y-2">
            {showDecline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
              >
                <input
                  type="text"
                  value={declineNote}
                  onChange={e => setDeclineNote(e.target.value)}
                  placeholder="Optional: reason for declining…"
                  aria-label="Decline reason"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
                />
              </motion.div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={actionState !== 'idle'}
                aria-label={`Approve swap ${swap.id}`}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all ${
                  actionState === 'approving'
                    ? 'bg-slate-200 text-slate-400 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {actionState === 'approving' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Approve Swap
              </button>
              <button
                onClick={handleDecline}
                disabled={actionState !== 'idle'}
                aria-label={showDecline ? `Confirm decline swap ${swap.id}` : `Decline swap ${swap.id}`}
                className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                  actionState === 'declining'
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-wait'
                    : showDecline
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-red-300 hover:text-red-600'
                }`}
              >
                {actionState === 'declining' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                {showDecline ? 'Confirm' : 'Decline'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'urgent' | 'posted' | 'filled'

export default function ShiftBoard() {
  const [openShifts, setOpenShifts] = useState(getOpenShifts)
  const [swaps, setSwaps] = useState(getSwapRequests)
  const [stats, setStats] = useState(getBoardStats)
  const [selectedShift, setSelectedShift] = useState<OpenShift | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showHistory, setShowHistory] = useState(false)

  const refresh = useCallback(() => {
    setOpenShifts(getOpenShifts())
    setSwaps(getSwapRequests())
    setStats(getBoardStats())
  }, [])

  function handleAssigned(_shiftId: string, _staff: StaffSuggestion) {
    refresh()
    setSelectedShift(null)
  }

  const filteredShifts = openShifts.filter(s => {
    if (filter === 'urgent') return (s.urgency === 'critical' || s.urgency === 'high') && s.status !== 'filled'
    if (filter === 'posted') return s.status === 'posted' || s.status === 'claimed'
    if (filter === 'filled') return s.status === 'filled'
    return true
  })

  const criticalShift = openShifts.find(s => s.urgency === 'critical' && s.status !== 'filled')

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',    label: 'All Shifts', count: openShifts.length },
    { key: 'urgent', label: 'Urgent',     count: openShifts.filter(s => (s.urgency === 'critical' || s.urgency === 'high') && s.status !== 'filled').length },
    { key: 'posted', label: 'On Board',   count: openShifts.filter(s => s.status === 'posted' || s.status === 'claimed').length },
    { key: 'filled', label: 'Filled',     count: openShifts.filter(s => s.status === 'filled').length },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers size={22} className="text-violet-600" />
              Open Shift Board
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Self-service pickups, swaps, and direct assignments
            </p>
          </div>
          <button
            onClick={() => setShowHistory(v => !v)}
            aria-label="Toggle fill history"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-violet-700 bg-slate-100 hover:bg-violet-50 px-3 py-2 rounded-lg font-medium transition-all"
          >
            <History size={15} />
            Fill History
          </button>
        </div>
      </div>

      <div className="p-6 max-w-screen-lg mx-auto space-y-6">

        {/* Critical alert banner */}
        <AnimatePresence>
          {criticalShift && (
            <motion.div
              key="critical-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              id="critical-banner"
              className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-red-200"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base leading-tight">
                  Critical gap: {criticalShift.unit} · {criticalShift.shiftTime} tonight
                </p>
                <p className="text-red-200 text-sm mt-0.5">
                  ⏰ {formatCountdown(criticalShift.hoursUntil)} until start · {criticalShift.suggestions.length} staff available · {criticalShift.reason}
                </p>
              </div>
              <button
                onClick={() => { setSelectedShift(criticalShift); setFilter('all') }}
                aria-label="Fill critical shift now"
                className="flex items-center gap-1.5 bg-white text-red-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Zap size={14} />
                Fill Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4" id="stats-row">
          {[
            { id: 'stats-open',     icon: Layers,      label: 'Open Shifts',      value: stats.openCount,           color: 'text-slate-700',   bg: 'bg-white',       border: 'border-slate-200' },
            { id: 'stats-pending',  icon: ArrowLeftRight,label: 'Swap Requests',  value: stats.pendingSwaps,        color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
            { id: 'stats-filled',   icon: CheckCircle2,label: 'Filled This Week', value: stats.filledThisWeek,      color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
            { id: 'stats-avg-fill', icon: TrendingDown, label: 'Avg Fill Time',   value: `${stats.avgFillMinutes}min`, color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200' },
          ].map(({ id, icon: Icon, label, value, color, bg, border }) => (
            <div key={id} id={id} className={`${bg} rounded-xl border ${border} p-4 flex items-center gap-3`}>
              <Icon size={20} className={color} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fill history panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              id="fill-history-panel"
              className="bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden shadow-sm"
            >
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <History size={15} className="text-slate-500" />
                Recent Fill History
              </h3>
              <div className="space-y-2">
                {FILL_HISTORY.map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      {item.staffInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.staffName}</p>
                      <p className="text-xs text-slate-500">{item.unit} · {item.shift}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${METHOD_META[item.method].bg} ${METHOD_META[item.method].color}`}>
                      {METHOD_META[item.method].label}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">{item.fillTimeMinutes}min</p>
                      <p className="text-[11px] text-slate-400">{item.filledAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open Shifts section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers size={16} className="text-violet-600" />
              Open Shifts
              {stats.criticalCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.criticalCount} critical
                </span>
              )}
            </h2>
            {/* Filter tabs */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  aria-label={`Filter by ${tab.label}`}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                    filter === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                      filter === tab.key ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredShifts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl border border-slate-200 p-8 text-center"
                >
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No shifts in this view</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filter === 'filled' ? 'No filled shifts yet this week' : 'All shifts are covered — nice work!'}
                  </p>
                </motion.div>
              ) : (
                filteredShifts.map(shift => (
                  <OpenShiftCard
                    key={shift.id}
                    shift={shift}
                    onDirectAssign={s => setSelectedShift(s)}
                    onFilled={refresh}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Swap Requests section */}
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-3">
            <ArrowLeftRight size={16} className="text-blue-600" />
            Swap Requests
            {swaps.filter(s => s.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {swaps.filter(s => s.status === 'pending').length} pending
              </span>
            )}
          </h2>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {swaps.filter(s => s.status === 'pending').map(swap => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  onAction={refresh}
                />
              ))}
              {swaps.filter(s => s.status === 'pending').length === 0 && (
                <motion.div
                  key="no-swaps"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl border border-slate-200 p-6 text-center"
                >
                  <Users size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No pending swap requests</p>
                  <p className="text-xs text-slate-400 mt-1">All swap requests have been resolved</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* How it works — first-run guidance */}
        <div id="how-it-works" className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200 p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <Star size={15} className="text-violet-600" />
            How the Shift Board Works
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Layers,    step: '1', title: 'Post to Board',    desc: 'Open shifts are visible to all eligible staff, who can self-claim in the app.' },
              { icon: UserCheck, step: '2', title: 'Direct Assign',    desc: 'Pick from AI-ranked suggestions — best reliability, lowest OT cost, right certifications.' },
              { icon: Send,      step: '3', title: 'Send Alert',       desc: 'Push + SMS to all qualified available staff. Average fill time: 23 minutes.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assign panel */}
      <AssignPanel
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
        onAssigned={handleAssigned}
      />
    </div>
  )
}
