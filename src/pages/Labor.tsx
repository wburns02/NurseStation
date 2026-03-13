import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  Star,
  Clock,
  RefreshCw,
} from 'lucide-react'
import {
  daySummary,
  costTrend14d,
  unitSnapshots,
  gapFillOptions,
  otLeaderboard,
  weekForecast,
  weekTotals,
  payPeriodSummary,
  FILL_TYPE_META,
  formatCurrency,
  formatDollar,
  type GapFillOption,
  type FillOption,
} from '../data/laborData'

// ─── module-level: track applied fills ────────────────────────────────────────
let _appliedFills = new Set<string>()  // gapId → applied fill type

// ─── Animated spend ring ──────────────────────────────────────────────────────
function SpendRing({
  spent,
  budget,
  size = 160,
}: {
  spent: number
  budget: number
  size?: number
}) {
  const [animated, setAnimated] = useState(false)
  const pct = Math.min(1, spent / budget)
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const stroke = animated ? circ * (1 - pct) : circ
  const over = pct > 1
  const color = over ? '#ef4444' : pct > 0.9 ? '#f59e0b' : '#8b5cf6'

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.09} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={circ}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900 leading-none">
          {formatCurrency(spent)}
        </span>
        <span className="text-[11px] text-slate-500 mt-1">of {formatCurrency(budget)}</span>
        <span className={`text-xs font-bold mt-1 ${over ? 'text-red-600' : pct > 0.9 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {Math.round(pct * 100)}% of budget
        </span>
      </div>
    </div>
  )
}

// ─── 14-day trend sparkline ───────────────────────────────────────────────────
function CostTrendChart({ height = 120 }: { height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement)
    return () => obs.disconnect()
  }, [])

  const data = costTrend14d
  const n = data.length
  const maxV = Math.max(...data.map(d => Math.max(d.actual, d.budget))) * 1.08
  const minV = Math.min(...data.map(d => Math.min(d.actual, d.budget))) * 0.95
  const range = maxV - minV
  const pad = { top: 12, right: 16, bottom: 28, left: 8 }
  const iW = width - pad.left - pad.right
  const iH = height - pad.top - pad.bottom

  function xOf(i: number) { return pad.left + (i / (n - 1)) * iW }
  function yOf(v: number) { return pad.top + (1 - (v - minV) / range) * iH }

  const actualPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.actual).toFixed(1)}`).join(' ')
  const budgetPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.budget).toFixed(1)}`).join(' ')

  const todayIdx = data.findIndex((_, i) => i === n - 1)

  return (
    <svg ref={svgRef} width="100%" height={height} className="overflow-visible">
      {/* Budget line */}
      <path d={budgetPath} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />

      {/* Actual area fill */}
      <defs>
        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path
        d={`${actualPath} L${xOf(n-1).toFixed(1)},${pad.top + iH} L${xOf(0).toFixed(1)},${pad.top + iH} Z`}
        fill="url(#actualGrad)"
      />

      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Over-budget dots */}
      {data.map((d, i) => {
        const over = d.actual > d.budget
        return over ? (
          <circle key={i} cx={xOf(i)} cy={yOf(d.actual)} r={3.5} fill="#ef4444" stroke="white" strokeWidth={1.5} />
        ) : null
      })}

      {/* Today dot */}
      <circle cx={xOf(todayIdx)} cy={yOf(data[todayIdx].actual)} r={5} fill="#8b5cf6" stroke="white" strokeWidth={2} />

      {/* X-axis labels */}
      {data.map((d, i) => (
        i % 2 === 0 && (
          <text key={i} x={xOf(i)} y={height - 4} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>
            {d.date.replace('Feb ', 'F').replace('Mar ', 'M')}
          </text>
        )
      ))}

      {/* Budget label */}
      <text x={xOf(0)} y={yOf(data[0].budget) - 5} className="fill-slate-400" style={{ fontSize: 9 }}>Budget</text>
    </svg>
  )
}

// ─── Week forecast bar chart ──────────────────────────────────────────────────
function WeekForecastChart() {
  const data = weekForecast
  const maxV = Math.max(...data.map(d => Math.max(d.projectedSpend, d.budget))) * 1.1

  return (
    <div className="flex items-end gap-2 h-24 pt-2">
      {data.map(day => {
        const pct = (day.projectedSpend / maxV) * 100
        const budgetPct = (day.budget / maxV) * 100
        const over = day.projectedSpend > day.budget
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 relative">
            {/* Bar */}
            <div className="relative w-full flex items-end" style={{ height: 72 }}>
              {/* Budget line */}
              <div
                className="absolute inset-x-0 border-t-2 border-dashed border-slate-300"
                style={{ bottom: `${budgetPct}%` }}
              />
              {/* Spend bar */}
              <motion.div
                className={`w-full rounded-sm ${
                  day.isToday
                    ? 'bg-violet-500'
                    : day.isPast
                    ? over ? 'bg-red-400' : 'bg-emerald-400'
                    : over ? 'bg-red-200' : 'bg-slate-200'
                }`}
                style={{ height: `${pct}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              />
              {day.gapCount > 0 && !day.isPast && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="text-[9px] font-bold text-orange-600">{day.gapCount}g</span>
                </div>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${day.isToday ? 'text-violet-600' : 'text-slate-500'}`}>
              {day.dayLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Gap cost optimizer card ──────────────────────────────────────────────────
function GapCard({
  gap,
  applied,
  onApply,
}: {
  gap: GapFillOption
  applied: string | null
  onApply: (gapId: string, fillType: string, staffName: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const recommended = gap.options.find(o => o.recommended && o.available)
  const cheapest = gap.options.filter(o => o.available).sort((a, b) => a.shiftCost - b.shiftCost)[0]
  const mostExpensive = gap.options.filter(o => o.available).sort((a, b) => b.shiftCost - a.shiftCost)[0]
  const savings = mostExpensive && cheapest ? mostExpensive.shiftCost - cheapest.shiftCost : 0

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden ${applied ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${applied ? 'bg-emerald-500' : 'bg-orange-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{gap.unitShortName}</span>
            <span className="text-xs text-slate-500">{gap.shiftLabel}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{gap.role}</span>
            <span className="text-[10px] text-slate-400">{gap.date}</span>
          </div>
          {!applied && savings > 0 && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Save ${savings} by choosing cheapest vs most expensive option
            </p>
          )}
          {applied && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={11} /> Coverage requested — awaiting confirmation
            </p>
          )}
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Options */}
      <AnimatePresence initial={false}>
        {expanded && !applied && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {gap.options.map(opt => (
                <FillOptionRow
                  key={opt.type + (opt.staffName ?? '')}
                  option={opt}
                  isCheapest={opt === cheapest}
                  isRecommended={opt === recommended}
                  onApply={() => onApply(gap.gapId, opt.type, opt.staffName ?? 'Staff')}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FillOptionRow({
  option,
  isCheapest,
  isRecommended,
  onApply,
}: {
  option: FillOption
  isCheapest: boolean
  isRecommended: boolean
  onApply: () => void
}) {
  const meta = FILL_TYPE_META[option.type]
  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
      !option.available ? 'opacity-50 border-slate-200 bg-slate-50' :
      isRecommended ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      {/* Left: type badge */}
      <div className="shrink-0">
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {/* Middle: staff info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 truncate">
            {option.staffName ?? 'TBD'}
          </span>
          {isRecommended && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full">
              <Star size={9} /> Recommended
            </span>
          )}
          {isCheapest && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
              Cheapest
            </span>
          )}
          {option.matchScore && (
            <span className="text-[10px] text-slate-500">Match {option.matchScore}%</span>
          )}
        </div>
        {option.note && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{option.note}</p>
        )}
      </div>

      {/* Right: cost + action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-black text-slate-900">${option.shiftCost}</p>
          <p className="text-[10px] text-slate-400">${option.rate}/hr</p>
        </div>
        {option.available ? (
          <button
            onClick={onApply}
            className="text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            aria-label={`Request ${option.staffName ?? 'staff'} for this gap`}
          >
            Request
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Unavailable</span>
        )}
      </div>
    </div>
  )
}

// ─── OT Exposure row ──────────────────────────────────────────────────────────
function OTRow({ entry }: { entry: typeof otLeaderboard[0] }) {
  const pct = Math.min(100, (entry.hoursWorked / entry.otThreshold) * 100)
  const barColor = entry.riskLevel === 'critical' ? 'bg-red-500' : entry.riskLevel === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
        entry.riskLevel === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-700' :
        entry.riskLevel === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
        'bg-gradient-to-br from-emerald-500 to-emerald-700'
      }`}>
        {entry.name.split(' ').map(w => w[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 truncate">{entry.name}</span>
          <span className="text-[10px] text-slate-400">{entry.unit}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-32">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{entry.hoursWorked}h / {entry.otThreshold}h</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {entry.otCostAccrued > 0 ? (
          <p className="text-sm font-bold text-red-600">+${entry.otCostAccrued}</p>
        ) : (
          <p className="text-xs text-slate-400">{entry.hoursToNextOT}h to OT</p>
        )}
        {entry.riskLevel !== 'low' && (
          <span className={`text-[10px] font-bold ${entry.riskLevel === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
            {entry.riskLevel === 'critical' ? '⚠ In OT' : '↑ At Risk'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function LaborStatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ElementType
  trend?: 'up-bad' | 'up-good' | 'down-bad' | 'down-good' | 'neutral'
}) {
  const TIcon = trend?.startsWith('up') ? TrendingUp : trend?.startsWith('down') ? TrendingDown : null
  const tColor = trend === 'up-bad' || trend === 'down-bad' ? 'text-red-500' : trend === 'up-good' || trend === 'down-good' ? 'text-emerald-500' : 'text-slate-400'
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
          {TIcon && <TIcon size={14} className={tColor} />}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Unit cost table row ──────────────────────────────────────────────────────
function UnitCostRow({ snap, rank }: { snap: typeof unitSnapshots[0]; rank: number }) {
  const pct = snap.projectedSpend / snap.dailyBudget
  const over = pct > 1
  const varAbs = Math.abs(snap.variance)

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4 font-mono">{rank}</span>
          <span className="text-sm font-semibold text-slate-900">{snap.shortName}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-sm font-mono text-slate-700">${snap.projectedSpend.toLocaleString()}</td>
      <td className="py-2.5 px-3 text-sm font-mono text-slate-500">${snap.dailyBudget.toLocaleString()}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 0.9 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${over ? 'text-red-600' : pct > 0.9 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-xs font-bold ${over ? 'text-red-600' : 'text-emerald-600'}`}>
          {over ? `+$${varAbs.toLocaleString()}` : `-$${varAbs.toLocaleString()}`}
        </span>
      </td>
      <td className="py-2.5 px-3">
        {snap.otHours > 0 ? (
          <span className="text-xs text-red-600 font-semibold">{snap.otHours}h OT</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="py-2.5 px-3">
        {snap.openGaps > 0 ? (
          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            {snap.openGaps} gap{snap.openGaps > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={11} /> Full
          </span>
        )}
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Labor() {
  const [appliedFills, setAppliedFills] = useState(new Set(_appliedFills))
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'variance' | 'spend' | 'unit'>('variance')
  const [infoTooltip, setInfoTooltip] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [refreshKey])

  function handleApplyFill(gapId: string, fillType: string, staffName: string) {
    const next = new Set(appliedFills)
    next.add(gapId)
    setAppliedFills(next)
    _appliedFills = next
    // In real app: fire API call here
    void fillType
    void staffName
  }

  function handleApplyAll() {
    const next = new Set(appliedFills)
    gapFillOptions.forEach(g => next.add(g.gapId))
    setAppliedFills(next)
    _appliedFills = next
  }

  function handleRefresh() {
    setLoading(true)
    setRefreshKey(k => k + 1)
  }

  const gaps = gapFillOptions.filter(g => !appliedFills.has(g.gapId))
  const filledCount = appliedFills.size
  const totalSavingsAvailable = gapFillOptions.reduce((s, g) => {
    const opts = g.options.filter(o => o.available)
    const cheapest = opts.sort((a, b) => a.shiftCost - b.shiftCost)[0]
    const expensive = opts.sort((a, b) => b.shiftCost - a.shiftCost)[0]
    return s + (expensive && cheapest ? expensive.shiftCost - cheapest.shiftCost : 0)
  }, 0)

  const sortedUnits = [...unitSnapshots].sort((a, b) => {
    if (sortBy === 'variance') return b.variance - a.variance
    if (sortBy === 'spend') return b.projectedSpend - a.projectedSpend
    return a.shortName.localeCompare(b.shortName)
  })

  const overBudgetUnits = unitSnapshots.filter(u => u.projectedSpend > u.dailyBudget)
  const weekVariance = weekTotals.varianceThisWeek

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign size={20} className="text-violet-500" />
              Labor Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time spend tracking · OT exposure · Gap cost optimizer
              <span className="ml-2 text-violet-600 font-semibold">Mar 12, 2026 · Day Shift</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {gaps.length > 0 && (
              <button
                onClick={handleApplyAll}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                aria-label="Apply all recommended fills"
              >
                <Zap size={14} />
                Fill All ({gaps.length}) · Save ${totalSavingsAvailable}
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh data"
              aria-label="Refresh labor data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudgetUnits.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-3"
        >
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            <span className="font-bold">{overBudgetUnits.length} unit{overBudgetUnits.length > 1 ? 's' : ''}</span> over today's budget:{' '}
            {overBudgetUnits.map(u => u.shortName).join(', ')}
          </p>
          <div className="ml-auto text-xs text-red-600 font-semibold">
            Total overage: ${overBudgetUnits.reduce((s, u) => s + Math.max(0, u.variance), 0).toLocaleString()}
          </div>
        </motion.div>
      )}

      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Top stats row ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <LaborStatCard
              label="Today Projected"
              value={formatCurrency(daySummary.projectedSpend)}
              sub={`Budget ${formatCurrency(daySummary.dailyBudget)}`}
              color={daySummary.projectedSpend > daySummary.dailyBudget ? 'bg-red-500' : 'bg-violet-500'}
              icon={DollarSign}
              trend={daySummary.projectedSpend > daySummary.dailyBudget ? 'up-bad' : 'down-good'}
            />
            <LaborStatCard
              label="Week Variance"
              value={`${weekVariance >= 0 ? '+' : ''}${formatCurrency(weekVariance)}`}
              sub={`of ${formatCurrency(weekTotals.weeklyBudget)} weekly budget`}
              color={weekVariance > 0 ? 'bg-amber-500' : 'bg-emerald-500'}
              icon={TrendingUp}
              trend={weekVariance > 2000 ? 'up-bad' : weekVariance > 0 ? 'neutral' : 'down-good'}
            />
            <LaborStatCard
              label="OT Premium Cost"
              value={formatCurrency(weekTotals.otTotalCost + 840)}
              sub="Pay period to date"
              color="bg-red-500"
              icon={Clock}
              trend="up-bad"
            />
            <LaborStatCard
              label="Open Gaps"
              value={`${daySummary.openGapCount - filledCount}`}
              sub={filledCount > 0 ? `${filledCount} requests sent` : `$${totalSavingsAvailable} savings available`}
              color={daySummary.openGapCount - filledCount === 0 ? 'bg-emerald-500' : 'bg-orange-500'}
              icon={Users}
              trend="neutral"
            />
          </motion.div>
        )}

        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* LEFT: Today ring + breakdown + week forecast */}
          <div className="xl:col-span-4 space-y-4">

            {/* Today's spend ring */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Today's Labor Spend</h2>
                <button
                  onMouseEnter={() => setInfoTooltip('projected')}
                  onMouseLeave={() => setInfoTooltip(null)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Info about today's spend"
                >
                  <Info size={13} />
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center"><div className="w-40 h-40 rounded-full bg-slate-200 animate-pulse" /></div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <SpendRing spent={daySummary.projectedSpend} budget={daySummary.dailyBudget} size={160} />
                  </div>

                  {/* Cost type breakdown */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: 'Regular Pay',   value: daySummary.regularPay,   color: 'bg-emerald-500', pct: daySummary.regularPay / daySummary.projectedSpend },
                      { label: 'OT Premium',    value: daySummary.otPremium,    color: 'bg-red-500',     pct: daySummary.otPremium / daySummary.projectedSpend },
                      { label: 'Float Pool',    value: daySummary.floatPremium, color: 'bg-blue-500',    pct: daySummary.floatPremium / daySummary.projectedSpend },
                      { label: 'Per Diem',      value: daySummary.perDiem,      color: 'bg-amber-500',   pct: daySummary.perDiem / daySummary.projectedSpend },
                    ].filter(r => r.value > 0).map(row => (
                      <div key={row.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                        <span className="text-xs text-slate-600 flex-1">{row.label}</span>
                        <span className="text-xs font-bold text-slate-700">${row.value.toLocaleString()}</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${Math.round(row.pct * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Open gap opportunity */}
                  {daySummary.openGapCount > filledCount && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-800 font-semibold">
                        {daySummary.openGapCount - filledCount} unfilled gap{daySummary.openGapCount - filledCount > 1 ? 's' : ''} · Est. patient safety risk
                      </p>
                      <p className="text-[11px] text-orange-600 mt-0.5">
                        Optimal fill saves ${totalSavingsAvailable} vs worst case
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pay period progress */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Pay Period Progress</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{payPeriodSummary.label}</span>
                    <span>Day {payPeriodSummary.daysElapsed}/{payPeriodSummary.totalDays}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${(payPeriodSummary.daysElapsed / payPeriodSummary.totalDays) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-black text-slate-900">{formatCurrency(payPeriodSummary.spentSoFar)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Spent So Far</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className={`text-lg font-black ${payPeriodSummary.projectedPeriodEnd > payPeriodSummary.periodBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(payPeriodSummary.projectedPeriodEnd)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Projected End</p>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-[11px] text-slate-500">
                      Period budget: <span className="font-bold text-slate-700">{formatCurrency(payPeriodSummary.periodBudget)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Week forecast */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">This Week Forecast</h2>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Today</span>
                  <span className="flex items-center gap-1">- - Budget</span>
                </div>
              </div>
              {loading ? (
                <div className="h-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <>
                  <WeekForecastChart />
                  <div className="mt-3 flex justify-between text-[11px]">
                    <span className="text-slate-500">
                      Week total: <span className="font-bold text-slate-700">{formatCurrency(weekTotals.projectedTotal)}</span>
                    </span>
                    <span className={weekVariance > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {weekVariance > 0 ? `+${formatCurrency(weekVariance)} over` : `${formatDollar(weekVariance)} under`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Gap optimizer + unit table + OT leaderboard */}
          <div className="xl:col-span-8 space-y-4">

            {/* Gap Cost Optimizer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gap Cost Optimizer</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {gaps.length > 0
                      ? `${gaps.length} open gap${gaps.length > 1 ? 's' : ''} · Choose cheapest qualified staff`
                      : 'All gap requests sent — awaiting confirmations'}
                  </p>
                </div>
                {gaps.length === 0 && filledCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={13} /> {filledCount} request{filledCount > 1 ? 's' : ''} sent
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {gaps.length === 0 ? (
                    <div className="py-10 text-center">
                      <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
                      <p className="text-base font-bold text-slate-700">All gaps filled!</p>
                      <p className="text-sm text-slate-400 mt-1">Coverage requests sent to staff · Awaiting confirmations</p>
                      <Link
                        to="/notifications"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-violet-600 hover:underline font-semibold"
                      >
                        Monitor confirmations in Notifications <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    gaps.map(gap => (
                      <GapCard
                        key={gap.gapId}
                        gap={gap}
                        applied={appliedFills.has(gap.gapId) ? gap.gapId : null}
                        onApply={handleApplyFill}
                      />
                    ))
                  )}

                  {/* Applied fills (collapsed) */}
                  {filledCount > 0 && gaps.length > 0 && (
                    <div className="border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        {filledCount} gap{filledCount > 1 ? 's' : ''} filled · requests sent
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unit Cost Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Unit Cost Breakdown</h2>
                <div className="flex items-center gap-1">
                  {(['variance', 'spend', 'unit'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                        sortBy === s ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      aria-label={`Sort by ${s}`}
                    >
                      {s === 'variance' ? 'Variance' : s === 'spend' ? 'Spend' : 'Unit'}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-200 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-2 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Unit</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Projected</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Budget</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Usage</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Variance</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">OT</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUnits.map((snap, i) => (
                        <UnitCostRow key={snap.unitId} snap={snap} rank={i + 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* OT Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">OT Exposure — Pay Period</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Staff near or over OT threshold · Avoid assigning them to gaps</p>
                </div>
                <Link
                  to="/staff"
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  View All <ChevronRight size={12} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />)}
                </div>
              ) : (
                <div>
                  {otLeaderboard.map(entry => (
                    <OTRow key={entry.staffId} entry={entry} />
                  ))}
                </div>
              )}
            </div>

            {/* 14-day trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">14-Day Cost Trend</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block" /> Actual</span>
                    <span className="ml-3 inline-flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" /> Budget</span>
                    <span className="ml-3 inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Over budget</span>
                  </p>
                </div>
              </div>
              {loading ? (
                <div className="h-32 bg-slate-200 rounded animate-pulse" />
              ) : (
                <CostTrendChart height={130} />
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-4">
          Data reflects pay period Mar 9–22, 2026. Labor costs projected based on current schedule.
        </p>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {infoTooltip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl max-w-64 z-50"
          >
            {infoTooltip === 'projected' && "Today's projected spend includes all 3 shifts based on currently scheduled staff plus any OT, float pool, and per-diem assignments."}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
