// Acuity.tsx — Patient Acuity & Dynamic Staffing Intelligence
// The feature that no competitor has: acuity-adjusted staffing recommendations.
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Minus, X, RefreshCw, ArrowRight, Loader2,
  Heart, Users, DollarSign, Shield,
} from 'lucide-react'
import {
  getUnits, getUnit, getRecommendations, getHospitalSummary,
  updatePatientAcuity, executeRecommendation,
  calcFteNeeded, calcAvgAcuity, getAcuityDistribution, getStaffingStatus,
  ACUITY_META, STATUS_META, UNIT_ORDER, DIAG_LABELS,
  type UnitId, type AcuityLevel, type UnitAcuityData,
  type AcuityPatient,
} from '../data/acuityData'

// ── Acuity badge button ───────────────────────────────────────────────────────

function AcuityBtn({
  level, active, onClick, small,
}: { level: AcuityLevel; active: boolean; onClick: () => void; small?: boolean }) {
  const m = ACUITY_META[level]
  const sz = small ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-xs'
  return (
    <button
      onClick={onClick}
      className={`${sz} rounded-xl font-black border-2 transition-all hover:scale-110 ${active ? `${m.bg} ${m.color} ${m.border} shadow-md scale-105` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
      title={m.label}
    >
      {level}
    </button>
  )
}

// ── Acuity distribution bar ───────────────────────────────────────────────────

function AcuityBar({ patients, height = 8 }: { patients: AcuityPatient[]; height?: number }) {
  const dist = getAcuityDistribution(patients)
  const total = patients.length
  if (total === 0) return <div className="h-2 bg-slate-100 rounded-full" />
  const segments: { level: AcuityLevel; pct: number }[] = [4, 3, 2, 1].map(l => ({
    level: l as AcuityLevel,
    pct: (dist[l as AcuityLevel] / total) * 100,
  })).filter(s => s.pct > 0)

  return (
    <div className="flex rounded-full overflow-hidden" style={{ height }}>
      {segments.map((s, i) => (
        <motion.div
          key={s.level}
          className={ACUITY_META[s.level].dot}
          style={{ width: `${s.pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${s.pct}%` }}
          transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' as const }}
          title={`Acuity ${s.level}: ${dist[s.level]} patients`}
        />
      ))}
    </div>
  )
}

// ── FTE gap indicator ─────────────────────────────────────────────────────────

function FteGap({ onFloor, needed }: { onFloor: number; needed: number }) {
  const gap = onFloor - needed
  const abs = Math.abs(gap)
  const status = getStaffingStatus(onFloor, needed)
  const m = STATUS_META[status]
  const Icon = gap < -0.3 ? TrendingDown : gap > 0.3 ? TrendingUp : Minus
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${m.bg} ${m.border}`}>
      <Icon size={12} className={m.color} />
      <span className={`text-xs font-black ${m.color}`}>
        {gap > 0.1 ? `+${abs.toFixed(1)}` : gap < -0.1 ? `-${abs.toFixed(1)}` : '±0'} FTE
      </span>
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, width = 80, height = 28, color = '#8b5cf6' }: {
  data: number[]; width?: number; height?: number; color?: string
}) {
  const min = Math.min(...data) - 0.5
  const max = Math.max(...data) + 0.5
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const last = data[data.length - 1]
  const [lx, ly] = pts[pts.length - 1].split(',').map(Number)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
      <circle cx={lx} cy={ly} r={3} fill={color} />
      <text x={lx + 4} y={ly + 4} fontSize={9} fill={color} fontWeight="bold">{last.toFixed(1)}</text>
    </svg>
  )
}

// ── Unit overview card ────────────────────────────────────────────────────────

function UnitOverviewCard({
  unit, selected, onClick,
}: { unit: UnitAcuityData; selected: boolean; onClick: () => void }) {
  const fteNeeded = calcFteNeeded(unit.patients)
  const avgAcuity = calcAvgAcuity(unit.patients)
  const status = getStaffingStatus(unit.fteOnFloor, fteNeeded)
  const sm = STATUS_META[status]
  const dist = getAcuityDistribution(unit.patients)
  const totalCare = unit.patients.reduce((s, p) => s + ACUITY_META[p.acuity].careHours, 0)

  const cardBorder = status === 'critical-under'
    ? 'border-red-300 shadow-red-100'
    : status === 'under'
    ? 'border-amber-300 shadow-amber-100'
    : status === 'over' || status === 'critical-over'
    ? 'border-sky-300 shadow-sky-100'
    : 'border-slate-200'

  return (
    <motion.div
      layout
      id={`unit-card-${unit.id}`}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`bg-white rounded-2xl border-2 shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${cardBorder} ${selected ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-black ${unit.color}`}>{unit.abbr}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sm.bg} ${sm.color} border ${sm.border}`}>{sm.label}</span>
          </div>
          <p className="text-[10px] text-slate-400">{unit.label} · {unit.baseRatio} ratio · {unit.census} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">avg acuity</p>
          <p className={`text-xl font-black leading-none ${avgAcuity >= 3 ? 'text-red-600' : avgAcuity >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>{avgAcuity.toFixed(1)}</p>
        </div>
      </div>

      {/* Acuity distribution */}
      <div className="mb-2">
        <AcuityBar patients={unit.patients} height={10} />
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {([4, 3, 2, 1] as AcuityLevel[]).map(l => dist[l] > 0 && (
          <span key={l} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ACUITY_META[l].bg} ${ACUITY_META[l].color}`}>
            {dist[l]}× {ACUITY_META[l].label}
          </span>
        ))}
      </div>

      {/* FTE row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-xl font-black text-slate-800">{unit.fteOnFloor}</span>
            <span className="text-[10px] text-slate-400">on floor</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xl font-black text-violet-600">{fteNeeded.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400">needed</span>
          </div>
          <div className="text-[10px] text-slate-400">{totalCare.toFixed(0)}h care / 12h shift</div>
        </div>
        <FteGap onFloor={unit.fteOnFloor} needed={fteNeeded} />
      </div>

      {/* Trend sparkline */}
      <div className="mt-2 border-t border-slate-100 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-400">7-shift acuity trend</span>
          <Sparkline data={unit.trendScores} width={80} height={22}
            color={avgAcuity >= 3 ? '#ef4444' : avgAcuity >= 2.5 ? '#f59e0b' : '#8b5cf6'} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Patient acuity row ────────────────────────────────────────────────────────

function PatientRow({
  patient, onUpdate,
}: { patient: AcuityPatient; unitId?: UnitId; onUpdate: (bedId: string, level: AcuityLevel) => void }) {
  const m = ACUITY_META[patient.acuity]
  const hours = patient.admitShiftsAgo * 12
  const hoursLabel = hours >= 72 ? `${Math.floor(hours / 24)}d` : `${hours}h`

  return (
    <motion.div
      layout
      data-id={`patient-row-${patient.bedId}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
    >
      <div className="w-20 shrink-0">
        <p className="text-xs font-bold text-slate-800">{patient.bedId}</p>
        <p className="text-[10px] text-slate-400">{hoursLabel} ago</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 truncate">{patient.diagLabel}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{DIAG_LABELS[patient.diagCategory]}</span>
          {patient.dischargeReady && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">Dc ready</span>
          )}
          {patient.isolationPrecautions && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Isolation</span>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {([1, 2, 3, 4] as AcuityLevel[]).map(l => (
          <AcuityBtn
            key={l}
            level={l}
            active={patient.acuity === l}
            small
            onClick={() => onUpdate(patient.bedId, l)}
          />
        ))}
      </div>
      <div className={`w-16 text-right shrink-0`}>
        <span className={`text-xs font-bold ${m.color}`}>{m.careHours}h</span>
        <p className="text-[9px] text-slate-400">care/shift</p>
      </div>
    </motion.div>
  )
}

// ── Unit detail panel ─────────────────────────────────────────────────────────

function UnitDetailPanel({
  unitId, onClose, onAcuityUpdate,
}: {
  unitId: UnitId
  onClose: () => void
  onAcuityUpdate: () => void
}) {
  const [unit, setUnit] = useState(() => getUnit(unitId))

  function handleUpdate(bedId: string, level: AcuityLevel) {
    updatePatientAcuity(unitId, bedId, level)
    setUnit(getUnit(unitId))
    onAcuityUpdate()
  }

  if (!unit) return null
  const fteNeeded = calcFteNeeded(unit.patients)
  const avgAcuity = calcAvgAcuity(unit.patients)
  const totalCare = unit.patients.reduce((s, p) => s + ACUITY_META[p.acuity].careHours, 0)

  return (
    <motion.div
      id="unit-detail-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className={`${unit.bgLight} ${unit.border} border-b px-5 py-4 flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-3">
            <h3 className={`text-base font-black ${unit.color}`}>{unit.label}</h3>
            <span className="text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-lg">{unit.census} patients</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Avg acuity: <span className="font-bold text-slate-700">{avgAcuity.toFixed(1)}</span> ·
            Care hours: <span className="font-bold text-slate-700">{totalCare.toFixed(0)}h</span> ·
            FTE needed: <span className="font-bold text-violet-700">{fteNeeded.toFixed(1)}</span> (on floor: {unit.fteOnFloor})
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Formula reminder */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
        <span className="font-bold text-slate-600">Care hours / patient:</span>
        {([1, 2, 3, 4] as AcuityLevel[]).map(l => (
          <span key={l} className={`${ACUITY_META[l].color} font-semibold`}>
            {ACUITY_META[l].label}: {ACUITY_META[l].careHours}h
          </span>
        ))}
        <span className="ml-auto text-slate-400">Click acuity to update → FTE recalculates instantly</span>
      </div>

      {/* Patient list */}
      <div id={`patient-list-${unitId}`} className="overflow-y-auto max-h-96">
        {unit.patients.map(p => (
          <PatientRow
            key={p.bedId}
            patient={p}
            unitId={unitId}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{unit.patients.filter(p => p.dischargeReady).length} discharge-ready</span>
          <span>{unit.patients.filter(p => p.isolationPrecautions).length} isolation precautions</span>
        </div>
        <FteGap onFloor={unit.fteOnFloor} needed={fteNeeded} />
      </div>
    </motion.div>
  )
}

// ── Recommendation card ───────────────────────────────────────────────────────

function RecCard({ rec, onExecute }: {
  rec: ReturnType<typeof getRecommendations>[0]
  onExecute: (id: string) => void
}) {
  const priority = rec.priority === 'critical' ? { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Critical' }
    : rec.priority === 'high' ? { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'High' }
    : { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', label: 'Normal' }

  const actionIcon: Record<string, React.ReactNode> = {
    'float-in':       <ArrowRight size={13} className="text-violet-600" />,
    'float-out':      <ArrowRight size={13} className="text-violet-600" />,
    'release-early':  <TrendingDown size={13} className="text-sky-600" />,
    'marketplace':    <Activity size={13} className="text-rose-600" />,
    'overtime':       <TrendingUp size={13} className="text-amber-600" />,
    'monitor':        <Shield size={13} className="text-slate-600" />,
  }
  const actionBg: Record<string, string> = {
    'float-in':       'bg-violet-600 hover:bg-violet-700',
    'float-out':      'bg-violet-600 hover:bg-violet-700',
    'release-early':  'bg-sky-600 hover:bg-sky-700',
    'marketplace':    'bg-rose-600 hover:bg-rose-700',
    'overtime':       'bg-amber-600 hover:bg-amber-700',
    'monitor':        'bg-slate-600 hover:bg-slate-700',
  }

  return (
    <motion.div
      layout
      data-id={`rec-${rec.id}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className={`rounded-2xl border-2 p-4 ${rec.executed ? 'opacity-50' : ''} ${priority.bg} ${priority.border}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          {actionIcon[rec.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-slate-800">{rec.title}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${priority.badge}`}>{priority.label}</span>
            {rec.qualityRisk && (
              <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={8} /> Quality Risk
              </span>
            )}
            {rec.savingsDollars > 0 && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                Save ${rec.savingsDollars}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mb-3">{rec.detail}</p>
          {rec.executed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
              <CheckCircle2 size={12} /> Executed
            </span>
          ) : (
            <button
              aria-label={`Execute ${rec.id}`}
              onClick={() => onExecute(rec.id)}
              className={`text-xs font-bold text-white px-4 py-1.5 rounded-xl transition-colors ${actionBg[rec.type]}`}
            >
              Execute →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Trend chart tab ───────────────────────────────────────────────────────────

function TrendChart({ units }: { units: UnitAcuityData[] }) {
  const shiftLabels = ['7 shifts ago', '6', '5', '4', '3', '2', 'Now']
  const unitColors: Record<UnitId, string> = {
    ICU: '#8b5cf6', CCU: '#3b82f6', 'MS-A': '#10b981', 'MS-B': '#14b8a6',
    Oncology: '#f43f5e', Telemetry: '#f59e0b', ED: '#ef4444',
  }
  const W = 600, H = 200, PAD = 40
  const allValues = units.flatMap(u => u.trendScores)
  const minV = Math.min(...allValues) - 0.3
  const maxV = Math.max(...allValues) + 0.3
  const toX = (i: number) => PAD + (i / 6) * (W - PAD * 2)
  const toY = (v: number) => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2)

  return (
    <div id="trend-chart" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4">7-Shift Acuity Trend — All Units</h3>
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Grid lines */}
          {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(v => (
            <g key={v}>
              <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD - 5} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
            </g>
          ))}
          {/* X labels */}
          {shiftLabels.map((l, i) => (
            <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">{l}</text>
          ))}
          {/* Unit lines */}
          {units.map(u => {
            const pts = u.trendScores.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
            const lastX = toX(6)
            const lastY = toY(u.trendScores[6])
            return (
              <g key={u.id}>
                <polyline points={pts} fill="none" stroke={unitColors[u.id]} strokeWidth={2}
                  strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
                <circle cx={lastX} cy={lastY} r={4} fill={unitColors[u.id]} />
              </g>
            )
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {units.map(u => (
          <div key={u.id} data-id={`trend-unit-${u.id}`} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: unitColors[u.id] }} />
            <span className="text-[10px] font-semibold text-slate-600">{u.abbr} ({u.trendScores[6].toFixed(1)})</span>
          </div>
        ))}
      </div>
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 whitespace-nowrap"
    >
      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> {msg}
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'detail' | 'trend' | 'recommendations'

export default function Acuity() {
  const [tab, setTab] = useState<Tab>('overview')
  const [units, setUnits] = useState(getUnits)
  const [summary, setSummary] = useState(getHospitalSummary)
  const [recs, setRecs] = useState(getRecommendations)
  const [selectedUnit, setSelectedUnit] = useState<UnitId | null>(null)
  const [toast, setToast] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer) clearTimeout(toastTimer)
    setToast(msg)
    const t = setTimeout(() => setToast(''), 3500)
    setToastTimer(t)
  }

  function refresh() {
    setUnits(getUnits())
    setSummary(getHospitalSummary())
    setRecs(getRecommendations())
  }

  function handleRecalculate() {
    setRecalculating(true)
    setTimeout(() => {
      setRecalculating(false)
      refresh()
      showToast('✓ Staffing model recalculated — all units updated')
    }, 1400)
  }

  function handleAcuityUpdate() {
    refresh()
    showToast('✓ Acuity updated — staffing recommendation recalculated')
  }

  const handleExecuteRec = useCallback((recId: string) => {
    executeRecommendation(recId)
    setRecs(getRecommendations())
    refresh()
    const msgs: Record<string, string> = {
      'rec-001': '✓ Float request sent — Rachel Torres notified for Oncology',
      'rec-002': '✓ Early release approved — Emily Clarke scheduled off at 1 PM',
      'rec-003': '✓ OT request sent to available nurses — MS-B queue opened',
      'rec-004': '✓ Posted to Marketplace — ED 4h gap live now',
      'rec-005': '✓ Float pool nurse dispatched to Oncology',
      'rec-006': '✓ Early release approved — Telemetry nurse off at 3 PM',
    }
    showToast(msgs[recId] ?? '✓ Recommendation executed')
  }, [])

  const handleUnitClick = (unitId: UnitId) => {
    setSelectedUnit(prev => prev === unitId ? null : unitId)
    setTab('detail')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Patient Acuity & Staffing Intelligence</h1>
              <p className="text-xs text-slate-500">Acuity-adjusted FTE model · Day Shift · Mercy General Hospital</p>
            </div>
          </div>
          <button
            id="recalculate-btn"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow disabled:opacity-60"
            aria-label="Recalculate staffing model"
          >
            {recalculating
              ? <><Loader2 size={14} className="animate-spin" /> Recalculating…</>
              : <><RefreshCw size={14} /> Recalculate</>
            }
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div id="kpi-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
        {[
          { id: 'kpi-avg-acuity',  label: 'Avg Acuity',      value: summary.avgAcuity.toFixed(1), sub: `hospital-wide (${summary.totalCensus} pts)`, icon: <Heart size={14} />, color: 'text-violet-600' },
          { id: 'kpi-fte-gap',     label: 'FTE Gap',          value: `${(summary.totalFteOnFloor - summary.totalFteNeeded).toFixed(1)}`, sub: `${summary.totalFteOnFloor} on floor · ${summary.totalFteNeeded.toFixed(1)} needed`, icon: <Users size={14} />, color: summary.totalFteOnFloor < summary.totalFteNeeded ? 'text-red-600' : 'text-emerald-600' },
          { id: 'kpi-quality-risk',label: 'Quality Risks',    value: String(summary.qualityRisks), sub: `units needing more staff`, icon: <AlertTriangle size={14} />, color: summary.qualityRisks > 0 ? 'text-red-600' : 'text-emerald-600' },
          { id: 'kpi-savings',     label: 'Savings Today',    value: `$${summary.totalSavingsOpportunity}`, sub: 'via early release', icon: <DollarSign size={14} />, color: summary.totalSavingsOpportunity > 0 ? 'text-emerald-600' : 'text-slate-600' },
        ].map(k => (
          <div key={k.id} id={k.id} className="bg-white px-5 py-3.5 flex items-start gap-3">
            <div className={`mt-0.5 ${k.color}`}>{k.icon}</div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
              <p className={`text-2xl font-black leading-none mt-0.5 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {([
            { id: 'overview',        label: 'Unit Overview',    icon: <Activity size={13} /> },
            { id: 'detail',          label: 'Patient Detail',   icon: <Heart size={13} />, badge: selectedUnit },
            { id: 'trend',           label: '7-Shift Trend',    icon: <TrendingUp size={13} /> },
            { id: 'recommendations', label: 'Action Plan',      icon: <CheckCircle2 size={13} />, badge: recs.filter(r => !r.executed).length.toString() },
          ] as { id: Tab; label: string; icon: React.ReactNode; badge?: string | null }[]).map(t => (
            <button key={t.id} id={`tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${tab === t.id ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
              {t.badge && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* Overview tab */}
          {tab === 'overview' && (
            <motion.div key="overview" id="overview-tab"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {UNIT_ORDER.map(uid => {
                  const u = units.find(u => u.id === uid)!
                  return (
                    <UnitOverviewCard
                      key={u.id}
                      unit={u}
                      selected={selectedUnit === u.id}
                      onClick={() => handleUnitClick(u.id)}
                    />
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-slate-400 text-center">
                Click any unit card to view and update individual patient acuity scores
              </p>
            </motion.div>
          )}

          {/* Detail tab */}
          {tab === 'detail' && (
            <motion.div key="detail" id="detail-tab"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}>
              {/* Unit selector */}
              <div className="flex gap-2 flex-wrap mb-4">
                {UNIT_ORDER.map(uid => {
                  const u = units.find(u => u.id === uid)!
                  return (
                    <button key={uid}
                      id={`detail-unit-btn-${uid}`}
                      onClick={() => setSelectedUnit(uid)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${selectedUnit === uid ? `${u.bgLight} ${u.border} ${u.color}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      {u.abbr}
                    </button>
                  )
                })}
              </div>
              <AnimatePresence mode="wait">
                {selectedUnit ? (
                  <UnitDetailPanel
                    key={selectedUnit}
                    unitId={selectedUnit}
                    onClose={() => setSelectedUnit(null)}
                    onAcuityUpdate={handleAcuityUpdate}
                  />
                ) : (
                  <motion.div key="no-unit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    <Heart size={24} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Select a unit above to view patient acuity scores</p>
                    <p className="text-xs mt-1">Click any acuity button to update — staffing model recalculates instantly</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Trend tab */}
          {tab === 'trend' && (
            <motion.div key="trend"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}>
              <TrendChart units={units} />
              {/* Per-unit trend table */}
              <div id="trend-table" className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Shift-by-Shift Acuity Detail</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-bold text-slate-600">Unit</th>
                        {['S-7','S-6','S-5','S-4','S-3','S-2','Now'].map(s => (
                          <th key={s} className="text-center px-3 py-2.5 font-bold text-slate-500">{s}</th>
                        ))}
                        <th className="text-center px-3 py-2.5 font-bold text-slate-500">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map(u => {
                        const delta = u.trendScores[6] - u.trendScores[0]
                        return (
                          <tr key={u.id} data-id={`trend-row-${u.id}`}
                            className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2.5">
                              <span className={`font-black ${u.color}`}>{u.abbr}</span>
                            </td>
                            {u.trendScores.map((v, i) => (
                              <td key={i} className="px-3 py-2.5 text-center">
                                <span className={`font-semibold ${v >= 3 ? 'text-red-600' : v >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {v.toFixed(1)}
                                </span>
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-center">
                              <span className={`font-bold text-xs ${delta > 0.1 ? 'text-red-500' : delta < -0.1 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {delta > 0 ? `+${delta.toFixed(1)}↑` : delta < 0 ? `${delta.toFixed(1)}↓` : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recommendations tab */}
          {tab === 'recommendations' && (
            <motion.div key="recommendations" id="recommendations-tab"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}>
              <div className="space-y-3">
                {recs.map(rec => (
                  <RecCard key={rec.id} rec={rec} onExecute={handleExecuteRec} />
                ))}
                {recs.every(r => r.executed) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-emerald-200 p-8 text-center">
                    <CheckCircle2 size={28} className="mx-auto mb-3 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-700">All recommendations executed</p>
                    <p className="text-xs text-slate-400 mt-1">Staffing is optimized for current acuity levels</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} msg={toast} />}
      </AnimatePresence>
    </div>
  )
}

