import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneCall, PhoneOff, Clock, AlertTriangle, CheckCircle2, ShieldOff,
  Calendar, BarChart3, History, Users, Zap, ChevronRight, MapPin,
  Phone, MessageSquare, RefreshCw, ArrowRight,
} from 'lucide-react'
import {
  getNurses, getNurse, getSlots, getTodaySlots, getActivations, getStats,
  getCalendarDates, getCalendarDOW,
  activateSlot, markArrived,
  UNIT_COLORS, UNIT_DOT,
  type OnCallSlot, type ActivationEvent, type UnitKey,
} from '../data/onCallData'

type Tab = 'today' | 'calendar' | 'rotation' | 'log'

const UNITS: UnitKey[] = ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Telemetry']

const STATUS_META = {
  scheduled: { label: 'On Call', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200' },
  activated:  { label: 'Active', dot: 'bg-violet-500 animate-pulse', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-300' },
  completed:  { label: 'Done',   dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500',   ring: 'ring-slate-200' },
  declined:   { label: 'Declined', dot: 'bg-red-400',   badge: 'bg-red-100 text-red-600',       ring: 'ring-red-200' },
  blocked:    { label: 'Blocked',  dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700',       ring: 'ring-red-300' },
}

const ACTIVATION_META = {
  calling:   { label: 'Calling…',  color: 'text-amber-600', bg: 'bg-amber-100' },
  accepted:  { label: 'Accepted',  color: 'text-sky-600',   bg: 'bg-sky-100' },
  declined:  { label: 'Declined',  color: 'text-red-600',   bg: 'bg-red-100' },
  'en-route': { label: 'En Route', color: 'text-violet-600', bg: 'bg-violet-100' },
  arrived:   { label: 'Arrived',   color: 'text-emerald-600', bg: 'bg-emerald-100' },
  completed: { label: 'Completed', color: 'text-slate-600',  bg: 'bg-slate-100' },
}

// ── helpers ────────────────────────────────────────────────────────────────────

function shiftLabel(s: string) {
  return s === 'evening' ? 'Evening 3–11 PM' : s === 'night' ? 'Night 11 PM–7 AM' : 'Day 7–3 PM'
}

function shiftShort(s: string) {
  return s === 'evening' ? 'Eve' : s === 'night' ? 'Ngt' : 'Day'
}

// ── sub-components ─────────────────────────────────────────────────────────────

function NurseAvatar({ nurseId, size = 'md' }: { nurseId: string; size?: 'sm' | 'md' }) {
  const nurse = getNurse(nurseId)
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${nurse?.color ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-white font-bold shrink-0`}>
      {nurse?.initials ?? '?'}
    </div>
  )
}

interface SlotCardProps {
  slot: OnCallSlot
  onActivate: (slot: OnCallSlot) => void
  compact?: boolean
}

function SlotCard({ slot, onActivate, compact = false }: SlotCardProps) {
  const nurse = getNurse(slot.nurseId)
  const meta  = STATUS_META[slot.status]
  const unitC = UNIT_COLORS[slot.unit]

  return (
    <motion.div
      layout
      data-id={`oncall-slot-${slot.id}`}
      className={`relative rounded-xl border ${
        slot.status === 'activated' ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-200' :
        slot.status === 'blocked'   ? 'border-red-200 bg-red-50' :
        'border-slate-200 bg-white'
      } ${compact ? 'p-3' : 'p-4'} shadow-sm`}
    >
      {/* type pill */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${unitC}`}>
          {slot.unit}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${meta.badge}`}>
            {slot.type === 'primary' ? '1° Primary' : '2° Backup'}
          </span>
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        </div>
      </div>

      {/* nurse info */}
      <div className="flex items-center gap-2.5 mb-3">
        <NurseAvatar nurseId={slot.nurseId} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${slot.status === 'blocked' ? 'text-red-700' : 'text-slate-800'}`}>
            {nurse?.name ?? 'Unknown'}
          </p>
          <p className="text-xs text-slate-400">{nurse?.phone}</p>
        </div>
        {slot.status === 'blocked' && (
          <ShieldOff size={14} className="text-red-500 shrink-0 ml-auto" />
        )}
      </div>

      {/* activated reason */}
      {slot.status === 'activated' && slot.callReason && (
        <div className="mb-3 bg-violet-100 rounded-lg px-3 py-2">
          <p className="text-xs text-violet-700 font-medium">{slot.callReason}</p>
          <p className="text-[11px] text-violet-500 mt-0.5">Activated {slot.activatedAt}</p>
        </div>
      )}

      {/* blocked reason */}
      {slot.status === 'blocked' && (
        <div className="mb-3 bg-red-100 rounded-lg px-3 py-2">
          <p className="text-xs text-red-700 font-medium">Safe Hours block — cannot be called</p>
          <a href="/safe-hours" className="text-[11px] text-red-500 hover:underline">View fatigue status →</a>
        </div>
      )}

      {/* action buttons */}
      {slot.status === 'scheduled' && (
        <button
          aria-label={`Activate on-call ${slot.id}`}
          onClick={() => onActivate(slot)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
        >
          <PhoneCall size={13} />
          Call Now
        </button>
      )}

      {slot.status === 'activated' && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1.5 bg-emerald-100 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            En Route
          </div>
          <button className="bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors">
            <Phone size={13} className="text-slate-600" />
          </button>
          <button className="bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors">
            <MessageSquare size={13} className="text-slate-600" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Activation Modal ─────────────────────────────────────────────────────────

interface ActivationModalProps {
  slot: OnCallSlot
  onConfirm: (reason: string) => void
  onClose: () => void
}

function ActivationModal({ slot, onConfirm, onClose }: ActivationModalProps) {
  const [reason, setReason] = useState('')
  const nurse = getNurse(slot.nurseId)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        id="activation-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <PhoneCall size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Activate On-Call</h2>
            <p className="text-xs text-slate-500">{slot.unit} · {shiftLabel(slot.shift)} · {slot.type === 'primary' ? 'Primary' : 'Backup'}</p>
          </div>
        </div>

        {/* nurse card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
          <div className="flex items-center gap-3">
            <NurseAvatar nurseId={slot.nurseId} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{nurse?.name}</p>
              <p className="text-xs text-slate-500">{nurse?.unit} · {nurse?.phone}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-violet-300 flex items-center justify-center transition-colors">
                <Phone size={14} className="text-slate-600" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-violet-300 flex items-center justify-center transition-colors">
                <MessageSquare size={14} className="text-slate-600" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span>Calls this month: <span className="font-semibold text-slate-700">{nurse?.callsThisMonth}</span></span>
            <span>Target: <span className="font-semibold text-slate-700">{nurse?.callsTarget}</span></span>
            <span>Last call: <span className="font-semibold text-slate-700">{nurse?.lastCallDate}</span></span>
          </div>
        </div>

        {/* reason */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Activation Reason *</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            rows={3}
            placeholder="e.g. ED census surge, unexpected absence, trauma activation…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {/* actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            aria-label="Confirm activate on-call"
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <PhoneCall size={15} />
            Call Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Today Tab ─────────────────────────────────────────────────────────────────

interface TodayTabProps {
  onActivate: (slot: OnCallSlot) => void
}

function TodayTab({ onActivate }: TodayTabProps) {
  const todaySlots = getTodaySlots()
  const [shiftFilter, setShiftFilter] = useState<'all' | 'evening' | 'night'>('all')

  const filtered = shiftFilter === 'all' ? todaySlots : todaySlots.filter(s => s.shift === shiftFilter)

  // Group by unit
  const byUnit: Record<string, OnCallSlot[]> = {}
  UNITS.forEach(u => { byUnit[u] = filtered.filter(s => s.unit === u) })

  return (
    <div id="today-oncall">
      {/* shift filter */}
      <div className="flex gap-2 mb-5">
        {(['all', 'evening', 'night'] as const).map(f => (
          <button
            key={f}
            id={`shift-filter-${f}`}
            onClick={() => setShiftFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              shiftFilter === f
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All Shifts' : shiftLabel(f)}
          </button>
        ))}
      </div>

      {/* units */}
      <div className="space-y-6">
        {UNITS.map(unit => {
          const slots = byUnit[unit]
          if (!slots.length) return null
          const dot = UNIT_DOT[unit]
          const unitC = UNIT_COLORS[unit]

          // Group by shift then type
          const eveningPrimary = slots.filter(s => s.shift === 'evening' && s.type === 'primary')
          const eveningBackup  = slots.filter(s => s.shift === 'evening' && s.type === 'backup')
          const nightPrimary   = slots.filter(s => s.shift === 'night'   && s.type === 'primary')
          const nightBackup    = slots.filter(s => s.shift === 'night'   && s.type === 'backup')

          return (
            <div key={unit}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <h3 className="text-sm font-bold text-slate-700">{unit}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${unitC}`}>
                  {slots.length} slots
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[...eveningPrimary, ...eveningBackup, ...nightPrimary, ...nightBackup].map(slot => (
                  <div key={slot.id}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
                      {shiftShort(slot.shift)} · {slot.type === 'primary' ? 'Primary' : 'Backup'}
                    </p>
                    <SlotCard slot={slot} onActivate={onActivate} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────

function CalendarTab() {
  const dates   = getCalendarDates()
  const dows    = getCalendarDOW()
  const slots   = getSlots()

  function getCellSlots(unit: UnitKey, date: string) {
    return slots.filter(s => s.unit === unit && s.date === date)
  }

  return (
    <div id="oncall-calendar" className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* header row */}
        <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-px mb-1">
          <div className="text-xs font-bold text-slate-400 px-2 py-1">Unit</div>
          {dates.map((d, i) => (
            <div key={d} className={`text-center px-1 py-1 rounded-lg ${d === 'Mar 13' ? 'bg-violet-100' : ''}`}>
              <p className={`text-[10px] font-semibold ${d === 'Mar 13' ? 'text-violet-600' : 'text-slate-400'}`}>{dows[i]}</p>
              <p className={`text-xs font-bold ${d === 'Mar 13' ? 'text-violet-700' : 'text-slate-600'}`}>{d.split(' ')[1]}</p>
            </div>
          ))}
        </div>

        {/* rows per unit */}
        {UNITS.map(unit => (
          <div key={unit} className="grid grid-cols-[80px_repeat(14,1fr)] gap-px mb-1">
            <div className="flex items-center px-2 py-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${UNIT_COLORS[unit]}`}>{unit}</span>
            </div>
            {dates.map(date => {
              const cellSlots = getCellSlots(unit, date)
              const isToday = date === 'Mar 13'

              return (
                <div
                  key={date}
                  className={`rounded-lg border min-h-[52px] p-1 ${
                    isToday ? 'border-violet-200 bg-violet-50/50' : 'border-slate-100 bg-white'
                  }`}
                >
                  {cellSlots.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-200 text-[10px]">—</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {cellSlots.map(slot => {
                        const nurse = getNurse(slot.nurseId)
                        const dot   = STATUS_META[slot.status].dot
                        return (
                          <div
                            key={slot.id}
                            data-id={`cal-slot-${slot.id}`}
                            className="flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-white rounded px-1 py-0.5 border border-slate-100"
                            title={`${nurse?.name} · ${shiftShort(slot.shift)} · ${slot.type} · ${slot.status}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                            <span className="truncate">{nurse?.initials}</span>
                            <span className="text-slate-400 ml-auto">{shiftShort(slot.shift)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Legend:</span>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${v.dot}`} />
              {v.label}
            </div>
          ))}
          <span className="ml-2 text-slate-400">Eve = Evening · Ngt = Night</span>
        </div>
      </div>
    </div>
  )
}

// ── Rotation Tab ──────────────────────────────────────────────────────────────

function RotationTab() {
  const nurses = getNurses()
  const max = Math.max(...nurses.map(n => Math.max(n.callsThisMonth, n.callsTarget))) + 1

  return (
    <div id="rotation-stats">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-700 mb-1">Call Fairness — March 2026</h3>
        <p className="text-xs text-slate-500">Monthly call count vs fair-share target for each nurse in rotation pool.</p>
      </div>

      <div className="space-y-3">
        {nurses.sort((a, b) => b.callsThisMonth - a.callsThisMonth).map((nurse, i) => {
          const pct    = (nurse.callsThisMonth / max) * 100
          const tgtPct = (nurse.callsTarget    / max) * 100
          const over   = nurse.callsThisMonth > nurse.callsTarget
          const under  = nurse.callsThisMonth < nurse.callsTarget - 1

          return (
            <motion.div
              key={nurse.id}
              data-id={`rotation-nurse-${nurse.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.035, ease: 'easeOut' as const }}
              className="flex items-center gap-3"
            >
              <NurseAvatar nurseId={nurse.id} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 truncate">{nurse.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {nurse.safeHoursBlocked && (
                      <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">BLOCKED</span>
                    )}
                    {over  && <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">OVER</span>}
                    {under && <span className="text-[9px] font-bold bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">UNDER</span>}
                    <span className={`text-xs font-bold ${over ? 'text-amber-600' : under ? 'text-sky-600' : 'text-emerald-600'}`}>
                      {nurse.callsThisMonth} / {nurse.callsTarget}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute left-0 top-0 h-full rounded-full ${over ? 'bg-amber-400' : under ? 'bg-sky-400' : 'bg-emerald-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.035 + 0.1, duration: 0.5, ease: 'easeOut' as const }}
                  />
                  {/* target marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-slate-600/30"
                    style={{ left: `${tgtPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-slate-400">{nurse.unit}</span>
                  <span className="text-[10px] text-slate-400">Last call: {nurse.lastCallDate}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* fairness summary */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">Fairness Summary</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-amber-600">{nurses.filter(n => n.callsThisMonth > n.callsTarget).length}</p>
            <p className="text-[10px] text-slate-500">Over target</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">{nurses.filter(n => n.callsThisMonth === n.callsTarget).length}</p>
            <p className="text-[10px] text-slate-500">On target</p>
          </div>
          <div>
            <p className="text-lg font-bold text-sky-600">{nurses.filter(n => n.callsThisMonth < n.callsTarget - 1).length}</p>
            <p className="text-[10px] text-slate-500">Under target</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Log Tab ───────────────────────────────────────────────────────────────────

interface LogTabProps {
  activations: ActivationEvent[]
  onMarkArrived: (id: string) => void
}

function LogTab({ activations, onMarkArrived }: LogTabProps) {
  return (
    <div id="activation-log" className="space-y-3">
      {activations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <History size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activation history</p>
        </div>
      )}

      {activations.map((ev, i) => {
        const meta  = ACTIVATION_META[ev.status]
        const unitC = UNIT_COLORS[ev.unit]
        const isToday = ev.date === 'Mar 13'

        return (
          <motion.div
            key={ev.id}
            data-id={`log-event-${ev.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ease: 'easeOut' as const }}
            className={`rounded-xl border p-4 ${isToday ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-start gap-3">
              <NurseAvatar nurseId={ev.nurseId} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">{ev.nurseName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${unitC}`}>{ev.unit}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                  {isToday && <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Today</span>}
                </div>
                <p className="text-xs text-slate-600 mb-2">{ev.reason}</p>

                {/* timeline */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Clock size={10} />
                  <span>Called {ev.calledAt}</span>
                  {ev.acceptedAt && (
                    <>
                      <ArrowRight size={9} className="text-slate-300" />
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span className="text-emerald-600">Accepted {ev.acceptedAt}</span>
                    </>
                  )}
                  {ev.arrivedAt && (
                    <>
                      <ArrowRight size={9} className="text-slate-300" />
                      <MapPin size={10} className="text-violet-500" />
                      <span className="text-violet-600">Arrived {ev.arrivedAt}</span>
                    </>
                  )}
                  {ev.completedAt && (
                    <>
                      <ArrowRight size={9} className="text-slate-300" />
                      <span className="text-slate-500">Done {ev.completedAt}</span>
                    </>
                  )}
                  {ev.status === 'declined' && (
                    <>
                      <ArrowRight size={9} className="text-slate-300" />
                      <PhoneOff size={10} className="text-red-500" />
                      <span className="text-red-600">Declined</span>
                    </>
                  )}
                </div>

                {/* mark arrived */}
                {ev.status === 'accepted' && !ev.arrivedAt && (
                  <button
                    aria-label={`Mark arrived ${ev.id}`}
                    onClick={() => onMarkArrived(ev.id)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <MapPin size={12} />
                    Mark Arrived
                  </button>
                )}
              </div>

              {/* shift badge */}
              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{shiftShort(ev.shift)}</p>
                <p className="text-[10px] text-slate-400">{ev.date}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OnCall() {
  const [tab, setTab] = useState<Tab>('today')
  const [pendingSlot, setPendingSlot] = useState<OnCallSlot | null>(null)
  const [activations, setActivations] = useState<ActivationEvent[]>(() => getActivations())
  const [toast, setToast] = useState<string | null>(null)

  const stats = getStats()

  const todaySlots = getTodaySlots()
  const activeSlot = todaySlots.find(s => s.status === 'activated')
  const activeNurse = activeSlot ? getNurse(activeSlot.nurseId) : null

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3800)
  }

  function handleActivate(slot: OnCallSlot) {
    setPendingSlot(slot)
  }

  function handleConfirm(reason: string) {
    if (!pendingSlot) return
    activateSlot(pendingSlot.id, reason)
    setActivations([...getActivations()])
    showToast(`${getNurse(pendingSlot.nurseId)?.name ?? 'Nurse'} activated for ${pendingSlot.unit} ${shiftShort(pendingSlot.shift)} shift`)
    setPendingSlot(null)
  }

  function handleMarkArrived(id: string) {
    markArrived(id)
    setActivations([...getActivations()])
    const ev = activations.find(a => a.id === id)
    showToast(`${ev?.nurseName ?? 'Nurse'} marked as arrived`)
  }

  const TABS = [
    { id: 'today'    as Tab, label: 'Today',    icon: Zap     },
    { id: 'calendar' as Tab, label: 'Calendar', icon: Calendar },
    { id: 'rotation' as Tab, label: 'Rotation', icon: BarChart3 },
    { id: 'log'      as Tab, label: 'History',  icon: History  },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PhoneCall size={20} className="text-violet-600" />
              <h1 className="text-xl font-bold text-slate-900">On-Call Rotation</h1>
            </div>
            <p className="text-sm text-slate-500">Manage call schedules, activations, and rotation fairness · Mar 13, 2026</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-5 max-w-7xl mx-auto">
        {/* Hero stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { id: 'stat-active',   label: 'Active Now',      value: stats.active,        icon: Zap,     color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
            { id: 'stat-blocked',  label: 'Blocked',         value: stats.blocked,        icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-50',    border: 'border-red-200' },
            { id: 'stat-ready',    label: 'Ready Tonight',   value: stats.ready,          icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { id: 'stat-nurses',   label: 'In Pool',         value: stats.totalNurses,    icon: Users,   color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-200' },
          ].map(({ id, label, value, icon: Icon, color, bg, border }) => (
            <motion.div
              key={id}
              id={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border ${border} ${bg} p-4`}
            >
              <div className={`flex items-center gap-2 mb-1 ${color}`}>
                <Icon size={15} />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Active alert banner */}
        {activeSlot && activeNurse && (
          <motion.div
            id="active-alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-xl border border-violet-300 bg-violet-50 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-200 flex items-center justify-center shrink-0">
              <PhoneCall size={16} className="text-violet-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-violet-800">
                <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-violet-500 mr-2" />
                {activeNurse.name} activated — {activeSlot.unit} {shiftShort(activeSlot.shift)} shift
              </p>
              <p className="text-xs text-violet-600">{activeSlot.callReason} · Activated {activeSlot.activatedAt}</p>
            </div>
            <button
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-200 hover:bg-violet-300 px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => setTab('log')}
            >
              View Log <ChevronRight size={12} />
            </button>
          </motion.div>
        )}

        {/* Blocked alert */}
        {stats.blocked > 0 && (
          <motion.div
            id="blocked-alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3"
          >
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-bold">{stats.blocked} slot{stats.blocked > 1 ? 's' : ''} blocked</span>
              {' '}due to Safe Hours fatigue violations — backup nurses are covering.
            </p>
            <a
              href="/safe-hours"
              className="ml-auto shrink-0 text-xs font-semibold text-red-700 bg-red-200 hover:bg-red-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              Safe Hours <ChevronRight size={12} />
            </a>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
          >
            {tab === 'today' && (
              <TodayTab onActivate={handleActivate} />
            )}
            {tab === 'calendar' && <CalendarTab />}
            {tab === 'rotation' && <RotationTab />}
            {tab === 'log' && (
              <LogTab activations={activations} onMarkArrived={handleMarkArrived} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Activation modal */}
      <AnimatePresence>
        {pendingSlot && (
          <ActivationModal
            slot={pendingSlot}
            onConfirm={handleConfirm}
            onClose={() => setPendingSlot(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="activate-toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ ease: 'easeOut' as const }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
