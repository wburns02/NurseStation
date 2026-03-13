import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  MessageSquare,
  Search,
  Hash,
  User,
  Send,
  CheckCheck,
  Bell,
  Shield,
  Calendar,
  Phone,
  ChevronRight,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  Paperclip,
  Smile,
  AtSign,
  MoreHorizontal,
} from 'lucide-react'
import {
  conversations,
  getMessages,
  AUTO_RESPONSES,
  type Conversation,
  type Message,
  type MessageType,
} from '../data/messagesData'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarBg(initials: string, overrideColor?: string): string {
  if (overrideColor) return overrideColor
  const colors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600']
  const idx = initials.charCodeAt(0) % colors.length
  return colors[idx]
}

function Avatar({
  initials,
  color,
  size = 'md',
  online,
}: {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div className="relative shrink-0">
      <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            online ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MSG_ICON: Partial<Record<MessageType, React.ElementType>> = {
  'system-alert': AlertTriangle,
  'system-success': CheckCircle2,
  'system-info': Info,
  'gap-card': Zap,
  'shift-card': Calendar,
  'credential-card': Shield,
}

const MSG_STYLE: Partial<Record<MessageType, string>> = {
  'system-alert': 'border-l-2 border-red-400 bg-red-50',
  'system-success': 'border-l-2 border-emerald-400 bg-emerald-50',
  'system-info': 'border-l-2 border-blue-400 bg-blue-50',
  'gap-card': 'border-l-2 border-red-400 bg-red-50',
  'shift-card': 'border-l-2 border-amber-400 bg-amber-50',
  'credential-card': 'border-l-2 border-red-400 bg-red-50',
}

const MSG_ICON_COLOR: Partial<Record<MessageType, string>> = {
  'system-alert': 'text-red-500',
  'system-success': 'text-emerald-500',
  'system-info': 'text-blue-500',
  'gap-card': 'text-red-500',
  'shift-card': 'text-amber-500',
  'credential-card': 'text-red-500',
}

function MessageBubble({
  msg,
  isViewer,
  showAvatar,
  onAction,
}: {
  msg: Message
  isViewer: boolean
  showAvatar: boolean
  onAction: (msgId: string, actionId: string) => void
}) {
  const isSystem =
    msg.type !== 'text' ||
    (msg.senderId === 'system' && msg.type === 'text')
  const Icon = MSG_ICON[msg.type]
  const systemStyle = MSG_STYLE[msg.type] ?? ''
  const iconColor = MSG_ICON_COLOR[msg.type] ?? 'text-slate-500'

  if (msg.senderId === 'system' || isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-center"
      >
        <div className={`max-w-lg w-full rounded-xl px-4 py-3 ${systemStyle || 'border-l-2 border-slate-300 bg-slate-50'}`}>
          <div className="flex items-start gap-2.5">
            {Icon && <Icon size={14} className={`mt-0.5 shrink-0 ${iconColor}`} />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">{msg.content}</p>
              {msg.card && (
                <div className="mt-2 bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-800">{msg.card.title}</p>
                    {msg.card.badgeText && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${msg.card.badgeColor}`}>
                        {msg.card.badgeText}
                      </span>
                    )}
                  </div>
                  {msg.card.subtitle && (
                    <p className="text-[11px] text-slate-500">{msg.card.subtitle}</p>
                  )}
                  {msg.card.meta && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{msg.card.meta}</p>
                  )}
                  {msg.card.actions && msg.card.actions.length > 0 && (
                    <div className="flex gap-1.5 mt-2.5">
                      {msg.card.actions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => onAction(msg.id, action.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            action.variant === 'primary'
                              ? 'bg-violet-600 hover:bg-violet-700 text-white'
                              : action.variant === 'danger'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1.5">{msg.timestamp}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (isViewer) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="max-w-xs">
          <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <p className="text-[10px] text-slate-400">{msg.timestamp}</p>
            <CheckCheck size={12} className="text-violet-400" />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2.5"
    >
      {showAvatar ? (
        <Avatar initials={msg.senderInitials} color={avatarBg(msg.senderInitials)} size="sm" />
      ) : (
        <div className="w-7 shrink-0" />
      )}
      <div className="max-w-xs">
        {showAvatar && (
          <p className="text-[11px] font-semibold text-slate-600 mb-1">
            {msg.senderName}
            {msg.senderRole && <span className="text-slate-400 font-normal ml-1">· {msg.senderRole}</span>}
          </p>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-slate-800 leading-relaxed">{msg.content}</p>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{msg.timestamp}</p>
      </div>
    </motion.div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-400">{name} is typing…</p>
    </motion.div>
  )
}

// ─── Context Panel ────────────────────────────────────────────────────────────

function ContextPanel({ conv }: { conv: Conversation }) {
  const isChannel = conv.type === 'channel'

  if (isChannel) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Channel Info</p>
          <div className={`w-10 h-10 ${conv.avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-sm mb-2`}>
            <Hash size={16} />
          </div>
          <p className="text-sm font-bold text-slate-900">{conv.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{conv.description}</p>
        </div>

        {conv.id === 'ch-icu' && (
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Live Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Current Staffing</span>
                <span className="text-xs font-bold text-red-600">3/4</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '75%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Day Shift · Today</span>
                <span className="font-semibold text-red-500">1 gap</span>
              </div>
            </div>
          </div>
        )}

        {conv.id === 'ch-ms-b' && (
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Live Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Current Staffing</span>
                <span className="text-xs font-bold text-red-600">3/5</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Day Shift · Today</span>
                <span className="font-semibold text-red-500">2 gaps</span>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="space-y-1.5">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
              <Zap size={13} className="text-violet-500" />
              <span className="text-xs font-medium text-slate-700">Open Smart Fill</span>
              <ChevronRight size={12} className="ml-auto text-slate-300" />
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
              <Bell size={13} className="text-amber-500" />
              <span className="text-xs font-medium text-slate-700">Broadcast Alert</span>
              <ChevronRight size={12} className="ml-auto text-slate-300" />
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
              <Calendar size={13} className="text-blue-500" />
              <span className="text-xs font-medium text-slate-700">View Unit Schedule</span>
              <ChevronRight size={12} className="ml-auto text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Direct message context
  return (
    <div className="h-full flex flex-col">
      {/* Staff profile */}
      <div className="px-4 py-5 border-b border-slate-100 text-center">
        <Avatar
          initials={conv.avatarInitials}
          color={conv.avatarColor}
          size="lg"
          online={conv.staffStatus === 'on-duty' || conv.staffStatus === 'available'}
        />
        <p className="text-sm font-bold text-slate-900 mt-2">{conv.name}</p>
        <p className="text-xs text-slate-500">{conv.staffRole}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{conv.staffUnit}</p>
        <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          conv.staffStatus === 'on-duty'
            ? 'bg-emerald-100 text-emerald-700'
            : conv.staffStatus === 'available'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-500'
        }`}>
          {conv.staffStatus === 'on-duty' ? 'On Duty' : conv.staffStatus === 'available' ? 'Available' : 'Off Duty'}
        </span>
      </div>

      {/* Phone */}
      {conv.staffPhone && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Contact</p>
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-400" />
            <span className="text-xs text-slate-700">{conv.staffPhone}</span>
          </div>
        </div>
      )}

      {/* Active items related to this staff member */}
      {conv.id === 'dm-james' && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Active Requests</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <p className="text-xs font-bold text-amber-800">Shift Swap Pending</p>
            <p className="text-[11px] text-amber-700 mt-0.5">ICU Day · Sat Mar 14 → Sarah Chen</p>
            <p className="text-[10px] text-amber-600 mt-1">Awaiting your approval</p>
          </div>
        </div>
      )}
      {conv.id === 'dm-lisa' && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Credential Status</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
            <p className="text-xs font-bold text-red-800">RNC-NIC Expiring</p>
            <p className="text-[11px] text-red-700 mt-0.5">Expires Apr 2 · 21 days remaining</p>
            <p className="text-[10px] text-red-600 mt-1">Renewal exam scheduled Mar 20</p>
          </div>
        </div>
      )}
      {conv.id === 'dm-sarah' && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Today's Assignment</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            <p className="text-xs font-bold text-emerald-800">ICU Day Shift</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">07:00–15:00 · Confirmed</p>
            <p className="text-[10px] text-emerald-600 mt-1">Match score 95% · CCRN certified</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Quick Actions</p>
        <div className="space-y-1.5">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
            <User size={13} className="text-violet-500" />
            <span className="text-xs font-medium text-slate-700">View Staff Profile</span>
            <ChevronRight size={12} className="ml-auto text-slate-300" />
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
            <Shield size={13} className="text-blue-500" />
            <span className="text-xs font-medium text-slate-700">View Credentials</span>
            <ChevronRight size={12} className="ml-auto text-slate-300" />
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
            <Calendar size={13} className="text-teal-500" />
            <span className="text-xs font-medium text-slate-700">View Their Schedule</span>
            <ChevronRight size={12} className="ml-auto text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Messages() {
  const [activeConvId, setActiveConvId] = useState<string>('ch-icu')
  const [convMessages, setConvMessages] = useState<Record<string, Message[]>>(() => {
    const init: Record<string, Message[]> = {}
    for (const c of conversations) {
      init[c.id] = getMessages(c.id)
    }
    return init
  })
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    for (const c of conversations) m[c.id] = c.unreadCount
    return m
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [composeText, setComposeText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [actionDone, setActionDone] = useState<Record<string, string>>({})
  const [showContextPanel, setShowContextPanel] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const composeRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)!
  const messages = convMessages[activeConvId] ?? []

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Mark conversation as read when selected
  useEffect(() => {
    setUnreadMap(m => ({ ...m, [activeConvId]: 0 }))
  }, [activeConvId])

  const filteredConvs = conversations.filter(
    c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const pinnedConvs = filteredConvs.filter(c => c.type === 'channel')
  const directConvs = filteredConvs.filter(c => c.type === 'direct')

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0)

  const handleSend = useCallback(async () => {
    if (!composeText.trim() || sending) return
    const text = composeText.trim()
    setComposeText('')
    setSending(true)

    const newMsg: Message = {
      id: `new-${Date.now()}`,
      senderId: 'viewer',
      senderName: 'Janet Morrison',
      senderInitials: 'JM',
      content: text,
      timestamp: 'just now',
      type: 'text',
      isRead: true,
    }

    setConvMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), newMsg],
    }))
    setSending(false)

    // Auto-response for DMs
    const autoResp = AUTO_RESPONSES[activeConvId]
    if (autoResp) {
      setTimeout(() => setTyping(true), 600)
      setTimeout(() => {
        setTyping(false)
        const respMsg: Message = {
          id: `auto-${Date.now()}`,
          senderId: activeConvId.replace('dm-', 'e999'),
          senderName: autoResp.senderName,
          senderInitials: autoResp.senderInitials,
          senderRole: autoResp.senderRole,
          content: autoResp.message,
          timestamp: 'just now',
          type: 'text',
          isRead: true,
        }
        setConvMessages(prev => ({
          ...prev,
          [activeConvId]: [...(prev[activeConvId] ?? []), respMsg],
        }))
      }, autoResp.delay)
    }
  }, [composeText, sending, activeConvId])

  const handleAction = useCallback((msgId: string, actionId: string) => {
    setActionDone(prev => ({ ...prev, [msgId]: actionId }))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const itemVariant: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ── Left: Conversation List ─────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageSquare size={15} className="text-violet-500" />
              Messages
              {totalUnread > 0 && (
                <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {totalUnread}
                </span>
              )}
            </h2>
            <button className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-colors"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-2">
          {pinnedConvs.length > 0 && (
            <div className="px-3 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">Channels</p>
              {pinnedConvs.map(conv => (
                <ConvRow
                  key={conv.id}
                  conv={conv}
                  isActive={activeConvId === conv.id}
                  unread={unreadMap[conv.id] ?? 0}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))}
            </div>
          )}

          {directConvs.length > 0 && (
            <div className="px-3 mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">Direct Messages</p>
              {directConvs.map(conv => (
                <ConvRow
                  key={conv.id}
                  conv={conv}
                  isActive={activeConvId === conv.id}
                  unread={unreadMap[conv.id] ?? 0}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* HIPAA notice */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2">
          <Shield size={11} className="text-emerald-500 shrink-0" />
          <p className="text-[10px] text-slate-400 font-medium">End-to-end encrypted · HIPAA compliant</p>
        </div>
      </aside>

      {/* ── Center: Message Thread ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        {/* Thread header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3 bg-white">
          <Avatar
            initials={activeConv.avatarInitials}
            color={activeConv.avatarColor}
            size="md"
            online={activeConv.type === 'direct'
              ? (activeConv.staffStatus === 'on-duty' || activeConv.staffStatus === 'available')
              : undefined
            }
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {activeConv.type === 'channel' && <Hash size={13} className="text-slate-400 shrink-0" />}
              <p className="text-sm font-bold text-slate-900 truncate">{activeConv.name}</p>
            </div>
            {activeConv.description && (
              <p className="text-[11px] text-slate-500 truncate">{activeConv.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {activeConv.type === 'direct' && (
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title="Call">
                <Phone size={15} />
              </button>
            )}
            <button
              onClick={() => setShowContextPanel(v => !v)}
              className={`p-2 rounded-lg transition-colors ${showContextPanel ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-400'}`}
              title="Toggle info panel"
            >
              <Info size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-slate-50/40">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1]
              const showAvatar =
                !prevMsg ||
                prevMsg.senderId !== msg.senderId ||
                msg.senderId === 'system'

              // If action taken, update card display
              const displayMsg = actionDone[msg.id]
                ? {
                    ...msg,
                    card: msg.card
                      ? {
                          ...msg.card,
                          badgeText: actionDone[msg.id] === 'approve' ? 'Approved ✓' : actionDone[msg.id] === 'deny' ? 'Denied' : 'Done',
                          badgeColor: actionDone[msg.id] === 'approve' ? 'bg-emerald-100 text-emerald-700' : actionDone[msg.id] === 'deny' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500',
                          actions: [],
                        }
                      : undefined,
                  }
                : msg

              return (
                <motion.div key={msg.id} variants={itemVariant} initial="hidden" animate="visible">
                  <MessageBubble
                    msg={displayMsg}
                    isViewer={msg.senderId === 'viewer'}
                    showAvatar={showAvatar}
                    onAction={handleAction}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && activeConv.type === 'direct' && (
              <TypingIndicator name={activeConv.name} />
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Compose */}
        <div className="px-4 py-3 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-violet-300 focus-within:bg-white transition-colors">
            <textarea
              ref={composeRef}
              value={composeText}
              onChange={e => setComposeText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                activeConv.type === 'channel'
                  ? `Message #${activeConv.name.toLowerCase().replace(' ', '-')}…`
                  : `Message ${activeConv.name}…`
              }
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors" title="Attach">
                <Paperclip size={14} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors" title="Emoji">
                <Smile size={14} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors" title="Mention">
                <AtSign size={14} />
              </button>
              <button
                onClick={handleSend}
                disabled={!composeText.trim() || sending}
                className={`p-2 rounded-xl transition-all ${
                  composeText.trim()
                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">
            Press <kbd className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-mono">Enter</kbd> to send ·
            <kbd className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </main>

      {/* ── Right: Context Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showContextPanel && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0"
          >
            <div className="w-68 h-full overflow-y-auto">
              <ContextPanel conv={activeConv} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Conversation Row (sidebar item) ─────────────────────────────────────────

function ConvRow({
  conv,
  isActive,
  unread,
  onClick,
}: {
  conv: Conversation
  isActive: boolean
  unread: number
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
        isActive ? 'bg-violet-600 text-white' : 'hover:bg-slate-200/70 text-slate-700'
      }`}
    >
      {conv.type === 'channel' ? (
        <div className={`w-7 h-7 ${isActive ? 'bg-violet-700' : conv.avatarColor} rounded-lg flex items-center justify-center shrink-0`}>
          <Hash size={12} className="text-white" />
        </div>
      ) : (
        <div className="relative shrink-0">
          <div className={`w-7 h-7 ${isActive ? 'bg-violet-700' : conv.avatarColor} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
            {conv.avatarInitials}
          </div>
          {conv.staffStatus === 'on-duty' && !isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-50" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-white' : unread > 0 ? 'text-slate-900' : 'text-slate-600'}`}>
          {conv.name}
        </p>
        <p className={`text-[10px] truncate mt-0.5 leading-tight ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>
          {conv.lastMessage}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className={`text-[9px] ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>{conv.lastMessageAt}</p>
        {unread > 0 && !isActive && (
          <span className="bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            {unread}
          </span>
        )}
      </div>
    </motion.button>
  )
}
