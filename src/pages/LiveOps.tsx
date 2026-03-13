// LiveOps.tsx — Live Shift Operations Center
// The big screen that breathes: auto-streaming events, real-time unit status, one-click response.
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Radio, AlertTriangle, CheckCircle2, Clock,
  Bed, TrendingUp, TrendingDown, X,
  Phone, Zap, ShoppingCart, Bell, ArrowRight,
  Coffee, UserCheck, UserX,
} from 'lucide-react'
import {
  getUnits, getEventLog, getShiftStats, fireNextEvent, doAction,
  UNIT_META,
  SHIFT_START_HOUR, SHIFT_DURATION_H,
  type UnitLiveStatus, type LiveEvent, type StaffStatus,
} from '../data/liveOpsData'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNow(): string {
  const d = new Date()
  let h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function shiftProgressPct(): number {
  const d = new Date()
  const elapsedH = d.getHours() - SHIFT_START_HOUR + d.getMinutes() / 60
  return Math.min(100, Math.max(0, (elapsedH / SHIFT_DURATION_H) * 100))
}

function shiftElapsedLabel(): string {
  const d = new Date()
  let elapsedMin = (d.getHours() - SHIFT_START_HOUR) * 60 + d.getMinutes()
  if (elapsedMin < 0) elapsedMin = 0
  const h = Math.floor(elapsedMin / 60)
  const m = elapsedMin % 60
  return `${h}h ${m}m elapsed`
}

// ── Status avatar ─────────────────────────────────────────────────────────────

function StaffDot({ status, initials, name }: { status: StaffStatus; initials: string; name: string }) {
  const ring: Record<StaffStatus, string> = {
    'on-floor':  'ring-emerald-200',
    'scheduled': 'ring-slate-200',
    'late':      'ring-amber-200',
    'on-break':  'ring-sky-200',
    'callout':   'ring-red-200',
    'float-in':  'ring-violet-200',
  }
  return (
    <div title={`${name} — ${status.replace('-', ' ')}`}
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white ring-2 ${ring[status]} shrink-0`}
      style={{ background: status === 'callout' ? '#ef4444' : status === 'late' ? '#f59e0b' : status === 'float-in' ? '#8b5cf6' : status === 'on-break' ? '#38bdf8' : status === 'scheduled' ? '#94a3b8' : '#10b981' }}>
      {initials}
    </div>
  )
}

// ── Event icon ────────────────────────────────────────────────────────────────

function EventIcon({ type, severity }: { type: LiveEvent['type']; severity: LiveEvent['severity'] }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0'
  const map: Record<string, { bg: string; icon: React.ReactNode }> = {
    'shift-start':     { bg: 'bg-slate-100', icon: <Activity size={14} className="text-slate-600" /> },
    'checkin':         { bg: 'bg-emerald-100', icon: <UserCheck size={14} className="text-emerald-600" /> },
    'late-checkin':    { bg: 'bg-amber-100', icon: <Clock size={14} className="text-amber-600" /> },
    'callout':         { bg: 'bg-red-100', icon: <UserX size={14} className="text-red-600" /> },
    'float-assign':    { bg: 'bg-violet-100', icon: <Zap size={14} className="text-violet-600" /> },
    'ratio-alert':     { bg: 'bg-red-100', icon: <AlertTriangle size={14} className="text-red-600" /> },
    'ratio-clear':     { bg: 'bg-emerald-100', icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
    'ot-warning':      { bg: 'bg-amber-100', icon: <TrendingUp size={14} className="text-amber-600" /> },
    'census-up':       { bg: 'bg-rose-100', icon: <TrendingUp size={14} className="text-rose-600" /> },
    'census-down':     { bg: 'bg-sky-100', icon: <TrendingDown size={14} className="text-sky-600" /> },
    'relief-request':  { bg: 'bg-orange-100', icon: <Phone size={14} className="text-orange-600" /> },
    'incident':        { bg: 'bg-red-100', icon: <AlertTriangle size={14} className="text-red-700" /> },
    'break-relief':    { bg: 'bg-sky-100', icon: <Coffee size={14} className="text-sky-600" /> },
    'marketplace-fill':{ bg: 'bg-violet-100', icon: <ShoppingCart size={14} className="text-violet-600" /> },
  }
  const config = map[type] ?? { bg: 'bg-slate-100', icon: <Bell size={14} className="text-slate-500" /> }
  const severityRing = severity === 'critical' ? 'ring-2 ring-red-400' : severity === 'warning' ? 'ring-2 ring-amber-400' : ''
  return <div className={`${base} ${config.bg} ${severityRing}`}>{config.icon}</div>
}

// ── Unit card ─────────────────────────────────────────────────────────────────

function UnitCard({ unit, onSelect, isSelected }: { unit: UnitLiveStatus; onSelect: () => void; isSelected: boolean }) {
  const meta = UNIT_META[unit.id]
  const coveragePct = Math.round((unit.onFloorCount / unit.scheduledCount) * 100)
  const hasIssue = !unit.ratioOk || unit.calloutCount > 0 || unit.lateCount > 0
  const isCritical = !unit.ratioOk

  const statusColor = isCritical
    ? 'border-red-300 bg-red-50'
    : hasIssue
    ? 'border-amber-300 bg-amber-50'
    : 'border-slate-200 bg-white'

  const hppdPct = Math.min(100, (unit.hppdActual / (unit.hppdBudget * 1.5)) * 100)
  const hppdColor = unit.hppdActual > unit.hppdBudget * 1.05 ? 'bg-red-400' : unit.hppdActual > unit.hppdBudget ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <motion.div
      layout
      id={`unit-card-${unit.id}`}
      onClick={onSelect}
      className={`rounded-2xl border-2 p-3.5 cursor-pointer transition-all hover:shadow-md ${statusColor} ${isSelected ? 'ring-2 ring-offset-1 ring-violet-400' : ''}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Unit header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wide ${meta.color}`}>{unit.abbr}</span>
          {isCritical && (
            <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full animate-pulse">ALERT</span>
          )}
          {!isCritical && hasIssue && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">WATCH</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Bed size={10} className="text-slate-400" />
          <span className="text-[10px] text-slate-600 font-semibold">{unit.census}/{unit.capacity}</span>
        </div>
      </div>

      {/* Staff dots row */}
      <div className="flex items-center gap-1 mb-2.5 flex-wrap">
        {unit.staff.map(s => (
          <StaffDot key={s.id} status={s.status} initials={s.initials} name={s.name} />
        ))}
      </div>

      {/* Metrics row */}
      <div className="flex items-center justify-between text-[10px] mb-2">
        <span className="text-slate-600">
          <span className="font-bold text-slate-800">{unit.onFloorCount}</span>
          <span className="text-slate-400">/{unit.scheduledCount}</span> on floor
        </span>
        <span className={`font-bold ${unit.ratioOk ? 'text-emerald-600' : 'text-red-600'}`}>
          {unit.currentRatio}
          {!unit.ratioOk && ` ⚠ target ${unit.targetRatio}`}
        </span>
      </div>

      {/* HPPD bar */}
      <div>
        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
          <span>HPPD {unit.hppdActual.toFixed(1)}</span>
          <span>Budget {unit.hppdBudget.toFixed(1)}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${hppdColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${hppdPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
          />
        </div>
      </div>

      {/* Coverage pct */}
      <div className="mt-2 text-right">
        <span className={`text-[10px] font-black ${coveragePct >= 100 ? 'text-emerald-600' : coveragePct >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
          {coveragePct}% covered
        </span>
      </div>
    </motion.div>
  )
}

// ── Unit detail panel ─────────────────────────────────────────────────────────

function UnitDetailPanel({ unit, onClose }: { unit: UnitLiveStatus; onClose: () => void }) {
  const meta = UNIT_META[unit.id]

  const statusMeta: Record<StaffStatus, { label: string; color: string; bg: string }> = {
    'on-floor':  { label: 'On Floor',   color: 'text-emerald-700', bg: 'bg-emerald-100' },
    'scheduled': { label: 'Scheduled',  color: 'text-slate-600',   bg: 'bg-slate-100' },
    'late':      { label: 'Late',       color: 'text-amber-700',   bg: 'bg-amber-100' },
    'on-break':  { label: 'On Break',   color: 'text-sky-700',     bg: 'bg-sky-100' },
    'callout':   { label: 'Called Out', color: 'text-red-700',     bg: 'bg-red-100' },
    'float-in':  { label: 'Float In',   color: 'text-violet-700',  bg: 'bg-violet-100' },
  }

  return (
    <motion.div
      id="unit-detail-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      <div className={`${meta.bgLight} ${meta.border} border-b px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className={`text-sm font-black ${meta.color}`}>{unit.label}</p>
          <p className="text-[10px] text-slate-500">{unit.onFloorCount} of {unit.scheduledCount} on floor · Census {unit.census}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {unit.staff.map(s => {
          const sm = statusMeta[s.status]
          return (
            <div key={s.id} data-id={`detail-staff-${s.id}`} className="flex items-center gap-3 px-4 py-2.5">
              <StaffDot status={s.status} initials={s.initials} name={s.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-500">{s.role}
                  {s.checkInTime && ` · In ${s.checkInTime}`}
                  {s.minutesLate && <span className="text-amber-600 font-semibold"> · {s.minutesLate}m late</span>}
                </p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sm.bg} ${sm.color}`}>{sm.label}</span>
              {s.hoursThisWeek !== undefined && (
                <span className={`text-[9px] font-semibold ${s.hoursThisWeek >= 40 ? 'text-red-500' : s.hoursThisWeek >= 36 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {s.hoursThisWeek}h
                </span>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, onAction }: { event: LiveEvent; onAction: (id: string) => void }) {
  const severityBorder: Record<LiveEvent['severity'], string> = {
    critical: 'border-l-4 border-l-red-500',
    warning:  'border-l-4 border-l-amber-500',
    info:     'border-l-4 border-l-slate-300',
    success:  'border-l-4 border-l-emerald-500',
  }

  const actionBg: Record<string, string> = {
    'Find Coverage': 'bg-red-500 hover:bg-red-600',
    'Request Float': 'bg-violet-500 hover:bg-violet-600',
    'Post to Float': 'bg-violet-500 hover:bg-violet-600',
    'Contact Now':   'bg-orange-500 hover:bg-orange-600',
    'Review OT':     'bg-amber-500 hover:bg-amber-600',
    'Acknowledge':   'bg-slate-500 hover:bg-slate-600',
    'Early Release?':'bg-sky-500 hover:bg-sky-600',
    'Approve Rate':  'bg-emerald-500 hover:bg-emerald-600',
    'View Incident': 'bg-red-600 hover:bg-red-700',
    'Prepare Room':  'bg-rose-500 hover:bg-rose-600',
  }

  return (
    <motion.div
      layout
      id={`event-card-${event.id}`}
      initial={event.isNew ? { opacity: 0, y: -16, scale: 0.97 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' as const }}
      className={`bg-white rounded-xl shadow-sm ${severityBorder[event.severity]} overflow-hidden`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        <EventIcon type={event.type} severity={event.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-bold text-slate-800 leading-snug">{event.message}</p>
            <span className="text-[9px] text-slate-400 shrink-0 whitespace-nowrap">{event.time}</span>
          </div>
          {event.detail && (
            <p className="text-[11px] text-slate-500 leading-snug mb-1.5">{event.detail}</p>
          )}
          {event.unitId && (
            <span className={`inline-block text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full mr-1.5 ${UNIT_META[event.unitId].bgLight} ${UNIT_META[event.unitId].color}`}>
              {event.unitId}
            </span>
          )}
          {event.actionLabel && (
            <div className="mt-1.5">
              {event.actionDone ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <CheckCircle2 size={10} /> Done
                </span>
              ) : (
                <button
                  aria-label={`Action ${event.id}`}
                  onClick={() => onAction(event.id)}
                  className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-lg transition-colors ${actionBg[event.actionLabel] ?? 'bg-slate-500 hover:bg-slate-600'}`}
                >
                  {event.actionLabel} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Shift progress bar ────────────────────────────────────────────────────────

function ShiftProgressBar() {
  const [pct, setPct] = useState(shiftProgressPct)
  const [elapsed, setElapsed] = useState(shiftElapsedLabel)

  useEffect(() => {
    const t = setInterval(() => {
      setPct(shiftProgressPct())
      setElapsed(shiftElapsedLabel())
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const remaining = SHIFT_DURATION_H - (pct / 100) * SHIFT_DURATION_H
  const remH = Math.floor(remaining)
  const remM = Math.round((remaining - remH) * 60)

  return (
    <div id="shift-progress" className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>7:00 AM (Day Shift)</span>
        <span className="font-semibold text-slate-700">{elapsed} · {remH}h {remM}m remaining</span>
        <span>7:00 PM</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' as const }}
        />
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: '#10b981', label: 'On Floor' },
    { color: '#f59e0b', label: 'Late' },
    { color: '#38bdf8', label: 'Break' },
    { color: '#8b5cf6', label: 'Float In' },
    { color: '#ef4444', label: 'Called Out' },
    { color: '#94a3b8', label: 'Scheduled' },
  ]
  return (
    <div id="staff-legend" className="flex items-center gap-3 flex-wrap">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: it.color }} />
          <span className="text-[10px] text-slate-500">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div
      id="action-toast"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2"
    >
      <CheckCircle2 size={16} className="text-emerald-400" /> {msg}
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LiveOps() {
  const [units] = useState(getUnits)
  const [events, setEvents] = useState(getEventLog)
  const [stats, setStats] = useState(getShiftStats)
  const [clock, setClock] = useState(formatNow)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [liveActive, setLiveActive] = useState(true)

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(''), 3500)
  }

  // Clock tick every 30s
  useEffect(() => {
    const t = setInterval(() => setClock(formatNow()), 30000)
    return () => clearInterval(t)
  }, [])

  // Auto-generate live events every 28 seconds
  useEffect(() => {
    if (!liveActive) return
    const t = setInterval(() => {
      const newEvent = fireNextEvent(formatNow())
      if (newEvent) {
        setEvents(getEventLog())
        setStats(getShiftStats())
        // scroll feed to top
        if (feedRef.current) feedRef.current.scrollTop = 0
      }
    }, 28000)
    return () => clearInterval(t)
  }, [liveActive])

  const handleAction = useCallback((eventId: string) => {
    doAction(eventId)
    setEvents(getEventLog())
    setStats(getShiftStats())

    const ev = getEventLog().find(e => e.id === eventId)
    const toastMap: Record<string, string> = {
      'Find Coverage':  '✓ Coverage options opened — Float pool notified',
      'Request Float':  '✓ Float request sent — 3 candidates notified',
      'Post to Float':  '✓ Posted to float pool — 2 nurses available',
      'Contact Now':    '✓ Contact initiated — page sent to nurse',
      'Review OT':      '✓ OT review flagged — manager notified',
      'Acknowledge':    '✓ Acknowledged',
      'Early Release?': '✓ Early release check sent to charge nurse',
      'Approve Rate':   '✓ Marketplace rate approved — nurse confirmed',
      'View Incident':  '✓ Incident opened — INC-2026-0847 assigned to you',
      'Prepare Room':   '✓ Room prep order sent to unit clerk',
    }
    showToast(toastMap[ev?.actionLabel ?? ''] ?? '✓ Action completed')
  }, [])

  const selectedUnitData = units.find(u => u.id === selectedUnit)

  // Coverage % color
  const covColor = stats.coveragePct >= 95 ? 'text-emerald-600' : stats.coveragePct >= 85 ? 'text-amber-600' : 'text-red-600'

  return (
    <div id="live-ops-page" className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow">
              <Radio size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Live Shift Operations</h1>
              <p className="text-xs text-slate-500">Day Shift · Mercy General Hospital · Real-time floor status</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <button
                id="live-toggle"
                onClick={() => setLiveActive(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${liveActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                aria-label="Toggle live updates"
              >
                <span className={`relative flex h-2 w-2`}>
                  {liveActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${liveActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </span>
                {liveActive ? 'Live' : 'Paused'}
              </button>
            </div>

            {/* Clock */}
            <div id="live-clock" className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-700">
              <Clock size={14} className="text-slate-400" />
              {clock}
            </div>

            {/* Alert badge */}
            {stats.activeAlerts > 0 && (
              <div id="active-alerts-badge" className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl">
                <AlertTriangle size={13} />
                {stats.activeAlerts} active alert{stats.activeAlerts !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Shift progress */}
        <div className="mt-3">
          <ShiftProgressBar />
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div id="kpi-strip" className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 border-b border-slate-200">
        {[
          { id: 'kpi-on-floor',  label: 'On Floor',    value: `${stats.totalOnFloor}/${stats.totalScheduled}`, sub: 'of scheduled', color: covColor },
          { id: 'kpi-callouts',  label: 'Call-Outs',   value: String(stats.totalCallouts),  sub: 'this shift', color: stats.totalCallouts > 0 ? 'text-red-600' : 'text-emerald-600' },
          { id: 'kpi-late',      label: 'Late / MIA',  value: String(stats.totalLate),      sub: 'unresolved', color: stats.totalLate > 0 ? 'text-amber-600' : 'text-emerald-600' },
          { id: 'kpi-ratio',     label: 'Ratio Alerts',value: String(stats.ratioAlerts),    sub: 'units off target', color: stats.ratioAlerts > 0 ? 'text-red-600' : 'text-emerald-600' },
          { id: 'kpi-census',    label: 'Total Census', value: `${stats.totalCensus}/${stats.totalCapacity}`, sub: 'hospital-wide', color: 'text-slate-800' },
        ].map(k => (
          <div key={k.id} id={k.id} className="bg-white px-5 py-3.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-black leading-none mt-0.5 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="p-5 max-w-screen-xl mx-auto">
        <div className="flex gap-5 items-start">

          {/* ── Left: Unit grid ── */}
          <div className="flex-1 min-w-0">
            {/* Legend */}
            <div className="mb-3">
              <Legend />
            </div>

            {/* Unit cards grid */}
            <div id="unit-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {units.map(u => (
                <UnitCard
                  key={u.id}
                  unit={u}
                  isSelected={selectedUnit === u.id}
                  onSelect={() => setSelectedUnit(prev => prev === u.id ? null : u.id)}
                />
              ))}
            </div>

            {/* Unit detail panel */}
            <AnimatePresence mode="wait">
              {selectedUnit && selectedUnitData && (
                <UnitDetailPanel
                  key={selectedUnit}
                  unit={selectedUnitData}
                  onClose={() => setSelectedUnit(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Live event feed ── */}
          <div className="w-80 xl:w-96 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Feed header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-sm font-bold">Live Event Feed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {liveActive && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/></span>}
                  <span className="text-[10px] text-slate-400">{events.length} events</span>
                </div>
              </div>

              {/* Event list */}
              <div
                id="event-feed"
                ref={feedRef}
                className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-320px)]"
              >
                <AnimatePresence initial={false}>
                  {events.map(ev => (
                    <div key={ev.id} className="px-3 py-2">
                      <EventCard
                        event={ev}
                        onAction={handleAction}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Feed footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center">
                  {liveActive ? `Auto-updating · Next event in ~28s` : 'Updates paused'}
                </p>
              </div>
            </div>

            {/* Priority actions */}
            <div id="priority-actions" className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber-500" />
                <span className="text-sm font-bold text-slate-800">Needs Attention</span>
                {stats.activeAlerts > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">{stats.activeAlerts}</span>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {events
                  .filter(e => e.actionLabel && !e.actionDone && ['critical', 'warning'].includes(e.severity))
                  .map(e => (
                    <div key={e.id} data-id={`priority-${e.id}`} className="flex items-center gap-3 px-4 py-2.5">
                      <EventIcon type={e.type} severity={e.severity} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{e.message}</p>
                        <p className="text-[10px] text-slate-500">{e.time}</p>
                      </div>
                      <button
                        aria-label={`Priority action ${e.id}`}
                        onClick={() => handleAction(e.id)}
                        className="text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                      >
                        Act <ArrowRight size={9} />
                      </button>
                    </div>
                  ))
                }
                {stats.activeAlerts === 0 && (
                  <div className="py-6 text-center">
                    <CheckCircle2 size={18} className="mx-auto mb-1.5 text-emerald-400" />
                    <p className="text-xs text-slate-400">All caught up! No pending actions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} msg={toast} />}
      </AnimatePresence>
    </div>
  )
}
