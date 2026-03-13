import { NavLink, Outlet } from 'react-router-dom'
import { unreadCount as notifUnreadCount, criticalCount as notifCriticalCount } from '../data/notificationsData'
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
  ShieldAlert,
  MessageSquare,
  DollarSign,
  CalendarOff,
  GraduationCap,
  Zap,
  Heart,
  Wand2,
  Layers,
  TrendingUp,
  Brain,
  ClipboardList,
  UserPlus,
  TimerReset,
  AlertOctagon,
  Award,
  BarChart3,
  Fingerprint,
  Receipt,
  UserSearch,
  CalendarDays,
  ArrowLeftRight,
  CalendarCheck,
  Star,
  PiggyBank,
  Waves,
  Building2,
  ShieldCheck,
  PhoneCall,
  Stethoscope,
  Radio,
  Siren,
} from 'lucide-react'

// Pending marketplace approvals count — kept in module scope so it's consistent
const PENDING_APPROVALS = 3
// Expired + critical credentials (2 expired + 2 critical = 4)
const CRED_URGENT = 4
// Unread messages
const MSG_UNREAD = 4

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center', end: true, badge: 0, badgeColor: '' },
  { to: '/marketplace', icon: Store, label: 'Marketplace', end: false, badge: PENDING_APPROVALS, badgeColor: 'bg-amber-500' },
  { to: '/credentials', icon: ShieldAlert, label: 'Credentials', end: false, badge: CRED_URGENT, badgeColor: 'bg-red-500' },
  { to: '/shifts', icon: Calendar, label: 'Shifts', end: false, badge: 0, badgeColor: '' },
  { to: '/staff', icon: Users, label: 'Staff', end: false, badge: 0, badgeColor: '' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', end: false, badge: MSG_UNREAD, badgeColor: 'bg-violet-500' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', end: false, badge: 0, badgeColor: '' },
  { to: '/labor', icon: DollarSign, label: 'Labor Cost', end: false, badge: 0, badgeColor: '' },
  { to: '/time-off', icon: CalendarOff, label: 'Time Off', end: false, badge: 5, badgeColor: 'bg-amber-500' },
  { to: '/training', icon: GraduationCap, label: 'Training',  end: false, badge: 4, badgeColor: 'bg-red-500' },
  { to: '/coverage',   icon: Zap,   label: 'Coverage',   end: false, badge: 2, badgeColor: 'bg-red-500' },
  { to: '/wellbeing',       icon: Heart,  label: 'Wellbeing',      end: false, badge: 3, badgeColor: 'bg-rose-500' },
  { to: '/auto-schedule',  icon: Wand2,   label: 'Auto-Schedule',  end: false, badge: 4, badgeColor: 'bg-violet-500' },
  { to: '/shift-board',   icon: Layers,     label: 'Shift Board',    end: false, badge: 7, badgeColor: 'bg-red-500' },
  { to: '/forecast',      icon: TrendingUp, label: 'Forecast',       end: false, badge: 6, badgeColor: 'bg-red-500' },
  { to: '/people',        icon: Brain,         label: 'Staff Intel',    end: false, badge: 3,  badgeColor: 'bg-red-500' },
  { to: '/charge',        icon: ClipboardList, label: 'Charge Board',   end: false, badge: 2,  badgeColor: 'bg-red-500' },
  { to: '/onboarding',   icon: UserPlus,      label: 'Onboarding',     end: false, badge: 2,  badgeColor: 'bg-amber-500' },
  { to: '/overtime',     icon: TimerReset,    label: 'OT Approvals',   end: false, badge: 3,  badgeColor: 'bg-red-500' },
  { to: '/incidents',   icon: AlertOctagon,  label: 'Incidents',       end: false, badge: 5,  badgeColor: 'bg-red-500' },
  { to: '/recognition', icon: Award,          label: 'Recognition',     end: false, badge: 2,  badgeColor: 'bg-rose-400' },
  { to: '/ratios',      icon: BarChart3,      label: 'Ratio Monitor',   end: false, badge: 2,  badgeColor: 'bg-red-500' },
  { to: '/handoff',     icon: ClipboardList,  label: 'Shift Handoff',   end: false, badge: 4,  badgeColor: 'bg-amber-500' },
  { to: '/timeclock',   icon: Fingerprint,    label: 'Time Clock',      end: false, badge: 0,  badgeColor: '' },
  { to: '/payroll',     icon: Receipt,        label: 'Pay Period Close', end: false, badge: 3,  badgeColor: 'bg-red-500' },
  { to: '/hiring',      icon: UserSearch,     label: 'Talent Pipeline',  end: false, badge: 4,  badgeColor: 'bg-amber-500' },
  { to: '/availability',icon: CalendarDays,   label: 'My Availability',  end: false, badge: 0,  badgeColor: '' },
  { to: '/swaps',         icon: ArrowLeftRight, label: 'Shift Swaps',    end: false, badge: 2,  badgeColor: 'bg-amber-500' },
  { to: '/self-schedule', icon: CalendarCheck,  label: 'Self-Schedule',  end: false, badge: 0,  badgeColor: '' },
  { to: '/scorecard',     icon: Star,           label: 'Scorecards',     end: false, badge: 6,  badgeColor: 'bg-amber-500' },
  { to: '/budget',        icon: PiggyBank,      label: 'Budget Intel',   end: false, badge: 2,  badgeColor: 'bg-red-500' },
  { to: '/float',         icon: Waves,          label: 'Float Pool',     end: false, badge: 3,  badgeColor: 'bg-red-500' },
  { to: '/agency',        icon: Building2,      label: 'Agency Staff',   end: false, badge: 4,  badgeColor: 'bg-amber-500' },
  { to: '/safe-hours',    icon: ShieldCheck,    label: 'Safe Hours',     end: false, badge: 2,  badgeColor: 'bg-red-500' },
  { to: '/oncall',        icon: PhoneCall,      label: 'On-Call',        end: false, badge: 1,  badgeColor: 'bg-violet-500' },
  { to: '/beds',          icon: Stethoscope,    label: 'Census & Beds',  end: false, badge: 1,  badgeColor: 'bg-red-500' },
  { to: '/briefing',      icon: Radio,          label: 'Shift Briefing', end: false, badge: 3,  badgeColor: 'bg-red-500' },
  { to: '/rrt',           icon: Siren,          label: 'RRT & Code Blue', end: false, badge: 1,  badgeColor: 'bg-red-500' },
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
          {navItems.map(({ to, icon: Icon, label, end, badge, badgeColor }) => (
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
                    <span className={`${badgeColor || 'bg-amber-500'} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
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
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
            aria-label={`Notifications — ${notifUnreadCount} unread`}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className="relative" aria-hidden="true">
                  <Bell size={17} />
                  {notifCriticalCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold leading-none">
                      {notifCriticalCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">Notifications</span>
                {notifUnreadCount > 0 && !isActive && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {notifUnreadCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
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
