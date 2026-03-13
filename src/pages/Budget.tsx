import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, ChevronRight, Zap, BarChart2, Clock, ArrowRight,
} from 'lucide-react'
import {
  getUnits, getTotals, getAlerts, getCostBreakdown, WEEKLY_BARS, OT_LEADERS,
  unitSpent, unitProjected, unitVariance, unitVariancePct, unitHPPD,
  unitOTCost,
  fmt, fmtPct,
  type BudgetPeriod, type UnitKey,
} from '../data/budgetData'
import { NavLink } from 'react-router-dom'

// ── Helpers ───────────────────────────────────────────────────────────────────

function varianceColor(variance: number) {
  if (variance > 5_000)  return 'text-red-400'
  if (variance > 0)      return 'text-amber-400'
  return 'text-emerald-400'
}
function pctBarColor(pct: number, budgetPct: number) {
  const over = pct - budgetPct
  if (over > 0.08) return 'bg-red-500'
  if (over > 0.02) return 'bg-amber-500'
  if (pct < budgetPct - 0.08) return 'bg-sky-500'
  return 'bg-emerald-500'
}

// ── Burn-rate gauge ───────────────────────────────────────────────────────────

function BurnGauge({ spentPct, budgetPct }: { spentPct: number; budgetPct: number }) {
  // Draw a semicircle gauge: 0% = left, 100% = right, midpoint = "on track"
  const cx = 90, cy = 90, r = 70
  const startAngle = -180
  const spentAngle = startAngle + (spentPct / 1) * 180
  const budgetAngle = startAngle + (budgetPct / 1) * 180

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(fromAngle: number, toAngle: number, radius: number) {
    const from = polarToXY(fromAngle, radius)
    const to   = polarToXY(toAngle, radius)
    const large = toAngle - fromAngle > 180 ? 1 : 0
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y}`
  }

  const needle = polarToXY(spentAngle, 55)
  const over   = spentPct > budgetPct + 0.03
  const under  = spentPct < budgetPct - 0.03

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 100" className="w-48 h-28">
        {/* Background track */}
        <path d={arcPath(-180, 0, r)} fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        {/* Green zone (under budget) */}
        <path d={arcPath(-180, -90, r)} fill="none" stroke="#059669" strokeWidth="12" strokeOpacity="0.25" strokeLinecap="round" />
        {/* Budget marker */}
        <line
          x1={polarToXY(budgetAngle, r - 10).x} y1={polarToXY(budgetAngle, r - 10).y}
          x2={polarToXY(budgetAngle, r + 10).x} y2={polarToXY(budgetAngle, r + 10).y}
          stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={arcPath(-180, spentAngle, r)} fill="none"
          stroke={over ? '#ef4444' : under ? '#0ea5e9' : '#10b981'}
          strokeWidth="12" strokeLinecap="round"
        />
        {/* Needle dot */}
        <circle cx={needle.x} cy={needle.y} r="5" fill={over ? '#ef4444' : under ? '#0ea5e9' : '#10b981'} />
        {/* Center label */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {(spentPct * 100).toFixed(1)}%
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#94a3b8" fontSize="9">
          of budget used
        </text>
        {/* Labels */}
        <text x="8"  y="98" fill="#64748b" fontSize="8">0%</text>
        <text x="82" y="18" fill="#64748b" fontSize="8">50%</text>
        <text x="157" y="98" fill="#64748b" fontSize="8">100%</text>
      </svg>
      <p className="text-slate-400 text-xs text-center -mt-2">
        {(budgetPct * 100).toFixed(0)}% of month elapsed
      </p>
    </div>
  )
}

// ── Unit row ──────────────────────────────────────────────────────────────────

function UnitRow({ unit, selectedUnit, onSelect }: {
  unit: ReturnType<typeof getUnits>[number]
  selectedUnit: UnitKey | 'all'
  onSelect: (u: UnitKey) => void
}) {
  const spent     = unitSpent(unit)
  const projected = unitProjected(unit)
  const variance  = unitVariance(unit)
  const varPct    = unitVariancePct(unit)
  const spentPct  = spent / unit.monthlyBudget
  const budgetPct = getTotals().pctElapsed
  const hppd      = unitHPPD(unit)
  const isSelected = selectedUnit === unit.unit

  return (
    <motion.tr
      data-id={`unit-row-${unit.unit.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
      onClick={() => onSelect(unit.unit)}
      className={`cursor-pointer transition-colors ${isSelected ? 'bg-violet-900/20' : 'hover:bg-slate-700/40'}`}
    >
      <td className="px-4 py-3 text-white font-semibold text-sm">{unit.unit}</td>
      <td className="px-4 py-3 text-slate-300 text-sm">{fmt(unit.monthlyBudget)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spentPct * 100, 100)}%` }}
              transition={{ ease: 'easeOut' as const, duration: 0.7 }}
              className={`h-full rounded-full ${pctBarColor(spentPct, budgetPct)}`}
            />
          </div>
          <span className="text-slate-300 text-sm w-16">{fmt(spent)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-300 text-sm">{fmt(projected)}</td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${varianceColor(variance)}`}>
          {variance >= 0 ? '+' : ''}{fmt(variance)}
          <span className="text-xs font-normal ml-1">({fmtPct(varPct)})</span>
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium ${hppd > unit.targetHPPD * 1.05 ? 'text-amber-400' : hppd < unit.targetHPPD * 0.95 ? 'text-sky-400' : 'text-emerald-400'}`}>
          {hppd.toFixed(1)} <span className="text-slate-500">/ {unit.targetHPPD}</span>
        </span>
      </td>
      <td className="px-4 py-3">
        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          variance > 10_000 ? 'bg-red-900/40 border-red-700 text-red-300' :
          variance > 0      ? 'bg-amber-900/40 border-amber-700 text-amber-300' :
          variance > -10_000 ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300' :
          'bg-sky-900/40 border-sky-700 text-sky-300'
        }`}>
          {variance > 10_000 ? '🔴 Critical' :
           variance > 0      ? '🟡 Watch' :
           variance > -10_000 ? '🟢 On track' :
           '🔵 Under'}
        </div>
      </td>
    </motion.tr>
  )
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────

function WeeklyChart() {
  const maxVal = Math.max(...WEEKLY_BARS.map(w => w.regular + w.ot + w.float + w.agency)) * 1.15
  return (
    <div id="weekly-chart" className="space-y-3">
      {WEEKLY_BARS.map((bar, i) => {
        const total  = bar.regular + bar.ot + bar.float + bar.agency
        const rPct   = (bar.regular / maxVal) * 100
        const otPct  = (bar.ot      / maxVal) * 100
        const fPct   = (bar.float   / maxVal) * 100
        const aPct   = (bar.agency  / maxVal) * 100
        const bPct   = (bar.budget  / maxVal) * 100
        return (
          <div key={bar.weekShort} data-id={`weekly-bar-${i}`} className="flex items-center gap-3">
            <span className="text-slate-500 text-[10px] w-12 shrink-0 text-right">{bar.weekShort}</span>
            <div className="flex-1 relative h-7 bg-slate-700/40 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rPct}%` }}
                transition={{ ease: 'easeOut' as const, duration: 0.5, delay: i * 0.08 }}
                className="absolute top-0 left-0 h-full bg-violet-600/80"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rPct + otPct}%` }}
                transition={{ ease: 'easeOut' as const, duration: 0.5, delay: i * 0.08 + 0.05 }}
                className="absolute top-0 left-0 h-full bg-amber-500/70"
                style={{ clipPath: `inset(0 0 0 ${rPct}%)` }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rPct + otPct + fPct}%` }}
                transition={{ ease: 'easeOut' as const, duration: 0.5, delay: i * 0.08 + 0.1 }}
                className="absolute top-0 left-0 h-full bg-sky-500/70"
                style={{ clipPath: `inset(0 0 0 ${rPct + otPct}%)` }}
              />
              {aPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rPct + otPct + fPct + aPct}%` }}
                  transition={{ ease: 'easeOut' as const, duration: 0.5, delay: i * 0.08 + 0.15 }}
                  className="absolute top-0 left-0 h-full bg-red-500/70"
                  style={{ clipPath: `inset(0 0 0 ${rPct + otPct + fPct}%)` }}
                />
              )}
              {/* Budget line */}
              <div
                className="absolute top-0 h-full border-l-2 border-dashed border-white/40"
                style={{ left: `${bPct}%` }}
              />
            </div>
            <span className="text-slate-400 text-xs w-16 text-right">{fmt(total)}</span>
            <span className={`text-xs font-semibold w-16 ${total > bar.budget ? 'text-red-400' : 'text-emerald-400'}`}>
              {total > bar.budget ? '+' : ''}{fmt(total - bar.budget)}
            </span>
          </div>
        )
      })}
      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 flex-wrap">
        {[
          { label: 'Regular', color: 'bg-violet-600' },
          { label: 'Overtime', color: 'bg-amber-500' },
          { label: 'Float', color: 'bg-sky-500' },
          { label: 'Agency', color: 'bg-red-500' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-5 border-t-2 border-dashed border-white/40 inline-block" />
          Budget
        </span>
      </div>
    </div>
  )
}

// ── Cost breakdown donut ──────────────────────────────────────────────────────

function CostBreakdown() {
  const items = getCostBreakdown()
  return (
    <div id="cost-breakdown" className="space-y-2">
      {items.map(item => (
        <div key={item.label} data-id={`cost-item-${item.label.toLowerCase()}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs">{item.label}</span>
            <div className="text-right">
              <span className="text-white text-xs font-semibold">{fmt(item.value)}</span>
              <span className="text-slate-500 text-[10px] ml-1">({(item.pct * 100).toFixed(1)}%)</span>
            </div>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.pct * 100}%` }}
              transition={{ ease: 'easeOut' as const, duration: 0.6 }}
              className={`h-full rounded-full ${item.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Budget() {
  const [period, setPeriod]           = useState<BudgetPeriod>('mtd')
  const [selectedUnit, setSelectedUnit] = useState<UnitKey | 'all'>('all')

  const totals  = getTotals()
  const units   = getUnits()
  const alerts  = getAlerts()
  const breakdown = getCostBreakdown()

  const projVariance = totals.totalVariance
  const projOverBudget = projVariance > 0

  const PERIOD_LABELS: Record<BudgetPeriod, string> = {
    today: 'Today',
    wtd:   'Week to Date',
    mtd:   'Month to Date (Mar)',
    ytd:   'Year to Date (2026)',
  }

  // Selected unit drill-down data
  const selectedUnitData = selectedUnit !== 'all' ? units.find(u => u.unit === selectedUnit) : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign size={24} className="text-emerald-400" />
            Labor Budget Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time spend · OT exposure · Burn-rate projection · Unit variance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(PERIOD_LABELS) as BudgetPeriod[]).map(p => (
            <button
              key={p}
              id={`period-${p}`}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                period === p ? 'bg-violet-700 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Burn rate hero + projection ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Burn gauge */}
        <div className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center shadow" id="burn-gauge-card">
          <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-3">Budget Burn Rate</p>
          <BurnGauge
            spentPct={totals.budgetUsedPct}
            budgetPct={totals.pctElapsed}
          />
          <div className={`mt-3 text-center px-4 py-2 rounded-xl ${projOverBudget ? 'bg-red-900/30 border border-red-800/50' : 'bg-emerald-900/20 border border-emerald-800/40'}`}>
            <p className={`text-sm font-bold ${projOverBudget ? 'text-red-300' : 'text-emerald-300'}`}>
              {projOverBudget ? '⚠' : '✓'} March projected to end{' '}
              <strong>{projOverBudget ? 'OVER' : 'under'} by {fmt(Math.abs(projVariance))}</strong>
            </p>
          </div>
        </div>

        {/* Hero stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div id="stat-total-budget" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">Monthly Budget</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmt(totals.totalBudget)}</p>
            <p className="text-slate-500 text-xs mt-0.5">6 units · 31 days</p>
          </div>
          <div id="stat-total-spent" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">Spent MTD</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmt(totals.totalSpent)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{totals.daysElapsed} of {totals.daysTotal} days</p>
          </div>
          <div id="stat-projected" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">Projected EOM</p>
            <p className={`text-2xl font-bold mt-0.5 ${projOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {fmt(totals.totalProjected)}
            </p>
            <p className={`text-xs mt-0.5 font-semibold ${projOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {fmtPct(totals.totalVariance / totals.totalBudget)} vs budget
            </p>
          </div>
          <div id="stat-ot-cost" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">OT Cost MTD</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{fmt(totals.totalOTCost)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{fmt(totals.totalAgency)} agency</p>
          </div>
        </div>
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map(alert => (
            <div
              key={alert.id}
              data-id={`alert-${alert.id}`}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                alert.severity === 'critical' ? 'bg-red-900/25 border-red-800/50' :
                alert.severity === 'warning'  ? 'bg-amber-900/20 border-amber-800/40' :
                alert.severity === 'success'  ? 'bg-emerald-900/20 border-emerald-800/40' :
                'bg-slate-800 border-slate-700'
              }`}
            >
              <span className="shrink-0 mt-0.5">
                {alert.severity === 'critical' ? <AlertTriangle size={15} className="text-red-400" /> :
                 alert.severity === 'warning'  ? <AlertTriangle size={15} className="text-amber-400" /> :
                 alert.severity === 'success'  ? <CheckCircle size={15} className="text-emerald-400" /> :
                 <Info size={15} className="text-sky-400" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  alert.severity === 'critical' ? 'text-red-300' :
                  alert.severity === 'warning'  ? 'text-amber-300' :
                  alert.severity === 'success'  ? 'text-emerald-300' :
                  'text-sky-300'
                }`}>{alert.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{alert.detail}</p>
              </div>
              {alert.action && alert.actionHref && (
                <NavLink
                  to={alert.actionHref}
                  className="shrink-0 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                  aria-label={`Alert action: ${alert.action}`}
                >
                  {alert.action} <ArrowRight size={12} />
                </NavLink>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Unit table ───────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl shadow overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-400" />
            <h2 className="text-white font-semibold">Unit Budget Breakdown</h2>
          </div>
          <span className="text-slate-500 text-xs">Click unit to drill down</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" id="unit-table">
            <thead>
              <tr className="border-b border-slate-700">
                {['Unit', 'Monthly Budget', 'Spent MTD', 'Projected EOM', 'Variance', 'HPPD', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-slate-500 text-[11px] uppercase tracking-wide font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {units.map(unit => (
                <UnitRow
                  key={unit.unit}
                  unit={unit}
                  selectedUnit={selectedUnit}
                  onSelect={u => setSelectedUnit(prev => prev === u ? 'all' : u)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Drill-down panel */}
        {selectedUnitData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: 'easeOut' as const, duration: 0.2 }}
            id="unit-drill-down"
            className="border-t border-slate-700 px-5 py-4 bg-slate-750"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap size={15} className="text-violet-400" />
                {selectedUnitData.unit} — Cost Breakdown
              </h3>
              <button
                aria-label="Close unit drill-down"
                onClick={() => setSelectedUnit('all')}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Regular Pay',  value: selectedUnitData.regularHours * selectedUnitData.regularRate, hours: selectedUnitData.regularHours, color: 'text-violet-400' },
                { label: 'Overtime',     value: unitOTCost(selectedUnitData), hours: selectedUnitData.otHours, color: 'text-amber-400' },
                { label: 'Float Staff',  value: selectedUnitData.floatHours * selectedUnitData.floatRate, hours: selectedUnitData.floatHours, color: 'text-sky-400' },
                { label: 'Agency',       value: selectedUnitData.agencyHours * selectedUnitData.agencyRate, hours: selectedUnitData.agencyHours, color: 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="bg-slate-700/60 rounded-xl px-3 py-2.5">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wide">{item.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{fmt(item.value)}</p>
                  <p className="text-slate-500 text-xs">{item.hours}h worked</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                <span className="text-slate-500 text-xs">HPPD: </span>
                <span className={`text-sm font-bold ${unitHPPD(selectedUnitData) > selectedUnitData.targetHPPD * 1.05 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {unitHPPD(selectedUnitData).toFixed(1)}
                </span>
                <span className="text-slate-500 text-xs"> / {selectedUnitData.targetHPPD} target</span>
              </div>
              <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                <span className="text-slate-500 text-xs">Avg census: </span>
                <span className="text-white text-sm font-bold">{selectedUnitData.avgCensus}</span>
              </div>
              <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                <span className="text-slate-500 text-xs">Budgeted FTE: </span>
                <span className="text-white text-sm font-bold">{selectedUnitData.budgetedFTE}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Two-column: weekly chart + OT leaders ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Weekly trend */}
        <div className="bg-slate-800 rounded-2xl p-5 shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-violet-400" />
            <h2 className="text-white font-semibold">4-Week Labor Trend</h2>
          </div>
          <WeeklyChart />
        </div>

        {/* OT leaders */}
        <div className="bg-slate-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <h2 className="text-white font-semibold">OT Leaders (MTD)</h2>
            </div>
            <NavLink to="/overtime" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Review queue <ChevronRight size={12} />
            </NavLink>
          </div>
          <div className="space-y-3" id="ot-leaders-list">
            {OT_LEADERS.map((leader, i) => {
              const maxOT = OT_LEADERS[0].otHours
              return (
                <div key={leader.nurseId} data-id={`ot-leader-${leader.nurseId}`} className="flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${leader.color} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}>
                    {leader.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white text-xs font-medium truncate">{leader.name}</span>
                      <span className="text-amber-400 text-xs font-bold">{leader.otHours}h</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(leader.otHours / maxOT) * 100}%` }}
                        transition={{ ease: 'easeOut' as const, duration: 0.5, delay: i * 0.07 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-500 text-[10px]">{leader.unit}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[10px]">{fmt(leader.otCost)}</span>
                        {leader.trend === 'up'   && <TrendingUp   size={10} className="text-red-400" />}
                        {leader.trend === 'down'  && <TrendingDown size={10} className="text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Cost breakdown ────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl p-5 shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-emerald-400" />
          <h2 className="text-white font-semibold">Spend by Category (MTD)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CostBreakdown />
          <div className="space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-3">Category Totals</p>
            {breakdown.map(item => (
              <div key={item.label} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-slate-300 text-sm">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-sm font-bold">{fmt(item.value)}</span>
                  <span className="text-slate-500 text-xs ml-1">{(item.pct * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2 border border-slate-600">
              <span className="text-white text-sm font-bold">Total MTD</span>
              <span className="text-white text-sm font-bold">{fmt(totals.totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HIPAA / compliance footer ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-slate-600 text-xs">
        <Info size={12} />
        <span>Labor cost data refreshed every 15 minutes from Time Clock. Projections assume constant daily spend rate.</span>
      </div>
    </div>
  )
}
