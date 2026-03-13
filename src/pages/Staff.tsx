import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { allStaff } from '../data/mockData'
import type { StaffMember, StaffRole, StaffStatus } from '../types'

const STATUS_BADGE: Record<StaffStatus, string> = {
  'on-duty': 'bg-emerald-100 text-emerald-700',
  'available': 'bg-blue-100 text-blue-700',
  'off-duty': 'bg-slate-100 text-slate-500',
  'called-out': 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<StaffStatus, string> = {
  'on-duty': 'On Duty',
  'available': 'Available',
  'off-duty': 'Off Duty',
  'called-out': 'Called Out',
}

const ROLES: StaffRole[] = ['Charge RN', 'RN', 'LPN', 'CNA', 'PCT']

function OTBar({ hours, max }: { hours: number; max: number }) {
  const pct = Math.min(100, (hours / max) * 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-semibold ${pct >= 90 ? 'text-red-600' : 'text-slate-500'}`}>
        {hours}h
      </span>
    </div>
  )
}

function StaffRow({ staff }: { staff: StaffMember }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
          staff.status === 'on-duty' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
          staff.status === 'available' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
          'bg-gradient-to-br from-slate-400 to-slate-600'
        }`}>
          {staff.avatarInitials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{staff.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[staff.status]}`}>
              {STATUS_LABEL[staff.status]}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{staff.role}</p>
        </div>

        {/* Units */}
        <div className="hidden md:flex gap-1 flex-wrap max-w-32">
          {staff.unitExperience.slice(0, 2).map(u => (
            <span key={u} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{u}</span>
          ))}
          {staff.unitExperience.length > 2 && (
            <span className="text-[10px] text-slate-400">+{staff.unitExperience.length - 2}</span>
          )}
        </div>

        {/* Hours bar */}
        <div className="w-24 hidden sm:block">
          <OTBar hours={staff.hoursThisWeek} max={staff.overtimeHours} />
        </div>

        {/* Certs */}
        <div className="hidden lg:flex gap-1 flex-wrap max-w-28">
          {staff.certifications.slice(0, 2).map(c => (
            <span key={c} className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">{c}</span>
          ))}
        </div>

        {/* Expand */}
        <div className="text-slate-400">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-5 pb-4 bg-slate-50 border-t border-slate-100"
        >
          <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide mb-1">Phone</p>
              <a href={`tel:${staff.phone}`} className="flex items-center gap-1.5 text-violet-600 hover:text-violet-800 font-medium">
                <Phone size={12} /> {staff.phone}
              </a>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide mb-1">Hours This Week</p>
              <p className="font-bold text-slate-800">{staff.hoursThisWeek} / {staff.overtimeHours}h</p>
              <p className="text-[11px] text-slate-400">{staff.overtimeHours - staff.hoursThisWeek}h before OT</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide mb-1">All Certifications</p>
              <div className="flex flex-wrap gap-1">
                {staff.certifications.map(c => (
                  <span key={c} className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide mb-1">Unit Experience</p>
              <div className="flex flex-wrap gap-1">
                {staff.unitExperience.map(u => (
                  <span key={u} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">{u}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function Staff() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = allStaff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      || s.unitExperience.some(u => u.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchRole = roleFilter === 'all' || s.role === roleFilter
    return matchSearch && matchStatus && matchRole
  })

  const onDutyCount = allStaff.filter(s => s.status === 'on-duty').length
  const availableCount = allStaff.filter(s => s.status === 'available').length

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-violet-500" />
              Staff Roster
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-emerald-600 font-semibold">{onDutyCount} on duty</span>
              <span className="text-blue-600 font-semibold">{availableCount} available</span>
              <span className="text-slate-400">{allStaff.length} total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Search + filter bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or unit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              showFilters ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
            }`}
          >
            <Filter size={15} />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-6"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'on-duty', 'available', 'off-duty', 'called-out'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : STATUS_LABEL[s as StaffStatus]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Role</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${roleFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All Roles
                </button>
                {ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${roleFilter === r ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Column headers */}
          <div className="grid px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wide"
            style={{ gridTemplateColumns: '2.25rem 1fr 8rem 6rem 7rem' }}>
            <div />
            <div>Name / Role</div>
            <div className="hidden md:block">Units</div>
            <div className="hidden sm:block">Hours</div>
            <div className="hidden lg:block">Certs</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">No staff match your filters</p>
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all') }}
                className="mt-2 text-sm text-violet-600 hover:underline">Clear filters</button>
            </div>
          ) : (
            filtered.map(s => <StaffRow key={s.id} staff={s} />)
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">{filtered.length} of {allStaff.length} staff shown</p>
      </div>
    </div>
  )
}
