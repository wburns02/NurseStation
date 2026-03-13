import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, TrendingUp, Minus, Users } from 'lucide-react'
import type { Unit } from '../types'

const statusConfig = {
  critical: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'CRITICAL',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  warning: {
    border: 'border-amber-400',
    bg: 'bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    label: 'SHORT',
    icon: Minus,
    iconColor: 'text-amber-500',
  },
  adequate: {
    border: 'border-emerald-300',
    bg: 'bg-white',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'STAFFED',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  surplus: {
    border: 'border-blue-300',
    bg: 'bg-white',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    label: 'SURPLUS',
    icon: TrendingUp,
    iconColor: 'text-blue-500',
  },
}

interface Props {
  unit: Unit
  onFillGap?: (unitId: string) => void
}

export default function UnitCard({ unit, onFillGap }: Props) {
  const cfg = statusConfig[unit.status]
  const Icon = cfg.icon
  const censusPercent = Math.round((unit.currentCensus / unit.capacity) * 100)
  const staffPercent = Math.min(100, Math.round((unit.staffed / unit.required) * 100))

  return (
    <motion.div
      layout
      className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3 relative overflow-hidden`}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      {/* Critical pulse ring */}
      {unit.status === 'critical' && (
        <span className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight">{unit.shortName}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">{unit.floor}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge} flex items-center gap-1`}>
          <Icon size={10} />
          {cfg.label}
        </span>
      </div>

      {/* Census */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-slate-500 font-medium">Census</span>
          <span className="text-[11px] font-semibold text-slate-700">{unit.currentCensus}/{unit.capacity}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-600 rounded-full transition-all duration-500"
            style={{ width: `${censusPercent}%` }}
          />
        </div>
      </div>

      {/* Staffing */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-slate-500 font-medium">Staffing</span>
          <span className={`text-[11px] font-bold ${unit.staffed < unit.required ? 'text-red-600' : 'text-emerald-600'}`}>
            {unit.staffed}/{unit.required}
            {unit.openGaps > 0 && <span className="ml-1 text-red-500">({unit.openGaps} gap{unit.openGaps > 1 ? 's' : ''})</span>}
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              staffPercent < 80 ? 'bg-red-500' : staffPercent < 100 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${staffPercent}%` }}
          />
        </div>
      </div>

      {/* Staff avatars */}
      <div className="flex items-center gap-1.5">
        <Users size={11} className="text-slate-400 shrink-0" />
        <div className="flex -space-x-1.5 flex-wrap gap-y-1">
          {unit.currentStaff.slice(0, 5).map(s => (
            <div
              key={s.id}
              title={`${s.name} · ${s.role}`}
              className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600"
            >
              {s.avatarInitials}
            </div>
          ))}
          {unit.currentStaff.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[9px] font-semibold text-slate-500">
              +{unit.currentStaff.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      {unit.notes && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-snug">
          {unit.notes}
        </p>
      )}

      {/* Fill gap button */}
      {unit.openGaps > 0 && onFillGap && (
        <button
          onClick={() => onFillGap(unit.id)}
          className="mt-auto w-full py-1.5 text-[11px] font-bold rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors"
        >
          Fill {unit.openGaps} Gap{unit.openGaps > 1 ? 's' : ''} →
        </button>
      )}
    </motion.div>
  )
}
