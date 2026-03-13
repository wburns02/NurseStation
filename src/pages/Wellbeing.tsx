// Staff Wellbeing & Retention Risk Center — Round 12
// "NurseStation doesn't just schedule nurses — it helps you keep them."
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Heart, TrendingDown, TrendingUp, Minus, AlertTriangle,
  CheckCircle2, Clock, Calendar, Users, DollarSign,
  ChevronDown, ChevronUp, Send, X, MessageSquare,
  Sparkles, BarChart3, Activity, ArrowRight, Star,
} from 'lucide-react'
import {
  wellbeingRecords, hospitalWellbeing, hospitalEngagementTrend,
  TREND_WEEK_LABELS, getActionQueue, completeAction,
  sendPulseCheckIn, hasSentCheckIn, getPulseCount,
  BURNOUT_META, PRIORITY_META,
  type WellbeingRecord, type BurnoutLevel,
} from '../data/wellbeingData'

// ─── Retention health ring ────────────────────────────────────────────────────

function RetentionRing({ score, size = 110, stroke = 10 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [drawn, setDrawn] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDrawn(score), 200); return () => clearTimeout(t) }, [score])
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (drawn / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800 leading-none">{score}</span>
        <span className="text-[9px] text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ data, level }: { data: number[]; level: BurnoutLevel }) {
  if (data.length < 2) return null
  const w = 64, h = 22
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h,
  ])
  const d = 'M ' + pts.map(p => p.join(',')).join(' L ')
  const areaD = d + ` L ${w},${h} L 0,${h} Z`
  const trend = data[data.length - 1] - data[0]
  const stroke = level === 'low' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444'
  const fill = level === 'low' ? 'rgba(16,185,129,0.12)' : level === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div className="flex items-center gap-1.5">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0">
        <path d={areaD} fill={fill} />
        <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={stroke} />
      </svg>
      {trend < -5 ? <TrendingDown size={11} className="text-red-500 shrink-0" /> :
       trend > 5  ? <TrendingUp  size={11} className="text-emerald-500 shrink-0" /> :
                    <Minus       size={11} className="text-slate-400 shrink-0" />}
    </div>
  )
}

// ─── Hospital engagement trend chart ─────────────────────────────────────────

function HospitalTrendChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 420, H = 110, ML = 36, MR = 12, MT = 12, MB = 28
  const cW = W - ML - MR, cH = H - MT - MB

  const min = 60, max = 80
  const xScale = (i: number) => ML + (i / (hospitalEngagementTrend.length - 1)) * cW
  const yScale = (v: number) => MT + cH - ((v - min) / (max - min)) * cH

  const pts = hospitalEngagementTrend.map((v, i) => [xScale(i), yScale(v)])
  const linePath = 'M ' + pts.map(p => p.join(',')).join(' L ')
  const areaPath = linePath + ` L ${xScale(pts.length - 1)},${MT + cH} L ${xScale(0)},${MT + cH} Z`

  const gridLines = [65, 70, 75, 80]

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 110 }}>
      {/* Grid */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={ML} y1={yScale(v)} x2={W - MR} y2={yScale(v)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={ML - 4} y={yScale(v) + 4} textAnchor="end" fontSize={8} fill="#94a3b8">{v}</text>
        </g>
      ))}
      {/* Area */}
      <defs>
        <linearGradient id="eng-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#eng-grad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5} fill="#8b5cf6" />
      ))}
      {/* X labels — show every other */}
      {TREND_WEEK_LABELS.filter((_, i) => i % 2 === 0).map((label, j) => {
        const i = j * 2
        return (
          <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="#94a3b8">{label}</text>
        )
      })}
    </svg>
  )
}

// ─── Burnout risk matrix (scatter plot) ───────────────────────────────────────

function BurnoutMatrix({ onSelectStaff }: { onSelectStaff: (id: string) => void }) {
  const W = 480, H = 220, ML = 44, MR = 20, MT = 16, MB = 32
  const cW = W - ML - MR, cH = H - MT - MB

  const hoursMin = 55, hoursMax = 100
  const engMin = 30, engMax = 100

  const xS = (h: number) => ML + ((h - hoursMin) / (hoursMax - hoursMin)) * cW
  const yS = (e: number) => MT + cH - ((e - engMin) / (engMax - engMin)) * cH

  // Quadrant boundary: x=75hrs, y=60 engagement
  const xMid = xS(75), yMid = yS(60)

  const dotColor: Record<BurnoutLevel, string> = {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#f59e0b',
    low:      '#10b981',
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
        {/* Quadrant fills */}
        <rect x={xMid} y={MT} width={W - MR - xMid} height={yMid - MT} fill="rgba(251,146,60,0.07)" rx={4} />
        <rect x={xMid} y={yMid} width={W - MR - xMid} height={H - MB - yMid} fill="rgba(239,68,68,0.09)" rx={4} />
        <rect x={ML} y={MT} width={xMid - ML} height={yMid - MT} fill="rgba(16,185,129,0.06)" rx={4} />
        <rect x={ML} y={yMid} width={xMid - ML} height={H - MB - yMid} fill="rgba(245,158,11,0.06)" rx={4} />

        {/* Danger zone label */}
        <text x={xMid + 6} y={H - MB - 4} fontSize={8} fill="#ef4444" opacity={0.6} fontWeight="bold">DANGER ZONE</text>
        {/* Safe zone label */}
        <text x={ML + 4} y={MT + 12} fontSize={8} fill="#10b981" opacity={0.6}>SAFE ZONE</text>

        {/* Grid */}
        {[60, 70, 80, 90, 100].map(v => (
          <g key={v}>
            <line x1={ML} y1={yS(v)} x2={W - MR} y2={yS(v)} stroke="#f1f5f9" strokeWidth={1} />
            <text x={ML - 4} y={yS(v) + 3} textAnchor="end" fontSize={8} fill="#94a3b8">{v}</text>
          </g>
        ))}
        {[60, 70, 80, 90].map(v => (
          <g key={v}>
            <line x1={xS(v)} y1={MT} x2={xS(v)} y2={H - MB} stroke="#f1f5f9" strokeWidth={1} />
            <text x={xS(v)} y={H - MB + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">{v}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={H - MB} stroke="#e2e8f0" strokeWidth={1.5} />
        <line x1={ML} y1={H - MB} x2={W - MR} y2={H - MB} stroke="#e2e8f0" strokeWidth={1.5} />
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">Hours Worked (Last 2 Weeks)</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize={9} fill="#94a3b8" transform={`rotate(-90, 10, ${H / 2})`}>Engagement</text>

        {/* Staff dots */}
        {wellbeingRecords.map(r => {
          const cx = xS(r.factors.hoursLast2Weeks)
          const cy = yS(r.engagementScore)
          const color = dotColor[r.burnoutLevel]
          return (
            <g
              key={r.staffId}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectStaff(r.staffId)}
            >
              <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.15} />
              <circle cx={cx} cy={cy} r={11} fill={color} />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">
                {r.avatarInitials}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 px-2">
        {(['low', 'medium', 'high', 'critical'] as BurnoutLevel[]).map(level => (
          <div key={level} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${BURNOUT_META[level].dot}`} />
            <span className="text-[10px] text-slate-500">{BURNOUT_META[level].label}</span>
          </div>
        ))}
        <span className="text-[10px] text-slate-400 ml-auto">Click a dot to view staff details</span>
      </div>
    </div>
  )
}

// ─── Staff wellbeing card ─────────────────────────────────────────────────────

function StaffCard({
  record,
  isSelected,
  onClick,
}: {
  record: WellbeingRecord
  isSelected: boolean
  onClick: () => void
}) {
  const meta = BURNOUT_META[record.burnoutLevel]
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(() => hasSentCheckIn(record.staffId))
  const [, forceUpdate] = useState(0)

  function handleSendCheckIn(e: React.MouseEvent) {
    e.stopPropagation()
    setSending(true)
    setTimeout(() => {
      sendPulseCheckIn(record.staffId)
      setSending(false)
      setSent(true)
      forceUpdate(n => n + 1)
    }, 700)
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`bg-white rounded-xl border border-l-4 ${meta.border} ${
        isSelected ? 'border-violet-300 shadow-md ring-1 ring-violet-200' : 'border-slate-200 shadow-sm'
      } p-4 cursor-pointer hover:shadow-md transition-all`}
      data-id={`wellbeing-${record.staffId}`}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
          record.burnoutLevel === 'critical' ? 'bg-red-400' :
          record.burnoutLevel === 'high' ? 'bg-orange-400' :
          record.burnoutLevel === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
        }`}>
          {record.avatarInitials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{record.name}</p>
              <p className="text-xs text-slate-400">{record.role} · {record.unit}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${meta.color} ${meta.bg}`}>
              {meta.label}
            </span>
          </div>

          {/* Burnout score + sparkline */}
          <div className="flex items-center gap-3 mt-2">
            <div>
              <p className="text-[9px] text-slate-400 mb-0.5">Burnout</p>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    record.burnoutLevel === 'critical' ? 'bg-red-500' :
                    record.burnoutLevel === 'high' ? 'bg-orange-500' :
                    record.burnoutLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${record.burnoutScore}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' as const, delay: 0.1 }}
                />
              </div>
              <p className={`text-[9px] font-bold mt-0.5 ${meta.color}`}>{record.burnoutScore}/100</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 mb-0.5">Engagement trend</p>
              <MiniSparkline data={record.engagementTrend} level={record.burnoutLevel} />
              <p className="text-[9px] text-slate-500 mt-0.5">{record.engagementScore}/100 now</p>
            </div>
          </div>

          {/* Top risk factor */}
          <p className="text-[10px] text-slate-500 mt-2 leading-tight line-clamp-1">
            ⚠ {record.topRiskFactor}
          </p>

          {/* Pulse + check-in */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              {record.lastPulseScore !== null ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={10}
                      className={star <= record.lastPulseScore! ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                    />
                  ))}
                  <span className="text-[9px] text-slate-400">{record.lastPulseDate}</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-400">No pulse response</span>
              )}
            </div>
            <button
              onClick={handleSendCheckIn}
              disabled={sending || sent}
              aria-label={`Send check-in to ${record.name}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                sent ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {sending ? <span className="w-2.5 h-2.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> :
               sent ? <CheckCircle2 size={10} /> : <Send size={10} />}
              {sent ? 'Sent' : sending ? '…' : 'Check-in'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Staff detail panel ───────────────────────────────────────────────────────

function StaffDetailPanel({
  staffId,
  onClose,
}: {
  staffId: string
  onClose: () => void
}) {
  const record = wellbeingRecords.find(r => r.staffId === staffId)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(() => hasSentCheckIn(staffId))
  if (!record) return null

  const meta = BURNOUT_META[record.burnoutLevel]

  function handleCheckIn() {
    setSending(true)
    setTimeout(() => {
      sendPulseCheckIn(record.staffId)
      setSending(false)
      setSent(true)
    }, 700)
  }

  const factorItems = [
    { label: 'Consecutive days',       value: record.factors.consecutiveDays,  warn: record.factors.consecutiveDays >= 4,     suffix: 'days' },
    { label: 'Hours / 2 weeks',        value: record.factors.hoursLast2Weeks,  warn: record.factors.hoursLast2Weeks >= 80,    suffix: 'hrs' },
    { label: 'Unplanned changes',      value: record.factors.unplannedChanges, warn: record.factors.unplannedChanges >= 3,    suffix: '/mo' },
    { label: 'Call-outs (30 days)',    value: record.factors.callOutsLast30d,  warn: record.factors.callOutsLast30d >= 2,     suffix: '' },
    { label: 'Overtime hours',         value: record.factors.overtimeHours,    warn: record.factors.overtimeHours >= 8,       suffix: 'hrs' },
    { label: 'PTO days taken (YTD)',   value: record.factors.ptoDaysTaken,     warn: record.factors.ptoDaysTaken === 0,       suffix: 'days' },
    { label: 'Weekend shifts (4 wks)', value: record.factors.weekendShifts,    warn: record.factors.weekendShifts >= 4,       suffix: '' },
  ]

  return (
    <motion.div
      key={staffId}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      id="staff-detail-panel"
    >
      {/* Header */}
      <div className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
          record.burnoutLevel === 'critical' ? 'bg-red-400' :
          record.burnoutLevel === 'high' ? 'bg-orange-400' :
          record.burnoutLevel === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
        }`}>{record.avatarInitials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{record.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>{meta.label} Risk</span>
          </div>
          <p className="text-xs text-slate-400">{record.role} · {record.unit}</p>
        </div>
        <button onClick={onClose} aria-label="Close staff detail" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Burnout Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${meta.dot}`}
                initial={{ width: 0 }}
                animate={{ width: `${record.burnoutScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' as const }}
              />
            </div>
            <span className={`text-sm font-bold ${meta.color}`}>{record.burnoutScore}</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Engagement</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${record.engagementScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.1 }}
              />
            </div>
            <span className="text-sm font-bold text-violet-600">{record.engagementScore}</span>
          </div>
        </div>
      </div>

      {/* 8-week trend */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">8-Week Engagement Trend</p>
          <div className="flex items-center gap-1">
            <MiniSparkline data={record.engagementTrend} level={record.burnoutLevel} />
            <span className={`text-[10px] font-bold ml-1 ${
              record.engagementTrend[7] > record.engagementTrend[0] ? 'text-emerald-600' :
              record.engagementTrend[7] < record.engagementTrend[0] ? 'text-red-600' : 'text-slate-500'
            }`}>
              {record.engagementTrend[7] - record.engagementTrend[0] > 0 ? '+' : ''}{record.engagementTrend[7] - record.engagementTrend[0]} pts
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-10">
          {record.engagementTrend.map((v, i) => (
            <motion.div
              key={i}
              className={`flex-1 rounded-t-sm ${
                i === record.engagementTrend.length - 1 ? meta.dot : 'bg-slate-200'
              }`}
              initial={{ height: 0 }}
              animate={{ height: `${(v / 100) * 40}px` }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' as const }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-slate-300">Jan 22</span>
          <span className="text-[8px] text-slate-400 font-bold">Mar 12</span>
        </div>
      </div>

      {/* Risk factors */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Risk Factors</p>
        <div className="space-y-1.5">
          {factorItems.map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">{f.label}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                f.warn ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'
              }`}>
                {f.value}{f.suffix}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended actions */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommended Actions</p>
        <div className="space-y-1.5">
          {record.recommendedActions.map((action, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
              <ArrowRight size={10} className="text-violet-400 mt-0.5 shrink-0" />
              {action}
            </div>
          ))}
        </div>
      </div>

      {/* Retention cost */}
      <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
        <div>
          <p className="text-[10px] text-slate-500">Replacement cost if not retained</p>
          <p className="text-sm font-bold text-red-600">${record.retentionCostIfLeft.toLocaleString()}</p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={sending || sent}
          aria-label={`Send check-in to ${record.name}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            sent ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {sending ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> :
           sent ? <CheckCircle2 size={12} /> : <Send size={12} />}
          {sent ? 'Check-in Sent' : sending ? 'Sending…' : 'Send Check-in'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Action queue card ────────────────────────────────────────────────────────

function ActionCard({
  item,
  onComplete,
}: {
  item: ReturnType<typeof getActionQueue>[0]
  onComplete: (id: string) => void
}) {
  const meta = PRIORITY_META[item.priority]
  const [completing, setCompleting] = useState(false)

  function handleComplete() {
    setCompleting(true)
    setTimeout(() => {
      completeAction(item.id)
      onComplete(item.id)
    }, 500)
  }

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
      data-id={`action-${item.id}`}
    >
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full h-fit mt-0.5 shrink-0 ${meta.color} ${meta.bg}`}>
        {meta.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 leading-tight">{item.staffName} — {item.action}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.reason}</p>
        <p className="text-[10px] text-violet-600 mt-1 font-medium">{item.estimatedImpact}</p>
      </div>
      <button
        onClick={handleComplete}
        disabled={completing}
        aria-label={`Mark complete: ${item.action}`}
        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 transition-colors shrink-0 mt-0.5"
      >
        {completing
          ? <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
          : <CheckCircle2 size={14} />}
      </button>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterLevel = 'all' | 'critical' | 'high' | 'medium' | 'low'
type SortKey = 'burnout' | 'engagement' | 'name' | 'hours'

export default function Wellbeing() {
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all')
  const [sortKey, setSortKey] = useState<SortKey>('burnout')
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [actions, setActions] = useState(() => getActionQueue())
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkSent, setBulkSent] = useState(false)
  const [pulseCount, setPulseCount] = useState(() => getPulseCount())
  const [, forceUpdate] = useState(0)

  const filtered = wellbeingRecords.filter(r => {
    if (filterLevel === 'all') return true
    if (filterLevel === 'critical') return r.burnoutLevel === 'critical'
    if (filterLevel === 'high') return r.burnoutLevel === 'high' || r.burnoutLevel === 'critical'
    return r.burnoutLevel === filterLevel
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'burnout')     return b.burnoutScore - a.burnoutScore
    if (sortKey === 'engagement')  return a.engagementScore - b.engagementScore
    if (sortKey === 'hours')       return b.factors.hoursLast2Weeks - a.factors.hoursLast2Weeks
    return a.name.localeCompare(b.name)
  })

  const activeActions = actions.filter(a => !a.completed)
  const atRisk = wellbeingRecords.filter(r => r.burnoutLevel === 'high' || r.burnoutLevel === 'critical').length
  const trend = hospitalWellbeing.retentionScoreTrend

  function handleBulkCheckIn() {
    setBulkSending(true)
    setTimeout(() => {
      const n = sendPulseCheckIn()
      setBulkSending(false)
      setBulkSent(true)
      setPulseCount(prev => prev + n)
      setTimeout(() => setBulkSent(false), 4000)
      forceUpdate(n => n + 1)
    }, 1000)
  }

  function handleActionComplete(id: string) {
    setActions([...getActionQueue()])
  }

  const filters: { key: FilterLevel; label: string; count: number }[] = [
    { key: 'all',      label: 'All Staff',    count: wellbeingRecords.length },
    { key: 'critical', label: 'Critical',     count: wellbeingRecords.filter(r => r.burnoutLevel === 'critical').length },
    { key: 'high',     label: 'High Risk',    count: wellbeingRecords.filter(r => r.burnoutLevel === 'high').length },
    { key: 'medium',   label: 'Medium',       count: wellbeingRecords.filter(r => r.burnoutLevel === 'medium').length },
    { key: 'low',      label: 'Low Risk',     count: wellbeingRecords.filter(r => r.burnoutLevel === 'low').length },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={20} className="text-rose-500" />
              <h1 className="text-xl font-bold text-slate-800">Staff Wellbeing Center</h1>
            </div>
            <p className="text-sm text-slate-500">
              Retention intelligence · Mercy General Hospital ·
              <span className="font-semibold text-violet-600"> ${hospitalWellbeing.potentialTurnoverSavings.toLocaleString()} savings potential</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/staff" className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors">
              <Users size={13} /> Staff Roster
            </Link>
            <button
              onClick={handleBulkCheckIn}
              disabled={bulkSending || bulkSent}
              aria-label="Send weekly pulse check-in to all staff"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${
                bulkSent ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {bulkSending ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> :
               bulkSent ? <CheckCircle2 size={15} /> : <Send size={15} />}
              {bulkSent ? `Sent to all staff` : bulkSending ? 'Sending…' : 'Send Pulse Check-in'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Alert banner ── */}
        {atRisk >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            aria-label="Burnout risk alert"
          >
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-bold text-red-700">{atRisk} nurses at HIGH or CRITICAL burnout risk — </span>
              <span className="text-sm text-red-600">intervention this week could save up to ${hospitalWellbeing.potentialTurnoverSavings.toLocaleString()} in replacement costs.</span>
            </div>
            <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full shrink-0">Action Required</span>
          </motion.div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Retention ring */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-4">
            <RetentionRing score={hospitalWellbeing.retentionHealthScore} />
            <div>
              <p className="text-xs font-bold text-slate-700">Retention Health</p>
              <div className="flex items-center gap-1 mt-0.5">
                {trend < 0
                  ? <TrendingDown size={12} className="text-red-500" />
                  : <TrendingUp size={12} className="text-emerald-500" />}
                <span className={`text-[11px] font-semibold ${trend < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {trend > 0 ? '+' : ''}{trend} vs last week
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Industry avg: 68</p>
            </div>
          </div>

          {[
            { id: 'stat-at-risk',   label: 'High/Critical Risk', value: atRisk.toString(),  sub: 'need intervention now', color: atRisk > 0 ? 'text-red-600' : 'text-emerald-600', bg: atRisk > 0 ? 'bg-red-50' : 'bg-emerald-50', icon: AlertTriangle },
            { id: 'stat-engagement', label: 'Avg Engagement',    value: `${hospitalWellbeing.avgEngagementScore}`,    sub: '8-week avg declining', color: 'text-violet-600', bg: 'bg-violet-50', icon: Activity },
            { id: 'stat-pto',       label: 'PTO Utilization',    value: `${hospitalWellbeing.ptoUtilizationPct}%`,    sub: 'industry best: 85%', color: hospitalWellbeing.ptoUtilizationPct < 70 ? 'text-amber-600' : 'text-emerald-600', bg: hospitalWellbeing.ptoUtilizationPct < 70 ? 'bg-amber-50' : 'bg-emerald-50', icon: Calendar },
            { id: 'stat-pulse',     label: 'Pulse Responses',    value: `${pulseCount}/8`, sub: 'this week', color: 'text-blue-600', bg: 'bg-blue-50', icon: MessageSquare },
          ].map(s => (
            <div key={s.id} id={s.id} className={`${s.bg} rounded-xl border border-slate-200 shadow-sm px-4 py-3`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.sub}</p>
                </div>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Hospital engagement trend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-violet-500" />
                <p className="text-sm font-semibold text-slate-700">Hospital-Wide Engagement (8 weeks)</p>
              </div>
              <span className={`text-[11px] font-bold flex items-center gap-1 ${trend < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {trend < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {trend < 0 ? 'Declining' : 'Improving'}
              </span>
            </div>
            <HospitalTrendChart />
          </div>

          {/* Burnout risk matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-violet-500" />
              <p className="text-sm font-semibold text-slate-700">Burnout Risk Matrix</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">hours × engagement</span>
            </div>
            <BurnoutMatrix onSelectStaff={(id) => setSelectedStaff(prev => prev === id ? null : id)} />
          </div>
        </div>

        {/* ── Staff grid + detail panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left: staff cards */}
          <div className="xl:col-span-2 space-y-3">
            {/* Filter + sort bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm flex-wrap">
                {filters.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilterLevel(f.key)}
                    aria-label={`Filter by ${f.label}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterLevel === f.key
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                    <span className={`text-[9px] px-1 rounded-full ${filterLevel === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                aria-label="Sort staff by"
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              >
                <option value="burnout">Sort: Burnout Risk</option>
                <option value="engagement">Sort: Engagement ↑</option>
                <option value="hours">Sort: Hours Worked</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {/* Staff cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {sorted.map(record => (
                  <StaffCard
                    key={record.staffId}
                    record={record}
                    isSelected={selectedStaff === record.staffId}
                    onClick={() => setSelectedStaff(prev => prev === record.staffId ? null : record.staffId)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: detail panel or action queue */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {selectedStaff ? (
                <StaffDetailPanel
                  key={selectedStaff}
                  staffId={selectedStaff}
                  onClose={() => setSelectedStaff(null)}
                />
              ) : (
                <motion.div
                  key="action-queue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-violet-500" />
                      <p className="text-sm font-bold text-slate-700">Manager Action Queue</p>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {activeActions.length} pending
                    </span>
                  </div>

                  <AnimatePresence>
                    {activeActions.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-8 text-center"
                        id="action-queue-empty"
                      >
                        <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-emerald-700">All actions complete!</p>
                        <p className="text-xs text-emerald-600 mt-1">Check back after next pulse check-in.</p>
                      </motion.div>
                    ) : (
                      activeActions.map(item => (
                        <ActionCard
                          key={item.id}
                          item={item}
                          onComplete={handleActionComplete}
                        />
                      ))
                    )}
                  </AnimatePresence>

                  {/* Savings estimator */}
                  <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3" id="savings-estimator">
                    <div className="flex items-start gap-2">
                      <DollarSign size={15} className="text-violet-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-violet-800">Retention ROI Estimate</p>
                        <p className="text-[10px] text-violet-600 mt-0.5 leading-relaxed">
                          Addressing all 3 high-risk staff this week could save up to{' '}
                          <span className="font-bold">${hospitalWellbeing.potentialTurnoverSavings.toLocaleString()}</span>{' '}
                          in replacement costs vs. industry average turnover.
                        </p>
                        <p className="text-[9px] text-violet-400 mt-1">
                          Mercy General NurseStation hospitals: 14% avg turnover vs 22% industry
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}
