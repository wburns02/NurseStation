import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Star, TrendingUp, TrendingDown,
  MessageSquare, Calendar, FileText, Award, Phone, Bell,
  X, ChevronDown, ChevronUp, Minus, Search,
} from 'lucide-react'
import {
  STAFF_INTELLIGENCE, RISK_META, FLAG_META,
  getAtRiskStaff, getIntelligenceSummary,
  getActionState, fireAction,
  type StaffIntelligenceRecord, type RiskLevel, type SuggestedAction,
} from '../data/staffIntelligenceData'

// ─── Sparkline chart ────────────────────────────────────────────────────────
function Sparkline({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const isUp = last >= prev
  const lineColor = last >= 70 ? '#10b981' : last >= 55 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Latest dot */}
      {(() => {
        const [lx, ly] = pts[pts.length - 1].split(',').map(Number)
        return <circle cx={lx} cy={ly} r="2.5" fill={lineColor} />
      })()}
      {/* Trend indicator is unused here — kept for caller */}
      {isUp && null}
    </svg>
  )
}

// ─── Score ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#8b5cf6' : score >= 65 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Component score bar ─────────────────────────────────────────────────────
function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-xs w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        />
      </div>
      <span className="text-slate-300 text-xs w-8 text-right">{score}</span>
    </div>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────
const ACTION_ICONS: Record<SuggestedAction['icon'], React.ReactNode> = {
  message:  <MessageSquare size={12} />,
  calendar: <Calendar size={12} />,
  document: <FileText size={12} />,
  star:     <Award size={12} />,
  alert:    <Bell size={12} />,
  phone:    <Phone size={12} />,
}

function ActionBtn({ staffId, action }: { staffId: string; action: SuggestedAction }) {
  const [localState, setLocalState] = useState<'idle' | 'pending' | 'done'>(
    () => getActionState(staffId, action.id) as 'idle' | 'pending' | 'done'
  )
  const urgencyColor = action.urgency === 'urgent'
    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30'
    : action.urgency === 'recommended'
    ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-violet-500/30'
    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'

  function handleClick() {
    if (localState !== 'idle') return
    setLocalState('pending')
    fireAction(staffId, action.id)
    setTimeout(() => setLocalState('done'), 1000)
  }

  return (
    <button
      aria-label={`Action ${action.id}`}
      onClick={handleClick}
      disabled={localState !== 'idle'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${urgencyColor} disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {localState === 'pending' ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : localState === 'done' ? (
        <span className="text-emerald-400">✓</span>
      ) : (
        ACTION_ICONS[action.icon]
      )}
      <span>{localState === 'done' ? 'Done!' : action.label}</span>
    </button>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ record, onClose }: { record: StaffIntelligenceRecord; onClose: () => void }) {
  const meta = RISK_META[record.riskLevel]
  const trendDir = record.scoreTrend[7] >= record.scoreTrend[6]
  return (
    <motion.aside
      id="intelligence-detail-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-700 flex flex-col z-50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow">
            {record.initials}
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">{record.name}</h2>
            <p className="text-slate-400 text-xs">{record.role} · {record.unit}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${meta.bg} ${meta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        </div>
        <button
          aria-label="Close intelligence detail"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Score + sparkline */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-slate-400 text-xs mb-1">Performance Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{record.performanceScore}</span>
                <span className="text-slate-500 text-sm">/100</span>
                {trendDir
                  ? <TrendingUp size={14} className="text-emerald-400" />
                  : <TrendingDown size={14} className="text-red-400" />
                }
              </div>
            </div>
            <div className="relative">
              <ScoreRing score={record.performanceScore} size={56} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold" style={{ transform: 'rotate(90deg)' }}>
                  {record.performanceScore}
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mb-2">8-week trend</p>
          <Sparkline data={record.scoreTrend} width={320} height={36} />
        </div>

        {/* Flight risk */}
        {record.flightRiskPercent !== null && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-300 text-sm font-semibold">Flight Risk Detected</span>
            </div>
            <p className="text-slate-300 text-xs">
              AI predicts <span className="text-red-300 font-bold">{record.flightRiskPercent}% probability</span> of departure within 90 days based on attendance pattern, engagement trend, and historical data.
            </p>
          </div>
        )}

        {/* Component scores */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-white text-sm font-semibold mb-3">Score Breakdown</p>
          <div className="space-y-2.5">
            <ScoreBar score={record.attendanceScore}  label="Attendance" />
            <ScoreBar score={record.wellbeingScore}   label="Wellbeing" />
            <ScoreBar score={record.trainingScore}    label="Training" />
            <ScoreBar score={record.credentialScore}  label="Credentials" />
            <ScoreBar score={record.reliabilityScore} label="Reliability" />
            <ScoreBar score={record.engagementScore}  label="Engagement" />
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Call-outs', value: record.calloutsThisMonth, sub: 'this month', warn: record.calloutsThisMonth >= 2 },
            { label: 'OT Hours',  value: record.overtimeHours,     sub: 'this period', warn: record.overtimeHours >= 12 },
            { label: 'Hours/Wk', value: record.hoursThisWeek,     sub: 'this week',   warn: false },
          ].map(m => (
            <div key={m.label} className={`rounded-xl p-3 text-center ${m.warn ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800'}`}>
              <p className={`text-2xl font-black ${m.warn ? 'text-red-300' : 'text-white'}`}>{m.value}</p>
              <p className="text-slate-400 text-[10px] leading-tight mt-0.5">{m.label}</p>
              <p className="text-slate-500 text-[9px]">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Training progress */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-sm font-semibold">Training</p>
            <span className="text-slate-400 text-xs">{record.completedModules}/{record.totalModules} modules</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${record.completedModules === record.totalModules ? 'bg-emerald-500' : record.completedModules / record.totalModules >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${(record.completedModules / record.totalModules) * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' as const, delay: 0.2 }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            {record.totalModules - record.completedModules === 0
              ? '✓ All modules complete'
              : `${record.totalModules - record.completedModules} modules remaining`}
          </p>
        </div>

        {/* Flags */}
        {record.flags.length > 0 && (
          <div>
            <p className="text-white text-sm font-semibold mb-2">Flags & Notes</p>
            <div className="space-y-2">
              {record.flags.map(flag => (
                <div
                  key={flag.id}
                  data-id={`flag-${flag.id}`}
                  className={`rounded-lg p-3 border text-xs ${
                    flag.severity === 'critical' ? 'bg-red-500/10 border-red-500/30'
                    : flag.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span>{FLAG_META[flag.category].icon}</span>
                    <div>
                      <span className={`font-semibold ${flag.severity === 'critical' ? 'text-red-300' : flag.severity === 'warning' ? 'text-amber-300' : 'text-slate-300'}`}>
                        {FLAG_META[flag.category].label}
                      </span>
                      <p className="text-slate-400 mt-0.5">{flag.text}</p>
                      <p className="text-slate-600 mt-0.5">{flag.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested actions */}
        <div>
          <p className="text-white text-sm font-semibold mb-2">Suggested Actions</p>
          <div className="flex flex-wrap gap-2">
            {record.suggestedActions.map(action => (
              <ActionBtn key={action.id} staffId={record.id} action={action} />
            ))}
          </div>
        </div>

        {/* Tenure & review */}
        <div className="bg-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
          <div className="flex justify-between"><span>Hire date</span><span className="text-slate-300">{record.hireDate}</span></div>
          <div className="flex justify-between"><span>Tenure</span><span className="text-slate-300">{record.tenure}</span></div>
          <div className="flex justify-between"><span>Last review</span><span className="text-slate-300">{record.lastReviewDate ?? 'Never'}</span></div>
          <div className="flex justify-between"><span>PTO used (YTD)</span><span className="text-slate-300">{record.ptoDaysUsed} days</span></div>
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Sort types ───────────────────────────────────────────────────────────────
type SortKey = 'name' | 'performanceScore' | 'riskLevel' | 'attendanceScore' | 'wellbeingScore' | 'trainingScore'
type SortDir = 'asc' | 'desc'
const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, moderate: 2, good: 3, star: 4 }

// ─── Main component ───────────────────────────────────────────────────────────
export default function StaffIntelligence() {
  const [selected, setSelected] = useState<StaffIntelligenceRecord | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('riskLevel')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all')
  const [search, setSearch] = useState('')
  const [, forceUpdate] = useState(0)

  const summary = useMemo(() => getIntelligenceSummary(), [])
  const atRisk = useMemo(() => getAtRiskStaff(), [])

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }, [sortKey])

  const filtered = useMemo(() => {
    let list = [...STAFF_INTELLIGENCE]
    if (filterRisk !== 'all') list = list.filter(s => s.riskLevel === filterRisk)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.unit.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      let va: number | string, vb: number | string
      if (sortKey === 'riskLevel') { va = RISK_ORDER[a.riskLevel]; vb = RISK_ORDER[b.riskLevel] }
      else if (sortKey === 'name') { va = a.name; vb = b.name }
      else { va = a[sortKey]; vb = b[sortKey] }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filterRisk, search, sortKey, sortDir])

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <Minus size={10} className="text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="text-violet-400" />
      : <ChevronDown size={10} className="text-violet-400" />
  }

  function handleActionInTable(staffId: string, actionId: string) {
    fireAction(staffId, actionId)
    setTimeout(() => forceUpdate(n => n + 1), 1100)
  }

  const FILTERS: { key: RiskLevel | 'all'; label: string }[] = [
    { key: 'all',      label: 'All Staff' },
    { key: 'critical', label: 'Critical' },
    { key: 'high',     label: 'High Risk' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'good',     label: 'Good' },
    { key: 'star',     label: 'Stars' },
  ]

  return (
    <div className="p-6 min-h-full bg-slate-950">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Staff Intelligence</h1>
            <p className="text-slate-400 text-sm mt-0.5">360° performance view · Mercy General · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div id="intelligence-accuracy" className="flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-violet-300 text-sm font-semibold">AI-powered · Live sync</span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { id: 'stat-total',       label: 'Total Staff',      value: summary.total,       sub: 'tracked',        color: 'text-white' },
          { id: 'stat-at-risk',     label: 'At Risk',          value: summary.atRisk,       sub: 'need attention', color: 'text-red-400' },
          { id: 'stat-avg-score',   label: 'Avg Score',        value: summary.avgScore,     sub: 'out of 100',     color: 'text-violet-400' },
          { id: 'stat-flight-risk', label: 'Flight Risk',      value: summary.flightRisks,  sub: '≥50% likelihood', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.id} id={s.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white text-sm font-semibold mt-0.5">{s.label}</p>
            <p className="text-slate-500 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* At-risk strip */}
      {atRisk.length > 0 && (
        <div id="at-risk-strip" className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <h2 className="text-red-300 text-sm font-bold">Immediate Attention Required</h2>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{atRisk.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {atRisk.map(s => {
              const meta = RISK_META[s.riskLevel]
              return (
                <motion.button
                  key={s.id}
                  data-id={`at-risk-card-${s.id}`}
                  onClick={() => setSelected(s)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`shrink-0 w-56 rounded-xl border p-4 text-left transition-all cursor-pointer hover:border-slate-600 ${meta.bg} ${
                    s.riskLevel === 'critical' ? 'border-red-500/40' : 'border-orange-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {s.initials}
                    </div>
                    <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-white font-semibold text-sm leading-tight">{s.name}</p>
                  <p className="text-slate-400 text-xs">{s.role} · {s.unit}</p>
                  {s.flightRiskPercent !== null && (
                    <p className="text-red-300 text-xs mt-1.5 font-medium">⚠ {s.flightRiskPercent}% flight risk</p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-2xl font-black text-white">{s.performanceScore}</span>
                    <span className="text-slate-500 text-xs">/100</span>
                    <TrendingDown size={12} className="text-red-400 ml-1" />
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{s.flags[0]?.text.slice(0, 50)}{s.flags[0]?.text.length > 50 ? '…' : ''}</p>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter + search bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="staff-search"
            type="text"
            placeholder="Search by name, unit, role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-56"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              aria-label={`Filter ${f.label}`}
              onClick={() => setFilterRisk(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterRisk === f.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-slate-500 text-xs ml-auto">{filtered.length} staff</span>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {([
                  ['name',             'Staff Member',  'text-left'],
                  ['riskLevel',        'Risk',          'text-left'],
                  ['performanceScore', 'Score',         'text-center'],
                  ['attendanceScore',  'Attendance',    'text-center'],
                  ['wellbeingScore',   'Wellbeing',     'text-center'],
                  ['trainingScore',    'Training',      'text-center'],
                ] as [SortKey, string, string][]).map(([k, lbl, align]) => (
                  <th
                    key={k}
                    className={`px-4 py-3 text-slate-400 text-xs font-semibold ${align} cursor-pointer hover:text-white select-none`}
                    onClick={() => handleSort(k)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {lbl} <SortIcon k={k} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-slate-400 text-xs font-semibold text-left">Trend</th>
                <th className="px-4 py-3 text-slate-400 text-xs font-semibold text-left">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((s, i) => {
                  const meta = RISK_META[s.riskLevel]
                  const firstAction = s.suggestedActions[0]
                  const actionState = firstAction ? getActionState(s.id, firstAction.id) : 'idle'
                  return (
                    <motion.tr
                      key={s.id}
                      data-id={`staff-row-${s.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setSelected(s)}
                      className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer group transition-colors"
                    >
                      {/* Staff member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow shrink-0">
                            {s.initials}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium leading-tight group-hover:text-violet-300 transition-colors">{s.name}</p>
                            <p className="text-slate-500 text-xs">{s.role} · {s.unit}</p>
                          </div>
                        </div>
                      </td>
                      {/* Risk */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${meta.bg} ${meta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                          {meta.label}
                        </span>
                        {s.flightRiskPercent !== null && (
                          <p className="text-red-400 text-[10px] mt-1">{s.flightRiskPercent}% flight risk</p>
                        )}
                      </td>
                      {/* Score */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <div className="relative w-9 h-9">
                            <ScoreRing score={s.performanceScore} size={36} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold" style={{ transform: 'rotate(90deg)' }}>
                                {s.performanceScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Attendance */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${s.attendanceScore >= 80 ? 'text-emerald-400' : s.attendanceScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.attendanceScore}
                        </span>
                      </td>
                      {/* Wellbeing */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${s.wellbeingScore >= 70 ? 'text-emerald-400' : s.wellbeingScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.wellbeingScore}
                        </span>
                      </td>
                      {/* Training */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${s.trainingScore >= 75 ? 'text-emerald-400' : s.trainingScore >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.trainingScore}
                        </span>
                      </td>
                      {/* Sparkline */}
                      <td className="px-4 py-3">
                        <Sparkline data={s.scoreTrend} width={70} height={24} />
                      </td>
                      {/* Quick action */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {firstAction ? (
                          <button
                            aria-label={`Quick action ${firstAction.id}`}
                            onClick={() => {
                              if (actionState === 'idle') handleActionInTable(s.id, firstAction.id)
                            }}
                            disabled={actionState !== 'idle'}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                              actionState === 'done'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-violet-500/20 border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
                            }`}
                          >
                            {actionState === 'pending' ? (
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : actionState === 'done' ? (
                              '✓'
                            ) : (
                              ACTION_ICONS[firstAction.icon]
                            )}
                            <span>{actionState === 'done' ? 'Done!' : firstAction.label}</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No staff match this filter</div>
          )}
        </div>
      </div>

      {/* Methodology note */}
      <div id="intelligence-methodology" className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} className="text-violet-400" />
          <h3 className="text-white font-semibold text-sm">How the Performance Score Works</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-400">
          <div><span className="text-slate-300 font-medium">Attendance (20%)</span> — Call-out rate, pattern analysis, schedule adherence</div>
          <div><span className="text-slate-300 font-medium">Wellbeing (20%)</span> — Burnout index, PTO utilization, consecutive days, engagement</div>
          <div><span className="text-slate-300 font-medium">Training (15%)</span> — Module completion rate, overdue items, skill gaps</div>
          <div><span className="text-slate-300 font-medium">Credentials (15%)</span> — Certification currency, upcoming renewals, compliance</div>
          <div><span className="text-slate-300 font-medium">Reliability (15%)</span> — Historical shift fill rate, swap history, last-minute changes</div>
          <div><span className="text-slate-300 font-medium">Engagement (15%)</span> — Pulse survey scores, volunteerism, communication responsiveness</div>
        </div>
      </div>

      {/* Detail panel overlay */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelected(null)}
            />
            <DetailPanel key={selected.id} record={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
