import { motion } from 'framer-motion'
import { BarChart2, TrendingDown, TrendingUp, Clock, AlertTriangle, Zap } from 'lucide-react'
import { shortfallTrend, fillTimeTrend, unitGapCounts, patternAlerts } from '../data/mockData'

const DAYS_LABELS = ['Feb 27', 'Feb 28', 'Mar 1', 'Mar 2', 'Mar 3', 'Mar 4', 'Mar 5',
  'Mar 6', 'Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11', 'Mar 12']

function BarChartSVG({
  data,
  color,
  height = 80,
  label,
}: {
  data: number[]
  color: string
  height?: number
  label?: string
}) {
  const max = Math.max(...data, 1)
  const w = 100 / data.length
  return (
    <div className="relative">
      {label && <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-2">{label}</p>}
      <svg width="100%" height={height} className="overflow-visible">
        {data.map((v, i) => {
          const barH = (v / max) * (height - 16)
          const x = i * w + w * 0.15
          const barW = w * 0.7
          return (
            <g key={i}>
              <rect
                x={`${x}%`}
                y={height - barH - 1}
                width={`${barW}%`}
                height={barH}
                rx={2}
                className={`${color} transition-all duration-500`}
                opacity={i === data.length - 1 ? 1 : 0.65}
              />
              {i % 3 === 0 && (
                <text
                  x={`${i * w + w / 2}%`}
                  y={height + 12}
                  textAnchor="middle"
                  className="fill-slate-400"
                  style={{ fontSize: 8 }}
                >
                  {DAYS_LABELS[i]?.split(' ')[1]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend === 'up' ? 'text-red-500' : 'text-emerald-500'
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        {trend !== 'neutral' && (
          <TrendIcon size={14} className={trendColor} />
        )}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function UnitGapBar({ unit, gaps: gapCount, avgFill, maxGaps }: { unit: string; gaps: number; avgFill: number; maxGaps: number }) {
  const pct = (gapCount / maxGaps) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-semibold text-slate-700 truncate">{unit}</span>
      <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded flex items-center px-2"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' as const }}
        >
          <span className="text-white text-[10px] font-bold whitespace-nowrap">{gapCount} gaps</span>
        </motion.div>
      </div>
      <span className="w-16 text-[11px] text-slate-400 text-right">{avgFill}m avg fill</span>
    </div>
  )
}

export default function Analytics() {
  const maxGaps = Math.max(...unitGapCounts.map(u => u.gaps))
  const avgShortfall = (shortfallTrend.reduce((a, b) => a + b, 0) / shortfallTrend.length).toFixed(1)
  const avgFill = Math.round(fillTimeTrend.reduce((a, b) => a + b, 0) / fillTimeTrend.length)
  const totalGaps30d = shortfallTrend.reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart2 size={20} className="text-violet-500" />
            Analytics & Trends
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Last 14 days · Mercy General Hospital</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key metrics */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            { label: 'Avg Daily Shortfall', value: `${avgShortfall}`, sub: 'staff gaps per day', trend: 'up' as const, icon: AlertTriangle, color: 'bg-red-500' },
            { label: 'Avg Fill Time', value: `${avgFill}m`, sub: 'min to fill a gap', trend: 'down' as const, icon: Clock, color: 'bg-amber-500' },
            { label: 'Gaps This Period', value: `${totalGaps30d}`, sub: 'last 14 days', trend: 'up' as const, icon: TrendingDown, color: 'bg-violet-500' },
            { label: 'OT Hours (Week)', value: '127h', sub: 'across all units', trend: 'neutral' as const, icon: Zap, color: 'bg-blue-500' },
          ].map((m, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <MetricCard {...m} />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Shortfall trend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Staffing Shortfall</h3>
                <p className="text-[11px] text-slate-400">Gaps per day · last 14 days</p>
              </div>
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">↑ trending up</span>
            </div>
            <BarChartSVG data={shortfallTrend} color="fill-red-400" height={90} />
          </div>

          {/* Fill time trend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Avg Gap Fill Time (minutes)</h3>
                <p className="text-[11px] text-slate-400">Minutes to fill each gap · last 14 days</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full">↓ improving</span>
            </div>
            <BarChartSVG data={fillTimeTrend} color="fill-violet-400" height={90} />
          </div>
        </div>

        {/* Gap counts by unit */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Gaps by Unit (30 days)</h3>
          <p className="text-[11px] text-slate-400 mb-5">Units sorted by total gap count</p>
          <div className="space-y-3">
            {unitGapCounts.map(u => (
              <UnitGapBar key={u.unit} {...u} maxGaps={maxGaps} />
            ))}
          </div>
        </div>

        {/* AI Pattern Alerts */}
        <div className="bg-violet-900 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-violet-300" />
            <h3 className="text-sm font-bold text-violet-100">AI-Detected Patterns</h3>
            <span className="ml-auto text-[11px] text-violet-400 bg-violet-800 px-2 py-0.5 rounded-full">90-day analysis</span>
          </div>
          <div className="space-y-2">
            {patternAlerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 bg-violet-800/50 rounded-xl px-4 py-3"
              >
                <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-100 leading-relaxed">{alert}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
