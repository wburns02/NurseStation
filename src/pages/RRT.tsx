import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Siren, Users, ChevronDown, X, CheckCircle2,
  Activity, History, TrendingUp,
  MapPin, User, ClipboardList, ChevronRight,
} from 'lucide-react'
import {
  getActiveEvents, getHistoryEvents, activateEvent, markTeamArrived, resolveEvent,
  EVENT_META, CALL_TRENDS, OUTCOME_OPTIONS,
  type EventType, type RrtEvent, type RrtTeamMember,
} from '../data/rrtData'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function formatResponseTime(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function Avatar({ name, initials, color, size='md' }: { name:string; initials:string; color:string; size?:'sm'|'md'|'lg' }) {
  const sz = size==='sm' ? 'w-7 h-7 text-[10px]' : size==='lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div title={name} className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 shadow`}>
      {initials}
    </div>
  )
}

// ── Live Timer ───────────────────────────────────────────────────────────────

function LiveTimer({ startedAtMs }: { startedAtMs: number }) {
  const [elapsed, setElapsed] = useState(Date.now() - startedAtMs)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAtMs), 1000)
    return () => clearInterval(id)
  }, [startedAtMs])
  const isCritical = elapsed > 10 * 60 * 1000   // > 10 min
  const isWarning  = elapsed > 5 * 60 * 1000    // > 5 min
  return (
    <div id="event-timer" className={`text-4xl font-mono font-black tracking-tight ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
      {formatTimer(elapsed)}
    </div>
  )
}

// ── Team Member Row ───────────────────────────────────────────────────────────

function TeamMemberRow({ member, eventId, onArrived }: { member: RrtTeamMember; eventId: string; onArrived: () => void }) {
  const arrived = !!member.respondedAt
  return (
    <div data-id={`team-member-${member.id}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${arrived ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
      <Avatar name={member.name} initials={member.initials} color={member.color} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
        <p className="text-[10px] text-slate-500">{member.role}</p>
      </div>
      {arrived ? (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
          <CheckCircle2 size={13} />
          <span>{member.respondedAt} · {formatResponseTime(member.responseTimeSec!)}</span>
        </div>
      ) : (
        <button
          aria-label={`Mark arrived ${member.id}`}
          onClick={() => { markTeamArrived(eventId, member.id); onArrived() }}
          className="text-[10px] font-bold bg-slate-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Mark Arrived
        </button>
      )}
    </div>
  )
}

// ── Active Event Card ────────────────────────────────────────────────────────

function ActiveEventCard({ evt, onRefresh, onToast }: { evt: RrtEvent; onRefresh: () => void; onToast: (msg: string) => void }) {
  const meta = EVENT_META[evt.type]
  const [resolveOpen, setResolveOpen] = useState(false)
  const [outcome, setOutcome] = useState(OUTCOME_OPTIONS[0])
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpNotes, setFollowUpNotes] = useState('')

  function handleResolve() {
    resolveEvent(evt.id, outcome, notes, followUp, followUpNotes)
    onToast('Event resolved — moved to history')
    setResolveOpen(false)
    setTimeout(onRefresh, 400)
  }

  return (
    <motion.div
      layout
      data-id={`rrt-event-${evt.id}`}
      initial={{ opacity:0, y:-10 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, scale:0.97 }}
      className={`rounded-2xl border-2 ${meta.border} bg-white shadow-lg overflow-hidden`}
    >
      {/* Header */}
      <div className={`${meta.bg} px-5 py-4 flex items-start gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow`}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
            <span className={`w-2 h-2 rounded-full bg-red-500 animate-ping`} />
            <span className="text-xs font-semibold text-red-600 uppercase">ACTIVE</span>
          </div>
          <p className="text-base font-bold text-slate-800">{evt.location}</p>
          {evt.patientName && (
            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1"><User size={11} /> {evt.patientName}</p>
          )}
          <p className="text-[10px] text-slate-500 mt-1">Called by {evt.calledBy} · {evt.calledAt}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Elapsed</p>
          <LiveTimer startedAtMs={evt.startedAtMs} />
        </div>
      </div>

      {/* Team Roster */}
      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Users size={12} /> Team Roster
          <span className="ml-auto text-slate-400 font-normal">
            {evt.team.filter(m => m.respondedAt).length}/{evt.team.length} arrived
          </span>
        </p>
        <div id="team-roster" className="space-y-2">
          {evt.team.map(m => (
            <TeamMemberRow key={m.id} member={m} eventId={evt.id} onArrived={onRefresh} />
          ))}
        </div>
      </div>

      {/* Resolve button */}
      <div className="px-5 pb-4">
        <button
          aria-label={`Resolve event ${evt.id}`}
          onClick={() => setResolveOpen(!resolveOpen)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle2 size={16} />
          Document & Resolve
          <ChevronDown size={14} className={`transition-transform ${resolveOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {resolveOpen && (
            <motion.div
              id="outcome-form"
              initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Outcome</label>
                  <select
                    id="outcome-select"
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Clinical Notes</label>
                  <textarea
                    id="outcome-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Brief description of event and interventions..."
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    id="follow-up-check"
                    checked={followUp}
                    onChange={e => setFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-600"
                  />
                  Follow-up required
                </label>
                {followUp && (
                  <input
                    id="follow-up-notes"
                    value={followUpNotes}
                    onChange={e => setFollowUpNotes(e.target.value)}
                    placeholder="Consult, notification, or follow-up action..."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                )}
                <button
                  aria-label={`Confirm resolve ${evt.id}`}
                  onClick={handleResolve}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  Confirm Resolution
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  )
}

// ── History Card ─────────────────────────────────────────────────────────────

function HistoryCard({ evt }: { evt: RrtEvent }) {
  const [expanded, setExpanded] = useState(false)
  const meta = EVENT_META[evt.type]
  const durationMs = evt.resolvedAtMs && evt.startedAtMs ? evt.resolvedAtMs - evt.startedAtMs : null
  return (
    <motion.div
      layout
      data-id={`history-event-${evt.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-lg leading-none">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
              {meta.label}
            </span>
            {evt.followUpRequired && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Follow-up</span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{evt.location}</p>
          <p className="text-[10px] text-slate-500">{evt.calledAt} · {durationMs ? formatTimer(durationMs) : '—'} duration</p>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-slate-100 space-y-3">
              {evt.patientName && (
                <p className="text-sm text-slate-700 flex items-center gap-1.5"><User size={13} className="text-slate-400" /> <span className="font-semibold">{evt.patientName}</span></p>
              )}
              {evt.outcome && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Outcome</p>
                  <p className="text-sm text-slate-800">{evt.outcome}</p>
                </div>
              )}
              {evt.notes && (
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Notes:</span> {evt.notes}</p>
              )}
              {evt.followUpRequired && evt.followUpNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Follow-up</p>
                  <p className="text-sm text-slate-800">{evt.followUpNotes}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Team Response</p>
                <div className="space-y-1.5">
                  {evt.team.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Avatar name={m.name} initials={m.initials} color={m.color} size="sm" />
                      <span className="text-xs text-slate-700 flex-1">{m.name} <span className="text-slate-500">· {m.role}</span></span>
                      {m.responseTimeSec && <span className="text-[10px] text-emerald-600 font-semibold">{formatResponseTime(m.responseTimeSec)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Activate Modal ─────────────────────────────────────────────────────────

const EVENT_TYPES: EventType[] = ['rrt','code-blue','stemi','stroke','code-gray','trauma']

function ActivateModal({ onActivate, onClose }: { onActivate: (type:EventType, unit:string, room:string, caller:string, patient?:string) => void; onClose: () => void }) {
  const [type, setType] = useState<EventType>('rrt')
  const [unit, setUnit] = useState('ICU')
  const [room, setRoom] = useState('')
  const [patient, setPatient] = useState('')
  const [caller, setCaller] = useState('Janet Morrison, RN')

  const canSubmit = unit.trim() && room.trim() && caller.trim()

  return (
    <motion.div
      id="activate-modal"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
          <Siren size={20} className="text-white" />
          <p className="text-white font-bold flex-1">Activate Emergency Response</p>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Event type */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Event Type</p>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(t => {
                const m = EVENT_META[t]
                return (
                  <button
                    key={t}
                    data-id={`event-type-${t}`}
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      type === t ? `${m.bg} ${m.border} ${m.color}` : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {['ICU','CCU','ED','MS-A','MS-B','Oncology','Telemetry'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Room</label>
              <input
                id="location-input"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="e.g. 304"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Patient Name (optional)</label>
            <input
              value={patient}
              onChange={e => setPatient(e.target.value)}
              placeholder="Last, First"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Called By</label>
            <input
              value={caller}
              onChange={e => setCaller(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            aria-label="Confirm activation"
            disabled={!canSubmit}
            onClick={() => onActivate(type, unit, room, caller, patient || undefined)}
            className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Activate {EVENT_META[type].label}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Mini Trend Bar ─────────────────────────────────────────────────────────

function TrendBars() {
  const max = Math.max(...CALL_TRENDS.map(t => t.calls), 1)
  return (
    <div id="trends-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <TrendingUp size={12} /> 14-Shift Call Volume
      </p>
      <div className="flex items-end gap-1 h-16">
        {CALL_TRENDS.map((t, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 flex items-end w-full">
              <motion.div
                className={`w-full rounded-sm ${i === CALL_TRENDS.length-1 ? 'bg-red-400' : 'bg-violet-300'}`}
                initial={{ height:0 }}
                animate={{ height: `${(t.calls / max) * 100}%` }}
                transition={{ delay: i * 0.03, duration:0.4, ease:'easeOut' as const }}
              />
            </div>
            {t.calls > 0 && <span className="text-[8px] text-slate-500">{t.calls}</span>}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-400">Mon</span>
        <span className="text-[9px] text-slate-400 font-bold text-red-500">Today</span>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'active' | 'history' | 'trends'

export default function RRT() {
  const [tab, setTab] = useState<Tab>('active')
  const [activeEvents, setActiveEvents] = useState(getActiveEvents)
  const [historyEvents, setHistoryEvents] = useState(getHistoryEvents)
  const [activateOpen, setActivateOpen] = useState(false)
  const [globalToast, setGlobalToast] = useState('')
  const [tick, setTick] = useState(0)

  // Refresh state from module store
  function refresh() {
    setActiveEvents(getActiveEvents())
    setHistoryEvents(getHistoryEvents())
    setTick(t => t + 1)
  }

  function showGlobalToast(msg: string) {
    setGlobalToast(msg)
    setTimeout(() => setGlobalToast(''), 3500)
  }

  function handleActivate(type: EventType, unit: string, room: string, caller: string, patient?: string) {
    activateEvent(type, unit, room, caller, patient)
    refresh()
    setActivateOpen(false)
    setTab('active')
    showGlobalToast(`${EVENT_META[type].label} activated — team notified`)
  }

  return (
    <div id="rrt-page" className="min-h-screen bg-slate-50">
      {/* Top header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow">
            <Siren size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">RRT & Code Blue Command</h1>
            <p className="text-xs text-slate-500">Rapid Response · Emergency Events · Outcome Documentation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeEvents.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold text-red-700">{activeEvents.length} ACTIVE</span>
            </div>
          )}
          <button
            id="activate-btn"
            onClick={() => setActivateOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow"
          >
            <Siren size={15} />
            Activate Response
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {([
            { id:'active',  label:'Active', icon:<Activity size={13}/>, count:activeEvents.length },
            { id:'history', label:'History', icon:<History size={13}/>, count:historyEvents.length },
            { id:'trends',  label:'Trends', icon:<TrendingUp size={13}/>, count:0 },
          ] as { id:Tab; label:string; icon:React.ReactNode; count:number }[]).map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.id === 'active' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">

          {/* Active Tab */}
          {tab === 'active' && (
            <motion.div key="active" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              {activeEvents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">No active events</p>
                  <p className="text-sm text-slate-500 mt-1">All clear — no rapid response or code events in progress</p>
                  <button
                    onClick={() => setActivateOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors"
                  >
                    <Siren size={14} /> Activate Response
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeEvents.map(evt => (
                    <ActiveEventCard key={`${evt.id}-${tick}`} evt={evt} onRefresh={refresh} onToast={showGlobalToast} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div id="history-log" className="space-y-3">
                {historyEvents.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">No resolved events on record</div>
                ) : (
                  historyEvents.map(evt => <HistoryCard key={evt.id} evt={evt} />)
                )}
              </div>
            </motion.div>
          )}

          {/* Trends Tab */}
          {tab === 'trends' && (
            <motion.div key="trends" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TrendBars />

                {/* Summary stats */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <ClipboardList size={12} /> This Shift Summary
                  </p>
                  {[
                    { label:'Total calls today', value:'2', sub:'1 active, 4 resolved this shift', color:'text-red-600' },
                    { label:'Avg response time', value:'2m 10s', sub:'Physician first on scene', color:'text-violet-600' },
                    { label:'Follow-ups pending', value:'2', sub:'Cardiology + Speech consults', color:'text-amber-600' },
                    { label:'Calls this week', value:'14', sub:'+2 vs last week', color:'text-slate-700' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{s.sub}</p>
                      </div>
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* By unit breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:col-span-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MapPin size={12} /> Calls by Unit (This Week)
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { unit:'ICU',       calls:4, max:14 },
                      { unit:'ED',        calls:3, max:14 },
                      { unit:'MS-B',      calls:3, max:14 },
                      { unit:'Oncology',  calls:2, max:14 },
                      { unit:'Telemetry', calls:1, max:14 },
                      { unit:'MS-A',      calls:1, max:14 },
                    ].map(r => (
                      <div key={r.unit} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-20 shrink-0">{r.unit}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-red-400 rounded-full"
                            initial={{ width:0 }}
                            animate={{ width:`${(r.calls/r.max)*100}%` }}
                            transition={{ duration:0.5, ease:'easeOut' as const }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-4 text-right">{r.calls}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activate Modal */}
      <AnimatePresence>
        {activateOpen && (
          <ActivateModal
            onActivate={handleActivate}
            onClose={() => setActivateOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {globalToast && (
          <motion.div
            id="action-toast"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl z-50"
          >
            {globalToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
