import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Store,
  ShieldAlert,
} from 'lucide-react'
import type { ActionStatus } from '../types'
import { units, gaps as initialGaps } from '../data/mockData'
import { pendingApprovals } from '../data/marketplaceData'
import { getExpired, getExpiringWithin } from '../data/credentialsData'
import { useClock, formatTime, formatDate, shiftTimeRemaining } from '../hooks/useClock'
import UnitCard from '../components/UnitCard'
import GapFillPanel from '../components/GapFillPanel'

const SHIFT_END = '15:00'

function SkeletonCard() {
  return <div className="rounded-xl bg-slate-200 animate-pulse h-48" />
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Persist loaded state across navigations so skeleton only fires on first visit
let _dashboardLoaded = false

export default function Dashboard() {
  const now = useClock()
  const [loading, setLoading] = useState(!_dashboardLoaded)
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>({})
  const [gaps, setGaps] = useState(initialGaps)

  useEffect(() => {
    if (!_dashboardLoaded) {
      const t = setTimeout(() => {
        setLoading(false)
        _dashboardLoaded = true
      }, 700)
      return () => clearTimeout(t)
    }
  }, [])

  const handleRequest = (gapId: string, staffId: string) => {
    setActionStatuses(prev => ({ ...prev, [`${gapId}-${staffId}`]: 'requested' }))
  }

  const handleFillGap = (_unitId: string) => {
    // Scroll to the gap fill panel — for now just highlight it
    const el = document.getElementById('gap-fill-panel')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRefresh = () => {
    _dashboardLoaded = false
    setLoading(true)
    setGaps(initialGaps)
    setActionStatuses({})
    setTimeout(() => {
      setLoading(false)
      _dashboardLoaded = true
    }, 800)
  }

  const criticalCount = units.filter(u => u.status === 'critical').length
  const warningCount = units.filter(u => u.status === 'warning').length
  const totalOnDuty = units.reduce((s, u) => s + u.staffed, 0)
  const totalRequired = units.reduce((s, u) => s + u.required, 0)
  const totalGaps = units.reduce((s, u) => s + u.openGaps, 0)
  const timeLeft = shiftTimeRemaining(now, SHIFT_END)
  const expiredCreds = getExpired()
  const urgentCredCount = expiredCreds.length + getExpiringWithin(30).length

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Shift Command Center</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">{formatDate(now)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-sm font-semibold text-violet-600">Day Shift 07:00 – 15:00</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={13} />
                {timeLeft} remaining
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">{formatTime(now)}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Live</p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalCount > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 flex items-center gap-3"
        >
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </div>
          <AlertTriangle size={16} className="text-red-100 shrink-0" />
          <p className="text-white font-bold text-sm">
            {criticalCount} Critical Gap{criticalCount > 1 ? 's' : ''} — Patient Safety at Risk
          </p>
          <span className="text-red-200 text-sm">
            {units.filter(u => u.status === 'critical').map(u => u.shortName).join(', ')} {criticalCount > 1 ? 'are' : 'is'} understaffed
          </span>
          <div className="ml-auto">
            <button
              onClick={() => document.getElementById('gap-fill-panel')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Fill Now <ArrowUpRight size={12} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Marketplace pending approvals nudge */}
      {pendingApprovals.length > 0 && !loading && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-3">
          <Store size={14} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            <span className="font-bold">{pendingApprovals.length} shift swap{pendingApprovals.length !== 1 ? 's' : ''}</span> in the Marketplace need your approval
          </p>
          <Link
            to="/marketplace"
            className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review <ArrowUpRight size={11} />
          </Link>
        </div>
      )}

      {/* Credentials urgent nudge */}
      {urgentCredCount > 0 && !loading && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-3">
          <ShieldAlert size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            {expiredCreds.length > 0 && (
              <span className="font-bold">{expiredCreds.length} expired credential{expiredCreds.length !== 1 ? 's' : ''}</span>
            )}
            {expiredCreds.length > 0 && urgentCredCount > expiredCreds.length && ' · '}
            {urgentCredCount > expiredCreds.length && (
              <span className="font-bold">{urgentCredCount - expiredCreds.length} expiring within 30 days</span>
            )}
            {' '}— JCAHO compliance at risk
          </p>
          <Link
            to="/credentials"
            className="ml-auto flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review <ArrowUpRight size={11} />
          </Link>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Stats row */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={item}>
              <StatCard
                label="Units Active"
                value={units.length}
                sub="All floors monitored"
                color="bg-violet-500"
                icon={TrendingUp}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Staff On Duty"
                value={`${totalOnDuty}/${totalRequired}`}
                sub={`${totalRequired - totalOnDuty} gap${totalRequired - totalOnDuty !== 1 ? 's' : ''} to fill`}
                color={totalOnDuty < totalRequired ? 'bg-red-500' : 'bg-emerald-500'}
                icon={Users}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Open Gaps"
                value={totalGaps}
                sub={`${criticalCount} critical · ${warningCount} warning`}
                color={criticalCount > 0 ? 'bg-red-500' : warningCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}
                icon={AlertTriangle}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Shift Ends"
                value={timeLeft}
                sub="Until evening handoff"
                color="bg-blue-500"
                icon={Clock}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Main grid: units + gap panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Unit grid */}
          <div className="xl:col-span-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Unit Status</h2>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Short</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Staffed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Surplus</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
                variants={container}
                initial="hidden"
                animate="visible"
              >
                {units.map(unit => (
                  <motion.div key={unit.id} variants={item}>
                    <UnitCard unit={unit} onFillGap={handleFillGap} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Gap fill panel */}
          <div className="xl:col-span-5" id="gap-fill-panel" style={{ minHeight: 400 }}>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Smart Fill</h2>
            {loading ? (
              <div className="rounded-2xl bg-slate-200 animate-pulse" style={{ height: 400 }} />
            ) : (
              <GapFillPanel
                gaps={gaps}
                actionStatuses={actionStatuses}
                onRequest={handleRequest}
              />
            )}
          </div>
        </div>

        {/* Pattern insights strip */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-violet-900 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-violet-300" />
              <h3 className="text-sm font-bold text-violet-100">AI Pattern Alerts</h3>
              <span className="ml-auto text-[11px] text-violet-400 bg-violet-800 px-2 py-0.5 rounded-full">Based on 90-day history</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { text: 'ICU has been short on Monday day shifts 4 of the last 6 weeks — consider a standing float RN', severity: 'warn' },
                { text: 'Med-Surg B weekend callout rate is up 23% vs. 30-day average', severity: 'crit' },
                { text: 'ED evening gaps are predictable Thu–Sun — a dedicated float RN would eliminate them', severity: 'info' },
                { text: `Credentials: ${urgentCredCount} staff need urgent renewals — ${expiredCreds.length} already expired`, severity: 'crit', link: '/credentials' },
              ].map((a, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${
                  a.severity === 'crit' ? 'bg-red-900/40' : a.severity === 'warn' ? 'bg-amber-900/40' : 'bg-violet-800/50'
                }`}>
                  <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${
                    a.severity === 'crit' ? 'text-red-400' : a.severity === 'warn' ? 'text-amber-400' : 'text-violet-400'
                  }`} />
                  {'link' in a && a.link ? (
                    <Link to={a.link} className="text-xs text-violet-200 leading-relaxed hover:text-white transition-colors flex-1">{a.text} →</Link>
                  ) : (
                    <p className="text-xs text-violet-200 leading-relaxed">{a.text}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
