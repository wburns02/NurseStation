import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  ArrowLeftRight,
  Calendar,
  MessageSquare,
  Zap,
  CheckCircle2,
  Check,
  CheckCheck,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react'
import {
  allNotifications as initialNotifications,
  getNotificationsByFilter,
  criticalCount,
} from '../data/notificationsData'
import type { Notification, NotifType, NotifSeverity } from '../data/notificationsData'

// ─── module-level state so reads/dismissals persist across nav ────────────────
let _notifications = [...initialNotifications]

// ─── type → icon + color ──────────────────────────────────────────────────────
const TYPE_META: Record<NotifType, { icon: React.ElementType; label: string; color: string }> = {
  gap:        { icon: Zap,           label: 'Gap',        color: 'text-orange-500' },
  credential: { icon: ShieldAlert,   label: 'Credential', color: 'text-red-500' },
  swap:       { icon: ArrowLeftRight,label: 'Swap',       color: 'text-blue-500' },
  schedule:   { icon: Calendar,      label: 'Schedule',   color: 'text-violet-500' },
  message:    { icon: MessageSquare, label: 'Message',    color: 'text-teal-500' },
  system:     { icon: AlertTriangle, label: 'System',     color: 'text-amber-500' },
}

const SEV_STYLE: Record<NotifSeverity, { bar: string; bg: string; dot: string }> = {
  critical: { bar: 'bg-red-500',    bg: 'bg-red-50 border-red-100',     dot: 'bg-red-500' },
  warning:  { bar: 'bg-amber-400',  bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-400' },
  info:     { bar: 'bg-blue-400',   bg: 'bg-blue-50 border-blue-100',   dot: 'bg-blue-400' },
  success:  { bar: 'bg-emerald-400',bg: 'bg-white border-slate-100',    dot: 'bg-emerald-400' },
}

type FilterKey = 'all' | 'critical' | 'gap' | 'credential' | 'swap' | 'schedule' | 'message' | 'activity'

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'critical',   label: 'Critical' },
  { key: 'gap',        label: 'Gaps' },
  { key: 'credential', label: 'Credentials' },
  { key: 'swap',       label: 'Swaps' },
  { key: 'schedule',   label: 'Schedule' },
  { key: 'message',    label: 'Messages' },
  { key: 'activity',   label: 'Activity' },
]

// ─── Action button styles ─────────────────────────────────────────────────────
const ACTION_BTN: Record<string, string> = {
  primary:   'bg-violet-600 hover:bg-violet-700 text-white',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
}

// ─── Group notifications by time ──────────────────────────────────────────────
function groupByTime(notifs: Notification[]): { label: string; items: Notification[] }[] {
  const NOW = Date.now()
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1)

  const today:     Notification[] = []
  const yesterday: Notification[] = []
  const older:     Notification[] = []

  for (const n of notifs) {
    if (n.timestampSort >= todayStart.getTime()) today.push(n)
    else if (n.timestampSort >= yesterdayStart.getTime()) yesterday.push(n)
    else older.push(n)
  }

  const groups = []
  if (today.length)     groups.push({ label: 'Today',     items: today })
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday })
  if (older.length)     groups.push({ label: 'Older',     items: older })
  return groups

  void NOW
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotifCard({
  notif,
  onMarkRead,
  onDismiss,
}: {
  notif: Notification
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const navigate = useNavigate()
  const sev = SEV_STYLE[notif.severity]
  const typeMeta = TYPE_META[notif.type]
  const TypeIcon = typeMeta.icon

  function handleCardClick() {
    onMarkRead(notif.id)
    if (notif.link) navigate(notif.link)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' as const }}
      data-id={`notif-${notif.id}`}
      className={`relative rounded-xl border overflow-hidden ${sev.bg} ${notif.isRead ? 'opacity-75' : ''}`}
    >
      {/* Left severity bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${sev.bar}`} />

      <div className="pl-4 pr-4 pt-3.5 pb-3">
        {/* Top row: icon + title + unread dot + time + dismiss */}
        <div className="flex items-start gap-2.5 mb-1.5">
          {/* Type icon */}
          <div className={`shrink-0 mt-0.5 ${typeMeta.color}`}>
            <TypeIcon size={15} />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold text-slate-900 leading-snug cursor-pointer hover:text-violet-700 transition-colors ${notif.link ? 'underline-offset-2 hover:underline' : ''}`}
                onClick={handleCardClick}
              >
                {notif.title}
              </span>
              {!notif.isRead && (
                <span className={`inline-flex w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
              )}
              {notif.isResolved && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                  Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
              {notif.unit && (
                <span className="text-[10px] text-slate-400">· {notif.unit}</span>
              )}
              {notif.staffName && (
                <span className="text-[10px] text-slate-400">· {notif.staffName}</span>
              )}
            </div>
          </div>

          {/* Timestamp + dismiss */}
          <div className="flex items-center gap-2 shrink-0 ml-1">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
            <button
              onClick={() => onDismiss(notif.id)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Body */}
        <p className="text-xs text-slate-600 leading-relaxed ml-6 mb-2.5">
          {notif.body}
        </p>

        {/* Tags */}
        {notif.tags && notif.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 ml-6 mb-2.5">
            {notif.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {notif.actions && notif.actions.length > 0 && !notif.isResolved && (
          <div className="flex flex-wrap items-center gap-2 ml-6">
            {notif.actions.map(action => (
              <button
                key={action.actionId}
                onClick={() => onMarkRead(notif.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${ACTION_BTN[action.variant]}`}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
            {notif.link && (
              <button
                onClick={handleCardClick}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors ml-1"
              >
                View details <ChevronRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Summary stats bar ────────────────────────────────────────────────────────
function StatsBar({ notifications }: { notifications: Notification[] }) {
  const critical = notifications.filter(n => n.severity === 'critical' && !n.isResolved).length
  const unread   = notifications.filter(n => !n.isRead).length
  const pending  = notifications.filter(n => n.actions && n.actions.length > 0 && !n.isResolved).length
  const resolved = notifications.filter(n => n.isResolved).length

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Critical',       value: critical, color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
        { label: 'Unread',         value: unread,   color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
        { label: 'Action Needed',  value: pending,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
        { label: 'Resolved Today', value: resolved, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
      ].map(stat => (
        <div key={stat.label} className={`rounded-xl border p-3 text-center ${stat.bg}`}>
          <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(_notifications)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  function markRead(id: string) {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      _notifications = updated
      return updated
    })
  }

  function dismiss(id: string) {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      _notifications = updated
      return updated
    })
  }

  function markAllRead() {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }))
      _notifications = updated
      return updated
    })
  }

  const filtered = useMemo(() => {
    let list = getNotificationsByFilter(activeFilter, notifications)
    if (showUnreadOnly) list = list.filter(n => !n.isRead)
    return list.sort((a, b) => b.timestampSort - a.timestampSort)
  }, [notifications, activeFilter, showUnreadOnly])

  const groups = useMemo(() => groupByTime(filtered), [filtered])

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<FilterKey, number>> = {}
    const unreadList = notifications.filter(n => !n.isRead)
    counts.all        = unreadList.length
    counts.critical   = unreadList.filter(n => n.severity === 'critical').length
    counts.gap        = unreadList.filter(n => n.type === 'gap').length
    counts.credential = unreadList.filter(n => n.type === 'credential').length
    counts.swap       = unreadList.filter(n => n.type === 'swap').length
    counts.schedule   = unreadList.filter(n => n.type === 'schedule').length
    counts.message    = unreadList.filter(n => n.type === 'message').length
    counts.activity   = 0
    return counts
  }, [notifications])

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Bell size={20} className="text-violet-500" />
              Notification Center
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread · ${criticalCount} critical requiring action`
                : 'All caught up — no unread notifications'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                showUnreadOnly
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
              }`}
              aria-label="Toggle unread only filter"
            >
              <Filter size={14} />
              Unread only
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                aria-label="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5">
          {TABS.map(tab => {
            const count = tabCounts[tab.key] ?? 0
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                aria-label={`Filter: ${tab.label}`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <StatsBar notifications={notifications} />

        {/* Notifications list */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-lg font-bold text-slate-700">All clear!</p>
            <p className="text-sm text-slate-400 mt-1">
              {showUnreadOnly ? 'No unread notifications in this category.' : 'No notifications match this filter.'}
            </p>
            {showUnreadOnly && (
              <button
                onClick={() => setShowUnreadOnly(false)}
                className="mt-3 text-sm text-violet-600 hover:underline font-semibold"
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.label}>
                {/* Group label */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {group.label}
                  </p>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400">{group.items.length}</span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {group.items.map(notif => (
                      <NotifCard
                        key={notif.id}
                        notif={notif}
                        onMarkRead={markRead}
                        onDismiss={dismiss}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer tally */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>{filtered.length} notifications shown</span>
            {notifications.filter(n => n.isRead).length > 0 && (
              <button
                onClick={() => setNotifications(prev => prev.filter(n => !n.isRead || !n.isResolved))}
                className="flex items-center gap-1 hover:text-slate-600 transition-colors"
              >
                <Check size={11} /> Clear resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
