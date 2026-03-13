import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, AlertTriangle, CheckCircle, Clock, X, ChevronRight,
  Download, Lock, AlertCircle, Fingerprint, FileText, Check,
  TrendingDown, DollarSign, Users, Zap,
} from 'lucide-react'
import {
  PAY_PERIOD,
  getTimesheets,
  getSummary,
  getUnresolvedExceptions,
  canClosePeriod,
  isPeriodClosed,
  approveTimesheet,
  resolveException,
  closePayPeriod,
  type PayrollStatus,
  type ResolutionType,
  type StaffTimesheet,
} from '../data/payrollData'

type Tab = 'all' | 'pending' | 'exceptions' | 'approved'

const STATUS_META: Record<PayrollStatus, { label: string; color: string; bg: string }> = {
  approved:     { label: 'Approved',    color: 'text-emerald-700', bg: 'bg-emerald-100' },
  pending:      { label: 'Pending',     color: 'text-amber-700',   bg: 'bg-amber-100'   },
  flagged:      { label: 'Exception',   color: 'text-red-700',     bg: 'bg-red-100'     },
  'under-review': { label: 'In Review', color: 'text-violet-700',  bg: 'bg-violet-100'  },
}

const EXC_TYPE_LABEL: Record<string, string> = {
  'missing-punch':    'Missing Punch',
  'unapproved-ot':    'Unapproved OT',
  'unscheduled-shift':'Unscheduled Shift',
  'early-departure':  'Early Departure',
  'schedule-mismatch':'Schedule Mismatch',
}

const IMPACT_META = {
  high:   { label: 'High Impact',   color: 'text-red-700',    bg: 'bg-red-100'    },
  medium: { label: 'Med Impact',    color: 'text-amber-700',  bg: 'bg-amber-100'  },
  low:    { label: 'Low Impact',    color: 'text-slate-600',  bg: 'bg-slate-100'  },
}

function fmt$(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

export default function Payroll() {
  const [activeTab, setActiveTab]   = useState<Tab>('all')
  const [panelStaffId, setPanelStaffId] = useState<string | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportDone, setExportDone] = useState<string | null>(null)
  const [periodClosed, setPeriodClosed] = useState(isPeriodClosed())
  const [closeSuccess, setCloseSuccess] = useState(false)
  const [timesheets, setTimesheets] = useState<StaffTimesheet[]>(getTimesheets)
  const [summary, setSummary] = useState(getSummary)
  const [excCount, setExcCount] = useState(getUnresolvedExceptions)

  function refresh() {
    const fresh = getTimesheets()
    setTimesheets([...fresh])
    setSummary(getSummary())
    setExcCount(getUnresolvedExceptions())
  }

  function handleApprove(staffId: string) {
    approveTimesheet(staffId)
    refresh()
  }

  function handleResolve(staffId: string, exceptionId: string, resolution: ResolutionType) {
    resolveException(staffId, exceptionId, resolution)
    refresh()
    const updated = getTimesheets().find(t => t.staffId === staffId)
    if (updated && updated.exceptions.every(e => e.resolved)) {
      setPanelStaffId(null)
    }
  }

  function handleClosePeriod() {
    closePayPeriod()
    setPeriodClosed(true)
    setCloseSuccess(true)
    setShowCloseModal(false)
  }

  function handleExport(format: string) {
    setExportDone(format)
    setTimeout(() => { setExportDone(null); setShowExport(false) }, 2000)
  }

  const filtered = timesheets.filter(t => {
    if (activeTab === 'pending')    return t.status === 'pending'
    if (activeTab === 'exceptions') return t.status === 'flagged' || t.status === 'under-review'
    if (activeTab === 'approved')   return t.status === 'approved'
    return true
  })

  const panelStaff = panelStaffId ? timesheets.find(t => t.staffId === panelStaffId) : null
  const closeable  = canClosePeriod()

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all',        label: 'All',        count: timesheets.length },
    { id: 'pending',    label: 'Pending',    count: summary.pending },
    { id: 'exceptions', label: 'Exceptions', count: summary.flagged + summary.underReview },
    { id: 'approved',   label: 'Approved',   count: summary.approved },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow">
              <Receipt size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Pay Period Close</h1>
                {periodClosed
                  ? <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full flex items-center gap-1">
                      <Lock size={10} /> CLOSED
                    </span>
                  : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">OPEN</span>
                }
              </div>
              <p className="text-slate-500 text-sm">{PAY_PERIOD.label} · Mercy General Hospital</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export */}
            <div className="relative">
              <button
                aria-label="Export payroll"
                onClick={() => setShowExport(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download size={15} /> Export <ChevronRight size={13} className="rotate-90" />
              </button>
              <AnimatePresence>
                {showExport && (
                  <motion.div
                    id="export-menu"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' as const }}
                    className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1"
                  >
                    {exportDone ? (
                      <div className="px-4 py-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                        <Check size={16} /> {exportDone} downloaded!
                      </div>
                    ) : (
                      <>
                        <button aria-label="Export ADP CSV"
                          onClick={() => handleExport('ADP CSV')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" /> ADP CSV Export
                        </button>
                        <button aria-label="Export Kronos XML"
                          onClick={() => handleExport('Kronos XML')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" /> Kronos XML Export
                        </button>
                        <button aria-label="Export PDF Summary"
                          onClick={() => handleExport('PDF Summary')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" /> PDF Summary Report
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Period CTA */}
            {!periodClosed && (
              <button
                aria-label="Close pay period"
                disabled={!closeable}
                onClick={() => setShowCloseModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  closeable
                    ? 'bg-violet-600 text-white shadow hover:bg-violet-700 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Lock size={14} />
                {closeable ? 'Close Pay Period' : `Close Pay Period (${excCount} exceptions)`}
              </button>
            )}
            {periodClosed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-semibold">
                <CheckCircle size={15} /> Period Locked
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-[1400px]">

        {/* ── Stats Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ease: 'easeOut' as const }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Fingerprint size={16} className="text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total Hours Worked</span>
            </div>
            <p id="stat-total-hours" className="text-2xl font-bold text-slate-900">
              {summary.totalActualHours.toLocaleString()}h
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {summary.totalRegularHours}h regular · {summary.totalOtHours}h OT
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: 'easeOut' as const }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-violet-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total Payroll Cost</span>
            </div>
            <p id="stat-total-cost" className="text-2xl font-bold text-slate-900">
              {fmt$(summary.totalCost)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmt$(summary.totalRegularPay)} reg · {fmt$(summary.totalOtPay)} OT
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: 'easeOut' as const }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingDown size={16} className="text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Budget Variance</span>
            </div>
            <p id="stat-budget-variance" className={`text-2xl font-bold ${summary.budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.budgetVariance >= 0 ? '+' : ''}{fmt$(summary.budgetVariance)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              vs {fmt$(summary.budgetTotal)} budget
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: 'easeOut' as const }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${excCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                {excCount > 0
                  ? <AlertTriangle size={16} className="text-red-600" />
                  : <CheckCircle size={16} className="text-emerald-600" />
                }
              </div>
              <span className="text-xs font-medium text-slate-500">Exceptions</span>
            </div>
            <p id="exception-count-badge" className={`text-2xl font-bold ${excCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {excCount}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {excCount > 0 ? `${excCount} require${excCount === 1 ? 's' : ''} resolution` : 'All clear'}
            </p>
          </motion.div>
        </div>

        {/* ── Exception Alert ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {excCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
            >
              <div id="exception-alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">
                    {excCount} timesheet exception{excCount !== 1 ? 's' : ''} require your review
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Resolve all exceptions to enable Pay Period Close. Click &ldquo;Review&rdquo; on any flagged row below.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Close Success Banner ──────────────────────────────────────────── */}
        <AnimatePresence>
          {closeSuccess && (
            <motion.div
              id="close-period-success"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3"
            >
              <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800">
                  Pay period {PAY_PERIOD.label} successfully closed and locked
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  All {summary.totalStaff} timesheets are locked. Export to your payroll system below.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button aria-label="Export ADP CSV after close"
                    onClick={() => handleExport('ADP CSV')}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
                    <Download size={12} /> ADP CSV
                  </button>
                  <button aria-label="Export Kronos XML after close"
                    onClick={() => handleExport('Kronos XML')}
                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 flex items-center gap-1.5">
                    <Download size={12} /> Kronos XML
                  </button>
                  <button aria-label="Export PDF after close"
                    onClick={() => handleExport('PDF Summary')}
                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 flex items-center gap-1.5">
                    <FileText size={12} /> PDF Report
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Timesheet Table ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter Tabs */}
          <div className="px-5 pt-4 pb-0 border-b border-slate-100">
            <div className="flex items-center gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  aria-label={`Filter ${tab.label}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-violet-700 border-violet-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sched</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actual</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OT</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Regular Pay</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OT Pay</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const s = STATUS_META[t.status]
                  const isActive = panelStaffId === t.staffId
                  return (
                    <motion.tr
                      key={t.staffId}
                      data-id={`timesheet-row-${t.staffId}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03, ease: 'easeOut' as const }}
                      className={`border-b border-slate-50 last:border-0 transition-colors ${
                        isActive ? 'bg-violet-50' :
                        t.status === 'flagged' ? 'bg-red-50/40 hover:bg-red-50/60' :
                        'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {t.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs leading-tight">{t.name}</p>
                            <p className="text-slate-400 text-[11px]">{t.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{t.unit}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">{t.scheduledHours}h</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${t.actualHours > t.scheduledHours ? 'text-amber-600' : 'text-slate-700'}`}>
                          {t.actualHours}h
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.otHours > 0
                          ? <span className="text-xs font-semibold text-orange-600">{t.otHours}h</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-700">{fmt$(t.regularPay)}</td>
                      <td className="px-4 py-3 text-right">
                        {t.otPay > 0
                          ? <span className="text-xs font-semibold text-orange-600">{fmt$(t.otPay)}</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-800">{fmt$(t.totalPay)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.status === 'flagged' || t.status === 'under-review' ? (
                          <button
                            aria-label={`Review exceptions for ${t.name}`}
                            onClick={() => setPanelStaffId(isActive ? null : t.staffId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-[11px] font-semibold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <AlertCircle size={11} />
                            Review {t.exceptions.filter(e => !e.resolved).length} exception{t.exceptions.filter(e => !e.resolved).length !== 1 ? 's' : ''}
                          </button>
                        ) : t.status === 'pending' && !periodClosed ? (
                          <button
                            aria-label={`Approve timesheet for ${t.name}`}
                            onClick={() => handleApprove(t.staffId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Check size={11} /> Approve
                          </button>
                        ) : t.status === 'approved' ? (
                          <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                            <CheckCircle size={12} />
                            <span className="truncate max-w-[80px]">{t.approvedBy?.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Lock size={10} /> Locked
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Users size={24} className="mx-auto mb-2 opacity-40" />
                No timesheets in this category
              </div>
            )}
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-500">
              {summary.approved} approved · {summary.pending} pending · {summary.flagged} exceptions · {summary.totalStaff} total
            </p>
            <p className="text-xs font-bold text-slate-700">
              Period total: {fmt$(summary.totalCost)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Exception Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelStaff && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="fixed inset-0 bg-slate-900/20 z-40"
              onClick={() => setPanelStaffId(null)}
            />
            {/* Drawer */}
            <motion.div
              id="exception-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${panelStaff.color} flex items-center justify-center text-white text-sm font-bold`}>
                    {panelStaff.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{panelStaff.name}</p>
                    <p className="text-xs text-slate-500">{panelStaff.role} · {panelStaff.unit}</p>
                  </div>
                </div>
                <button onClick={() => setPanelStaffId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <AlertTriangle size={15} className="text-red-500" />
                  {panelStaff.exceptions.filter(e => !e.resolved).length} exception{panelStaff.exceptions.filter(e => !e.resolved).length !== 1 ? 's' : ''} require resolution
                </div>

                {panelStaff.exceptions.map(exc => {
                  const imp = IMPACT_META[exc.impact]
                  return (
                    <motion.div
                      key={exc.id}
                      data-id={`exception-${exc.id}`}
                      layout
                      className={`rounded-xl border p-4 space-y-3 transition-colors ${
                        exc.resolved
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-full">
                              {EXC_TYPE_LABEL[exc.type] ?? exc.type}
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${imp.bg} ${imp.color}`}>
                              {imp.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{exc.date}</p>
                        </div>
                        {exc.resolved && (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold shrink-0">
                            <CheckCircle size={14} /> Resolved
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">{exc.description}</p>

                      {!exc.resolved && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolution</p>
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              aria-label={`Approve exception ${exc.id}`}
                              onClick={() => handleResolve(panelStaff.staffId, exc.id, 'approve-asis')}
                              className="flex items-center gap-2 px-3 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Check size={14} /> Approve as-is
                            </button>
                            <button
                              aria-label={`Flag for payroll ${exc.id}`}
                              onClick={() => handleResolve(panelStaff.staffId, exc.id, 'flag-payroll')}
                              className="flex items-center gap-2 px-3 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              <Zap size={14} /> Flag for Payroll Dept
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {panelStaff.exceptions.every(e => e.resolved) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: 'easeOut' as const }}
                    className="text-center py-6"
                  >
                    <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-700">All exceptions resolved</p>
                    <p className="text-xs text-slate-500 mt-1">Timesheet status updated to Approved</p>
                  </motion.div>
                )}
              </div>

              {/* Timesheet summary in panel */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timesheet Summary</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-xs text-slate-400">Actual Hrs</p>
                    <p className="text-sm font-bold text-slate-700">{panelStaff.actualHours}h</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-xs text-slate-400">OT Hours</p>
                    <p className={`text-sm font-bold ${panelStaff.otHours > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                      {panelStaff.otHours}h
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-xs text-slate-400">Total Pay</p>
                    <p className="text-sm font-bold text-slate-700">{fmt$(panelStaff.totalPay)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Close Period Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCloseModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="fixed inset-0 bg-slate-900/50 z-50"
              onClick={() => setShowCloseModal(false)}
            />
            <motion.div
              id="close-period-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Lock size={20} className="text-violet-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Close Pay Period?</h2>
                      <p className="text-sm text-slate-500">{PAY_PERIOD.label}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total staff</span>
                      <span className="font-semibold text-slate-800">{summary.totalStaff} timesheets</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total hours</span>
                      <span className="font-semibold text-slate-800">{summary.totalActualHours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Payroll cost</span>
                      <span className="font-bold text-slate-900">{fmt$(summary.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Budget variance</span>
                      <span className={`font-semibold ${summary.budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {summary.budgetVariance >= 0 ? '+' : ''}{fmt$(summary.budgetVariance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      This action cannot be undone. All timesheets will be locked and an audit trail will be generated.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowCloseModal(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      aria-label="Confirm close pay period"
                      onClick={handleClosePeriod}
                      className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Lock size={14} /> Confirm & Lock
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click-outside export close */}
      {showExport && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
      )}

      {/* OT legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5"><Clock size={12} /> Rates: Staff RN $38/hr · Charge $45/hr · Travel $52/hr · LPN $28/hr · CNA $22/hr · OT at 1.5×</div>
          <div className="flex items-center gap-1.5"><Fingerprint size={12} /> Hours sourced from Time Clock punch data</div>
        </div>
      </div>
    </div>
  )
}
