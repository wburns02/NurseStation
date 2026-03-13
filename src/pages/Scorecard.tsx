import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, TrendingUp, TrendingDown, Minus, Users,
  X, ChevronDown, FileText, CheckCircle, AlertTriangle,
  ClipboardList, Zap, Award, Shield, BookOpen,
} from 'lucide-react'
import {
  getScorecards, getScorecard, getScorecardStats,
  submitPeerFeedback, updateManagerNote, generateReviewDraft,
  type NurseScorecard, type Period,
} from '../data/scorecardData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-400'
  if (score >= 4.0) return 'text-violet-400'
  if (score >= 3.5) return 'text-amber-400'
  return 'text-red-400'
}
function scoreBg(score: number) {
  if (score >= 4.5) return 'bg-emerald-500'
  if (score >= 4.0) return 'bg-violet-500'
  if (score >= 3.5) return 'bg-amber-500'
  return 'bg-red-500'
}
function trendIcon(trend: NurseScorecard['trend'], delta: number) {
  if (trend === 'up')   return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold"><TrendingUp size={12} />+{delta.toFixed(2)}</span>
  if (trend === 'down') return <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold"><TrendingDown size={12} />{delta.toFixed(2)}</span>
  return <span className="flex items-center gap-0.5 text-slate-500 text-xs"><Minus size={12} />stable</span>
}

function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
        />
      ))}
    </div>
  )
}

function ScoreStar({
  value,
  onChange,
  size = 20,
}: {
  value: number
  onChange?: (v: number) => void
  size?: number
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(s)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={
              s <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-600'
            }
          />
        </button>
      ))}
      <span className="text-slate-400 text-xs ml-1">{value}/5</span>
    </div>
  )
}

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]'
           : size === 'lg' ? 'w-12 h-12 text-sm'
           : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow`}>
      {initials}
    </div>
  )
}

// ── Peer Feedback Modal ───────────────────────────────────────────────────────

function PeerFeedbackModal({
  nurse,
  onClose,
  onSubmit,
}: {
  nurse: NurseScorecard
  onClose: () => void
  onSubmit: (ratings: { communication: number; reliability: number; clinical: number; collaboration: number; attitude: number; comment: string }) => void
}) {
  const [ratings, setRatings] = useState({ communication: 4, reliability: 4, clinical: 4, collaboration: 4, attitude: 4 })
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const questions = [
    { key: 'communication' as const, label: 'Communication',  desc: 'Communicates clearly under pressure' },
    { key: 'reliability'   as const, label: 'Reliability',    desc: 'Dependable, punctual, follows through' },
    { key: 'clinical'      as const, label: 'Clinical Skills', desc: 'Clinical judgment and patient safety' },
    { key: 'collaboration' as const, label: 'Collaboration',  desc: 'Team player, helps colleagues' },
    { key: 'attitude'      as const, label: 'Attitude',       desc: 'Positive, professional, respectful' },
  ]

  function handleSubmit() {
    if (!comment.trim()) { setError('Please add a comment.'); return }
    onSubmit({ ...ratings, comment })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ ease: 'easeOut' as const, duration: 0.2 }}
        id="peer-feedback-modal"
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar initials={nurse.initials} color={nurse.color} size="sm" />
            <div>
              <p className="text-white font-bold text-sm">360 Feedback for {nurse.name}</p>
              <p className="text-slate-500 text-xs">{nurse.role} · {nurse.unit} · Q1 2026</p>
            </div>
          </div>
          <button aria-label="Close feedback modal" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-slate-400 text-xs">Your feedback is confidential and used only for performance development.</p>

          {questions.map(q => (
            <div key={q.key} data-id={`feedback-q-${q.key}`}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-white text-sm font-medium">{q.label}</p>
                  <p className="text-slate-500 text-xs">{q.desc}</p>
                </div>
                <ScoreStar
                  value={ratings[q.key]}
                  onChange={v => setRatings(r => ({ ...r, [q.key]: v }))}
                />
              </div>
            </div>
          ))}

          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Written feedback <span className="text-slate-500">(required)</span></label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={`Share a specific example of ${nurse.name.split(' ')[0]}'s work this quarter…`}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-violet-500 resize-none placeholder:text-slate-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Overall preview */}
          <div className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-xs">Your overall rating</span>
            <StarRow value={Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 5)} />
          </div>

          <button
            aria-label="Submit peer feedback"
            onClick={handleSubmit}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            Submit Feedback
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Nurse Detail Panel ────────────────────────────────────────────────────────

function NursePanel({
  nurse,
  onClose,
  onFeedback,
  onDraftGenerated,
}: {
  nurse: NurseScorecard
  onClose: () => void
  onFeedback: () => void
  onDraftGenerated: (draft: string) => void
}) {
  const [managerNote, setManagerNote] = useState(nurse.managerNote)
  const [noteSaved, setNoteSaved]     = useState(false)
  const [showDraft, setShowDraft]     = useState(false)
  const [draft, setDraft]             = useState('')

  function saveNote() {
    updateManagerNote(nurse.id, managerNote)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
  }

  function handleGenerateDraft() {
    const d = generateReviewDraft(nurse.id)
    setDraft(d)
    setShowDraft(true)
    onDraftGenerated(d)
  }

  const avgPeer = nurse.peerFeedback.length
    ? nurse.peerFeedback.reduce((s, f) => s + f.overallRating, 0) / nurse.peerFeedback.length
    : null

  const dimIcons: Record<string, React.ReactNode> = {
    reliability: <ClipboardList size={13} />,
    clinical:    <Shield size={13} />,
    teamwork:    <Users size={13} />,
    growth:      <BookOpen size={13} />,
    leadership:  <Award size={13} />,
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ ease: 'easeOut' as const, duration: 0.25 }}
      id="nurse-panel"
      className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-slate-900 shadow-2xl border-l border-slate-700 overflow-y-auto z-40"
    >
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur px-5 py-4 border-b border-slate-800 flex items-center gap-3">
        <button
          aria-label="Close nurse panel"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X size={18} />
        </button>
        <Avatar initials={nurse.initials} color={nurse.color} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{nurse.name}</p>
          <p className="text-slate-400 text-xs">{nurse.role} · {nurse.unit} · {nurse.seniorityYears}yr seniority</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${scoreColor(nurse.overallScore)}`}>{nurse.overallScore.toFixed(1)}</p>
          {trendIcon(nurse.trend, nurse.trendDelta)}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* ── Dimensions ───────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-3">Performance Dimensions</h3>
          <div className="space-y-3">
            {nurse.dimensions.map(d => (
              <div key={d.key} data-id={`panel-dim-${d.key}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                    <span className={scoreColor(d.score)}>{dimIcons[d.key]}</span>
                    {d.label}
                  </div>
                  <span className={`text-sm font-bold ${scoreColor(d.score)}`}>{d.score.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.score / 5) * 100}%` }}
                    transition={{ ease: 'easeOut' as const, duration: 0.5, delay: 0.1 }}
                    className={`h-full rounded-full ${scoreBg(d.score)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Operational highlights ───────────────────────────────────────── */}
        <section>
          <h3 className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-3">Operational Data (Q1 2026)</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Attendance', value: `${nurse.highlights.attendanceRate}%`, ok: nurse.highlights.attendanceRate >= 95 },
              { label: 'Shifts',     value: String(nurse.highlights.shiftsWorked), ok: true },
              { label: 'OT Hours',   value: `${nurse.highlights.otHours}h`,         ok: nurse.highlights.otHours < 10 },
              { label: 'Incidents',  value: String(nurse.highlights.incidentCount), ok: nurse.highlights.incidentCount === 0 },
              { label: 'Swaps Helped', value: String(nurse.highlights.swapsHelped), ok: true },
              { label: 'Recognition',  value: String(nurse.highlights.recognitionCount), ok: true },
              { label: 'Training',   value: `${nurse.highlights.trainingCompletion}%`, ok: nurse.highlights.trainingCompletion >= 85 },
              { label: 'Creds',      value: nurse.highlights.credsCompliant ? '✓ OK' : '⚠ Gap', ok: nurse.highlights.credsCompliant },
              { label: 'Charge Shifts', value: String(nurse.highlights.chargeShifts), ok: true },
            ].map(item => (
              <div key={item.label} className="bg-slate-800 rounded-lg px-2.5 py-2">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide">{item.label}</p>
                <p className={`text-sm font-bold mt-0.5 ${item.ok ? 'text-white' : 'text-amber-400'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Peer feedback ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
              Peer Feedback ({nurse.peerFeedback.length})
            </h3>
            {avgPeer !== null && (
              <StarRow value={Math.round(avgPeer)} />
            )}
          </div>

          {nurse.peerFeedback.length === 0 ? (
            <div className="bg-slate-800 rounded-xl px-4 py-4 text-center">
              <p className="text-slate-500 text-sm">No peer feedback yet</p>
              <p className="text-slate-600 text-xs mt-1">Be the first to submit a review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nurse.peerFeedback.map(f => (
                <div key={f.id} data-id={`feedback-entry-${f.id}`} className="bg-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar initials={f.fromInitials} color={f.fromColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{f.fromName}</p>
                      <p className="text-slate-500 text-[10px]">{f.submittedAt}</p>
                    </div>
                    <StarRow value={Math.round(f.overallRating)} />
                  </div>
                  <p className="text-slate-300 text-xs italic">"{f.comment}"</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(f.ratings).map(([k, v]) => (
                      <span key={k} className="text-[10px] text-slate-500 bg-slate-700 rounded px-1.5 py-0.5">
                        {k.slice(0, 4)}: {v}/5
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            aria-label={`Give peer feedback for ${nurse.name}`}
            onClick={onFeedback}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-violet-700 hover:bg-violet-900/30 text-violet-400 text-sm font-medium py-2 rounded-xl transition-all"
          >
            <Star size={14} /> Give 360 Feedback
          </button>
        </section>

        {/* ── Manager notes ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Manager Notes</h3>
            {noteSaved && (
              <span id="note-saved" className="flex items-center gap-1 text-emerald-400 text-xs">
                <CheckCircle size={11} /> Saved
              </span>
            )}
          </div>
          <textarea
            id="manager-note-input"
            value={managerNote}
            onChange={e => setManagerNote(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-violet-500 resize-none"
          />
          <button
            aria-label="Save manager note"
            onClick={saveNote}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Save note →
          </button>
        </section>

        {/* ── Generate review draft ─────────────────────────────────────────── */}
        <section>
          <button
            aria-label="Generate review draft"
            onClick={handleGenerateDraft}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-900/30"
          >
            <Zap size={16} />
            Auto-Generate Review Draft
          </button>

          <AnimatePresence>
            {showDraft && draft && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ ease: 'easeOut' as const, duration: 0.25 }}
                id="review-draft"
                className="mt-3 bg-slate-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-violet-400" />
                    <span className="text-white text-sm font-semibold">Generated Review Draft</span>
                  </div>
                  <button onClick={() => setShowDraft(false)} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <pre className="px-4 py-3 text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                  {draft}
                </pre>
                <div className="px-4 py-3 border-t border-slate-700">
                  <p className="text-slate-500 text-[10px]">
                    ⚠ Manager review required before sharing with employee. This draft uses operational data from NurseStation.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  )
}

// ── Nurse Card (grid item) ────────────────────────────────────────────────────

function NurseCard({
  nurse,
  onSelect,
}: {
  nurse: NurseScorecard
  onSelect: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ ease: 'easeOut' as const, duration: 0.18 }}
      data-id={`nurse-card-${nurse.id}`}
      className="bg-slate-800 rounded-xl p-4 shadow hover:shadow-lg hover:bg-slate-750 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar initials={nurse.initials} color={nurse.color} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{nurse.name}</p>
          <p className="text-slate-400 text-xs">{nurse.role} · {nurse.unit}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${scoreColor(nurse.overallScore)}`}>{nurse.overallScore.toFixed(1)}</p>
          {trendIcon(nurse.trend, nurse.trendDelta)}
        </div>
      </div>

      {/* Dimension mini-bars */}
      <div className="space-y-1.5">
        {nurse.dimensions.map(d => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] w-16">{d.label}</span>
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBg(d.score)}`}
                style={{ width: `${(d.score / 5) * 100}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold w-6 text-right ${scoreColor(d.score)}`}>{d.score.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {nurse.highlights.recognitionCount > 0 && (
            <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
              <Award size={10} /> {nurse.highlights.recognitionCount}
            </span>
          )}
          {!nurse.highlights.credsCompliant && (
            <span className="text-[10px] text-red-400 flex items-center gap-0.5">
              <AlertTriangle size={10} /> Creds
            </span>
          )}
          {nurse.peerFeedback.length > 0 && (
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Star size={10} /> {nurse.peerFeedback.length}
            </span>
          )}
        </div>
        <span className="text-violet-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          View profile →
        </span>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FilterUnit  = 'all' | string
type FilterScore = 'all' | 'high' | 'mid' | 'low'

export default function Scorecard() {
  const [period, setPeriod]           = useState<Period>('q1-2026')
  const [filterUnit, setFilterUnit]   = useState<FilterUnit>('all')
  const [filterScore, setFilterScore] = useState<FilterScore>('all')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [_tick, setTick] = useState(0)
  const draftRef = useRef<string>('')

  function refresh() { setTick(t => t + 1) }

  const allCards = getScorecards()
  const stats    = getScorecardStats()
  const units    = [...new Set(allCards.map(c => c.unit))]

  let displayed = allCards
  if (filterUnit  !== 'all') displayed = displayed.filter(c => c.unit === filterUnit)
  if (filterScore === 'high') displayed = displayed.filter(c => c.overallScore >= 4.0)
  if (filterScore === 'mid')  displayed = displayed.filter(c => c.overallScore >= 3.5 && c.overallScore < 4.0)
  if (filterScore === 'low')  displayed = displayed.filter(c => c.overallScore < 3.5)

  const selectedNurse   = selectedId   ? getScorecard(selectedId)   : null
  const feedbackNurse   = feedbackTarget ? getScorecard(feedbackTarget) : null

  function handleFeedbackSubmit(input: Parameters<typeof submitPeerFeedback>[1]) {
    if (!feedbackTarget) return
    submitPeerFeedback(feedbackTarget, input)
    setFeedbackTarget(null)
    setFeedbackSuccess(true)
    refresh()
    setTimeout(() => setFeedbackSuccess(false), 3500)
  }

  const periods: { id: Period; label: string }[] = [
    { id: 'q1-2026',     label: 'Q1 2026 (Current)' },
    { id: 'annual-2025', label: 'Annual 2025' },
    { id: 'q4-2025',     label: 'Q4 2025' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star size={24} className="text-amber-400" />
            Nurse Scorecards
          </h1>
          <p className="text-slate-400 text-sm mt-1">360° performance · peer feedback · auto-generated reviews</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              id="scorecard-period-picker"
              value={period}
              onChange={e => setPeriod(e.target.value as Period)}
              className="bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button
            aria-label="Export to PDF"
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-all"
          >
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div id="stat-avg-score" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Avg Score</p>
          <p className={`text-2xl font-bold mt-0.5 ${scoreColor(stats.avgScore)}`}>{stats.avgScore.toFixed(2)}</p>
          <StarRow value={Math.round(stats.avgScore)} />
        </div>
        <div id="stat-reviews-done" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Reviews Done</p>
          <p className="text-2xl font-bold text-white mt-0.5">{stats.reviewsDone}/{allCards.length}</p>
          <p className="text-slate-500 text-xs">manager rated</p>
        </div>
        <div id="stat-pending-feedback" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Needs Feedback</p>
          <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.pendingFeedback}</p>
          <p className="text-slate-500 text-xs">no peer reviews</p>
        </div>
        <div id="stat-top-performer" className="bg-slate-800 rounded-xl px-4 py-3 shadow">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide">Top Performer</p>
          <div className="flex items-center gap-2 mt-1">
            <Avatar initials={stats.topPerformer.initials} color={stats.topPerformer.color} size="sm" />
            <div>
              <p className="text-white text-xs font-semibold truncate">{stats.topPerformer.name.split(' ')[0]}</p>
              <p className="text-emerald-400 text-xs font-bold">{stats.topPerformer.overallScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feedback success toast ────────────────────────────────────────── */}
      <AnimatePresence>
        {feedbackSuccess && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            id="feedback-success"
            className="mb-4 flex items-center gap-2 bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-xl text-sm font-medium"
          >
            <CheckCircle size={16} />
            Peer feedback submitted! It will be included in the next review cycle.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {['all', ...units].map(u => (
            <button
              key={u}
              aria-label={`Filter unit ${u}`}
              onClick={() => setFilterUnit(u)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                filterUnit === u ? 'bg-violet-700 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {u === 'all' ? 'All Units' : u}
            </button>
          ))}
        </div>
        <span className="text-slate-700">|</span>
        {([['all', 'All Scores'], ['high', '≥ 4.0 ⭐'], ['mid', '3.5–4.0'], ['low', '< 3.5 ⚠']] as const).map(([id, label]) => (
          <button
            key={id}
            aria-label={`Filter score ${id}`}
            onClick={() => setFilterScore(id)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
              filterScore === id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Attention banner ──────────────────────────────────────────────── */}
      {stats.needsAttention > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-900/25 border border-amber-800/40 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            <strong>{stats.needsAttention}</strong> nurse{stats.needsAttention > 1 ? 's' : ''} scoring below 3.5 — development conversations recommended.
          </p>
        </div>
      )}

      {/* ── Nurse cards grid ──────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No nurses match these filters</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${selectedNurse ? 'lg:pr-[500px]' : ''}`}>
          <AnimatePresence>
            {displayed.map(nurse => (
              <NurseCard
                key={nurse.id}
                nurse={nurse}
                onSelect={() => setSelectedId(nurse.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Nurse detail panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNurse && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setSelectedId(null)}
            />
            <NursePanel
              nurse={selectedNurse}
              onClose={() => setSelectedId(null)}
              onFeedback={() => setFeedbackTarget(selectedNurse.id)}
              onDraftGenerated={(d) => { draftRef.current = d }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Peer feedback modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {feedbackNurse && (
          <PeerFeedbackModal
            nurse={feedbackNurse}
            onClose={() => setFeedbackTarget(null)}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
