import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, BedDouble, ArrowDownToLine, ArrowUpFromLine,
  ArrowRightLeft, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronRight, Users, TrendingUp,
  Shield, Zap, RefreshCw, Filter, MapPin,
  X, Thermometer,
} from 'lucide-react'
import {
  getUnitCensus, getHospitalStats, getAdtEvents, getPatientsByUnit, getBedsByUnit,
  markDischargeReady, updateAcuity, requestFloat,
  UNIT_COLORS, UNITS_ORDER,
  type UnitCensus, type UnitKey, type AdtEvent, type Patient, type Acuity,
} from '../data/censusData'

// ── helpers ───────────────────────────────────────────────────────────────────

function acuityColor(a: number): string {
  if (a >= 5) return 'bg-red-500 text-white'
  if (a >= 4) return 'bg-orange-500 text-white'
  if (a >= 3) return 'bg-amber-400 text-white'
  if (a >= 2) return 'bg-yellow-300 text-slate-800'
  return 'bg-emerald-400 text-white'
}

function dispositionMeta(d: string) {
  if (d === 'discharge-today')    return { label:'DC Today',    color:'bg-emerald-100 text-emerald-700' }
  if (d === 'pending-discharge')  return { label:'Pending DC',  color:'bg-sky-100 text-sky-700' }
  if (d === 'transfer-out')       return { label:'Transfer Out',color:'bg-teal-100 text-teal-700' }
  if (d === 'upgrade')            return { label:'Upgrade',      color:'bg-amber-100 text-amber-700' }
  if (d === 'watchlist')          return { label:'Watchlist',    color:'bg-red-100 text-red-700' }
  return { label:'Stable', color:'bg-slate-100 text-slate-500' }
}

function adtIcon(type: string) {
  if (type === 'admission' || type === 'pending-admit')  return <ArrowDownToLine size={13} className="text-emerald-600" />
  if (type === 'discharge' || type === 'pending-dc')     return <ArrowUpFromLine  size={13} className="text-sky-600" />
  return <ArrowRightLeft size={13} className="text-violet-600" />
}

function adtLabel(type: string) {
  if (type === 'admission')     return { text:'Admitted',       color:'bg-emerald-100 text-emerald-700' }
  if (type === 'discharge')     return { text:'Discharged',     color:'bg-sky-100 text-sky-700' }
  if (type === 'transfer-in')   return { text:'Transfer In',    color:'bg-violet-100 text-violet-700' }
  if (type === 'transfer-out')  return { text:'Transfer Out',   color:'bg-teal-100 text-teal-700' }
  if (type === 'pending-admit') return { text:'Pending Admit',  color:'bg-amber-100 text-amber-700' }
  if (type === 'pending-dc')    return { text:'Pending DC',     color:'bg-blue-100 text-blue-700' }
  return { text:type, color:'bg-slate-100 text-slate-600' }
}

// ── Census Donut (SVG) ────────────────────────────────────────────────────────

function CensusDonut({ occupied, total, projected, size = 72 }: { occupied: number; total: number; projected: number; size?: number }) {
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const pctOcc  = Math.min(occupied   / total, 1)
  const pctProj = Math.min(projected  / total, 1)
  const isDanger = projected > total * 0.92

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
      {/* projected arc (lighter) */}
      {projected > occupied && (
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={isDanger ? '#fca5a5' : '#a5f3fc'}
          strokeWidth={7}
          strokeDasharray={`${pctProj * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transform:`rotate(-90deg)`, transformOrigin:'center' }}
          initial={{ strokeDasharray:`0 ${circ}` }}
          animate={{ strokeDasharray:`${pctProj * circ} ${circ}` }}
          transition={{ duration: 0.8, ease:'easeOut' }}
        />
      )}
      {/* occupied arc */}
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={isDanger ? '#ef4444' : pctOcc > 0.85 ? '#f97316' : '#10b981'}
        strokeWidth={7}
        strokeDasharray={`${pctOcc * circ} ${circ}`}
        strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'center' }}
        initial={{ strokeDasharray:`0 ${circ}` }}
        animate={{ strokeDasharray:`${pctOcc * circ} ${circ}` }}
        transition={{ duration: 0.7, ease:'easeOut' }}
      />
      {/* centre text */}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill={isDanger ? '#dc2626' : '#1e293b'}>
        {occupied}
      </text>
      <text x={size/2} y={size/2 + 10} textAnchor="middle" fontSize="9" fill="#94a3b8">
        / {total}
      </text>
    </svg>
  )
}

// ── Unit Card ─────────────────────────────────────────────────────────────────

interface UnitCardProps {
  uc: UnitCensus
  onExpand: (unit: UnitKey) => void
  onFloat: (unit: UnitKey) => void
  expanded: boolean
}

function UnitCard({ uc, onExpand, onFloat, expanded }: UnitCardProps) {
  const isCrisis  = !uc.projectedCompliant
  const isTight   = !uc.ratioCompliant && uc.projectedCompliant

  return (
    <motion.div
      layout
      data-id={`unit-card-${uc.unit.toLowerCase().replace(/[\s-]/g,'')}`}
      className={`rounded-2xl border-2 bg-white shadow-sm transition-all cursor-pointer ${
        isCrisis ? 'border-red-300 shadow-red-100' :
        isTight  ? 'border-amber-300 shadow-amber-100' :
        'border-slate-200 hover:border-slate-300'
      }`}
      whileHover={{ y: -1 }}
      onClick={() => onExpand(uc.unit)}
    >
      <div className="p-4">
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${uc.color}`} />
              <span className="text-sm font-bold text-slate-800">{uc.label}</span>
              {isCrisis && (
                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={9} /> RATIO RISK
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{uc.floor} · {uc.maxRatio} max</p>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
              <ChevronRight size={15} />
            </motion.div>
          </div>
        </div>

        {/* census ring + stats */}
        <div className="flex items-center gap-4">
          <div data-id={`census-ring-${uc.unit.toLowerCase().replace(/[\s-]/g,'')}`}>
            <CensusDonut occupied={uc.occupied} total={uc.totalBeds} projected={uc.projectedOccupied} />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Avg acuity</span>
              <span className="font-semibold text-slate-700">{uc.avgAcuity.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Staff / needed</span>
              <span className={`font-semibold ${uc.staffOnDuty >= uc.requiredStaff ? 'text-emerald-600' : 'text-red-600'}`}>
                {uc.staffOnDuty} / {uc.requiredStaff}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pending in</span>
              <span className={`font-semibold ${uc.pendingAdmissions > 0 ? (isCrisis ? 'text-red-600' : 'text-amber-600') : 'text-slate-500'}`}>
                +{uc.pendingAdmissions}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Expected out</span>
              <span className="font-semibold text-emerald-600">−{uc.expectedDischarges}</span>
            </div>
          </div>
        </div>

        {/* ratio risk banner */}
        {isCrisis && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-red-700">Projected {uc.projectedOccupied} pts · needs {uc.requiredStaff} nurses</p>
              <p className="text-[10px] text-red-500">Only {uc.staffOnDuty} on duty after ADT</p>
            </div>
            <button
              aria-label={`Request float for ${uc.unit}`}
              onClick={e => { e.stopPropagation(); onFloat(uc.unit); }}
              className="shrink-0 text-[10px] font-bold bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Request Float
            </button>
          </div>
        )}

        {/* bed strip */}
        <div className="mt-3 flex gap-0.5 flex-wrap">
          {getBedsByUnit(uc.unit).map(bed => (
            <div
              key={bed.id}
              data-id={`bed-${bed.id}`}
              title={`${bed.room}: ${bed.status}${bed.patientId ? '' : ''}`}
              className={`w-4 h-3 rounded-sm ${
                bed.status === 'occupied'  ? 'bg-slate-600' :
                bed.status === 'clean'     ? 'bg-emerald-300' :
                bed.status === 'dirty'     ? 'bg-amber-300' :
                bed.status === 'blocked'   ? 'bg-red-300' :
                'bg-violet-300'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-1.5 text-[9px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-slate-600 inline-block" />Occupied</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-emerald-300 inline-block" />Clean</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-amber-300 inline-block" />Dirty</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-red-300 inline-block" />Blocked</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Patient Row ───────────────────────────────────────────────────────────────

interface PatientRowProps {
  patient: Patient
  onDcReady: (id: string) => void
  onAcuityChange: (id: string, acuity: Acuity) => void
}

function PatientRow({ patient, onDcReady, onAcuityChange }: PatientRowProps) {
  const [showAcuity, setShowAcuity] = useState(false)
  const disp = dispositionMeta(patient.disposition)

  return (
    <motion.tr
      layout
      data-id={`patient-row-${patient.id}`}
      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{patient.room}</span>
          {patient.isolation && (
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
              patient.isolation === 'Contact'  ? 'bg-yellow-100 text-yellow-700' :
              patient.isolation === 'Droplet'  ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>{patient.isolation[0]}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2">
        <p className="text-xs font-semibold text-slate-700">{patient.lastName}, {patient.firstInitial}.</p>
        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{patient.diagnosis}</p>
      </td>
      <td className="py-2.5 px-2">
        <div className="relative">
          <button
            aria-label={`Acuity ${patient.acuity} for ${patient.id}`}
            onClick={() => setShowAcuity(!showAcuity)}
            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${acuityColor(patient.acuity)} hover:opacity-80 transition-opacity`}
          >
            {patient.acuity}
          </button>
          <AnimatePresence>
            {showAcuity && (
              <motion.div
                className="absolute z-20 top-8 left-0 bg-white rounded-xl border border-slate-200 shadow-xl p-2 flex gap-1"
                initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
              >
                {([1,2,3,4,5] as Acuity[]).map(a => (
                  <button
                    key={a}
                    aria-label={`Set acuity ${a} for ${patient.id}`}
                    onClick={() => { onAcuityChange(patient.id, a); setShowAcuity(false) }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold ${acuityColor(a)} hover:opacity-80`}
                  >{a}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
      <td className="py-2.5 px-2">
        <span className="text-xs text-slate-500">Day {patient.los + 1}</span>
      </td>
      <td className="py-2.5 px-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${disp.color}`}>
          {disp.label}
        </span>
      </td>
      <td className="py-2.5 px-2 text-[10px] text-slate-500">{patient.dcTime ?? '—'}</td>
      <td className="py-2.5 px-2">
        <div className="flex gap-1 flex-wrap">
          {patient.flags.includes('fall-risk') && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded">Fall</span>}
          {patient.flags.includes('dnr')       && <span className="text-[9px] bg-slate-200  text-slate-600 px-1 rounded">DNR</span>}
          {patient.flags.includes('high-acuity')&& <span className="text-[9px] bg-red-100   text-red-700   px-1 rounded">Hi-A</span>}
          {patient.flags.includes('pending-labs')&&<span className="text-[9px] bg-sky-100   text-sky-700   px-1 rounded">Labs</span>}
          {patient.flags.includes('consult')    && <span className="text-[9px] bg-violet-100 text-violet-700 px-1 rounded">Consult</span>}
        </div>
      </td>
      <td className="py-2.5 px-2">
        {patient.disposition !== 'discharge-today' && patient.disposition !== 'pending-discharge' ? (
          <button
            aria-label={`Mark discharge ready ${patient.id}`}
            onClick={() => onDcReady(patient.id)}
            className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
          >
            DC Ready
          </button>
        ) : (
          <CheckCircle2 size={14} className="text-emerald-500" />
        )}
      </td>
    </motion.tr>
  )
}

// ── ADT Feed ──────────────────────────────────────────────────────────────────

function AdtFeed({ events }: { events: AdtEvent[] }) {
  const completed = events.filter(e => !e.isPending)
  const pending   = events.filter(e => e.isPending)
  const [filter, setFilter] = useState<'all'|'pending'|'completed'>('all')

  const shown = filter === 'pending' ? pending : filter === 'completed' ? completed : events

  return (
    <div id="adt-feed" className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-800">ADT Activity</h2>
        <div className="flex gap-1">
          {(['all','pending','completed'] as const).map(f => (
            <button key={f} id={`adt-filter-${f}`} onClick={() => setFilter(f)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f === 'all' ? `All (${events.length})` : f === 'pending' ? `Pending (${pending.length})` : `Done (${completed.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {pending.length > 0 && (filter === 'all' || filter === 'pending') && (
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Pending / Predicted</p>
        )}
        {shown.map((ev, i) => {
          const lbl = adtLabel(ev.type)
          const uc  = UNIT_COLORS[ev.unit]
          return (
            <motion.div
              key={ev.id}
              data-id={`adt-event-${ev.id}`}
              initial={{ opacity:0, x:8 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.03, ease:'easeOut' as const }}
              className={`rounded-xl border p-3 ${ev.isPending ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{adtIcon(ev.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-slate-700">{ev.patientDisplay}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${lbl.color}`}>{lbl.text}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${uc.badge} ${uc.border}`}>{ev.unit}</span>
                    {ev.room && <span className="text-[9px] text-slate-400">{ev.room}</span>}
                    {ev.acuity && <span className={`text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center ${acuityColor(ev.acuity)}`}>{ev.acuity}</span>}
                  </div>
                  {ev.diagnosis && <p className="text-[10px] text-slate-500 truncate">{ev.diagnosis}</p>}
                  {ev.note      && <p className="text-[10px] text-slate-400 italic truncate">{ev.note}</p>}
                  {(ev.fromUnit || ev.toUnit) && (
                    <p className="text-[10px] text-slate-500">
                      {ev.fromUnit && `From ${ev.fromUnit}`} {ev.toUnit && `→ ${ev.toUnit}`}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={9} />
                  {ev.time}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Float Request Modal ────────────────────────────────────────────────────────

function FloatModal({ unit, onConfirm, onClose }: { unit: UnitKey; onConfirm: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('')
  const uc = UNIT_COLORS[unit]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
    >
      <motion.div
        id="float-request-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        initial={{ scale:0.93, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.93, y:16 }}
        transition={{ type:'spring', stiffness:400, damping:32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${uc.badge} flex items-center justify-center`}>
              <Users size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Request Float Nurse</h2>
              <p className={`text-xs font-semibold ${uc.text}`}>{unit}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Ratio risk after pending admissions
          </p>
          <p className="text-[11px] text-red-500 mt-0.5">Float pool will be queried for {unit}-qualified nurses</p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Clinical Reason *</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            rows={3}
            placeholder="e.g. 2 pending admissions from ED — projected 12 patients, 3 nurses on duty, need 4th…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            aria-label="Confirm float request"
            onClick={() => note.trim() && onConfirm(note.trim())}
            disabled={!note.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={14} />
            Request Float
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Patient Detail Drawer ─────────────────────────────────────────────────────

function UnitPatientTable({ unit, onDcReady, onAcuityChange }: {
  unit: UnitKey
  onDcReady: (id: string) => void
  onAcuityChange: (id: string, a: Acuity) => void
}) {
  const patients = getPatientsByUnit(unit)
  const uc = UNIT_COLORS[unit]

  return (
    <motion.div
      id={`patient-table-${unit.toLowerCase().replace(/[\s-]/g,'')}`}
      initial={{ opacity:0, height:0 }}
      animate={{ opacity:1, height:'auto' }}
      exit={{ opacity:0, height:0 }}
      className="overflow-hidden"
    >
      <div className={`mt-3 rounded-2xl border-2 ${uc.border} overflow-hidden`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${uc.border} ${uc.badge}`}>
          <span className={`text-xs font-bold ${uc.text}`}>{unit} — {patients.length} Patients</span>
          <span className={`text-[10px] ${uc.text}`}>Click acuity to edit · Click DC Ready to flag</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bg-white">
            <thead className="border-b border-slate-100">
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-3 py-2">Room</th>
                <th className="px-2 py-2">Patient / Dx</th>
                <th className="px-2 py-2">Acuity</th>
                <th className="px-2 py-2">LOS</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">DC Time</th>
                <th className="px-2 py-2">Flags</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <PatientRow key={p.id} patient={p} onDcReady={onDcReady} onAcuityChange={onAcuityChange} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

// ── Hospital Acuity Heatmap ────────────────────────────────────────────────────

function AcuityHeatmap({ units }: { units: UnitCensus[] }) {
  return (
    <div id="acuity-heatmap" className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Thermometer size={16} className="text-orange-500" />
        <h3 className="text-sm font-bold text-slate-800">Acuity Heatmap</h3>
        <span className="text-xs text-slate-400 ml-auto">Avg patient severity by unit</span>
      </div>
      <div className="space-y-2">
        {units.sort((a,b) => b.avgAcuity - a.avgAcuity).map((uc, i) => {
          const pct = (uc.avgAcuity / 5) * 100
          const barColor = uc.avgAcuity >= 4.5 ? 'bg-red-500' : uc.avgAcuity >= 3.5 ? 'bg-orange-400' : uc.avgAcuity >= 2.5 ? 'bg-amber-400' : 'bg-emerald-400'
          return (
            <div key={uc.unit} data-id={`heatmap-${uc.unit.toLowerCase().replace(/[\s-]/g,'')}`} className="flex items-center gap-3">
              <span className={`text-xs font-semibold w-20 shrink-0 ${UNIT_COLORS[uc.unit].text}`}>{uc.unit}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor} flex items-center justify-end pr-2`}
                  initial={{ width:0 }}
                  animate={{ width:`${pct}%` }}
                  transition={{ delay: i * 0.08, duration:0.6, ease:'easeOut' as const }}
                >
                  <span className="text-[9px] font-bold text-white">{uc.avgAcuity.toFixed(1)}</span>
                </motion.div>
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">{uc.occupied} pts</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500" />5 Critical</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-orange-400" />4 High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-400" />3 Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-400" />1–2 Low</span>
      </div>
    </div>
  )
}

// ── Staffing Impact Panel ─────────────────────────────────────────────────────

function StaffingImpact({ units }: { units: UnitCensus[] }) {
  const atRisk = units.filter(u => !u.projectedCompliant)
  const tight  = units.filter(u => u.projectedCompliant && !u.ratioCompliant)
  const ok     = units.filter(u => u.ratioCompliant && u.projectedCompliant)

  return (
    <div id="staffing-impact" className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-violet-500" />
        <h3 className="text-sm font-bold text-slate-800">Staffing Impact Forecast</h3>
        <span className="text-xs text-slate-400 ml-auto">After today's ADT</span>
      </div>

      {atRisk.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2">Ratio Risk After Admissions</p>
          {atRisk.map(uc => (
            <div key={uc.unit} data-id={`impact-risk-${uc.unit.toLowerCase().replace(/[\s-]/g,'')}`}
              className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${uc.color}`} />
                <span className="text-xs font-semibold text-slate-700">{uc.unit}</span>
                <span className="text-[10px] text-slate-400">{uc.occupied}→{uc.projectedOccupied} pts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-600 font-semibold">Needs {uc.requiredStaff}, has {uc.staffOnDuty}</span>
                <button
                  aria-label={`Float request impact ${uc.unit}`}
                  className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Float →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tight.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2">Tight But Compliant</p>
          {tight.map(uc => (
            <div key={uc.unit} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${uc.color}`} />
                <span className="text-xs text-slate-700">{uc.unit}</span>
              </div>
              <span className="text-[10px] text-amber-600">{uc.staffOnDuty}/{uc.requiredStaff} staff</span>
            </div>
          ))}
        </div>
      )}

      {ok.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Compliant</p>
          {ok.map(uc => (
            <div key={uc.unit} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span className="text-xs text-slate-600">{uc.unit}</span>
              </div>
              <span className="text-[10px] text-emerald-600">{uc.staffOnDuty}/{uc.requiredStaff} ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'beds' | 'patients' | 'adt'

export default function Census() {
  const [tab, setTab]             = useState<TabId>('overview')
  const [expanded, setExpanded]   = useState<UnitKey | null>(null)
  const [floatUnit, setFloatUnit] = useState<UnitKey | null>(null)
  const [toast, setToast]         = useState<string | null>(null)
  const [units, setUnits]         = useState(() => getUnitCensus())
  const [adtEvents]               = useState(() => getAdtEvents())
  const [_tick, setTick]          = useState(0)

  const stats = getHospitalStats()

  // Refresh derived state when patients change
  function refreshUnits() { setUnits(getUnitCensus()) }

  // Clock tick every minute for "live" feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3800)
  }

  function handleExpand(unit: UnitKey) {
    setExpanded(prev => prev === unit ? null : unit)
  }

  function handleDcReady(id: string) {
    markDischargeReady(id)
    refreshUnits()
    showToast('Patient flagged for discharge — charge board updated')
  }

  function handleAcuityChange(id: string, acuity: Acuity) {
    updateAcuity(id, acuity)
    refreshUnits()
    showToast('Acuity updated — staffing ratios recalculated')
  }

  function handleFloatRequest(note: string) {
    if (!floatUnit) return
    requestFloat(floatUnit, note)
    showToast(`Float nurse requested for ${floatUnit} — Float Pool notified`)
    setFloatUnit(null)
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id:'overview', label:'Overview',  icon:<Activity size={14} /> },
    { id:'beds',     label:'Bed Map',   icon:<BedDouble size={14} /> },
    { id:'patients', label:'Patients',  icon:<Users size={14} /> },
    { id:'adt',      label:'ADT Feed',  icon:<ArrowRightLeft size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Activity size={20} className="text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">Live Census & Bed Board</h1>
              <span className="flex items-center gap-1.5 ml-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-600">Live</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">Day Shift · Mercy General Hospital · Fri Mar 13, 2026</p>
          </div>
          <button
            onClick={refreshUnits}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-5 max-w-[1400px] mx-auto">
        {/* Hero stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {[
            { id:'stat-total-census',   label:'Total Census', value:`${stats.occupied}/${stats.totalBeds}`, sub:`${Math.round(stats.occupied/stats.totalBeds*100)}% occupied`, icon:<BedDouble size={15}/>, color:'text-slate-700', bg:'bg-white', border:'border-slate-200' },
            { id:'stat-available',      label:'Available Beds',value:stats.available, sub:'clean + dirty', icon:<CheckCircle2 size={15}/>, color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200' },
            { id:'stat-pending-admits', label:'Pending Admits',value:stats.pendingAdmits, sub:'incoming today', icon:<ArrowDownToLine size={15}/>, color:'text-amber-600', bg:'bg-amber-50', border:'border-amber-200' },
            { id:'stat-expected-dc',    label:'Expected DC',   value:stats.expectedDc, sub:'clearing today', icon:<ArrowUpFromLine size={15}/>, color:'text-sky-600',    bg:'bg-sky-50',     border:'border-sky-200' },
            { id:'stat-ratio-risk',     label:'Ratio Risk',    value:stats.atRisk, sub:'units after ADT',  icon:<Shield size={15}/>,    color: stats.atRisk > 0 ? 'text-red-600' : 'text-emerald-600', bg: stats.atRisk > 0 ? 'bg-red-50' : 'bg-emerald-50', border: stats.atRisk > 0 ? 'border-red-200' : 'border-emerald-200' },
          ].map(({ id, label, value, sub, icon, color, bg, border }) => (
            <motion.div key={id} id={id}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className={`rounded-xl border ${border} ${bg} p-4`}
            >
              <div className={`flex items-center gap-2 mb-1 ${color}`}>
                {icon}
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Ratio risk alert */}
        <AnimatePresence>
          {stats.atRisk > 0 && (
            <motion.div
              id="ratio-risk-alert"
              initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-3"
            >
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">
                  {stats.atRisk} unit{stats.atRisk > 1 ? 's' : ''} at ratio risk after pending admissions
                </p>
                <p className="text-xs text-red-600">
                  Oncology: 2 admissions pending, only 3 nurses on duty for projected 11 patients (need 4)
                </p>
              </div>
              <button
                aria-label="Open float request from alert"
                onClick={() => setFloatUnit('Oncology')}
                className="shrink-0 text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5"
              >
                <Zap size={13} />
                Request Float
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} id={`tab-${id}`} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.18, ease:'easeOut' as const }}
          >

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Unit cards — left 2/3 */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-700">Unit Census</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Filter size={12} />
                      <span>Click unit to drill down</span>
                    </div>
                  </div>
                  <div id="census-unit-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {units.map(uc => (
                      <div key={uc.unit}>
                        <UnitCard uc={uc} onExpand={handleExpand} onFloat={setFloatUnit} expanded={expanded === uc.unit} />
                        <AnimatePresence>
                          {expanded === uc.unit && (
                            <UnitPatientTable
                              unit={uc.unit}
                              onDcReady={handleDcReady}
                              onAcuityChange={handleAcuityChange}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-5">
                  <StaffingImpact units={units} />
                  <AcuityHeatmap units={units} />
                </div>
              </div>
            )}

            {/* ── BED MAP ── */}
            {tab === 'beds' && (
              <div id="bed-map-view" className="space-y-4">
                <div className="flex items-center gap-4 mb-2 text-xs text-slate-500">
                  <span className="font-semibold">Bed Status:</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-3 rounded bg-slate-600 inline-block" />Occupied</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-3 rounded bg-emerald-300 inline-block" />Clean/Available</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-3 rounded bg-amber-300 inline-block" />Dirty (EVS needed)</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-3 rounded bg-red-300 inline-block" />Blocked</span>
                </div>

                {UNITS_ORDER.map(unit => {
                  const beds    = getBedsByUnit(unit)
                  const uc      = UNIT_COLORS[unit]
                  const uMeta   = units.find(u => u.unit === unit)!
                  const isRisk  = !uMeta.projectedCompliant

                  return (
                    <div key={unit} data-id={`bed-map-${unit.toLowerCase().replace(/[\s-]/g,'')}`}
                      className={`rounded-2xl border-2 bg-white p-4 ${isRisk ? 'border-red-200' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${uc.badge} ${uc.border}`}>{unit}</span>
                        <span className="text-xs text-slate-500">{uMeta.floor} · {uMeta.occupied}/{uMeta.totalBeds} occupied</span>
                        {isRisk && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={9}/> RISK</span>}
                        <button
                          onClick={() => setExpanded(prev => prev === unit ? null : unit)}
                          className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          Patients <ChevronDown size={13} className={expanded === unit ? 'rotate-180' : ''} style={{ transition:'transform 0.2s' }} />
                        </button>
                      </div>

                      {/* Bed grid */}
                      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                        {beds.map(bed => {
                          const pt = bed.patientId ? getPatientsByUnit(unit).find(p => p.id === bed.patientId) : undefined
                          return (
                            <div
                              key={bed.id}
                              data-id={`bed-cell-${bed.id}`}
                              title={`${bed.room}: ${bed.status}${pt ? ` · ${pt.lastName}, ${pt.firstInitial}. · Acuity ${pt.acuity}` : ''}${bed.blockedReason ? ` · ${bed.blockedReason}` : ''}`}
                              className={`rounded-lg border p-1 text-center cursor-default transition-all hover:scale-105 ${
                                bed.status === 'occupied'
                                  ? pt ? `border-slate-300 bg-slate-100` : 'border-slate-300 bg-slate-100'
                                  : bed.status === 'clean'
                                  ? 'border-emerald-200 bg-emerald-50'
                                  : bed.status === 'dirty'
                                  ? 'border-amber-200 bg-amber-50'
                                  : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <p className="text-[9px] font-mono text-slate-500 leading-none mb-0.5">{bed.room}</p>
                              {pt && (
                                <div className={`w-4 h-4 rounded mx-auto text-[9px] font-bold flex items-center justify-center ${acuityColor(pt.acuity)}`}>
                                  {pt.acuity}
                                </div>
                              )}
                              {bed.status !== 'occupied' && (
                                <p className="text-[8px] text-slate-400 leading-none mt-0.5">
                                  {bed.status === 'clean' ? '✓' : bed.status === 'dirty' ? 'EVS' : '⚠'}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <AnimatePresence>
                        {expanded === unit && (
                          <UnitPatientTable unit={unit} onDcReady={handleDcReady} onAcuityChange={handleAcuityChange} />
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── PATIENTS ── */}
            {tab === 'patients' && (
              <div id="all-patients-view">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-700">All Patients — Today's Status</h2>
                  <span className="text-xs text-slate-400">{_patients.length} total</span>
                  <span className="ml-auto text-xs text-slate-400">Click acuity badge to update · Click DC Ready to flag</span>
                </div>

                {UNITS_ORDER.map(unit => {
                  const patients = getPatientsByUnit(unit)
                  if (!patients.length) return null
                  const uc = UNIT_COLORS[unit]
                  return (
                    <div key={unit} data-id={`patients-unit-${unit.toLowerCase().replace(/[\s-]/g,'')}`} className="mb-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-t-xl border-b ${uc.badge} border ${uc.border}`}>
                        <span className={`w-2 h-2 rounded-full ${uc.dot}`} />
                        <span className={`text-xs font-bold ${uc.text}`}>{unit}</span>
                        <span className={`text-[10px] ${uc.text} opacity-70`}>{patients.length} patients</span>
                        <span className="ml-auto text-[10px] text-slate-500">
                          {patients.filter(p=>p.disposition==='discharge-today'||p.disposition==='pending-discharge').length} DC today
                        </span>
                      </div>
                      <div className="rounded-b-xl border border-t-0 border-slate-200 overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="border-b border-slate-100">
                              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                <th className="px-3 py-2">Room</th>
                                <th className="px-2 py-2">Patient / Dx</th>
                                <th className="px-2 py-2">Acuity</th>
                                <th className="px-2 py-2">LOS</th>
                                <th className="px-2 py-2">Status</th>
                                <th className="px-2 py-2">DC Time</th>
                                <th className="px-2 py-2">Flags</th>
                                <th className="px-2 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patients.map(p => (
                                <PatientRow key={p.id} patient={p} onDcReady={handleDcReady} onAcuityChange={handleAcuityChange} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ADT ── */}
            {tab === 'adt' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <AdtFeed events={adtEvents} />
                </div>
                <div className="space-y-5">
                  <StaffingImpact units={units} />
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={15} className="text-sky-500" />
                      <h3 className="text-sm font-bold text-slate-800">Bed Availability</h3>
                    </div>
                    {units.map(uc => (
                      <div key={uc.unit} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${uc.color}`} />
                          <span className="text-xs text-slate-700">{uc.unit}</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-emerald-600 font-semibold">{uc.clean} clean</span>
                          <span className="text-amber-500">{uc.dirty} dirty</span>
                          {uc.blocked > 0 && <span className="text-red-500">{uc.blocked} blocked</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Float Modal */}
      <AnimatePresence>
        {floatUnit && (
          <FloatModal unit={floatUnit} onConfirm={handleFloatRequest} onClose={() => setFloatUnit(null)} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div id="action-toast"
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

// expose patients count for testing
export const _patients = getPatientsByUnit('ICU').concat(
  getPatientsByUnit('CCU'), getPatientsByUnit('ED'),
  getPatientsByUnit('MS-A'), getPatientsByUnit('MS-B'),
  getPatientsByUnit('Oncology'), getPatientsByUnit('Telemetry')
)
