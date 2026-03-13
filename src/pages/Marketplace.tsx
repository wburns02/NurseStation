import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Zap,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react'
import type { ShiftListing } from '../types'
import { openListings, pendingApprovals, filledThisWeek } from '../data/marketplaceData'
import PostShiftModal from '../components/PostShiftModal'

type Tab = 'available' | 'pending' | 'history'

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const SHIFT_COLORS: Record<string, string> = {
  day: 'bg-amber-100 text-amber-700',
  evening: 'bg-blue-100 text-blue-700',
  night: 'bg-slate-200 text-slate-700',
}

function MatchBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-slate-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className={`text-xs font-bold ${score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-amber-600' : 'text-slate-500'}`}>
        {score}%
      </span>
    </div>
  )
}

interface ShiftCardProps {
  listing: ShiftListing
  onClaim: (id: string) => void
  claimStatus: 'idle' | 'claiming' | 'claimed'
}

function ShiftCard({ listing, onClaim, claimStatus }: ShiftCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
        listing.urgency === 'urgent'
          ? 'border-red-300 hover:border-red-400 hover:shadow-md hover:shadow-red-100'
          : 'border-slate-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100'
      }`}
    >
      {/* Top bar */}
      <div className={`px-4 py-2.5 flex items-center gap-3 ${listing.urgency === 'urgent' ? 'bg-red-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2 flex-1">
          {listing.urgency === 'urgent' && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              URGENT
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SHIFT_COLORS[listing.shift.type]}`}>
            {listing.shift.label.replace(' Shift', '')}
          </span>
          <span className="text-xs text-slate-500">{listing.shift.start}–{listing.shift.end}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <MatchBar score={listing.matchScore} />
          <span className="text-[10px] text-slate-400 font-medium">match</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Date + Unit */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex flex-col items-center justify-center shrink-0">
            <Calendar size={14} className="text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{listing.date}</p>
            <p className="text-xs text-slate-500">{listing.unitName} · {listing.unitFloor}</p>
          </div>
        </div>

        {/* Posted by + reason */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {listing.postedByInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">{listing.postedByName}, {listing.postedByRole}</p>
            <p className="text-xs text-slate-500 italic mt-0.5">"{listing.reason}"</p>
          </div>
        </div>

        {/* Match reasons */}
        {listing.matchReasons.length > 0 && (
          <div className="space-y-1">
            {listing.matchReasons.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                <ShieldCheck size={10} className="shrink-0 text-emerald-500" />
                {r}
              </div>
            ))}
            {listing.matchRiskFlags.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-700">
                <AlertCircle size={10} className="shrink-0 text-amber-500" />
                {r}
              </div>
            ))}
          </div>
        )}

        {/* Coworkers */}
        {listing.coworkers.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Users size={11} className="shrink-0" />
            <span>With: {listing.coworkers.slice(0, 2).join(', ')}{listing.coworkers.length > 2 ? ` +${listing.coworkers.length - 2}` : ''}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {listing.viewerCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {listing.viewerCount} {listing.viewerCount === 1 ? 'other' : 'others'} viewing
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {timeAgo(listing.postedAt)}
            </span>
          </div>

          {claimStatus === 'claimed' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
              <CheckCircle2 size={12} />
              Claimed — Awaiting Approval
            </div>
          ) : (
            <button
              onClick={() => onClaim(listing.id)}
              disabled={claimStatus === 'claiming'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-bold transition-colors disabled:opacity-60"
            >
              {claimStatus === 'claiming' ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Claiming…
                </>
              ) : (
                'Claim Shift'
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface PendingCardProps {
  listing: ShiftListing
  onApprove: (id: string) => void
  onReject: (id: string) => void
  approvalStatus: 'idle' | 'approving' | 'rejecting' | 'approved' | 'rejected'
}

function PendingCard({ listing, onApprove, onReject, approvalStatus }: PendingCardProps) {
  if (approvalStatus === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, height: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 overflow-hidden"
      >
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Swap Approved!</p>
          <p className="text-xs text-emerald-600">{listing.claimedByName} has been confirmed for {listing.unitName} {listing.date}</p>
        </div>
      </motion.div>
    )
  }
  if (approvalStatus === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, height: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3 overflow-hidden"
      >
        <XCircle size={20} className="text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-700">Swap Declined</p>
          <p className="text-xs text-red-500">{listing.claimedByName} has been notified. Shift returned to marketplace.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 overflow-hidden ${
        listing.urgency === 'urgent' ? 'border-amber-300' : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 ${listing.urgency === 'urgent' ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <Zap size={13} className="text-violet-500" />
        <span className="text-xs font-bold text-slate-700">Shift Swap Request</span>
        {listing.urgency === 'urgent' && (
          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold ml-1">URGENT</span>
        )}
        <span className="ml-auto text-[11px] text-slate-400">{timeAgo(listing.postedAt)}</span>
      </div>

      <div className="p-4">
        {/* The swap: who → who */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {listing.postedByInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{listing.postedByName}</p>
              <p className="text-[11px] text-slate-500">{listing.date} · {listing.shift.label}</p>
            </div>
          </div>
          <div className="flex flex-col items-center px-2">
            <div className="text-slate-400 text-xs">→</div>
            <div className="text-[10px] text-violet-600 font-bold">{listing.matchScore}% match</div>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-xs font-bold text-slate-800 truncate">{listing.claimedByName}</p>
              <p className="text-[11px] text-emerald-600">Wants to cover</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {listing.claimedByInitials}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Calendar size={11} className="text-slate-400" />
            {listing.unitName} · {listing.shift.start}–{listing.shift.end}
          </div>
          <p className="text-[11px] text-slate-500 italic">"{listing.reason}"</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {listing.matchReasons.map((r, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ShieldCheck size={9} />
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(listing.id)}
            disabled={approvalStatus === 'approving' || approvalStatus === 'rejecting'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {approvalStatus === 'approving' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <CheckCircle2 size={15} />
            )}
            Approve Swap
          </button>
          <button
            onClick={() => onReject(listing.id)}
            disabled={approvalStatus === 'approving' || approvalStatus === 'rejecting'}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {approvalStatus === 'rejecting' ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <XCircle size={15} />
            )}
            Decline
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function HistoryCard({ listing }: { listing: ShiftListing }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
        <CheckCircle2 size={18} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800">{listing.unitName} · {listing.shift.label.replace(' Shift', '')}</p>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Approved</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {listing.postedByName} → covered by {listing.claimedByName} · {listing.date}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-600">{listing.matchScore}% match</p>
        <p className="text-[10px] text-slate-400">{timeAgo(listing.postedAt)}</p>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [tab, setTab] = useState<Tab>('available')
  const [showPostModal, setShowPostModal] = useState(false)
  const [listings, setListings] = useState<ShiftListing[]>(openListings)
  const [pending, setPending] = useState<ShiftListing[]>(pendingApprovals)
  const [history] = useState<ShiftListing[]>(filledThisWeek)
  const [claimStatuses, setClaimStatuses] = useState<Record<string, 'idle' | 'claiming' | 'claimed'>>({})
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, 'idle' | 'approving' | 'rejecting' | 'approved' | 'rejected'>>({})

  const handleClaim = async (id: string) => {
    setClaimStatuses(p => ({ ...p, [id]: 'claiming' }))
    await new Promise(r => setTimeout(r, 900))
    setClaimStatuses(p => ({ ...p, [id]: 'claimed' }))
    // Move to pending after short delay
    setTimeout(() => {
      const l = listings.find(x => x.id === id)
      if (l) {
        const claimed: ShiftListing = { ...l, status: 'claimed', claimedByName: 'Janet Morrison', claimedByInitials: 'JM', claimedById: 'janet' }
        setPending(p => [claimed, ...p])
        setListings(p => p.filter(x => x.id !== id))
      }
    }, 1500)
  }

  const handleApprove = async (id: string) => {
    setApprovalStatuses(p => ({ ...p, [id]: 'approving' }))
    await new Promise(r => setTimeout(r, 900))
    setApprovalStatuses(p => ({ ...p, [id]: 'approved' }))
    setTimeout(() => {
      setPending(p => p.filter(x => x.id !== id))
    }, 1800)
  }

  const handleReject = async (id: string) => {
    setApprovalStatuses(p => ({ ...p, [id]: 'rejecting' }))
    await new Promise(r => setTimeout(r, 700))
    setApprovalStatuses(p => ({ ...p, [id]: 'rejected' }))
    setTimeout(() => {
      setPending(p => p.filter(x => x.id !== id))
    }, 1800)
  }

  const handlePost = (listing: Omit<ShiftListing, 'id' | 'postedAt' | 'status' | 'viewerCount'>) => {
    const newListing: ShiftListing = {
      ...listing,
      id: `new-${Date.now()}`,
      postedAt: new Date(),
      status: 'open',
      viewerCount: 0,
    }
    setListings(p => [newListing, ...p])
    setTab('available')
  }

  const sortedListings = [...listings].sort((a, b) => {
    if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1
    if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1
    return b.matchScore - a.matchScore
  })

  const tabs: { id: Tab; label: string; count: number; color?: string }[] = [
    { id: 'available', label: 'Available to Claim', count: listings.length },
    { id: 'pending', label: 'Pending Approval', count: pending.length, color: 'text-amber-600' },
    { id: 'history', label: 'Filled This Week', count: history.length },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Store size={20} className="text-violet-500" />
              Shift Marketplace
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-violet-600 font-semibold">{listings.length} available</span>
              {pending.length > 0 && (
                <span className="text-amber-600 font-semibold">{pending.length} awaiting your approval</span>
              )}
              <span className="text-slate-400">{history.length} filled this week</span>
            </div>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-violet-300"
          >
            <Plus size={16} />
            Post a Shift
          </button>
        </div>
      </div>

      {/* Pending approval banner */}
      {pending.length > 0 && tab !== 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-3"
        >
          <Zap size={14} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 font-semibold">
            {pending.length} shift swap{pending.length !== 1 ? 's' : ''} waiting for your approval —{' '}
            <button onClick={() => setTab('pending')} className="underline hover:no-underline font-bold">
              Review now
            </button>
          </p>
        </motion.div>
      )}

      <div className="p-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Shifts', value: listings.length, icon: Calendar, color: 'bg-violet-500', sub: 'Available to claim' },
            { label: 'Pending Approval', value: pending.length, icon: Clock, color: 'bg-amber-500', sub: 'Awaiting sign-off' },
            { label: 'Filled This Week', value: history.length, icon: TrendingUp, color: 'bg-emerald-500', sub: 'Successful swaps' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-[11px] text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.id
                    ? 'bg-white/20 text-white'
                    : t.color
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'available' && (
            <motion.div
              key="available"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {sortedListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg">No open shifts</h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs">All shifts are covered. Check back later or post a shift you need covered.</p>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold"
                  >
                    <Plus size={15} />
                    Post a Shift
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Sorted by your match score
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-full" />Urgent</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full" />90%+ match</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />75–89%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {sortedListings.map(listing => (
                        <ShiftCard
                          key={listing.id}
                          listing={listing}
                          onClaim={handleClaim}
                          claimStatus={claimStatuses[listing.id] ?? 'idle'}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg">All caught up!</h3>
                  <p className="text-slate-400 text-sm mt-1">No swap requests need your approval right now.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {pending.length} swap{pending.length !== 1 ? 's' : ''} awaiting your sign-off
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All claimer qualifications verified automatically</p>
                  </div>
                  <div className="space-y-4 max-w-2xl">
                    <AnimatePresence>
                      {pending.map(listing => (
                        <PendingCard
                          key={listing.id}
                          listing={listing}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          approvalStatus={approvalStatuses[listing.id] ?? 'idle'}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">This week's completed swaps</p>
              </div>
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No swaps completed yet this week.</p>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  {history.map(listing => (
                    <HistoryCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
              <div className="mt-6 bg-violet-900 rounded-2xl p-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-violet-300" />
                  <p className="text-xs font-bold text-violet-100">Marketplace Impact This Week</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Shifts Covered', value: `${history.length}` },
                    { label: 'Avg Fill Time', value: '8m' },
                    { label: 'Manager Time Saved', value: '~2h' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-black text-violet-100">{s.value}</p>
                      <p className="text-[10px] text-violet-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post modal */}
      {showPostModal && (
        <PostShiftModal
          onClose={() => setShowPostModal(false)}
          onPost={handlePost}
        />
      )}
    </div>
  )
}
