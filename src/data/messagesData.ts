// messagesData.ts — realistic pre-populated messaging data

export type MessageType =
  | 'text'
  | 'system-info'
  | 'system-alert'
  | 'system-success'
  | 'shift-card'
  | 'gap-card'
  | 'credential-card'

export interface MessageAction {
  id: string
  label: string
  variant: 'primary' | 'secondary' | 'danger'
}

export interface MessageCard {
  title: string
  subtitle?: string
  meta?: string
  badgeText?: string
  badgeColor?: string
  actions?: MessageAction[]
}

export interface Message {
  id: string
  senderId: string   // 'system' | 'viewer' | staff id
  senderName: string
  senderInitials: string
  senderRole?: string
  content: string
  timestamp: string  // relative label: "just now" | "2m ago" | "8:14 AM" | "Yesterday"
  type: MessageType
  card?: MessageCard
  isRead: boolean
}

export interface Conversation {
  id: string
  type: 'channel' | 'direct'
  name: string
  description?: string
  avatarInitials: string
  avatarColor: string
  unreadCount: number
  lastMessage: string
  lastMessageAt: string
  isPinned: boolean
  // for direct — the other person's details
  staffId?: string
  staffRole?: string
  staffUnit?: string
  staffStatus?: 'on-duty' | 'available' | 'off-duty'
  staffPhone?: string
}

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversations: Conversation[] = [
  // Pinned channels
  {
    id: 'ch-icu',
    type: 'channel',
    name: 'ICU Team',
    description: 'Intensive Care Unit · 4th Floor',
    avatarInitials: 'IC',
    avatarColor: 'bg-violet-600',
    unreadCount: 2,
    lastMessage: 'Maria: I can potentially cover — need to check on childcare',
    lastMessageAt: '9:43 AM',
    isPinned: true,
  },
  {
    id: 'ch-ed',
    type: 'channel',
    name: 'ED Team',
    description: 'Emergency Department · 1st Floor',
    avatarInitials: 'ED',
    avatarColor: 'bg-red-600',
    unreadCount: 0,
    lastMessage: 'System: Thu Mar 13 evening gap — proactive fill recommended',
    lastMessageAt: '7:02 AM',
    isPinned: true,
  },
  {
    id: 'ch-ms-b',
    type: 'channel',
    name: 'Med-Surg B',
    description: 'Medical-Surgical B · 3rd Floor',
    avatarInitials: 'MB',
    avatarColor: 'bg-teal-600',
    unreadCount: 1,
    lastMessage: 'Christine: Morning Janet — Nina Petrov called out sick',
    lastMessageAt: '6:31 AM',
    isPinned: false,
  },
  {
    id: 'ch-alerts',
    type: 'channel',
    name: 'Staffing Alerts',
    description: 'Automated system notifications',
    avatarInitials: 'SA',
    avatarColor: 'bg-amber-500',
    unreadCount: 0,
    lastMessage: 'Schedule for Mar 16–22 published by Janet Morrison',
    lastMessageAt: 'Yesterday',
    isPinned: false,
  },
  // Direct messages
  {
    id: 'dm-james',
    type: 'direct',
    name: 'James Okafor',
    avatarInitials: 'JO',
    avatarColor: 'bg-blue-600',
    unreadCount: 1,
    lastMessage: 'Sarah Chen said she might be able to — I think she\'s messaging you now',
    lastMessageAt: '8:52 AM',
    isPinned: false,
    staffId: 'e002',
    staffRole: 'RN',
    staffUnit: 'ICU',
    staffStatus: 'on-duty',
    staffPhone: '(555) 201-0002',
  },
  {
    id: 'dm-sarah',
    type: 'direct',
    name: 'Sarah Chen',
    avatarInitials: 'SC',
    avatarColor: 'bg-emerald-600',
    unreadCount: 0,
    lastMessage: 'You\'re a lifesaver Sarah, thank you!',
    lastMessageAt: '7:38 AM',
    isPinned: false,
    staffId: 's001',
    staffRole: 'RN',
    staffUnit: 'ICU / CCU',
    staffStatus: 'on-duty',
    staffPhone: '(555) 204-3981',
  },
  {
    id: 'dm-lisa',
    type: 'direct',
    name: 'Lisa Greenwald',
    avatarInitials: 'LG',
    avatarColor: 'bg-rose-600',
    unreadCount: 1,
    lastMessage: 'I\'m aware! Already scheduled my renewal exam for Mar 20.',
    lastMessageAt: 'Yesterday',
    isPinned: false,
    staffId: 'e021',
    staffRole: 'Charge RN',
    staffUnit: 'NICU',
    staffStatus: 'on-duty',
    staffPhone: '(555) 201-0021',
  },
  {
    id: 'dm-christine',
    type: 'direct',
    name: 'Christine Park',
    avatarInitials: 'CP',
    avatarColor: 'bg-orange-600',
    unreadCount: 0,
    lastMessage: 'You: Thanks Christine, I\'m on it. Looking at float pool options.',
    lastMessageAt: '6:34 AM',
    isPinned: false,
    staffId: 'e016',
    staffRole: 'Charge RN',
    staffUnit: 'Med-Surg B',
    staffStatus: 'on-duty',
    staffPhone: '(555) 201-0016',
  },
]

// ─── Message Threads ──────────────────────────────────────────────────────────

const MSGS: Record<string, Message[]> = {

  'ch-icu': [
    {
      id: 'm1', senderId: 'e001', senderName: 'Priya Sharma', senderInitials: 'PS',
      senderRole: 'Charge RN',
      content: 'Good morning everyone 🌅 Please review the updated sepsis response protocol before your shift. Dr. Nguyen made changes to the vasopressor order set. PDF in the shared drive.',
      timestamp: '6:55 AM', type: 'text', isRead: true,
    },
    {
      id: 'm2', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Schedule for week of Mar 16–22 published by Janet Morrison. All ICU staff have been notified.',
      timestamp: '7:01 AM', type: 'system-success', isRead: true,
    },
    {
      id: 'm3', senderId: 'e002', senderName: 'James Okafor', senderInitials: 'JO',
      senderRole: 'RN',
      content: 'Quick ask — anyone free to cover an extra hour on Mar 14? I\'m trying to arrange a handoff and could use overlap. Not mandatory just helpful.',
      timestamp: '8:15 AM', type: 'text', isRead: true,
    },
    {
      id: 'm4', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Gap alert: ICU Day Shift today is at 3/4 staffed. Sarah Chen (float pool) has been notified.',
      timestamp: '9:12 AM', type: 'system-alert',
      card: {
        title: 'ICU · Day Shift · Mar 12',
        subtitle: '3 of 4 required — 1 RN needed',
        badgeText: 'Open Gap',
        badgeColor: 'bg-red-100 text-red-700',
      },
      isRead: false,
    },
    {
      id: 'm5', senderId: 'e003', senderName: 'Maria Santos', senderInitials: 'MS',
      senderRole: 'RN',
      content: 'I can potentially cover — need to check on childcare. Will confirm by 10am.',
      timestamp: '9:43 AM', type: 'text', isRead: false,
    },
  ],

  'ch-ed': [
    {
      id: 'm1', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Predictive alert: Thu Mar 13 Evening has historically low fill rates (last 4 weeks). Recommend proactive outreach to float pool.',
      timestamp: '7:02 AM', type: 'system-alert',
      card: {
        title: 'ED · Evening Shift · Thu Mar 13',
        subtitle: '4 of 5 staffed — consider early fill',
        badgeText: 'Pattern Risk',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      isRead: true,
    },
    {
      id: 'm2', senderId: 'e007', senderName: 'Nathan Foster', senderInitials: 'NF',
      senderRole: 'Charge RN',
      content: 'New triage protocol effective Monday March 16. All ED staff MUST complete the 20-min online module before then. Link shared in training portal.',
      timestamp: '8:30 AM', type: 'text', isRead: true,
    },
    {
      id: 'm3', senderId: 'e008', senderName: 'Fatima Hassan', senderInitials: 'FH',
      senderRole: 'RN',
      content: 'Re the Thursday evening gap — I can pick it up if needed. Just let me know by Wednesday so I can plan.',
      timestamp: '11:20 AM', type: 'text', isRead: true,
    },
    {
      id: 'm4', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'Thanks Fatima! I\'ll confirm Thursday by EOD. Really appreciate the heads up.',
      timestamp: '11:45 AM', type: 'text', isRead: true,
    },
  ],

  'ch-ms-b': [
    {
      id: 'm1', senderId: 'e016', senderName: 'Christine Park', senderInitials: 'CP',
      senderRole: 'Charge RN',
      content: 'Morning Janet — just a heads up that Nina Petrov called out sick for today. Found out about 20 mins ago. We\'re going to be short without coverage.',
      timestamp: '6:31 AM', type: 'text', isRead: false,
    },
    {
      id: 'm2', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Med-Surg B Day Shift is now 2/5 staffed — 2 critical gaps. Smart Fill has identified 3 candidates.',
      timestamp: '6:32 AM', type: 'system-alert',
      card: {
        title: 'Med-Surg B · Day Shift · Mar 12',
        subtitle: '2 of 5 staffed — 2 RNs needed urgently',
        badgeText: 'Critical',
        badgeColor: 'bg-red-100 text-red-700',
        actions: [{ id: 'fill', label: 'Open Smart Fill', variant: 'primary' }],
      },
      isRead: true,
    },
    {
      id: 'm3', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'Thanks Christine. I\'m on it — looking at float pool options now. Will have someone for you ASAP.',
      timestamp: '6:34 AM', type: 'text', isRead: true,
    },
  ],

  'ch-alerts': [
    {
      id: 'm1', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Next week\'s schedule (Mar 16–22) has been generated with 124/126 shifts filled.',
      timestamp: 'Yesterday 4:15 PM', type: 'system-success',
      card: {
        title: 'Schedule Published · Mar 16–22',
        subtitle: '124 of 126 shifts filled · 2 gaps in Marketplace',
        badgeText: 'Published',
        badgeColor: 'bg-emerald-100 text-emerald-700',
      },
      isRead: true,
    },
    {
      id: 'm2', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Credential expiry: James Okafor BLS certification expired Feb 28. Reminder sent.',
      timestamp: 'Yesterday 9:00 AM', type: 'system-alert',
      card: {
        title: 'Credential Expired · James Okafor',
        subtitle: 'BLS · Expired Feb 28, 2026',
        badgeText: 'Expired',
        badgeColor: 'bg-red-100 text-red-700',
      },
      isRead: true,
    },
    {
      id: 'm3', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Shift swap approved: Sean Murphy ↔ Tyler Barnes (Med-Surg B, Sat Mar 15 Evening).',
      timestamp: 'Yesterday 2:30 PM', type: 'system-success', isRead: true,
    },
    {
      id: 'm4', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Med-Surg B weekend callout rate is 23% above 30-day average. Recommend adding standby coverage for Sat–Sun.',
      timestamp: 'Mar 10 8:00 AM', type: 'system-info', isRead: true,
    },
  ],

  'dm-james': [
    {
      id: 'm1', senderId: 'e002', senderName: 'James Okafor', senderInitials: 'JO',
      senderRole: 'RN · ICU',
      content: 'Hey Janet — I have a family obligation on March 14. Is there any chance I could swap my day shift? I posted it on the Marketplace already.',
      timestamp: '8:20 AM', type: 'text', isRead: true,
    },
    {
      id: 'm2', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'Hi James! I saw the marketplace request. Do you have someone in mind who can cover, or should I look at the float pool?',
      timestamp: '8:35 AM', type: 'text', isRead: true,
    },
    {
      id: 'm3', senderId: 'e002', senderName: 'James Okafor', senderInitials: 'JO',
      senderRole: 'RN · ICU',
      content: 'Sarah Chen said she might be able to — I think she\'s messaging you now. She\'s got CCRN and knows ICU well.',
      timestamp: '8:52 AM', type: 'text', isRead: false,
    },
    {
      id: 'm4', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Shift swap request pending manager approval.',
      timestamp: '8:53 AM', type: 'shift-card',
      card: {
        title: 'Shift Swap Request',
        subtitle: 'James Okafor → ICU Day Shift · Sat Mar 14',
        meta: 'Sarah Chen as proposed replacement · CCRN certified · 8 hrs to OT limit',
        badgeText: 'Pending Approval',
        badgeColor: 'bg-amber-100 text-amber-700',
        actions: [
          { id: 'approve', label: 'Approve Swap', variant: 'primary' },
          { id: 'deny', label: 'Deny', variant: 'danger' },
        ],
      },
      isRead: false,
    },
  ],

  'dm-sarah': [
    {
      id: 'm1', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Gap fill request sent to Sarah Chen — ICU Day Shift today (Mar 12). Awaiting response.',
      timestamp: '6:45 AM', type: 'gap-card',
      card: {
        title: 'Gap Fill Request Sent',
        subtitle: 'ICU Day Shift · Wed Mar 12 · 07:00–15:00',
        meta: 'Match score: 95% · CCRN certified · 8 hrs to OT limit',
        badgeText: 'Awaiting Response',
        badgeColor: 'bg-amber-100 text-amber-700',
      },
      isRead: true,
    },
    {
      id: 'm2', senderId: 's001', senderName: 'Sarah Chen', senderInitials: 'SC',
      senderRole: 'RN · Float Pool',
      content: 'Happy to help! I\'ll be there. Just need to arrange a quick pickup for my kids — I\'ll be there by 7:15 at the latest. See you!',
      timestamp: '6:58 AM', type: 'text', isRead: true,
    },
    {
      id: 'm3', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'ICU Day Shift gap filled by Sarah Chen.',
      timestamp: '6:59 AM', type: 'system-success',
      card: {
        title: 'Gap Filled ✓',
        subtitle: 'ICU Day Shift · Wed Mar 12',
        badgeText: 'Confirmed',
        badgeColor: 'bg-emerald-100 text-emerald-700',
      },
      isRead: true,
    },
    {
      id: 'm4', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'You\'re a lifesaver Sarah, thank you! Schedule updated. 💙',
      timestamp: '7:38 AM', type: 'text', isRead: true,
    },
  ],

  'dm-lisa': [
    {
      id: 'm1', senderId: 'system', senderName: 'NurseStation', senderInitials: 'NS',
      content: 'Renewal reminder sent to Lisa Greenwald.',
      timestamp: 'Yesterday 9:00 AM', type: 'credential-card',
      card: {
        title: 'Credential Expiry Reminder Sent',
        subtitle: 'RNC-NIC · Expires Apr 2, 2026 · 21 days remaining',
        badgeText: 'Critical',
        badgeColor: 'bg-red-100 text-red-700',
      },
      isRead: true,
    },
    {
      id: 'm2', senderId: 'e021', senderName: 'Lisa Greenwald', senderInitials: 'LG',
      senderRole: 'Charge RN · NICU',
      content: 'Hi Janet — I\'m aware! Already scheduled my renewal exam for March 20th. I should have the updated cert within a week of that. Sorry for the close timing — it snuck up on me.',
      timestamp: 'Yesterday 10:15 AM', type: 'text', isRead: false,
    },
    {
      id: 'm3', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'Perfect, glad to hear it! Make sure to upload the new cert to your profile as soon as you have it — it needs to clear compliance before it shows green.',
      timestamp: 'Yesterday 10:30 AM', type: 'text', isRead: true,
    },
    {
      id: 'm4', senderId: 'e021', senderName: 'Lisa Greenwald', senderInitials: 'LG',
      senderRole: 'Charge RN · NICU',
      content: 'Will do! And for what it\'s worth — love this new messaging feature. Way easier than trying to reach you by phone at 6am. 😄',
      timestamp: 'Yesterday 10:32 AM', type: 'text', isRead: false,
    },
  ],

  'dm-christine': [
    {
      id: 'm1', senderId: 'e016', senderName: 'Christine Park', senderInitials: 'CP',
      senderRole: 'Charge RN · Med-Surg B',
      content: 'Morning Janet — just a heads up that Nina Petrov called out sick for today. Found out about 20 mins ago. We\'re going to be short-staffed without coverage.',
      timestamp: '6:31 AM', type: 'text', isRead: true,
    },
    {
      id: 'm2', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'Thanks Christine. I\'m on it — looking at float pool options now. Will have someone for you ASAP.',
      timestamp: '6:34 AM', type: 'text', isRead: true,
    },
    {
      id: 'm3', senderId: 'e016', senderName: 'Christine Park', senderInitials: 'CP',
      senderRole: 'Charge RN · Med-Surg B',
      content: 'Thank you. The morning team is managing for now but we\'ll need coverage by 9am ideally. The unit\'s pretty heavy today.',
      timestamp: '6:37 AM', type: 'text', isRead: true,
    },
    {
      id: 'm4', senderId: 'viewer', senderName: 'Janet Morrison', senderInitials: 'JM',
      content: 'On it. Tyler Barnes is available and familiar with your unit. I\'ll confirm in the next 10 min.',
      timestamp: '6:41 AM', type: 'text', isRead: true,
    },
  ],
}

export function getMessages(conversationId: string): Message[] {
  return MSGS[conversationId] ?? []
}

// Total unread count across all conversations
export const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

// Auto-response library: if viewer sends a message to these DMs, a response comes back
export const AUTO_RESPONSES: Record<string, { delay: number; message: string; senderInitials: string; senderName: string; senderRole: string }> = {
  'dm-james': {
    delay: 2800,
    senderInitials: 'JO',
    senderName: 'James Okafor',
    senderRole: 'RN · ICU',
    message: 'Sounds good, thanks Janet! Really appreciate you working with me on this.',
  },
  'dm-sarah': {
    delay: 2200,
    senderInitials: 'SC',
    senderName: 'Sarah Chen',
    senderRole: 'RN · Float Pool',
    message: 'Of course! Always happy to help the team. 😊',
  },
  'dm-lisa': {
    delay: 3500,
    senderInitials: 'LG',
    senderName: 'Lisa Greenwald',
    senderRole: 'Charge RN · NICU',
    message: 'Will do, thanks for staying on top of it.',
  },
  'dm-christine': {
    delay: 1800,
    senderInitials: 'CP',
    senderName: 'Christine Park',
    senderRole: 'Charge RN · Med-Surg B',
    message: 'Perfect, thank you! We appreciate it.',
  },
}
