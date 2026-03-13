// Retention.tsx — Nurse Retention & Flight Risk Intelligence
// The feature that prevents $342K in annual turnover through proactive intervention.
import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserMinus, AlertTriangle, DollarSign, TrendingDown, TrendingUp,
  Clock, Star, BarChart3, X, CheckCircle2, ChevronRight,
  RefreshCw, Minus, Users, Shield, Zap,
} from 'lucide-react'
import {
  getStaff, getStaffById, getUnitSummaries, getHospitalSummary,
  executeIntervention, isExecuted,
  RISK_META, WEEK_LABELS, HOSP_WEEKS, UNIT_WEEK_DATA,
  type RiskLevel, type StaffRetention, type Intervention,
} from '../data/retentionData'

type TabId = 'overview' | 'units' | 'trends' | 'costs'
type FilterId = RiskLevel | 'all'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTenure(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}mo`
  if (m === 0) return `${y}yr`
  return `${y}yr ${m}mo`
}

function formatCost(n: number): string {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`
}

const FACTOR_ICONS: Record<string, typeof Clock> = {
  clock: Clock, dollar: DollarSign, calendar: BarChart3, star: Star, trending: TrendingUp,
}

const INT_LABELS: Record<string, string> = {
  'checkin':    '1:1 Meeting',
  'pay-review': 'Pay Review',
  'schedule':   'Schedule Fix',
  'recognition':'Recognition',
  'growth':     'Career Growth',
}

// ── Components ────────────────────────────────────────────────────────────────

function FactorBar({ label, score, value, icon }: { label: string; score: number; value: string; icon: string }) {
  const Icon = FACTOR_ICONS[icon] ?? Clock
  const pct = (score / 20) * 100
  const barColor = score <= 6 ? 'bg-red-500' : score <= 10 ? 'bg-orange-400' : score <= 14 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <span className={`text-xs font-bold ${score <= 6 ? 'text-red-600' : score <= 10 ? 'text-orange-500' : score <= 14 ? 'text-amber-500' : 'text-emerald-600'}`}>{score}/20</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-tight">{value}</p>
    </div>
  )
}

function InterventionCard({ intervention, onExecute, executed }: {
  intervention: Intervention
  staffName?: string
  onExecute: () => void
  executed: boolean
}) {
  const typeLabel = INT_LABELS[intervention.type] ?? intervention.type
  const typeColors: Record<string, string> = {
    'checkin':    'bg-violet-50 text-violet-700 border-violet-200',
    'pay-review': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'schedule':   'bg-blue-50 text-blue-700 border-blue-200',
    'recognition':'bg-amber-50 text-amber-700 border-amber-200',
    'growth':     'bg-rose-50 text-rose-700 border-rose-200',
  }
  const tc = typeColors[intervention.type] ?? 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <div className={`border rounded-xl p-3.5 ${executed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${tc}`}>{typeLabel}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800">{intervention.label}</p>
        </div>
        {executed && <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
      </div>
      <p className="text-[11px] text-slate-500 mb-2.5">{intervention.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Cost: <span className="font-semibold text-slate-700">{intervention.estimatedCostLabel}</span></span>
          <span>+{intervention.scoreLift} pts · {intervention.timeToImpact}</span>
        </div>
        {!executed ? (
          <button
            aria-label={`Execute ${intervention.id}`}
            onClick={onExecute}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all"
          >
            Execute
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600">✓ Done — tracking impact</span>
        )}
      </div>
    </div>
  )
}

function RiskCard({ staff, onClick }: { staff: StaffRetention; onClick: () => void }) {
  const risk = RISK_META[staff.riskLevel]
  return (
    <motion.div
      data-id={`risk-card-${staff.id}`}
      className={`bg-white rounded-xl border ${risk.border} shadow-sm cursor-pointer hover:shadow-md transition-all duration-150 p-4`}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      layout
    >
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-full ${risk.bg} border-2 ${risk.border} flex items-center justify-center shrink-0`}>
          <span className={`text-xl font-black ${risk.color}`}>{staff.retentionScore}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{staff.name}</span>
            {staff.flaggedThisWeek && (
              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">NEW</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{staff.role} · {staff.unit} · {formatTenure(staff.tenureMonths)}</div>
          <div className={`text-xs font-semibold mt-0.5 ${risk.color}`}>{risk.label}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {staff.topRisks.slice(0, 2).map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <span className={`w-1 h-1 rounded-full ${risk.dot} mt-1.5 shrink-0`} />
            <span className="leading-tight">{r}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 truncate flex-1">{staff.recommendedAction}</span>
        <button
          aria-label={`Intervene ${staff.id}`}
          onClick={e => { e.stopPropagation(); onClick() }}
          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${risk.bg} ${risk.textDark} border ${risk.border} hover:opacity-80 active:scale-95 transition-all shrink-0`}
        >
          Intervene →
        </button>
      </div>
    </motion.div>
  )
}

function DetailPanel({ staff, onClose, onIntervene }: {
  staff: StaffRetention
  onClose: () => void
  onIntervene: (intId: string, staffName: string, label: string) => void
}) {
  const risk = RISK_META[staff.riskLevel]
  const interventionCost = staff.interventions.reduce((sum, i) => {
    const costNum = parseInt(i.estimatedCostLabel.replace(/[^0-9]/g, '')) || 0
    const isYearly = i.estimatedCostLabel.includes('/yr')
    return sum + (isYearly ? Math.round(costNum / 12) : costNum)
  }, 0)

  return (
    <motion.div
      id="staff-detail-panel"
      className="fixed right-0 top-0 h-full w-[420px] bg-white z-50 shadow-2xl overflow-y-auto"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      {/* Header */}
      <div className={`px-5 py-4 border-b border-slate-100 ${risk.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${risk.bg} border-2 ${risk.border} flex items-center justify-center`}>
              <span className={`text-xl font-black ${risk.color}`}>{staff.retentionScore}</span>
            </div>
            <div>
              <p className="font-bold text-slate-800">{staff.name}</p>
              <p className="text-xs text-slate-500">{staff.role} · {staff.unit} · {formatTenure(staff.tenureMonths)} tenure</p>
              <span className={`text-xs font-bold ${risk.color}`}>{risk.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {staff.riskLevel !== 'stable' && (
          <div className={`mt-3 p-2.5 rounded-lg border ${risk.border} bg-white/70`}>
            <p className="text-xs font-bold text-slate-700 mb-1">Replacement Cost if Lost</p>
            <p className={`text-2xl font-black ${risk.color}`}>{formatCost(staff.replacementCost)}</p>
            <p className="text-[11px] text-slate-500">vs. ~{formatCost(interventionCost)}/mo in interventions</p>
          </div>
        )}
      </div>

      {/* Risk factors */}
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Risk Factor Breakdown</p>
        <div className="space-y-3">
          {[staff.workload, staff.payEquity, staff.schedule, staff.recognition, staff.growth].map(f => (
            <FactorBar key={f.label} label={f.label} score={f.score} value={f.value} icon={f.icon} />
          ))}
        </div>
      </div>

      {/* Score history mini-sparkline */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">12-Week Score Trend</p>
        <div className="flex items-end gap-0.5 h-10">
          {staff.scoreHistory.map((v, i) => {
            const maxV = Math.max(...staff.scoreHistory)
            const minV = Math.min(...staff.scoreHistory)
            const range = maxV - minV || 1
            const hPct = ((v - minV) / range) * 80 + 20
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-sm ${i === 11 ? (risk.dot) : 'bg-slate-200'}`}
                  style={{ height: `${hPct}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
          <span>12 wks ago</span><span>Now</span>
        </div>
        <p className={`text-xs font-semibold mt-1 ${staff.retentionScore < staff.scoreHistory[0] ? 'text-red-500' : 'text-emerald-500'}`}>
          {staff.retentionScore < staff.scoreHistory[0]
            ? `↓ ${staff.scoreHistory[0] - staff.retentionScore} pts since start`
            : `↑ ${staff.retentionScore - staff.scoreHistory[0]} pts since start`}
        </p>
      </div>

      {/* Interventions */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recommended Actions</p>
        <div className="space-y-3">
          {staff.interventions.map(i => (
            <InterventionCard
              key={i.id}
              intervention={i}
              executed={isExecuted(i.id)}
              onExecute={() => onIntervene(i.id, staff.name, i.label)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Unit chart ─────────────────────────────────────────────────────────────────
function UnitRiskChart() {
  const units = getUnitSummaries()
  const sorted = [...units].sort((a, b) => a.avgScore - b.avgScore)
  const max = 100

  return (
    <div id="unit-risk-chart" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Unit Retention Score — Current Week</p>
      <div className="space-y-4">
        {sorted.map(u => {
          const trendIcon = u.trend === 'improving' ? <TrendingUp size={12} className="text-emerald-500" /> : u.trend === 'declining' ? <TrendingDown size={12} className="text-red-500" /> : <Minus size={12} className="text-slate-400" />
          const barColor = u.avgScore <= 50 ? 'bg-red-400' : u.avgScore <= 65 ? 'bg-orange-400' : u.avgScore <= 75 ? 'bg-amber-400' : 'bg-emerald-500'
          const atRisk = u.criticalCount + u.highCount
          return (
            <div key={u.unit} data-id={`unit-bar-${u.unit}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 w-16">{u.abbr}</span>
                  {trendIcon}
                  {atRisk > 0 && (
                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{atRisk} at-risk</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">{u.staffCount} staff</span>
                  <span className={`text-sm font-black ${u.avgScore <= 65 ? 'text-orange-600' : 'text-slate-700'}`}>{u.avgScore}</span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(u.avgScore / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' as const, delay: 0.1 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {units.map(u => (
          <div key={u.unit} data-id={`unit-card-${u.unit}`} className={`${u.bg} border ${u.border} rounded-lg p-2.5`}>
            <p className={`text-xs font-bold ${u.color}`}>{u.abbr}</p>
            <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
              {u.criticalCount > 0 && <div className="flex justify-between"><span>Critical</span><span className="font-bold text-red-600">{u.criticalCount}</span></div>}
              {u.highCount > 0 && <div className="flex justify-between"><span>High</span><span className="font-bold text-orange-600">{u.highCount}</span></div>}
              <div className="flex justify-between"><span>Stable</span><span className="font-bold text-emerald-600">{u.stableCount}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Trend chart ────────────────────────────────────────────────────────────────
function TrendChart() {
  const W = 560; const H = 220; const PAD = { t: 16, r: 20, b: 32, l: 40 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const minY = 50; const maxY = 100
  const scaleY = (v: number) => PAD.t + chartH - ((v - minY) / (maxY - minY)) * chartH
  const scaleX = (i: number) => PAD.l + (i / (WEEK_LABELS.length - 1)) * chartW

  const LINES: Array<{ key: string; label: string; data: number[]; color: string; strokeW: number }> = [
    { key: 'HOSP', label: 'Hospital Avg', data: HOSP_WEEKS, color: '#6366f1', strokeW: 2.5 },
    { key: 'ICU',  label: 'ICU',  data: UNIT_WEEK_DATA['ICU'], color: '#7c3aed', strokeW: 1.5 },
    { key: 'CCU',  label: 'CCU',  data: UNIT_WEEK_DATA['CCU'], color: '#2563eb', strokeW: 1.5 },
    { key: 'MS-A', label: 'MS-A', data: UNIT_WEEK_DATA['MS-A'], color: '#059669', strokeW: 1.5 },
    { key: 'MS-B', label: 'MS-B', data: UNIT_WEEK_DATA['MS-B'], color: '#0d9488', strokeW: 1.5 },
    { key: 'ONC',  label: 'ONC',  data: UNIT_WEEK_DATA['Oncology'], color: '#e11d48', strokeW: 1.5 },
    { key: 'TEL',  label: 'TEL',  data: UNIT_WEEK_DATA['Telemetry'], color: '#d97706', strokeW: 1.5 },
    { key: 'ED',   label: 'ED',   data: UNIT_WEEK_DATA['ED'], color: '#dc2626', strokeW: 2 },
  ]

  const toPath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ')

  const yTicks = [50, 60, 70, 80, 90, 100]

  return (
    <div id="trend-chart" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">12-Week Retention Score Trend — All Units</p>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 340 }}>
          {/* Grid lines */}
          {yTicks.map(y => (
            <g key={y}>
              <line x1={PAD.l} y1={scaleY(y)} x2={W - PAD.r} y2={scaleY(y)} stroke="#f1f5f9" strokeWidth={1} />
              <text x={PAD.l - 6} y={scaleY(y) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{y}</text>
            </g>
          ))}

          {/* X-axis labels */}
          {WEEK_LABELS.filter((_, i) => i % 3 === 0 || i === WEEK_LABELS.length - 1).map((lbl) => {
            const origIdx = WEEK_LABELS.indexOf(lbl)
            return (
              <text key={lbl} x={scaleX(origIdx)} y={H - 6} textAnchor="middle" fontSize={9} fill={lbl === 'Now' ? '#6366f1' : '#94a3b8'} fontWeight={lbl === 'Now' ? 'bold' : 'normal'}>{lbl}</text>
            )
          })}

          {/* Vertical "Now" line */}
          <line x1={scaleX(11)} y1={PAD.t} x2={scaleX(11)} y2={H - PAD.b} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />

          {/* Lines */}
          {LINES.map(l => (
            <path key={l.key} d={toPath(l.data)} fill="none" stroke={l.color} strokeWidth={l.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={l.key === 'ED' ? 1 : 0.75} />
          ))}

          {/* End-point dots */}
          {LINES.map(l => (
            <circle key={`dot-${l.key}`} cx={scaleX(11)} cy={scaleY(l.data[11])} r={3} fill={l.color} />
          ))}

          {/* ED label at end */}
          <text x={scaleX(11) + 5} y={scaleY(UNIT_WEEK_DATA['ED'][11]) + 3} fontSize={9} fill="#dc2626" fontWeight="bold">ED</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {LINES.map(l => (
          <div key={l.key} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-xs font-bold text-red-700">⚠ ED Trend Alert</p>
        <p className="text-[11px] text-red-600 mt-0.5">ED retention score declined 11 points over 12 weeks — fastest decline of any unit. 2 at-risk nurses require immediate intervention.</p>
      </div>
    </div>
  )
}

// ── Cost Analysis ─────────────────────────────────────────────────────────────
function CostPanel() {
  const staff = getStaff()
  const atRisk = staff.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
  const totalCost = atRisk.reduce((s, n) => s + n.replacementCost, 0)
  const interventionBudget = 18500
  const roi = Math.round(totalCost / interventionBudget)

  return (
    <div id="cost-panel" className="space-y-4">
      {/* Hero ROI */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">If All At-Risk Nurses Leave</p>
        <p className="text-4xl font-black mb-1">{formatCost(totalCost)}</p>
        <p className="text-sm opacity-80">in recruitment, training &amp; productivity loss</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs opacity-70">Intervention Cost</p>
            <p className="text-xl font-black">{formatCost(interventionBudget)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs opacity-70">Net Savings</p>
            <p className="text-xl font-black">{formatCost(totalCost - interventionBudget)}</p>
          </div>
          <div className="bg-emerald-400/30 border border-emerald-400/50 rounded-lg p-3">
            <p className="text-xs opacity-70">ROI</p>
            <p className="text-xl font-black">{roi}x</p>
          </div>
        </div>
      </div>

      {/* Per-nurse cost table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">At-Risk Nurses — Replacement Cost</p>
        </div>
        <div className="divide-y divide-slate-50">
          {atRisk.map(n => {
            const risk = RISK_META[n.riskLevel]
            return (
              <div key={n.id} data-id={`cost-row-${n.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${risk.bg} border ${risk.border} flex items-center justify-center`}>
                    <span className={`text-xs font-black ${risk.color}`}>{n.retentionScore}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{n.name}</p>
                    <p className="text-xs text-slate-500">{n.role} · {n.unit} · {formatTenure(n.tenureMonths)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">{formatCost(n.replacementCost)}</p>
                  <p className={`text-xs font-semibold ${risk.color}`}>{risk.short}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700">Total Exposure</span>
          <span className="text-lg font-black text-slate-900">{formatCost(totalCost)}</span>
        </div>
      </div>

      {/* Intervention investment breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Intervention Investment Breakdown</p>
        <div className="space-y-2">
          {[
            { label: 'Pay review adjustments (5 nurses)', cost: '$11,400/yr', monthly: '$950/mo' },
            { label: 'Recognition awards & ceremonies', cost: '$2,050 one-time', monthly: '$171/mo' },
            { label: 'Role differentials (charge, preceptor)', cost: '$5,200/yr', monthly: '$433/mo' },
            { label: 'Manager time & HR admin', cost: 'Internal', monthly: '$0' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-600">{row.label}</span>
              <div className="text-right">
                <span className="font-semibold text-slate-800">{row.cost}</span>
                <span className="text-slate-400 ml-2">({row.monthly})</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
          <span className="text-sm font-bold text-slate-700">Total intervention budget</span>
          <span className="text-sm font-black text-violet-700">{formatCost(interventionBudget)}/yr</span>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="action-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-xl text-sm font-medium z-[60] flex items-center gap-2"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ ease: 'easeOut' as const }}
        >
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Retention() {
  const [tab, setTab] = useState<TabId>('overview')
  const [filter, setFilter] = useState<FilterId>('all')
  const [selectedStaff, setSelectedStaff] = useState<StaffRetention | null>(null)
  const [staff, setStaff] = useState(getStaff)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const summary = getHospitalSummary()
  const units = getUnitSummaries()

  const filteredStaff = useMemo(() => {
    if (filter === 'all') return staff
    return staff.filter(s => s.riskLevel === filter)
  }, [staff, filter])

  const fireToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }, [])

  const handleIntervene = useCallback((intId: string, staffName: string, label: string) => {
    executeIntervention(intId)
    setStaff(getStaff())
    const updated = getStaffById(selectedStaff?.id ?? '')
    if (updated) setSelectedStaff({ ...updated })
    const msgs: Record<string, string> = {
      'pay-review': `Pay review initiated for ${staffName} — HR notified`,
      'schedule':   `Schedule adjustment applied for ${staffName}`,
      'checkin':    `1:1 meeting scheduled with ${staffName} for this week`,
      'recognition':`${staffName} nominated for recognition — announcement pending`,
      'growth':     `Career growth action initiated for ${staffName}`,
    }
    const intType = [...getStaff().flatMap(s => s.interventions)].find(i => i.id === intId)?.type ?? ''
    fireToast(`✓ ${label} — ${msgs[intType] ?? `Action taken for ${staffName}`}`)
  }, [selectedStaff, fireToast])

  const handleRecalculate = useCallback(() => {
    setRecalculating(true)
    setTimeout(() => {
      setRecalculating(false)
      fireToast('✓ Retention model recalculated — scores refreshed from latest shift data')
    }, 1600)
  }, [fireToast])

  const openPanel = useCallback((s: StaffRetention) => setSelectedStaff(s), [])
  const closePanel = useCallback(() => setSelectedStaff(null), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePanel])

  const TABS: Array<{ id: TabId; label: string; icon: typeof UserMinus }> = [
    { id: 'overview',  label: 'Risk Overview',    icon: UserMinus },
    { id: 'units',     label: 'By Unit',           icon: BarChart3 },
    { id: 'trends',    label: '12-Week Trends',    icon: TrendingDown },
    { id: 'costs',     label: 'Cost Analysis',     icon: DollarSign },
  ]

  const FILTERS: Array<{ id: FilterId; label: string; count: number }> = [
    { id: 'all',      label: 'All',      count: staff.length },
    { id: 'critical', label: 'Critical', count: staff.filter(s => s.riskLevel === 'critical').length },
    { id: 'high',     label: 'High Risk',count: staff.filter(s => s.riskLevel === 'high').length },
    { id: 'moderate', label: 'Moderate', count: staff.filter(s => s.riskLevel === 'moderate').length },
    { id: 'stable',   label: 'Stable',   count: staff.filter(s => s.riskLevel === 'stable').length },
  ]

  const filterColors: Record<FilterId, string> = {
    all:      'bg-violet-600 text-white',
    critical: 'bg-red-500 text-white',
    high:     'bg-orange-500 text-white',
    moderate: 'bg-amber-500 text-white',
    stable:   'bg-emerald-500 text-white',
  }
  const filterInactive: Record<FilterId, string> = {
    all:      'border-slate-200 text-slate-500 hover:bg-slate-50',
    critical: 'border-red-200 text-red-600 hover:bg-red-50',
    high:     'border-orange-200 text-orange-600 hover:bg-orange-50',
    moderate: 'border-amber-200 text-amber-600 hover:bg-amber-50',
    stable:   'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
  }

  return (
    <div id="retention-page" className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow">
              <UserMinus size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Retention &amp; Flight Risk Intelligence</h1>
              <p className="text-xs text-slate-500">{summary.totalStaff} nurses monitored · predictive turnover analysis</p>
            </div>
          </div>
          <button
            id="recalculate-btn"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
          >
            <RefreshCw size={14} className={recalculating ? 'animate-spin' : ''} />
            {recalculating ? 'Recalculating…' : 'Recalculate Scores'}
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div id="kpi-strip" className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div id="kpi-at-risk" className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">At-Risk Nurses</span>
            </div>
            <p className="text-3xl font-black text-red-600">{summary.atRiskCount}</p>
            <p className="text-xs text-red-500 mt-0.5">critical + high risk combined</p>
          </div>
          <div id="kpi-projected-cost" className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Projected Cost</span>
            </div>
            <p className="text-3xl font-black text-orange-600">{formatCost(summary.projectedCost)}</p>
            <p className="text-xs text-orange-500 mt-0.5">if all at-risk nurses leave</p>
          </div>
          <div id="kpi-avg-score" className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-violet-500" />
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">Avg Score</span>
            </div>
            <p className="text-3xl font-black text-violet-600">{summary.avgScore}</p>
            <p className="text-xs text-violet-500 mt-0.5">hospital-wide retention score</p>
          </div>
          <div id="kpi-flagged-week" className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">New This Week</span>
            </div>
            <p className="text-3xl font-black text-amber-600">{summary.flaggedThisWeek}</p>
            <p className="text-xs text-amber-500 mt-0.5">newly crossed risk threshold</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === id
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Icon size={14} />
              {label}
              {id === 'overview' && summary.atRiskCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{summary.atRiskCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-6 py-6">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" id="overview-tab"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ ease: 'easeOut' as const, duration: 0.18 }}
            >
              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    id={`filter-${f.id}`}
                    onClick={() => setFilter(f.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      filter === f.id ? filterColors[f.id] : filterInactive[f.id]
                    }`}
                  >
                    {f.label} <span className="ml-1 opacity-80">{f.count}</span>
                  </button>
                ))}
              </div>

              {filteredStaff.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No nurses in this risk category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredStaff.map(s => (
                      <RiskCard key={s.id} staff={s} onClick={() => openPanel(s)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'units' && (
            <motion.div key="units" id="units-tab"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ ease: 'easeOut' as const, duration: 0.18 }}
            >
              <UnitRiskChart />
            </motion.div>
          )}

          {tab === 'trends' && (
            <motion.div key="trends" id="trends-tab"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ ease: 'easeOut' as const, duration: 0.18 }}
            >
              <TrendChart />

              {/* Unit trend table */}
              <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unit 12-Week Summary</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {units.map(u => (
                    <div key={u.unit} data-id={`trend-unit-row-${u.unit}`} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-12 ${u.color}`}>{u.abbr}</span>
                        <div className="flex gap-1">
                          {UNIT_WEEK_DATA[u.unit].map((v, i) => {
                            const minV = Math.min(...UNIT_WEEK_DATA[u.unit])
                            const maxV = Math.max(...UNIT_WEEK_DATA[u.unit])
                            const range = maxV - minV || 1
                            const hPct = ((v - minV) / range) * 70 + 30
                            return (
                              <div key={i} className="w-2 flex flex-col justify-end" style={{ height: 24 }}>
                                <div
                                  className={`w-full rounded-sm ${i === 11 ? (u.color.replace('text-', 'bg-')) : 'bg-slate-200'}`}
                                  style={{ height: `${hPct}%` }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">Start: {UNIT_WEEK_DATA[u.unit][0]}</span>
                        <span className="text-sm font-black text-slate-700">Now: {UNIT_WEEK_DATA[u.unit][11]}</span>
                        {u.trend === 'declining'  && <TrendingDown size={14} className="text-red-500" />}
                        {u.trend === 'improving'  && <TrendingUp size={14} className="text-emerald-500" />}
                        {u.trend === 'stable'     && <Minus size={14} className="text-slate-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'costs' && (
            <motion.div key="costs" id="costs-tab"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ ease: 'easeOut' as const, duration: 0.18 }}
            >
              <CostPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence>
        {selectedStaff && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
            />
            <DetailPanel
              staff={selectedStaff}
              onClose={closePanel}
              onIntervene={handleIntervene}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Top-right risk summary strip ── */}
      <div className="fixed top-20 right-4 z-20 hidden xl:flex flex-col gap-1.5 pointer-events-none">
        {(['critical', 'high', 'moderate', 'stable'] as RiskLevel[]).map(r => {
          const count = staff.filter(s => s.riskLevel === r).length
          const m = RISK_META[r]
          return (
            <div key={r} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${m.bg} border ${m.border} shadow-sm`}>
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
              <span className={`text-[10px] font-bold ${m.textDark}`}>{m.short}</span>
              <span className={`text-[10px] font-black ${m.color}`}>{count}</span>
            </div>
          )
        })}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-[10px] font-bold text-slate-500">Total</span>
          <span className="text-[10px] font-black text-slate-700">{staff.length}</span>
        </div>
      </div>

      {/* ── Chevron hint ── */}
      {selectedStaff && (
        <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50 bg-slate-800/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
          <ChevronRight size={12} />
          Viewing {selectedStaff.name} · Click backdrop to close
        </div>
      )}

      <Toast msg={toastMsg} visible={toastVisible} />
    </div>
  )
}
