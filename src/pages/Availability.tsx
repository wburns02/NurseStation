import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Users, Check, X, Star, Sun, Moon,
  ChevronLeft, ChevronRight, Clock, Sliders, AlertTriangle,
  CheckCircle, PlusCircle, Trash2,
} from 'lucide-react'
import {
  WEEK_DAYS, SHIFTS, ALL_UNITS, STAFF_ROSTER,
  getMySlot, cycleMySlot, getMySettings, updateSettings,
  getTeamSlot, getDayCoverage, getTimeOffRequests,
  submitTimeOffRequest, cancelTimeOffRequest,
  type SlotState, type ShiftType, type TOFReason,
} from '../data/availabilityData'

// ── Slot styling ─────────────────────────────────────────────────────────────

const SLOT_STYLE: Record<SlotState, { bg: string; border: string; text: string; label: string }> = {
  unset:       { bg: 'bg-slate-50',     border: 'border-slate-200',   text: 'text-slate-300', label: '' },
  available:   { bg: 'bg-green-50',     border: 'border-green-300',   text: 'text-green-700', label: 'Available' },
  preferred:   { bg: 'bg-emerald-500',  border: 'border-emerald-600', text: 'text-white',      label: 'Preferred ⭐' },
  unavailable: { bg: 'bg-slate-100',    border: 'border-slate-300',   text: 'text-slate-400', label: 'Unavailable' },
}

const TEAM_SLOT_DOT: Record<SlotState, string> = {
  unset:       'bg-slate-200',
  available:   'bg-green-400',
  preferred:   'bg-emerald-500',
  unavailable: 'bg-red-300',
}

const TOF_REASON_LABELS: Record<TOFReason, string> = {
  personal:   'Personal',
  medical:    'Medical',
  family:     'Family',
  vacation:   'Vacation',
  education:  'Education/Conference',
  other:      'Other',
}

type ViewTab = 'my' | 'team'

// ── Slot button component ─────────────────────────────────────────────────────

function SlotButton({
  date, shift, state, onToggle, readonly = false,
}: {
  date: string; shift: ShiftType; state: SlotState; onToggle: () => void; readonly?: boolean
}) {
  const s = SLOT_STYLE[state]
  return (
    <motion.button
      data-id={`slot-${date}-${shift}`}
      aria-label={`${shift} shift ${date} ${s.label || 'unset'}`}
      disabled={readonly}
      onClick={onToggle}
      whileTap={readonly ? undefined : { scale: 0.92 }}
      className={`relative w-full h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${s.bg} ${s.border} ${readonly ? 'cursor-default' : 'cursor-pointer hover:brightness-95 active:brightness-90'}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15, ease: 'easeOut' as const }}
          className={`flex flex-col items-center gap-0.5 ${s.text}`}
        >
          {state === 'preferred'   && <Star size={14} fill="currentColor" />}
          {state === 'available'   && <Check size={14} />}
          {state === 'unavailable' && <X size={12} />}
          {state === 'unset'       && <span className="text-[10px]">Tap</span>}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  )
}

// ── Coverage heat cell ────────────────────────────────────────────────────────

function heatColor(available: number, preferred: number): string {
  const score = preferred * 2 + available
  if (score >= 10) return 'bg-emerald-500 text-white'
  if (score >= 7)  return 'bg-green-400 text-white'
  if (score >= 4)  return 'bg-yellow-300 text-slate-700'
  if (score >= 2)  return 'bg-amber-400 text-white'
  return 'bg-red-400 text-white'
}

export default function Availability() {
  const [view, setView] = useState<ViewTab>('my')
  const [mySlots, setMySlots] = useState<Map<string, SlotState>>(() => {
    const m = new Map<string, SlotState>()
    WEEK_DAYS.forEach(d => {
      SHIFTS.forEach(s => { m.set(`${d.date}-${s.id}`, getMySlot(d.date, s.id)) })
    })
    return m
  })
  const [settings, setSettings] = useState(getMySettings)
  const [saved, setSaved] = useState(false)
  const [tofRequests, setTofRequests] = useState(getTimeOffRequests)
  const [showTOFForm, setShowTOFForm] = useState(false)
  const [tofStart, setTofStart]   = useState('2026-03-28')
  const [tofEnd, setTofEnd]       = useState('2026-03-28')
  const [tofReason, setTofReason] = useState<TOFReason>('personal')
  const [tofNotes, setTofNotes]   = useState('')
  const [tofSuccess, setTofSuccess] = useState(false)
  const [teamSlots] = useState(() => {
    // pre-compute team availability
    const result: Record<string, Record<string, SlotState>> = {}
    for (const staff of STAFF_ROSTER) {
      result[staff.staffId] = {}
      WEEK_DAYS.forEach(d => {
        SHIFTS.forEach(s => {
          result[staff.staffId][`${d.date}-${s.id}`] = getTeamSlot(staff.staffId, d.date, s.id)
        })
      })
    }
    return result
  })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleToggle(date: string, shift: ShiftType) {
    const newState = cycleMySlot(date, shift)
    setMySlots(prev => {
      const next = new Map(prev)
      next.set(`${date}-${shift}`, newState)
      return next
    })
  }

  function handleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaved(true)
    saveTimerRef.current = setTimeout(() => setSaved(false), 3000)
  }

  function toggleUnit(unit: string) {
    const current = settings.preferredUnits
    const next = current.includes(unit)
      ? current.filter(u => u !== unit)
      : [...current, unit]
    const updated = { ...settings, preferredUnits: next }
    updateSettings({ preferredUnits: next })
    setSettings(updated)
  }

  function handleHoursChange(val: number) {
    const updated = { ...settings, maxHoursPerWeek: val }
    updateSettings({ maxHoursPerWeek: val })
    setSettings(updated)
  }

  function handleShiftPref(pref: 'day' | 'night' | 'flexible') {
    const updated = { ...settings, shiftPreference: pref }
    updateSettings({ shiftPreference: pref })
    setSettings(updated)
  }

  function handleTOFSubmit() {
    submitTimeOffRequest(tofStart, tofEnd, tofReason, tofNotes)
    setTofRequests(getTimeOffRequests())
    setTofSuccess(true)
    setTofNotes('')
    setShowTOFForm(false)
    setTimeout(() => setTofSuccess(false), 4000)
  }

  function handleCancelTOF(id: string) {
    cancelTimeOffRequest(id)
    setTofRequests(getTimeOffRequests())
  }

  const coverage = WEEK_DAYS.map(d => ({
    date: d.date,
    day:   getDayCoverage(d.date, 'day'),
    night: getDayCoverage(d.date, 'night'),
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Availability</h1>
              <p className="text-slate-500 text-sm">Week of Mar 16 – 22, 2026 · Set your preferences</p>
            </div>
          </div>
          {/* View tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              aria-label="My Availability"
              onClick={() => setView('my')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'my' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays size={14} /> My View
            </button>
            <button
              aria-label="Team View"
              onClick={() => setView('team')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'team' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={14} /> Team View
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* ── TOF Success banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {tofSuccess && (
            <motion.div
              id="tof-success"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3"
            >
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Time-off request submitted! Your manager will review it.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Save success toast ─────────────────────────────────────────── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              id="save-success"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3"
            >
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Availability saved! Your manager can now see your preferences.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'my' ? (
            <motion.div
              key="my"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
              className="space-y-6"
            >
              {/* ── Availability Grid ──────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Grid header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800">Weekly Preferences</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Tap a cell to cycle: Available → Preferred ⭐ → Unavailable → Clear</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="Previous week" className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-xs text-slate-500 font-medium px-2">Mar 16–22</span>
                    <button aria-label="Next week" className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Grid body */}
                <div className="p-4 sm:p-5">
                  {/* Day column headers */}
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    <div className="col-span-1" /> {/* shift label column */}
                    {WEEK_DAYS.map(d => (
                      <div key={d.date} className="col-span-1 text-center">
                        <p className={`text-xs font-bold ${d.isWeekend ? 'text-violet-600' : 'text-slate-500'}`}>{d.dayLabel}</p>
                        <p className={`text-[11px] ${d.isWeekend ? 'text-violet-400' : 'text-slate-400'}`}>{d.dateLabel}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shift rows */}
                  {SHIFTS.map(shift => (
                    <div key={shift.id} className="grid grid-cols-8 gap-2 mb-2">
                      <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                        <span className="text-base">{shift.icon}</span>
                        <span className="text-[10px] font-semibold text-slate-500">{shift.label}</span>
                        <span className="text-[9px] text-slate-400 hidden sm:block">{shift.hours}</span>
                      </div>
                      {WEEK_DAYS.map(d => (
                        <div key={d.date} className="col-span-1">
                          <SlotButton
                            date={d.date}
                            shift={shift.id}
                            state={mySlots.get(`${d.date}-${shift.id}`) ?? 'unset'}
                            onToggle={() => handleToggle(d.date, shift.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    {([
                      ['available',   'bg-green-50 border border-green-300',   'Available'],
                      ['preferred',   'bg-emerald-500',                         'Preferred ⭐'],
                      ['unavailable', 'bg-slate-100 border border-slate-300',  'Unavailable'],
                      ['unset',       'bg-slate-50 border border-slate-200',   'Not set'],
                    ] as const).map(([_state, cls, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded ${cls}`} />
                        <span className="text-[11px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Changes are saved to your manager view instantly.</p>
                  <button
                    aria-label="Save availability preferences"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow"
                  >
                    <Check size={14} /> Save Preferences
                  </button>
                </div>
              </div>

              {/* ── Settings Row ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preferred Units */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Star size={15} className="text-violet-500" /> Preferred Units
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">Where you want to be scheduled first.</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_UNITS.map(unit => {
                      const active = settings.preferredUnits.includes(unit)
                      return (
                        <button
                          key={unit}
                          aria-label={`Toggle unit ${unit}`}
                          data-id={`unit-toggle-${unit}`}
                          onClick={() => toggleUnit(unit)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            active
                              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300'
                          }`}
                        >
                          {unit}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Max hours slider */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Clock size={15} className="text-violet-500" /> Weekly Hours
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Target hours per week (scheduler respects this).</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">20h</span>
                      <span id="hours-display" className="text-2xl font-bold text-violet-700">{settings.maxHoursPerWeek}h</span>
                      <span className="text-xs text-slate-500">60h</span>
                    </div>
                    <input
                      id="hours-slider"
                      type="range"
                      min={20}
                      max={60}
                      step={4}
                      value={settings.maxHoursPerWeek}
                      onChange={e => handleHoursChange(Number(e.target.value))}
                      className="w-full accent-violet-600"
                      aria-label="Max hours per week"
                    />
                    <p className="text-xs text-center text-slate-400">
                      {settings.maxHoursPerWeek === 36 ? '3 × 12h shifts/week (standard)' :
                       settings.maxHoursPerWeek === 48 ? '4 × 12h shifts/week' :
                       settings.maxHoursPerWeek === 24 ? '2 × 12h shifts/week (part-time)' :
                       `${settings.maxHoursPerWeek}h / week`}
                    </p>
                  </div>
                </div>

                {/* Shift type preference */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Sliders size={15} className="text-violet-500" /> Shift Preference
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">Your preferred shift type for scheduling.</p>
                  <div className="flex flex-col gap-2">
                    {(['day', 'night', 'flexible'] as const).map(pref => (
                      <button
                        key={pref}
                        aria-label={`Set shift preference ${pref}`}
                        data-id={`shift-pref-${pref}`}
                        onClick={() => handleShiftPref(pref)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          settings.shiftPreference === pref
                            ? 'bg-violet-50 border-violet-300 text-violet-700'
                            : 'border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                        }`}
                      >
                        {pref === 'day'      && <Sun  size={15} className="text-amber-500" />}
                        {pref === 'night'    && <Moon size={15} className="text-indigo-500" />}
                        {pref === 'flexible' && <Sliders size={15} className="text-emerald-500" />}
                        {pref === 'day' ? 'Day shifts' : pref === 'night' ? 'Night shifts' : 'Flexible'}
                        {settings.shiftPreference === pref && <Check size={13} className="ml-auto text-violet-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Time-Off Requests ─────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-800">Time-Off Requests</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{tofRequests.length} request{tofRequests.length !== 1 ? 's' : ''} on file</p>
                  </div>
                  <button
                    aria-label="New time-off request"
                    onClick={() => setShowTOFForm(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    <PlusCircle size={14} /> Request Time Off
                  </button>
                </div>

                {/* TOF Form */}
                <AnimatePresence>
                  {showTOFForm && (
                    <motion.div
                      id="tof-form"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' as const }}
                      className="px-5 py-4 bg-violet-50 border-b border-violet-100"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Start Date</label>
                          <input
                            id="tof-start"
                            type="date"
                            value={tofStart}
                            onChange={e => setTofStart(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">End Date</label>
                          <input
                            id="tof-end"
                            type="date"
                            value={tofEnd}
                            onChange={e => setTofEnd(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Reason</label>
                          <select
                            id="tof-reason"
                            value={tofReason}
                            onChange={e => setTofReason(e.target.value as TOFReason)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                          >
                            {(Object.entries(TOF_REASON_LABELS) as [TOFReason, string][]).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Notes (optional)</label>
                          <input
                            id="tof-notes"
                            type="text"
                            value={tofNotes}
                            onChange={e => setTofNotes(e.target.value)}
                            placeholder="Any additional context..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          aria-label="Submit time-off request"
                          onClick={handleTOFSubmit}
                          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                        >
                          <Check size={14} /> Submit Request
                        </button>
                        <button
                          onClick={() => setShowTOFForm(false)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* TOF List */}
                <div className="divide-y divide-slate-50">
                  {tofRequests.map(req => (
                    <div key={req.id} data-id={`tof-${req.id}`} className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'denied'   ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status === 'approved' ? 'Approved' : req.status === 'denied' ? 'Denied' : 'Pending'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {req.startDate === req.endDate ? req.startDate : `${req.startDate} – ${req.endDate}`}
                          </p>
                          <p className="text-xs text-slate-500">{TOF_REASON_LABELS[req.reason]}{req.notes ? ` · ${req.notes}` : ''}</p>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <button
                          aria-label={`Cancel time-off request ${req.id}`}
                          onClick={() => handleCancelTOF(req.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {tofRequests.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <CalendarDays size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">No time-off requests. Have a great week!</p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            // ── TEAM VIEW ─────────────────────────────────────────────────────
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
              className="space-y-4"
            >
              {/* Coverage heatmap header */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800">Team Coverage Heatmap</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Week of Mar 16–22 · {STAFF_ROSTER.length} staff members · Brighter = more coverage</p>
                </div>

                <div className="p-4 sm:p-5 overflow-x-auto">
                  {/* Day headers */}
                  <div className="flex gap-2 min-w-max">
                    <div className="w-36 shrink-0" /> {/* name column */}
                    {WEEK_DAYS.map(d => (
                      <div key={d.date} className="w-16 text-center shrink-0">
                        <p className={`text-xs font-bold ${d.isWeekend ? 'text-violet-600' : 'text-slate-500'}`}>{d.dayLabel}</p>
                        <p className="text-[10px] text-slate-400">{d.dateLabel}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shift sub-headers */}
                  <div className="flex gap-2 mt-1 mb-3 min-w-max">
                    <div className="w-36 shrink-0" />
                    {WEEK_DAYS.map(d => (
                      <div key={d.date} className="w-16 flex gap-0.5 shrink-0">
                        <div className="flex-1 text-center text-[9px] text-slate-400">☀</div>
                        <div className="flex-1 text-center text-[9px] text-slate-400">🌙</div>
                      </div>
                    ))}
                  </div>

                  {/* Coverage rows per staff */}
                  {STAFF_ROSTER.map(staff => (
                    <div key={staff.staffId} data-id={`team-row-${staff.staffId}`} className="flex gap-2 mb-2 items-center min-w-max">
                      <div className="w-36 shrink-0 flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${staff.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                          {staff.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate leading-tight">{staff.name.split(' ')[0]}</p>
                          <p className="text-[10px] text-slate-400">{staff.unit}</p>
                        </div>
                      </div>
                      {WEEK_DAYS.map(d => (
                        <div key={d.date} className="w-16 flex gap-0.5 shrink-0">
                          {SHIFTS.map(shift => {
                            const st = teamSlots[staff.staffId]?.[`${d.date}-${shift.id}`] ?? 'unset'
                            return (
                              <div
                                key={shift.id}
                                data-id={`team-slot-${staff.staffId}-${d.date}-${shift.id}`}
                                className={`flex-1 h-7 rounded-md ${TEAM_SLOT_DOT[st]} transition-colors`}
                                title={`${staff.name} ${shift.label} ${d.dateLabel}: ${st}`}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Coverage score row */}
                  <div className="flex gap-2 mt-4 border-t border-slate-100 pt-4 min-w-max">
                    <div className="w-36 shrink-0">
                      <p className="text-xs font-bold text-slate-500">Coverage</p>
                    </div>
                    {WEEK_DAYS.map(d => (
                      <div key={d.date} className="w-16 flex gap-0.5 shrink-0">
                        {SHIFTS.map(shift => {
                          const cov = coverage.find(c => c.date === d.date)?.[shift.id]
                          if (!cov) return null
                          const total = cov.preferred + cov.available
                          return (
                            <div
                              key={shift.id}
                              data-id={`coverage-${d.date}-${shift.id}`}
                              className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${heatColor(cov.available, cov.preferred)}`}
                              title={`${cov.preferred} preferred + ${cov.available} available`}
                            >
                              {total}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4 flex-wrap text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Preferred</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Unavailable</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Not set</span>
                </div>
              </div>

              {/* Coverage gap alerts */}
              {WEEK_DAYS.filter(d => {
                const cv = coverage.find(c => c.date === d.date)
                return cv && (cv.day.preferred + cv.day.available < 4 || cv.night.preferred + cv.night.available < 3)
              }).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Coverage gaps detected</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Some shifts have fewer than the minimum available staff. Use the Shift Board to post open shifts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
