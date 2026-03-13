import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  X,
  Building2,
  Clock,
  PhoneCall,
  ChevronRight,
  Bell,
  BellOff,
  Zap,
  ShieldAlert,
  BarChart3,
} from 'lucide-react'
import {
  UNIT_CONFIGS,
  FLOAT_NURSES,
  AGENCIES,
  getAllSnapshots,
  getUnitConfig,
  getRatioStatus,
  getComplianceSummary,
  getAllFillRequests,
  getAlerts,
  acknowledgeAlert,
  hasRequestedFloat,
  hasRequestedAgency,
  requestFloat,
  requestAgency,
  cancelRequest,
  type UnitSnapshot,
  type FillRequest,
  type RatioStatus,
} from '../data/ratioData'

// ── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data, mandate, w = 80, h = 28 }: { data: number[]; mandate: number; w?: number; h?: number }) {
  const max = Math.max(...data, mandate * 1.3)
  const min = 0
  const range = max - min
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 4) + 2
    const y = h - 4 - ((v - min) / range) * (h - 8) + 2
    return `${x},${y}`
  })
  const mandateY = h - 4 - ((mandate - min) / range) * (h - 8) + 2
  const lastV = data[data.length - 1]
  const status = getRatioStatus(lastV, mandate)
  const lineColor = status === 'violation' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e'

  return (
    <svg width={w} height={h} className="overflow-visible">
      {/* Mandate line */}
      <line x1={0} y1={mandateY} x2={w} y2={mandateY} stroke="#6b7280" strokeWidth={0.8} strokeDasharray="3,2" />
      {/* Trend polyline */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Last point dot */}
      {pts.length > 0 && (() => {
        const [lx, ly] = pts[pts.length - 1].split(',').map(Number)
        return <circle cx={lx} cy={ly} r={2.5} fill={lineColor} />
      })()}
    </svg>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RatioStatus }) {
  const map: Record<RatioStatus, { label: string; cls: string }> = {
    violation: { label: 'VIOLATION', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    warning: { label: 'WARNING', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    compliant: { label: 'COMPLIANT', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ── Float Request Modal ──────────────────────────────────────────────────────

function FloatRequestModal({
  unit,
  onSubmit,
  onClose,
}: {
  unit: string
  onSubmit: (floatId: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const cfg = getUnitConfig(unit)
  const eligible = FLOAT_NURSES.filter(n =>
    n.units.some(u => u === unit) &&
    n.availability !== 'unavailable' &&
    n.availability !== 'filling' &&
    !hasRequestedFloat(n.id)
  )

  function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    setTimeout(() => {
      setDone(true)
      onSubmit(selected)
      setTimeout(onClose, 1200)
    }, 800)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        id="float-modal"
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {done ? (
          <div className="p-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 280 }}
              className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
            <p className="text-white font-bold text-lg">Request Sent!</p>
            <p className="text-slate-400 text-sm text-center">
              Float request sent to {FLOAT_NURSES.find(n => n.id === selected)?.name}. You'll be notified when they respond.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Request Float Staff</p>
                <p className="text-slate-400 text-sm">{unit} — {cfg.unitFull} · Mandate: {cfg.mandatedLabel}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close float modal"
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Available Float Nurses · {eligible.length} qualified for {unit}
              </p>
              {eligible.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No available float nurses for {unit}</p>
                  <p className="text-xs mt-1">All qualified staff are already assigned or unavailable</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eligible.map(nurse => (
                    <button
                      key={nurse.id}
                      data-id={`float-option-${nurse.id}`}
                      onClick={() => setSelected(nurse.id)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left ${
                        selected === nurse.id
                          ? 'bg-violet-600/15 border-violet-500/50 ring-1 ring-violet-500/30'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {nurse.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{nurse.name}</p>
                        <p className="text-slate-400 text-xs truncate">{nurse.certifications.join(' · ')} · {nurse.yearsExp}yr exp</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-emerald-400 text-xs font-semibold">
                          {nurse.availableAt === 'Now' ? '● Now' : `⏱ ${nurse.availableAt}`}
                        </p>
                        <p className="text-slate-500 text-xs">${nurse.hourlyRate}/hr</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {eligible.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selected || submitting}
                  aria-label="Send float request"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }}
                    >
                      <Activity size={14} />
                    </motion.div>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Agency Escalation Modal ──────────────────────────────────────────────────

function AgencyModal({
  unit,
  onSubmit,
  onClose,
}: {
  unit: string
  onSubmit: (agencyId: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const cfg = getUnitConfig(unit)
  const eligible = AGENCIES.filter(a => a.contractedUnits.includes(unit) && !hasRequestedAgency(a.id))

  function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    setTimeout(() => {
      setDone(true)
      onSubmit(selected)
      setTimeout(onClose, 1200)
    }, 900)
  }

  const tierLabel: Record<string, string> = { preferred: 'Preferred', backup: 'Backup', emergency: 'Emergency' }
  const tierColor: Record<string, string> = {
    preferred: 'text-emerald-400 bg-emerald-500/10',
    backup: 'text-amber-400 bg-amber-500/10',
    emergency: 'text-red-400 bg-red-500/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        id="agency-modal"
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {done ? (
          <div className="p-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 280 }}
              className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
            <p className="text-white font-bold text-lg">Agency Order Placed!</p>
            <p className="text-slate-400 text-sm text-center">
              Order submitted to {AGENCIES.find(a => a.id === selected)?.name}. Confirmation within {AGENCIES.find(a => a.id === selected)?.responseTimeMin} min.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Agency Escalation</p>
                <p className="text-slate-400 text-sm">{unit} — {cfg.unitFull} · Select contracted agency</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close agency modal"
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-2">
              {eligible.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No contracted agencies available for {unit}</p>
              ) : (
                eligible.map(agency => (
                  <button
                    key={agency.id}
                    data-id={`agency-option-${agency.id}`}
                    onClick={() => setSelected(agency.id)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                      selected === agency.id
                        ? 'bg-orange-600/10 border-orange-500/50 ring-1 ring-orange-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-semibold">{agency.name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tierColor[agency.tier]}`}>
                          {tierLabel[agency.tier]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{agency.specialties.join(' · ')}</p>
                      <div className="flex gap-4 mt-1.5">
                        <span className="text-xs text-slate-500">
                          <span className="text-white font-medium">{agency.availableNurses}</span> available
                        </span>
                        <span className="text-xs text-slate-500">
                          <span className="text-amber-400 font-medium">${agency.hourlyRate}/hr</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          <span className="text-slate-300 font-medium">~{agency.responseTimeMin}min</span> ETA
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {eligible.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-800">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-amber-300 text-xs font-semibold">Cost Impact</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {selected
                      ? `12hr shift at $${AGENCIES.find(a => a.id === selected)?.hourlyRate}/hr = $${(AGENCIES.find(a => a.id === selected)!.hourlyRate * 12).toLocaleString()} vs float pool avg $${Math.round(FLOAT_NURSES.reduce((s, n) => s + n.hourlyRate, 0) / FLOAT_NURSES.length)}/hr`
                      : 'Select an agency to see cost comparison'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selected || submitting}
                    aria-label="Place agency order"
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }}>
                        <Activity size={14} />
                      </motion.div>
                    ) : (
                      <>
                        <PhoneCall size={14} />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({
  snapshot,
  onRequestFloat,
  onRequestAgency,
}: {
  snapshot: UnitSnapshot
  onRequestFloat: (unit: string) => void
  onRequestAgency: (unit: string) => void
}) {
  const cfg = getUnitConfig(snapshot.unit)
  const status = getRatioStatus(snapshot.ratioNow, cfg.mandatedRatio)
  const forecastCensus = snapshot.census + snapshot.pendingAdmits - snapshot.pendingDischarges
  const forecastRatio = forecastCensus / snapshot.nurses
  const forecastStatus = getRatioStatus(forecastRatio, cfg.mandatedRatio)

  const hist = snapshot.ratioHistory
  const trend = hist[hist.length - 1] - hist[hist.length - 2]
  const TrendIcon = trend > 0.1 ? TrendingUp : trend < -0.1 ? TrendingDown : Minus

  const borderColor = status === 'violation' ? 'border-red-500/40' : status === 'warning' ? 'border-amber-500/30' : 'border-slate-700'
  const bgGlow = status === 'violation' ? 'bg-red-500/5' : status === 'warning' ? 'bg-amber-500/5' : ''
  const trendColor = trend > 0.1 ? 'text-red-400' : trend < -0.1 ? 'text-emerald-400' : 'text-slate-500'

  const hasFillInProgress = getAllFillRequests().some(
    r => r.unit === snapshot.unit && (r.status === 'pending' || r.status === 'accepted')
  )

  return (
    <motion.div
      data-id={`unit-card-${snapshot.unit.toLowerCase().replace('-', '')}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`relative rounded-2xl border p-5 flex flex-col gap-4 ${borderColor} ${bgGlow} bg-slate-900/80`}
    >
      {status === 'violation' && (
        <motion.div
          className="absolute top-3 right-3"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-sm">{snapshot.unit}</p>
          <p className="text-slate-500 text-xs">{cfg.unitFull}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Ratio display */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Current Ratio</p>
          <p className={`font-black text-3xl leading-none ${
            status === 'violation' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {snapshot.ratioNow.toFixed(1)}
            <span className="text-base font-normal text-slate-500">:1</span>
          </p>
          <p className="text-slate-500 text-[10px] mt-1">Mandate ≤ {cfg.mandatedRatio}:1</p>
        </div>
        <div className="flex-1">
          <Sparkline data={snapshot.ratioHistory} mandate={cfg.mandatedRatio} w={100} h={32} />
        </div>
        <div className="text-right">
          <TrendIcon size={14} className={trendColor} />
          <p className={`text-xs font-semibold ${trendColor}`}>
            {trend > 0.1 ? '+' : ''}{trend.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Census + nurses */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
          <p className="text-white font-bold text-lg leading-none">{snapshot.census}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Patients</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
          <p className="text-emerald-400 font-bold text-lg leading-none">{snapshot.nurses}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Nurses</p>
        </div>
        <div className={`rounded-xl p-2.5 text-center ${forecastStatus === 'violation' ? 'bg-red-500/10' : forecastStatus === 'warning' ? 'bg-amber-500/10' : 'bg-slate-800/60'}`}>
          <p className={`font-bold text-lg leading-none ${forecastStatus === 'violation' ? 'text-red-400' : forecastStatus === 'warning' ? 'text-amber-400' : 'text-slate-300'}`}>
            {forecastRatio.toFixed(1)}
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">Forecast</p>
        </div>
      </div>

      {/* Pending admits/discharges */}
      {(snapshot.pendingAdmits > 0 || snapshot.pendingDischarges > 0) && (
        <div className="flex gap-2 text-xs">
          {snapshot.pendingAdmits > 0 && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
              <TrendingUp size={10} />+{snapshot.pendingAdmits} admits
            </span>
          )}
          {snapshot.pendingDischarges > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <TrendingDown size={10} />-{snapshot.pendingDischarges} DC
            </span>
          )}
        </div>
      )}

      {/* Fill in progress */}
      {hasFillInProgress && (
        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' as const }}
          >
            <Activity size={12} className="text-violet-400" />
          </motion.div>
          <p className="text-violet-300 text-xs font-medium">Fill request in progress…</p>
        </div>
      )}

      {/* Actions */}
      {(status === 'violation' || status === 'warning') && !hasFillInProgress && (
        <div className="flex gap-2">
          <button
            onClick={() => onRequestFloat(snapshot.unit)}
            aria-label={`Request float for ${snapshot.unit}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
          >
            <Users size={12} />
            Float Pool
          </button>
          <button
            onClick={() => onRequestAgency(snapshot.unit)}
            aria-label={`Escalate to agency for ${snapshot.unit}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
          >
            <Building2 size={12} />
            Agency
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Fill Request Row ─────────────────────────────────────────────────────────

function FillRequestRow({ req, onCancel }: { req: FillRequest; onCancel: (id: string) => void }) {
  const nurse = req.floatNurseId ? FLOAT_NURSES.find(n => n.id === req.floatNurseId) : null
  const agency = req.agencyId ? AGENCIES.find(a => a.id === req.agencyId) : null
  const label = nurse?.name ?? agency?.name ?? 'Unknown'

  const statusCls: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    accepted: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    declined: 'text-red-400 bg-red-500/10 border-red-500/20',
    cancelled: 'text-slate-500 bg-slate-800 border-slate-700',
    filled: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  }

  return (
    <motion.div
      data-id={`fill-req-${req.id}`}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
        {nurse ? <Users size={15} className="text-violet-300" /> : <Building2 size={15} className="text-orange-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-semibold truncate">{label}</p>
          <span className="text-slate-600">→</span>
          <span className="text-slate-400 text-xs font-medium">{req.unit}</span>
        </div>
        <p className="text-slate-500 text-xs truncate">{req.note}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {req.estimatedArrival && req.status !== 'cancelled' && (
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock size={10} />
            <span>{req.estimatedArrival}</span>
          </div>
        )}
        <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border ${statusCls[req.status]}`}>
          {req.status.toUpperCase()}
        </span>
        {req.status === 'pending' && (
          <button
            onClick={() => onCancel(req.id)}
            aria-label={`Cancel request ${req.id}`}
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RatioMonitor() {
  const [snapshots] = useState(getAllSnapshots)
  const [alerts, setAlerts] = useState(getAlerts)
  const [fillRequests, setFillRequests] = useState(getAllFillRequests)
  const [floatModalUnit, setFloatModalUnit] = useState<string | null>(null)
  const [agencyModalUnit, setAgencyModalUnit] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'violation' | 'warning' | 'compliant'>('all')
  const [showAlerts, setShowAlerts] = useState(true)

  const summary = getComplianceSummary()
  const unacknowledged = alerts.filter(a => !a.acknowledged)

  const filtered = snapshots.filter(s => {
    if (filter === 'all') return true
    const cfg = UNIT_CONFIGS.find(c => c.unit === s.unit)!
    return getRatioStatus(s.ratioNow, cfg.mandatedRatio) === filter
  })

  function handleAck(id: string) {
    acknowledgeAlert(id)
    setAlerts(getAlerts())
  }

  function handleAckAll() {
    alerts.forEach(a => acknowledgeAlert(a.id))
    setAlerts(getAlerts())
  }

  function handleFloatSubmit(floatId: string) {
    const unit = floatModalUnit!
    requestFloat(floatId, unit, 'Day Shift 07:00–15:00')
    setFillRequests(getAllFillRequests())
  }

  function handleAgencySubmit(agencyId: string) {
    const unit = agencyModalUnit!
    requestAgency(agencyId, unit, 'Day Shift 07:00–15:00')
    setFillRequests(getAllFillRequests())
  }

  function handleCancelRequest(id: string) {
    cancelRequest(id)
    setFillRequests(getAllFillRequests())
  }

  // Overall status color
  const overallBg = summary.violations > 0 ? 'from-red-900/40' : summary.warnings > 0 ? 'from-amber-900/40' : 'from-emerald-900/30'

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header banner */}
      <div className={`bg-gradient-to-r ${overallBg} to-slate-950 border-b border-slate-800 px-8 py-5`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
                <BarChart3 size={16} className="text-violet-400" />
              </div>
              <h1 className="text-2xl font-black text-white">Ratio Monitor</h1>
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Real-time patient:nurse ratio compliance · Day Shift 07:00–15:00 · Thu Mar 12, 2026</p>
          </div>

          {/* Compliance summary pills */}
          <div className="flex items-center gap-3 flex-wrap">
            {summary.violations > 0 && (
              <div id="stat-violations" className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-2.5">
                <XCircle size={16} className="text-red-400" />
                <div>
                  <p className="text-red-400 text-xl font-black leading-none">{summary.violations}</p>
                  <p className="text-red-400/70 text-[10px]">VIOLATIONS</p>
                </div>
              </div>
            )}
            <div id="stat-warnings" className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-2.5">
              <AlertTriangle size={16} className="text-amber-400" />
              <div>
                <p className="text-amber-400 text-xl font-black leading-none">{summary.warnings}</p>
                <p className="text-amber-400/70 text-[10px]">WARNINGS</p>
              </div>
            </div>
            <div id="stat-compliant" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-2.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <div>
                <p className="text-emerald-400 text-xl font-black leading-none">{summary.compliant}</p>
                <p className="text-emerald-400/70 text-[10px]">COMPLIANT</p>
              </div>
            </div>
            <div id="stat-forecasted" className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-2xl px-4 py-2.5">
              <TrendingUp size={16} className="text-violet-400" />
              <div>
                <p className="text-violet-400 text-xl font-black leading-none">{summary.forecasted}</p>
                <p className="text-violet-400/70 text-[10px]">FORECAST ⚠</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* Active Alerts */}
        <AnimatePresence>
          {showAlerts && unacknowledged.length > 0 && (
            <motion.div
              id="alerts-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-red-400" />
                  <p className="text-white font-semibold text-sm">Active Alerts</p>
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unacknowledged.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAckAll}
                    aria-label="Acknowledge all alerts"
                    className="text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <BellOff size={12} />
                    Ack All
                  </button>
                  <button
                    onClick={() => setShowAlerts(false)}
                    aria-label="Dismiss alerts panel"
                    className="text-slate-600 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50">
                {unacknowledged.map(alert => (
                  <div
                    key={alert.id}
                    data-id={`alert-${alert.id}`}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div className={`mt-0.5 shrink-0 ${alert.type === 'violation' ? 'text-red-400' : alert.type === 'warning' ? 'text-amber-400' : 'text-violet-400'}`}>
                      {alert.type === 'violation' ? <XCircle size={14} /> : alert.type === 'warning' ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm">{alert.message}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{alert.triggeredAt} · {alert.unit}</p>
                    </div>
                    <button
                      onClick={() => handleAck(alert.id)}
                      aria-label={`Acknowledge alert ${alert.id}`}
                      className="text-slate-600 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show alerts button when dismissed */}
        {!showAlerts && unacknowledged.length > 0 && (
          <button
            onClick={() => setShowAlerts(true)}
            aria-label="Show alerts panel"
            className="flex items-center gap-2 text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
          >
            <Bell size={14} />
            Show {unacknowledged.length} active alerts
          </button>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(
            [
              { key: 'all', label: 'All Units', count: summary.total },
              { key: 'violation', label: 'Violations', count: summary.violations },
              { key: 'warning', label: 'Warnings', count: summary.warnings },
              { key: 'compliant', label: 'Compliant', count: summary.compliant },
            ] as const
          ).map(f => (
            <button
              key={f.key}
              aria-label={`Filter ${f.label}`}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                filter === f.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-slate-700'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Unit grid + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* Unit cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            <AnimatePresence mode="popLayout">
              {filtered.map(s => (
                <UnitCard
                  key={s.unit}
                  snapshot={s}
                  onRequestFloat={setFloatModalUnit}
                  onRequestAgency={setAgencyModalUnit}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-slate-600">
                <CheckCircle2 size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No units in this category</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Fill Request Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-violet-400" />
                  <p className="text-white font-semibold text-sm">Fill Requests</p>
                  <span className="bg-violet-500/20 text-violet-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {fillRequests.filter(r => r.status !== 'cancelled').length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {fillRequests.length === 0 ? (
                    <p className="text-slate-600 text-xs text-center py-6">No fill requests today</p>
                  ) : (
                    fillRequests.map(req => (
                      <FillRequestRow key={req.id} req={req} onCancel={handleCancelRequest} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Float Pool Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                <p className="text-white font-semibold text-sm">Float Pool</p>
                <span className="text-slate-500 text-xs ml-auto">
                  {FLOAT_NURSES.filter(n => n.availability === 'available').length} available
                </span>
              </div>
              <div className="p-3 space-y-1.5">
                {FLOAT_NURSES.map(nurse => {
                  const avColor = nurse.availability === 'available' ? 'bg-emerald-400' : nurse.availability === 'on-break' ? 'bg-amber-400' : nurse.availability === 'filling' ? 'bg-violet-400' : 'bg-slate-600'
                  const isRequested = hasRequestedFloat(nurse.id)
                  return (
                    <div
                      key={nurse.id}
                      data-id={`float-pool-${nurse.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {nurse.initials}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${avColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{nurse.name}</p>
                        <p className="text-slate-500 text-[10px] truncate">{nurse.units.slice(0, 3).join(' · ')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {isRequested ? (
                          <span className="text-[9px] text-violet-300 font-bold">SENT</span>
                        ) : (
                          <p className="text-[10px] text-slate-500">{nurse.availableAt}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Agency Contacts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <Building2 size={14} className="text-orange-400" />
                <p className="text-white font-semibold text-sm">Agency Contacts</p>
              </div>
              <div className="p-3 space-y-1.5">
                {AGENCIES.map(agency => {
                  const isOrdered = hasRequestedAgency(agency.id)
                  return (
                    <div
                      key={agency.id}
                      data-id={`agency-${agency.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <Building2 size={13} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{agency.name}</p>
                        <p className="text-slate-500 text-[10px]">${agency.hourlyRate}/hr · {agency.availableNurses} avail</p>
                      </div>
                      {isOrdered ? (
                        <span className="text-[9px] text-orange-300 font-bold shrink-0">ORDERED</span>
                      ) : (
                        <ChevronRight size={13} className="text-slate-600 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {floatModalUnit && (
          <FloatRequestModal
            unit={floatModalUnit}
            onSubmit={handleFloatSubmit}
            onClose={() => setFloatModalUnit(null)}
          />
        )}
        {agencyModalUnit && (
          <AgencyModal
            unit={agencyModalUnit}
            onSubmit={handleAgencySubmit}
            onClose={() => setAgencyModalUnit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
