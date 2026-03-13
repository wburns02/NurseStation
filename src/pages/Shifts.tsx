import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import { weeklySchedule, ALL_SHIFTS } from '../data/mockData'

const DAYS = [
  { label: 'Sun', date: 'Mar 9', dateNum: 9 },
  { label: 'Mon', date: 'Mar 10', dateNum: 10 },
  { label: 'Tue', date: 'Mar 11', dateNum: 11 },
  { label: 'Wed', date: 'Mar 12', dateNum: 12, isToday: true },
  { label: 'Thu', date: 'Mar 13', dateNum: 13 },
  { label: 'Fri', date: 'Mar 14', dateNum: 14 },
  { label: 'Sat', date: 'Mar 15', dateNum: 15 },
]

const SHIFT_COLORS: Record<string, string> = {
  day: 'bg-amber-50 border-amber-200',
  evening: 'bg-blue-50 border-blue-200',
  night: 'bg-slate-100 border-slate-300',
}

const SHIFT_HEADER: Record<string, string> = {
  day: 'bg-amber-100 text-amber-800',
  evening: 'bg-blue-100 text-blue-800',
  night: 'bg-slate-200 text-slate-700',
}

const CELL_GAP = 'bg-red-50 border border-dashed border-red-300 text-red-500 text-xs font-semibold rounded px-2 py-1'
const CELL_NORMAL = 'text-xs text-slate-700 bg-white border border-slate-100 rounded px-2 py-1'
const CELL_CHARGE = 'text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded px-2 py-1'

function StaffCell({ name }: { name: string }) {
  const isGap = name.includes('OPEN')
  const isCharge = name.includes('Charge')
  const cls = isGap ? CELL_GAP : isCharge ? CELL_CHARGE : CELL_NORMAL
  return <div className={cls}>{isGap ? '— OPEN SHIFT —' : name}</div>
}

export default function Shifts() {
  const [selectedUnit, setSelectedUnit] = useState<string>('ICU')
  const units = Object.keys(weeklySchedule)

  const staffList = weeklySchedule[selectedUnit]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-violet-500" />
              Shift Schedule
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Week of March 9 – 15, 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button className="px-4 py-1.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors">
              Today
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Unit tabs */}
        <div className="flex gap-2 flex-wrap">
          {units.map(u => (
            <button
              key={u}
              onClick={() => setSelectedUnit(u)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selectedUnit === u
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {u}
            </button>
          ))}
          <span className="px-3 py-1.5 text-xs text-slate-400 self-center">More units coming soon…</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" />Day 07:00–15:00</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" />Evening 15:00–23:00</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" />Night 23:00–07:00</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-dashed border-red-300 inline-block" />Open gap</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-50 border border-violet-200 inline-block" />Charge RN</span>
        </div>

        {/* Schedule grid */}
        <motion.div
          key={selectedUnit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Day headers */}
          <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
            <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Shift</div>
            {DAYS.map(d => (
              <div
                key={d.dateNum}
                className={`px-2 py-3 text-center border-l border-slate-100 ${d.isToday ? 'bg-violet-50' : ''}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide ${d.isToday ? 'text-violet-600' : 'text-slate-500'}`}>
                  {d.label}
                </p>
                <p className={`text-sm font-black mt-0.5 ${d.isToday ? 'text-violet-700' : 'text-slate-800'}`}>
                  {d.dateNum}
                  {d.isToday && <span className="ml-1 text-[10px] bg-violet-600 text-white px-1 rounded-full">Today</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Shift rows */}
          {ALL_SHIFTS.map(shift => (
            <div
              key={shift.type}
              className="grid border-b border-slate-100 last:border-0"
              style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}
            >
              {/* Shift label */}
              <div className={`px-4 py-4 border-r border-slate-100 ${SHIFT_COLORS[shift.type]} flex flex-col justify-center`}>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded self-start ${SHIFT_HEADER[shift.type]}`}>
                  {shift.type}
                </span>
                <span className="text-xs text-slate-500 mt-1">{shift.start}–{shift.end}</span>
              </div>

              {/* Day cells */}
              {DAYS.map(d => {
                const dayStaff = staffList[shift.type] ?? []
                const isToday = d.isToday
                return (
                  <div
                    key={d.dateNum}
                    className={`px-2 py-3 border-l border-slate-100 space-y-1 ${isToday ? 'bg-violet-50/30' : ''}`}
                  >
                    {isToday ? (
                      dayStaff.map((name, i) => <StaffCell key={i} name={name} />)
                    ) : (
                      // Simulate generic staffed days
                      <div className="text-[11px] text-slate-400 italic">
                        {shift.type === 'night' ? '3 staff' : '4 staff'} scheduled
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </motion.div>

        {/* Open gaps alert */}
        {staffList && Object.values(staffList).flat().some(n => n.includes('OPEN')) && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">Open shifts detected in {selectedUnit}</p>
              <p className="text-xs text-red-500 mt-0.5">Go to Command Center to fill these gaps using smart staff matching.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
