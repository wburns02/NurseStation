import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Calendar,
  LogIn,
  LogOut,
  Activity,
  Shield,
} from 'lucide-react'
import {
  UPCOMING_SHIFTS,
  PAY_PERIOD,
  HOSPITAL_GEOFENCE,
  isClockedIn,
  getCurrentSessionStart,
  getPunchHistory,
  clockIn,
  clockOut,
  type PunchRecord,
  type LocationStatus,
} from '../data/timeClockData'

// ── Live Digital Clock ────────────────────────────────────────────────────────

function DigitalClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = time.getHours()
  const m = String(time.getMinutes()).padStart(2, '0')
  const s = String(time.getSeconds()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div id="current-time" className="text-center py-6">
      <div className="flex items-baseline justify-center gap-1 font-mono">
        <span className="text-6xl font-black text-white tabular-nums tracking-tight">
          {String(h12).padStart(2, '0')}:{m}
        </span>
        <span className="text-3xl font-bold text-slate-400 tabular-nums">:{s}</span>
        <span className="text-xl font-bold text-slate-500 ml-1">{ampm}</span>
      </div>
      <p className="text-slate-400 text-sm mt-1">{dateStr}</p>
    </div>
  )
}

// ── Session Timer ─────────────────────────────────────────────────────────────

function SessionTimer({ startTimeLabel, clockedInAt }: { startTimeLabel: string; clockedInAt: Date }) {
  const [elapsed, setElapsed] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    function tick() {
      const now = new Date()
      const diffMs = now.getTime() - clockedInAt.getTime()
      const totalSec = Math.floor(diffMs / 1000)
      setElapsed({
        h: Math.floor(totalSec / 3600),
        m: Math.floor((totalSec % 3600) / 60),
        s: totalSec % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockedInAt])

  return (
    <div id="session-timer" className="text-center">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">On-clock since {startTimeLabel}</p>
      <div className="flex items-center justify-center gap-1 font-mono">
        <span className="text-2xl font-bold text-emerald-400 tabular-nums">
          {String(elapsed.h).padStart(2, '0')}h {String(elapsed.m).padStart(2, '0')}m
        </span>
        <span className="text-lg text-emerald-600 tabular-nums">{String(elapsed.s).padStart(2, '0')}s</span>
      </div>
    </div>
  )
}

// ── Location Status ───────────────────────────────────────────────────────────

function LocationBadge({ status }: { status: LocationStatus }) {
  const map: Record<LocationStatus, { label: string; sub: string; cls: string; Icon: React.FC<{ size?: number; className?: string }> }> = {
    'on-premises': {
      label: 'On Premises',
      sub: `${HOSPITAL_GEOFENCE.name} · GPS verified`,
      cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      Icon: ({ size, className }) => <MapPin size={size} className={className} />,
    },
    'near': {
      label: 'Near Hospital',
      sub: 'Within 500m of facility',
      cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      Icon: ({ size, className }) => <MapPin size={size} className={className} />,
    },
    'outside': {
      label: 'Outside Geofence',
      sub: 'Not detected on hospital grounds',
      cls: 'bg-red-500/10 border-red-500/30 text-red-400',
      Icon: ({ size, className }) => <WifiOff size={size} className={className} />,
    },
    'checking': {
      label: 'Locating…',
      sub: 'Checking GPS position',
      cls: 'bg-slate-700 border-slate-600 text-slate-300',
      Icon: ({ size, className }) => <Wifi size={size} className={className} />,
    },
    'unknown': {
      label: 'Location Unknown',
      sub: 'Enable location services',
      cls: 'bg-slate-700 border-slate-600 text-slate-400',
      Icon: ({ size, className }) => <AlertCircle size={size} className={className} />,
    },
  }
  const { label, sub, cls, Icon } = map[status]

  return (
    <motion.div
      id="location-status"
      layout
      className={`flex items-center gap-3 border rounded-2xl px-4 py-3 ${cls}`}
    >
      <div className="relative shrink-0">
        {status === 'on-premises' && (
          <motion.span
            className="absolute inset-0 rounded-full bg-emerald-500 opacity-30"
            animate={{ scale: [1, 1.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {status === 'checking' && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}>
            <Icon size={18} className="relative z-10" />
          </motion.div>
        )}
        {status !== 'checking' && <Icon size={18} className="relative z-10" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{label}</p>
        <p className="text-xs opacity-70 truncate">{sub}</p>
      </div>
      <Shield size={14} className="opacity-40 shrink-0" />
    </motion.div>
  )
}

// ── Clock Button ──────────────────────────────────────────────────────────────

function ClockButton({
  clockedIn,
  locStatus,
  onClockIn,
  onClockOut,
}: {
  clockedIn: boolean
  locStatus: LocationStatus
  onClockIn: () => void
  onClockOut: () => void
}) {
  const [justPunched, setJustPunched] = useState<'in' | 'out' | null>(null)
  const disabled = locStatus === 'checking'

  function handleClick() {
    if (clockedIn) {
      onClockOut()
      setJustPunched('out')
    } else {
      onClockIn()
      setJustPunched('in')
    }
    setTimeout(() => setJustPunched(null), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        {justPunched ? (
          <motion.div
            key="success"
            id="punch-success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-2 text-emerald-400 font-bold text-sm"
          >
            <CheckCircle2 size={20} />
            {justPunched === 'in' ? 'Clocked In!' : 'Clocked Out!'}
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            onClick={handleClick}
            disabled={disabled}
            aria-label={clockedIn ? 'Clock out' : 'Clock in'}
            whileTap={{ scale: 0.96 }}
            className={`
              relative w-48 h-48 rounded-full font-black text-xl shadow-2xl
              transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
              flex flex-col items-center justify-center gap-2
              ${clockedIn
                ? 'bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-red-900/40 hover:from-red-400 hover:to-rose-600'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-500'
              }
            `}
          >
            {clockedIn ? (
              <>
                <LogOut size={32} />
                <span>CLOCK OUT</span>
              </>
            ) : (
              <>
                <LogIn size={32} />
                <span>CLOCK IN</span>
              </>
            )}
            {/* Ripple ring for clocked-in state */}
            {clockedIn && (
              <motion.span
                className="absolute inset-0 rounded-full border-4 border-red-400"
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Pay Period Bar ────────────────────────────────────────────────────────────

function PayPeriodCard({ clockedIn, elapsedHours }: { clockedIn: boolean; elapsedHours: number }) {
  const total = PAY_PERIOD.regularHours + PAY_PERIOD.overtimeHours + elapsedHours
  const regularPct = Math.min((PAY_PERIOD.regularHours / PAY_PERIOD.targetHours) * 100, 100)
  const overLimit = total > PAY_PERIOD.targetHours

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-violet-400" />
          <p className="text-white font-semibold text-sm">Pay Period</p>
        </div>
        <span className="text-slate-500 text-xs">{PAY_PERIOD.label}</span>
      </div>

      {/* Regular hours bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Regular Hours</span>
          <span className="text-white font-bold" id="pay-period-regular">{PAY_PERIOD.regularHours.toFixed(1)}h</span>
        </div>
        <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${regularPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.2 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>0h</span>
          <span>40h</span>
          <span>80h target</span>
        </div>
      </div>

      {/* OT hours */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${overLimit ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
            OT
          </span>
          <span className="text-slate-400 text-xs">Overtime Hours</span>
        </div>
        <span className="font-bold text-sm text-amber-400" id="pay-period-ot">
          {(PAY_PERIOD.overtimeHours + (clockedIn ? elapsedHours : 0)).toFixed(1)}h
        </span>
      </div>

      {/* Projected */}
      <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
        <span className="text-slate-500 text-xs">Projected total this period</span>
        <span className="text-white font-semibold text-sm">{PAY_PERIOD.projectedHours.toFixed(1)}h</span>
      </div>
    </div>
  )
}

// ── Upcoming Shifts ───────────────────────────────────────────────────────────

function UpcomingShiftsCard() {
  const typeColor: Record<string, string> = {
    day: 'bg-sky-500/15 text-sky-300',
    evening: 'bg-violet-500/15 text-violet-300',
    night: 'bg-indigo-500/15 text-indigo-300',
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-violet-400" />
        <p className="text-white font-semibold text-sm">My Next Shifts</p>
      </div>
      {UPCOMING_SHIFTS.map((shift, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0 ${shift.status === 'in-progress' ? 'opacity-100' : 'opacity-80'}`}
        >
          <div className="w-10 text-center shrink-0">
            <p className="text-slate-500 text-[10px]">{shift.dayLabel}</p>
            <p className={`font-bold text-sm ${shift.status === 'in-progress' ? 'text-violet-300' : 'text-white'}`}>
              {shift.date.split(' ')[1]}
            </p>
          </div>
          {shift.unit ? (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-xs font-semibold">{shift.unit}</p>
                  {shift.status === 'in-progress' && (
                    <span className="text-[9px] bg-violet-500/20 text-violet-300 font-bold px-1.5 py-0.5 rounded-full">IN PROGRESS</span>
                  )}
                </div>
                <p className="text-slate-500 text-[10px]">{shift.startTime} – {shift.endTime}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeColor[shift.type]}`}>
                {shift.type.toUpperCase()}
              </span>
            </>
          ) : (
            <p className="text-slate-600 text-xs italic flex-1">Day Off</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Punch History ─────────────────────────────────────────────────────────────

function PunchHistoryList({ punches }: { punches: PunchRecord[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? punches : punches.slice(0, 8)

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-violet-400" />
          <p className="text-white font-semibold text-sm">Punch History</p>
        </div>
        <span className="text-slate-500 text-xs">{punches.length} records</span>
      </div>
      <div className="divide-y divide-slate-700/50">
        <AnimatePresence initial={false}>
          {visible.map((punch) => (
            <motion.div
              key={punch.id}
              data-id={`punch-${punch.id}`}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${punch.type === 'clock-in' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                {punch.type === 'clock-in'
                  ? <LogIn size={14} className="text-emerald-400" />
                  : <LogOut size={14} className="text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${punch.type === 'clock-in' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {punch.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
                  </p>
                  <span className="text-slate-600 text-xs">·</span>
                  <p className="text-slate-400 text-xs">{punch.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 text-xs">{punch.dateLabel}</p>
                  <span className="text-slate-600 text-xs">·</span>
                  <p className="text-white text-xs font-mono font-semibold">{punch.timeLabel}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-emerald-500">
                  <MapPin size={9} />
                  <span className="text-[9px]">GPS ✓</span>
                </div>
                {punch.approvedBy && (
                  <span className="text-[9px] text-slate-600">{punch.approvedBy}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {punches.length > 8 && (
        <button
          onClick={() => setShowAll(s => !s)}
          aria-label={showAll ? 'Show fewer punches' : 'Show all punches'}
          className="w-full py-3 text-slate-500 hover:text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-slate-700/30 transition-colors border-t border-slate-700"
        >
          {showAll ? 'Show less' : `Show ${punches.length - 8} more`}
          <ChevronRight size={12} className={`transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TimeClock() {
  const [clockedIn, setClockedIn] = useState(isClockedIn)
  const [sessionStart, setSessionStart] = useState(getCurrentSessionStart)
  const [punches, setPunches] = useState(getPunchHistory)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking')
  // Simulate GPS check on load — resolves to "on-premises" after 1.5s
  const [clockedInAt, setClockedInAt] = useState<Date>(() => {
    // Seed: clocked in at 07:03 today (Mar 12, 2026)
    return new Date('2026-03-12T07:03:00')
  })

  useEffect(() => {
    const timer = setTimeout(() => setLocationStatus('on-premises'), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleClockIn = useCallback(() => {
    const punch = clockIn('ICU')
    setClockedIn(true)
    setSessionStart(punch.timeLabel)
    setClockedInAt(new Date())
    setPunches(getPunchHistory())
  }, [])

  const handleClockOut = useCallback(() => {
    clockOut()
    setClockedIn(false)
    setPunches(getPunchHistory())
  }, [])

  // Elapsed hours for OT calculation (hours since 07:03 AM)
  const elapsedMs = new Date().getTime() - clockedInAt.getTime()
  const elapsedHours = Math.max(0, elapsedMs / 3600000)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <Activity size={17} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">Time Clock</h1>
              <p className="text-slate-500 text-xs">Janet Morrison, RN · ICU · Mercy General</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${clockedIn ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${clockedIn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {clockedIn ? 'ON CLOCK' : 'OFF CLOCK'}
          </div>
        </div>

        {/* Live Clock */}
        <DigitalClock />

        {/* Location */}
        <LocationBadge status={locationStatus} />

        {/* Clock button */}
        <div className="flex flex-col items-center py-8 gap-6">
          <ClockButton
            clockedIn={clockedIn}
            locStatus={locationStatus}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />

          {/* Session timer */}
          <AnimatePresence>
            {clockedIn && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="w-full bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-5 py-4"
              >
                <SessionTimer startTimeLabel={sessionStart} clockedInAt={clockedInAt} />
                <p className="text-center text-slate-600 text-xs mt-1">Day Shift · ICU</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pay Period */}
        <div className="space-y-4">
          <PayPeriodCard clockedIn={clockedIn} elapsedHours={elapsedHours} />

          {/* Upcoming shifts */}
          <UpcomingShiftsCard />

          {/* Punch history */}
          <PunchHistoryList punches={punches} />
        </div>
      </div>
    </div>
  )
}
