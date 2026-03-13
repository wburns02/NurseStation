import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, Clock, CheckCircle, AlertTriangle, ChevronDown,
  X, Star, Zap, TrendingUp, BadgeCheck, Trophy, Filter,
  ChevronRight,
} from 'lucide-react'
import {
  getActiveCycle, getCycles, getCycle, getMyBidsForCycle,
  getCycleStats, placeBid, withdrawBid, publishSchedule,
  CURRENT_USER,
  type ScheduleSlot, type BidCycle, type BidStatus,
} from '../data/selfScheduleData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillRate(slot: ScheduleSlot) {
  return Math.min(slot.bids.length / slot.needed, 1)
}
function slotHealth(slot: ScheduleSlot): 'empty' | 'under' | 'good' | 'over' {
  if (slot.bids.length === 0)               return 'empty'
  if (slot.bids.length < slot.needed)       return 'under'
  if (slot.bids.length === slot.needed)     return 'good'
  return 'over'
}
function healthColor(h: ReturnType<typeof slotHealth>) {
  return h === 'empty' ? 'text-red-400'
       : h === 'under' ? 'text-amber-400'
       : h === 'good'  ? 'text-emerald-400'
       : 'text-orange-400'
}
function healthBg(h: ReturnType<typeof slotHealth>) {
  return h === 'empty' ? 'bg-red-900/30 border-red-800/40'
       : h === 'under' ? 'bg-amber-900/20 border-amber-800/30'
       : h === 'good'  ? 'bg-emerald-900/20 border-emerald-800/30'
       : 'bg-orange-900/20 border-orange-800/30'
}
function myBidOnSlot(slot: ScheduleSlot) {
  return slot.bids.find(b => b.nurseId === CURRENT_USER.id)
}
function bidStatusLabel(s: BidStatus) {
  return s === 'confirmed' ? 'Confirmed' : s === 'waitlisted' ? 'Waitlisted'
       : s === 'conflict'  ? 'Conflict'  : 'Bid placed'
}
function bidStatusColor(s: BidStatus) {
  return s === 'confirmed'  ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
       : s === 'waitlisted' ? 'bg-slate-700 text-slate-300 border-slate-600'
       : s === 'conflict'   ? 'bg-orange-900/50 text-orange-300 border-orange-700'
       : 'bg-violet-900/50 text-violet-300 border-violet-700'
}

// ── Avatars row ───────────────────────────────────────────────────────────────

function BidAvatars({ slot }: { slot: ScheduleSlot }) {
  const show = slot.bids.slice(0, 4)
  const extra = slot.bids.length - 4
  return (
    <div className="flex items-center -space-x-1.5">
      {show.map(b => (
        <div
          key={b.nurseId}
          title={`${b.nurseName} (priority ${b.priority})`}
          className={`w-6 h-6 rounded-full bg-gradient-to-br ${b.nurseColor} border-2 border-slate-800 flex items-center justify-center text-[9px] text-white font-bold`}
        >
          {b.nurseInitials}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-[9px] text-white font-bold">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ── Slot card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  view,
  cycleStatus,
  onBid,
  onWithdraw,
}: {
  slot: ScheduleSlot
  view: 'available' | 'mine' | 'manager'
  cycleStatus: BidCycle['status']
  onBid: (slot: ScheduleSlot) => void
  onWithdraw: (slotId: string) => void
}) {
  const health = slotHealth(slot)
  const myBid  = myBidOnSlot(slot)
  const shiftIcon = slot.shiftType === 'day' ? '☀' : slot.shiftType === 'night' ? '🌙' : '🌅'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ ease: 'easeOut' as const, duration: 0.18 }}
      data-id={`slot-card-${slot.id}`}
      className={`border rounded-xl p-4 ${healthBg(health)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{slot.dateLabel}</span>
            <span className="text-slate-400 text-xs">{slot.dayOfWeek}</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
              slot.shiftType === 'day' ? 'bg-amber-900/40 text-amber-300' : 'bg-indigo-900/50 text-indigo-300'
            }`}>
              {shiftIcon} {slot.shiftType === 'day' ? 'Day' : slot.shiftType === 'night' ? 'Night' : 'Eve'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-slate-400 text-xs">{slot.unit}</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-400 text-xs">{slot.shiftHours}</span>
          </div>
        </div>
        {/* Health indicator */}
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${healthColor(health)}`}>
            {slot.bids.length}/{slot.needed}
          </p>
          <p className="text-slate-500 text-[10px]">bids</p>
        </div>
      </div>

      {/* Fill bar */}
      <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(fillRate(slot) * 100, 100)}%` }}
          transition={{ ease: 'easeOut' as const, duration: 0.6, delay: 0.1 }}
          className={`h-full rounded-full ${
            health === 'empty' ? 'bg-red-500' :
            health === 'under' ? 'bg-amber-500' :
            health === 'good'  ? 'bg-emerald-500' :
            'bg-orange-500'
          }`}
        />
      </div>

      {/* Bidders */}
      {slot.bids.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <BidAvatars slot={slot} />
          {view === 'manager' && health === 'over' && (
            <span className="text-[10px] text-orange-300 font-medium">
              {slot.bids.length - slot.needed} conflict{slot.bids.length - slot.needed > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Manager view: list all bids with seniority */}
      {view === 'manager' && slot.bids.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {[...slot.bids].sort((a, b) => b.seniorityYears - a.seniorityYears).map((bid, i) => (
            <div key={bid.nurseId} className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] w-4">{i + 1}.</span>
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${bid.nurseColor} flex items-center justify-center text-[9px] text-white font-bold`}>
                {bid.nurseInitials}
              </div>
              <span className="text-slate-300 text-xs flex-1">{bid.nurseName}</span>
              <span className="text-slate-500 text-[10px]">{bid.seniorityYears}yr</span>
              <span className="text-slate-500 text-[10px]">P{bid.priority}</span>
              {i < slot.needed ? (
                <CheckCircle size={11} className="text-emerald-400" />
              ) : (
                <X size={11} className="text-red-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* My bid status */}
      {myBid && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bidStatusColor(myBid.status)}`}>
            {bidStatusLabel(myBid.status)} · Priority {myBid.priority}
          </span>
        </div>
      )}

      {/* Actions */}
      {cycleStatus === 'open' && (
        <div className="mt-3 flex gap-2">
          {myBid ? (
            <button
              aria-label={`Withdraw bid ${slot.id}`}
              onClick={() => onWithdraw(slot.id)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-700 px-3 py-1.5 rounded-lg transition-all"
            >
              <X size={12} /> Withdraw
            </button>
          ) : (
            <button
              aria-label={`Place bid ${slot.id}`}
              onClick={() => onBid(slot)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-all active:scale-95"
            >
              <Star size={12} /> Place Bid
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Bid modal ─────────────────────────────────────────────────────────────────

function BidModal({
  slot,
  onClose,
  onSubmit,
}: {
  slot: ScheduleSlot
  onClose: () => void
  onSubmit: (priority: 1 | 2 | 3) => void
}) {
  const [priority, setPriority] = useState<1 | 2 | 3>(1)
  const shiftIcon = slot.shiftType === 'day' ? '☀' : '🌙'
  const health = slotHealth(slot)

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
        id="bid-modal"
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Star size={17} className="text-violet-400" />
            <h2 className="text-white font-bold">Place Bid</h2>
          </div>
          <button aria-label="Close bid modal" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Shift summary */}
          <div className="bg-slate-700/60 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{slot.dateLabel}</span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                slot.shiftType === 'day' ? 'bg-amber-900/40 text-amber-300' : 'bg-indigo-900/50 text-indigo-300'
              }`}>{shiftIcon} {slot.shiftType}</span>
            </div>
            <p className="text-slate-400 text-xs">{slot.unit} · {slot.role} · {slot.shiftHours}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-medium ${healthColor(health)}`}>
                {slot.bids.length}/{slot.needed} bids
              </span>
              {health === 'empty' && <span className="text-xs text-red-400">— no bids yet</span>}
              {health === 'under' && <span className="text-xs text-amber-400">— needs more</span>}
              {health === 'good'  && <span className="text-xs text-emerald-400">— just filled</span>}
              {health === 'over'  && <span className="text-xs text-orange-400">— oversubscribed</span>}
            </div>
          </div>

          {/* Priority selection */}
          <div>
            <p className="text-slate-300 text-sm font-medium mb-2">How much do you want this shift?</p>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map(p => (
                <button
                  key={p}
                  data-id={`priority-btn-${p}`}
                  onClick={() => setPriority(p)}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                    priority === p
                      ? 'bg-violet-700 border-violet-500 text-white'
                      : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="text-lg">{p === 1 ? '⭐' : p === 2 ? '👍' : '🤷'}</span>
                  <span className="text-xs font-semibold mt-1">{p === 1 ? '1st Choice' : p === 2 ? '2nd Choice' : '3rd Choice'}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{p === 1 ? 'Really want it' : p === 2 ? 'Works for me' : 'If needed'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seniority note */}
          <div className="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2">
            <Trophy size={13} className="text-amber-400 shrink-0" />
            <p className="text-slate-400 text-xs">Conflicts resolved by seniority. You have <strong className="text-white">{CURRENT_USER.seniorityYears} years</strong>.</p>
          </div>

          <button
            aria-label="Confirm bid"
            onClick={() => onSubmit(priority)}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            Confirm Bid — Priority {priority}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Countdown display ─────────────────────────────────────────────────────────

function Countdown({ hours }: { hours: number }) {
  const [secs, setSecs] = useState(hours * 3600)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [hours])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span id="bid-countdown" className="font-mono text-amber-300 font-bold">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type View = 'available' | 'mine' | 'manager'
type FilterUnit = 'all' | string

export default function SelfSchedule() {
  const [cycleId, setCycleId] = useState(() => getActiveCycle().id)
  const [view, setView] = useState<View>('available')
  const [filterUnit, setFilterUnit] = useState<FilterUnit>('all')
  const [filterShift, setFilterShift] = useState<'all' | 'day' | 'night'>('all')
  const [bidTarget, setBidTarget] = useState<ScheduleSlot | null>(null)
  const [publishConfirm, setPublishConfirm] = useState(false)
  const [toast, setToast] = useState<{ type: 'bid' | 'withdraw' | 'publish'; msg: string } | null>(null)
  const [_tick, setTick] = useState(0) // force re-renders after mutations

  function refresh() { setTick(t => t + 1) }

  const cycle  = getCycle(cycleId) ?? getActiveCycle()
  const stats  = getCycleStats(cycleId)
  const cycles = getCycles()
  const units  = [...new Set(cycle.slots.map(s => s.unit))]

  let displaySlots = cycle.slots
  if (view === 'mine') displaySlots = getMyBidsForCycle(cycleId)
  if (filterUnit !== 'all') displaySlots = displaySlots.filter(s => s.unit === filterUnit)
  if (filterShift !== 'all') displaySlots = displaySlots.filter(s => s.shiftType === filterShift)

  function showToast(type: typeof toast extends null ? never : NonNullable<typeof toast>['type'], msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function handleBidSubmit(priority: 1 | 2 | 3) {
    if (!bidTarget) return
    placeBid(cycleId, bidTarget.id, priority)
    setBidTarget(null)
    refresh()
    showToast('bid', `Bid placed on ${bidTarget.dateLabel} · ${bidTarget.unit} (Priority ${priority})`)
  }

  function handleWithdraw(slotId: string) {
    withdrawBid(cycleId, slotId)
    refresh()
    showToast('withdraw', 'Bid withdrawn.')
  }

  function handlePublish() {
    publishSchedule(cycleId)
    setPublishConfirm(false)
    refresh()
    showToast('publish', 'Schedule published! All nurses have been notified.')
  }

  const views: { id: View; label: string; count?: number }[] = [
    { id: 'available', label: 'Available Slots', count: cycle.slots.length },
    { id: 'mine',      label: 'My Bids',         count: stats.myBids },
    { id: 'manager',   label: 'Manager Queue',   count: stats.conflicts },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck size={24} className="text-violet-400" />
            Self-Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Bid on open shifts · conflicts resolved by seniority</p>
        </div>

        {/* Cycle picker */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              id="cycle-picker"
              value={cycleId}
              onChange={e => { setCycleId(e.target.value); setFilterUnit('all') }}
              className="bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {cycle.status === 'open' && (
            <button
              aria-label="Publish schedule"
              onClick={() => setPublishConfirm(true)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
            >
              <BadgeCheck size={15} />
              Publish
            </button>
          )}
        </div>
      </div>

      {/* ── Bid window banner ────────────────────────────────────────────────── */}
      {cycle.status === 'open' && (
        <div className="mb-5 flex items-center gap-3 bg-amber-900/25 border border-amber-800/40 rounded-xl px-4 py-3">
          <Clock size={16} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="text-amber-300 text-sm font-medium">Bidding window closes in </span>
            <Countdown hours={cycle.hoursRemaining} />
          </div>
          <span className="text-amber-400/60 text-xs hidden sm:block">
            Opened {cycle.windowOpens} · Closes {cycle.windowCloses}
          </span>
        </div>
      )}
      {cycle.status === 'published' && (
        <div className="mb-5 flex items-center gap-2 bg-emerald-900/25 border border-emerald-800/40 rounded-xl px-4 py-3">
          <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
          <span className="text-emerald-300 text-sm font-medium" id="published-banner">
            Schedule published — nurses have been notified.
          </span>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { id: 'stat-total',     label: 'Total Slots',  value: stats.total,     icon: CalendarCheck, color: 'text-slate-300' },
          { id: 'stat-filled',    label: 'Covered',      value: stats.filled,    icon: CheckCircle,   color: 'text-emerald-400' },
          { id: 'stat-unfilled',  label: 'Unfilled',     value: stats.unfilled,  icon: AlertTriangle, color: 'text-amber-400' },
          { id: 'stat-conflicts', label: 'Conflicts',    value: stats.conflicts, icon: Zap,           color: 'text-orange-400' },
          { id: 'stat-my-bids',   label: 'My Bids',      value: stats.myBids,    icon: Star,          color: 'text-violet-400' },
        ].map(s => (
          <div key={s.id} id={s.id} className="bg-slate-800 rounded-xl px-3 py-3 shadow">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={12} className={s.color} />
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            id={`toast-${toast.type}`}
            className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
              toast.type === 'bid'      ? 'bg-violet-900/50 border-violet-700 text-violet-300' :
              toast.type === 'withdraw' ? 'bg-slate-800 border-slate-600 text-slate-300' :
              'bg-emerald-900/50 border-emerald-700 text-emerald-300'
            }`}
          >
            {toast.type === 'bid' ? <Star size={15} /> : toast.type === 'publish' ? <BadgeCheck size={15} /> : <X size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View tabs ─────────────────────────────────────────────────────────  */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-4" role="tablist">
        {views.map(v => (
          <button
            key={v.id}
            id={`tab-${v.id}`}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.id
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {v.label}
            {typeof v.count === 'number' && v.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                view === v.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {v.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} className="text-slate-500" />
        {/* Unit filter */}
        <div className="flex gap-1 flex-wrap">
          {['all', ...units].map(u => (
            <button
              key={u}
              aria-label={`Filter unit ${u}`}
              onClick={() => setFilterUnit(u)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                filterUnit === u
                  ? 'bg-violet-700 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {u === 'all' ? 'All Units' : u}
            </button>
          ))}
        </div>
        <span className="text-slate-700">|</span>
        {/* Shift filter */}
        {(['all', 'day', 'night'] as const).map(s => (
          <button
            key={s}
            aria-label={`Filter shift ${s}`}
            onClick={() => setFilterShift(s)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
              filterShift === s
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All Shifts' : s === 'day' ? '☀ Day' : '🌙 Night'}
          </button>
        ))}
      </div>

      {/* ── Manager conflict alert ────────────────────────────────────────────── */}
      {view === 'manager' && stats.conflicts > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-orange-900/25 border border-orange-800/40 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-orange-400 shrink-0" />
          <p className="text-orange-300 text-sm">
            <strong>{stats.conflicts}</strong> slot{stats.conflicts > 1 ? 's' : ''} oversubscribed.
            Conflicts will be resolved by seniority when you publish.
          </p>
        </div>
      )}

      {/* ── Unfilled slots alert ──────────────────────────────────────────────── */}
      {view === 'manager' && stats.unfilled > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-red-900/25 border border-red-800/40 rounded-xl px-4 py-3">
          <Zap size={15} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">
            <strong>{stats.unfilled}</strong> position{stats.unfilled > 1 ? 's' : ''} still unfilled.
            Consider posting to the open shift board after publishing.
          </p>
          <ChevronRight size={14} className="text-red-400 ml-auto" />
        </div>
      )}

      {/* ── Legend (available tab) ────────────────────────────────────────────── */}
      {view === 'available' && (
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> No bids</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Needs more</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Filled</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Oversubscribed</span>
        </div>
      )}

      {/* ── Progress summary (available tab) ─────────────────────────────────── */}
      {view === 'available' && (
        <div className="mb-5 flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
          <TrendingUp size={15} className="text-slate-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">Overall fill rate</span>
              <span className="text-white text-xs font-semibold">{stats.filled}/{stats.total}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.filled / stats.total) * 100 : 0}%` }}
                transition={{ ease: 'easeOut' as const, duration: 0.8, delay: 0.2 }}
                className="h-full bg-violet-500 rounded-full"
              />
            </div>
          </div>
          <span className="text-violet-300 text-sm font-bold">
            {stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0}%
          </span>
        </div>
      )}

      {/* ── Slots grid ───────────────────────────────────────────────────────── */}
      {displaySlots.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {view === 'mine' ? <Star size={24} className="text-slate-500" /> : <CalendarCheck size={24} className="text-slate-500" />}
          </div>
          <p className="text-slate-400 font-medium">
            {view === 'mine' ? "You haven't placed any bids yet" :
             view === 'manager' ? 'No slots match these filters' :
             'No slots match these filters'}
          </p>
          {view === 'mine' && (
            <button
              onClick={() => setView('available')}
              className="mt-3 text-violet-400 text-sm hover:text-violet-300 transition-colors"
            >
              Browse available slots →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {displaySlots.map(slot => (
              <SlotCard
                key={slot.id}
                slot={slot}
                view={view}
                cycleStatus={cycle.status}
                onBid={setBidTarget}
                onWithdraw={handleWithdraw}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Bid modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bidTarget && (
          <BidModal
            slot={bidTarget}
            onClose={() => setBidTarget(null)}
            onSubmit={handleBidSubmit}
          />
        )}
      </AnimatePresence>

      {/* ── Publish confirm modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {publishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) setPublishConfirm(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ ease: 'easeOut' as const, duration: 0.2 }}
              id="publish-modal"
              className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm"
            >
              <div className="px-5 py-6 text-center">
                <div className="w-14 h-14 bg-emerald-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-white font-bold text-lg mb-2">Publish Schedule?</h2>
                <p className="text-slate-400 text-sm mb-1">
                  Conflicts will be resolved by seniority. All {cycle.slots.reduce((a, s) => a + s.bids.length, 0)} nurses will be notified.
                </p>
                {stats.unfilled > 0 && (
                  <p className="text-amber-400 text-xs mt-2">
                    ⚠ {stats.unfilled} positions still unfilled — they'll become open shifts.
                  </p>
                )}
                <div className="flex gap-3 mt-5">
                  <button
                    aria-label="Cancel publish"
                    onClick={() => setPublishConfirm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    aria-label="Confirm publish"
                    onClick={handlePublish}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
