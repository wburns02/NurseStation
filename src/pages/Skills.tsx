import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, X, Plus, ArrowRight, Search,
  Shield, Award, Zap, RefreshCw,
} from 'lucide-react'
import {
  getAllStaff, getCrossTraining, getExpiringWithin, getFloatCandidates,
  markVerified, enrollCrossTrain, toggleCheckOff,
  UNITS, UNIT_META, STATUS_META,
  type UnitKey, type CompStatus, type SkillsStaff, type CrossTrainEnrollment,
} from '../data/skillsData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ name, initials, color, size = 'md' }: { name: string; initials: string; color: string; size?: 'xs' | 'sm' | 'md' }) {
  const sz = size === 'xs' ? 'w-6 h-6 text-[9px]' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div title={name} className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 shadow`}>
      {initials}
    </div>
  )
}

function FloatScore({ score }: { score: number }) {
  const color = score >= 75 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-red-500'
  const bg = score >= 75 ? 'bg-emerald-50' : score >= 45 ? 'bg-amber-50' : 'bg-red-50'
  return (
    <span className={`inline-block text-xs font-black ${color} ${bg} px-2 py-0.5 rounded-full border ${score >= 75 ? 'border-emerald-200' : score >= 45 ? 'border-amber-200' : 'border-red-200'}`}>
      {score}
    </span>
  )
}

// ── Cell badge ────────────────────────────────────────────────────────────────

function CompCell({ status, dataId, onClick }: { status: CompStatus; dataId?: string; onClick: () => void }) {
  const m = STATUS_META[status]
  return (
    <button
      data-id={dataId}
      onClick={onClick}
      className={`w-12 h-9 rounded-lg border flex items-center justify-center text-xs font-black transition-all hover:scale-110 hover:shadow-md ${m.bg} ${m.text} ${m.border}`}
    >
      {m.short}
    </button>
  )
}

// ── Competency Detail Modal ───────────────────────────────────────────────────

function CompDetailModal({
  staff, unit, onVerify, onEnroll, onClose,
}: {
  staff: SkillsStaff; unit: UnitKey;
  onVerify: () => void; onEnroll: () => void; onClose: () => void
}) {
  const comp = staff.competencies[unit]
  const m = STATUS_META[comp.status]
  const um = UNIT_META[unit]
  const [verifier, setVerifier] = useState('Janet Morrison, RN')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div id="comp-detail-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center gap-3">
          <Avatar name={staff.name} initials={staff.initials} color={staff.color} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{staff.name}</p>
            <p className="text-slate-400 text-xs">{staff.role} · {staff.primaryUnit}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Unit badge */}
          <div className={`${um.bgLight} ${um.border} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${um.color}`}>{unit}</p>
              <p className="text-[10px] text-slate-500">Competency status</p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${m.bg} ${m.text} ${m.border}`}>{m.label}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {comp.verifiedDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified</span>
                <span className="font-semibold text-slate-700">{comp.verifiedDate}</span>
              </div>
            )}
            {comp.expiryDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Expires</span>
                <span className={`font-semibold ${new Date(comp.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>{comp.expiryDate}</span>
              </div>
            )}
            {comp.verifiedBy && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified by</span>
                <span className="font-semibold text-slate-700">{comp.verifiedBy}</span>
              </div>
            )}
            {comp.floatCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Float count</span>
                <span className="font-bold text-violet-600">{comp.floatCount}×</span>
              </div>
            )}
            {comp.lastFloat && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last floated</span>
                <span className="font-semibold text-slate-700">{comp.lastFloat}</span>
              </div>
            )}
            {comp.notes && (
              <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{comp.notes}</p>
            )}
          </div>

          {/* Actions */}
          {comp.status !== 'primary' && comp.status !== 'in-progress' && (
            <div className="space-y-2">
              {(comp.status === 'none' || comp.status === 'expired') && (
                <button aria-label={`Enroll cross-train ${staff.id} ${unit}`} onClick={onEnroll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors">
                  <Plus size={14} /> Enroll in Cross-Training
                </button>
              )}
              {(comp.status === 'expired' || comp.status === 'verified') && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Mark competency verified by:</p>
                  <input value={verifier} onChange={e => setVerifier(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button aria-label={`Mark verified ${staff.id} ${unit}`} onClick={onVerify}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 size={14} /> Mark Verified
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Float Finder Modal ────────────────────────────────────────────────────────

function FloatFinderModal({ onClose }: { onClose: () => void }) {
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>('MS-A')
  const candidates = getFloatCandidates(selectedUnit)

  return (
    <motion.div id="float-finder-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-white" />
            <p className="text-white font-bold">Float Finder — Who Can Cover?</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16} /></button>
        </div>

        <div className="px-5 pt-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select unit needing coverage</p>
          <div className="flex gap-2 flex-wrap">
            {UNITS.map(u => (
              <button key={u} data-id={`finder-unit-${u}`} onClick={() => setSelectedUnit(u)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${selectedUnit === u ? `${UNIT_META[u].bgLight} ${UNIT_META[u].border} ${UNIT_META[u].color}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-slate-500 mb-3">{candidates.length} verified candidates available for {selectedUnit}</p>
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle size={20} className="mx-auto mb-2" />
              <p className="text-sm">No verified float candidates for {selectedUnit}</p>
              <p className="text-xs mt-1">Enroll nurses in cross-training to expand your pool</p>
            </div>
          ) : (
            <div id="float-candidates" className="space-y-2">
              {candidates.map((s, i) => {
                const c = s.competencies[selectedUnit]
                return (
                  <div key={s.id} data-id={`candidate-${s.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-violet-50 hover:border-violet-200 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] flex items-center justify-center font-black shrink-0">{i + 1}</span>
                    <Avatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-500">{s.primaryUnit} · {c.floatCount}× floated · Last: {c.lastFloat ?? 'Never'}</p>
                    </div>
                    <FloatScore score={s.floatScore} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Cross-Training Card ───────────────────────────────────────────────────────

function CrossTrainCard({ enrollment, onToggle }: { enrollment: CrossTrainEnrollment; onToggle: (idx: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const done = enrollment.checkOffs.filter(c => c.done).length
  const total = enrollment.checkOffs.length
  const pct = enrollment.progress

  return (
    <motion.div layout data-id={`crosst-${enrollment.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <Avatar name={enrollment.staffName} initials={enrollment.initials} color={enrollment.color} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{enrollment.staffName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500">{enrollment.fromUnit}</span>
            <ArrowRight size={10} className="text-slate-300" />
            <span className={`text-[10px] font-bold ${UNIT_META[enrollment.toUnit].color}`}>{enrollment.toUnit}</span>
            <span className="text-[10px] text-slate-400">· Target: {enrollment.targetDate}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>{pct}%</p>
          <p className="text-[9px] text-slate-400">{done}/{total} done</p>
        </div>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Progress bar */}
      <div className="mx-4 mb-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-violet-500'}`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' as const }} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-500 mb-2">Mentor: <span className="font-semibold text-slate-700">{enrollment.mentor}</span></p>
              <div className="space-y-1.5">
                {enrollment.checkOffs.map((c, i) => (
                  <button key={i} aria-label={`Toggle checkoff ${enrollment.id} ${i}`}
                    onClick={() => onToggle(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${c.done ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200 hover:bg-violet-50'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500' : 'border-2 border-slate-300'}`}>
                      {c.done && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                    <span className={`text-xs ${c.done ? 'text-emerald-700 font-semibold line-through decoration-emerald-400' : 'text-slate-700'}`}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'matrix' | 'float' | 'alerts' | 'crosstraining'

export default function Skills() {
  const [tab, setTab] = useState<Tab>('matrix')
  const [staff, setStaff] = useState(getAllStaff)
  const [crossTrain, setCrossTrain] = useState(getCrossTraining)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUnit, setFilterUnit] = useState<UnitKey | 'all'>('all')
  const [selectedCell, setSelectedCell] = useState<{ staff: SkillsStaff; unit: UnitKey } | null>(null)
  const [floatFinderOpen, setFloatFinderOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const expiring30 = getExpiringWithin(30)
  const expiring60 = getExpiringWithin(60)

  function showToast(msg: string) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(''), 3500)
  }

  function handleVerify() {
    if (!selectedCell) return
    markVerified(selectedCell.staff.id, selectedCell.unit, 'Janet Morrison, RN')
    setStaff(getAllStaff())
    setSelectedCell(null)
    showToast(`✓ ${selectedCell.staff.name} verified for ${selectedCell.unit}`)
  }

  function handleEnroll() {
    if (!selectedCell) return
    enrollCrossTrain(selectedCell.staff.id, selectedCell.unit, 'Janet Morrison, RN')
    setStaff(getAllStaff())
    setCrossTrain(getCrossTraining())
    setSelectedCell(null)
    setTab('crosstraining')
    showToast(`${selectedCell.staff.name} enrolled in ${selectedCell.unit} cross-training`)
  }

  function handleToggleCheckOff(enrollmentId: string, idx: number) {
    toggleCheckOff(enrollmentId, idx)
    const updated = getCrossTraining()
    setCrossTrain(updated)
    const enroll = updated.find(e => e.id === enrollmentId)
    const step = enroll?.checkOffs[idx]
    if (step) showToast(step.done ? `✓ Checked off: ${step.label}` : `Unchecked: ${step.label}`)
  }

  const filteredStaff = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchUnit = filterUnit === 'all' || s.primaryUnit === filterUnit
    return matchSearch && matchUnit
  })

  const expiredCount = staff.reduce((n, s) => n + Object.values(s.competencies).filter(c => c.status === 'expired').length, 0)
  const verifiedCount = staff.reduce((n, s) => n + Object.values(s.competencies).filter(c => c.status === 'verified').length, 0)
  const inProgressCount = crossTrain.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Competency & Float Intelligence</h1>
              <p className="text-xs text-slate-500">Skill Matrix · Cross-Training · Float Readiness · Mercy General Hospital</p>
            </div>
          </div>
          <button id="float-finder-btn" onClick={() => setFloatFinderOpen(true)}
            className="flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow">
            <Zap size={15} /> Float Finder
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div id="kpi-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
        {[
          { id:'kpi-verified',    label:'Verified',    value:String(verifiedCount),  sub:'cross-unit competencies', color:'text-emerald-600', bg:'bg-white' },
          { id:'kpi-expired',     label:'Expired',     value:String(expiredCount),   sub:'need renewal',            color: expiredCount > 0 ? 'text-red-600' : 'text-emerald-600', bg:'bg-white' },
          { id:'kpi-in-progress', label:'In Training', value:String(inProgressCount),sub:'cross-training now',      color:'text-amber-600',  bg:'bg-white' },
          { id:'kpi-expiring-30', label:'Exp. <30d',   value:String(expiring30.length),sub:'need urgent renewal',   color: expiring30.length > 0 ? 'text-red-600' : 'text-emerald-600', bg:'bg-white' },
        ].map(k => (
          <div key={k.id} id={k.id} className={`${k.bg} px-5 py-3.5`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-black leading-none mt-0.5 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {([
            { id:'matrix',       label:'Skill Matrix',    icon:<BookOpen size={13}/> },
            { id:'float',        label:'Float Readiness', icon:<Zap size={13}/> },
            { id:'alerts',       label:'Alerts',          icon:<AlertTriangle size={13}/>, badge: expiring30.length },
            { id:'crosstraining',label:'Cross-Training',  icon:<RefreshCw size={13}/>, badge: inProgressCount },
          ] as { id:Tab; label:string; icon:React.ReactNode; badge?:number }[]).map(t => (
            <button key={t.id} id={`tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${tab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
              {t.badge ? <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── MATRIX TAB ── */}
          {tab === 'matrix' && (
            <motion.div key="matrix" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex-1 min-w-48 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="matrix-search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search nurse name or role…"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                </div>
                <select value={filterUnit} onChange={e => setFilterUnit(e.target.value as UnitKey | 'all')}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="all">All Primary Units</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {/* Legend */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(['primary','verified','in-progress','expired','none'] as CompStatus[]).map(s => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-sm ${STATUS_META[s].bg} border ${STATUS_META[s].border}`} />
                      <span className="text-[9px] text-slate-500">{STATUS_META[s].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matrix table */}
              <div id="skill-matrix" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="sticky left-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-52 border-r border-slate-200">
                          Nurse
                        </th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-500 text-center w-10">Score</th>
                        {UNITS.map(u => (
                          <th key={u} className={`px-1 py-3 text-[10px] font-black text-center w-14 ${UNIT_META[u].color}`}>
                            {UNIT_META[u].abbr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((s, i) => (
                        <tr key={s.id} data-id={`staff-row-${s.id}`}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                          <td className="sticky left-0 bg-white z-10 px-4 py-2.5 border-r border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.name} initials={s.initials} color={s.color} size="xs" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                                <p className="text-[9px] text-slate-500">{s.role} · {s.yearsExp}yr</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <FloatScore score={s.floatScore} />
                          </td>
                          {UNITS.map(u => (
                            <td key={u} className="px-1 py-2 text-center">
                              <CompCell
                                status={s.competencies[u].status}
                                dataId={`comp-cell-${s.id}-${u}`}
                                onClick={() => setSelectedCell({ staff: s, unit: u })}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStaff.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Search size={20} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No nurses match your filter</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── FLOAT READINESS TAB ── */}
          {tab === 'float' && (
            <motion.div key="float" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div id="float-readiness-list" className="space-y-3">
                {[...staff].sort((a, b) => b.floatScore - a.floatScore).map((s, i) => {
                  const verifiedUnits = Object.values(s.competencies).filter(c => c.status === 'verified')
                  const totalFloats = verifiedUnits.reduce((sum, c) => sum + c.floatCount, 0)
                  return (
                    <motion.div key={s.id} data-id={`float-row-${s.id}`}
                      initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03, duration:0.2 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i < 3 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
                      <Avatar name={s.name} initials={s.initials} color={s.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-500">{s.role} · Primary: {s.primaryUnit} · {s.yearsExp}yr exp</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {UNITS.filter(u => s.competencies[u].status === 'primary').map(u => (
                            <span key={u} className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${UNIT_META[u].bgLight} ${UNIT_META[u].color} border ${UNIT_META[u].border}`}>P:{u}</span>
                          ))}
                          {UNITS.filter(u => s.competencies[u].status === 'verified').map(u => (
                            <span key={u} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{u}</span>
                          ))}
                          {UNITS.filter(u => s.competencies[u].status === 'expired').map(u => (
                            <span key={u} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">!{u}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <FloatScore score={s.floatScore} />
                        <p className="text-[9px] text-slate-400">{totalFloats} total floats</p>
                        <p className="text-[9px] text-slate-400">{verifiedUnits.length} units cleared</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="space-y-5">
                {/* Expiring soon */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertTriangle size={11} className="text-red-500" /> Expiring within 30 days ({expiring30.length})
                  </p>
                  {expiring30.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
                      <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-400" />
                      <p className="text-sm">No competencies expiring in the next 30 days</p>
                    </div>
                  ) : (
                    <div id="expiring-30-list" className="space-y-2">
                      {expiring30.map(({ staff: s, comp: c }, i) => (
                        <div key={i} data-id={`expiring-${s.id}-${c.unit}`}
                          className="bg-white rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
                          <Avatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-600">
                              <span className={`font-bold ${UNIT_META[c.unit].color}`}>{c.unit}</span> competency expires <span className="font-bold text-red-600">{c.expiryDate}</span>
                            </p>
                          </div>
                          <button aria-label={`Renew ${s.id} ${c.unit}`}
                            onClick={() => { markVerified(s.id, c.unit, 'Janet Morrison, RN'); setStaff(getAllStaff()); showToast(`Renewed: ${s.name} – ${c.unit}`) }}
                            className="text-xs font-bold bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors shrink-0">
                            Renew
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expiring 31-60 days */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock size={11} className="text-amber-500" /> Expiring 31–60 days ({expiring60.length - expiring30.length})
                  </p>
                  <div id="expiring-60-list" className="space-y-2">
                    {expiring60.filter(e => !expiring30.find(x => x.staff.id === e.staff.id && x.comp.unit === e.comp.unit)).map(({ staff: s, comp: c }, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
                        <Avatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-600">
                            <span className={`font-bold ${UNIT_META[c.unit].color}`}>{c.unit}</span> expires <span className="font-bold text-amber-600">{c.expiryDate}</span>
                          </p>
                        </div>
                        <Shield size={14} className="text-amber-500 shrink-0" />
                      </div>
                    ))}
                    {expiring60.length === expiring30.length && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">No additional expirations in 31–60 days</div>
                    )}
                  </div>
                </div>

                {/* Expired now */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Award size={11} className="text-red-600" /> Currently Expired ({expiredCount})
                  </p>
                  <div id="expired-list" className="space-y-2">
                    {staff.flatMap(s =>
                      Object.values(s.competencies)
                        .filter(c => c.status === 'expired')
                        .map(c => ({ s, c }))
                    ).map(({ s, c }, i) => (
                      <div key={i} className="bg-white rounded-2xl border-2 border-red-300 px-4 py-3 flex items-center gap-3">
                        <Avatar name={s.name} initials={s.initials} color={s.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{s.name}</p>
                          <p className="text-xs text-red-600 font-semibold">{c.unit} expired {c.expiryDate} · {c.floatCount} floats on record</p>
                        </div>
                        <button aria-label={`Renew expired ${s.id} ${c.unit}`}
                          onClick={() => { markVerified(s.id, c.unit, 'Janet Morrison, RN'); setStaff(getAllStaff()); showToast(`Renewed: ${s.name} – ${c.unit}`) }}
                          className="text-xs font-bold bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-700 transition-colors shrink-0">
                          Renew
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CROSS-TRAINING TAB ── */}
          {tab === 'crosstraining' && (
            <motion.div key="crosstraining" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.2, ease:'easeOut' as const }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-700">{crossTrain.length} active cross-training programs</p>
                <p className="text-xs text-slate-500">Click a program to expand check-off list</p>
              </div>
              <div id="cross-training-list" className="space-y-3">
                {crossTrain.map(e => (
                  <CrossTrainCard key={e.id} enrollment={e}
                    onToggle={idx => handleToggleCheckOff(e.id, idx)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cell detail modal */}
      <AnimatePresence>
        {selectedCell && (
          <CompDetailModal
            staff={selectedCell.staff} unit={selectedCell.unit}
            onVerify={handleVerify} onEnroll={handleEnroll}
            onClose={() => setSelectedCell(null)}
          />
        )}
      </AnimatePresence>

      {/* Float finder modal */}
      <AnimatePresence>
        {floatFinderOpen && <FloatFinderModal onClose={() => setFloatFinderOpen(false)} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div id="action-toast" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
