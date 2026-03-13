import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Building2, Star, Phone, Shield, ChevronRight, X, AlertTriangle,
  CheckCircle2, TrendingUp, TrendingDown, DollarSign,
  Calendar, Award, BarChart3, AlertOctagon, Users, Zap,
} from 'lucide-react'
import {
  getNurses, getActiveNurses, getExpiringNurses, getCompletedNurses,
  getConversionCandidates, getStats, extendContract, setManagerInterest,
  markOrientation,
  COST_COMPARISON, MONTHLY_SPEND_TREND, UNIT_COLORS, STATUS_META, MANAGER_INTEREST_META,
  fmtK,
  type AgencyNurse, type ManagerInterest,
} from '../data/agencyData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function AgencyBadge({ short, agency }: { short: string; agency: string }) {
  const colors: Record<string, string> = {
    AMN:  'bg-blue-100 text-blue-700 border-blue-200',
    CCN:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    AYA:  'bg-violet-100 text-violet-700 border-violet-200',
    TNAA: 'bg-amber-100 text-amber-700 border-amber-200',
    MSN:  'bg-rose-100 text-rose-700 border-rose-200',
  }
  return (
    <span title={agency} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[short] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {short}
    </span>
  )
}

function NurseAvatar({ nurse, size = 'md' }: { nurse: AgencyNurse; size?: 'sm' | 'md' | 'lg' }) {
  const statusMeta = STATUS_META[nurse.status]
  const sz = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-xs'
  return (
    <div className="relative inline-flex">
      <div className={`${sz} rounded-full bg-gradient-to-br ${nurse.color} flex items-center justify-center text-white font-bold shadow`}>
        {nurse.initials}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusMeta.dot}`} />
    </div>
  )
}

function WeeksBar({ remaining, total, status }: { remaining: number; total: number; status: AgencyNurse['status'] }) {
  if (status === 'pending') {
    return <div className="text-xs text-sky-600 font-medium">Starting {remaining === total ? 'Mar 17' : 'soon'}</div>
  }
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100))
  const color = remaining <= 1 ? 'bg-red-500' : remaining <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{remaining > 0 ? `${remaining}w remaining` : 'Contract ended'}</span>
        <span className={remaining <= 1 ? 'text-red-600 font-bold' : remaining <= 4 ? 'text-amber-600 font-semibold' : ''}>
          {remaining <= 0 ? '⚠ Action needed' : remaining <= 2 ? '⚠ Expiring soon' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        />
      </div>
    </div>
  )
}

function OrientationProgress({ items }: { items: AgencyNurse['orientation'] }) {
  const done = items.filter(i => i.done).length
  const pct = (done / items.length) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 whitespace-nowrap">{done}/{items.length}</span>
    </div>
  )
}

// ── Agency Nurse Card ─────────────────────────────────────────────────────────

function AgencyCard({
  nurse, onOpen, onExtend, onSetInterest,
}: {
  nurse: AgencyNurse
  onOpen: (n: AgencyNurse) => void
  onExtend: (n: AgencyNurse) => void
  onSetInterest: (n: AgencyNurse, interest: ManagerInterest) => void
}) {
  const sm = STATUS_META[nurse.status]
  const im = MANAGER_INTEREST_META[nurse.managerInterest]
  const isExpiring = nurse.weeksRemaining <= 4 && nurse.status !== 'no-return' && nurse.status !== 'completed'

  return (
    <motion.div
      layout
      data-id={`agency-card-${nurse.id}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' as const }}
      className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow ${
        nurse.status === 'no-return' ? 'opacity-60 border-slate-200'
        : isExpiring ? 'border-amber-300'
        : nurse.status === 'pending' ? 'border-sky-300'
        : 'border-slate-200'
      }`}
      onClick={() => onOpen(nurse)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <NurseAvatar nurse={nurse} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm truncate">{nurse.name}</span>
            {nurse.nurseWantsPerm && nurse.status !== 'no-return' && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 rounded">OPEN TO PERM</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <AgencyBadge short={nurse.agencyShort} agency={nurse.agency} />
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${UNIT_COLORS[nurse.unit]}`}>{nurse.unit}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sm.badge}`}>{sm.label}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-slate-800 text-sm">${nurse.ratePerHour}/hr</p>
          <p className="text-[10px] text-slate-400">{nurse.yearsExp}yr exp</p>
        </div>
      </div>

      {/* Weeks bar */}
      <div className="mb-3">
        <WeeksBar remaining={nurse.weeksRemaining} total={nurse.weeksTotal} status={nurse.status} />
      </div>

      {/* Stats row */}
      {nurse.status !== 'pending' && (
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            {nurse.rating > 0 ? nurse.rating.toFixed(1) : '—'}
          </span>
          <span>{nurse.attendance}% attendance</span>
          {nurse.incidentCount > 0 && (
            <span className="text-red-500 font-semibold">{nurse.incidentCount} incident{nurse.incidentCount > 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {nurse.status === 'pending' && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">Orientation progress</p>
          <OrientationProgress items={nurse.orientation} />
        </div>
      )}

      {/* Manager interest + actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${im.color}`}>
          {im.label}
        </span>
        {nurse.status !== 'no-return' && nurse.status !== 'completed' && (
          <div className="flex gap-1">
            {(nurse.status === 'expiring' || (nurse.weeksRemaining <= 4 && nurse.status === 'active')) && (
              <button
                aria-label={`Extend contract ${nurse.id}`}
                onClick={e => { e.stopPropagation(); onExtend(nurse) }}
                className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-2 py-1 rounded-lg transition-all"
              >
                Extend
              </button>
            )}
            {nurse.managerInterest !== 'hire' && nurse.status !== 'pending' && (
              <button
                aria-label={`Mark for hiring ${nurse.id}`}
                onClick={e => { e.stopPropagation(); onSetInterest(nurse, 'hire') }}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all"
              >
                Hire?
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Nurse Drawer ─────────────────────────────────────────────────────────────

function NurseDrawer({
  nurse, onClose, onExtend, onSetInterest, onMarkOrientation,
}: {
  nurse: AgencyNurse
  onClose: () => void
  onExtend: (n: AgencyNurse) => void
  onSetInterest: (id: string, interest: ManagerInterest) => void
  onMarkOrientation: (nurseId: string, index: number) => void
}) {
  const sm = STATUS_META[nurse.status]
  const im = MANAGER_INTEREST_META[nurse.managerInterest]

  return (
    <motion.div
      id="agency-drawer"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' as const }}
      className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <NurseAvatar nurse={nurse} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 id="drawer-nurse-name" className="font-bold text-slate-900 text-base">{nurse.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <AgencyBadge short={nurse.agencyShort} agency={nurse.agency} />
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sm.badge}`}>{sm.label}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${UNIT_COLORS[nurse.unit]}`}>{nurse.unit}</span>
          </div>
        </div>
        <button
          aria-label="Close agency drawer"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-100">
          {[
            { label: 'Rating', value: nurse.rating > 0 ? nurse.rating.toFixed(1) : 'New', icon: Star, cls: 'text-amber-400 fill-amber-400' },
            { label: 'Attendance', value: `${nurse.attendance}%`, icon: Calendar, cls: 'text-violet-500' },
            { label: 'Rate/hr', value: `$${nurse.ratePerHour}`, icon: DollarSign, cls: 'text-emerald-500' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5 text-center">
              <Icon size={14} className={`mx-auto mb-1 ${cls}`} />
              <p className="font-bold text-slate-800 text-sm">{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Contract details */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Contract</p>
          <div className="space-y-2 text-sm">
            {[
              ['Agency', nurse.agency],
              ['Start Date', nurse.startDate],
              ['End Date', nurse.endDate],
              ['Rate', `$${nurse.ratePerHour}/hr bill rate`],
              ['Experience', `${nurse.yearsExp} years`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="text-slate-700 font-medium text-xs">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <WeeksBar remaining={nurse.weeksRemaining} total={nurse.weeksTotal} status={nurse.status} />
          </div>
        </div>

        {/* Certifications */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1.5">
            {nurse.certifications.map(c => (
              <span key={c} className="flex items-center gap-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded">
                <Shield size={10} />
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Contact</p>
          <a href={`tel:${nurse.phone}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-violet-600 transition-colors">
            <Phone size={14} className="text-slate-400" />
            {nurse.phone}
          </a>
        </div>

        {/* Orientation */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Orientation Checklist</p>
          <div className="space-y-2">
            {nurse.orientation.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <button
                  aria-label={`Toggle orientation ${nurse.id} ${i}`}
                  onClick={() => onMarkOrientation(nurse.id, i)}
                  disabled={item.done}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    item.done ? 'bg-emerald-500 border-emerald-500 cursor-default' : 'border-slate-300 hover:border-violet-500'
                  }`}
                >
                  {item.done && <CheckCircle2 size={10} className="text-white" />}
                </button>
                <span className={`text-xs ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                {item.completedDate && (
                  <span className="text-[10px] text-slate-400 ml-auto">{item.completedDate}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {nurse.notes && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Manager Notes</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">{nurse.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {nurse.status !== 'no-return' && nurse.status !== 'completed' && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Actions</p>

            {/* Manager interest selector */}
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-2">Manager interest</p>
              <div className="flex gap-2 flex-wrap">
                {(['hire', 'extend', 'neutral', 'no-return'] as ManagerInterest[]).map(opt => (
                  <button
                    key={opt}
                    aria-label={`Set interest ${opt} for ${nurse.id}`}
                    onClick={() => onSetInterest(nurse.id, opt)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      nurse.managerInterest === opt
                        ? `${MANAGER_INTEREST_META[opt].color} font-bold`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {MANAGER_INTEREST_META[opt].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current interest badge */}
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg border ${im.color} mb-3`}>
              Current: {im.label}
            </div>

            {nurse.weeksRemaining <= 4 && (
              <button
                aria-label={`Extend contract ${nurse.id}`}
                onClick={() => onExtend(nurse)}
                className="w-full py-2.5 bg-sky-600 text-white font-semibold text-sm rounded-xl hover:bg-sky-700 transition-all"
              >
                Extend Contract (8 weeks)
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Extend Modal ──────────────────────────────────────────────────────────────

function ExtendModal({
  nurse, onConfirm, onCancel,
}: {
  nurse: AgencyNurse; onConfirm: (weeks: number) => void; onCancel: () => void
}) {
  const [weeks, setWeeks] = useState(8)
  const totalCost = weeks * 36 * nurse.ratePerHour  // 36h/wk

  return (
    <motion.div
      id="extend-modal"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' as const }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <Calendar size={20} className="text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Extend Contract</h3>
            <p className="text-xs text-slate-500">{nurse.name} · {nurse.agency}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <NurseAvatar nurse={nurse} />
            <div>
              <p className="font-semibold text-sm text-slate-800">{nurse.name}</p>
              <p className="text-xs text-slate-400">{nurse.unit} · ${nurse.ratePerHour}/hr</p>
            </div>
            <div className="ml-auto text-right">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                {nurse.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">Extension duration</label>
              <div className="flex gap-2">
                {[4, 8, 13].map(w => (
                  <button
                    key={w}
                    data-id={`extend-weeks-${w}`}
                    onClick={() => setWeeks(w)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      weeks === w ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                    }`}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="text-slate-500">Total contract cost</span>
              <span className="font-bold text-slate-800">{fmtK(totalCost)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all">
            Cancel
          </button>
          <button
            aria-label={`Confirm extend ${nurse.id}`}
            onClick={() => onConfirm(weeks)}
            className="flex-1 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 text-sm transition-all"
          >
            Confirm Extension
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Cost Analysis Tab ─────────────────────────────────────────────────────────

function CostAnalysis() {
  const maxRate = Math.max(...COST_COMPARISON.map(c => c.rate))

  return (
    <div id="cost-analysis" className="space-y-6">
      {/* Rate comparison */}
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Cost Per Hour — Staffing Type Comparison</h3>
        <p className="text-xs text-slate-400 mb-4">Blended rates including taxes, benefits, and overhead · March 2026</p>
        <div className="space-y-3">
          {COST_COMPARISON.map((item, i) => (
            <div key={item.label} data-id={`cost-bar-${i}`} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <span className={`text-sm font-bold ${i === 0 ? 'text-red-600' : i === 3 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  ${item.rate}/hr
                  {i === 0 && <span className="text-xs font-normal text-red-400 ml-1">+{Math.round(((item.rate - COST_COMPARISON[3].rate) / COST_COMPARISON[3].rate) * 100)}% vs perm</span>}
                </span>
              </div>
              <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                <motion.div
                  className={`h-full ${item.color} flex items-center px-2`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.rate / maxRate) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const }}
                >
                  <span className="text-white text-[10px] font-bold whitespace-nowrap">${item.rate}</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly spend trend */}
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Monthly Agency Spend Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Last 6 months · Target: reduce to $35k/month by June 2026</p>
        <div id="spend-trend-chart" className="flex items-end gap-2 h-32">
          {MONTHLY_SPEND_TREND.map((bar) => {
            const pct = (bar.spend / 65000) * 100
            return (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-medium">{fmtK(bar.spend)}</span>
                <div className="w-full bg-slate-100 rounded-t-md overflow-hidden" style={{ height: '80px' }}>
                  <motion.div
                    className={`w-full rounded-t-md ${bar.current ? 'bg-violet-500' : 'bg-slate-400'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: MONTHLY_SPEND_TREND.indexOf(bar) * 0.08, duration: 0.5, ease: 'easeOut' as const }}
                    style={{ marginTop: `${100 - pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{bar.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversion savings */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <TrendingDown size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-sm">Conversion Savings Estimate</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Converting <strong>Jennifer Holt + Olivia Grant + Keisha Williams</strong> to permanent staff at $88k/yr avg
              would save approximately <strong>$9,600/month</strong> in agency premiums.
            </p>
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">
              ROI break-even: 2.1 months (including sign-on bonuses)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Conversion Pipeline ───────────────────────────────────────────────────────

function ConversionPipeline({ nurses, onSetInterest }: { nurses: AgencyNurse[]; onSetInterest: (id: string, i: ManagerInterest) => void }) {
  const candidates = nurses.filter(n => n.managerInterest === 'hire' && n.status !== 'no-return')

  return (
    <div id="conversion-pipeline">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-slate-800">Conversion Pipeline</h3>
        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{candidates.length} candidates</span>
      </div>
      {candidates.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Award size={32} className="mx-auto mb-2 text-slate-200" />
          <p>No nurses currently flagged for hire</p>
          <p className="text-sm mt-1">Set Manager Interest to "Hire Perm" on agency nurse cards</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(nurse => (
            <div
              key={nurse.id}
              data-id={`pipeline-card-${nurse.id}`}
              className="flex items-center gap-3 bg-white border border-emerald-200 rounded-xl p-4 hover:shadow-sm transition-all"
            >
              <NurseAvatar nurse={nurse} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">{nurse.name}</span>
                  {nurse.nurseWantsPerm && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Nurse interested
                    </span>
                  )}
                  <AgencyBadge short={nurse.agencyShort} agency={nurse.agency} />
                </div>
                <p className="text-xs text-slate-500">{nurse.unit} · ${nurse.ratePerHour}/hr agency → ~$44/hr perm equiv.</p>
                <p className="text-xs text-emerald-600 font-medium">Saves ≈ ${Math.round((nurse.ratePerHour - 44) * 36 * 52 / 12).toLocaleString()}/mo if converted</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-0.5 text-xs text-slate-500">
                  <Star size={11} className="text-amber-400 fill-amber-400" />{nurse.rating.toFixed(1)}
                </span>
                <button
                  aria-label={`Remove from pipeline ${nurse.id}`}
                  onClick={() => onSetInterest(nurse.id, 'neutral')}
                  className="text-xs text-slate-400 hover:text-red-500 px-1"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabKey = 'active' | 'expiring' | 'cost' | 'completed'

export default function Agency() {
  const [tab, setTab] = useState<TabKey>('active')
  const [drawerNurse, setDrawerNurse] = useState<AgencyNurse | null>(null)
  const [extendNurse, setExtendNurse] = useState<AgencyNurse | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [_tick, setTick] = useState(0)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleExtend(nurse: AgencyNurse) {
    setDrawerNurse(null)
    setExtendNurse(nurse)
  }

  function confirmExtend(weeks: number) {
    if (!extendNurse) return
    extendContract(extendNurse.id, weeks)
    setExtendNurse(null)
    setTick(t => t + 1)
    showToast(`${extendNurse.name}'s contract extended ${weeks} weeks`)
  }

  function handleSetInterest(nurse: AgencyNurse, interest: ManagerInterest) {
    setManagerInterest(nurse.id, interest)
    setTick(t => t + 1)
    const labels: Record<ManagerInterest, string> = { hire: 'flagged for hire', extend: 'marked to extend', neutral: 'set to neutral', 'no-return': 'marked DNR' }
    showToast(`${nurse.name} ${labels[interest]}`)
  }

  function handleSetInterestById(id: string, interest: ManagerInterest) {
    const nurse = getNurses().find(n => n.id === id)
    if (!nurse) return
    handleSetInterest(nurse, interest)
  }

  function handleMarkOrientation(nurseId: string, index: number) {
    markOrientation(nurseId, index)
    setTick(t => t + 1)
    if (drawerNurse?.id === nurseId) {
      // Force re-read
      const updated = getNurses().find(n => n.id === nurseId)
      if (updated) setDrawerNurse({ ...updated })
    }
  }

  const stats = getStats()
  const activeNurses = getActiveNurses()
  const expiringNurses = getExpiringNurses()
  const completedNurses = getCompletedNurses()
  const conversionCandidates = getConversionCandidates()
  const allNurses = getNurses()

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'active',    label: 'Active',    badge: activeNurses.length },
    { key: 'expiring',  label: 'Expiring',  badge: expiringNurses.length },
    { key: 'cost',      label: 'Cost Analysis' },
    { key: 'completed', label: 'Completed / DNR', badge: completedNurses.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Agency & Travel Staff</h1>
              <p className="text-xs text-slate-400">Contract management · Cost tracking · Conversion pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/float"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all"
            >
              <Users size={13} /> Float Pool
            </Link>
            <Link
              to="/budget"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all"
            >
              <BarChart3 size={13} /> Labor Budget
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'stat-active',     icon: Users,       label: 'Active Travelers',     value: stats.active,      sub: `${stats.pending} pending start`,        color: 'text-violet-600', bg: 'bg-violet-50' },
            { id: 'stat-expiring',   icon: AlertTriangle, label: 'Expiring This Month', value: stats.expiring30,  sub: 'within 30 days',                        color: 'text-amber-600',  bg: 'bg-amber-50' },
            { id: 'stat-avg-rate',   icon: DollarSign,  label: 'Avg Agency Rate',       value: `$${stats.avgRate}/hr`, sub: `+${stats.premiumPct}% vs float pool`, color: 'text-red-600',    bg: 'bg-red-50' },
            { id: 'stat-conversion', icon: TrendingUp,  label: 'Conversion Pipeline',   value: stats.conversion,  sub: 'hire candidates flagged',               color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ id, icon: Icon, label, value, sub, color, bg }) => (
            <div key={id} id={id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* Expiring alert banner */}
        <AnimatePresence>
          {expiringNurses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              id="expiring-alert"
              className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
            >
              <AlertOctagon size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  {expiringNurses.length} contract{expiringNurses.length > 1 ? 's' : ''} expiring within 30 days
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {expiringNurses.map(n => n.name).join(', ')} — review now to extend, convert, or arrange backfill.
                </p>
              </div>
              <button
                onClick={() => setTab('expiring')}
                className="text-xs font-bold text-amber-700 underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                Review →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversion opportunity */}
        <AnimatePresence>
          {conversionCandidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              id="conversion-banner"
              className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
            >
              <Zap size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  {conversionCandidates.length} top performers flagged for permanent hire
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Converting {conversionCandidates.map(n => n.name).join(' & ')} could save ≈ $9,600/month in agency premiums.
                </p>
              </div>
              <Link
                to="/hiring"
                className="text-xs font-bold text-emerald-700 underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                Open in Hiring →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  tab === t.key
                    ? 'border-violet-600 text-violet-700 bg-violet-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    t.key === 'expiring' ? 'bg-amber-500 text-white'
                    : t.key === 'completed' ? 'bg-slate-400 text-white'
                    : 'bg-violet-100 text-violet-700'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* Active tab */}
              {tab === 'active' && (
                <motion.div key="active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6" id="agency-grid">
                    {activeNurses.map(nurse => (
                      <AgencyCard
                        key={nurse.id}
                        nurse={nurse}
                        onOpen={setDrawerNurse}
                        onExtend={handleExtend}
                        onSetInterest={handleSetInterest}
                      />
                    ))}
                  </div>
                  <ConversionPipeline nurses={allNurses} onSetInterest={handleSetInterestById} />
                </motion.div>
              )}

              {/* Expiring tab */}
              {tab === 'expiring' && (
                <motion.div key="expiring" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }} id="expiring-section">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-900">Expiring Contracts</h2>
                    <span className="text-xs text-slate-400">{expiringNurses.length} contracts need decision within 30 days</span>
                  </div>
                  <div className="space-y-3">
                    {expiringNurses.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-300" />
                        <p className="font-semibold text-slate-600">No contracts expiring this month</p>
                      </div>
                    ) : (
                      expiringNurses.sort((a, b) => a.weeksRemaining - b.weeksRemaining).map(nurse => (
                        <div
                          key={nurse.id}
                          data-id={`expiring-row-${nurse.id}`}
                          className={`flex items-center gap-4 bg-white rounded-xl border p-4 ${nurse.weeksRemaining <= 1 ? 'border-red-300' : 'border-amber-200'}`}
                        >
                          <NurseAvatar nurse={nurse} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 text-sm">{nurse.name}</span>
                              <AgencyBadge short={nurse.agencyShort} agency={nurse.agency} />
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${UNIT_COLORS[nurse.unit]}`}>{nurse.unit}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>Ends {nurse.endDate}</span>
                              <span className={`font-bold ${nurse.weeksRemaining <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
                                {nurse.weeksRemaining <= 0 ? 'CONTRACT ENDED' : `${nurse.weeksRemaining}w left`}
                              </span>
                              <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" />{nurse.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              aria-label={`Extend contract ${nurse.id}`}
                              onClick={() => handleExtend(nurse)}
                              className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Extend
                            </button>
                            <button
                              aria-label={`Mark for hiring ${nurse.id}`}
                              onClick={() => handleSetInterest(nurse, 'hire')}
                              className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Hire Perm
                            </button>
                            <button
                              aria-label={`Let contract expire ${nurse.id}`}
                              onClick={() => { setManagerInterest(nurse.id, 'no-return'); setTick(t => t + 1); showToast(`${nurse.name} flagged — no renewal`) }}
                              className="text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Let Expire
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Cost Analysis tab */}
              {tab === 'cost' && (
                <motion.div key="cost" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }}>
                  <CostAnalysis />
                </motion.div>
              )}

              {/* Completed/DNR tab */}
              {tab === 'completed' && (
                <motion.div key="completed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }} id="completed-section">
                  <h2 className="font-bold text-slate-900 mb-4">Completed & DNR</h2>
                  <div className="space-y-3">
                    {completedNurses.map(nurse => (
                      <div
                        key={nurse.id}
                        data-id={`completed-row-${nurse.id}`}
                        className={`flex items-center gap-3 bg-white border rounded-xl p-4 ${nurse.status === 'no-return' ? 'border-red-200 opacity-75' : 'border-slate-200'}`}
                        onClick={() => setDrawerNurse(nurse)}
                      >
                        <NurseAvatar nurse={nurse} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-700">{nurse.name}</span>
                            <AgencyBadge short={nurse.agencyShort} agency={nurse.agency} />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_META[nurse.status].badge}`}>
                              {STATUS_META[nurse.status].label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{nurse.unit} · {nurse.startDate} → {nurse.endDate}</p>
                        </div>
                        {nurse.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                            <Star size={11} className="text-amber-400 fill-amber-400" />{nurse.rating.toFixed(1)}
                          </span>
                        )}
                        {nurse.incidentCount > 0 && (
                          <span className="text-xs text-red-500 font-bold shrink-0">{nurse.incidentCount} incidents</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Float Pool', href: '/float', icon: Users },
            { label: 'Open Shifts', href: '/shift-board', icon: Calendar },
            { label: 'Labor Budget', href: '/budget', icon: BarChart3 },
            { label: 'Talent Pipeline', href: '/hiring', icon: TrendingUp },
            { label: 'Credentials', href: '/credentials', icon: Shield },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all">
              <Icon size={13} />
              {label}
              <ChevronRight size={11} />
            </Link>
          ))}
        </div>
      </div>

      {/* Drawers & modals */}
      <AnimatePresence>
        {drawerNurse && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setDrawerNurse(null)}
            />
            <NurseDrawer
              nurse={drawerNurse}
              onClose={() => setDrawerNurse(null)}
              onExtend={handleExtend}
              onSetInterest={handleSetInterestById}
              onMarkOrientation={handleMarkOrientation}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {extendNurse && (
          <ExtendModal nurse={extendNurse} onConfirm={confirmExtend} onCancel={() => setExtendNurse(null)} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="action-toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' as const }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 font-semibold text-sm whitespace-nowrap"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
