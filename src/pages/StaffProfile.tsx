import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  PlusCircle,
  Star,
  Clock,
  DollarSign,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  Zap,
  BadgeCheck,
  RefreshCw,
} from 'lucide-react'
import { allStaff } from '../data/mockData'
import { getProfileData, CALENDAR_DATES, TODAY_IDX, type DayStatus } from '../data/staffProfileData'
import { allCredentials, CERT_FULL_NAMES } from '../data/credentialsData'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarGradient(status: string) {
  switch (status) {
    case 'on-duty':  return 'from-emerald-500 to-emerald-700'
    case 'available': return 'from-blue-500 to-blue-700'
    case 'called-out': return 'from-red-400 to-red-600'
    default: return 'from-slate-400 to-slate-600'
  }
}

function statusLabel(s: string) {
  const MAP: Record<string, string> = {
    'on-duty': 'On Duty',
    'available': 'Available',
    'off-duty': 'Off Duty',
    'called-out': 'Called Out',
  }
  return MAP[s] ?? s
}

function statusColor(s: string) {
  const MAP: Record<string, string> = {
    'on-duty': 'bg-emerald-100 text-emerald-700',
    'available': 'bg-blue-100 text-blue-700',
    'off-duty': 'bg-slate-100 text-slate-500',
    'called-out': 'bg-red-100 text-red-600',
  }
  return MAP[s] ?? 'bg-slate-100 text-slate-500'
}

// ─── OT Ring Gauge ────────────────────────────────────────────────────────────

function OTRingGauge({ worked, threshold, size = 80 }: { worked: number; threshold: number; size?: number }) {
  const r = size * 0.38
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, worked / threshold)
  const offset = circ * (1 - pct)
  const color = pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#f59e0b' : '#10b981'
  const textColor = pct >= 0.9 ? 'text-red-500' : pct >= 0.7 ? 'text-amber-500' : 'text-emerald-600'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.09} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.09}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' as const }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-black text-lg leading-none ${textColor}`}>{Math.round(pct * 100)}%</span>
        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">used</span>
      </div>
    </div>
  )
}

// ─── Calendar Cell ────────────────────────────────────────────────────────────

const DAY_STYLE: Record<DayStatus, { bg: string; label: string; dot: string }> = {
  D: { bg: 'bg-violet-500 text-white',     label: 'D', dot: 'bg-violet-500' },
  E: { bg: 'bg-amber-500 text-white',      label: 'E', dot: 'bg-amber-500' },
  N: { bg: 'bg-indigo-600 text-white',     label: 'N', dot: 'bg-indigo-600' },
  '.': { bg: 'bg-slate-100 text-slate-400', label: '–', dot: 'bg-slate-300' },
  A: { bg: 'bg-emerald-100 text-emerald-700', label: 'A', dot: 'bg-emerald-400' },
  X: { bg: 'bg-red-100 text-red-600 ring-1 ring-red-400', label: 'X', dot: 'bg-red-500' },
}

function CalCell({ status, dateLabel, isToday, isFuture }: {
  status: DayStatus; dateLabel: string; isToday: boolean; isFuture: boolean
}) {
  const style = DAY_STYLE[status]
  const dayNum = dateLabel.split(' ')[1]

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-slate-400 font-medium leading-none">{dayNum}</span>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all
        ${style.bg}
        ${isToday ? 'ring-2 ring-offset-1 ring-violet-600' : ''}
        ${isFuture && status !== 'X' ? 'opacity-70' : ''}
      `}>
        {style.label}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffProfile() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()

  const staff = allStaff.find(s => s.id === staffId)
  const profile = getProfileData(staffId ?? '', {
    name: staff?.name ?? '',
    role: staff?.role ?? 'RN',
    hoursThisWeek: staff?.hoursThisWeek ?? 32,
    overtimeHours: staff?.overtimeHours ?? 40,
  })

  // Credentials for this staff member
  const staffCreds = allCredentials.filter(c => c.staffId === staffId)

  // OT cost calculator state
  const [addHours, setAddHours] = useState(8)

  if (!staff) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Staff member not found</p>
          <button onClick={() => navigate('/staff')} className="mt-3 text-violet-600 text-sm hover:underline">
            ← Back to Staff Roster
          </button>
        </div>
      </div>
    )
  }

  // OT cost calculations
  const rate = profile.hourlyRate
  const ot = profile.otMultiplier
  const periodWorked = profile.payPeriodHoursWorked
  const periodThreshold = profile.payPeriodOtThreshold
  const regularRemaining = Math.max(0, periodThreshold - periodWorked)

  const regularHours = Math.min(addHours, regularRemaining)
  const overtimeHours = Math.max(0, addHours - regularRemaining)
  const additionalCost = (regularHours * rate) + (overtimeHours * rate * ot)
  const currentPeriodCost = periodWorked * rate
  const newTotalCost = currentPeriodCost + additionalCost
  const otRiskPct = periodWorked / periodThreshold

  // Reliability color
  const relScore = profile.reliabilityScore
  const relColor = relScore >= 95 ? 'text-emerald-600' : relScore >= 85 ? 'text-amber-600' : 'text-red-500'

  // Calendar rows (4 weeks)
  const weeks = [0, 1, 2, 3].map(w => ({
    weekLabel: CALENDAR_DATES[w * 7].split(' ')[1] === '23'
      ? 'Feb 23'
      : CALENDAR_DATES[w * 7],
    days: profile.calendar28.slice(w * 7, w * 7 + 7).map((status, d) => ({
      status,
      dateLabel: CALENDAR_DATES[w * 7 + d],
      idx: w * 7 + d,
    })),
  }))

  // Credential status summary
  const credExpiredCount = staffCreds.filter(c => c.status === 'expired').length
  const credCriticalCount = staffCreds.filter(c => c.status === 'critical').length
  const credValidCount = staffCreds.filter(c => c.status === 'current' || c.status === 'expiring').length
  const credTotal = staffCreds.length || staff.certifications.length
  const credHealthColor = credExpiredCount > 0 ? 'text-red-600' : credCriticalCount > 0 ? 'text-amber-600' : 'text-emerald-600'

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/staff')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Staff Roster
        </button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-sm font-semibold text-slate-800">{staff.name}</span>
        <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor(staff.status)}`}>
          {statusLabel(staff.status)}
        </span>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGradient(staff.status)} flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0`}>
            {staff.avatarInitials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{staff.name}</h1>
              <span className={`mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor(staff.status)}`}>
                {statusLabel(staff.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-sm font-semibold text-violet-600">{staff.role}</span>
              <span className="text-sm text-slate-500">
                {profile.department}
              </span>
              <span className="text-sm text-slate-400">{staff.unitExperience.join(' · ')}</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-slate-500">
              <span>Emp #{profile.employeeCode}</span>
              <span>Hired {profile.hireDate}</span>
              <span>{profile.payGrade}</span>
              <span>{profile.supervisor}</span>
            </div>
            {/* Cert badges */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {staff.certifications.map(c => (
                <span key={c} className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <a
              href={`tel:${staff.phone}`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <Phone size={15} />
              {staff.phone}
            </a>
            <Link
              to="/messages"
              className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageSquare size={15} />
              Send Message
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <PlusCircle size={15} />
              Assign to Gap
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Pay Period */}
          <motion.div variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-violet-100 rounded-lg">
                  <Clock size={14} className="text-violet-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pay Period</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{profile.payPeriodHoursWorked}h</p>
              <p className="text-xs text-slate-500 mt-0.5">of {profile.payPeriodOtThreshold}h threshold</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${otRiskPct >= 0.9 ? 'bg-red-500' : otRiskPct >= 0.7 ? 'bg-amber-500' : 'bg-violet-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${otRiskPct * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' as const }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{profile.payPeriodLabel}</p>
            </div>
          </motion.div>

          {/* OT Risk */}
          <motion.div variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <Zap size={14} className="text-amber-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">OT Risk</p>
              </div>
              <div className="flex items-center gap-3">
                <OTRingGauge worked={periodWorked} threshold={periodThreshold} size={72} />
                <div>
                  <p className="text-sm font-bold text-slate-700">{Math.max(0, periodThreshold - periodWorked)}h left</p>
                  <p className="text-[11px] text-slate-400">before OT</p>
                  <p className="text-[11px] text-slate-400 mt-1">${rate}/hr base</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reliability */}
          <motion.div variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Star size={14} className="text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reliability</p>
              </div>
              <p className={`text-3xl font-black ${relColor}`}>{relScore}%</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile.calloutsLast90d} callout{profile.calloutsLast90d !== 1 ? 's' : ''} in 90 days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.shiftsCompleted90d} shifts completed</p>
              {profile.avgResponseMin && (
                <p className="text-[11px] text-slate-400">~{profile.avgResponseMin}m response time</p>
              )}
            </div>
          </motion.div>

          {/* Credential Health */}
          <motion.div variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <BadgeCheck size={14} className="text-blue-600" />
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Credentials</p>
              </div>
              {staffCreds.length > 0 ? (
                <>
                  <p className={`text-2xl font-black ${credHealthColor}`}>
                    {credValidCount}/{credTotal}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">valid</p>
                  {credExpiredCount > 0 && (
                    <p className="text-[11px] font-bold text-red-500 mt-1">{credExpiredCount} expired</p>
                  )}
                  {credCriticalCount > 0 && (
                    <p className="text-[11px] font-bold text-amber-500 mt-0.5">{credCriticalCount} critical</p>
                  )}
                  {credExpiredCount === 0 && credCriticalCount === 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">All compliant ✓</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-emerald-600">{staff.certifications.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">certifications</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">All on file ✓</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Notes banner ───────────────────────────────────────────────── */}
        {profile.notes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3"
          >
            <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{profile.notes}</p>
          </motion.div>
        )}

        {/* ── Two-column body ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* LEFT: Availability Calendar + Recent Shifts */}
          <div className="space-y-5">

            {/* Availability Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={15} className="text-violet-500" />
                    Availability — Feb 23 to Mar 22
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">4-week window · Today highlighted in violet ring</p>
                </div>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="text-[10px] font-bold text-slate-400 text-center">{d}</div>
                ))}
              </div>

              {/* Calendar rows */}
              <div className="space-y-2">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.days.map(({ status, dateLabel, idx }) => (
                      <CalCell
                        key={idx}
                        status={status}
                        dateLabel={dateLabel}
                        isToday={idx === TODAY_IDX}
                        isFuture={idx > TODAY_IDX}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
                {[
                  { status: 'D' as DayStatus, label: 'Day shift' },
                  { status: 'E' as DayStatus, label: 'Evening' },
                  { status: 'N' as DayStatus, label: 'Night' },
                  { status: '.' as DayStatus, label: 'Day off' },
                  { status: 'A' as DayStatus, label: 'Available' },
                  { status: 'X' as DayStatus, label: 'Called out' },
                ].map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${DAY_STYLE[status].bg}`}>
                      {DAY_STYLE[status].label}
                    </div>
                    <span className="text-[10px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Shift History */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-violet-500" />
                Recent Shift History
              </h3>

              {profile.recentShifts.length > 0 ? (
                <div className="space-y-1">
                  {profile.recentShifts.map((shift, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                        shift.shiftType === 'D' ? 'bg-violet-500' :
                        shift.shiftType === 'E' ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}>
                        {shift.shiftType}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{shift.date}</p>
                          <span className="text-xs text-slate-500">·</span>
                          <p className="text-sm text-slate-600">{shift.unit}</p>
                          <span className="text-xs text-slate-400">{shift.hours}h</span>
                        </div>
                      </div>
                      <div>
                        {shift.outcome === 'completed' && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                        {shift.outcome === 'in-progress' && (
                          <span className="flex items-center gap-1 text-[11px] text-violet-600 font-semibold">
                            <RefreshCw size={11} className="animate-spin" /> In Progress
                          </span>
                        )}
                        {shift.outcome === 'called-out' && (
                          <span className="flex items-center gap-1 text-[11px] text-red-500 font-semibold">
                            <XCircle size={12} /> Called Out
                          </span>
                        )}
                        {shift.outcome === 'swap-given' && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                            <RefreshCw size={11} /> Swap Given
                          </span>
                        )}
                        {shift.outcome === 'swap-received' && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                            <RefreshCw size={11} /> Swap Received
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Clock size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No recent shift history</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: OT Cost Calculator + Credentials */}
          <div className="space-y-5">

            {/* OT Cost Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <DollarSign size={16} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">OT Cost Calculator</h3>
                  <p className="text-[11px] text-slate-400">Preview labor cost before assigning a shift</p>
                </div>
              </div>

              {/* Large gauge + stats */}
              <div className="flex items-center gap-5 mb-5">
                <OTRingGauge worked={periodWorked} threshold={periodThreshold} size={96} />
                <div className="flex-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Hours worked this period</span>
                      <span className="font-bold text-slate-800">{periodWorked}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">OT threshold</span>
                      <span className="font-bold text-slate-800">{periodThreshold}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Regular hours left</span>
                      <span className={`font-bold ${regularRemaining <= 8 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {regularRemaining}h
                      </span>
                    </div>
                    <div className="h-px bg-slate-100 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Period cost so far</span>
                      <span className="font-bold text-slate-800">
                        ${(periodWorked * rate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add hours slider */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">If you add a shift</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddHours(h => Math.max(4, h - 4))}
                      className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
                    >−</button>
                    <span className="text-sm font-black text-slate-900 w-8 text-center">{addHours}h</span>
                    <button
                      onClick={() => setAddHours(h => Math.min(16, h + 4))}
                      className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
                    >+</button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={addHours}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {overtimeHours > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{regularHours}h regular @ ${rate}/hr</span>
                          <span className="font-semibold text-slate-800">${(regularHours * rate).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700 font-semibold">{overtimeHours}h OT @ ${(rate * ot).toFixed(0)}/hr (1.5×)</span>
                          <span className="font-bold text-amber-700">${(overtimeHours * rate * ot).toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1" />
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-slate-800">Additional cost</span>
                          <span className="text-sm font-black text-amber-600">+${additionalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">New period total</span>
                          <span className="text-sm font-bold text-slate-700">${newTotalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{addHours}h regular @ ${rate}/hr</span>
                          <span className="font-semibold text-emerald-600">+${additionalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>No OT triggered</span>
                          <span className="font-semibold text-emerald-600">✓ Regular pay</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1" />
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-slate-800">New period total</span>
                          <span className="text-sm font-black text-slate-700">${newTotalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{regularRemaining - addHours}h regular hours remaining after</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CTA */}
              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                <PlusCircle size={15} />
                Assign to Open Gap
                <ChevronRight size={14} />
              </Link>
            </motion.div>

            {/* Credential Passport */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-violet-500" />
                  Credential Passport
                </h3>
                <Link
                  to="/credentials"
                  className="text-[11px] text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight size={11} />
                </Link>
              </div>

              {staffCreds.length > 0 ? (
                <div className="space-y-2">
                  {staffCreds.map(cred => (
                    <motion.div
                      key={cred.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border ${
                        cred.status === 'expired'
                          ? 'border-red-200 bg-red-50'
                          : cred.status === 'critical'
                          ? 'border-amber-200 bg-amber-50'
                          : cred.status === 'expiring'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        cred.status === 'expired' ? 'bg-red-100' :
                        cred.status === 'critical' ? 'bg-amber-100' :
                        cred.status === 'expiring' ? 'bg-yellow-100' : 'bg-emerald-100'
                      }`}>
                        {cred.status === 'expired' || cred.status === 'critical' ? (
                          <AlertTriangle size={12} className={cred.status === 'expired' ? 'text-red-500' : 'text-amber-500'} />
                        ) : (
                          <CheckCircle2 size={12} className={cred.status === 'expiring' ? 'text-yellow-600' : 'text-emerald-500'} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800">{cred.cert}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            cred.status === 'expired' ? 'bg-red-200 text-red-700' :
                            cred.status === 'critical' ? 'bg-amber-200 text-amber-700' :
                            cred.status === 'expiring' ? 'bg-yellow-200 text-yellow-700' :
                            'bg-emerald-200 text-emerald-700'
                          }`}>
                            {cred.status === 'expired' ? 'Expired' :
                             cred.status === 'critical' ? 'Critical' :
                             cred.status === 'expiring' ? 'Expiring' : 'Current'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {CERT_FULL_NAMES[cred.cert] ?? cred.cert}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {cred.status === 'expired'
                            ? `Expired ${cred.expiryDate}`
                            : `Expires ${cred.expiryDate} · ${cred.daysUntilExpiry}d remaining`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Fallback: show certifications from allStaff
                <div className="space-y-2">
                  {staff.certifications.map(cert => (
                    <div key={cert} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{cert}</p>
                        <p className="text-[11px] text-slate-500">{CERT_FULL_NAMES[cert] ?? cert}</p>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">On File</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Detailed expiry data available in{' '}
                    <Link to="/credentials" className="text-violet-600 hover:underline">Credentials Hub</Link>
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-violet-900 rounded-2xl p-5"
            >
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp size={13} />
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'YTD OT Hours', value: `${profile.ytdOtHours}h`, color: profile.ytdOtHours > 40 ? 'text-amber-300' : 'text-emerald-300' },
                  { label: 'YTD OT Cost', value: `$${profile.ytdOtCost.toLocaleString()}`, color: profile.ytdOtCost > 2000 ? 'text-amber-300' : 'text-emerald-300' },
                  { label: 'Callout Rate', value: `${profile.calloutRatePct.toFixed(1)}%`, color: profile.calloutRatePct > 8 ? 'text-red-300' : profile.calloutRatePct > 5 ? 'text-amber-300' : 'text-emerald-300' },
                  { label: 'Avg Response', value: `${profile.avgResponseMin}m`, color: profile.avgResponseMin <= 15 ? 'text-emerald-300' : 'text-amber-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-violet-800/50 rounded-xl px-3 py-2.5">
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                    <p className="text-[11px] text-violet-400">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

