import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  DollarSign,
  Info,
  Calendar,
  ArrowUpRight,
  Check,
} from 'lucide-react'
import {
  mutableRequests,
  ptoBalances,
  ptoSummary,
  PTO_TYPE_META,
  approveRequest,
  denyRequest,
  type PTORequest,
  type PTOStatus,
} from '../data/timeOffData'

// ─── Impact severity styles ───────────────────────────────────────────────────
const IMPACT_STYLE = {
  critical: { bar: 'bg-red-500',    bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Critical Impact' },
  warning:  { bar: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200',text: 'text-amber-700',  dot: 'bg-amber-500',  label: 'Review Required' },
  none:     { bar: 'bg-emerald-500',bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Safe to Approve' },
}

const COVERAGE_TYPE_LABEL = {
  float:    'Float Pool',
  ot:       'OT',
  'per-diem': 'Per Diem',
  existing: 'Internal',
}

const COVERAGE_TYPE_COLOR = {
  float:    'bg-blue-100 text-blue-700',
  ot:       'bg-red-100 text-red-700',
  'per-diem': 'bg-amber-100 text-amber-700',
  existing: 'bg-emerald-100 text-emerald-700',
}

// ─── 30-day upcoming calendar strip ──────────────────────────────────────────
function CalendarStrip({ requests }: { requests: PTORequest[] }) {
  const today = new Date('2026-03-12')
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  // Build absence map: date-string → absences
  const absenceMap: Record<string, { name: string; type: string; status: PTOStatus }[]> = {}
  for (const req of requests) {
    if (req.status === 'denied') continue
    const start = new Date(req.startDateISO)
    const year = req.startDateISO.slice(0, 4)
    const end = new Date(`${req.endDate} ${year}`)
    const cur = new Date(start)
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      if (!absenceMap[key]) absenceMap[key] = []
      absenceMap[key].push({ name: req.staffName.split(' ')[0], type: req.type, status: req.status })
      cur.setDate(cur.getDate() + 1)
    }
  }

  // Group into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((day, di) => {
              const key = day.toISOString().slice(0, 10)
              const absences = absenceMap[key] || []
              const isToday = key === '2026-03-12'
              const monthDay = day.getDate()
              const monthLabel = day.toLocaleDateString('en-US', { month: 'short' })
              const showMonth = monthDay === 1 || (wi === 0 && di === 0)
              const hasCritical = absences.some(a => {
                const req = mutableRequests.find(r => r.staffName.startsWith(a.name) && r.status === a.status)
                return req?.impact.severity === 'critical'
              })
              const hasPending = absences.some(a => a.status === 'pending')

              return (
                <div
                  key={di}
                  className={`min-h-[52px] rounded-lg p-1.5 border text-[10px] ${
                    isToday ? 'border-violet-400 bg-violet-50' : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${isToday ? 'text-violet-600' : 'text-slate-600'}`}>
                      {showMonth ? `${monthLabel} ${monthDay}` : monthDay}
                    </span>
                    {absences.length > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${hasCritical ? 'bg-red-500' : hasPending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {absences.slice(0, 2).map((a, ai) => (
                      <div
                        key={ai}
                        className={`rounded px-1 py-0.5 truncate font-medium ${
                          a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                        title={`${a.name} — ${PTO_TYPE_META[a.type as keyof typeof PTO_TYPE_META]?.label}`}
                      >
                        {a.name}
                      </div>
                    ))}
                    {absences.length > 2 && (
                      <div className="text-slate-400 pl-1">+{absences.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-100 inline-block" />Pending approval</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-100 inline-block" />Approved</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Critical impact</span>
      </div>
    </div>
  )
}

// ─── Deny dialog ──────────────────────────────────────────────────────────────
function DenyDialog({
  request,
  onConfirm,
  onCancel,
}: {
  request: PTORequest
  onConfirm: (note: string) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitted(true)
    setTimeout(() => {
      onConfirm(note || 'Request denied. Please resubmit for a more suitable period.')
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' as const }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900 mb-1">Deny Time-Off Request</h3>
        <p className="text-sm text-slate-500 mb-4">
          {request.staffName} · {request.startDate}{request.endDate !== request.startDate ? ` – ${request.endDate}` : ''} · {request.totalDays}d
        </p>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Reason for denial <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Understaffed that weekend — please resubmit for a different date."
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
          rows={3}
          aria-label="Denial reason"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            aria-label="Confirm denial"
          >
            {submitted ? 'Denying…' : 'Deny Request'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── PTO Request card ─────────────────────────────────────────────────────────
function RequestCard({
  request,
  onApprove,
  onDeny,
}: {
  request: PTORequest
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(request.impact.severity !== 'none')
  const [approving, setApproving] = useState(false)
  const [justApproved, setJustApproved] = useState(false)

  const impact = IMPACT_STYLE[request.impact.severity]
  const typeMeta = PTO_TYPE_META[request.type]
  const isPending = request.status === 'pending'
  const isApproved = request.status === 'approved'
  const isDenied = request.status === 'denied'

  function handleApprove() {
    setApproving(true)
    setTimeout(() => {
      setJustApproved(true)
      onApprove(request.id)
    }, 500)
  }

  return (
    <motion.div
      layout
      data-id={`pto-${request.id}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isDenied ? 'border-slate-200 bg-slate-50 opacity-70' :
        isApproved || justApproved ? 'border-emerald-200 bg-emerald-50' :
        request.impact.severity === 'critical' ? 'border-red-200 bg-white' :
        request.impact.severity === 'warning' ? 'border-amber-200 bg-white' :
        'border-slate-200 bg-white'
      }`}
    >
      {/* Severity bar */}
      {isPending && <div className={`h-1 ${impact.bar}`} />}

      <div className="px-5 pt-4 pb-3">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
            isPending ? 'bg-gradient-to-br from-violet-500 to-violet-700' :
            isApproved ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
            'bg-gradient-to-br from-slate-400 to-slate-600'
          }`}>
            {request.avatarInitials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{request.staffName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeMeta.bg} ${typeMeta.color}`}>
                {typeMeta.icon} {typeMeta.label}
              </span>
              {isPending && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impact.bg} ${impact.text}`}>
                  {impact.label}
                </span>
              )}
              {isApproved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Check size={9} /> Approved
                </span>
              )}
              {isDenied && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  Denied
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {request.startDate}{request.endDate !== request.startDate ? ` – ${request.endDate}` : ''}
              </span>
              <span>{request.totalDays}d · {request.totalHours}h</span>
              <span>{request.role} · {request.unit}</span>
              <span className="ml-auto">{request.submittedAt}</span>
            </div>
            {request.reason && (
              <p className="text-xs text-slate-500 mt-1 italic">"{request.reason}"</p>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Expanded detail */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-3">
                {/* Coverage impact */}
                <div className={`rounded-lg border p-3 ${impact.bg}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${impact.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold mb-0.5 ${impact.text}`}>
                        Coverage Impact · {request.impact.affectedShifts > 0 ? `${request.impact.affectedShifts} shift${request.impact.affectedShifts > 1 ? 's' : ''} affected` : 'No impact'}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{request.impact.description}</p>
                      {request.impact.affectedShifts > 0 && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-slate-500">
                            Without coverage: <span className="font-bold text-red-600">{request.impact.unitCoverage}</span>
                          </span>
                          <ChevronRight size={11} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500">
                            With coverage: <span className="font-bold text-emerald-600">{request.impact.unitCoverageAfter}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggested coverage options */}
                {request.impact.suggestedCoverage.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Suggested Coverage</p>
                    <div className="space-y-1.5">
                      {request.impact.suggestedCoverage.map((cov, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${COVERAGE_TYPE_COLOR[cov.type]}`}>
                            {COVERAGE_TYPE_LABEL[cov.type]}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 flex-1">{cov.staffName}</span>
                          <span className="text-xs text-slate-500 flex-1 truncate">{cov.note}</span>
                          {cov.cost > 0 && (
                            <span className="text-xs font-bold text-slate-700">${cov.cost.toLocaleString()}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost summary */}
                <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-1">
                    <DollarSign size={11} />
                    PTO payout: <span className="font-bold text-slate-700 ml-0.5">${request.ptoCost.toLocaleString()}</span>
                  </span>
                  {request.coverageCost > 0 && (
                    <span className="flex items-center gap-1">
                      Coverage cost: <span className="font-bold text-amber-700 ml-0.5">+${request.coverageCost.toLocaleString()}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    PTO balance after: <span className={`font-bold ml-0.5 ${request.ptoBalanceRemaining < 40 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {request.ptoBalanceRemaining}h
                    </span>
                  </span>
                </div>

                {/* Manager note for approved/denied */}
                {request.managerNote && (
                  <div className={`rounded-lg px-3 py-2 text-xs ${isDenied ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <span className="font-bold">Manager note:</span> {request.managerNote}
                  </div>
                )}

                {/* Action buttons for pending */}
                {isPending && !justApproved && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                      aria-label={`Approve ${request.staffName}'s time-off request`}
                    >
                      {approving ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Approving…
                        </span>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onDeny(request.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors"
                      aria-label={`Deny ${request.staffName}'s time-off request`}
                    >
                      <XCircle size={14} />
                      Deny
                    </button>
                    {request.impact.severity !== 'none' && (
                      <Link
                        to="/labor"
                        className="flex items-center gap-1 ml-auto text-xs text-violet-600 hover:text-violet-800 font-semibold"
                      >
                        View labor impact <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                )}

                {/* Just approved confirmation */}
                {justApproved && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 rounded-xl px-4 py-2.5"
                  >
                    <CheckCircle2 size={16} />
                    Approved — staff notified via SMS & in-app message
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── PTO Balance row ──────────────────────────────────────────────────────────
function BalanceRow({ balance }: { balance: typeof ptoBalances[0] }) {
  const usedPct = Math.min(100, (balance.usedHoursYTD / (balance.balanceHours + balance.usedHoursYTD)) * 100)
  const pendingPct = Math.min(100 - usedPct, (balance.pendingHours / (balance.balanceHours + balance.usedHoursYTD)) * 100)
  const atRisk = balance.balanceHours < 40

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {balance.avatarInitials}
          </div>
          <div>
            <Link to={`/staff/${balance.staffId}`} className="text-sm font-semibold text-slate-900 hover:text-violet-600 transition-colors">
              {balance.name}
            </Link>
            <p className="text-[10px] text-slate-400">{balance.unit}</p>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-sm font-bold ${atRisk ? 'text-red-600' : 'text-slate-900'}`}>
          {balance.balanceHours}h
        </span>
        {atRisk && <span className="text-[10px] text-red-500 ml-1">⚠ Low</span>}
      </td>
      <td className="py-2.5 px-3 text-sm text-slate-600">{balance.usedHoursYTD}h</td>
      <td className="py-2.5 px-3">
        {balance.pendingHours > 0 ? (
          <span className="text-sm text-amber-600 font-semibold">{balance.pendingHours}h</span>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-28">
            <div className="h-full flex">
              <div className="h-full bg-emerald-400 rounded-l-full" style={{ width: `${usedPct}%` }} />
              {pendingPct > 0 && (
                <div className="h-full bg-amber-300" style={{ width: `${pendingPct}%` }} />
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400">+{balance.accrualRatePerPeriod}h/period</span>
        </div>
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type TabKey = 'pending' | 'approved' | 'denied' | 'all'

export default function TimeOff() {
  const [requests, setRequests] = useState(() => mutableRequests.slice())
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [denyTarget, setDenyTarget] = useState<PTORequest | null>(null)
  const [showCalendar, setShowCalendar] = useState(true)
  const [showBalances, setShowBalances] = useState(false)

  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const deniedCount   = requests.filter(r => r.status === 'denied').length
  const criticalPending = requests.filter(r => r.status === 'pending' && r.impact.severity === 'critical').length

  const filtered = useMemo(() => {
    let list = requests
    if (activeTab !== 'all') list = list.filter(r => r.status === activeTab)
    return list.sort((a, b) => b.submittedSort - a.submittedSort)
  }, [requests, activeTab])

  function handleApprove(id: string) {
    approveRequest(id, '')
    setRequests(mutableRequests.slice())
  }

  function handleDenyConfirm(note: string) {
    if (!denyTarget) return
    denyRequest(denyTarget.id, note)
    setRequests(mutableRequests.slice())
    setDenyTarget(null)
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending',  label: 'Pending',  count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'denied',   label: 'Denied',   count: deniedCount },
    { key: 'all',      label: 'All',      count: requests.length },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarOff size={20} className="text-violet-500" />
              Time Off & PTO
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} request${pendingCount > 1 ? 's' : ''} awaiting review · ${criticalPending > 0 ? `${criticalPending} critical staffing impact` : 'No critical impacts'}`
                : 'All requests reviewed'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              aria-label={`Show ${tab.label} requests`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${
                  activeTab === tab.key ? 'bg-white/20 text-white' :
                  tab.key === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Critical alert */}
      {criticalPending > 0 && activeTab === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-3"
        >
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            <span className="font-bold">{criticalPending} request{criticalPending > 1 ? 's' : ''}</span> would leave a unit critically understaffed — review before approving
          </p>
        </motion.div>
      )}

      <div className="p-6 max-w-5xl mx-auto space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Review',  value: pendingCount,  color: 'bg-amber-500',   icon: Clock },
            { label: 'Approved (Month)', value: approvedCount, color: 'bg-emerald-500', icon: CheckCircle2 },
            { label: 'Critical Impact', value: criticalPending, color: criticalPending > 0 ? 'bg-red-500' : 'bg-slate-400', icon: AlertTriangle },
            { label: 'Coverage Cost',   value: `$${ptoSummary.totalCoverageCostPending.toLocaleString()}`, color: 'bg-violet-500', icon: DollarSign },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm"
            >
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 30-day calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowCalendar(c => !c)}
          >
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-violet-500" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">30-Day Absence Calendar</h2>
              <span className="text-xs text-slate-400">Mar 12 – Apr 10</span>
            </div>
            {showCalendar ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </div>
          <AnimatePresence initial={false}>
            {showCalendar && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
                className="overflow-hidden"
              >
                <div className="p-5">
                  <CalendarStrip requests={requests} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Request list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              {activeTab === 'pending' ? 'Pending Requests' :
               activeTab === 'approved' ? 'Approved Requests' :
               activeTab === 'denied' ? 'Denied Requests' : 'All Requests'}
            </h2>
            <span className="text-xs text-slate-400">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-sm">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-base font-bold text-slate-700">
                {activeTab === 'pending' ? 'No pending requests' : 'No requests in this category'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === 'pending' ? "You're all caught up! Staff will be notified of any approvals." : 'Switch tabs to see other requests.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map(req => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleApprove}
                    onDeny={() => setDenyTarget(req)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* PTO Balance Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowBalances(b => !b)}
          >
            <div className="flex items-center gap-2">
              <Users size={15} className="text-violet-500" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">PTO Balance Ledger</h2>
              <span className="text-xs text-slate-400">{ptoBalances.length} staff tracked</span>
            </div>
            {showBalances ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </div>
          <AnimatePresence initial={false}>
            {showBalances && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Staff</th>
                        <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Balance</th>
                        <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Used YTD</th>
                        <th className="py-2.5 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pending</th>
                        <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Accrual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptoBalances.map(b => <BalanceRow key={b.staffId} balance={b} />)}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                  <Info size={12} />
                  Accrual rate: 4h/biweekly period (RN) · 5h/biweekly period (Charge RN) · 3h/biweekly period (CNA)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3">
          {[
            { to: '/shifts',  label: 'View affected shifts', icon: Calendar },
            { to: '/staff',   label: 'Find coverage staff',  icon: Users },
            { to: '/labor',   label: 'Labor cost impact',    icon: DollarSign },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-all shadow-sm"
            >
              <link.icon size={14} />
              {link.label}
              <ChevronRight size={12} />
            </Link>
          ))}
        </div>
      </div>

      {/* Deny dialog overlay */}
      <AnimatePresence>
        {denyTarget && (
          <DenyDialog
            request={denyTarget}
            onConfirm={handleDenyConfirm}
            onCancel={() => setDenyTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
