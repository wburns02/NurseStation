import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, AlertTriangle, CheckCircle2,
  Clock, Bell, Ban, ChevronRight, Info,
  Shield, BookOpen, TrendingUp, Users, Zap,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  getNurses, getStats, blockOT, sendNotification, hasBeenNotified,
  ZONE_META, UNIT_COLORS, COMPLIANCE_RULES, TIMELINE_DAYS, TIMELINE_DOW,
  type NurseHours, type FatigueZone,
} from '../data/safeHoursData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ n, size = 'md' }: { n: NurseHours; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-11 h-11 text-sm' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  const dot = ZONE_META[n.fatigueZone].dot
  return (
    <div className="relative inline-flex">
      <div className={`${sz} rounded-full bg-gradient-to-br ${n.color} flex items-center justify-center text-white font-bold shadow`}>
        {n.initials}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dot}`} />
    </div>
  )
}

// Radial arc gauge for weekly hours (SVG)
function HoursGauge({ hours, max = 60 }: { hours: number; max?: number }) {
  const clipped = Math.min(hours, max * 1.15)
  const pct     = clipped / max
  const R = 28; const cx = 36; const cy = 36; const sw = 7
  const circumference = Math.PI * R  // semicircle
  const offset = circumference * (1 - Math.min(pct, 1))
  const overLimit = hours > max
  const color = hours > max ? '#ef4444' : hours > max * 0.9 ? '#f59e0b' : hours > max * 0.7 ? '#fbbf24' : '#10b981'

  return (
    <div className="relative w-[72px] h-[40px] flex items-end justify-center">
      <svg width="72" height="44" viewBox="0 0 72 44">
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="#e2e8f0" strokeWidth={sw} strokeLinecap="round" />
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* 60h marker */}
        <line x1={cx + R} y1={cy} x2={cx + R - sw * 1.5} y2={cy} stroke="#94a3b8" strokeWidth={1.5} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center leading-none">
        <span className={`text-sm font-bold ${overLimit ? 'text-red-600' : 'text-slate-700'}`}>{hours}h</span>
        <span className="text-[9px] text-slate-400">/ {max}h</span>
      </div>
    </div>
  )
}

// Micro shift strip (7 colored cells for last 7 days)
function ShiftStrip({ nurse }: { nurse: NurseHours }) {
  const dayMap: Record<string, number> = {}
  nurse.recentShifts.forEach(s => { dayMap[s.date] = s.hours })
  return (
    <div className="flex gap-0.5">
      {TIMELINE_DAYS.map(day => {
        const h = dayMap[day] ?? 0
        const bg = h === 0 ? 'bg-slate-100' : h >= 14 ? 'bg-red-500' : h >= 12 ? 'bg-amber-400' : 'bg-emerald-400'
        return (
          <div key={day} title={`${day}: ${h > 0 ? h + 'h' : 'Off'}`}
            className={`w-3 h-5 rounded-sm ${bg} transition-colors`}
          />
        )
      })}
    </div>
  )
}

// ── Nurse Row ─────────────────────────────────────────────────────────────────

function NurseRow({
  nurse, expanded, onToggle, onBlockOT, onNotify,
}: {
  nurse: NurseHours
  expanded: boolean
  onToggle: () => void
  onBlockOT: (id: string) => void
  onNotify: (id: string) => void
}) {
  const zm = ZONE_META[nurse.fatigueZone]
  const notified = hasBeenNotified(nurse.id)

  return (
    <motion.div
      layout
      data-id={`nurse-hours-${nurse.id}`}
      className={`bg-white rounded-xl border ${zm.row} shadow-sm overflow-hidden`}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        {/* Avatar */}
        <Avatar n={nurse} />

        {/* Name + unit */}
        <div className="min-w-0 w-[140px] shrink-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{nurse.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${UNIT_COLORS[nurse.unit]}`}>{nurse.unit}</span>
            <span data-id={`fatigue-zone-${nurse.id}`} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${zm.badge}`}>{zm.label}</span>
          </div>
        </div>

        {/* Weekly hours gauge */}
        <div className="shrink-0">
          <HoursGauge hours={nurse.hoursThisWeek} />
        </div>

        {/* Fatigue score */}
        <div className="hidden sm:flex flex-col items-center w-12 shrink-0">
          <span className={`text-lg font-bold ${zm.score}`}>{nurse.fatigueScore}</span>
          <span className="text-[9px] text-slate-400 font-medium">fatigue</span>
        </div>

        {/* Consecutive days */}
        <div className="hidden md:flex flex-col items-center w-14 shrink-0">
          <span className={`text-lg font-bold ${nurse.consecutiveDays >= 6 ? 'text-red-600' : nurse.consecutiveDays >= 4 ? 'text-amber-600' : 'text-slate-600'}`}>
            {nurse.consecutiveDays}d
          </span>
          <span className="text-[9px] text-slate-400 font-medium">consec.</span>
        </div>

        {/* Rest status */}
        <div className="hidden lg:flex flex-col items-start flex-1 min-w-0 pl-2">
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            nurse.restStatus === 'blocked' ? 'text-red-600' :
            nurse.restStatus === 'resting' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            <Clock size={11} />
            {nurse.restStatus === 'available' ? 'Available now' : `Rest until ${nurse.nextAvailableTime}`}
          </div>
          {nurse.alerts.length > 0 && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[200px]">{nurse.alerts[0]}</p>
          )}
        </div>

        {/* Shift strip */}
        <div className="hidden xl:block shrink-0">
          <ShiftStrip nurse={nurse} />
          <p className="text-[9px] text-slate-400 text-center mt-0.5">Mar 6–13</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {!nurse.otBlockedBySystem && nurse.fatigueZone !== 'safe' && (
            <button
              aria-label={`Block OT for ${nurse.id}`}
              onClick={e => { e.stopPropagation(); onBlockOT(nurse.id) }}
              title="Block Overtime"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Ban size={14} aria-hidden="true" />
            </button>
          )}
          {nurse.otBlockedBySystem && (
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200" title="OT Blocked">
              OT Blocked
            </span>
          )}
          {!notified && nurse.fatigueZone !== 'safe' && (
            <button
              aria-label={`Notify nurse ${nurse.id}`}
              onClick={e => { e.stopPropagation(); onNotify(nurse.id) }}
              title="Send notification"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
            >
              <Bell size={14} />
            </button>
          )}
          {notified && (
            <CheckCircle2 size={14} className="text-emerald-500" aria-label="Notified" />
          )}
          <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-600 transition-all">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                {[
                  { label: '7-Day Hours', value: `${nurse.hours7d}h`, sub: '/ 60h limit', warn: nurse.hours7d > 60 },
                  { label: '14-Day Hours', value: `${nurse.hours14d}h`, sub: '/ 84h max',   warn: nurse.hours14d > 84 },
                  { label: 'Consecutive Days', value: `${nurse.consecutiveDays} days`, sub: '/ 7 max', warn: nurse.consecutiveDays >= 6 },
                  { label: 'Last Shift', value: `${nurse.hoursLastShift}h`, sub: nurse.lastShiftEndTime, warn: nurse.hoursLastShift > 13 },
                ].map(({ label, value, sub, warn }) => (
                  <div key={label} className={`rounded-lg p-2.5 border ${warn ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-sm font-bold ${warn ? 'text-red-700' : 'text-slate-800'}`}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                    <p className={`text-[10px] ${warn ? 'text-red-400' : 'text-slate-400'}`}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {nurse.alerts.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {nurse.alerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                      nurse.fatigueZone === 'critical' ? 'bg-red-50 text-red-700' :
                      nurse.fatigueZone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                      {alert}
                    </div>
                  ))}
                </div>
              )}

              {/* Shift history */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Shifts</p>
                <div className="space-y-1">
                  {nurse.recentShifts.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-14 font-medium text-slate-400">{s.dow} {s.date.slice(4)}</span>
                      <span className="font-semibold">{s.start}–{s.end}</span>
                      <span className={`font-bold ${s.hours > 13 ? 'text-red-600' : 'text-slate-700'}`}>{s.hours}h</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${UNIT_COLORS[s.unit]}`}>{s.unit}</span>
                      {s.ot && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">OT</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* OT toggle */}
              {!nurse.otBlockedBySystem && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    aria-label={`Block OT for ${nurse.id}`}
                    onClick={() => onBlockOT(nurse.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Ban size={12} /> Block OT
                  </button>
                  {nurse.pendingOtRequest && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle size={11} /> Pending OT request — review in <Link to="/overtime" className="underline">OT Approvals</Link>
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Timeline View ─────────────────────────────────────────────────────────────

function TimelineView({ nurses }: { nurses: NurseHours[] }) {
  const topNurses = nurses.slice(0, 10)

  return (
    <div id="timeline-view" className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="flex items-center mb-2">
          <div className="w-36 shrink-0" />
          <div className="flex-1 grid grid-cols-8">
            {TIMELINE_DAYS.map((day, i) => (
              <div key={day} className={`text-center ${day === 'Mar 13' ? 'font-bold text-violet-700' : ''}`}>
                <p className="text-[10px] text-slate-400">{TIMELINE_DOW[i]}</p>
                <p className="text-xs font-semibold text-slate-600">{day.slice(4)}</p>
              </div>
            ))}
          </div>
          <div className="w-16 text-right text-[10px] text-slate-400">7-Day</div>
        </div>

        {/* Today marker */}
        <div className="flex items-center mb-3">
          <div className="w-36 shrink-0" />
          <div className="flex-1 grid grid-cols-8">
            {TIMELINE_DAYS.map(day => (
              <div key={day} className={`h-0.5 mx-0.5 rounded ${day === 'Mar 13' ? 'bg-violet-400' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="w-16" />
        </div>

        {/* Nurse rows */}
        <div className="space-y-1.5">
          {topNurses.map((nurse, ni) => {
            const zm = ZONE_META[nurse.fatigueZone]
            const dayMap: Record<string, typeof nurse.recentShifts[0]> = {}
            nurse.recentShifts.forEach(s => { dayMap[s.date] = s })
            return (
              <motion.div
                key={nurse.id}
                data-id={`timeline-row-${nurse.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ni * 0.04, duration: 0.2, ease: 'easeOut' as const }}
                className="flex items-center gap-2"
              >
                <div className="w-36 flex items-center gap-2 shrink-0">
                  <Avatar n={nurse} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{nurse.name.split(' ')[0]} {nurse.name.split(' ')[1]?.slice(0, 1)}.</p>
                    <span className={`text-[9px] font-bold px-1 rounded ${zm.badge}`}>{zm.label}</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-8 gap-0.5">
                  {TIMELINE_DAYS.map(day => {
                    const s = dayMap[day]
                    if (!s) return <div key={day} className="h-7 rounded-sm bg-slate-100" />
                    const bg = s.hours >= 14 ? 'bg-red-500' : s.hours >= 13 ? 'bg-amber-400' : s.ot ? 'bg-amber-300' : 'bg-emerald-400'
                    return (
                      <div key={day} title={`${s.hours}h ${s.type}`}
                        className={`h-7 rounded-sm ${bg} flex items-center justify-center text-[9px] font-bold text-white`}>
                        {s.hours}
                      </div>
                    )
                  })}
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-bold ${zm.score}`}>{nurse.hours7d}h</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200">
          {[
            { color: 'bg-emerald-400', label: 'Regular' },
            { color: 'bg-amber-300', label: 'OT' },
            { color: 'bg-amber-400', label: '13h+' },
            { color: 'bg-red-500', label: '14h+' },
            { color: 'bg-slate-100', label: 'Off' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Compliance Rules Tab ──────────────────────────────────────────────────────

function CompliancePanel() {
  return (
    <div id="compliance-panel" className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
          <BookOpen size={16} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">California Safe Staffing Compliance</h3>
          <p className="text-xs text-slate-400">Applicable laws and hospital policies · Mercy General Hospital</p>
        </div>
      </div>
      {COMPLIANCE_RULES.map(rule => (
        <div key={rule.id} data-id={`rule-${rule.id}`} className={`rounded-xl border p-4 ${
          rule.severity === 'law' ? 'bg-red-50 border-red-200' :
          rule.severity === 'policy' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  rule.severity === 'law' ? 'bg-red-200 text-red-800' :
                  rule.severity === 'policy' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {rule.severity === 'law' ? 'State Law' : rule.severity === 'policy' ? 'Hospital Policy' : 'Best Practice'}
                </span>
                <span className="text-[10px] text-slate-400">{rule.source}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{rule.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <div className={`flex-1 rounded-lg px-3 py-2 text-xs ${
              rule.severity === 'law' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className="font-bold">Limit: </span>{rule.limit}
            </div>
            <div className="flex-1 rounded-lg px-3 py-2 text-xs bg-slate-100 text-slate-600">
              <span className="font-bold">If violated: </span>{rule.consequence}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Notify Modal ──────────────────────────────────────────────────────────────

function NotifyModal({
  nurse, onConfirm, onCancel,
}: { nurse: NurseHours; onConfirm: () => void; onCancel: () => void }) {
  const zm = ZONE_META[nurse.fatigueZone]
  const msg = nurse.fatigueZone === 'critical'
    ? `You have worked ${nurse.hoursThisWeek} hours this week and your rest period is required. You cannot be scheduled for new shifts until ${nurse.nextAvailableTime}. Please contact your manager if you have questions.`
    : `Your fatigue score is ${nurse.fatigueScore}/100. You have ${nurse.hoursThisWeek} hours logged this week — please ensure adequate rest before your next shift.`

  return (
    <motion.div
      id="notify-modal"
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
          <div className={`w-10 h-10 rounded-xl ${nurse.fatigueZone === 'critical' ? 'bg-red-100' : 'bg-amber-100'} flex items-center justify-center`}>
            <Bell size={20} className={nurse.fatigueZone === 'critical' ? 'text-red-600' : 'text-amber-600'} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Send Fatigue Notification</h3>
            <p className="text-xs text-slate-500">via app + SMS to {nurse.name}</p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 mb-4 ${nurse.fatigueZone === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Avatar n={nurse} size="sm" />
            <div>
              <p className="font-semibold text-sm text-slate-800">{nurse.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${zm.badge}`}>{zm.label} — {nurse.fatigueScore}/100</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-200 leading-relaxed">
            "{msg}"
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all">
            Cancel
          </button>
          <button
            aria-label="Send fatigue notification"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 text-sm transition-all"
          >
            Send Notification
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabKey = 'monitor' | 'timeline' | 'rules'
type FilterKey = FatigueZone | 'all'

export default function SafeHours() {
  const [tab, setTab] = useState<TabKey>('monitor')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sortBy, setSortBy] = useState<'fatigue' | 'hours' | 'consec'>('fatigue')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notifyNurse, setNotifyNurse] = useState<NurseHours | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [_tick, setTick] = useState(0)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleBlockOT(id: string) {
    blockOT(id)
    setTick(t => t + 1)
    const n = getNurses().find(x => x.id === id)
    showToast(`OT blocked for ${n?.name ?? id}`)
  }

  function handleNotify(id: string) {
    const n = getNurses().find(x => x.id === id)
    setNotifyNurse(n ?? null)
  }

  function confirmNotify() {
    if (!notifyNurse) return
    sendNotification(notifyNurse.id)
    setTick(t => t + 1)
    showToast(`Notification sent to ${notifyNurse.name}`)
    setNotifyNurse(null)
  }

  const stats = getStats()
  const nurses = getNurses()

  const filtered = nurses
    .filter(n => filter === 'all' || n.fatigueZone === filter)
    .sort((a, b) => {
      if (sortBy === 'fatigue') return b.fatigueScore - a.fatigueScore
      if (sortBy === 'hours') return b.hoursThisWeek - a.hoursThisWeek
      return b.consecutiveDays - a.consecutiveDays
    })

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'monitor', label: 'Fatigue Monitor' },
    { key: 'timeline', label: '14-Day Timeline' },
    { key: 'rules', label: 'Compliance Rules' },
  ]

  const FILTERS: { key: FilterKey; label: string; color: string }[] = [
    { key: 'all',      label: 'All Nurses', color: 'bg-slate-600 text-white' },
    { key: 'critical', label: 'Critical',   color: 'bg-red-500 text-white' },
    { key: 'warning',  label: 'Warning',    color: 'bg-amber-500 text-white' },
    { key: 'caution',  label: 'Caution',    color: 'bg-yellow-400 text-white' },
    { key: 'safe',     label: 'Safe',       color: 'bg-emerald-500 text-white' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Safe Hours & Fatigue Monitor</h1>
              <p className="text-xs text-slate-400">CA AB 394 compliant · Real-time fatigue risk · Work hour enforcement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/overtime" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all">
              <TrendingUp size={13} /> OT Approvals
            </Link>
            <Link to="/coverage" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all">
              <Users size={13} /> Coverage
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'stat-critical',  icon: Ban,           label: 'Critical / Blocked',    value: stats.critical,    sub: `${stats.blocked} OT blocked by system`, color: 'text-red-600',     bg: 'bg-red-50' },
            { id: 'stat-warning',   icon: AlertTriangle, label: 'Warning Zone',           value: stats.warning,     sub: `${stats.pendingOt} pending OT requests`, color: 'text-amber-600',  bg: 'bg-amber-50' },
            { id: 'stat-resting',   icon: Clock,         label: 'In Rest Period',         value: stats.resting,     sub: 'mandatory rest — not schedulable',      color: 'text-sky-600',    bg: 'bg-sky-50' },
            { id: 'stat-avg-score', icon: TrendingUp,    label: 'Avg Fatigue Score',      value: `${stats.avgScore}/100`, sub: `${stats.total} nurses monitored`,  color: 'text-violet-600', bg: 'bg-violet-50' },
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

        {/* Critical alert banner */}
        {stats.critical > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            id="fatigue-alert"
            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <Ban size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {stats.critical} nurse{stats.critical > 1 ? 's' : ''} in critical fatigue zone — cannot be scheduled for new shifts
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                {nurses.filter(n => n.fatigueZone === 'critical').map(n => n.name).join(' and ')} — work hour limits exceeded. OT auto-blocked.
              </p>
            </div>
            <button onClick={() => setFilter('critical')} className="text-xs font-bold text-red-700 underline underline-offset-2 whitespace-nowrap">
              View →
            </button>
          </motion.div>
        )}

        {/* Resting warning */}
        {stats.resting > stats.critical && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            id="rest-alert"
            className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>{stats.resting} nurses</strong> are currently in mandatory rest periods and cannot start a new shift yet.
              Plan coverage accordingly.
            </p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {tabs.map(t => (
              <button key={t.key} id={`tab-${t.key}`} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-violet-600 text-violet-700 bg-violet-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.key === 'monitor' && <ShieldCheck size={14} />}
                {t.key === 'timeline' && <TrendingUp size={14} />}
                {t.key === 'rules' && <BookOpen size={14} />}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* ── Monitor ── */}
              {tab === 'monitor' && (
                <motion.div key="monitor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }}>
                  {/* Filter + sort bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex gap-1 flex-wrap">
                      {FILTERS.map(f => (
                        <button
                          key={f.key}
                          id={`filter-${f.key}`}
                          onClick={() => setFilter(f.key)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            filter === f.key ? f.color + ' border-transparent shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {f.label}
                          {f.key !== 'all' && (
                            <span className="ml-1 opacity-70">
                              ({nurses.filter(n => n.fatigueZone === f.key).length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                      <span>Sort:</span>
                      {(['fatigue', 'hours', 'consec'] as const).map(s => (
                        <button
                          key={s}
                          aria-label={`Sort by ${s}`}
                          onClick={() => setSortBy(s)}
                          className={`px-2 py-1 rounded-lg border transition-all ${
                            sortBy === s ? 'bg-violet-50 text-violet-700 border-violet-300 font-semibold' : 'bg-white border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {s === 'fatigue' ? 'Risk' : s === 'hours' ? 'Hours' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column headers */}
                  <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    <div className="w-10" />
                    <div className="w-[140px]">Nurse</div>
                    <div className="w-[72px] text-center">This Week</div>
                    <div className="hidden sm:block w-12 text-center">Fatigue</div>
                    <div className="hidden md:block w-14 text-center">Consec.</div>
                    <div className="hidden lg:flex flex-1 pl-2">Rest Status</div>
                    <div className="hidden xl:block w-[104px] text-center">Mar 6–13</div>
                    <div className="w-24" />
                  </div>

                  {/* Nurse list */}
                  <div id="nurse-hours-list" className="space-y-2">
                    <AnimatePresence>
                      {filtered.map(nurse => (
                        <NurseRow
                          key={nurse.id}
                          nurse={nurse}
                          expanded={expandedId === nurse.id}
                          onToggle={() => setExpandedId(id => id === nurse.id ? null : nurse.id)}
                          onBlockOT={handleBlockOT}
                          onNotify={handleNotify}
                        />
                      ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                      <div className="text-center py-10 text-slate-400">
                        <ShieldCheck size={36} className="mx-auto mb-2 text-emerald-300" />
                        <p className="font-semibold text-slate-600">No nurses in this zone</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Timeline ── */}
              {tab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-slate-900">14-Day Work Hour Timeline</h2>
                      <p className="text-xs text-slate-400">Sorted by fatigue score · Today (Mar 13) highlighted</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info size={13} className="text-slate-400" />
                      <span className="text-xs text-slate-400">Green = regular · Orange = OT · Red = 14h+</span>
                    </div>
                  </div>
                  <TimelineView nurses={nurses.sort((a, b) => b.fatigueScore - a.fatigueScore)} />
                </motion.div>
              )}

              {/* ── Rules ── */}
              {tab === 'rules' && (
                <motion.div key="rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' as const }}>
                  <CompliancePanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'OT Approvals', href: '/overtime', icon: TrendingUp },
            { label: 'Coverage Command', href: '/coverage', icon: Shield },
            { label: 'Float Pool', href: '/float', icon: Users },
            { label: 'Shift Board', href: '/shift-board', icon: Zap },
            { label: 'Auto-Schedule', href: '/auto-schedule', icon: ShieldCheck },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 bg-white border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-lg transition-all">
              <Icon size={13} />
              {label}
              <ChevronRight size={11} />
            </Link>
          ))}
        </div>
      </div>

      {/* Notify modal */}
      <AnimatePresence>
        {notifyNurse && (
          <NotifyModal nurse={notifyNurse} onConfirm={confirmNotify} onCancel={() => setNotifyNurse(null)} />
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
