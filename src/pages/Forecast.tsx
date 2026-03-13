import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, AlertTriangle, DollarSign, Target, CheckCircle2,
  X, ChevronRight, Zap, Loader2, Check, Info, Calendar,
  ArrowRight, BarChart2, Shield,
} from 'lucide-react'
import {
  FORECAST_DAYS, FORECAST_UNITS, getCell, getShortfalls,
  getShortfallForCell, getActionState, setActionState,
  getForecastStats, STATUS_META, ACTION_META,
  type ShortfallDetail, type ProactiveAction, type UnitId,
} from '../data/forecastData'

// ─── Mini SVG trend chart ─────────────────────────────────────────────────────

function MiniTrendChart({
  historical, forecast, width = 320, height = 64,
}: { historical: number[]; forecast: number[]; width?: number; height?: number }) {
  const all = [...historical, ...forecast]
  const min = Math.min(...all) - 5
  const max = Math.max(...all) + 5
  const range = max - min || 1
  const totalPts = historical.length + forecast.length

  function toX(i: number) { return (i / (totalPts - 1)) * (width - 8) + 4 }
  function toY(v: number) { return height - 4 - ((v - min) / range) * (height - 8) }

  // historical line
  const histPath = historical.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`
  ).join(' ')

  // forecast line (dashed)
  const forecastPath = forecast.map((v, i) => {
    const xi = historical.length - 1 + i
    return `${i === 0 ? 'M' : 'L'} ${toX(xi).toFixed(1)} ${toY(v).toFixed(1)}`
  }).join(' ')

  // forecast area
  const lastHistX = toX(historical.length - 1)
  const forecastAreaPath = [
    `M ${lastHistX.toFixed(1)} ${toY(historical[historical.length - 1]).toFixed(1)}`,
    ...forecast.slice(1).map((v, i) => {
      const xi = historical.length + i
      return `L ${toX(xi).toFixed(1)} ${toY(v).toFixed(1)}`
    }),
    `L ${toX(totalPts - 1).toFixed(1)} ${height - 4}`,
    `L ${lastHistX.toFixed(1)} ${height - 4}`,
    'Z',
  ].join(' ')

  // 80% capacity line
  const y80 = toY(80)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* 80% threshold line */}
      <line x1="4" y1={y80.toFixed(1)} x2={width - 4} y2={y80.toFixed(1)}
        stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      <text x={width - 6} y={(y80 - 3).toFixed(1)} fontSize="8" fill="#ef4444" textAnchor="end" opacity="0.7">80%</text>
      {/* Forecast area */}
      <path d={forecastAreaPath} fill="rgba(239,68,68,0.08)" />
      {/* Historical line */}
      <path d={histPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Forecast dashed line */}
      <path d={forecastPath} fill="none" stroke="#ef4444" strokeWidth="2"
        strokeDasharray="4,3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Connecting dot at junction */}
      <circle
        cx={toX(historical.length - 1).toFixed(1)}
        cy={toY(historical[historical.length - 1]).toFixed(1)}
        r="3" fill="#6366f1" />
    </svg>
  )
}

// ─── Census bar ───────────────────────────────────────────────────────────────

function CensusBar({ pct, status }: { pct: number; status: string }) {
  const barColor =
    status === 'critical' ? 'bg-red-500' :
    status === 'tight'    ? 'bg-amber-400' :
    status === 'surplus'  ? 'bg-blue-400' :
    'bg-emerald-400'

  return (
    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className={`h-full rounded-full ${barColor}`}
      />
    </div>
  )
}

// ─── Forecast grid cell ───────────────────────────────────────────────────────

interface GridCellProps {
  unitId: UnitId
  unitIdx: number
  dayIdx: number
  selected: boolean
  onClick: () => void
}
function GridCell({ unitId, unitIdx, dayIdx, selected, onClick }: GridCellProps) {
  const cell = getCell(unitIdx, dayIdx)
  const meta = STATUS_META[cell.status]
  const shortfall = getShortfallForCell(unitId, dayIdx)
  const hasIssue = cell.status === 'critical' || cell.status === 'tight'

  return (
    <motion.button
      onClick={onClick}
      data-id={`forecast-cell-${unitId}-${dayIdx}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1, ease: 'easeOut' as const }}
      className={`relative w-full rounded-lg border p-2 text-left transition-all cursor-pointer ${meta.bg} ${meta.border} ${
        selected ? `ring-2 ${meta.ringColor} shadow-lg` : 'hover:shadow-md'
      }`}
    >
      {/* Census bar */}
      <CensusBar pct={cell.censusPercent} status={cell.status} />

      {/* Staff ratio */}
      <div className={`mt-1.5 text-center font-bold text-xs leading-tight ${
        hasIssue ? meta.text : 'text-slate-600'
      }`}>
        {cell.scheduledStaff}/{cell.requiredStaff}
      </div>

      {/* Census % */}
      <div className={`text-center text-[10px] leading-none ${meta.text} opacity-80`}>
        {cell.censusPercent}%
      </div>

      {/* Critical pulsing dot */}
      {cell.status === 'critical' && !selected && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}

      {/* Gap indicator */}
      {hasIssue && shortfall && (
        <div className={`text-center text-[9px] font-bold mt-0.5 ${meta.text}`}>
          {cell.gap}
        </div>
      )}
    </motion.button>
  )
}

// ─── Action button ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  action: ProactiveAction
  shortfallId: string
}
function ActionButton({ action, shortfallId }: ActionButtonProps) {
  const [localState, setLocalState] = useState<'idle' | 'loading' | 'done'>(
    getActionState(`${shortfallId}-${action.id}`) === 'sent' ? 'done' : 'idle'
  )
  const meta = ACTION_META[action.type]

  function handleClick() {
    if (localState !== 'idle') return
    setLocalState('loading')
    setTimeout(() => {
      setActionState(`${shortfallId}-${action.id}`, 'sent')
      setLocalState('done')
    }, 900)
  }

  const priorityBadge =
    action.priority === 'urgent' ? 'bg-red-100 text-red-700' :
    action.priority === 'high'   ? 'bg-amber-100 text-amber-700' :
    'bg-slate-100 text-slate-600'

  return (
    <motion.div
      layout
      aria-label={`Action ${action.id}`}
      className={`rounded-xl border p-3.5 transition-all ${
        localState === 'done'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white hover:border-violet-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${meta.bg}`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{action.label}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${priorityBadge}`}>
              {action.priority}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">{action.detail}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Saves ${action.saving.toLocaleString()} vs reactive</p>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={localState !== 'idle'}
        className={`mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all ${
          localState === 'done'
            ? 'bg-emerald-100 text-emerald-700 cursor-default'
            : localState === 'loading'
            ? 'bg-slate-100 text-slate-400 cursor-wait'
            : `${meta.bg} ${meta.color} hover:opacity-90`
        }`}
      >
        {localState === 'loading' ? <><Loader2 size={11} className="animate-spin" /> Sending…</> :
         localState === 'done'    ? <><Check size={11} /> Sent!</> :
         <>{action.label} <ArrowRight size={11} /></>}
      </button>
    </motion.div>
  )
}

// ─── Shortfall detail panel ───────────────────────────────────────────────────

interface DetailPanelProps {
  shortfall: ShortfallDetail | null
  onClose: () => void
}
function DetailPanel({ shortfall, onClose }: DetailPanelProps) {
  const unit = shortfall ? FORECAST_UNITS.find(u => u.id === shortfall.unitId) : null

  return (
    <AnimatePresence>
      {shortfall && unit && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-30"
          />
          <motion.div
            key="panel"
            id="forecast-detail-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
            className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`${unit.accent} px-5 py-4 shrink-0`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/80 text-xs font-semibold uppercase">
                  {STATUS_META[shortfall.status].label} · {shortfall.confidence}% confidence
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close forecast detail"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {shortfall.unitName}
              </h2>
              <p className="text-white/80 text-sm">{shortfall.dayLabel} · Predicted {shortfall.censusPct}% census</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Staffing summary */}
              <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: 'Required',  value: shortfall.requiredStaff, color: 'text-slate-700' },
                    { label: 'Scheduled', value: shortfall.scheduledStaff, color: 'text-slate-700' },
                    { label: 'Gap',       value: shortfall.gap, color: shortfall.gap < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-[11px] text-slate-400">{label}</p>
                      <p className={`text-xl font-bold ${color}`}>{value > 0 ? value : value}</p>
                    </div>
                  ))}
                </div>

                {/* Cost comparison */}
                <div className="bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-200 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-center">
                      <p className="text-slate-500">Reactive cost</p>
                      <p className="font-bold text-red-600 text-base">${shortfall.costIfReactive.toLocaleString()}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                    <div className="text-center">
                      <p className="text-slate-500">Proactive cost</p>
                      <p className="font-bold text-emerald-600 text-base">${shortfall.costIfProactive.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-l border-slate-200 pl-3">
                      <p className="text-slate-500">You save</p>
                      <p className="font-bold text-emerald-700 text-base">
                        ${(shortfall.costIfReactive - shortfall.costIfProactive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why is census predicted high */}
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                  <Info size={12} />
                  Why This Prediction
                </h3>
                <ul className="space-y-1.5">
                  {shortfall.drivers.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trend chart */}
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                  <BarChart2 size={12} />
                  Census Trend · {shortfall.unitName}
                </h3>
                <MiniTrendChart
                  historical={shortfall.historicalCensus}
                  forecast={shortfall.forecastCensus}
                  height={72}
                />
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-6 h-0.5 bg-indigo-400 rounded" /> 15-day history
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-6 h-0.5 bg-red-400 rounded border-t border-dashed border-red-400" /> 7-day forecast
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-6 h-px bg-red-300 border-t border-dashed" /> 80% threshold
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <Zap size={12} className="text-violet-500" />
                  Recommended Actions
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold ml-auto">
                    Act now, save ${(shortfall.costIfReactive - shortfall.costIfProactive).toLocaleString()}
                  </span>
                </h3>
                <div className="space-y-2.5">
                  {shortfall.actions.map(action => (
                    <ActionButton key={action.id} action={action} shortfallId={shortfall.id} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Shortfall alert card (horizontal strip) ───────────────────────────────────

interface ShortfallCardProps {
  sf: ShortfallDetail
  onSelect: () => void
}
function ShortfallAlertCard({ sf, onSelect }: ShortfallCardProps) {
  const meta = STATUS_META[sf.status]
  const unit = FORECAST_UNITS.find(u => u.id === sf.unitId)!

  return (
    <motion.button
      onClick={onSelect}
      data-id={`shortfall-alert-${sf.id}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' as const }}
      className={`flex-shrink-0 w-56 rounded-xl border-2 p-3.5 text-left transition-all shadow-sm hover:shadow-md ${meta.border} ${meta.bg}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`${unit.accent} text-white text-[10px] font-bold px-2 py-0.5 rounded-md`}>
          {unit.short}
        </div>
        <span className={`text-[10px] font-bold uppercase ${meta.text}`}>{meta.label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-tight">{sf.dayLabel}</p>
      <p className={`text-xs font-bold mt-1 ${meta.text}`}>
        {sf.scheduledStaff}/{sf.requiredStaff} staff · {Math.abs(sf.gap)} short
      </p>
      <p className="text-[11px] text-slate-500 mt-1 leading-snug truncate">{sf.drivers[0]}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-400">{sf.confidence}% confident</span>
        <span className="text-[10px] font-semibold text-emerald-600">
          Save ${(sf.costIfReactive - sf.costIfProactive).toLocaleString()} →
        </span>
      </div>
    </motion.button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Forecast() {
  const [selectedCell, setSelectedCell] = useState<{ unitId: UnitId; dayIdx: number } | null>(null)
  const [showConfidence, setShowConfidence] = useState(false)

  const stats = useMemo(() => getForecastStats(), [])
  const shortfalls = useMemo(() => getShortfalls(), [])

  const selectedShortfall = selectedCell
    ? getShortfallForCell(selectedCell.unitId, selectedCell.dayIdx) ?? null
    : null

  function handleCellClick(unitId: UnitId, unitIdx: number, dayIdx: number) {
    const cell = getCell(unitIdx, dayIdx)
    if (cell.status === 'ok' || cell.status === 'surplus') return
    if (selectedCell?.unitId === unitId && selectedCell?.dayIdx === dayIdx) {
      setSelectedCell(null)
    } else {
      setSelectedCell({ unitId, dayIdx })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-violet-600" />
              7-Day Demand Forecast
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Predictive census & staffing · Fri Mar 13 – Thu Mar 19, 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfidence(v => !v)}
              aria-label="Toggle confidence display"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all border ${
                showConfidence ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200'
              }`}
            >
              <Shield size={13} />
              Confidence
            </button>
            <div id="forecast-accuracy" className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <Target size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                {stats.historicalAccuracy}% forecast accuracy (30d)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-screen-xl mx-auto space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              id: 'stat-shortfalls',
              icon: AlertTriangle,
              label: 'Predicted Shortfalls',
              value: stats.totalShortfalls.toString(),
              sub: `${stats.criticalCount} critical`,
              color: stats.criticalCount > 0 ? 'text-red-700' : 'text-amber-700',
              bg: stats.criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
            },
            {
              id: 'stat-cost-reactive',
              icon: DollarSign,
              label: 'Cost If Reactive',
              value: `$${(stats.costIfReactive / 1000).toFixed(1)}K`,
              sub: 'Agency + emergency OT',
              color: 'text-red-700',
              bg: 'bg-red-50 border-red-200',
            },
            {
              id: 'stat-savings',
              icon: CheckCircle2,
              label: 'Act-Now Savings',
              value: `$${(stats.savings / 1000).toFixed(1)}K`,
              sub: 'Proactive vs reactive',
              color: 'text-emerald-700',
              bg: 'bg-emerald-50 border-emerald-200',
            },
            {
              id: 'stat-confidence',
              icon: Target,
              label: 'Avg Confidence',
              value: `${stats.avgConfidence}%`,
              sub: 'Across all predictions',
              color: 'text-violet-700',
              bg: 'bg-violet-50 border-violet-200',
            },
          ].map(({ id, icon: Icon, label, value, sub, color, bg }) => (
            <div key={id} id={id} className={`rounded-xl border p-4 flex items-center gap-3 bg-white ${bg}`}>
              <Icon size={20} className={color} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shortfall alert strip */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Predicted Shortfalls — Click to Act
            </h2>
            <span className="text-xs text-slate-500">Sorted by urgency · proactive action saves avg $740/shortfall</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" id="shortfall-strip">
            {shortfalls.map(sf => (
              <ShortfallAlertCard
                key={sf.id}
                sf={sf}
                onSelect={() => setSelectedCell({ unitId: sf.unitId, dayIdx: sf.dayIdx })}
              />
            ))}
          </div>
        </div>

        {/* Forecast grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-violet-600" />
              7-Day Forecast Grid
              <span className="text-xs font-normal text-slate-400 ml-1">
                Click a critical or tight cell to see recommendations
              </span>
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {[
                { label: 'Critical',  color: 'bg-red-400' },
                { label: 'Tight',     color: 'bg-amber-400' },
                { label: 'OK',        color: 'bg-emerald-400' },
                { label: 'Surplus',   color: 'bg-blue-400' },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            {/* Day header row */}
            <div className="grid gap-2 mb-2"
              style={{ gridTemplateColumns: '100px repeat(7, minmax(80px, 1fr))' }}>
              <div /> {/* Unit label spacer */}
              {FORECAST_DAYS.map(day => (
                <div key={day.dayIdx}
                  className={`text-center py-1 rounded-lg text-xs font-semibold ${
                    day.isWeekend ? 'bg-slate-100 text-slate-500' : 'text-slate-600'
                  }`}
                >
                  <div className="font-bold">{day.short}</div>
                  <div className="text-[10px] opacity-70">{day.date}</div>
                </div>
              ))}
            </div>

            {/* Unit rows */}
            {FORECAST_UNITS.map((unit, unitIdx) => (
              <div key={unit.id} className="grid gap-2 mb-2"
                style={{ gridTemplateColumns: '100px repeat(7, minmax(80px, 1fr))' }}>
                {/* Unit label */}
                <div className={`${unit.accent} text-white text-xs font-bold px-2.5 py-2 rounded-lg flex items-center justify-center text-center leading-tight min-h-[56px]`}>
                  {unit.short}
                </div>
                {/* Day cells */}
                {FORECAST_DAYS.map(day => (
                  <GridCell
                    key={day.dayIdx}
                    unitId={unit.id}
                    unitIdx={unitIdx}
                    dayIdx={day.dayIdx}
                    selected={selectedCell?.unitId === unit.id && selectedCell?.dayIdx === day.dayIdx}
                    onClick={() => handleCellClick(unit.id, unitIdx, day.dayIdx)}
                  />
                ))}
              </div>
            ))}

            {/* Confidence row (toggleable) */}
            <AnimatePresence>
              {showConfidence && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' as const }}
                  id="confidence-row"
                  className="overflow-hidden"
                >
                  <div className="grid gap-2 mt-2 border-t border-slate-100 pt-2"
                    style={{ gridTemplateColumns: '100px repeat(7, minmax(80px, 1fr))' }}>
                    <div className="flex items-center justify-end pr-2">
                      <span className="text-[10px] text-slate-400 font-medium">Confidence</span>
                    </div>
                    {FORECAST_DAYS.map(day => {
                      // avg confidence for this day across units
                      const avgConf = Math.round(
                        FORECAST_UNITS.map((_, ui) => getCell(ui, day.dayIdx).confidence)
                          .reduce((a, b) => a + b, 0) / FORECAST_UNITS.length
                      )
                      return (
                        <div key={day.dayIdx} className="text-center py-1">
                          <span className={`text-[11px] font-semibold ${
                            avgConf >= 88 ? 'text-emerald-600' : avgConf >= 84 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {avgConf}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid legend */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-[11px] text-slate-400">
              Each cell: <strong>scheduled/required</strong> staff · census% · Click critical/tight cells for recommendations
              · Confidence: {stats.avgConfidence}% avg · Based on 15-week historical patterns
            </p>
          </div>
        </div>

        {/* How forecasting works */}
        <div id="forecast-methodology" className="bg-gradient-to-br from-violet-50 to-slate-50 rounded-2xl border border-violet-200 p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <Info size={15} className="text-violet-600" />
            How the Forecast Works
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2, step: '1', title: 'Historical Pattern Analysis',
                desc: '15 weeks of census data analyzed by unit, day-of-week, season, and local events.',
              },
              {
                icon: TrendingUp, step: '2', title: 'Demand Prediction Model',
                desc: 'ML model predicts next-7-day census with 94% accuracy. Flags days above 80% capacity.',
              },
              {
                icon: Zap, step: '3', title: 'Proactive Action Engine',
                desc: 'For each predicted shortfall, recommends the lowest-cost staffing action 48–72h in advance.',
              },
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

      {/* Detail panel */}
      <DetailPanel
        shortfall={selectedShortfall}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  )
}
