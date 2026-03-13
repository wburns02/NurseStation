// IncidentHub.tsx — Incident & Safety Event Reporting
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Plus,
  ChevronRight,
  Send,
  FileText,
  Shield,
  TrendingDown,
  BarChart3,
  Eye,
  EyeOff,
  User,
} from 'lucide-react'
import {
  getAllIncidents,
  getStatus,
  getNotes,
  updateStatus,
  addNote,
  submitIncident,
  getIncidentSummary,
  TREND_DATA,
  TYPE_META,
  SEVERITY_META,
  STATUS_META,
  INCIDENT_TYPES,
  UNIT_OPTIONS,
  type Incident,
  type IncidentType,
  type IncidentStatus,
  type IncidentSeverity,
} from '../data/incidentData'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 60) return `${Math.round(diff)}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  return `${Math.round(diff / 1440)}d ago`
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Severity pips ────────────────────────────────────────────────────────────
function SeverityPips({ severity }: { severity: IncidentSeverity }) {
  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500']
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          className={`w-2 h-2 rounded-full ${n <= severity ? colors[severity - 1] : 'bg-slate-700'}`}
        />
      ))}
    </div>
  )
}

// ─── Trend sparkline ──────────────────────────────────────────────────────────
function TrendChart() {
  const maxVal = Math.max(...TREND_DATA.map(d => d.medication + d.fall + d.nearMiss + d.other))
  const W = 280
  const H = 80
  const pad = 8

  const lines: { key: keyof typeof TREND_DATA[0]; color: string; label: string }[] = [
    { key: 'medication', color: '#f87171', label: 'Medication' },
    { key: 'fall',       color: '#fb923c', label: 'Fall'       },
    { key: 'nearMiss',   color: '#fbbf24', label: 'Near Miss'  },
    { key: 'other',      color: '#818cf8', label: 'Other'      },
  ]

  function pts(key: keyof typeof TREND_DATA[0]) {
    return TREND_DATA.map((d, i) => {
      const x = pad + (i / (TREND_DATA.length - 1)) * (W - pad * 2)
      const y = H - pad - ((d[key] as number) / maxVal) * (H - pad * 2)
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div>
      <svg width={W} height={H} className="w-full">
        {/* Grid lines */}
        {[0, 0.5, 1].map(frac => (
          <line
            key={frac}
            x1={pad} y1={H - pad - frac * (H - pad * 2)}
            x2={W - pad} y2={H - pad - frac * (H - pad * 2)}
            stroke="#334155" strokeWidth="1" strokeDasharray="3,3"
          />
        ))}
        {/* Lines */}
        {lines.map(({ key, color }) => (
          <polyline
            key={key}
            points={pts(key)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}
        {/* Dots */}
        {lines.map(({ key, color }) =>
          TREND_DATA.map((d, i) => {
            const x = pad + (i / (TREND_DATA.length - 1)) * (W - pad * 2)
            const y = H - pad - ((d[key] as number) / maxVal) * (H - pad * 2)
            return <circle key={`${key}-${i}`} cx={x} cy={y} r="3" fill={color} />
          })
        )}
        {/* X labels */}
        {TREND_DATA.map((d, i) => (
          <text
            key={i}
            x={pad + (i / (TREND_DATA.length - 1)) * (W - pad * 2)}
            y={H - 1}
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
          >
            {d.week}
          </text>
        ))}
      </svg>
      <div className="flex gap-3 mt-2 flex-wrap">
        {lines.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Unit hotspot grid ────────────────────────────────────────────────────────
function UnitHeatmap({ incidents }: { incidents: Incident[] }) {
  const units = ['ICU', 'CCU', 'ED', 'MS-A', 'MS-B', 'ONC', 'NICU', 'PACU', 'Ortho', 'Tele']
  const unitMap: Record<string, string[]> = {
    'ICU': ['ICU'], 'CCU': ['CCU'], 'ED': ['ED'],
    'MS-A': ['Med-Surg A'], 'MS-B': ['Med-Surg B'],
    'ONC': ['Oncology'], 'NICU': ['NICU'], 'PACU': ['PACU'],
    'Ortho': ['Ortho'], 'Tele': ['Telemetry'],
  }
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {units.map(unit => {
        const count = incidents.filter(i => unitMap[unit]?.some(u => i.unit.includes(u)) || i.unitShort === unit).length
        const intensity = count === 0 ? 'bg-slate-800 text-slate-600'
          : count === 1 ? 'bg-amber-500/20 text-amber-300'
          : count <= 3 ? 'bg-orange-500/25 text-orange-300'
          : 'bg-red-500/30 text-red-300'
        return (
          <div key={unit} id={`heatmap-${unit.toLowerCase()}`} className={`rounded-lg p-2 text-center ${intensity}`}>
            <p className="text-[10px] font-bold">{unit}</p>
            <p className="text-lg font-bold leading-tight">{count}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [type, setType] = useState<IncidentType>('medication-error')
  const [severity, setSeverity] = useState<IncidentSeverity>(2)
  const [unit, setUnit] = useState('ICU')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [immediateActions, setImmediateActions] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    submitIncident({
      type, severity, unit,
      unitShort: unit.replace('Med-Surg ', 'MS-').toUpperCase().slice(0, 5),
      location: location || 'Not specified',
      title: title.trim(),
      description: description.trim(),
      immediateActions: immediateActions.trim() || 'None documented at time of report.',
      reportedBy: isAnonymous ? null : 'Janet Morrison',
      reportedByInitials: isAnonymous ? null : 'JM',
      involvedPatient: null,
    })
    setSubmitted(true)
    setTimeout(() => { onSubmitted(); onClose() }, 1400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        id="submit-incident-modal"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Report Safety Event</h2>
            <p className="text-slate-400 text-xs mt-0.5">JCAHO-compliant documentation</p>
          </div>
          <button onClick={onClose} aria-label="Close submit modal" className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-bold text-lg">Incident Reported</p>
            <p className="text-slate-400 text-sm mt-1">Supervisor notified. Reference # assigned.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Incident type */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Incident Type *</label>
              <div className="grid grid-cols-2 gap-1.5">
                {INCIDENT_TYPES.map(t => {
                  const meta = TYPE_META[t]
                  return (
                    <button
                      key={t}
                      type="button"
                      id={`type-${t}`}
                      onClick={() => setType(t)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                        type === t
                          ? `${meta.bg} ${meta.color} border-current/40`
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-sm">{meta.icon}</span>
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">
                Severity Level *
                <span className={`ml-2 font-normal ${SEVERITY_META[severity].color}`}>
                  {severity} — {SEVERITY_META[severity].label}
                </span>
              </label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as IncidentSeverity[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    aria-label={`Severity ${s}`}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                      severity === s
                        ? `${SEVERITY_META[s].bg} ${SEVERITY_META[s].color} border-current/40`
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit + location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Unit *</label>
                <select
                  id="incident-unit"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Location</label>
                <input
                  id="incident-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Room, hallway, etc."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Event Title *</label>
              <input
                id="incident-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief description of what occurred"
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Detailed Description *</label>
              <textarea
                id="incident-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened? Who was involved? What was the outcome?"
                required
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Immediate actions */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Immediate Actions Taken</label>
              <textarea
                id="incident-immediate-actions"
                value={immediateActions}
                onChange={e => setImmediateActions(e.target.value)}
                placeholder="What was done immediately after the event?"
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center gap-2">
                {isAnonymous ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {isAnonymous ? 'Anonymous Report' : 'Attributed Report'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAnonymous ? 'Your identity will not be recorded' : 'Report attributed to Janet Morrison'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="anonymous-toggle"
                onClick={() => setIsAnonymous(a => !a)}
                aria-label="Toggle anonymous"
                className={`relative w-10 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-violet-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              type="submit"
              aria-label="Submit incident report"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Send size={15} />
              Submit Safety Report
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ incident, onClose, onRefresh }: {
  incident: Incident; onClose: () => void; onRefresh: () => void
}) {
  const [noteText, setNoteText] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteJustSent, setNoteJustSent] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(getStatus(incident))

  const status = getStatus(incident)
  const statusMeta = STATUS_META[status]
  const typeMeta = TYPE_META[incident.type]
  const severityMeta = SEVERITY_META[incident.severity]
  const notes = getNotes(incident)

  function handleStatusChange(s: IncidentStatus) {
    setSelectedStatus(s)
    updateStatus(incident.id, s)
    onRefresh()
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    setNoteSubmitting(true)
    setTimeout(() => {
      addNote(incident.id, 'Janet Morrison', noteText.trim())
      setNoteText('')
      setNoteSubmitting(false)
      setNoteJustSent(true)
      setTimeout(() => setNoteJustSent(false), 2000)
      onRefresh()
    }, 500)
  }

  const statusOptions: IncidentStatus[] = ['submitted', 'investigating', 'resolved', 'escalated', 'closed']

  return (
    <motion.div
      id="incident-detail-panel"
      initial={{ x: 32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 32, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/50 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xl`}>{typeMeta.icon}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeMeta.bg} ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 className="text-white font-bold text-sm mt-2 leading-tight">{incident.title}</h2>
            <p className="text-slate-400 text-xs mt-0.5">{incident.unit} · {incident.location}</p>
          </div>
          <button onClick={onClose} aria-label="Close incident detail" className="text-slate-400 hover:text-white transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <SeverityPips severity={incident.severity} />
          <span className={`text-xs font-semibold ${severityMeta.color}`}>Severity {incident.severity} — {severityMeta.label}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">{fmtDate(incident.occurredAt)} {fmtTime(incident.occurredAt)}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {incident.reportedBy ? (
            <><User size={11} /><span>Reported by <span className="text-slate-300">{incident.reportedBy}</span></span></>
          ) : (
            <><EyeOff size={11} /><span className="text-slate-400">Anonymous report</span></>
          )}
          <span>·</span>
          <span>{timeAgo(incident.reportedAt)}</span>
          <span>·</span>
          <span className="text-slate-400">JCAHO: {incident.jcahoCategory}</span>
        </div>

        {/* Status change */}
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 mb-1.5">Update status:</p>
          <div className="flex gap-1 flex-wrap">
            {statusOptions.map(s => {
              const sm = STATUS_META[s]
              return (
                <button
                  key={s}
                  aria-label={`Set status ${s}`}
                  onClick={() => handleStatusChange(s)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                    selectedStatus === s
                      ? `${sm.bg} ${sm.color} border-current/40`
                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {sm.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Description */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
          <p className="text-sm text-slate-300 leading-relaxed">{incident.description}</p>
        </div>

        {/* Immediate actions */}
        {incident.immediateActions && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Immediate Actions</p>
            <p className="text-sm text-slate-300 leading-relaxed">{incident.immediateActions}</p>
          </div>
        )}

        {/* Root cause + prevention */}
        {incident.rootCause && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Root Cause</p>
            <p className="text-xs text-slate-300 leading-relaxed">{incident.rootCause}</p>
            {incident.preventionMeasures && (
              <>
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mt-2 mb-1">Prevention</p>
                <p className="text-xs text-slate-300 leading-relaxed">{incident.preventionMeasures}</p>
              </>
            )}
          </div>
        )}

        {/* Witnesses */}
        {incident.witnesses.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Witnesses</p>
            <div className="flex gap-2 flex-wrap">
              {incident.witnesses.map(w => (
                <span key={w} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">{w}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Investigation Notes ({notes.length})
          </p>
          {notes.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No notes yet. Add the first one below.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">{note.author}</span>
                    <span className="text-[10px] text-slate-500">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note */}
        <form onSubmit={handleAddNote} className="space-y-2">
          <textarea
            id="note-input"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add investigation note…"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
          />
          <button
            type="submit"
            aria-label="Add note"
            disabled={noteSubmitting || !noteText.trim()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              noteJustSent
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : noteSubmitting
                ? 'bg-violet-600/50 text-violet-300 cursor-wait'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {noteJustSent ? <><CheckCircle2 size={14} /> Note Added!</> : noteSubmitting ? 'Saving…' : <><Send size={14} /> Add Note</>}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

// ─── Incident Card ─────────────────────────────────────────────────────────────
function IncidentCard({ incident, selected, onClick }: {
  incident: Incident; selected: boolean; onClick: () => void
}) {
  const status = getStatus(incident)
  const statusMeta = STATUS_META[status]
  const typeMeta = TYPE_META[incident.type]
  const severityMeta = SEVERITY_META[incident.severity]
  const isOpen = ['submitted', 'investigating', 'escalated'].includes(status)

  return (
    <motion.button
      data-id={`incident-card-${incident.id}`}
      layout
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        selected
          ? 'bg-violet-600/10 border-violet-500/40'
          : isOpen
          ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 opacity-75'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type icon + severity ring */}
        <div className={`w-9 h-9 rounded-xl ${typeMeta.bg} flex items-center justify-center text-lg shrink-0 ring-1 ${selected ? 'ring-violet-500/40' : severityMeta.ring}`}>
          {typeMeta.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white truncate leading-tight">{incident.title}</p>
            {selected && <ChevronRight size={13} className="text-violet-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">{incident.unitShort}</span>
            <span className="text-slate-700">·</span>
            <span className={`text-[10px] font-semibold ${typeMeta.color}`}>{typeMeta.label}</span>
            <span className="text-slate-700">·</span>
            <SeverityPips severity={incident.severity} />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
              <span className={`w-1 h-1 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            <span className="text-[10px] text-slate-500 ml-auto">{timeAgo(incident.reportedAt)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'open' | 'resolved' | 'escalated'
type TypeFilter = 'all' | IncidentType

export default function IncidentHub() {
  const [incidents, setIncidents] = useState(getAllIncidents)
  const [selectedId, setSelectedId] = useState<string | null>('inc-001')
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterKey>('all')
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [tab, setTab] = useState<'list' | 'trends'>('list')

  const summary = getIncidentSummary()

  function refresh() {
    setIncidents([...getAllIncidents()])
  }

  const selected = incidents.find(i => i.id === selectedId) ?? null

  const filtered = incidents.filter(i => {
    const s = getStatus(i)
    const statusOk = filterStatus === 'all' ? true
      : filterStatus === 'open' ? ['submitted', 'investigating'].includes(s)
      : filterStatus === 'resolved' ? ['resolved', 'closed'].includes(s)
      : s === 'escalated'
    const typeOk = filterType === 'all' || i.type === filterType
    return statusOk && typeOk
  })

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Incident & Safety Hub</h1>
            <p className="text-slate-400 text-sm mt-0.5">JCAHO-compliant event reporting · Real-time investigation tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              aria-label="Export JCAHO report"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold px-3.5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <FileText size={15} />
              Export
            </motion.button>
            <motion.button
              aria-label="Report new incident"
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-red-900/30"
            >
              <Plus size={16} />
              Report Incident
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'stat-open',       icon: AlertTriangle, label: 'Open',           value: summary.open,           color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
            { id: 'stat-today',      icon: Clock,         label: 'Reported Today', value: summary.today,          color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
            { id: 'stat-critical',   icon: AlertTriangle, label: 'Sev 4–5',        value: summary.critical,       color: 'text-red-400',     bg: 'bg-red-500/10'     },
            { id: 'stat-resolution', icon: CheckCircle2,  label: 'Resolution Rate',value: `${summary.resolutionRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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
        {/* Left panel — list + trends */}
        <div className="w-[380px] border-r border-slate-800 flex flex-col shrink-0">
          {/* Tab bar */}
          <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-slate-800 shrink-0">
            <button
              aria-label="Tab Incidents"
              onClick={() => setTab('list')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${tab === 'list' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Shield size={12} />
              Incidents
              <span className={`text-[10px] px-1.5 rounded-full ${tab === 'list' ? 'bg-white/20' : 'bg-slate-700'}`}>
                {incidents.length}
              </span>
            </button>
            <button
              aria-label="Tab Trends"
              onClick={() => setTab('trends')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${tab === 'trends' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <BarChart3 size={12} />
              Trends
            </button>
          </div>

          {tab === 'list' ? (
            <>
              {/* Filters */}
              <div className="px-3 py-2 border-b border-slate-800 space-y-2 shrink-0">
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'open', 'resolved', 'escalated'] as FilterKey[]).map(k => (
                    <button
                      key={k}
                      aria-label={`Filter status ${k}`}
                      onClick={() => setFilterStatus(k)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all capitalize ${
                        filterStatus === k ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {k === 'all' ? 'All' : k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>
                <select
                  aria-label="Filter by type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as TypeFilter)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500"
                >
                  <option value="all">All Types</option>
                  {INCIDENT_TYPES.map(t => (
                    <option key={t} value={t}>{TYPE_META[t].label}</option>
                  ))}
                </select>
              </div>

              {/* Incident list */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                <AnimatePresence mode="popLayout">
                  {filtered.map(i => (
                    <IncidentCard
                      key={i.id}
                      incident={i}
                      selected={selectedId === i.id}
                      onClick={() => setSelectedId(i.id)}
                    />
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Shield size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No incidents in this view</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Trends view */
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={15} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-200">30-Day Incident Trend</span>
                </div>
                <TrendChart />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={15} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-200">Incidents by Unit</span>
                </div>
                <UnitHeatmap incidents={incidents} />
              </div>

              {/* Type breakdown */}
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-3">By Type (All Time)</p>
                <div className="space-y-1.5">
                  {INCIDENT_TYPES.map(t => {
                    const count = incidents.filter(i => i.type === t).length
                    if (count === 0) return null
                    const meta = TYPE_META[t]
                    const pct = Math.round((count / incidents.length) * 100)
                    return (
                      <div key={t} className="flex items-center gap-2">
                        <span className="text-sm">{meta.icon}</span>
                        <span className="text-[11px] text-slate-400 w-28 shrink-0 truncate">{meta.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' as const }}
                            className={`h-full rounded-full ${meta.color.replace('text-', 'bg-').replace('-400', '-500')}`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 w-5 text-right shrink-0">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <DetailPanel
                key={selected.id}
                incident={selected}
                onClose={() => setSelectedId(null)}
                onRefresh={refresh}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-slate-500"
              >
                <Shield size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Select an incident to investigate</p>
                <p className="text-xs mt-1 text-slate-600">Click any card on the left to view details</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-6 flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Plus size={15} />
                  Report New Incident
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Submit modal */}
      <AnimatePresence>
        {showModal && (
          <SubmitModal onClose={() => setShowModal(false)} onSubmitted={refresh} />
        )}
      </AnimatePresence>
    </div>
  )
}
