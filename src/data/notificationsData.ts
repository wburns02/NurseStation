// notificationsData.ts — rich, realistic notification feed for the Activity Center
// Reference date: March 12, 2026 (Thursday)

export type NotifType =
  | 'gap'         // staffing gap alerts
  | 'credential'  // credential expiry / compliance
  | 'swap'        // shift swap requests / approvals
  | 'schedule'    // schedule changes / publications
  | 'message'     // direct message activity
  | 'system'      // system alerts, OT warnings, callouts

export type NotifSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface NotifAction {
  label: string
  actionId: string
  variant: 'primary' | 'secondary' | 'danger'
}

export interface Notification {
  id: string
  type: NotifType
  severity: NotifSeverity
  title: string
  body: string
  unit?: string
  staffName?: string
  timestamp: string      // display string: "2m ago", "8:14 AM", "Yesterday 9:00 AM"
  timestampSort: number  // Unix ms for sort order
  isRead: boolean
  isResolved: boolean
  actions?: NotifAction[]
  link?: string          // optional route to navigate to
  tags?: string[]        // e.g. ["ICU", "Day Shift"]
}

// ─── Notification feed ────────────────────────────────────────────────────────

const NOW = Date.now()
const mins = (n: number) => NOW - n * 60_000
const hrs  = (n: number) => NOW - n * 3_600_000
const days = (n: number) => NOW - n * 86_400_000

export const allNotifications: Notification[] = [

  // ── CRITICAL ────────────────────────────────────────────────────────────────

  {
    id: 'n001',
    type: 'gap',
    severity: 'critical',
    title: 'ICU Day Shift — 1 RN gap open now',
    body: 'ICU is at 3/4 staffed. Trauma patient in Bed 4 requires 1:1 ratio — this gap is patient safety critical. Sarah Chen (float) has been notified but hasn\'t confirmed yet.',
    unit: 'ICU',
    timestamp: '23m ago',
    timestampSort: mins(23),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Open Smart Fill', actionId: 'smartfill-icu', variant: 'primary' },
      { label: 'Message Sarah Chen', actionId: 'msg-sarah', variant: 'secondary' },
    ],
    link: '/',
    tags: ['ICU', 'Day Shift', 'Patient Safety'],
  },
  {
    id: 'n002',
    type: 'gap',
    severity: 'critical',
    title: 'Med-Surg B — 2 RN gaps (Nina Petrov called out)',
    body: 'Nina Petrov called out sick at 6:18 AM. Med-Surg B is now at 3/5 staffed with 24 patients. Christine Park (charge) has been notified. Float pool candidates identified.',
    unit: 'Med-Surg B',
    staffName: 'Nina Petrov',
    timestamp: '47m ago',
    timestampSort: mins(47),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Fill Gaps', actionId: 'smartfill-msb', variant: 'primary' },
      { label: 'View Unit', actionId: 'view-msb', variant: 'secondary' },
    ],
    link: '/',
    tags: ['Med-Surg B', 'Day Shift', 'Critical'],
  },
  {
    id: 'n003',
    type: 'credential',
    severity: 'critical',
    title: 'James Okafor — BLS expired Feb 28 (currently on duty)',
    body: 'James Okafor\'s BLS certification expired 12 days ago and he is currently working an ICU Day Shift. This violates Joint Commission standards. Action required immediately.',
    unit: 'ICU',
    staffName: 'James Okafor',
    timestamp: '1h ago',
    timestampSort: hrs(1),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Send Renewal Reminder', actionId: 'cred-remind-james', variant: 'primary' },
      { label: 'View Credential File', actionId: 'view-cred-james', variant: 'secondary' },
    ],
    link: '/credentials',
    tags: ['BLS', 'ICU', 'Joint Commission'],
  },
  {
    id: 'n004',
    type: 'credential',
    severity: 'critical',
    title: 'NICU RNC-NIC buffer drops to minimum in 21 days',
    body: 'Lisa Greenwald\'s RNC-NIC expires Apr 2 (21 days). NICU requires minimum 2 RNC-NIC per shift. Once expired, only Hannah Moore qualifies — a single callout from Hannah would make NICU non-compliant.',
    unit: 'NICU',
    staffName: 'Lisa Greenwald',
    timestamp: 'Today 9:00 AM',
    timestampSort: hrs(2.5),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Send Reminder to Lisa', actionId: 'cred-remind-lisa', variant: 'primary' },
      { label: 'View NICU Credentials', actionId: 'view-nicu-creds', variant: 'secondary' },
    ],
    link: '/credentials',
    tags: ['NICU', 'RNC-NIC', 'JCAHO Risk'],
  },
  {
    id: 'n005',
    type: 'system',
    severity: 'critical',
    title: 'Marcus Williams at 90% OT threshold — next shift triggers penalty',
    body: 'Marcus has worked 36h this pay period (threshold: 40h). If assigned to cover today\'s ICU gap (8h), he\'ll trigger 4h of OT at 1.5× rate ($282 premium). Consider Sarah Chen or Aisha Patel instead.',
    staffName: 'Marcus Williams',
    timestamp: 'Today 7:05 AM',
    timestampSort: hrs(4),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'View Marcus\'s Profile', actionId: 'view-marcus', variant: 'primary' },
      { label: 'Find Alternative', actionId: 'alt-fill', variant: 'secondary' },
    ],
    link: '/staff/s002',
    tags: ['OT Risk', 'Float Pool'],
  },

  // ── WARNING ──────────────────────────────────────────────────────────────────

  {
    id: 'n006',
    type: 'gap',
    severity: 'warning',
    title: 'ED Evening Thu Mar 13 — predictive gap risk (94% confidence)',
    body: 'AI pattern analysis: ED Evening has been short Thu–Sun for 6 of the last 8 weeks. Current schedule shows 4/5 staffed. Proactively outreaching to float pool now costs regular pay vs. emergency OT if gap opens day-of.',
    unit: 'ED',
    timestamp: 'Today 7:02 AM',
    timestampSort: hrs(4.5),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Pre-Fill Now', actionId: 'prefill-ed-thu', variant: 'primary' },
      { label: 'Dismiss', actionId: 'dismiss-n006', variant: 'secondary' },
    ],
    link: '/shifts',
    tags: ['ED', 'Evening', 'AI Prediction'],
  },
  {
    id: 'n007',
    type: 'credential',
    severity: 'warning',
    title: 'Rachel Torres CCRN expires May 1 — 50 days remaining',
    body: 'Rachel is CCU Charge RN and one of 3 CCRN-certified nurses in the unit. Her CCRN expiry on May 1 reduces the buffer to 2 nurses. Schedule her ANCC renewal exam before April 15.',
    unit: 'CCU',
    staffName: 'Rachel Torres',
    timestamp: 'Today 8:30 AM',
    timestampSort: hrs(3),
    isRead: true,
    isResolved: false,
    actions: [
      { label: 'Send Reminder', actionId: 'cred-remind-rachel', variant: 'primary' },
      { label: 'View Credential', actionId: 'view-cred-rachel', variant: 'secondary' },
    ],
    link: '/credentials',
    tags: ['CCRN', 'CCU'],
  },
  {
    id: 'n008',
    type: 'swap',
    severity: 'warning',
    title: '3 pending shift swap requests need your approval',
    body: 'James Okafor → ICU Day Mar 14 (Sarah Chen covering), Tyler Barnes ↔ Sean Murphy Med-Surg B Sat Mar 15, Nathan Foster requesting PTO swap Mar 20.',
    timestamp: '1h ago',
    timestampSort: hrs(1.5),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Review All Swaps', actionId: 'review-swaps', variant: 'primary' },
    ],
    link: '/marketplace',
    tags: ['Marketplace', 'Approval Required'],
  },
  {
    id: 'n009',
    type: 'schedule',
    severity: 'warning',
    title: 'NICU Saturday Mar 22 — 1 gap in next week\'s schedule',
    body: 'Next week\'s schedule has NICU at 3/4 for Saturday Day. Hannah Moore is scheduled off. Float pool has no RNC-NIC certified nurses available that day — requires permanent staff extension or per diem.',
    unit: 'NICU',
    timestamp: 'Yesterday 4:15 PM',
    timestampSort: days(0.75),
    isRead: true,
    isResolved: false,
    actions: [
      { label: 'Open Schedule Builder', actionId: 'open-schedule', variant: 'primary' },
      { label: 'Post to Marketplace', actionId: 'post-marketplace', variant: 'secondary' },
    ],
    link: '/shifts',
    tags: ['NICU', 'Next Week', 'Mar 22'],
  },
  {
    id: 'n010',
    type: 'system',
    severity: 'warning',
    title: 'Med-Surg B weekend callout rate up 23% vs. 30-day average',
    body: 'In the last 4 weekends, Med-Surg B has averaged 1.8 callouts per weekend shift vs. 1.5 previously. Consider adding 1 standby float for Sat–Sun to avoid scrambling.',
    unit: 'Med-Surg B',
    timestamp: 'Yesterday 8:00 AM',
    timestampSort: days(1),
    isRead: true,
    isResolved: false,
    actions: [
      { label: 'Add Weekend Standby', actionId: 'add-standby-msb', variant: 'primary' },
      { label: 'View Analytics', actionId: 'view-analytics', variant: 'secondary' },
    ],
    link: '/analytics',
    tags: ['Med-Surg B', 'Weekend', 'Pattern'],
  },

  // ── INFO ─────────────────────────────────────────────────────────────────────

  {
    id: 'n011',
    type: 'gap',
    severity: 'info',
    title: 'Sarah Chen responded — she\'s available for ICU Day',
    body: 'Sarah Chen confirmed she can cover the ICU Day shift (07:00–15:00). She\'ll arrive by 7:15 AM. Her match score for this gap is 95%. Awaiting your confirmation to finalize.',
    unit: 'ICU',
    staffName: 'Sarah Chen',
    timestamp: '12m ago',
    timestampSort: mins(12),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Confirm Coverage', actionId: 'confirm-sarah-icu', variant: 'primary' },
      { label: 'View Her Profile', actionId: 'view-sarah', variant: 'secondary' },
    ],
    link: '/staff/s001',
    tags: ['ICU', 'Float Pool', 'Pending Confirm'],
  },
  {
    id: 'n012',
    type: 'message',
    severity: 'info',
    title: 'New message from Christine Park — Med-Surg B staffing update',
    body: '"Morning Janet — Nina Petrov called out sick for today. We\'re going to be short without coverage." Sent 6:31 AM.',
    staffName: 'Christine Park',
    unit: 'Med-Surg B',
    timestamp: '6:31 AM',
    timestampSort: hrs(5),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Reply', actionId: 'reply-christine', variant: 'primary' },
      { label: 'View Thread', actionId: 'view-thread-msb', variant: 'secondary' },
    ],
    link: '/messages',
    tags: ['Med-Surg B', 'Direct Message'],
  },
  {
    id: 'n013',
    type: 'swap',
    severity: 'info',
    title: 'James Okafor submitted shift swap — ICU Day Mar 14',
    body: 'James Okafor posted his ICU Day shift on Mar 14 to the Marketplace with Sarah Chen as proposed replacement. CCRN-certified, 8h to OT limit. Review and approve to finalize.',
    staffName: 'James Okafor',
    unit: 'ICU',
    timestamp: '8:53 AM',
    timestampSort: hrs(2.8),
    isRead: true,
    isResolved: false,
    actions: [
      { label: 'Approve Swap', actionId: 'approve-james-swap', variant: 'primary' },
      { label: 'Deny', actionId: 'deny-james-swap', variant: 'danger' },
    ],
    link: '/marketplace',
    tags: ['ICU', 'Mar 14', 'Marketplace'],
  },
  {
    id: 'n014',
    type: 'schedule',
    severity: 'info',
    title: 'Fatima Hassan offered to cover ED Thu Mar 13 evening',
    body: '"Re the Thursday evening gap — I can pick it up if needed. Just let me know by Wednesday so I can plan." Fatima Hassan, ED RN. No OT risk — she has 8h remaining in her pay period.',
    staffName: 'Fatima Hassan',
    unit: 'ED',
    timestamp: '11:20 AM',
    timestampSort: hrs(0.8),
    isRead: false,
    isResolved: false,
    actions: [
      { label: 'Assign Her', actionId: 'assign-fatima-ed', variant: 'primary' },
      { label: 'Message Back', actionId: 'msg-fatima', variant: 'secondary' },
    ],
    link: '/staff/e008',
    tags: ['ED', 'Evening', 'Mar 13'],
  },
  {
    id: 'n015',
    type: 'system',
    severity: 'info',
    title: 'Tanya Brooks (CNA) credentials expiring in 86 days',
    body: 'Tanya\'s CNA certification expires June 6. This is within the 90-day warning window. Auto-reminder scheduled but she has not yet responded.',
    staffName: 'Tanya Brooks',
    unit: 'Med-Surg A',
    timestamp: 'Yesterday 9:00 AM',
    timestampSort: days(1),
    isRead: true,
    isResolved: false,
    actions: [
      { label: 'Send Reminder', actionId: 'cred-remind-tanya', variant: 'primary' },
    ],
    link: '/credentials',
    tags: ['CNA', 'Med-Surg A'],
  },

  // ── SUCCESS / RESOLVED ────────────────────────────────────────────────────────

  {
    id: 'n016',
    type: 'gap',
    severity: 'success',
    title: 'Oncology gap filled — Linda Okonkwo confirmed',
    body: 'Linda Okonkwo accepted the Oncology Day Shift coverage request. OCN-certified, match score 96%. Shift gap closed 18 minutes after opening.',
    unit: 'Oncology',
    staffName: 'Linda Okonkwo',
    timestamp: 'Today 7:40 AM',
    timestampSort: hrs(3.8),
    isRead: true,
    isResolved: true,
    tags: ['Oncology', 'Day Shift', 'Gap Filled'],
    link: '/staff/s007',
  },
  {
    id: 'n017',
    type: 'credential',
    severity: 'success',
    title: 'Paulo Fernandez NRP renewal confirmed — NICU compliant',
    body: 'Paulo Fernandez uploaded his renewed NRP certificate. Verified and active until Apr 10, 2027. NICU now has 3 NRP-certified nurses — above minimum requirements.',
    unit: 'NICU',
    staffName: 'Paulo Fernandez',
    timestamp: 'Yesterday 2:30 PM',
    timestampSort: days(0.6),
    isRead: true,
    isResolved: true,
    tags: ['NRP', 'NICU', 'Compliance'],
    link: '/credentials',
  },
  {
    id: 'n018',
    type: 'swap',
    severity: 'success',
    title: 'Shift swap approved — Sean Murphy ↔ Tyler Barnes',
    body: 'Sean Murphy and Tyler Barnes completed their Med-Surg B Saturday evening swap. Both acknowledged. Schedule updated and SMS notifications sent.',
    unit: 'Med-Surg B',
    timestamp: 'Yesterday 2:30 PM',
    timestampSort: days(0.65),
    isRead: true,
    isResolved: true,
    tags: ['Med-Surg B', 'Swap Complete'],
    link: '/marketplace',
  },
  {
    id: 'n019',
    type: 'schedule',
    severity: 'success',
    title: 'Schedule Mar 16–22 published — 124/126 shifts filled',
    body: 'Next week\'s schedule was generated and published. 124 of 126 shifts filled. 2 remaining gaps posted to Marketplace (NICU Sat, ICU Mon Night). Staff notified via SMS.',
    timestamp: 'Yesterday 4:00 PM',
    timestampSort: days(0.7),
    isRead: true,
    isResolved: true,
    tags: ['Schedule', 'Published', 'Next Week'],
    link: '/shifts',
  },
  {
    id: 'n020',
    type: 'message',
    severity: 'success',
    title: 'Lisa Greenwald acknowledged credential expiry notice',
    body: '"I\'m aware! Already scheduled my renewal exam for March 20th." — Lisa Greenwald, 10:15 AM. Renewal exam confirmed. Follow up after Mar 20 to collect updated certificate.',
    staffName: 'Lisa Greenwald',
    unit: 'NICU',
    timestamp: 'Yesterday 10:15 AM',
    timestampSort: days(0.9),
    isRead: true,
    isResolved: true,
    tags: ['NICU', 'RNC-NIC', 'Renewal Confirmed'],
    link: '/messages',
  },
]

// ─── Derived helpers ───────────────────────────────────────────────────────────

export const unreadCount = allNotifications.filter(n => !n.isRead).length

export const criticalCount = allNotifications.filter(
  n => n.severity === 'critical' && !n.isResolved,
).length

export function getNotificationsByFilter(
  filter: 'all' | 'critical' | 'gap' | 'credential' | 'swap' | 'schedule' | 'message' | 'activity',
  notifications: Notification[],
): Notification[] {
  switch (filter) {
    case 'critical':
      return notifications.filter(n => n.severity === 'critical')
    case 'gap':
      return notifications.filter(n => n.type === 'gap')
    case 'credential':
      return notifications.filter(n => n.type === 'credential')
    case 'swap':
      return notifications.filter(n => n.type === 'swap')
    case 'schedule':
      return notifications.filter(n => n.type === 'schedule')
    case 'message':
      return notifications.filter(n => n.type === 'message')
    case 'activity':
      return notifications.filter(n => n.isResolved || n.severity === 'success')
    default:
      return notifications
  }
}
