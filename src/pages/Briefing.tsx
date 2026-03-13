import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, FileText, CheckSquare, AlertTriangle,
  CheckCircle2, Clock, Users, BedDouble, Shield, PhoneCall,
  ChevronDown, ChevronRight, Pin, X, Send,
  Bell, Plus, Star, Activity, Edit3, Copy,
} from 'lucide-react'
import {
  getAnnouncements, getSbarNotes, getShiftStaff, getShiftBrief,
  postAnnouncement, saveSbarNote, acknowledgeAnnouncement, acknowledgeSbar, acknowledgeBrief,
  BRIEF_TEMPLATES, PRIORITY_META, TYPE_META,
  type Announcement, type SbarNote, type AnnouncementType,
} from '../data/briefingData'

// ── helpers ───────────────────────────────────────────────────────────────────

function StaffAvatar({ name, initials, color, size = 'md' }: { name: string; initials: string; color: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <div title={name} className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

function AckBar({ acked, total }: { acked: number; total: number }) {
  const pct = total > 0 ? Math.round((acked / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:0.6, ease:'easeOut' as const }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 w-12 text-right">{acked}/{total}</span>
    </div>
  )
}

// ── Auto-Generated Shift Brief ─────────────────────────────────────────────────

function ShiftBriefPanel() {
  const brief = getShiftBrief()
  const [expanded, setExpanded] = useState(true)

  return (
    <div id="auto-brief" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Activity size={18} className="shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">Auto-Generated Shift Brief</p>
          <p className="text-[11px] text-violet-200">{brief.date} · {brief.shift} · Generated {brief.generatedAt}</p>
        </div>
        <Star size={14} className="opacity-60" />
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden"
          >
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
              {[
                { id:'brief-stat-staffing', label:'Staffing', value:`${brief.staffing.onDuty}/${brief.staffing.expected}`, sub:`${brief.staffing.callOuts} call-outs`, icon:<Users size={14}/>, color:'text-violet-600', bg:'bg-white' },
                { id:'brief-stat-census',   label:'Census',   value:`${brief.census.total}/${brief.census.capacity}`, sub:`${brief.census.pendingAdmits} pending`, icon:<BedDouble size={14}/>, color:'text-sky-600', bg:'bg-white' },
                { id:'brief-stat-safety',   label:'Safety',   value:brief.safety.blockedNurses, sub:`nurses blocked`, icon:<Shield size={14}/>, color:'text-red-600', bg:'bg-white' },
                { id:'brief-stat-oncall',   label:'On-Call',  value:brief.onCall.activeActivations, sub:`active now`, icon:<PhoneCall size={14}/>, color:'text-emerald-600', bg:'bg-white' },
              ].map(s => (
                <div key={s.id} id={s.id} className={`${s.bg} p-3 flex items-start gap-2.5`}>
                  <div className={`mt-0.5 ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</p>
                    <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Key highlights */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2.5">Today's Key Highlights</p>
              <div className="space-y-2">
                {brief.highlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity:0, x:-8 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.06, ease:'easeOut' as const }}
                    data-id={`highlight-${i}`}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 ${
                      i === 0 ? 'bg-red-50 border border-red-200' :
                      i === 1 ? 'bg-amber-50 border border-amber-200' :
                      i === 2 || i === 3 ? 'bg-orange-50 border border-orange-200' :
                      'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${i <= 1 ? 'text-red-500' : i <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {i === 0 ? <AlertTriangle size={13}/> : i <= 1 ? <AlertTriangle size={13}/> : <ChevronRight size={13}/>}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{h}</p>
                  </motion.div>
                ))}
              </div>

              {/* On-call active status */}
              {brief.onCall.activeActivations > 0 && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2.5">
                  <PhoneCall size={14} className="text-violet-600 shrink-0" />
                  <p className="text-xs text-violet-700">
                    <span className="font-bold">{brief.onCall.activatedNurse}</span> currently on-call activated for{' '}
                    <span className="font-bold">{brief.onCall.activatedUnit}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Announcement Card ──────────────────────────────────────────────────────────

function AnnouncementCard({ ann, onAck }: { ann: Announcement; onAck: (id: string) => void }) {
  const [expanded, setExpanded] = useState(ann.pinned)
  const meta = TYPE_META[ann.type]
  const alreadyAcked = ann.acknowledgedBy.includes('jm-001')

  return (
    <motion.div
      layout
      data-id={`announcement-${ann.id}`}
      className={`rounded-2xl border-2 bg-white shadow-sm ${
        ann.type === 'urgent' ? 'border-red-300' :
        ann.type === 'safety' ? 'border-orange-300' :
        ann.type === 'policy' ? 'border-violet-200' :
        ann.pinned ? 'border-sky-200' : 'border-slate-200'
      } overflow-hidden`}
    >
      {/* Header */}
      <button
        className={`w-full flex items-start gap-3 px-4 py-3 text-left ${meta.bg} hover:opacity-90 transition-opacity`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-lg leading-none mt-0.5">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
              {meta.label}
            </span>
            {ann.pinned && <Pin size={10} className="text-slate-400" />}
            <span className="text-[10px] text-slate-400">{ann.unit === 'All' ? '🏥 All Staff' : ann.unit} · {ann.postedAt}</span>
          </div>
          <p className={`text-sm font-bold ${meta.color} truncate`}>{ann.title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{ann.author} · {ann.authorRole}</p>
        </div>
        <ChevronDown size={15} className={`text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{ann.body}</p>

              {/* Ack section */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 mb-1">Acknowledgment</p>
                  <AckBar acked={ann.acknowledgedBy.length} total={ann.totalRecipients} />
                </div>
                {!alreadyAcked ? (
                  <button
                    aria-label={`Acknowledge announcement ${ann.id}`}
                    onClick={() => onAck(ann.id)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-violet-600 text-white px-3 py-2 rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    <CheckSquare size={13} />
                    Acknowledge
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                    <CheckCircle2 size={13} />
                    Acknowledged
                  </div>
                )}
              </div>

              {/* Ack'd by avatars */}
              {ann.acknowledgedBy.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {getShiftStaff().filter(s => ann.acknowledgedBy.includes(s.id)).map(s => (
                    <StaffAvatar key={s.id} name={s.name} initials={s.initials} color={s.color} size="sm" />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">read it</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Compose Announcement ───────────────────────────────────────────────────────

function ComposeModal({ onClose, onPost }: { onClose: () => void; onPost: (a: Announcement) => void }) {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [type, setType]     = useState<AnnouncementType>('info')
  const [unit, setUnit]     = useState('All')
  const [template, setTemplate] = useState<string | null>(null)

  function applyTemplate(tmplId: string) {
    const t = BRIEF_TEMPLATES.find(t => t.id === tmplId)
    if (t) { setBody(t.body); setTemplate(tmplId); setTitle(t.name) }
  }

  function handlePost() {
    if (!title.trim() || !body.trim()) return
    const ann = postAnnouncement({
      type, title: title.trim(), body: body.trim(),
      author:'Janet Morrison', authorRole:'Staffing Coordinator',
      unit, pinned: type === 'urgent',
      totalRecipients:15, expiresAt: undefined,
    })
    onPost(ann)
    onClose()
  }

  const types: AnnouncementType[] = ['urgent','safety','policy','info','reminder']

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
    >
      <motion.div
        id="compose-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale:0.93, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.93, y:16 }}
        transition={{ type:'spring', stiffness:400, damping:32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-violet-600" />
            <h2 className="text-sm font-bold text-slate-800">New Announcement</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Templates</p>
            <div className="flex gap-2 flex-wrap">
              {BRIEF_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  data-id={`template-${t.id}`}
                  onClick={() => applyTemplate(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    template === t.id
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type</p>
            <div className="flex gap-2 flex-wrap">
              {types.map(t => (
                <button
                  key={t}
                  id={`ann-type-${t}`}
                  onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                    type === t ? `${TYPE_META[t].bg} ${TYPE_META[t].color} ${TYPE_META[t].border}` : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {TYPE_META[t].icon} {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Send To</label>
            <select
              id="ann-unit-select"
              value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-violet-400"
            >
              <option>All</option>
              <option>ICU</option><option>CCU</option><option>ED</option>
              <option>MS-A</option><option>MS-B</option><option>Oncology</option><option>Telemetry</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject *</label>
            <input
              id="ann-title-input"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Brief, clear title for the announcement…"
              value={title} onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message *</label>
            <textarea
              id="ann-body-input"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              rows={5}
              placeholder="Full announcement text…"
              value={body} onChange={e => setBody(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            aria-label="Send announcement"
            onClick={handlePost}
            disabled={!title.trim() || !body.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Send size={14} />
            Post to {unit === 'All' ? 'All Staff' : unit}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── SBAR Note Card ─────────────────────────────────────────────────────────────

function SbarCard({ note, onAck }: { note: SbarNote; onAck: (id: string) => void }) {
  const [expanded, setExpanded] = useState(note.priority === 'critical')
  const pm = PRIORITY_META[note.priority]

  return (
    <motion.div
      layout
      data-id={`sbar-note-${note.id}`}
      className={`rounded-2xl border-2 bg-white shadow-sm overflow-hidden ${pm.border}`}
    >
      <button
        className={`w-full flex items-start gap-3 px-4 py-3 text-left ${pm.bg} hover:opacity-95 transition-opacity`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`w-2 h-2 rounded-full ${pm.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase ${pm.color}`}>{pm.label}</span>
            {note.patientRoom && (
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Room {note.patientRoom} {note.patientName && `· ${note.patientName}`}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{note.unit} · {note.createdAt}</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            S: {note.situation.slice(0, 70)}{note.situation.length > 70 ? '…' : ''}
          </p>
          <p className="text-[10px] text-slate-500">{note.author} · {note.authorRole}</p>
        </div>
        <ChevronDown size={15} className={`text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3 border-t border-slate-100">
              {[
                { key:'S', label:'Situation',      text:note.situation },
                { key:'B', label:'Background',     text:note.background },
                { key:'A', label:'Assessment',     text:note.assessment },
                { key:'R', label:'Recommendation', text:note.recommendation },
              ].map(({ key, label, text }) => (
                <div key={key} className="flex gap-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {key}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}

              {/* Shared with */}
              {note.sharedWith.length > 0 && (
                <p className="text-[10px] text-slate-400">
                  Shared with: {note.sharedWith.join(', ')}
                </p>
              )}

              {/* Acknowledge */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {!note.acknowledged ? (
                  <button
                    aria-label={`Acknowledge SBAR ${note.id}`}
                    onClick={() => onAck(note.id)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <CheckSquare size={13} />
                    Acknowledge
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={13} />
                    Acknowledged
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── SBAR Composer ──────────────────────────────────────────────────────────────

function SbarComposer({ onSave }: { onSave: (n: SbarNote) => void }) {
  const [open, setOpen] = useState(false)
  const [situation,      setSituation]      = useState('')
  const [background,     setBackground]     = useState('')
  const [assessment,     setAssessment]     = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [room,           setRoom]           = useState('')
  const [patient,        setPatient]        = useState('')
  const [priority, setPriority] = useState<'routine'|'urgent'|'critical'>('routine')
  const [unit,     setUnit]     = useState('ICU')

  function handleSave() {
    if (!situation.trim() || !assessment.trim() || !recommendation.trim()) return
    const note = saveSbarNote({
      patientRoom: room || undefined,
      patientName: patient || undefined,
      category: 'handoff',
      situation: situation.trim(),
      background: background.trim(),
      assessment: assessment.trim(),
      recommendation: recommendation.trim(),
      author:'Janet Morrison', authorRole:'Staffing Coordinator',
      unit, sharedWith:[], priority,
    })
    onSave(note)
    setSituation(''); setBackground(''); setAssessment(''); setRecommendation('')
    setRoom(''); setPatient('')
    setOpen(false)
  }

  return (
    <div id="sbar-composer" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        aria-label="Toggle SBAR composer"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
          <Edit3 size={15} className="text-violet-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">New SBAR Note</p>
          <p className="text-xs text-slate-500">Structured clinical communication</p>
        </div>
        <Plus size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-45' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-5 space-y-3">
              {/* Priority & Unit row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Priority</label>
                  <select id="sbar-priority" value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit</label>
                  <select id="sbar-unit" value={unit} onChange={e => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {['ICU','CCU','ED','MS-A','MS-B','Oncology','Telemetry'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Room / Patient */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Room</label>
                  <input id="sbar-room" value={room} onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. 401A" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient</label>
                  <input id="sbar-patient" value={patient} onChange={e => setPatient(e.target.value)}
                    placeholder="Last, F." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400" />
                </div>
              </div>

              {/* SBAR fields */}
              {[
                { id:'sbar-situation',      label:'S — Situation *',      val:situation,      set:setSituation,      placeholder:'What is happening right now?' },
                { id:'sbar-background',     label:'B — Background',        val:background,     set:setBackground,     placeholder:'Relevant history, context…' },
                { id:'sbar-assessment',     label:'A — Assessment *',      val:assessment,     set:setAssessment,     placeholder:'Your clinical assessment…' },
                { id:'sbar-recommendation', label:'R — Recommendation *',  val:recommendation, set:setRecommendation, placeholder:'What action is needed?' },
              ].map(({ id, label, val, set, placeholder }) => (
                <div key={id}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</label>
                  <textarea
                    id={id}
                    rows={2}
                    value={val} onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  aria-label="Save SBAR note"
                  onClick={handleSave}
                  disabled={!situation.trim() || !assessment.trim() || !recommendation.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={14} />
                  Save SBAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Acknowledgment Tracker ────────────────────────────────────────────────────

function AckTracker() {
  const staff = getShiftStaff()
  const acked  = staff.filter(s => s.ackBrief)
  const pending= staff.filter(s => !s.ackBrief)
  const pct    = Math.round(acked.length / staff.length * 100)

  return (
    <div id="ack-tracker" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <CheckSquare size={15} className="text-emerald-700" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Brief Acknowledgments</h3>
          <p className="text-xs text-slate-500">Who has read today's shift brief</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-xl font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
          <p className="text-[10px] text-slate-400">{acked.length}/{staff.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
          initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:0.7, ease:'easeOut' as const }}
        />
      </div>

      {/* Acknowledged */}
      {acked.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Acknowledged ({acked.length})</p>
          <div className="space-y-1.5">
            {acked.map(s => (
              <div key={s.id} data-id={`ack-staff-${s.id}`} className="flex items-center gap-2.5">
                <StaffAvatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.unit} · {s.role}</p>
                </div>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2">Awaiting ({pending.length})</p>
          <div className="space-y-1.5">
            {pending.map(s => (
              <div key={s.id} data-id={`ack-staff-${s.id}`} className="flex items-center gap-2.5 opacity-60">
                <StaffAvatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.unit} · {!s.arrived ? '⚠ Not arrived' : 'Not read'}</p>
                </div>
                <Clock size={11} className="text-amber-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        aria-label="Send brief reminder"
        className="w-full mt-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Bell size={12} />
        Send Reminder to {pending.length} Pending
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabId = 'brief' | 'announce' | 'sbar' | 'ack'

export default function Briefing() {
  const [tab, setTab]         = useState<TabId>('brief')
  const [showCompose, setShowCompose] = useState(false)
  const [announcements, setAnnouncements] = useState(() => getAnnouncements())
  const [sbarNotes, setSbarNotes]         = useState(() => getSbarNotes())
  const [toast, setToast]     = useState<string | null>(null)
  const [annFilter, setAnnFilter] = useState<'all' | AnnouncementType>('all')

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3800)
  }

  function handleAck(annId: string) {
    acknowledgeAnnouncement(annId, 'jm-001')
    setAnnouncements([...getAnnouncements()])
    showToast('Announcement acknowledged ✓')
  }

  function handleSbarAck(noteId: string) {
    acknowledgeSbar(noteId)
    setSbarNotes([...getSbarNotes()])
    showToast('SBAR note acknowledged ✓')
  }

  function handlePost(ann: Announcement) {
    setAnnouncements([...getAnnouncements()])
    showToast(`Announcement posted to ${ann.unit === 'All' ? 'all staff' : ann.unit}`)
    setTab('announce')
  }

  function handleSbarSave(note: SbarNote) {
    setSbarNotes([...getSbarNotes()])
    showToast(`SBAR note saved — ${note.priority} priority`)
  }

  function handleBriefAck() {
    acknowledgeBrief('jm-001')
    showToast('Shift brief acknowledged ✓')
  }

  const filteredAnn = annFilter === 'all'
    ? announcements
    : announcements.filter(a => a.type === annFilter)

  const unreadAnn  = announcements.filter(a => !a.acknowledgedBy.includes('jm-001')).length
  const critSbar   = sbarNotes.filter(s => s.priority === 'critical' && !s.acknowledged).length

  const TABS = [
    { id:'brief'    as TabId, label:'Shift Brief', icon:<Activity size={14}/>,   badge:0 },
    { id:'announce' as TabId, label:'Broadcasts',  icon:<Megaphone size={14}/>,  badge:unreadAnn },
    { id:'sbar'     as TabId, label:'SBAR Notes',  icon:<FileText size={14}/>,   badge:critSbar },
    { id:'ack'      as TabId, label:'Acknowledgments', icon:<CheckSquare size={14}/>, badge:0 },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Megaphone size={20} className="text-violet-600" />
              <h1 className="text-xl font-bold text-slate-900">Shift Briefing & Broadcast</h1>
            </div>
            <p className="text-sm text-slate-500">Team communications · Day Shift 07:00 · Mercy General · Fri Mar 13, 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBriefAck}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <CheckCircle2 size={13} />
              Ack Brief
            </button>
            <button
              aria-label="Compose new announcement"
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
            >
              <Plus size={13} />
              New Announcement
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
          {TABS.map(({ id, label, icon, badge }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}
              {label}
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.16, ease:'easeOut' as const }}
          >

            {/* ── SHIFT BRIEF TAB ── */}
            {tab === 'brief' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  <ShiftBriefPanel />

                  {/* Pinned announcements preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Pin size={14} className="text-violet-500" />
                        Pinned Announcements
                      </h2>
                      <button onClick={() => setTab('announce')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                        All ({announcements.length}) <ChevronRight size={12}/>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {announcements.filter(a => a.pinned).map(ann => (
                        <AnnouncementCard key={ann.id} ann={ann} onAck={handleAck} />
                      ))}
                    </div>
                  </div>

                  {/* Critical SBAR preview */}
                  {sbarNotes.filter(n => n.priority === 'critical').length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-500" />
                          Critical SBAR Notes
                        </h2>
                        <button onClick={() => setTab('sbar')} className="text-xs text-violet-600 font-semibold flex items-center gap-1">
                          All SBAR <ChevronRight size={12}/>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {sbarNotes.filter(n => n.priority === 'critical').map(n => (
                          <SbarCard key={n.id} note={n} onAck={handleSbarAck} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <AckTracker />

                  {/* Quick stats */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Today's Communication</h3>
                    <div className="space-y-2">
                      {[
                        { label:'Announcements', value:announcements.length, icon:<Megaphone size={13}/>, color:'text-violet-600' },
                        { label:'Unread by you', value:unreadAnn, icon:<Bell size={13}/>, color:unreadAnn > 0 ? 'text-amber-600' : 'text-emerald-600' },
                        { label:'SBAR Notes', value:sbarNotes.length, icon:<FileText size={13}/>, color:'text-sky-600' },
                        { label:'Critical SBAR', value:critSbar, icon:<AlertTriangle size={13}/>, color:critSbar > 0 ? 'text-red-600' : 'text-emerald-600' },
                      ].map(({ label, value, icon, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 ${color}`}>
                            {icon}
                            <span className="text-xs text-slate-600">{label}</span>
                          </div>
                          <span className={`text-sm font-bold ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Templates quick access */}
                  <div id="templates-panel" className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800">Quick Templates</h3>
                      <button onClick={() => setShowCompose(true)} className="text-xs text-violet-600 font-semibold">Use →</button>
                    </div>
                    <div className="space-y-1.5">
                      {BRIEF_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          data-id={`template-${t.id}`}
                          onClick={() => setShowCompose(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition-colors text-left"
                        >
                          <span className="text-sm leading-none">{t.icon}</span>
                          <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                          <Copy size={11} className="text-slate-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ANNOUNCEMENTS TAB ── */}
            {tab === 'announce' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-700">All Broadcasts</h2>
                  {/* Filter pills */}
                  <div className="flex gap-1.5 flex-wrap ml-2">
                    {(['all','urgent','safety','policy','info','reminder'] as const).map(f => (
                      <button
                        key={f}
                        id={`ann-filter-${f}`}
                        onClick={() => setAnnFilter(f)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                          annFilter === f
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {f === 'all' ? `All (${announcements.length})` : TYPE_META[f]?.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>
                <div id="announcements-board" className="space-y-3">
                  {filteredAnn.map(ann => (
                    <AnnouncementCard key={ann.id} ann={ann} onAck={handleAck} />
                  ))}
                  {filteredAnn.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No {annFilter} announcements</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SBAR TAB ── */}
            {tab === 'sbar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  <SbarComposer onSave={handleSbarSave} />
                  <div id="sbar-list" className="space-y-3">
                    {sbarNotes.map(n => (
                      <SbarCard key={n.id} note={n} onAck={handleSbarAck} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">SBAR Guide</h3>
                    {[
                      { key:'S', label:'Situation',      tip:'What is happening right now? State the problem clearly in 1–2 sentences.' },
                      { key:'B', label:'Background',     tip:'Relevant clinical history, admitting diagnosis, current orders, recent changes.' },
                      { key:'A', label:'Assessment',     tip:'Your clinical judgment — what do you think is going on?' },
                      { key:'R', label:'Recommendation', tip:'What do you need? What action should be taken?' },
                    ].map(({ key, label, tip }) => (
                      <div key={key} className="flex gap-3 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {key}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{label}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{tip}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        TJC standard: SBAR communication reduces handoff errors by up to 70% (AHRQ 2023)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACK TAB ── */}
            {tab === 'ack' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AckTracker />
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Announcement Read Receipts</h3>
                  <div className="space-y-3">
                    {announcements.slice(0,4).map(ann => {
                      const meta = TYPE_META[ann.type]
                      return (
                        <div key={ann.id} className={`rounded-xl border p-3 ${meta.bg} ${meta.border}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">{meta.icon}</span>
                            <p className={`text-xs font-bold ${meta.color} truncate flex-1`}>{ann.title}</p>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {ann.acknowledgedBy.length}/{ann.totalRecipients}
                            </span>
                          </div>
                          <AckBar acked={ann.acknowledgedBy.length} total={ann.totalRecipients} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal onClose={() => setShowCompose(false)} onPost={handlePost} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="action-toast"
            initial={{ opacity:0, y:24, scale:0.96 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:24, scale:0.96 }}
            transition={{ ease:'easeOut' as const }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
