import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart2,
  Bell,
  Settings,
  Activity,
  ChevronRight,
  Store,
} from 'lucide-react'

// Pending marketplace approvals count — kept in module scope so it's consistent
const PENDING_APPROVALS = 3

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center', end: true, badge: 0 },
  { to: '/marketplace', icon: Store, label: 'Marketplace', end: false, badge: PENDING_APPROVALS },
  { to: '/shifts', icon: Calendar, label: 'Shifts', end: false, badge: 0 },
  { to: '/staff', icon: Users, label: 'Staff', end: false, badge: 0 },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', end: false, badge: 0 },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col shrink-0 shadow-xl">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">NurseStation</p>
              <p className="text-slate-500 text-xs">Mercy General Hospital</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 text-xs font-medium">Live · Day Shift</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon size={17} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && !isActive && (
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-0.5">
          <NavLink
            to="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            aria-label="Notifications — 5 unread"
          >
            <div className="relative" aria-hidden="true">
              <Bell size={17} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold leading-none">
                5
              </span>
            </div>
            <span className="flex-1">Notifications</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Settings size={17} />
            Settings
          </NavLink>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
              JM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Janet Morrison, RN</p>
              <p className="text-slate-500 text-[11px]">Staffing Coordinator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
