// Recognition.tsx — Peer Recognition & DAISY Awards
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Award,
  Plus,
  X,
  Star,
  Trophy,
  Sparkles,
  Eye,
  EyeOff,
  Users,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import {
  getAllRecognitions,
  getSummary,
  getLeaderboard,
  hasLiked,
  toggleLike,
  getLikeCount,
  submitKudos,
  submitDaisy,
  CATEGORY_META,
  STAFF_LIST,
  type KudosCategory,
  type Recognition,
} from '../data/recognitionData'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 60) return `${Math.round(diff)}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  const days = Math.round(diff / 1440)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function Avatar({ initials, color = 'from-violet-500 to-violet-700', size = 'md' }: {
  initials: string; color?: string; size?: 'sm' | 'md' | 'lg'
}) {
  const dims = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
  // Milestones have emoji initials
  if (initials.length > 2) {
    return (
      <div className={`${dims} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0`}>
        {initials}
      </div>
    )
  }
  return (
    <div className={`${dims} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 shadow`}>
      {initials}
    </div>
  )
}

// Color palette for avatars (deterministic by initials)
const AVATAR_COLORS = [
  'from-violet-500 to-violet-700',
  'from-teal-500 to-teal-700',
  'from-blue-500 to-blue-700',
  'from-pink-500 to-pink-700',
  'from-amber-500 to-amber-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-indigo-500 to-indigo-700',
]
function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ─── Heart button (like) ──────────────────────────────────────────────────────
function LikeButton({ rec, onLike }: { rec: Recognition; onLike: () => void }) {
  const [bounce, setBounce] = useState(false)
  const liked = hasLiked(rec.id)
  const count = getLikeCount(rec)

  function handle() {
    toggleLike(rec.id)
    setBounce(true)
    setTimeout(() => setBounce(false), 400)
    onLike()
  }

  return (
    <button
      aria-label={`Like recognition ${rec.id}`}
      onClick={handle}
      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
        liked
          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-red-500/40 hover:text-red-400'
      }`}
    >
      <motion.div
        animate={bounce ? { scale: [1, 1.5, 0.9, 1.1, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Heart size={12} className={liked ? 'fill-red-400' : ''} />
      </motion.div>
      {count}
    </button>
  )
}

// ─── DAISY badge ──────────────────────────────────────────────────────────────
function DaisyBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
      <Award size={10} />
      DAISY Nominee
    </span>
  )
}

// ─── Recognition card ─────────────────────────────────────────────────────────
function RecognitionCard({ rec, onLike }: { rec: Recognition; onLike: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const catMeta = rec.category ? CATEGORY_META[rec.category] : null
  const isMilestone = rec.type === 'milestone'
  const isDaisy = rec.type === 'daisy'

  const borderClass = isDaisy
    ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-slate-900'
    : isMilestone
    ? 'border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-slate-900'
    : 'border-slate-700/50 bg-slate-800/40'

  return (
    <motion.div
      data-id={`rec-card-${rec.id}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${borderClass} hover:border-slate-600 transition-colors`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar initials={rec.toInitials} color={colorFor(rec.toName)} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{rec.toName}</span>
            <span className="text-slate-500 text-xs">{rec.toRole}</span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{rec.toUnit}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {isDaisy && <DaisyBadge />}
            {isMilestone && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                <Sparkles size={9} />
                {rec.milestoneType === 'certification' ? 'Certification' : 'Anniversary'}
              </span>
            )}
            {catMeta && !isDaisy && !isMilestone && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${catMeta.bg} ${catMeta.color} border border-current/20`}>
                {catMeta.icon} {catMeta.label}
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(rec.createdAt)}</span>
      </div>

      {/* From */}
      {rec.fromName && (
        <div className="flex items-center gap-1.5 mt-2.5 mb-2">
          <Avatar initials={rec.fromInitials ?? '?'} color={colorFor(rec.fromName)} size="sm" />
          <span className="text-xs text-slate-400">
            {rec.fromName === 'NurseStation'
              ? <span className="text-violet-400 font-semibold">NurseStation</span>
              : <><span className="text-slate-300 font-medium">{rec.fromName}</span><span className="text-slate-600"> · {rec.fromUnit}</span></>
            }
          </span>
        </div>
      )}
      {rec.isAnonymous && (
        <div className="flex items-center gap-1.5 mt-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
            <EyeOff size={11} className="text-slate-400" />
          </div>
          <span className="text-xs text-slate-500 italic">Anonymous colleague</span>
        </div>
      )}

      {/* Message */}
      <p className={`text-sm text-slate-300 leading-relaxed ${isDaisy ? 'mt-1' : ''}`}>
        {isDaisy || isMilestone || rec.message.length <= 160 ? (
          rec.message
        ) : (
          <>
            {expanded ? rec.message : rec.message.slice(0, 160) + '…'}
            <button
              onClick={() => setExpanded(e => !e)}
              className="ml-1 text-violet-400 hover:text-violet-300 text-xs font-semibold"
            >
              {expanded ? 'less' : 'more'}
            </button>
          </>
        )}
      </p>

      {/* DAISY patient story */}
      {isDaisy && rec.patientStory && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <MessageSquare size={11} />
            {expanded ? 'Hide' : 'Read'} Patient Story
            <ChevronRight size={11} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' as const }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-100/80 leading-relaxed italic">"{rec.patientStory}"</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3">
        <LikeButton rec={rec} onLike={onLike} />
        {isDaisy && (
          <span className="text-[10px] text-amber-400/70 flex items-center gap-1">
            <Award size={9} />
            DAISY Foundation Nominee
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Kudos Modal ──────────────────────────────────────────────────────────────
function KudosModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [recipient, setRecipient] = useState(STAFF_LIST[0])
  const [category, setCategory] = useState<KudosCategory>('above-beyond')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    submitKudos({
      category,
      toName: recipient.name,
      toInitials: recipient.initials,
      toRole: recipient.role,
      toUnit: recipient.unit,
      message: message.trim(),
      fromName: isAnonymous ? null : 'Janet Morrison',
      fromInitials: isAnonymous ? null : 'JM',
      fromUnit: isAnonymous ? null : 'Administration',
      isAnonymous,
    })
    setSubmitted(true)
    setTimeout(() => { onSubmitted(); onClose() }, 1400)
  }

  const cats = Object.entries(CATEGORY_META) as [KudosCategory, typeof CATEGORY_META[KudosCategory]][]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        id="kudos-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Star size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Give Kudos</h2>
              <p className="text-slate-400 text-xs">Recognize a teammate's great work</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close kudos modal" className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-violet-500/15 rounded-full flex items-center justify-center mb-4"
            >
              <Star size={32} className="text-violet-400" />
            </motion.div>
            <p className="text-violet-300 font-bold text-lg">Kudos Sent! 🎉</p>
            <p className="text-slate-400 text-sm mt-1">{recipient.name} will see this on the Recognition Wall.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Recipient */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Recognizing *</label>
              <select
                id="kudos-recipient"
                value={recipient.name}
                onChange={e => setRecipient(STAFF_LIST.find(s => s.name === e.target.value) ?? STAFF_LIST[0])}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
              >
                {STAFF_LIST.map(s => (
                  <option key={s.name} value={s.name}>{s.name} — {s.role}, {s.unit}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Category *</label>
              <div className="grid grid-cols-2 gap-1.5">
                {cats.map(([k, meta]) => (
                  <button
                    key={k}
                    type="button"
                    id={`cat-${k}`}
                    onClick={() => setCategory(k)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      category === k
                        ? `${meta.bg} ${meta.color} border-current/40`
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Your Message *</label>
              <textarea
                id="kudos-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell them specifically what they did and why it mattered…"
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                Specific kudos are 3× more motivating than generic ones.
              </p>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center gap-2">
                {isAnonymous ? <EyeOff size={15} className="text-slate-400" /> : <Eye size={15} className="text-slate-400" />}
                <p className="text-sm font-medium text-slate-200">
                  {isAnonymous ? 'Send anonymously' : 'Send as Janet Morrison'}
                </p>
              </div>
              <button
                type="button"
                id="kudos-anonymous-toggle"
                onClick={() => setIsAnonymous(a => !a)}
                aria-label="Toggle anonymous kudos"
                className={`relative w-10 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-violet-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              type="submit"
              aria-label="Submit kudos"
              disabled={!message.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Star size={15} />
              Send Kudos
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── DAISY Modal ──────────────────────────────────────────────────────────────
function DaisyModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [recipient, setRecipient] = useState(STAFF_LIST[0])
  const [message, setMessage] = useState('')
  const [patientStory, setPatientStory] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !patientStory.trim()) return
    submitDaisy({
      toName: recipient.name,
      toInitials: recipient.initials,
      toRole: recipient.role,
      toUnit: recipient.unit,
      message: message.trim(),
      patientStory: patientStory.trim(),
      fromName: isAnonymous ? null : 'Janet Morrison',
      fromInitials: isAnonymous ? null : 'JM',
      fromUnit: isAnonymous ? null : 'Administration',
      isAnonymous,
    })
    setSubmitted(true)
    setTimeout(() => { onSubmitted(); onClose() }, 1600)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        id="daisy-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Award size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">DAISY Nomination</h2>
              <p className="text-amber-400/70 text-xs">Extraordinary nursing excellence</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close DAISY modal" className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: 1 }}
              className="text-5xl mb-4"
            >
              🌼
            </motion.div>
            <p className="text-amber-300 font-bold text-lg">DAISY Nomination Submitted!</p>
            <p className="text-slate-400 text-sm mt-1 text-center px-8">
              {recipient.name}'s nomination will be reviewed by the DAISY Award committee.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-300 leading-relaxed">
                The DAISY Award honors nurses who provide extraordinary, compassionate, and skillful care.
                Nominations are submitted to the DAISY Foundation and reviewed monthly.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nominating *</label>
              <select
                id="daisy-recipient"
                value={recipient.name}
                onChange={e => setRecipient(STAFF_LIST.find(s => s.name === e.target.value) ?? STAFF_LIST[0])}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
              >
                {STAFF_LIST.map(s => (
                  <option key={s.name} value={s.name}>{s.name} — {s.role}, {s.unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Why they deserve the DAISY Award *</label>
              <textarea
                id="daisy-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe the specific care, skill, or compassion that makes this nurse extraordinary…"
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Patient or Family Story *</label>
              <textarea
                id="daisy-patient-story"
                value={patientStory}
                onChange={e => setPatientStory(e.target.value)}
                placeholder="Share a specific moment — what the patient or family experienced, how this nurse made a difference…"
                required
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center gap-2">
                {isAnonymous ? <EyeOff size={15} className="text-slate-400" /> : <Eye size={15} className="text-slate-400" />}
                <p className="text-sm font-medium text-slate-200">
                  {isAnonymous ? 'Submit anonymously' : 'Submit as Janet Morrison'}
                </p>
              </div>
              <button
                type="button"
                id="daisy-anonymous-toggle"
                onClick={() => setIsAnonymous(a => !a)}
                aria-label="Toggle anonymous DAISY"
                className={`relative w-10 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-amber-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              type="submit"
              aria-label="Submit DAISY nomination"
              disabled={!message.trim() || !patientStory.trim()}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Award size={15} />
              Submit DAISY Nomination
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Filter buttons ───────────────────────────────────────────────────────────
type FilterKey = 'all' | 'daisy' | 'kudos' | 'milestone'

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Recognition() {
  const [recs, setRecs] = useState(getAllRecognitions)
  const [showKudos, setShowKudos] = useState(false)
  const [showDaisy, setShowDaisy] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [_tick, setTick] = useState(0)

  const summary = getSummary()
  const leaderboard = getLeaderboard()

  function refresh() {
    setRecs([...getAllRecognitions()])
    setTick(t => t + 1)
  }

  const filtered = filter === 'all' ? recs : recs.filter(r => r.type === filter)

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-bold text-white">Recognition Wall</h1>
              <span className="text-2xl">🌼</span>
            </div>
            <p className="text-slate-400 text-sm">Celebrate your team · DAISY Award nominations · Milestones</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              aria-label="Open DAISY nomination"
              onClick={() => setShowDaisy(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3.5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-amber-900/30"
            >
              <Award size={15} />
              DAISY Nomination
            </motion.button>
            <motion.button
              aria-label="Give kudos"
              onClick={() => setShowKudos(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-violet-900/30"
            >
              <Plus size={16} />
              Give Kudos
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'stat-this-week',   icon: Star,    label: 'This Week',          value: summary.thisWeek,      color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { id: 'stat-daisy',       icon: Award,   label: 'DAISY Nominees',     value: summary.daisy,         color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
            { id: 'stat-honored',     icon: Users,   label: 'Staff Honored',      value: summary.uniqueHonored, color: 'text-teal-400',   bg: 'bg-teal-500/10'   },
            { id: 'stat-top-unit',    icon: Trophy,  label: 'Top Unit',           value: summary.topUnit,       color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
          ].map(({ id, icon: Icon, label, value, color, bg }) => (
            <div key={id} id={id} className={`${bg} rounded-xl p-3 border border-slate-700/50`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Feed */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Filter bar */}
          <div className="px-5 py-3 border-b border-slate-800 flex gap-2 shrink-0">
            {([
              { key: 'all' as FilterKey,       label: 'All',        count: recs.length     },
              { key: 'kudos' as FilterKey,     label: 'Kudos',      count: recs.filter(r => r.type === 'kudos').length },
              { key: 'daisy' as FilterKey,     label: '🌼 DAISY',   count: recs.filter(r => r.type === 'daisy').length },
              { key: 'milestone' as FilterKey, label: '🎉 Milestones', count: recs.filter(r => r.type === 'milestone').length },
            ]).map(f => (
              <button
                key={f.key}
                aria-label={`Filter ${f.label}`}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  filter === f.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {f.label}
                <span className={`text-[10px] px-1.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-slate-700'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map(rec => (
                <RecognitionCard key={rec.id} rec={rec} onLike={() => setTick(t => t + 1)} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-slate-500">
                <span className="text-4xl mb-3">🌼</span>
                <p className="text-sm font-medium">No recognitions in this view</p>
                <button onClick={() => setShowKudos(true)} className="mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
                  Be the first to recognize someone
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden">
          {/* Leaderboard */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-slate-200">Most Recognized</span>
              <span className="text-[10px] text-slate-500 ml-auto">Mar 2026</span>
            </div>
            <div className="space-y-2">
              {leaderboard.map((person, i) => (
                <motion.div
                  key={person.name}
                  data-id={`leaderboard-${i}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5"
                >
                  <span className={`text-xs font-bold w-4 text-center shrink-0 ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-600'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <Avatar initials={person.initials} color={colorFor(person.name)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{person.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{person.unit}</p>
                  </div>
                  <span className="text-xs font-bold text-violet-400 shrink-0">{person.count}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-2">
              <button
                aria-label="Quick give kudos"
                onClick={() => setShowKudos(true)}
                className="w-full flex items-center gap-2.5 bg-violet-600/10 border border-violet-500/25 hover:bg-violet-600/20 text-violet-300 font-semibold py-2.5 px-3 rounded-xl transition-colors text-sm text-left"
              >
                <Star size={14} className="shrink-0" />
                Give Kudos
              </button>
              <button
                aria-label="Quick DAISY nomination"
                onClick={() => setShowDaisy(true)}
                className="w-full flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-300 font-semibold py-2.5 px-3 rounded-xl transition-colors text-sm text-left"
              >
                <Award size={14} className="shrink-0" />
                DAISY Nomination
              </button>
            </div>
          </div>

          {/* About DAISY */}
          <div id="daisy-info" className="px-4 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">About DAISY Awards</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The DAISY Award for Extraordinary Nurses is given by the DAISY Foundation to honor nurses
              who make an extraordinary difference in the lives of patients and families.
              Nominations are reviewed monthly and winners receive a DAISY Award certificate,
              a hand-carved stone sculpture, and a DAISY pin.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                'Patient or family nominations welcome',
                'Peer and manager nominations',
                'Monthly review committee',
                'JCAHO-aligned recognition program',
              ].map(item => (
                <div key={item} className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1 shrink-0" />
                  <p className="text-[11px] text-slate-500">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showKudos && (
          <KudosModal onClose={() => setShowKudos(false)} onSubmitted={refresh} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDaisy && (
          <DaisyModal onClose={() => setShowDaisy(false)} onSubmitted={refresh} />
        )}
      </AnimatePresence>
    </div>
  )
}
