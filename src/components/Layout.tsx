import { useState } from 'react'
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
  ChevronDown,
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
  Gauge,
  Sparkles,
  BookOpen,
  MonitorDot,
  HeartPulse,
  UserMinus,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
  badge?: number
  badgeColor?: string
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    id: 'ops',
    title: 'Operations',
    items: [
      { to: '/shift-board', icon: Layers, label: 'Shift Board', badge: 7, badgeColor: 'bg-red-500' },
      { to: '/coverage', icon: Zap, label: 'Coverage', badge: 2, badgeColor: 'bg-red-500' },
      { to: '/beds', icon: Stethoscope, label: 'Census & Beds', badge: 1, badgeColor: 'bg-amber-500' },
      { to: '/ratios', icon: BarChart3, label: 'Ratio Monitor', badge: 2, badgeColor: 'bg-red-500' },
      { to: '/acuity', icon: HeartPulse, label: 'Acuity Intel', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/live', icon: MonitorDot, label: 'Live Operations', badge: 3, badgeColor: 'bg-red-500' },
      { to: '/rrt', icon: Siren, label: 'RRT & Code Blue', badge: 1, badgeColor: 'bg-red-500' },
    ],
  },
  {
    id: 'sched',
    title: 'Scheduling',
    items: [
      { to: '/shifts', icon: Calendar, label: 'Shifts' },
      { to: '/auto-schedule', icon: Wand2, label: 'Auto-Schedule', badge: 4, badgeColor: 'bg-violet-500' },
      { to: '/self-schedule', icon: CalendarCheck, label: 'Self-Schedule' },
      { to: '/swaps', icon: ArrowLeftRight, label: 'Shift Swaps', badge: 2, badgeColor: 'bg-amber-500' },
      { to: '/availability', icon: CalendarDays, label: 'My Availability' },
      { to: '/handoff', icon: ClipboardList, label: 'Shift Handoff', badge: 4, badgeColor: 'bg-amber-500' },
      { to: '/float', icon: Waves, label: 'Float Pool', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/oncall', icon: PhoneCall, label: 'On-Call', badge: 1, badgeColor: 'bg-violet-500' },
    ],
  },
  {
    id: 'staff',
    title: 'Staff',
    items: [
      { to: '/staff', icon: Users, label: 'Directory' },
      { to: '/marketplace', icon: Store, label: 'Marketplace', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/credentials', icon: ShieldAlert, label: 'Credentials', badge: 4, badgeColor: 'bg-red-500' },
      { to: '/training', icon: GraduationCap, label: 'Training', badge: 4, badgeColor: 'bg-red-500' },
      { to: '/skills', icon: BookOpen, label: 'Competency', badge: 4, badgeColor: 'bg-amber-500' },
      { to: '/onboarding', icon: UserPlus, label: 'Onboarding', badge: 2, badgeColor: 'bg-amber-500' },
      { to: '/people', icon: Brain, label: 'Staff Intel', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/hiring', icon: UserSearch, label: 'Talent Pipeline', badge: 4, badgeColor: 'bg-amber-500' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & Labor',
    items: [
      { to: '/labor', icon: DollarSign, label: 'Labor Cost' },
      { to: '/budget', icon: PiggyBank, label: 'Budget Intel', badge: 2, badgeColor: 'bg-red-500' },
      { to: '/payroll', icon: Receipt, label: 'Pay Period Close', badge: 3, badgeColor: 'bg-red-500' },
      { to: '/timeclock', icon: Fingerprint, label: 'Time Clock' },
      { to: '/overtime', icon: TimerReset, label: 'OT Approvals', badge: 3, badgeColor: 'bg-red-500' },
      { to: '/safe-hours', icon: ShieldCheck, label: 'Safe Hours', badge: 2, badgeColor: 'bg-amber-500' },
      { to: '/agency', icon: Building2, label: 'Agency Staff', badge: 4, badgeColor: 'bg-amber-500' },
    ],
  },
  {
    id: 'quality',
    title: 'Quality & Wellbeing',
    items: [
      { to: '/wellbeing', icon: Heart, label: 'Wellbeing', badge: 3, badgeColor: 'bg-rose-500' },
      { to: '/recognition', icon: Award, label: 'Recognition' },
      { to: '/incidents', icon: AlertOctagon, label: 'Incidents', badge: 5, badgeColor: 'bg-red-500' },
      { to: '/experience', icon: Sparkles, label: 'Pt. Experience', badge: 2, badgeColor: 'bg-amber-500' },
      { to: '/retention', icon: UserMinus, label: 'Turnover Intel', badge: 8, badgeColor: 'bg-red-500' },
      { to: '/time-off', icon: CalendarOff, label: 'Time Off', badge: 5, badgeColor: 'bg-amber-500' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Intel',
    items: [
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/forecast', icon: TrendingUp, label: 'Forecast', badge: 6, badgeColor: 'bg-amber-500' },
      { to: '/scorecard', icon: Star, label: 'Scorecards', badge: 6, badgeColor: 'bg-amber-500' },
      { to: '/productivity', icon: Gauge, label: 'Productivity', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/briefing', icon: Radio, label: 'Shift Briefing', badge: 3, badgeColor: 'bg-amber-500' },
      { to: '/charge', icon: ClipboardList, label: 'Charge Board', badge: 2, badgeColor: 'bg-amber-500' },
    ],
  },
]

// Sum all badges in a section
function sectionBadgeTotal(items: NavItem[]): number {
  return items.reduce((sum, item) => sum + (item.badge || 0), 0)
}

function SidebarSection({
  section,
  expanded,
  onToggle,
}: {
  section: NavSection
  expanded: boolean
  onToggle: () => void
}) {
  const total = sectionBadgeTotal(section.items)

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 text-left">{section.title}</span>
        {!expanded && total > 0 && (
          <span className="bg-slate-700 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {total}
          </span>
        )}
      </button>
      {expanded && (
        <div className="space-y-px pb-1">
          {section.items.map(({ to, icon: Icon, label, end, badge, badgeColor }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-2.5 mx-2 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && badge > 0 && !isActive && (
                    <span className={`${badgeColor || 'bg-slate-600'} text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none`}>
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={13} className="opacity-50" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ops: true,
    sched: true,
    staff: true,
    finance: true,
    quality: true,
    analytics: true,
  })

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] bg-slate-900 flex flex-col shrink-0 shadow-xl">
        {/* Logo / Brand */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Activity size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[13px] leading-tight tracking-tight">NurseStation</p>
              <p className="text-slate-500 text-[11px]">Mercy General Hospital</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-[11px] font-medium">Live · Day Shift</span>
          </div>
        </div>

        {/* Command Center — always pinned at top */}
        <div className="px-2 pt-3 pb-1">
          <NavLink
            to="/"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-2.5 mx-0 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <LayoutDashboard size={16} className={isActive ? 'text-white' : 'text-violet-400'} />
                <span className="flex-1">Command Center</span>
                {isActive && <ChevronRight size={13} className="opacity-50" />}
              </>
            )}
          </NavLink>
        </div>

        {/* Scrollable nav sections */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-1 py-1">
          {sections.map(section => (
            <SidebarSection
              key={section.id}
              section={section}
              expanded={expandedSections[section.id] ?? false}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </nav>

        {/* Bottom: Messages + Notifications */}
        <div className="px-2 py-2 border-t border-white/[0.06] space-y-px">
          <NavLink
            to="/messages"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all ${
                isActive ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <MessageSquare size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span className="flex-1">Messages</span>
                {!isActive && (
                  <span className="bg-violet-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                    4
                  </span>
                )}
                {isActive && <ChevronRight size={13} className="opacity-50" />}
              </>
            )}
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all ${
                isActive ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`
            }
            aria-label={`Notifications — ${notifUnreadCount} unread`}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className="relative" aria-hidden="true">
                  <Bell size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {notifCriticalCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </div>
                <span className="flex-1">Notifications</span>
                {notifUnreadCount > 0 && !isActive && (
                  <span className="bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                    {notifUnreadCount}
                  </span>
                )}
                {isActive && <ChevronRight size={13} className="opacity-50" />}
              </>
            )}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all ${
                isActive ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`
            }
          >
            <Settings size={15} className="text-slate-500" />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              JM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-semibold truncate">Janet Morrison, RN</p>
              <p className="text-slate-500 text-[10px]">Staffing Coordinator</p>
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
