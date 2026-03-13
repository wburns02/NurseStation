import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, DollarSign, AlertTriangle,
  CheckCircle2, Users, BarChart2, ArrowRight, X,
  Zap, Target, Brain, RefreshCw, ChevronRight,
} from 'lucide-react'
import {
  getUnits, getShiftSummary, getRecommendations,
  applyRecommendation, dismissRecommendation, applyFloat,
  MATRIX_TABLE,
  type UnitProductivity, type SmartRecommendation, type ProdStatus,
} from '../data/productivityData'

// ── Mini sparkline (SVG path from array of values) ───────────────────────────

function Sparkline({ data, color, budget }: { data: number[]; color: string; budget: number }) {
  const w = 120, h = 36, pad = 2
  const min = Math.min(...data) - 0.5
  const max = Math.max(...data) + 0.5
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - 2 * pad))
  const ys = data.map(v => h - pad - ((v - min) / (max - min)) * (h - 2 * pad))
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const budgetY = h - pad - ((budget - min) / (max - min)) * (h - 2 * pad)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <line x1={pad} y1={budgetY} x2={w - pad} y2={budgetY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color} />
    </svg>
  )
}

// ── HPPD Bar ─────────────────────────────────────────────────────────────────

function HppdBar({ actual, budget, status }: { actual: number; budget: number; status: ProdStatus }) {
  const max = Math.max(actual, budget) * 1.2
  const barColor = status === 'on-track' ? 'bg-emerald-500' : status === 'over' || status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
  const budgetPct = (budget / max) * 100
  const actualPct = (actual / max) * 100
  return (
    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mt-1">
      {/* Budget marker */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${budgetPct}%` }} />
      {/* Actual bar */}
      <motion.div
        className={`absolute top-0 left-0 h-full rounded-full ${barColor}`}
        initial={{ width: 0 }}
        animate={{ width: `${actualPct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
      />
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProdStatus }) {
  const map = {
    'on-track': { label: 'On Track', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'over':     { label: 'Over Budget', cls: 'bg-red-100 text-red-700 border-red-200' },
    'under':    { label: 'Under Target', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    'critical': { label: 'Critical', cls: 'bg-red-100 text-red-800 border-red-300 font-black' },
  }
  const { label, cls } = map[status]
  return <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
}

// ── Unit Card ─────────────────────────────────────────────────────────────────

function UnitCard({ unit, onSelect, selected }: { unit: UnitProductivity; onSelect: () => void; selected: boolean }) {
  const varColor = unit.status === 'on-track' ? 'text-emerald-600' : unit.status === 'over' || unit.status === 'critical' ? 'text-red-600' : 'text-amber-600'
  const sparkColor = unit.status === 'on-track' ? '#10b981' : unit.status === 'over' || unit.status === 'critical' ? '#ef4444' : '#f59e0b'

  return (
    <motion.div
      layout
      data-id={`unit-card-${unit.unit.replace(/\s+/g,'-')}`}
      onClick={onSelect}
      className={`bg-white rounded-2xl border-2 cursor-pointer transition-all duration-150 overflow-hidden shadow-sm hover:shadow-md ${
        selected ? 'border-violet-400 ring-2 ring-violet-200' : `${unit.borderColor} hover:border-violet-300`
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-bold text-slate-800">{unit.unit}</p>
            <p className="text-[10px] text-slate-500">{unit.census}/{unit.capacity} patients</p>
          </div>
          <StatusBadge status={unit.status} />
        </div>

        {/* HPPD numbers */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-2xl font-black ${varColor}`}>{unit.hppdActual.toFixed(1)}</span>
          <span className="text-xs text-slate-400">/ {unit.hppdBudget.toFixed(1)} budget</span>
        </div>
        <HppdBar actual={unit.hppdActual} budget={unit.hppdBudget} status={unit.status} />

        {/* Variance row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {unit.hppdVariance > 0 ? <TrendingUp size={11} className="text-red-500" /> :
             unit.hppdVariance < 0 ? <TrendingDown size={11} className="text-amber-500" /> :
             <Minus size={11} className="text-emerald-500" />}
            <span className={`text-[10px] font-bold ${varColor}`}>
              {unit.hppdVariance > 0 ? '+' : ''}{unit.hppdVariance.toFixed(1)} HPPD
            </span>
          </div>
          <span className={`text-[10px] font-semibold ${unit.dollarVariance > 0 ? 'text-red-600' : unit.dollarVariance < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {unit.dollarVariance > 0 ? '+' : ''}{unit.dollarVariance < 0 ? '-' : ''}${Math.abs(unit.dollarVariance).toLocaleString()}
          </span>
        </div>

        {/* Sparkline */}
        <div className="mt-2 flex justify-end">
          <Sparkline data={unit.trend} color={sparkColor} budget={unit.hppdBudget} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Unit Detail Panel ─────────────────────────────────────────────────────────

function UnitDetail({ unit }: { unit: UnitProductivity }) {
  const matrix = MATRIX_TABLE[unit.unit]
  // Find the matching census range
  const activeRow = matrix.find(row => {
    const [lo, hi] = row.censusRange.split('–').map(Number)
    return unit.census >= lo && unit.census <= hi
  })

  return (
    <motion.div
      id="unit-detail"
      key={unit.unit}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className={`px-5 py-4 bg-gradient-to-r ${unit.color} text-white`}>
        <p className="text-lg font-black">{unit.unit}</p>
        <p className="text-sm opacity-80">14-Day HPPD Trend</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Big sparkline */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Sparkline data={unit.trend} color={unit.status === 'on-track' ? '#10b981' : unit.status === 'critical' || unit.status === 'over' ? '#ef4444' : '#f59e0b'} budget={unit.hppdBudget} />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">vs budget</p>
            <p className="text-sm font-black text-slate-700">{unit.hppdBudget.toFixed(1)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Staff on duty', value: `${unit.staffOnDuty} RNs` },
            { label: 'Census', value: `${unit.census}/${unit.capacity}` },
            { label: 'Sched. hours', value: `${unit.scheduledHours}h` },
            { label: 'Matrix req.', value: `${unit.matrixRequired} RNs` },
          ].map(s => (
            <div key={s.label} className={`${unit.bgLight} rounded-xl p-2.5`}>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-sm font-bold text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Staffing Matrix */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Staffing Matrix</p>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="px-3 py-2 text-left font-bold">Census</th>
                  <th className="px-3 py-2 text-center font-bold">Ratio</th>
                  <th className="px-3 py-2 text-right font-bold">Req. RNs</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${row === activeRow ? `${unit.bgLight} font-bold` : ''}`}>
                    <td className="px-3 py-2 text-slate-700">{row.censusRange}</td>
                    <td className="px-3 py-2 text-slate-500 text-center">{row.ratio}</td>
                    <td className="px-3 py-2 text-slate-800 text-right">{row.required}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeRow && (
            <p className={`text-[10px] mt-1.5 font-semibold ${unit.matrixActual < unit.matrixRequired ? 'text-red-600' : unit.matrixActual > unit.matrixRequired ? 'text-amber-600' : 'text-emerald-600'}`}>
              Current: {unit.matrixActual} on duty vs {unit.matrixRequired} required
              {unit.matrixActual < unit.matrixRequired ? ` — ${unit.matrixRequired - unit.matrixActual} short` :
               unit.matrixActual > unit.matrixRequired ? ` — ${unit.matrixActual - unit.matrixRequired} excess` : ' — ✓ exact match'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Recommendation Card ───────────────────────────────────────────────────────

const PRIORITY_META = {
  critical: { dot: 'bg-red-500', label: 'Critical', cls: 'border-red-200 bg-red-50' },
  high:     { dot: 'bg-orange-500', label: 'High', cls: 'border-orange-200 bg-orange-50' },
  medium:   { dot: 'bg-amber-400', label: 'Medium', cls: 'border-amber-200 bg-amber-50' },
  low:      { dot: 'bg-blue-400', label: 'Low', cls: 'border-blue-200 bg-blue-50' },
}

const TYPE_META = {
  float:          { icon: <Users size={13} />,     label: 'Float' },
  'early-release': { icon: <CheckCircle2 size={13} />, label: 'Early Release' },
  marketplace:    { icon: <BarChart2 size={13} />, label: 'Marketplace' },
  adjust:         { icon: <RefreshCw size={13} />, label: 'Adjust' },
  monitor:        { icon: <Target size={13} />,    label: 'Monitor' },
}

function RecCard({ rec, onApply, onDismiss }: { rec: SmartRecommendation; onApply: () => void; onDismiss: () => void }) {
  const pm = PRIORITY_META[rec.priority]
  const tm = TYPE_META[rec.type]
  return (
    <motion.div
      layout
      data-id={`rec-${rec.id}`}
      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20, height:0 }}
      transition={{ duration:0.25, ease:'easeOut' as const }}
      className={`rounded-2xl border-2 p-4 ${pm.cls}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${pm.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 flex items-center gap-1">{tm.icon}<span className="text-[10px] font-bold uppercase tracking-wide">{tm.label}</span></span>
            {rec.from && rec.to && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white/60 px-1.5 py-0.5 rounded-full border border-slate-200">
                {rec.from} <ArrowRight size={10} /> {rec.to}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 leading-snug">{rec.title}</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{rec.detail}</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1.5 bg-white/60 rounded-lg px-2 py-1 inline-block border border-slate-200">{rec.impact}</p>
        </div>
        <button
          aria-label={`Dismiss ${rec.id}`}
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      {rec.done ? (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-bold">
          <CheckCircle2 size={15} /> Applied
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            aria-label={`Apply ${rec.id}`}
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            <Zap size={12} />
            {rec.action.length > 40 ? rec.action.slice(0, 40) + '…' : rec.action}
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Trend Chart (14-day multi-unit) ───────────────────────────────────────────

function TrendChart({ units }: { units: UnitProductivity[] }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Fri']
  // Pick 3 most interesting units
  const featured = units.filter(u => u.status !== 'on-track').slice(0, 3)
  const colors = ['#ef4444','#f59e0b','#8b5cf6']

  return (
    <div id="trend-chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <TrendingUp size={14} className="text-violet-500" />
          14-Day HPPD Trend — At-Risk Units
        </p>
        <div className="flex items-center gap-3">
          {featured.map((u, i) => (
            <div key={u.unit} className="flex items-center gap-1">
              <div className="w-3 h-1 rounded-full" style={{ backgroundColor: colors[i] }} />
              <span className="text-[10px] text-slate-500 font-semibold">{u.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Y-axis grid */}
        {[6,8,10,12,14,16].map(v => (
          <div key={v} className="absolute w-full border-t border-slate-100 flex items-center" style={{ bottom: `${((v-5)/(16-5))*100}%` }}>
            <span className="text-[9px] text-slate-400 pr-1 -translate-y-2">{v}</span>
          </div>
        ))}

        <div className="ml-5 h-32 flex items-end gap-1">
          {Array.from({ length: 14 }, (_, dayIdx) => (
            <div
              key={dayIdx}
              className="flex-1 flex items-end gap-px h-full relative"
              onMouseEnter={() => setHoveredDay(dayIdx)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Hover highlight */}
              {hoveredDay === dayIdx && (
                <div className="absolute inset-0 bg-slate-100/80 rounded-sm" />
              )}
              {featured.map((u, i) => {
                const val = u.trend[dayIdx] ?? 0
                const pct = ((val - 5) / (16 - 5)) * 100
                return (
                  <motion.div
                    key={u.unit}
                    className="flex-1 rounded-t-sm"
                    style={{ backgroundColor: colors[i], opacity: 0.85 }}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: dayIdx * 0.03 + i * 0.05, duration: 0.4, ease: 'easeOut' as const }}
                  />
                )
              })}

              {/* Tooltip */}
              {hoveredDay === dayIdx && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap z-10 shadow-xl">
                  <p className="font-bold mb-0.5">{days[dayIdx]}</p>
                  {featured.map((u, i) => (
                    <p key={u.unit} style={{ color: colors[i] }}>{u.unit}: {u.trend[dayIdx]?.toFixed(1)}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* X labels */}
        <div className="ml-5 flex gap-1 mt-1">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`text-[8px] ${i === 13 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {i === 13 ? 'Today' : i % 2 === 0 ? d : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shift Comparison Mini ─────────────────────────────────────────────────────

function ShiftComparison() {
  const shifts = [
    { label:'Day',   hppd:9.6, budget:9.2, rns:33, census:94 },
    { label:'Eve',   hppd:8.8, budget:9.2, rns:28, census:91 },
    { label:'Night', hppd:7.1, budget:7.5, rns:22, census:88 },
  ]
  return (
    <div id="shift-comparison" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <BarChart2 size={14} className="text-violet-500" /> Shift-over-Shift HPPD
      </p>
      <div className="space-y-3">
        {shifts.map(s => {
          const over = s.hppd > s.budget
          return (
            <div key={s.label} data-id={`shift-row-${s.label.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">{s.label} Shift</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${over ? 'text-red-600' : 'text-emerald-600'}`}>{s.hppd}</span>
                  <span className="text-[10px] text-slate-400">/ {s.budget} budget</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${over ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {over ? '+' : ''}{(s.hppd - s.budget).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute top-1/2 -translate-y-1/2 w-0.5 bg-slate-400 z-10 h-full" style={{ left: `${(s.budget / 12) * 100}%` }} />
                <motion.div
                  className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-emerald-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.hppd / 12) * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' as const }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">{s.rns} RNs · {s.census} patients</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'matrix' | 'trends'

export default function Productivity() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [units, setUnits] = useState(getUnits)
  const [recs, setRecs] = useState(getRecommendations)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(units[0].unit)
  const [toast, setToast] = useState('')
  const [recFilter, setRecFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const summary = getShiftSummary()

  function showToast(msg: string) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(''), 3500)
  }

  function refreshAll() {
    setUnits(getUnits())
    setRecs(getRecommendations())
  }

  function handleApply(rec: SmartRecommendation) {
    if (rec.type === 'float' && rec.from && rec.to) {
      applyFloat(rec.from, rec.to)
    }
    applyRecommendation(rec.id)
    refreshAll()
    showToast(`✓ Applied: ${rec.title}`)
  }

  function handleDismiss(id: string) {
    dismissRecommendation(id)
    setRecs(getRecommendations())
    showToast('Recommendation dismissed')
  }

  const filteredRecs = recs.filter(r => recFilter === 'all' || r.priority === recFilter)
  const selectedUnitData = units.find(u => u.unit === selectedUnit)

  const varColor = summary.totalDollarVariance > 0 ? 'text-red-600' : summary.totalDollarVariance < 0 ? 'text-amber-600' : 'text-emerald-600'
  const varBg = summary.totalDollarVariance > 0 ? 'bg-red-50 border-red-200' : summary.totalDollarVariance < 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Productivity Intelligence</h1>
              <p className="text-xs text-slate-500">HPPD Tracker · Staffing Matrix · Labor Variance</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Shift</p>
              <p className="text-xs font-bold text-slate-700">{summary.shift}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Census</p>
              <p className="text-xs font-bold text-slate-700">{summary.totalCensus}/{summary.totalCapacity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div id="kpi-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
        {[
          { id:'kpi-hppd-actual', label:'HPPD Actual', value:summary.hppdActualAvg.toFixed(1), sub:`Budget: ${summary.hppdBudgetAvg.toFixed(1)}`, icon:<Target size={14}/>, color: Math.abs(summary.hppdActualAvg - summary.hppdBudgetAvg) < 0.5 ? 'text-emerald-600' : 'text-red-600', bg:'bg-white' },
          { id:'kpi-dollar-variance', label:'$ Variance', value:`${summary.totalDollarVariance >= 0 ? '+' : ''}$${Math.abs(summary.totalDollarVariance).toLocaleString()}`, sub:'vs. scheduled budget', icon:<DollarSign size={14}/>, color:varColor, bg:'bg-white' },
          { id:'kpi-over-budget', label:'Over Budget', value:String(summary.unitsOverBudget), sub:'units this shift', icon:<TrendingUp size={14}/>, color: summary.unitsOverBudget > 1 ? 'text-red-600' : 'text-amber-600', bg:'bg-white' },
          { id:'kpi-under-target', label:'Under Target', value:String(summary.unitsUnderBudget), sub:'units at risk', icon:<TrendingDown size={14}/>, color: summary.unitsUnderBudget > 0 ? 'text-amber-600' : 'text-emerald-600', bg:'bg-white' },
        ].map(k => (
          <div key={k.id} id={k.id} className={`${k.bg} px-5 py-3.5 flex items-center gap-3`}>
            <div className={`${k.color}`}>{k.icon}</div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
              <p className={`text-2xl font-black leading-none mt-0.5 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {([
            { id:'dashboard', label:'Dashboard', icon:<BarChart2 size={13}/> },
            { id:'matrix',    label:'Staffing Matrix', icon:<Users size={13}/> },
            { id:'trends',    label:'Trends', icon:<TrendingUp size={13}/> },
          ] as { id:Tab; label:string; icon:React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Unit cards */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Units · Click for detail</p>
                    <div className="flex items-center gap-1">
                      {([{s:'critical',c:'bg-red-500'},{s:'over',c:'bg-orange-400'},{s:'under',c:'bg-amber-400'},{s:'on-track',c:'bg-emerald-400'}] as {s:ProdStatus,c:string}[]).map(b => (
                        <div key={b.s} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${b.c}`} />
                          <span className="text-[9px] text-slate-500 capitalize">{b.s.replace('-',' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {units.map(u => (
                      <UnitCard
                        key={u.unit}
                        unit={u}
                        selected={selectedUnit === u.unit}
                        onSelect={() => setSelectedUnit(u.unit === selectedUnit ? null : u.unit)}
                      />
                    ))}
                  </div>
                </div>

                {/* Right column: detail + recommendations */}
                <div className="space-y-4">
                  {/* Unit detail */}
                  <AnimatePresence mode="wait">
                    {selectedUnitData && <UnitDetail key={selectedUnitData.unit} unit={selectedUnitData} />}
                  </AnimatePresence>

                  {/* Smart recommendations */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Zap size={11} className="text-amber-500" /> Smart Adjust
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{recs.filter(r => !r.done && (r.priority === 'critical' || r.priority === 'high')).length}</span>
                      </p>
                      <select
                        value={recFilter}
                        onChange={e => setRecFilter(e.target.value as typeof recFilter)}
                        className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="all">All</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                      </select>
                    </div>
                    <div id="recommendations" className="space-y-3">
                      <AnimatePresence>
                        {filteredRecs.map(rec => (
                          <RecCard
                            key={rec.id}
                            rec={rec}
                            onApply={() => handleApply(rec)}
                            onDismiss={() => handleDismiss(rec.id)}
                          />
                        ))}
                        {filteredRecs.length === 0 && (
                          <motion.div
                            initial={{ opacity:0 }} animate={{ opacity:1 }}
                            className="text-center py-8 text-slate-400 text-sm"
                          >
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                            All recommendations actioned
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MATRIX TAB ── */}
          {tab === 'matrix' && (
            <motion.div key="matrix" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Staffing Matrix — All Units</p>
                  <p className="text-xs text-slate-500">Census-based RN requirements vs. actual</p>
                </div>
                <div id="matrix-table" className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-200">
                        <th className="px-5 py-3 text-left font-bold">Unit</th>
                        <th className="px-4 py-3 text-right font-bold">Census</th>
                        <th className="px-4 py-3 text-right font-bold">Required RNs</th>
                        <th className="px-4 py-3 text-right font-bold">On Duty</th>
                        <th className="px-4 py-3 text-right font-bold">HPPD Budget</th>
                        <th className="px-4 py-3 text-right font-bold">HPPD Actual</th>
                        <th className="px-4 py-3 text-right font-bold">$ Variance</th>
                        <th className="px-4 py-3 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u, i) => (
                        <tr key={u.unit} data-id={`matrix-row-${u.unit.replace(/\s+/g,'-')}`}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : ''}`}>
                          <td className="px-5 py-3 font-bold text-slate-800">{u.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{u.census}/{u.capacity}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${u.matrixActual < u.matrixRequired ? 'text-red-600' : 'text-slate-700'}`}>{u.matrixRequired}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${
                              u.matrixActual < u.matrixRequired ? 'text-red-600' :
                              u.matrixActual > u.matrixRequired + 1 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>{u.matrixActual}</span>
                            {u.matrixActual < u.matrixRequired && (
                              <span className="text-[9px] text-red-500 ml-1">-{u.matrixRequired - u.matrixActual}</span>
                            )}
                            {u.matrixActual > u.matrixRequired && (
                              <span className="text-[9px] text-amber-500 ml-1">+{u.matrixActual - u.matrixRequired}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">{u.hppdBudget.toFixed(1)}</td>
                          <td className="px-4 py-3 text-right font-bold">
                            <span className={u.hppdVariance > 0.5 ? 'text-red-600' : u.hppdVariance < -0.5 ? 'text-amber-600' : 'text-emerald-600'}>
                              {u.hppdActual.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            <span className={u.dollarVariance > 0 ? 'text-red-600' : u.dollarVariance < 0 ? 'text-amber-600' : 'text-emerald-600'}>
                              {u.dollarVariance > 0 ? '+' : ''}{u.dollarVariance < 0 ? '-' : ''}${Math.abs(u.dollarVariance).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={u.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-sm">
                        <td className="px-5 py-3 text-slate-700">TOTAL / AVG</td>
                        <td className="px-4 py-3 text-right text-slate-700">{summary.totalCensus}/{summary.totalCapacity}</td>
                        <td colSpan={2} className="px-4 py-3 text-right text-slate-500">—</td>
                        <td className="px-4 py-3 text-right text-slate-600">{summary.hppdBudgetAvg.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={varColor}>{summary.hppdActualAvg.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={varColor}>{summary.totalDollarVariance >= 0 ? '+' : ''}${Math.abs(summary.totalDollarVariance).toLocaleString()}</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Shift comparison below matrix */}
              <div className="mt-4">
                <ShiftComparison />
              </div>
            </motion.div>
          )}

          {/* ── TRENDS TAB ── */}
          {tab === 'trends' && (
            <motion.div key="trends" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="space-y-5">
                <TrendChart units={units} />
                <ShiftComparison />

                {/* Per-unit trend table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <ChevronRight size={14} className="text-violet-500" /> 7-Day HPPD by Unit
                  </p>
                  <div id="unit-trend-table" className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 text-left font-bold">Unit</th>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Fri(T)'].map(d => (
                            <th key={d} className="py-2 text-right font-bold px-2">{d}</th>
                          ))}
                          <th className="py-2 text-right font-bold px-2">Budget</th>
                          <th className="py-2 text-right font-bold px-2">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map(u => {
                          const last7 = u.trend.slice(-7)
                          const dir = last7[6] > last7[0] ? 'up' : last7[6] < last7[0] ? 'down' : 'flat'
                          return (
                            <tr key={u.unit} className="border-b border-slate-100">
                              <td className="py-2.5 font-bold text-slate-800">{u.unit}</td>
                              {last7.map((v, i) => (
                                <td key={i} className="py-2.5 text-right px-2">
                                  <span className={`${
                                    v > u.hppdBudget + 0.5 ? 'text-red-600 font-bold' :
                                    v < u.hppdBudget - 0.5 ? 'text-amber-600 font-bold' : 'text-emerald-600'
                                  }`}>{v.toFixed(1)}</span>
                                </td>
                              ))}
                              <td className="py-2.5 text-right px-2 text-slate-400">{u.hppdBudget.toFixed(1)}</td>
                              <td className="py-2.5 text-right px-2">
                                {dir === 'up' ? <TrendingUp size={12} className={u.status === 'over' || u.status === 'critical' ? 'text-red-500' : 'text-emerald-500'} /> :
                                 dir === 'down' ? <TrendingDown size={12} className="text-amber-500" /> :
                                 <Minus size={12} className="text-slate-400" />}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dollar variance banner */}
      {summary.totalDollarVariance > 500 && (
        <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 ${varBg} z-40 max-w-sm text-center`}>
          <AlertTriangle size={16} className={varColor} />
          <div>
            <p className={`text-xs font-black ${varColor}`}>Shift running ${summary.totalDollarVariance.toLocaleString()} over budget</p>
            <p className="text-[10px] text-slate-500">Apply Smart Adjust recommendations to reduce variance</p>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="action-toast"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
