import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, TrendingUp, TrendingDown, Minus,
  CheckCircle2, ChevronDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Target, Users, Zap, BarChart2,
  Plus, X, Circle,
} from 'lucide-react'
import {
  getDomains, getUnitScores, getCorrelations, getActions,
  getCompositeScore, getNationalComposite, getHospitalTrend,
  getScorePercentile, updateActionStatus, addAction,
  type ActionItem, type ActionStatus, type ActionType, type UnitKey,
  HCAHPS_DOMAINS,
} from '../data/experienceData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function delta(current: number, prev: number) {
  const d = current - prev
  return { d, sign: d > 0 ? '+' : '', color: d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-500' : 'text-slate-400', icon: d > 0 ? <ArrowUpRight size={11}/> : d < 0 ? <ArrowDownRight size={11}/> : <Minus size={11}/> }
}

function scoreColor(score: number, benchmark: number) {
  if (score >= benchmark + 2) return 'text-emerald-600'
  if (score >= benchmark - 2) return 'text-slate-700'
  return 'text-red-600'
}

function scoreBg(score: number, benchmark: number) {
  if (score >= benchmark + 2) return 'bg-emerald-50 border-emerald-200'
  if (score >= benchmark - 2) return 'bg-slate-50 border-slate-200'
  if (score >= benchmark - 8) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

// ── Composite Gauge ───────────────────────────────────────────────────────────

function CompositeGauge({ score, national }: { score: number; national: number }) {
  const pct = score / 100
  const r = 54, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  // Semi-circle: 180° arc from 180° to 0° (left to right along bottom)
  const arcLen = circ * 0.6   // 60% of circle = 216° sweep
  const gap = circ - arcLen

  const scoreArc = arcLen * pct
  const nationalArc = arcLen * (national / 100)

  return (
    <div id="composite-gauge" className="flex flex-col items-center">
      <svg width="128" height="88" viewBox="0 0 128 88">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10"
          strokeDasharray={`${arcLen} ${gap}`} strokeDashoffset={circ * 0.2}
          strokeLinecap="round" />
        {/* National benchmark */}
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="3"
          strokeDasharray={`${nationalArc} ${circ - nationalArc}`} strokeDashoffset={circ * 0.2}
          strokeLinecap="round" />
        {/* Score arc */}
        <motion.circle cx={cx} cy={cy} r={r} fill="none"
          stroke={score >= national ? '#10b981' : score >= national - 5 ? '#f59e0b' : '#ef4444'}
          strokeWidth="10"
          strokeDasharray={`${arcLen} ${gap}`} strokeDashoffset={circ * 0.2}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${scoreArc} ${circ - scoreArc + gap}` }}
          transition={{ duration: 1.2, ease: 'easeOut' as const }}
        />
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 20, fontWeight: 900, fontFamily: 'inherit' }}>{score}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, fontFamily: 'inherit' }}>/ 100</text>
        <text x={cx} y={cy + 24} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 8, fontFamily: 'inherit' }}>Composite</text>
      </svg>
      <div className="flex items-center gap-4 text-[10px] mt-1">
        <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-emerald-500" /><span className="text-slate-500">Our score</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-1 rounded-full bg-slate-400" /><span className="text-slate-500">National avg {national}</span></div>
      </div>
    </div>
  )
}

// ── Trend Line (SVG) ──────────────────────────────────────────────────────────

function TrendLine({ data, color, height = 48, showLabels = false }: { data: { month: string; score: number; annotation?: string }[]; color: string; height?: number; showLabels?: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const w = 100, h = height, pad = 4
  const min = Math.min(...data.map(d => d.score)) - 2
  const max = Math.max(...data.map(d => d.score)) + 2
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - 2 * pad))
  const ys = data.map(d => h - pad - ((d.score - min) / (max - min)) * (h - 2 * pad))
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const areaPath = path + ` L ${xs[xs.length-1].toFixed(1)} ${h} L ${xs[0].toFixed(1)} ${h} Z`

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 100 ${h}`} className="w-full overflow-visible" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} />
        <motion.path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' as const }} />
        {/* Annotation dots */}
        {data.map((d, i) => d.annotation ? (
          <circle key={i} cx={xs[i]} cy={ys[i]} r="3.5" fill={color} opacity="0.9" />
        ) : null)}
        {/* Hover dots */}
        {data.map((_d, i) => (
          <circle key={`h-${i}`} cx={xs[i]} cy={ys[i]} r="5" fill="transparent"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }} />
        ))}
        {hovered !== null && (
          <circle cx={xs[hovered]} cy={ys[hovered]} r="3" fill={color} />
        )}
      </svg>
      {/* Tooltip */}
      {hovered !== null && (
        <div className="absolute z-10 bg-slate-800 text-white text-[10px] rounded-lg px-2 py-1.5 pointer-events-none whitespace-nowrap shadow-xl"
          style={{ left: `${(hovered / (data.length - 1)) * 100}%`, top: 0, transform: 'translateX(-50%) translateY(-110%)' }}>
          <p className="font-bold">{data[hovered].month}: {data[hovered].score}</p>
          {data[hovered].annotation && <p className="text-slate-300">{data[hovered].annotation}</p>}
        </div>
      )}
      {showLabels && (
        <div className="flex justify-between mt-1">
          {data.filter((_, i) => i % 3 === 0).map((d, i) => (
            <span key={i} className="text-[8px] text-slate-400">{d.month}</span>
          ))}
          <span className="text-[8px] text-red-500 font-bold">Now</span>
        </div>
      )}
    </div>
  )
}

// ── Domain Bar ────────────────────────────────────────────────────────────────

function DomainBar({ domain }: { domain: typeof HCAHPS_DOMAINS[0] }) {
  const dlt = delta(domain.score, domain.prev)
  const vs = domain.score - domain.benchmark
  return (
    <motion.div
      layout
      data-id={`domain-${domain.id}`}
      className={`rounded-2xl border p-4 ${scoreBg(domain.score, domain.benchmark)}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-slate-700 leading-snug">{domain.label}</p>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${dlt.color}`}>
            {dlt.icon}{dlt.sign}{dlt.d}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-black ${scoreColor(domain.score, domain.benchmark)}`}>{domain.score}</span>
        <span className="text-xs text-slate-400">vs {domain.benchmark} natl.</span>
        <span className={`text-[10px] font-bold ml-auto ${vs >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {vs >= 0 ? '+' : ''}{vs} pts
        </span>
      </div>

      {/* Score bar */}
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        {/* Benchmark marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${domain.benchmark}%` }} />
        <motion.div
          className={`h-full rounded-full ${domain.score >= domain.benchmark ? 'bg-emerald-500' : domain.score >= domain.benchmark - 8 ? 'bg-amber-500' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${domain.score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
        />
      </div>
      <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{domain.description}</p>
    </motion.div>
  )
}

// ── Unit Leaderboard Row ──────────────────────────────────────────────────────

function UnitRow({ unit, rank, onSelect, selected }: { unit: ReturnType<typeof getUnitScores>[0]; rank: number; onSelect: () => void; selected: boolean }) {
  const trendDir = unit.trend[11] > unit.trend[8] ? 'up' : unit.trend[11] < unit.trend[8] ? 'down' : 'flat'
  return (
    <button
      data-id={`unit-row-${unit.unit}`}
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selected ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-100' : 'border-transparent hover:bg-slate-50'}`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${rank <= 3 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{rank}</span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-slate-800">{unit.unit}</p>
        <p className="text-[10px] text-slate-500">{unit.surveys} surveys · {unit.responseRate}% response</p>
      </div>
      <div className="w-16 shrink-0">
        <TrendLine data={unit.trend.map((s, i) => ({ month: String(i), score: s }))} color={trendDir === 'up' ? '#10b981' : trendDir === 'down' ? '#ef4444' : '#94a3b8'} height={24} />
      </div>
      <span className={`text-xl font-black w-10 text-right ${unit.composite >= 80 ? 'text-emerald-600' : unit.composite >= 72 ? 'text-amber-600' : 'text-red-600'}`}>
        {unit.composite}
      </span>
      <span className="text-slate-300">
        {trendDir === 'up' ? <TrendingUp size={13} className="text-emerald-500" /> : trendDir === 'down' ? <TrendingDown size={13} className="text-red-500" /> : <Minus size={13} className="text-slate-400" />}
      </span>
    </button>
  )
}

// ── Unit Detail Panel ─────────────────────────────────────────────────────────

function UnitDetailPanel({ unit }: { unit: ReturnType<typeof getUnitScores>[0] }) {
  return (
    <motion.div
      id="unit-detail"
      key={unit.unit}
      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className={`px-5 py-4 bg-gradient-to-r ${unit.color} text-white`}>
        <p className="text-base font-black">{unit.unit} · {unit.composite} composite</p>
        <p className="text-sm opacity-80">12-Month Trend</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        <TrendLine
          data={unit.trend.map((s, i) => ({ month: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'][i], score: s }))}
          color={unit.composite >= 78 ? '#10b981' : unit.composite >= 70 ? '#f59e0b' : '#ef4444'}
          height={60} showLabels
        />
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:'Float ratio', value:`${unit.floatRatio}%`, warn: unit.floatRatio > 25 },
            { label:'Avg tenure', value:`${unit.nursesTenure}yr`, warn: unit.nursesTenure < 2.5 },
            { label:'Call-out rate', value:`${unit.callOutRate}/shift`, warn: unit.callOutRate > 0.8 },
            { label:'Response rate', value:`${unit.responseRate}%`, warn: unit.responseRate < 30 },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2.5 border ${s.warn ? 'bg-red-50 border-red-200' : `${unit.bgLight} ${unit.borderColor}`}`}>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-sm font-bold ${s.warn ? 'text-red-700' : 'text-slate-800'}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {unit.insights.map((ins, i) => (
            <p key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug">
              <span className="mt-0.5 shrink-0 text-slate-400">·</span>{ins}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Correlation Card ──────────────────────────────────────────────────────────

function CorrelationCard({ corr }: { corr: ReturnType<typeof getCorrelations>[0] }) {
  const [expanded, setExpanded] = useState(false)
  const sev = corr.severity === 'critical' ? { dot:'bg-red-500', cls:'border-red-200 bg-red-50', badge:'bg-red-100 text-red-700' }
    : corr.severity === 'warning' ? { dot:'bg-amber-400', cls:'border-amber-200 bg-amber-50', badge:'bg-amber-100 text-amber-700' }
    : { dot:'bg-emerald-500', cls:'border-emerald-200 bg-emerald-50', badge:'bg-emerald-100 text-emerald-700' }
  return (
    <motion.div
      layout
      data-id={`corr-${corr.id}`}
      className={`rounded-2xl border-2 ${sev.cls} overflow-hidden`}
    >
      <button className="w-full flex items-start gap-3 px-4 py-3 text-left" onClick={() => setExpanded(!expanded)}>
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-snug">{corr.finding}</p>
          <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{corr.impact}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sev.badge}`}>{corr.dataPoints.toLocaleString()} surveys</span>
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-current/10">
              <p className="text-xs text-slate-700 leading-relaxed mt-3">{corr.detail}</p>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {corr.units.map(u => (
                  <span key={u} className="text-[10px] font-semibold bg-white/70 border border-slate-200 px-2 py-0.5 rounded-full">{u}</span>
                ))}
                <span className="ml-auto text-[10px] font-bold text-slate-600 bg-white/70 border border-slate-200 px-2 py-0.5 rounded-full">{corr.revenueImpact}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Action Card ───────────────────────────────────────────────────────────────

const STATUS_META: Record<ActionStatus, { label: string; cls: string; dot: string }> = {
  open:        { label:'Open',        cls:'bg-slate-100 text-slate-600',   dot:'bg-slate-400' },
  'in-progress':{ label:'In Progress', cls:'bg-amber-100 text-amber-700',   dot:'bg-amber-500' },
  complete:    { label:'Complete',    cls:'bg-emerald-100 text-emerald-700', dot:'bg-emerald-500' },
}

const TYPE_META: Record<ActionType, { icon: React.ReactNode; label: string }> = {
  staffing:    { icon: <Users size={12} />, label: 'Staffing' },
  training:    { icon: <Target size={12} />, label: 'Training' },
  process:     { icon: <Zap size={12} />, label: 'Process' },
  recognition: { icon: <Star size={12} />, label: 'Recognition' },
  rounding:    { icon: <Circle size={12} />, label: 'Rounding' },
}

function ActionCard({ action, onStatusChange }: { action: ActionItem; onStatusChange: (id: string, s: ActionStatus) => void }) {
  const sm = STATUS_META[action.status]
  const tm = TYPE_META[action.type]
  return (
    <motion.div
      layout
      data-id={`action-${action.id}`}
      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
      className={`bg-white rounded-2xl border-2 p-4 ${action.status === 'complete' ? 'border-emerald-200 opacity-75' : action.status === 'in-progress' ? 'border-amber-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sm.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wide">{tm.icon}{tm.label}</span>
            {action.unit && <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{action.unit}</span>}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto ${sm.cls}`}>{sm.label}</span>
          </div>
          <p className={`text-sm font-bold ${action.status === 'complete' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{action.title}</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{action.detail}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-500">Owner: <span className="font-semibold text-slate-700">{action.owner}</span></span>
            <span className="text-[10px] text-slate-500">Due: <span className="font-semibold text-slate-700">{action.dueDate}</span></span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              +{action.projectedGain} pts projected
            </span>
          </div>
        </div>
      </div>

      {action.status !== 'complete' && (
        <div className="flex gap-2 mt-3">
          {action.status === 'open' && (
            <button
              aria-label={`Start ${action.id}`}
              onClick={() => onStatusChange(action.id, 'in-progress')}
              className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
            >Start</button>
          )}
          <button
            aria-label={`Complete ${action.id}`}
            onClick={() => onStatusChange(action.id, 'complete')}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 size={12} className="inline mr-1" />Mark Complete
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Add Action Modal ──────────────────────────────────────────────────────────

const UNITS: UnitKey[] = ['ICU','CCU','ED','MS-A','MS-B','Oncology','Telemetry']
const ACTION_TYPES: ActionType[] = ['staffing','training','process','recognition','rounding']

function AddActionModal({ onAdd, onClose }: { onAdd: (a: Omit<ActionItem,'id'|'status'>) => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [type, setType] = useState<ActionType>('staffing')
  const [unit, setUnit] = useState<UnitKey | ''>('')
  const [owner, setOwner] = useState('Janet Morrison, RN')
  const [dueDate, setDueDate] = useState('Apr 15')
  const [projected, setProjected] = useState(3)

  const canSubmit = title.trim() && owner.trim() && dueDate.trim()

  return (
    <motion.div id="add-action-modal" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-violet-600 px-5 py-4 flex items-center justify-between">
          <p className="text-white font-bold flex items-center gap-2"><Plus size={16} /> Add Action Item</p>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Action Title</label>
            <input id="action-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Implement bedside handoff in MS-B"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
              <select id="action-type-select" value={type} onChange={e => setType(e.target.value as ActionType)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Unit (opt.)</label>
              <select id="action-unit-select" value={unit} onChange={e => setUnit(e.target.value as UnitKey | '')}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">All Units</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Detail</label>
            <textarea id="action-detail-input" value={detail} onChange={e => setDetail(e.target.value)} rows={2}
              placeholder="Describe the action and expected outcome..."
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Owner</label>
              <input value={owner} onChange={e => setOwner(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Due Date</label>
              <input id="action-due-input" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Projected Score Gain (+{projected} pts)</label>
            <input type="range" min={1} max={15} value={projected} onChange={e => setProjected(Number(e.target.value))}
              className="w-full accent-violet-600" />
          </div>
          <button aria-label="Save action item" disabled={!canSubmit} onClick={() => onAdd({ title, detail, type, unit: unit || undefined, owner, dueDate, projectedGain: projected, effort: 'medium' })}
            className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-40">
            Add Action Item
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'domains' | 'correlations' | 'actions'

export default function Experience() {
  const [tab, setTab] = useState<Tab>('overview')
  const [units] = useState(getUnitScores)
  const [domains] = useState(getDomains)
  const [correlations] = useState(getCorrelations)
  const [actions, setActions] = useState(getActions)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(units[0].unit)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const composite = getCompositeScore()
  const national = getNationalComposite()
  const hospitalTrend = getHospitalTrend()
  const percentile = getScorePercentile(composite)

  function showToast(msg: string) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(''), 3500)
  }

  function handleStatusChange(id: string, status: ActionStatus) {
    updateActionStatus(id, status)
    setActions(getActions())
    showToast(status === 'complete' ? '✓ Action marked complete' : 'Action started — tracking progress')
  }

  function handleAddAction(data: Omit<ActionItem,'id'|'status'>) {
    addAction(data)
    setActions(getActions())
    setAddOpen(false)
    showToast(`Added: ${data.title}`)
  }

  const sortedUnits = [...units].sort((a, b) => b.composite - a.composite)
  const selectedUnitData = units.find(u => u.unit === selectedUnit)
  const openActions = actions.filter(a => a.status !== 'complete')
  const totalProjected = openActions.reduce((sum, a) => sum + a.projectedGain, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Patient Experience Intelligence</h1>
              <p className="text-xs text-slate-500">HCAHPS · Staffing Correlations · Action Plan · Mercy General Hospital</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Percentile Rank</p>
              <p className="text-xl font-black text-violet-600">{percentile}th</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Quarter</p>
              <p className="text-xs font-bold text-slate-700">Q1 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI strip */}
      <div id="kpi-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
        {[
          { id:'kpi-composite',   label:'Composite Score', value:String(composite),  sub:`National avg: ${national}`,  color: composite >= national ? 'text-emerald-600' : 'text-red-600', bg:'bg-white' },
          { id:'kpi-percentile',  label:'Percentile Rank', value:`${percentile}th`,  sub:'vs. national peers',          color:'text-violet-600', bg:'bg-white' },
          { id:'kpi-open-actions',label:'Open Actions',    value:String(openActions.length), sub:`+${totalProjected.toFixed(1)} pts projected`, color:'text-amber-600', bg:'bg-white' },
          { id:'kpi-top-unit',    label:'Top Unit',        value:sortedUnits[0].unit, sub:`${sortedUnits[0].composite} composite`, color:'text-emerald-600', bg:'bg-white' },
        ].map(k => (
          <div key={k.id} id={k.id} className={`${k.bg} px-5 py-3.5 flex items-start gap-3`}>
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
            { id:'overview',     label:'Overview',    icon:<Star size={13}/> },
            { id:'domains',      label:'8 Domains',   icon:<BarChart2 size={13}/> },
            { id:'correlations', label:'Insights',    icon:<Sparkles size={13}/>, badge: correlations.filter(c => c.severity === 'critical').length },
            { id:'actions',      label:'Action Plan', icon:<Target size={13}/>, badge: openActions.length },
          ] as { id:Tab; label:string; icon:React.ReactNode; badge?:number }[]).map(t => (
            <button key={t.id} id={`tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${tab === t.id ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
              {t.badge ? <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left: gauge + 12-month trend */}
                <div className="space-y-4">
                  {/* Composite card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Hospital Composite</p>
                    <CompositeGauge score={composite} national={national} />
                    <div className="mt-4 space-y-2">
                      {[
                        { label:'Above benchmark', count: domains.filter(d => d.score >= d.benchmark).length },
                        { label:'Below benchmark', count: domains.filter(d => d.score < d.benchmark).length },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{s.label}</span>
                          <span className="font-bold text-slate-800">{s.count} domains</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 12-month trend */}
                  <div id="hospital-trend" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-violet-500" /> 12-Month Composite
                    </p>
                    <TrendLine data={hospitalTrend} color="#8b5cf6" height={56} showLabels />
                    <div className="flex justify-between mt-3 text-xs">
                      <span className="text-slate-500">Apr 2025: <span className="font-bold text-slate-700">{hospitalTrend[0].score}</span></span>
                      <span className="text-slate-500">Now: <span className="font-bold text-violet-600">{hospitalTrend[hospitalTrend.length-1].score}</span></span>
                    </div>
                  </div>
                </div>

                {/* Center: Unit leaderboard */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Leaderboard</p>
                  <div id="unit-leaderboard" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {sortedUnits.map((u, i) => (
                      <div key={u.unit} className={i < sortedUnits.length - 1 ? 'border-b border-slate-100' : ''}>
                        <UnitRow unit={u} rank={i+1} selected={selectedUnit === u.unit} onSelect={() => setSelectedUnit(u.unit === selectedUnit ? null : u.unit)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Unit detail */}
                <div>
                  <AnimatePresence mode="wait">
                    {selectedUnitData ? (
                      <UnitDetailPanel key={selectedUnitData.unit} unit={selectedUnitData} />
                    ) : (
                      <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400">
                        <Star size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Select a unit to see its detail</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DOMAINS TAB ── */}
          {tab === 'domains' && (
            <motion.div key="domains" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div id="domains-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {domains.map(d => <DomainBar key={d.id} domain={d} />)}
              </div>
              <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Domain Benchmark Comparison</p>
                <div id="benchmark-table" className="space-y-3">
                  {[...domains].sort((a,b) => (a.score - a.benchmark) - (b.score - b.benchmark)).map(d => {
                    const vs = d.score - d.benchmark
                    return (
                      <div key={d.id} data-id={`benchmark-row-${d.id}`} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700 w-44 shrink-0 truncate">{d.shortLabel}</span>
                        <div className="flex-1 relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" style={{ left:`${d.benchmark}%` }} />
                          <motion.div className={`h-full rounded-full ${vs >= 0 ? 'bg-emerald-400' : vs >= -8 ? 'bg-amber-400' : 'bg-red-400'}`}
                            initial={{ width:0 }} animate={{ width:`${d.score}%` }}
                            transition={{ duration:0.6, ease:'easeOut' as const }} />
                        </div>
                        <span className={`text-xs font-black w-12 text-right ${vs >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{vs >= 0 ? '+':''}{vs}</span>
                        <span className="text-xs text-slate-400 w-6 text-right">{d.score}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CORRELATIONS TAB ── */}
          {tab === 'correlations' && (
            <motion.div key="correlations" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="mb-4 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <Sparkles size={16} className="text-violet-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-violet-800">AI-Powered Staffing Correlations</p>
                  <p className="text-xs text-violet-700 mt-0.5">These findings are derived from correlating {correlations.reduce((s,c) => s + c.dataPoints, 0).toLocaleString()} patient surveys with actual staffing data. Expand each to see the evidence.</p>
                </div>
              </div>
              <div id="correlations-list" className="space-y-4">
                {correlations.map(c => <CorrelationCard key={c.id} corr={c} />)}
              </div>
            </motion.div>
          )}

          {/* ── ACTIONS TAB ── */}
          {tab === 'actions' && (
            <motion.div key="actions" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">{openActions.length} open actions · +{totalProjected.toFixed(1)} pts projected</p>
                  <p className="text-xs text-slate-500">Complete all actions to reach estimated composite: {(composite + totalProjected * 0.4).toFixed(1)}</p>
                </div>
                <button id="add-action-btn" onClick={() => setAddOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow">
                  <Plus size={15} /> Add Action
                </button>
              </div>

              <div id="actions-list" className="space-y-4">
                {/* In Progress first */}
                {actions.filter(a => a.status === 'in-progress').map(a => (
                  <ActionCard key={a.id} action={a} onStatusChange={handleStatusChange} />
                ))}
                {/* Open */}
                {actions.filter(a => a.status === 'open').map(a => (
                  <ActionCard key={a.id} action={a} onStatusChange={handleStatusChange} />
                ))}
                {/* Complete */}
                {actions.filter(a => a.status === 'complete').map(a => (
                  <ActionCard key={a.id} action={a} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Action Modal */}
      <AnimatePresence>
        {addOpen && <AddActionModal onAdd={handleAddAction} onClose={() => setAddOpen(false)} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div id="action-toast" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
