import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Search,
  TrendingDown,
  Info,
  Calendar,
  Filter,
} from 'lucide-react'
import type { CredentialRecord } from '../data/credentialsData'
import {
  allCredentials,
  unitCompliance,
  impactAlerts,
  overallScore,
  getByStaff,
  worstStatus,
} from '../data/credentialsData'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  expired:  { label: 'EXPIRED',  color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300',    ring: '#ef4444', dot: 'bg-red-500',   icon: ShieldX    },
  critical: { label: 'CRITICAL', color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    ring: '#f97316', dot: 'bg-orange-500',icon: ShieldAlert },
  expiring: { label: 'EXPIRING', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  ring: '#f59e0b', dot: 'bg-amber-500', icon: Clock      },
  current:  { label: 'CURRENT',  color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',ring: '#10b981', dot: 'bg-emerald-500',icon: ShieldCheck},
}

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, 2026`
}

function daysLabel(d: number): string {
  if (d < 0) return `Expired ${Math.abs(d)}d ago`
  if (d === 0) return 'Expires today'
  return `${d}d`
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.38
  const cx = size / 2
  const circum = 2 * Math.PI * r
  const offset = circum - (score / 100) * circum
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444'
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Fair' : 'At Risk'

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.07} />
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeDasharray={circum}
          initial={{ strokeDashoffset: circum }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' as const, delay: 0.3 }}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
        <text x={cx} y={cx - 6} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.22, fontWeight: 900, fill: '#0f172a' }}>
          {score}
        </text>
        <text x={cx} y={cx + size * 0.13} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.09, fill: '#94a3b8' }}>
          /100
        </text>
      </svg>
      <span style={{ color }} className="text-xs font-bold mt-1">{label}</span>
    </div>
  )
}

// ─── Unit compliance card ─────────────────────────────────────────────────────

function UnitCard({ unit }: { unit: typeof unitCompliance[number] }) {
  const issues = unit.expiredCount + unit.criticalCount + unit.expiringCount
  const borderColor =
    unit.expiredCount + unit.criticalCount > 0 ? 'border-red-300' :
    unit.expiringCount > 0 ? 'border-amber-300' :
    'border-emerald-200'
  const pctColor =
    unit.score >= 90 ? 'text-emerald-600' :
    unit.score >= 75 ? 'text-amber-600' :
    'text-red-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border-2 ${borderColor} p-4`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-slate-900 text-sm">{unit.unitName}</p>
          <p className="text-[11px] text-slate-400">{unit.floor}</p>
        </div>
        <ScoreRing score={unit.score} size={52} />
      </div>
      <p className={`text-xl font-black ${pctColor}`}>{unit.score}%</p>
      <p className="text-[11px] text-slate-400 mb-2">{unit.totalTracked} credentials tracked</p>
      {issues > 0 ? (
        <div className="space-y-0.5">
          {unit.expiredCount > 0 && (
            <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {unit.expiredCount} expired
            </p>
          )}
          {unit.criticalCount > 0 && (
            <p className="text-[10px] text-orange-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse" />
              {unit.criticalCount} critical (&lt;30d)
            </p>
          )}
          {unit.expiringCount > 0 && (
            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              {unit.expiringCount} expiring (&lt;90d)
            </p>
          )}
          {unit.topRisk && (
            <p className="text-[10px] text-slate-500 italic leading-tight mt-1">{unit.topRisk}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
          <CheckCircle2 size={11} /> All credentials current
        </div>
      )}
    </motion.div>
  )
}

// ─── Impact analysis card ─────────────────────────────────────────────────────

function ImpactCard({
  alert,
  onSendReminder,
  reminderSent,
}: {
  alert: typeof impactAlerts[number]
  onSendReminder: (id: string) => void
  reminderSent: boolean
}) {
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 900))
    setSending(false)
    onSendReminder(alert.id)
  }

  const cfg = alert.severity === 'critical'
    ? { bg: 'bg-red-50', border: 'border-red-300', title: 'text-red-800', body: 'text-red-700', icon: ShieldX, iconColor: 'text-red-500', badge: 'bg-red-200 text-red-800' }
    : alert.severity === 'warning'
    ? { bg: 'bg-amber-50', border: 'border-amber-300', title: 'text-amber-800', body: 'text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-500', badge: 'bg-amber-200 text-amber-800' }
    : { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', body: 'text-blue-700', icon: Info, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' }

  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-3`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cfg.badge}`}>
              {alert.unit} · {alert.severity}
            </span>
            {alert.daysToAct === 0 && (
              <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                ACT NOW
              </span>
            )}
          </div>
          <p className={`text-sm font-bold ${cfg.title} mt-1.5`}>{alert.title}</p>
        </div>
      </div>

      <p className={`text-xs ${cfg.body} leading-relaxed`}>{alert.description}</p>

      <div className="bg-white/70 rounded-xl px-3 py-2.5 border border-white">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Recommended Action</p>
        <p className="text-xs text-slate-700">{alert.action}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {reminderSent ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
            <CheckCircle2 size={13} />
            Reminder sent to {alert.staffName}
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <Send size={12} />
                Send Renewal Reminder to {alert.staffName.split(' ')[0]}
              </>
            )}
          </button>
        )}
        {alert.daysToAct > 0 && (
          <span className="text-[11px] text-slate-500 font-medium">{alert.daysToAct}d to act</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Timeline row ─────────────────────────────────────────────────────────────

function TimelineRow({
  record,
  onReminder,
  reminderSent,
}: {
  record: CredentialRecord
  onReminder: (id: string) => void
  reminderSent: boolean
}) {
  const cfg = STATUS_CONFIG[record.status]
  const StatusIcon = cfg.icon
  const [sending, setSending] = useState(false)

  const handleRemind = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    onReminder(record.id)
  }

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg} transition-all`}>
      {/* Status icon */}
      <div className="shrink-0">
        <StatusIcon size={16} className={cfg.color} />
      </div>

      {/* Staff */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {record.staffInitials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{record.staffName}</span>
          <span className="text-[10px] text-slate-400">{record.staffRole} · {record.primaryUnit}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-bold ${cfg.color}`}>{record.cert}</span>
          <span className="text-[11px] text-slate-400">{record.certFullName}</span>
        </div>
      </div>

      {/* Date + days */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${cfg.color}`}>{daysLabel(record.daysUntilExpiry)}</p>
        <p className="text-[11px] text-slate-400">{record.daysUntilExpiry >= 0 ? fmtDate(record.expiryDate) : fmtDate(record.expiryDate)}</p>
      </div>

      {/* Action */}
      <div className="shrink-0 w-28">
        {record.status === 'current' ? (
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
            <CheckCircle2 size={11} /> Current
          </span>
        ) : reminderSent ? (
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
            <CheckCircle2 size={11} /> Reminded
          </span>
        ) : (
          <button
            onClick={handleRemind}
            disabled={sending}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
          >
            {sending ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <><Send size={10} /> Remind</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Staff credential accordion row ──────────────────────────────────────────

function StaffCredRow({ staffId, records }: { staffId: string; records: CredentialRecord[] }) {
  const [expanded, setExpanded] = useState(false)
  const [reminders, setReminders] = useState<Set<string>>(new Set())
  const worst = worstStatus(records)
  const cfg = STATUS_CONFIG[worst]
  const StatusIcon = cfg.icon
  const first = records[0]

  const handleReminder = (id: string) => setReminders(p => new Set([...p, id]))

  const urgentCount = records.filter(r => r.status === 'expired' || r.status === 'critical').length

  return (
    <div className={`border-2 rounded-xl overflow-hidden ${
      worst === 'expired' ? 'border-red-300' :
      worst === 'critical' ? 'border-orange-300' :
      worst === 'expiring' ? 'border-amber-200' :
      'border-slate-200'
    }`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
          worst === 'expired' ? 'bg-gradient-to-br from-red-500 to-red-700' :
          worst === 'critical' ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
          worst === 'expiring' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
          'bg-gradient-to-br from-slate-500 to-slate-700'
        }`}>
          {first.staffInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 truncate">{first.staffName}</p>
            {urgentCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                {urgentCount} urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">{first.staffRole} · {first.primaryUnit} · {records.length} credentials</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusIcon size={15} className={cfg.color} />
          <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={`${staffId}-expand`}
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {records.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-4 py-2.5 bg-white">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[r.status].dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{r.cert}</span>
                      <span className="text-[11px] text-slate-400">{r.certFullName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold ${STATUS_CONFIG[r.status].color}`}>{daysLabel(r.daysUntilExpiry)}</p>
                    <p className="text-[10px] text-slate-400">{fmtDate(r.expiryDate)}</p>
                  </div>
                  <div className="w-20 shrink-0 flex justify-end">
                    {r.status !== 'current' && !reminders.has(r.id) ? (
                      <button
                        onClick={() => handleReminder(r.id)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-800 hover:underline"
                      >
                        Remind →
                      </button>
                    ) : r.status !== 'current' ? (
                      <span className="text-[10px] text-emerald-600 font-bold">Sent ✓</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'expired' | 'critical' | 'expiring' | 'current'

export default function Credentials() {
  const [loading, setLoading] = useState(true)
  const [remindersSent, setRemindersSent] = useState<Set<string>>(new Set())
  const [staffFilter, setStaffFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const handleReminder = (id: string) => setRemindersSent(p => new Set([...p, id]))

  const expired = allCredentials.filter(r => r.status === 'expired')
  const critical = allCredentials.filter(r => r.status === 'critical')
  const expiring = allCredentials.filter(r => r.status === 'expiring')
  const urgent = [...expired, ...critical].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  const upcoming = [...expiring].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  const staffMap = getByStaff()
  const staffEntries = [...staffMap.entries()]
    .filter(([, records]) => {
      const w = worstStatus(records)
      return staffFilter === 'all' || w === staffFilter
    })
    .filter(([, records]) => {
      if (!search) return true
      return records[0].staffName.toLowerCase().includes(search.toLowerCase()) ||
             records[0].primaryUnit.toLowerCase().includes(search.toLowerCase())
    })
    .sort(([, a], [, b]) => {
      const order = ['expired', 'critical', 'expiring', 'current'] as const
      return order.indexOf(worstStatus(a)) - order.indexOf(worstStatus(b))
    })

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-violet-500" />
              Credentialing Hub
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">License & certification compliance · Mercy General Hospital</p>
          </div>
          {!loading && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Overall Compliance</p>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-xs font-bold">{expired.length} expired</span>
                      <span className="text-orange-500 text-xs font-bold">{critical.length} critical</span>
                      <span className="text-amber-500 text-xs font-bold">{expiring.length} expiring</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{allCredentials.length} credentials tracked</p>
                  </div>
                  <ScoreRing score={overallScore} size={80} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical alert banners */}
      {!loading && expired.length > 0 && (
        <div className="bg-red-600 px-6 py-3 flex items-center gap-3">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inset-0 rounded-full bg-red-200 opacity-75" />
            <span className="relative rounded-full h-3 w-3 bg-white" />
          </div>
          <ShieldX size={15} className="text-red-100 shrink-0" />
          <p className="text-white font-bold text-sm">
            {expired.length} credential{expired.length !== 1 ? 's' : ''} EXPIRED:{' '}
            {expired.map(r => `${r.staffName} (${r.cert})`).join(' · ')}
          </p>
          <span className="ml-auto text-red-200 text-xs">JCAHO compliance risk — immediate action required</span>
        </div>
      )}

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats row */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              variants={container}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: 'Total Tracked', value: allCredentials.length, sub: `${staffMap.size} staff members`, color: 'bg-violet-500', icon: ShieldCheck },
                { label: 'Expired Now', value: expired.length, sub: 'Immediate action required', color: 'bg-red-500', icon: ShieldX },
                { label: 'Expiring < 30 Days', value: critical.length, sub: 'Critical — act this week', color: 'bg-orange-500', icon: ShieldAlert },
                { label: 'Expiring < 90 Days', value: expiring.length, sub: 'Plan renewals soon', color: 'bg-amber-500', icon: Clock },
              ].map(s => (
                <motion.div key={s.label} variants={item}>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm">
                    <div className={`p-2 rounded-lg ${s.color}`}>
                      <s.icon size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-600 font-medium">{s.label}</p>
                      <p className="text-[11px] text-slate-400">{s.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Unit compliance grid */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingDown size={14} className="text-slate-400" />
                Unit Compliance Scores
              </h2>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3"
                variants={container}
                initial="hidden"
                animate="visible"
              >
                {unitCompliance.map(u => (
                  <motion.div key={u.unitId} variants={item}>
                    <UnitCard unit={u} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Impact analysis */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Impact Analysis
                <span className="text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold normal-case">AI-generated</span>
              </h2>
              <p className="text-xs text-slate-400 mb-3">What happens to patient care if these credentials aren't renewed</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {impactAlerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                  >
                    <ImpactCard
                      alert={alert}
                      onSendReminder={handleReminder}
                      reminderSent={remindersSent.has(alert.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Expiration timeline */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                Expiration Timeline
              </h2>

              {urgent.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    Expired &amp; Critical — Act Immediately
                  </p>
                  <div className="space-y-2">
                    {urgent.map(r => (
                      <TimelineRow
                        key={r.id}
                        record={r}
                        onReminder={handleReminder}
                        reminderSent={remindersSent.has(r.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Expiring Within 90 Days — Plan Renewals
                  </p>
                  <div className="space-y-2">
                    {upcoming.map(r => (
                      <TimelineRow
                        key={r.id}
                        record={r}
                        onReminder={handleReminder}
                        reminderSent={remindersSent.has(r.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staff credential table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-400" />
                  All Staff Credentials
                  <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold normal-case">{staffEntries.length} of {staffMap.size}</span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or unit…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
                  {(['all', 'expired', 'critical', 'expiring', 'current'] as FilterStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStaffFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                        staffFilter === s
                          ? s === 'expired' ? 'bg-red-500 text-white'
                          : s === 'critical' ? 'bg-orange-500 text-white'
                          : s === 'expiring' ? 'bg-amber-500 text-white'
                          : s === 'current' ? 'bg-emerald-500 text-white'
                          : 'bg-violet-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'all' ? `All (${staffMap.size})` : s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Filter size={12} />
                  Sorted by urgency
                </div>
              </div>

              {staffEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldCheck size={28} className="mx-auto mb-2 opacity-40" />
                  <p>No staff match your filters</p>
                  <button onClick={() => { setStaffFilter('all'); setSearch('') }} className="mt-2 text-sm text-violet-600 hover:underline">Clear filters</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {staffEntries.map(([staffId, records]) => (
                    <StaffCredRow key={staffId} staffId={staffId} records={records} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
