import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Waves, Phone, Star, ChevronRight, X, AlertTriangle,
  CheckCircle2, Clock, Users, TrendingUp, Shield, Zap,
  Award, Calendar, Info, UserCheck, DollarSign,
} from 'lucide-react'
import {
  getNurses, getOpenNeeds, getAssignments, getPoolStats, getBestMatches,
  assignFloat, getAllNeeds,
  UNIT_COLORS, SHIFT_LABELS, REASON_LABELS, STATUS_META,
  type FloatNurse, type ShiftNeed, type AvailStatus,
} from '../data/floatPoolData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`
}

const PRIORITY_META = {
  urgent: { label: 'Urgent', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  high:   { label: 'High',   bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  normal: { label: 'Normal', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-slate-500 bg-slate-50 border-slate-200'
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
      {score}% match
    </span>
  )
}

function HoursGauge({ used, target }: { used: number; target: number }) {
  if (target === 0) return null
  const pct = Math.min(100, (used / target) * 100)
  const color = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-16">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        />
      </div>
      <span className="whitespace-nowrap">{used}/{target}h</span>
    </div>
  )
}

function StatusDot({ status }: { status: AvailStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} />
      {meta.label}
    </span>
  )
}

function NurseAvatar({ nurse, size = 'md' }: { nurse: FloatNurse; size?: 'sm' | 'md' | 'lg' }) {
  const meta = STATUS_META[nurse.status]
  const sz = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  const ringSz = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  return (
    <div className={`relative flex items-center justify-center ${ringSz}`}>
      <div className={`absolute inset-0 rounded-full ring-2 ${meta.ring} ring-offset-1 opacity-70`} />
      <div className={`${sz} rounded-full bg-gradient-to-br ${nurse.color} flex items-center justify-center text-white font-bold shadow`}>
        {nurse.initials}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${meta.dot}`} />
    </div>
  )
}

// ── Smart Match Card ─────────────────────────────────────────────────────────

function SmartMatchCard({
  need, onAssign,
}: {
  need: ShiftNeed
  onAssign: (nurseId: string, needId: string) => void
}) {
  const matches = getBestMatches(need.id, 3)
  const pm = PRIORITY_META[need.priority]
  const filled = !!need.filledById
  const nurses = getNurses()
  const filledNurse = filled ? nurses.find(n => n.id === need.filledById) : undefined

  return (
    <motion.div
      layout
      data-id={`match-need-${need.id}`}
      className={`rounded-xl border p-4 transition-all ${
        filled
          ? 'bg-emerald-50 border-emerald-200'
          : need.priority === 'urgent'
          ? 'bg-red-50/60 border-red-200'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Need header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${filled ? 'bg-emerald-100' : pm.bg}`}>
          {filled
            ? <CheckCircle2 size={16} className="text-emerald-600" />
            : <AlertTriangle size={16} className={pm.text} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">
              {need.unit} — {SHIFT_LABELS[need.shift]}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pm.bg} ${pm.text} ${pm.border}`}>
              {pm.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span>{REASON_LABELS[need.reason]}</span>
            {need.callOutName && <span>· {need.callOutName} called out</span>}
            <span className="flex items-center gap-1">
              <Clock size={11} /> Needed by {need.neededByTime}
            </span>
          </div>
        </div>
        {filled && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            ✓ Filled
          </span>
        )}
      </div>

      {/* Filled state */}
      {filled && filledNurse && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-200">
          <NurseAvatar nurse={filledNurse} size="sm" />
          <span className="text-sm font-medium text-slate-700">{filledNurse.name}</span>
          <span className="text-xs text-slate-400 ml-auto">Confirmed {need.filledAt}</span>
        </div>
      )}

      {/* Match candidates */}
      {!filled && (
        <div className="space-y-1.5">
          {matches.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center">
              No available float nurses with {need.unit} certification
            </div>
          ) : (
            matches.map(({ nurse, score }, i) => (
              <div key={nurse.id} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${i === 0 ? 'bg-violet-50 border border-violet-200' : 'bg-slate-50'}`}>
                <NurseAvatar nurse={nurse} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">{nurse.name}</span>
                    {i === 0 && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 rounded">Best Match</span>}
                    <ScoreBadge score={score} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{nurse.yearsExp}yr exp</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400 fill-amber-400" />{nurse.rating}</span>
                    <span>·</span>
                    <StatusDot status={nurse.status} />
                  </div>
                </div>
                <button
                  aria-label={`Assign float to ${need.id} nurse ${nurse.id}`}
                  onClick={() => onAssign(nurse.id, need.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    i === 0
                      ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-400 hover:text-violet-700'
                  }`}
                >
                  Assign
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Nurse Card (pool grid) ────────────────────────────────────────────────────

function NurseCard({
  nurse, onOpenProfile, onQuickAssign,
}: {
  nurse: FloatNurse
  onOpenProfile: (n: FloatNurse) => void
  onQuickAssign: (n: FloatNurse) => void
}) {
  const meta = STATUS_META[nurse.status]
  return (
    <motion.div
      layout
      data-id={`float-card-${nurse.id}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' as const }}
      className={`rounded-xl border bg-white p-4 cursor-pointer group transition-shadow hover:shadow-md ${
        nurse.status === 'dnr' ? 'opacity-50' : ''
      }`}
      onClick={() => onOpenProfile(nurse)}
    >
      {/* Avatar + status */}
      <div className="flex items-start justify-between mb-3">
        <NurseAvatar nurse={nurse} size="md" />
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          nurse.status === 'available' ? 'bg-emerald-100 text-emerald-700'
          : nurse.status === 'on-call' ? 'bg-amber-100 text-amber-700'
          : nurse.status === 'assigned' ? 'bg-sky-100 text-sky-700'
          : nurse.status === 'dnr' ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-500'
        }`}>
          {meta.label}
        </div>
      </div>

      {/* Name + exp */}
      <div className="mb-2">
        <p className="font-semibold text-slate-800 text-sm">{nurse.name}</p>
        <p className="text-xs text-slate-400">{nurse.yearsExp}yr · Tier {nurse.tier}</p>
      </div>

      {/* Unit badges */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {nurse.units.map(u => (
          <span key={u} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${UNIT_COLORS[u]}`}>
            {u}
          </span>
        ))}
      </div>

      {/* Hours gauge */}
      <HoursGauge used={nurse.hoursThisPeriod} target={nurse.hoursTarget} />

      {/* Rating + actions */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="font-medium">{nurse.rating}</span>
          <span className="text-slate-300">·</span>
          <span>{nurse.totalAssignments} shifts</span>
        </div>
        {nurse.status === 'available' && (
          <button
            aria-label={`Quick assign ${nurse.id}`}
            onClick={e => { e.stopPropagation(); onQuickAssign(nurse) }}
            className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2 py-1 rounded-lg transition-all"
          >
            Assign →
          </button>
        )}
        {nurse.status === 'on-call' && (
          <span className="text-[11px] text-amber-600 font-medium">On-Call</span>
        )}
      </div>
    </motion.div>
  )
}

// ── Nurse Drawer ─────────────────────────────────────────────────────────────

function NurseDrawer({
  nurse, onClose, onAssignFromDrawer,
}: {
  nurse: FloatNurse
  onClose: () => void
  onAssignFromDrawer: (nurseId: string, needId: string, note: string) => void
}) {
  const [assignUnit, setAssignUnit] = useState('')
  const [assignShift, setAssignShift] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const openNeeds = getOpenNeeds().filter(n => nurse.units.includes(n.unit))

  function handleSubmit() {
    const matchingNeed = openNeeds.find(n => n.unit === assignUnit && n.shift === (assignShift as typeof n.shift))
    if (matchingNeed) {
      onAssignFromDrawer(nurse.id, matchingNeed.id, assignNote)
    } else {
      // Create ad-hoc assignment using first matching open need or generic
      const anyNeed = openNeeds[0]
      if (anyNeed) onAssignFromDrawer(nurse.id, anyNeed.id, assignNote)
    }
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 2000)
  }

  const assignments = getAssignments().filter(a => a.nurseId === nurse.id).slice(0, 5)

  return (
    <motion.div
      id="nurse-drawer"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' as const }}
      className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <NurseAvatar nurse={nurse} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 id="drawer-nurse-name" className="font-bold text-slate-900 text-base">{nurse.name}</h2>
          <p className="text-xs text-slate-500">{nurse.yearsExp}yr experience · Tier {nurse.tier} Float</p>
          <StatusDot status={nurse.status} />
        </div>
        <button
          aria-label="Close nurse drawer"
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
            { label: 'Rating', value: nurse.rating.toFixed(1), icon: Star, iconClass: 'text-amber-400 fill-amber-400' },
            { label: 'Shifts', value: nurse.totalAssignments, icon: Calendar, iconClass: 'text-violet-500' },
            { label: 'Hours', value: `${nurse.hoursThisPeriod}/${nurse.hoursTarget}`, icon: Clock, iconClass: 'text-sky-500' },
          ].map(({ label, value, icon: Icon, iconClass }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5 text-center">
              <Icon size={14} className={`mx-auto mb-1 ${iconClass}`} />
              <p className="font-bold text-slate-800 text-sm">{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Contact</p>
          <a href={`tel:${nurse.phone}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-violet-600 transition-colors">
            <Phone size={14} className="text-slate-400" />
            {nurse.phone}
          </a>
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

        {/* Cross-training units */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cross-Trained Units</p>
          <div className="flex flex-wrap gap-1.5">
            {(['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Telemetry'] as const).map(u => (
              <span
                key={u}
                data-id={`drawer-unit-badge-${u.toLowerCase().replace('-', '')}`}
                className={`text-xs font-medium px-2 py-0.5 rounded border ${
                  nurse.units.includes(u) ? UNIT_COLORS[u] : 'bg-slate-100 text-slate-300 border-slate-200 opacity-50'
                }`}
              >
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        {nurse.notes && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">{nurse.notes}</p>
            </div>
          </div>
        )}

        {/* Open needs this nurse can fill */}
        {openNeeds.length > 0 && nurse.status !== 'assigned' && nurse.status !== 'dnr' && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Open Shifts She Can Cover</p>
            <div className="space-y-1.5">
              {openNeeds.slice(0, 3).map(n => (
                <div key={n.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{n.unit} · {n.shift} shift · {n.date}</p>
                    <p className="text-[11px] text-slate-400">{REASON_LABELS[n.reason]}</p>
                  </div>
                  <button
                    aria-label={`Quick assign ${nurse.id} to need ${n.id}`}
                    onClick={() => onAssignFromDrawer(nurse.id, n.id, '')}
                    className="text-xs font-semibold text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-lg transition-all"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual assign form */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Manual Assignment</p>
          <div className="space-y-2">
            <select
              id="quick-assign-unit"
              value={assignUnit}
              onChange={e => setAssignUnit(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Select unit…</option>
              {nurse.units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select
              id="quick-assign-shift"
              value={assignShift}
              onChange={e => setAssignShift(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Select shift…</option>
              <option value="day">Day (7A–7P)</option>
              <option value="evening">Evening (3P–11P)</option>
              <option value="night">Night (11P–7A)</option>
            </select>
            <input
              id="quick-assign-note"
              type="text"
              placeholder="Note (optional)"
              value={assignNote}
              onChange={e => setAssignNote(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              aria-label="Submit quick assign"
              disabled={!assignUnit || !assignShift}
              onClick={handleSubmit}
              className="w-full py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Assign to Shift
            </button>
            <AnimatePresence>
              {submitSuccess && (
                <motion.div
                  id="quick-assign-success"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
                >
                  <CheckCircle2 size={14} /> Assignment confirmed!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent assignments */}
        {assignments.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Assignments</p>
            <div className="space-y-1.5">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs text-slate-600 py-1.5 border-b border-slate-50 last:border-0">
                  <span className="font-medium">{a.unit} · {a.shift}</span>
                  <span className="text-slate-400">{a.date}</span>
                  <span className={`font-semibold ${a.status === 'confirmed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {a.status === 'confirmed' ? '✓ Confirmed' : a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Confirm Assignment Modal ─────────────────────────────────────────────────

function AssignModal({
  nurseId, needId, onConfirm, onCancel,
}: {
  nurseId: string; needId: string
  onConfirm: () => void; onCancel: () => void
}) {
  const nurses = getNurses()
  const needs  = getAllNeeds()
  const nurse  = nurses.find(n => n.id === nurseId)
  const need   = needs.find(n => n.id === needId)
  if (!nurse || !need) return null
  const matches = getBestMatches(needId, 3)
  const matchData = matches.find(m => m.nurse.id === nurseId)

  return (
    <motion.div
      id="assign-modal"
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <UserCheck size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Confirm Assignment</h3>
            <p className="text-xs text-slate-500">This will send a notification to the nurse</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <NurseAvatar nurse={nurse} size="sm" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">{nurse.name}</p>
              <p className="text-xs text-slate-400">{nurse.certifications.join(' · ')}</p>
            </div>
            {matchData && <ScoreBadge score={matchData.score} />}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <div className={`text-xs font-medium px-2 py-0.5 rounded border ${UNIT_COLORS[need.unit]}`}>{need.unit}</div>
            <span className="text-xs text-slate-600 font-medium">{SHIFT_LABELS[need.shift]}</span>
            <span className="text-xs text-slate-400">· {need.date}</span>
          </div>
          {need.callOutName && (
            <p className="text-xs text-slate-500">Covering: {need.callOutName} call-out</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all"
          >
            Cancel
          </button>
          <button
            aria-label={`Confirm assignment ${nurseId} to ${needId}`}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 text-sm transition-all shadow-sm shadow-violet-200"
          >
            Confirm & Notify
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabKey = 'smart' | 'pool' | 'history' | 'matrix'
type FilterStatus = 'all' | 'available' | 'on-call' | 'assigned'

export default function FloatPool() {
  const [tab, setTab] = useState<TabKey>('smart')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterUnit, setFilterUnit] = useState<string>('all')
  const [periodKey, setPeriodKey] = useState<'today' | 'tomorrow' | 'weekend'>('today')
  const [drawerNurse, setDrawerNurse] = useState<FloatNurse | null>(null)
  const [pendingAssign, setPendingAssign] = useState<{ nurseId: string; needId: string } | null>(null)
  const [assignToast, setAssignToast] = useState<string | null>(null)
  const [_tick, setTick] = useState(0)  // force re-render after assignment

  const stats = getPoolStats()
  const nurses = getNurses()
  const allNeeds = getAllNeeds()
  const openNeeds = getOpenNeeds()
  const assignments = getAssignments()

  const displayNeeds = allNeeds.filter(n => {
    if (periodKey === 'today') return n.dateKey === 'today'
    if (periodKey === 'tomorrow') return n.dateKey === 'tomorrow'
    return n.dateKey === 'tomorrow' || n.dateKey === 'sat'
  })

  const filteredNurses = nurses.filter(n => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false
    if (filterUnit !== 'all' && !n.units.includes(filterUnit as typeof n.units[0])) return false
    return true
  })

  const handleAssign = useCallback((nurseId: string, needId: string) => {
    setPendingAssign({ nurseId, needId })
  }, [])

  const confirmAssign = useCallback(() => {
    if (!pendingAssign) return
    const nurse = nurses.find(n => n.id === pendingAssign.nurseId)
    assignFloat(pendingAssign.nurseId, pendingAssign.needId)
    setPendingAssign(null)
    setTick(t => t + 1)
    setAssignToast(nurse?.name ?? 'Nurse')
    setTimeout(() => setAssignToast(null), 3000)
  }, [pendingAssign, nurses])

  const handleDrawerAssign = useCallback((nurseId: string, needId: string, _note: string) => {
    const nurse = nurses.find(n => n.id === nurseId)
    assignFloat(nurseId, needId)
    setTick(t => t + 1)
    setAssignToast(nurse?.name ?? 'Nurse')
    setTimeout(() => setAssignToast(null), 3000)
  }, [nurses])

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'smart',   label: 'Smart Match',   badge: openNeeds.filter(n => n.dateKey === 'today' || n.dateKey === 'tomorrow').length },
    { key: 'pool',    label: 'Float Pool',    badge: stats.available },
    { key: 'history', label: 'Assignments' },
    { key: 'matrix',  label: 'Cross-Training' },
  ]

  const UNITS: string[] = ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'Telemetry']

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <Waves size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Float Pool Manager</h1>
              <p className="text-xs text-slate-400">Smart matching · Real-time availability · One-click assign</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['today', 'tomorrow', 'weekend'] as const).map(p => (
              <button
                key={p}
                id={`period-${p}`}
                onClick={() => setPeriodKey(p)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  periodKey === p
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400 hover:text-violet-700'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'tomorrow' ? 'Tomorrow' : 'Weekend'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'stat-available', icon: Users, label: 'Available Now', value: stats.available, sub: `${stats.onCall} on-call`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { id: 'stat-needs',     icon: AlertTriangle, label: 'Shifts Need Cover', value: openNeeds.length, sub: `${displayNeeds.filter(n => !n.filledById).length} for ${periodKey}`, color: 'text-red-600', bg: 'bg-red-50' },
            { id: 'stat-utilization', icon: TrendingUp, label: 'Float Utilization', value: `${Math.round((stats.totalHours / stats.targetHours) * 100)}%`, sub: `${stats.totalHours} of ${stats.targetHours}h used`, color: 'text-violet-600', bg: 'bg-violet-50' },
            { id: 'stat-agency-saved', icon: DollarSign, label: 'Agency Cost Avoided', value: fmtK(stats.agencyAvoided), sub: `${stats.filledToday} float shifts today`, color: 'text-amber-600', bg: 'bg-amber-50' },
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

        {/* Urgent banner if open needs today */}
        {openNeeds.filter(n => n.dateKey === 'today' && n.priority === 'urgent').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            id="urgent-banner"
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <Zap size={16} className="text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-700">
              <strong>{openNeeds.filter(n => n.dateKey === 'today' && n.priority === 'urgent').length} urgent shifts</strong> need float coverage today —{' '}
              {stats.available} float nurses available right now.
            </p>
            <button
              onClick={() => setTab('smart')}
              className="ml-auto text-xs font-bold text-red-700 underline underline-offset-2 whitespace-nowrap"
            >
              Smart Match →
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {tabs.map(t => (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-violet-600 text-violet-700 bg-violet-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    t.key === 'smart' && t.badge > 0 ? 'bg-red-500 text-white' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* ── Smart Match ── */}
              {tab === 'smart' && (
                <motion.div
                  key="smart"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' as const }}
                  id="smart-match-section"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-slate-900">Shifts Needing Coverage</h2>
                      <p className="text-xs text-slate-400">AI-ranked matches based on certification, availability, and workload</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5 font-semibold">
                      <Zap size={12} />
                      Smart Match Active
                    </div>
                  </div>
                  {displayNeeds.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-300" />
                      <p className="font-semibold text-slate-600">All shifts covered for {periodKey}!</p>
                      <p className="text-sm mt-1">Great work — no float coverage needed.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {displayNeeds.map(need => (
                        <SmartMatchCard key={need.id} need={need} onAssign={handleAssign} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Float Pool ── */}
              {tab === 'pool' && (
                <motion.div
                  key="pool"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' as const }}
                >
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex gap-1">
                      {(['all', 'available', 'on-call', 'assigned'] as FilterStatus[]).map(s => (
                        <button
                          key={s}
                          id={`filter-status-${s}`}
                          onClick={() => setFilterStatus(s)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            filterStatus === s
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-violet-400'
                          }`}
                        >
                          {s === 'all' ? 'All' : STATUS_META[s as AvailStatus].label}
                        </button>
                      ))}
                    </div>
                    <select
                      id="filter-unit"
                      value={filterUnit}
                      onChange={e => setFilterUnit(e.target.value)}
                      aria-label="Filter by unit"
                      className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="all">All Units</option>
                      {UNITS.map(u => <option key={u} value={u}>{u} certified</option>)}
                    </select>
                  </div>
                  <div id="float-pool-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredNurses.map(nurse => (
                      <NurseCard
                        key={nurse.id}
                        nurse={nurse}
                        onOpenProfile={setDrawerNurse}
                        onQuickAssign={n => {
                          setDrawerNurse(n)
                        }}
                      />
                    ))}
                  </div>
                  {filteredNurses.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Users size={40} className="mx-auto mb-3 text-slate-200" />
                      <p className="font-semibold text-slate-600">No nurses match these filters</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Assignment History ── */}
              {tab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' as const }}
                  id="assignment-history"
                >
                  <h2 className="font-bold text-slate-900 mb-4">Assignment Log</h2>
                  <div className="space-y-2">
                    {assignments.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">No assignments yet</div>
                    ) : (
                      assignments.map((a, i) => {
                        const nurse = nurses.find(n => n.id === a.nurseId)
                        return (
                          <motion.div
                            key={a.id}
                            data-id={`assignment-row-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.2, ease: 'easeOut' as const }}
                            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
                          >
                            {nurse && <NurseAvatar nurse={nurse} size="sm" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm">{a.nurseName}</p>
                              <p className="text-xs text-slate-400">{a.unit} · {a.shift} shift · {a.date}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                              : a.status === 'pending' ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                            }`}>
                              {a.status === 'confirmed' ? '✓ Confirmed' : a.status}
                            </span>
                            <span className="text-xs text-slate-300">{a.assignedAt}</span>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Cross-Training Matrix ── */}
              {tab === 'matrix' && (
                <motion.div
                  key="matrix"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' as const }}
                >
                  <h2 className="font-bold text-slate-900 mb-4">Cross-Training Matrix</h2>
                  <div className="overflow-x-auto">
                    <table id="cross-training-matrix" className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 sticky left-0">
                            Nurse
                          </th>
                          {UNITS.map(u => (
                            <th key={u} className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 text-center">
                              {u}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200 text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {nurses.filter(n => n.status !== 'dnr').map((nurse, i) => (
                          <tr
                            key={nurse.id}
                            data-id={`matrix-row-${nurse.id}`}
                            className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                          >
                            <td className="px-3 py-2.5 sticky left-0 bg-inherit">
                              <div className="flex items-center gap-2">
                                <NurseAvatar nurse={nurse} size="sm" />
                                <div>
                                  <p className="font-medium text-slate-800 text-xs">{nurse.name}</p>
                                  <p className="text-[10px] text-slate-400">T{nurse.tier}</p>
                                </div>
                              </div>
                            </td>
                            {UNITS.map(u => (
                              <td
                                key={u}
                                data-id={`matrix-cell-${nurse.id}-${u.toLowerCase().replace('-', '')}`}
                                className="px-3 py-2.5 text-center"
                              >
                                {nurse.units.includes(u as typeof nurse.units[0]) ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-600">
                                    <CheckCircle2 size={12} />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300">
                                    <X size={10} />
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-center">
                              <StatusDot status={nurse.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Coverage summary */}
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {UNITS.map(u => {
                      const certified = nurses.filter(n => n.units.includes(u as typeof nurses[0]['units'][0]) && n.status !== 'dnr').length
                      const available = nurses.filter(n => n.units.includes(u as typeof nurses[0]['units'][0]) && n.status === 'available').length
                      return (
                        <div key={u} className={`rounded-lg border p-2.5 text-center ${UNIT_COLORS[u as keyof typeof UNIT_COLORS]}`}>
                          <p className="font-bold text-base">{available}</p>
                          <p className="text-[10px] font-semibold">{u}</p>
                          <p className="text-[10px] opacity-70">{certified} certified</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick-action links */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'View Open Shifts', href: '/shift-board', icon: Calendar },
            { label: 'OT Approvals', href: '/overtime', icon: Award },
            { label: 'Coverage Command', href: '/coverage', icon: Shield },
            { label: 'Labor Budget', href: '/budget', icon: TrendingUp },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all"
            >
              <Icon size={13} />
              {label}
              <ChevronRight size={11} />
            </Link>
          ))}
        </div>
      </div>

      {/* Assignment confirm modal */}
      <AnimatePresence>
        {pendingAssign && (
          <AssignModal
            nurseId={pendingAssign.nurseId}
            needId={pendingAssign.needId}
            onConfirm={confirmAssign}
            onCancel={() => setPendingAssign(null)}
          />
        )}
      </AnimatePresence>

      {/* Nurse drawer */}
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
              onAssignFromDrawer={handleDrawerAssign}
            />
          </>
        )}
      </AnimatePresence>

      {/* Assignment toast */}
      <AnimatePresence>
        {assignToast && (
          <motion.div
            id="assign-toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' as const }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 font-semibold text-sm"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {assignToast} assigned and notified!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
