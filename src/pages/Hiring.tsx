import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Users, Clock, TrendingUp, ChevronRight, X,
  CheckCircle, AlertTriangle, Star, Send, ArrowRight,
  MessageSquare, Plus, Calendar,
} from 'lucide-react'
import {
  getCandidates,
  getRequisitions,
  getPipelineStats,
  advanceStage,
  rejectCandidate,
  moveToOnboarding,
  addNote,
  STAGE_CONFIG,
  type Candidate,
  type CandidateStage,
} from '../data/atsData'

const UNITS = ['All', 'ICU', 'ED', 'CCU', 'MS-B', 'Telemetry', 'Oncology']

function staleBadge(days: number, stage: CandidateStage) {
  if (stage === 'hired') return null
  if (days >= 10) return { label: `${days}d`, color: 'bg-red-100 text-red-700', icon: '🔴' }
  if (days >= 5)  return { label: `${days}d`, color: 'bg-amber-100 text-amber-700', icon: '⚠' }
  if (days > 0)   return { label: `${days}d`, color: 'bg-slate-100 text-slate-500', icon: null }
  return null
}

interface CandidateCardProps {
  c: Candidate
  onSelect: () => void
  onAdvance: (e: React.MouseEvent) => void
  onReject: (e: React.MouseEvent) => void
  onOnboard: (e: React.MouseEvent) => void
}

function CandidateCard({ c, onSelect, onAdvance, onReject, onOnboard }: CandidateCardProps) {
  const stageConf = STAGE_CONFIG.find(s => s.id === c.stage)!
  const stale = staleBadge(c.daysInStage, c.stage)
  const isHired = c.stage === 'hired'

  return (
    <motion.div
      data-id={`candidate-card-${c.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      onClick={onSelect}
      className={`bg-white rounded-xl border shadow-sm cursor-pointer transition-shadow hover:shadow-md p-3 space-y-2.5 ${stageConf.border}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
          {c.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{c.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{c.role} · {c.yearsExp}y exp</p>
        </div>
        {stale && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${stale.color}`}>
            {stale.icon} {stale.label}
          </span>
        )}
      </div>

      {/* Unit + source */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.unit}</span>
        <span className="text-[10px] text-slate-400">{c.source}</span>
      </div>

      {/* Certs */}
      {c.certs.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {c.certs.slice(0, 3).map(cert => (
            <span key={cert} className="text-[9px] font-bold bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-100">
              {cert}
            </span>
          ))}
          {c.certs.length > 3 && (
            <span className="text-[9px] text-slate-400">+{c.certs.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 pt-0.5" onClick={e => e.stopPropagation()}>
        {isHired ? (
          c.movedToOnboarding ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle size={11} /> In Onboarding
            </span>
          ) : (
            <button
              aria-label={`Move to Onboarding ${c.name}`}
              onClick={onOnboard}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <ArrowRight size={11} /> Onboard
            </button>
          )
        ) : (
          <>
            <button
              aria-label={`Advance ${c.name}`}
              onClick={onAdvance}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-white text-[11px] font-semibold rounded-lg transition-colors ${stageConf.dotColor} hover:opacity-90`}
            >
              {stageConf.advanceLabel}
            </button>
            <button
              aria-label={`Reject ${c.name}`}
              onClick={onReject}
              className="px-2 py-1.5 border border-slate-200 text-slate-400 text-[11px] rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function Hiring() {
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates)
  const [stats, setStats] = useState(getPipelineStats)
  const [panelId, setPanelId]   = useState<string | null>(null)
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [unitFilter, setUnitFilter] = useState('All')

  function refresh() {
    setCandidates([...getCandidates()])
    setStats(getPipelineStats())
  }

  function handleAdvance(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    advanceStage(id)
    refresh()
    const updated = getCandidates().find(c => c.id === id)
    if (panelId === id && updated) setPanelId(id) // keep panel open, refresh data
  }

  function handleReject(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    rejectCandidate(id)
    if (panelId === id) setPanelId(null)
    refresh()
  }

  function handleOnboard(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation()
    moveToOnboarding(id)
    setOnboardSuccess(name)
    refresh()
    setTimeout(() => setOnboardSuccess(null), 5000)
  }

  function handleAddNote() {
    if (!panelId || !noteInput.trim()) return
    addNote(panelId, noteInput.trim())
    setNoteInput('')
    refresh()
  }

  const requisitions = getRequisitions()
  const panelCandidate = panelId ? candidates.find(c => c.id === panelId) : null

  const filtered = candidates.filter(c =>
    c.stage !== 'rejected' &&
    (unitFilter === 'All' || c.unit === unitFilter)
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow">
              <Briefcase size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Talent Pipeline</h1>
              <p className="text-slate-500 text-sm">Mercy General Hospital · {requisitions.length} open requisitions</p>
            </div>
          </div>
          <button
            aria-label="Add new candidate"
            className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow"
          >
            <Plus size={15} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'stat-open-reqs',       icon: Briefcase,    label: 'Open Requisitions',  value: stats.openReqs,          sub: 'active positions', color: 'blue' },
            { id: 'stat-in-pipeline',     icon: Users,        label: 'In Pipeline',         value: stats.inPipeline,        sub: 'active candidates', color: 'violet' },
            { id: 'stat-time-to-fill',    icon: Clock,        label: 'Avg Time to Fill',    value: `${stats.avgTimeToFill}d`, sub: 'days req to hire', color: 'amber' },
            { id: 'stat-offer-acceptance',icon: TrendingUp,   label: 'Offer Acceptance',    value: `${stats.offerAcceptance}%`, sub: 'last 6 months',  color: 'emerald' },
          ].map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: 'easeOut' as const }}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${s.color}-50`}>
                  <s.icon size={16} className={`text-${s.color}-600`} />
                </div>
                <span className="text-xs font-medium text-slate-500">{s.label}</span>
              </div>
              <p id={s.id} className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Open Reqs Banner ─────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
          {requisitions.map(req => (
            <div key={req.id}
              data-id={`req-${req.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 ${
                req.priority === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                req.priority === 'high'     ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {req.priority === 'critical' && <AlertTriangle size={11} className="text-red-600" />}
              {req.priority === 'high' && <Star size={11} className="text-amber-600" />}
              <span className="font-semibold">{req.unit}</span>
              <span className="opacity-70">{req.role}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                req.daysOpen >= 21 ? 'bg-red-200 text-red-800' :
                req.daysOpen >= 10 ? 'bg-amber-200 text-amber-800' :
                'bg-slate-200 text-slate-600'
              }`}>
                {req.daysOpen}d open
              </span>
            </div>
          ))}
        </div>

        {/* ── Onboard Success ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {onboardSuccess && (
            <motion.div
              id="onboarding-success"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3"
            >
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">
                {onboardSuccess} added to Onboarding pipeline →
                <span className="ml-2 text-emerald-600 underline cursor-pointer">View Onboarding</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Unit Filter ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Filter:</span>
          {UNITS.map(unit => (
            <button
              key={unit}
              aria-label={`Filter by ${unit}`}
              onClick={() => setUnitFilter(unit)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                unitFilter === unit
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* ── Kanban Board ──────────────────────────────────────────────────── */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_CONFIG.map(stage => {
            const inStage = filtered.filter(c => c.stage === stage.id)
            const hasUrgent = inStage.some(c => c.daysInStage >= 5)
            return (
              <div
                key={stage.id}
                data-id={`column-${stage.id}`}
                className="w-56 shrink-0 flex flex-col gap-2"
              >
                {/* Column Header */}
                <div className={`rounded-xl px-3 py-2.5 border ${stage.bg} ${stage.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                      <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasUrgent && <AlertTriangle size={11} className="text-amber-500" />}
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${stage.bg} ${stage.color} border ${stage.border}`}>
                        {inStage.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {inStage.map(c => (
                      <CandidateCard
                        key={c.id}
                        c={c}
                        onSelect={() => setPanelId(panelId === c.id ? null : c.id)}
                        onAdvance={e => handleAdvance(c.id, e)}
                        onReject={e => handleReject(c.id, e)}
                        onOnboard={e => handleOnboard(c.id, c.name, e)}
                      />
                    ))}
                  </AnimatePresence>
                  {inStage.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-400">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Candidate Detail Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {panelCandidate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="fixed inset-0 bg-slate-900/20 z-40"
              onClick={() => setPanelId(null)}
            />
            <motion.div
              id="candidate-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${panelCandidate.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {panelCandidate.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base">{panelCandidate.name}</p>
                    <p className="text-xs text-slate-500">{panelCandidate.role} · {panelCandidate.unit} · {panelCandidate.yearsExp}y exp</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {(() => {
                        const sc = STAGE_CONFIG.find(s => s.id === panelCandidate.stage)
                        return sc ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}>
                            {sc.label}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                </div>
                <button aria-label="Close candidate panel" onClick={() => setPanelId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Contact */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
                  <p className="text-sm text-slate-700">{panelCandidate.email}</p>
                  <p className="text-sm text-slate-700">{panelCandidate.phone}</p>
                  <p className="text-xs text-slate-500">Source: {panelCandidate.source} · Applied {panelCandidate.appliedDate}</p>
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {panelCandidate.certs.map(cert => (
                      <span key={cert} className="text-xs font-bold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg border border-violet-100">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Stage History</p>
                  <div className="space-y-2.5">
                    {panelCandidate.history.map((evt, i) => {
                      const sc = STAGE_CONFIG.find(s => s.id === evt.stage)
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${sc?.dotColor ?? 'bg-slate-300'}`} />
                            {i < panelCandidate.history.length - 1 && (
                              <div className="w-px flex-1 bg-slate-200 mt-1" />
                            )}
                          </div>
                          <div className="pb-2.5 min-w-0">
                            <p className="text-xs font-semibold text-slate-700">{sc?.label ?? evt.stage}</p>
                            <p className="text-[11px] text-slate-400">{evt.date}</p>
                            {evt.note && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{evt.note}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes ({panelCandidate.notes.length})</p>
                  <div className="space-y-2 mb-3">
                    {panelCandidate.notes.map((note, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        <p className="text-xs text-slate-700 leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="note-input"
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
                      placeholder="Add a note..."
                      className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                    />
                    <button
                      aria-label="Submit note"
                      onClick={handleAddNote}
                      className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel Actions */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {panelCandidate.stage !== 'hired' && (
                    <button
                      aria-label={`Advance ${panelCandidate.name} from panel`}
                      onClick={e => handleAdvance(panelCandidate.id, e)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                    >
                      <ChevronRight size={13} />
                      {STAGE_CONFIG.find(s => s.id === panelCandidate.stage)?.advanceLabel ?? 'Advance'}
                    </button>
                  )}
                  {panelCandidate.stage === 'hired' && !panelCandidate.movedToOnboarding && (
                    <button
                      aria-label={`Onboard ${panelCandidate.name} from panel`}
                      onClick={e => handleOnboard(panelCandidate.id, panelCandidate.name, e)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      <ArrowRight size={13} /> Move to Onboarding
                    </button>
                  )}
                  <button
                    aria-label="Schedule interview"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-white transition-colors"
                  >
                    <Calendar size={13} /> Schedule
                  </button>
                  <button
                    aria-label="Send email to candidate"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-white transition-colors"
                  >
                    <Send size={13} /> Email
                  </button>
                  {panelCandidate.stage !== 'hired' && panelCandidate.stage !== 'rejected' && (
                    <button
                      aria-label={`Reject ${panelCandidate.name} from panel`}
                      onClick={e => handleReject(panelCandidate.id, e)}
                      className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <X size={12} /> Reject Candidate
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
