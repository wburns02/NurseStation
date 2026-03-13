// Coverage Command — Round 11
// The one screen that saves 45 minutes every morning.
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap, AlertTriangle, CheckCircle2, Clock, PhoneCall,
  TrendingUp, Users, DollarSign, ChevronDown, ChevronUp,
  X, Shield, Activity, ArrowRight, Bell, TriangleAlert,
  CalendarDays, UserPlus, RefreshCw,
} from 'lucide-react'
import {
  getCoverageGaps, getFilledToday, markNotified, acceptFill, addCallOutGap,
  weekForecast, atRiskPredictions, patternAlerts, ROSTER_STAFF, WEEK_STATS,
  SHIFT_INFO, REASON_META,
  type CoverageGap, type FillSuggestion, type CallOutReason, type ShiftType,
} from '../data/coverageData'

// ─── Animated coverage ring ───────────────────────────────────────────────────

function CoverageRing({ pct, size = 96, stroke = 9 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [drawn, setDrawn] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDrawn(pct), 150); return () => clearTimeout(t) }, [pct])
  const offset = circ - (drawn / 100) * circ
  const color = pct >= 95 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800 leading-none">{pct}%</span>
        <span className="text-[9px] text-slate-500 mt-0.5">covered</span>
      </div>
    </div>
  )
}

// ─── Shift countdown ──────────────────────────────────────────────────────────

function ShiftCountdown() {
  // Day shift starts 7:00 AM March 12 2026 — hardcoded for demo
  // Simulate ~6:02 AM (58 min before shift)
  const minutesBefore = 58
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <span className="text-amber-600 font-semibold">Day shift starts in {minutesBefore} min</span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">Thu Mar 12 · 6:02 AM</span>
    </div>
  )
}

// ─── Cost badge ───────────────────────────────────────────────────────────────

function CostBadge({ additionalCost, fillSource }: { additionalCost: number; fillSource: string }) {
  if (fillSource === 'agency') {
    return (
      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
        +${additionalCost} agency
      </span>
    )
  }
  if (additionalCost === 0) {
    return (
      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
        +$0
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
      +${additionalCost} OT
    </span>
  )
}

// ─── Reliability bar ──────────────────────────────────────────────────────────

function ReliabilityBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.3 }}
        />
      </div>
      <span className="text-[10px] text-slate-500 tabular-nums">{score}%</span>
    </div>
  )
}

// ─── Suggestion row ───────────────────────────────────────────────────────────

type NotifyPhase = 'idle' | 'sending' | 'sent' | 'accepted'

function SuggestionRow({
  sug,
  gapId,
  phase,
  onNotify,
}: {
  sug: FillSuggestion
  gapId: string
  phase: NotifyPhase
  onNotify: (gapId: string, sug: FillSuggestion) => void
}) {
  const rankColors = ['bg-violet-600', 'bg-slate-400', 'bg-slate-300']
  const isAgency = sug.fillSource === 'agency'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-t border-slate-100 transition-colors ${
        phase === 'accepted' ? 'bg-emerald-50' : 'hover:bg-slate-50/70'
      }`}
    >
      {/* Rank badge */}
      <div className={`w-5 h-5 rounded-full ${rankColors[sug.rank - 1] ?? 'bg-slate-300'} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
        {sug.rank}
      </div>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
        isAgency ? 'bg-slate-400' : 'bg-violet-500'
      }`}>
        {sug.avatarInitials}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{sug.name}</span>
          {sug.rank === 1 && (
            <span className="text-[9px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Best Match
            </span>
          )}
          {sug.overtimeFlag && (
            <span className="text-[9px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
              OT
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          {sug.role} · {sug.unit}
          {sug.hoursThisWeek > 0 && ` · ${sug.hoursThisWeek} hrs/wk`}
          {sug.lastPickupDate && ` · Last pickup: ${sug.lastPickupDate}`}
          {sug.credentialNote && (
            <span className="text-amber-600"> · ⚠️ {sug.credentialNote}</span>
          )}
        </p>
      </div>

      {/* Cost + reliability */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <CostBadge additionalCost={sug.additionalCost} fillSource={sug.fillSource} />
        {!isAgency && <ReliabilityBar score={sug.reliabilityScore} />}
      </div>

      {/* Notify button */}
      <div className="shrink-0 ml-2">
        {phase === 'idle' && (
          <button
            onClick={() => onNotify(gapId, sug)}
            aria-label={`Notify ${sug.name}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <PhoneCall size={12} />
            Notify
          </button>
        )}
        {phase === 'sending' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-400 text-white text-xs font-semibold rounded-lg">
            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Sending…
          </div>
        )}
        {phase === 'sent' && sug.notifiedAt && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
            <Bell size={11} />
            Sent {sug.notifiedAt}
          </div>
        )}
        {phase === 'accepted' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200"
          >
            <CheckCircle2 size={11} />
            Confirmed
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── Gap card ─────────────────────────────────────────────────────────────────

function GapCard({
  gap,
  notifyPhases,
  onNotify,
}: {
  gap: CoverageGap
  notifyPhases: Record<string, NotifyPhase>
  onNotify: (gapId: string, sug: FillSuggestion) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const shiftInfo = SHIFT_INFO[gap.shiftType]
  const reasonMeta = gap.callOutReason ? REASON_META[gap.callOutReason] : null
  const isFilled = gap.status === 'filled'

  const borderColor = isFilled
    ? 'border-l-emerald-400'
    : gap.severity === 'critical'
    ? 'border-l-red-400'
    : 'border-l-amber-400'

  const headerBg = isFilled
    ? 'bg-emerald-50/60'
    : gap.severity === 'critical'
    ? 'bg-red-50/40'
    : 'bg-amber-50/40'

  const hrs = Math.floor(gap.minutesOpen / 60)
  const mins = gap.minutesOpen % 60
  const openLabel = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColor} shadow-sm overflow-hidden`}
      data-id={`gap-${gap.id}`}
    >
      {/* Card header */}
      <div
        className={`${headerBg} flex items-start gap-3 px-4 py-3 cursor-pointer`}
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? `Collapse ${gap.id}` : `Expand ${gap.id}`}
      >
        {/* Severity dot */}
        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
          isFilled ? 'bg-emerald-500' : gap.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
        }`} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{gap.unitShort}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold text-slate-600">{shiftInfo.label}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-600">{gap.position}</span>
            {!isFilled && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                gap.severity === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {gap.severity}
              </span>
            )}
            {isFilled && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-emerald-100 text-emerald-700">
                Filled
              </span>
            )}
          </div>

          {isFilled ? (
            <p className="text-xs text-emerald-700 mt-0.5">
              ✓ {gap.filledByName} confirmed · {gap.filledAt}
              {gap.callOutStaffName && (
                <span className="text-slate-400"> (covering {gap.callOutStaffName})</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              {reasonMeta && <span>{reasonMeta.emoji} </span>}
              {gap.callOutStaffName && (
                <span className="font-medium text-slate-700">{gap.callOutStaffName}</span>
              )}
              {gap.callOutReason && <span className="text-slate-400"> · {reasonMeta?.label}</span>}
              <span className="text-slate-400"> · reported {gap.reportedAt}</span>
              <span className="ml-2 font-semibold text-slate-500">Open {openLabel}</span>
            </p>
          )}
        </div>

        {/* Expand toggle */}
        {!isFilled && (
          <div className="text-slate-400 mt-0.5">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <AnimatePresence initial={false}>
        {expanded && !isFilled && (
          <motion.div
            key="suggestions"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' as const }}
            style={{ overflow: 'hidden' }}
          >
            {gap.suggestions.map(sug => (
              <SuggestionRow
                key={sug.id}
                sug={sug}
                gapId={gap.id}
                phase={notifyPhases[sug.id] ?? 'idle'}
                onNotify={onNotify}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── 7-day forecast strip ─────────────────────────────────────────────────────

function ForecastStrip() {
  const maxGaps = Math.max(...weekForecast.map(d => d.gaps), 1)
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={15} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">7-Day Coverage Forecast</p>
        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">projected from today</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekForecast.map(day => {
          const barH = day.gaps === 0 ? 4 : Math.round((day.gaps / maxGaps) * 56)
          const barColor =
            day.severity === 'critical' ? 'bg-red-400' :
            day.severity === 'warning'  ? 'bg-amber-400' : 'bg-emerald-400'
          const scoreColor =
            day.coverageScore >= 95 ? 'text-emerald-600' :
            day.coverageScore >= 80 ? 'text-amber-600' : 'text-red-600'
          return (
            <div
              key={day.isoDate}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                day.isToday ? 'bg-violet-50 border border-violet-200' : 'hover:bg-slate-50'
              }`}
            >
              <p className={`text-[10px] font-bold ${day.isToday ? 'text-violet-700' : 'text-slate-500'}`}>
                {day.label.split(' ')[0]}
              </p>
              <p className={`text-[10px] ${day.isToday ? 'text-violet-600' : 'text-slate-400'}`}>
                {day.label.split(' ')[1]}
              </p>
              {/* Gap bar */}
              <div className="w-full flex flex-col items-center justify-end" style={{ height: 64 }}>
                {day.gaps === 0 ? (
                  <div className="w-3 h-3 rounded-full bg-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={8} className="text-white" />
                  </div>
                ) : (
                  <motion.div
                    className={`w-5 rounded-t-sm ${barColor}`}
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ duration: 0.7, delay: 0.05 * weekForecast.indexOf(day), ease: 'easeOut' as const }}
                  />
                )}
              </div>
              {/* Gap count */}
              <p className={`text-xs font-bold ${day.gaps > 0 ? scoreColor : 'text-emerald-600'}`}>
                {day.gaps === 0 ? '✓' : `${day.gaps}`}
              </p>
              <p className={`text-[9px] ${scoreColor} font-semibold`}>{day.coverageScore}%</p>
              {day.isProjected && (
                <span className="text-[8px] text-slate-300">proj.</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── At-risk card ─────────────────────────────────────────────────────────────

function AtRiskCard({ pred }: { pred: (typeof atRiskPredictions)[0] }) {
  const riskColor =
    pred.riskPct >= 70 ? 'text-red-700 bg-red-100' :
    pred.riskPct >= 50 ? 'text-amber-700 bg-amber-100' : 'text-yellow-700 bg-yellow-100'

  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
        pred.riskPct >= 70 ? 'bg-red-400' : pred.riskPct >= 50 ? 'bg-amber-400' : 'bg-yellow-400'
      }`}>
        {pred.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-sm font-semibold text-slate-800">{pred.name}</p>
            <p className="text-xs text-slate-400">{pred.role} · {pred.unit}</p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${riskColor}`}>
            {pred.riskPct}% risk
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mb-1">
          <span className="font-semibold">{pred.shiftDate} {SHIFT_INFO[pred.shiftType].label}</span>
        </p>
        <ul className="space-y-0.5 mb-2">
          {pred.riskReasons.map((r, i) => (
            <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1">
              <span className="text-slate-300 mt-0.5 shrink-0">•</span>{r}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1">
          {pred.suggestedActions.map((action, i) => (
            <button
              key={i}
              aria-label={action}
              className="text-[10px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-full transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pattern alert card ───────────────────────────────────────────────────────

function PatternCard({ alert }: { alert: (typeof patternAlerts)[0] }) {
  const icons = { staff: Users, shift: CalendarDays, unit: Activity, capacity: TrendingUp }
  const Icon = icons[alert.category] ?? Activity
  const colors = {
    high:   { border: 'border-l-red-400',    icon: 'text-red-500',   bg: 'bg-red-50'   },
    medium: { border: 'border-l-amber-400',  icon: 'text-amber-500', bg: 'bg-amber-50' },
    low:    { border: 'border-l-blue-400',   icon: 'text-blue-500',  bg: 'bg-blue-50'  },
  }
  const c = colors[alert.severity]
  return (
    <div className={`flex gap-3 p-3 bg-white rounded-xl border border-slate-200 border-l-4 ${c.border} shadow-sm`}>
      <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={13} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 mb-0.5">{alert.title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{alert.detail}</p>
        {alert.actionHint && (
          <button
            aria-label={alert.actionHint}
            className="text-[10px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
          >
            {alert.actionHint} <ArrowRight size={9} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Log Call-Out Modal ───────────────────────────────────────────────────────

const ALL_REASONS: CallOutReason[] = ['sick', 'family', 'bereavement', 'no-show', 'weather', 'personal', 'injury']
const ALL_SHIFTS: ShiftType[] = ['day', 'evening', 'night']

function LogCallOutModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (gap: CoverageGap) => void }) {
  const [selectedStaff, setSelectedStaff] = useState(ROSTER_STAFF[0].staffId)
  const [shiftType, setShiftType] = useState<ShiftType>('day')
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow'>('today')
  const [reason, setReason] = useState<CallOutReason>('sick')
  const [submitting, setSubmitting] = useState(false)

  const staff = ROSTER_STAFF.find(s => s.staffId === selectedStaff)!

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      const isoDate = dateChoice === 'today' ? '2026-03-12' : '2026-03-13'
      const newGap: CoverageGap = {
        id: 'cov_new',
        unit: staff.unit === 'Float Pool' ? 'Float Pool' : staff.unit,
        unitShort: staff.unit,
        position: `${staff.unit} ${staff.role}`,
        role: staff.role,
        shiftType,
        isoDate,
        severity: shiftType === 'day' ? 'warning' : 'info',
        source: 'callout',
        callOutStaffId: staff.staffId,
        callOutStaffName: staff.name,
        callOutReason: reason,
        reportedAt: timeStr,
        minutesOpen: 0,
        status: 'open',
        suggestions: [],
      }
      addCallOutGap(newGap)
      onSubmit(newGap)
      setSubmitting(false)
      onClose()
    }, 700)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Log call-out dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' as const }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Log Call-Out</h2>
            <p className="text-xs text-slate-500">This will create a coverage gap and suggest replacements</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close log call-out dialog"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Staff selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Who is calling out?
            </label>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              aria-label="Select staff calling out"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {ROSTER_STAFF.map(s => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name} — {s.role} · {s.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Shift + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Shift</label>
              <div className="flex gap-1">
                {ALL_SHIFTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setShiftType(s)}
                    aria-label={`Select ${s} shift`}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      shiftType === s
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Date</label>
              <div className="flex gap-1">
                {(['today', 'tomorrow'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDateChoice(d)}
                    aria-label={`Select ${d}`}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      dateChoice === d
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Reason</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_REASONS.map(r => {
                const meta = REASON_META[r]
                return (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    aria-label={`Reason: ${meta.label}`}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                      reason === r
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Gap will appear instantly with fill suggestions
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              aria-label="Confirm log call-out"
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <TriangleAlert size={12} />
              )}
              {submitting ? 'Logging…' : 'Log Call-Out'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Coverage() {
  const [gaps, setGaps] = useState<CoverageGap[]>(() => getCoverageGaps())
  const [filledToday, setFilledToday] = useState(() => getFilledToday())
  const [notifyPhases, setNotifyPhases] = useState<Record<string, NotifyPhase>>({})
  const [showLogModal, setShowLogModal] = useState(false)
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const refreshGaps = useCallback(() => {
    setGaps([...getCoverageGaps()])
    setFilledToday(getFilledToday())
  }, [])

  const handleNotify = useCallback((gapId: string, sug: FillSuggestion) => {
    setNotifyPhases(prev => ({ ...prev, [sug.id]: 'sending' }))

    timerRefs.current[sug.id + '_send'] = setTimeout(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      markNotified(gapId, sug.id, timeStr)
      refreshGaps()
      setNotifyPhases(prev => ({ ...prev, [sug.id]: 'sent' }))

      // Auto-accept after 3s (demo magic moment)
      timerRefs.current[sug.id + '_accept'] = setTimeout(() => {
        const t2 = new Date()
        const t2Str = t2.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        acceptFill(gapId, sug.id, t2Str)
        refreshGaps()
        setNotifyPhases(prev => ({ ...prev, [sug.id]: 'accepted' }))
      }, 3000)
    }, 700)
  }, [refreshGaps])

  useEffect(() => {
    const refs = timerRefs.current
    return () => { Object.values(refs).forEach(clearTimeout) }
  }, [])

  const activeGaps = gaps.filter(g => g.status !== 'filled')
  const filledGaps  = gaps.filter(g => g.status === 'filled')

  // Compute live coverage score
  const totalGaps   = gaps.length
  const openGaps    = activeGaps.length
  const rawScore    = totalGaps === 0 ? 100 : Math.round(((totalGaps - openGaps) / totalGaps) * 12 + 88)
  const coveragePct = Math.min(100, Math.max(0, openGaps === 0 ? 100 : rawScore))

  const hasCritical = activeGaps.some(g => g.severity === 'critical')

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={20} className="text-violet-600" />
              <h1 className="text-xl font-bold text-slate-800">Coverage Command</h1>
            </div>
            <ShiftCountdown />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshGaps}
              aria-label="Refresh coverage data"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
            <Link
              to="/shifts"
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <CalendarDays size={13} /> Full Schedule
            </Link>
            <button
              onClick={() => setShowLogModal(true)}
              aria-label="Log a call-out"
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <UserPlus size={14} /> Log Call-Out
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Critical alert banner ── */}
        <AnimatePresence>
          {hasCritical && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 bg-red-600 text-white rounded-xl px-4 py-3 shadow-md"
              id="critical-alert-banner"
            >
              <AlertTriangle size={18} className="shrink-0 animate-pulse" />
              <div className="flex-1">
                <span className="font-bold">
                  {activeGaps.filter(g => g.severity === 'critical').length} critical gap{activeGaps.filter(g => g.severity === 'critical').length !== 1 ? 's' : ''} —{' '}
                </span>
                <span className="font-medium opacity-90">Day shift starts in 58 minutes. Notify replacements now to confirm coverage.</span>
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full shrink-0">Urgent</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Coverage ring */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-4 lg:col-span-1">
            <CoverageRing pct={coveragePct} />
            <div>
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-xs font-semibold text-slate-700">Day Shift</p>
              <p className="text-[10px] text-slate-400">Mar 12</p>
            </div>
          </div>

          {[
            {
              id: 'stat-open-gaps',
              label: 'Open Gaps',
              value: openGaps.toString(),
              sub: 'need immediate fill',
              color: openGaps > 0 ? 'text-red-600' : 'text-emerald-600',
              bg: openGaps > 0 ? 'bg-red-50' : 'bg-emerald-50',
              icon: AlertTriangle,
            },
            {
              id: 'stat-filled-today',
              label: 'Filled Today',
              value: filledToday.toString(),
              sub: `${WEEK_STATS.filledThisWeek} this week`,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              icon: CheckCircle2,
            },
            {
              id: 'stat-avg-fill',
              label: 'Avg Fill Time',
              value: `${WEEK_STATS.avgFillMinutes}m`,
              sub: 'this week',
              color: 'text-violet-600',
              bg: 'bg-violet-50',
              icon: Clock,
            },
            {
              id: 'stat-agency-cost',
              label: 'Agency Cost',
              value: `$${WEEK_STATS.agencyCostThisWeek}`,
              sub: 'this week',
              color: WEEK_STATS.agencyCostThisWeek === 0 ? 'text-emerald-600' : 'text-red-600',
              bg: WEEK_STATS.agencyCostThisWeek === 0 ? 'bg-emerald-50' : 'bg-red-50',
              icon: DollarSign,
            },
          ].map(stat => (
            <div key={stat.id} id={stat.id} className={`${stat.bg} rounded-xl border border-slate-200 shadow-sm px-4 py-3`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Active gaps ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Active Gaps</h2>
            {activeGaps.length > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                {activeGaps.length} open
              </span>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {activeGaps.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-10 text-center"
                id="all-covered-state"
              >
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-bold text-emerald-700">All shifts covered</p>
                <p className="text-sm text-emerald-600 mt-1">Day shift is fully staffed. Great work!</p>
              </motion.div>
            ) : (
              activeGaps.map(gap => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                  notifyPhases={notifyPhases}
                  onNotify={handleNotify}
                />
              ))
            )}
          </AnimatePresence>

          {/* Filled today section */}
          {filledGaps.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filled Today</p>
              {filledGaps.map(gap => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                  notifyPhases={notifyPhases}
                  onNotify={handleNotify}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 7-day forecast ── */}
        <ForecastStrip />

        {/* ── At-risk + patterns ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* At-risk predictions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-700">Predicted Call-Out Risk</h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">AI · next 5 days</span>
            </div>
            {atRiskPredictions.map(pred => (
              <AtRiskCard key={pred.staffId} pred={pred} />
            ))}
          </div>

          {/* Pattern intelligence */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-violet-500" />
              <h2 className="text-sm font-bold text-slate-700">Pattern Intelligence</h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Last 30 days</span>
            </div>
            {patternAlerts.map(alert => (
              <PatternCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

      </div>

      {/* ── Log Call-Out Modal ── */}
      <AnimatePresence>
        {showLogModal && (
          <LogCallOutModal
            onClose={() => setShowLogModal(false)}
            onSubmit={() => { refreshGaps() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
