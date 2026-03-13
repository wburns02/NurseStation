import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  AlertCircle,
  Timer,
} from 'lucide-react'
import type { Gap, ActionStatus, SuggestedFill } from '../types'

interface GapTimerProps {
  openedAt: Date
}

function GapTimer({ openedAt }: GapTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - openedAt.getTime()) / 60000))
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [openedAt])

  const isLong = elapsed >= 30
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${isLong ? 'text-red-500' : 'text-slate-500'}`}>
      <Timer size={11} />
      {elapsed}m open
    </span>
  )
}

interface MatchBarProps {
  score: number
}

function MatchBar({ score }: MatchBarProps) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-slate-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span className={`text-xs font-bold ${score >= 90 ? 'text-emerald-600' : 'text-slate-600'}`}>{score}%</span>
    </div>
  )
}

interface FillCardProps {
  fill: SuggestedFill
  gapId: string
  isTop?: boolean
  actionStatuses: Record<string, ActionStatus>
  onRequest: (gapId: string, staffId: string) => void
}

function FillCard({ fill, gapId, isTop, actionStatuses, onRequest }: FillCardProps) {
  const key = `${gapId}-${fill.staff.id}`
  const status = actionStatuses[key] ?? 'pending'
  const [sending, setSending] = useState(false)

  const handleRequest = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 900))
    setSending(false)
    onRequest(gapId, fill.staff.id)
  }

  return (
    <div
      className={`rounded-xl border p-3 space-y-2.5 ${
        isTop ? 'border-violet-300 bg-violet-50/60' : 'border-slate-200 bg-slate-50'
      }`}
    >
      {/* Staff header */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow ${
            isTop
              ? 'bg-gradient-to-br from-violet-500 to-violet-700'
              : 'bg-gradient-to-br from-slate-500 to-slate-700'
          }`}
        >
          {fill.staff.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">{fill.staff.name}</p>
            {isTop && <Zap size={12} className="text-violet-500 shrink-0" />}
          </div>
          <p className="text-[11px] text-slate-500">{fill.staff.role} · {fill.staff.hoursThisWeek}h this week</p>
        </div>
      </div>

      {/* Match score */}
      <MatchBar score={fill.score} />

      {/* Reasons */}
      <div className="space-y-0.5">
        {fill.reasons.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-700">
            <ShieldCheck size={10} className="shrink-0" />
            {r}
          </div>
        ))}
        {fill.riskFlags.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-700">
            <AlertCircle size={10} className="shrink-0" />
            {r}
          </div>
        ))}
      </div>

      {/* Certs */}
      <div className="flex flex-wrap gap-1">
        {fill.staff.certifications.map(c => (
          <span key={c} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">{c}</span>
        ))}
      </div>

      {/* Action button */}
      {status === 'pending' ? (
        <button
          onClick={handleRequest}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white transition-colors disabled:opacity-60"
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
              <Phone size={12} />
              Request {fill.staff.name.split(' ')[0]}
            </>
          )}
        </button>
      ) : status === 'requested' ? (
        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
          <Clock size={12} />
          Awaiting Response · {fill.staff.name.split(' ')[0]}
        </div>
      ) : status === 'confirmed' ? (
        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
          <CheckCircle2 size={12} />
          Confirmed · {fill.staff.name.split(' ')[0]}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
          <AlertTriangle size={12} />
          Declined · Try next option
        </div>
      )}
    </div>
  )
}

interface GapItemProps {
  gap: Gap
  actionStatuses: Record<string, ActionStatus>
  onRequest: (gapId: string, staffId: string) => void
  defaultExpanded?: boolean
}

function GapItem({ gap, actionStatuses, onRequest, defaultExpanded = false }: GapItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const topFill = gap.suggestedFills[0]

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden ${
        gap.severity === 'critical' ? 'border-red-300' : 'border-amber-300'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${
          gap.severity === 'critical' ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50 hover:bg-amber-100'
        } transition-colors`}
      >
        <div className={`relative flex h-2 w-2 shrink-0`}>
          {gap.severity === 'critical' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${gap.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{gap.unitName}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              gap.severity === 'critical' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
            }`}>
              {gap.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-500">{gap.role} needed</span>
            <GapTimer openedAt={gap.openedAt} />
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>

      {/* Collapsed preview */}
      <AnimatePresence initial={false}>
        {!expanded && topFill && gap.actionStatuses !== 'confirmed' && (
          <motion.div
            key="preview"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                {topFill.staff.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-700">{topFill.staff.name}</span>
                <span className="text-[11px] text-slate-400 ml-1">· {topFill.score}% match</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
                className="text-[11px] font-bold text-violet-600 hover:text-violet-800"
              >
                Fill →
              </button>
            </div>
          </motion.div>
        )}

        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-white border-t border-slate-100 space-y-2">
              {gap.suggestedFills.map((fill, i) => (
                <FillCard
                  key={fill.staff.id}
                  fill={fill}
                  gapId={gap.id}
                  isTop={i === 0}
                  actionStatuses={actionStatuses}
                  onRequest={onRequest}
                />
              ))}
              {gap.suggestedFills.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  <AlertTriangle size={20} className="mx-auto mb-1 text-amber-400" />
                  No available staff found. Request float pool?
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface Props {
  gaps: Gap[]
  actionStatuses: Record<string, ActionStatus>
  onRequest: (gapId: string, staffId: string) => void
}

export default function GapFillPanel({ gaps, actionStatuses, onRequest }: Props) {
  const criticalCount = gaps.filter(g => g.severity === 'critical').length
  const warningCount = gaps.filter(g => g.severity === 'warning').length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block relative">
                <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75" />
              </span>
              Fill These Now
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {gaps.length} open {gaps.length === 1 ? 'gap' : 'gaps'} ·{' '}
              <span className="text-red-600 font-semibold">{criticalCount} critical</span>{' '}
              · <span className="text-amber-600 font-semibold">{warningCount} warning</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-red-500">{gaps.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">gaps</div>
          </div>
        </div>
      </div>

      {/* Gap list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All units fully staffed</p>
            <p className="text-sm text-slate-400 mt-1">Nothing to fill right now.</p>
          </div>
        ) : (
          gaps.map((gap, i) => (
            <GapItem
              key={gap.id}
              gap={gap}
              actionStatuses={actionStatuses}
              onRequest={onRequest}
              defaultExpanded={i === 0}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-400 text-center">
          Rankings based on unit experience, OT exposure, and certifications
        </p>
      </div>
    </div>
  )
}
