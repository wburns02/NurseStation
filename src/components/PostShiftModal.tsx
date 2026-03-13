import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ShieldCheck, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { availablePool } from '../data/mockData'
import { UPCOMING_DATES, UNIT_OPTIONS } from '../data/marketplaceData'
import { ALL_SHIFTS } from '../data/mockData'
import type { ShiftListing } from '../types'

interface Props {
  onClose: () => void
  onPost: (listing: Omit<ShiftListing, 'id' | 'postedAt' | 'status' | 'viewerCount'>) => void
}

function computeMatchScore(staff: { unitExperience: string[]; hoursThisWeek: number; overtimeHours: number }, unit: string): number {
  let score = 40
  if (staff.unitExperience.includes(unit)) score += 35
  const hoursLeft = staff.overtimeHours - staff.hoursThisWeek
  score += Math.min(25, hoursLeft)
  return Math.min(99, score)
}

export default function PostShiftModal({ onClose, onPost }: Props) {
  const [date, setDate] = useState(UPCOMING_DATES[1].value)
  const [shiftType, setShiftType] = useState(ALL_SHIFTS[0])
  const [unit, setUnit] = useState('ICU')
  const [reason, setReason] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const likelyTakers = useMemo(() => {
    return availablePool
      .filter(s => s.unitExperience.includes(unit) && s.status === 'available')
      .map(s => ({ ...s, computedScore: computeMatchScore(s, unit) }))
      .sort((a, b) => b.computedScore - a.computedScore)
      .slice(0, 3)
  }, [unit])

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1100))
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => {
      onPost({
        postedById: 'janet',
        postedByName: 'Janet Morrison',
        postedByRole: 'RN',
        postedByInitials: 'JM',
        unitId: unit.toLowerCase().replace(/\s/g, '-'),
        unitName: unit,
        unitFloor: '–',
        date,
        dateShort: date.includes(',') ? date.split(',')[1].trim() : date,
        shift: shiftType,
        reason,
        urgency,
        claimedById: undefined,
        claimedByName: undefined,
        claimedByInitials: undefined,
        viewerCount: 0,
        coworkers: [],
        requiredCerts: ['BLS'],
        requiredUnits: [unit],
        matchScore: 0,
        matchReasons: [],
        matchRiskFlags: [],
      })
      onClose()
    }, 1500)
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <motion.div
        key="panel"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Post a Shift for Coverage</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">It will appear in the Shift Marketplace instantly</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Shift Posted!</h3>
              <p className="text-sm text-slate-500 mt-1">
                {likelyTakers.length > 0
                  ? `${likelyTakers[0].name} and ${likelyTakers.length - 1} others have been notified.`
                  : 'Qualified nurses have been notified.'}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Urgency toggle */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Priority</p>
                <div className="flex gap-2">
                  {(['normal', 'urgent'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                        urgency === u
                          ? u === 'urgent'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {u === 'urgent' ? '🔥 Urgent' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date</label>
                <div className="relative">
                  <select
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full appearance-none bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-violet-400 pr-8"
                  >
                    {UPCOMING_DATES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Shift */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_SHIFTS.map(s => (
                    <button
                      key={s.type}
                      onClick={() => setShiftType(s)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                        shiftType.type === s.type
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>{s.label.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{s.start}–{s.end}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Unit</label>
                <div className="relative">
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full appearance-none bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-violet-400 pr-8"
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Reason <span className="text-red-400">*</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Family emergency, Medical appointment, PTO…"
                  rows={3}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>

              {/* Who can cover — the magic section */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-violet-600" />
                  <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">Who Can Cover This?</p>
                </div>

                {likelyTakers.length > 0 ? (
                  <div className="space-y-2">
                    {likelyTakers.map((staff, i) => (
                      <div key={staff.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${i === 0 ? 'bg-white border border-violet-200 shadow-sm' : 'bg-white/60'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                          i === 0 ? 'bg-gradient-to-br from-violet-500 to-violet-700' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                        }`}>
                          {staff.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-800">{staff.name}</p>
                            {i === 0 && <span className="text-[9px] bg-violet-100 text-violet-700 px-1 rounded font-bold">BEST</span>}
                          </div>
                          <p className="text-[10px] text-slate-500">{staff.role} · {staff.overtimeHours - staff.hoursThisWeek}h before OT</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-violet-700">{staff.computedScore}%</p>
                          <p className="text-[10px] text-slate-400">match</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 mt-2">
                      <ShieldCheck size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {likelyTakers.length} qualified {likelyTakers.length === 1 ? 'nurse' : 'nurses'} will be notified immediately after posting.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">No available nurses with {unit} experience right now. Consider the float pool or a different date.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || submitting}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting…
                </>
              ) : (
                'Post to Marketplace'
              )}
            </button>
            {!reason.trim() && (
              <p className="text-center text-[11px] text-slate-400 mt-2">Add a reason to post</p>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
