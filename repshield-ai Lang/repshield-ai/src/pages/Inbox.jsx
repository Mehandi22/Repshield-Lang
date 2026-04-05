import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (secs < 60)                         return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60)                         return `${mins}m ago`
  const hrs  = Math.floor(mins / 60)
  if (hrs  < 24)                         return `${hrs}h ago`
  const days = Math.floor(hrs  / 24)
  if (days < 7)                          return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function StarRow({ rating }) {
  const isLow = rating <= 3
  return (
    <span className={`text-[14px] tracking-tight ${isLow ? 'text-red-400' : 'text-brand'}`}>
      {'★'.repeat(Math.round(rating))}
      <span className="opacity-30">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback card
// ─────────────────────────────────────────────────────────────────────────────

function FeedbackCard({ item, expanded, onToggle, onResolve }) {
  const isLow      = item.rating <= 3
  const isPrivate  = item.is_private === true
  const borderColor = isLow ? 'border-l-red-400' : 'border-l-brand'

  return (
    <div
      className={`bg-white rounded-card border border-gray-100 shadow-sm border-l-4 ${borderColor} overflow-hidden transition-all duration-200`}
    >
      {/* ── Main tap area ──────────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex flex-col gap-2"
      >
        {/* Row 1: stars + badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StarRow rating={item.rating} />
            {isLow && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Needs Attention
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Private / Public badge */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isPrivate
                  ? 'text-gray-500 bg-gray-50 border-gray-200'
                  : 'text-brand bg-brand-50 border-brand-100'
              }`}
            >
              {isPrivate ? '🔒 Private' : '🌐 Public'}
            </span>
          </div>
        </div>

        {/* Row 2: comment */}
        <p className="text-[13px] text-gray-600 leading-snug">
          {expanded
            ? (item.comment || <span className="italic text-gray-400">No comment left</span>)
            : item.comment
            ? item.comment.length > 80
              ? item.comment.slice(0, 80).trimEnd() + '…'
              : item.comment
            : <span className="italic text-gray-400">No comment left</span>
          }
        </p>

        {/* Row 3: time + expand hint */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] text-gray-400">{timeAgo(item.submitted_at)}</span>
          <span className="text-[11px] text-gray-400">
            {expanded ? '▲ less' : '▼ more'}
          </span>
        </div>
      </button>

      {/* ── Expanded section ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          <div className="flex flex-col gap-3 pt-3">
            {/* Extra metadata */}
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="bg-gray-50 rounded-btn px-3 py-2">
                <p className="text-gray-400">Rating</p>
                <p className="font-semibold text-gray-700 mt-0.5">{item.rating} / 5</p>
              </div>
              <div className="bg-gray-50 rounded-btn px-3 py-2">
                <p className="text-gray-400">Visibility</p>
                <p className="font-semibold text-gray-700 mt-0.5">{isPrivate ? 'Private' : 'Public'}</p>
              </div>
            </div>

            {/* Mark Resolved */}
            {isLow && (
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(item.id) }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-semibold text-[13px] py-2.5 rounded-btn transition-colors"
              >
                <span>✓</span> Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter tabs
// ─────────────────────────────────────────────────────────────────────────────

function FilterTabs({ active, counts, onChange }) {
  const tabs = [
    { id: 'all',        label: 'All',        count: counts.all        },
    { id: 'positive',   label: 'Positive',   count: counts.positive   },
    { id: 'complaints', label: 'Complaints', count: counts.complaints  },
  ]
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
      {tabs.map(({ id, label, count }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`shrink-0 flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-full border transition-all duration-150 ${
            active === id
              ? id === 'complaints'
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-brand border-brand text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {label}
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              active === id
                ? 'bg-white/25 text-white'
                : id === 'complaints'
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ filter, onClearFilter }) {
  const isFiltered = filter !== 'all'
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[32px]">
        {isFiltered ? '🔍' : '📭'}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-800">
          {isFiltered ? `No ${filter} feedback` : 'No feedback yet'}
        </p>
        <p className="text-[13px] text-gray-500 mt-1 leading-snug">
          {isFiltered
            ? 'Try a different filter to see other responses.'
            : 'Share your QR code with customers to start collecting feedback.'}
        </p>
      </div>
      {isFiltered ? (
        <button
          onClick={onClearFilter}
          className="text-[13px] font-semibold text-brand hover:underline"
        >
          Clear filter
        </button>
      ) : (
        <div className="text-[40px] opacity-20">⬛</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Error state
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[28px]">⚠️</div>
      <div>
        <p className="text-[15px] font-semibold text-gray-800">Unable to load inbox</p>
        <p className="text-[13px] text-gray-500 mt-1">Check your connection and try again.</p>
      </div>
      <button className="btn-primary w-auto px-8" onClick={onRetry}>Retry</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Inbox
// ─────────────────────────────────────────────────────────────────────────────

export default function Inbox() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [feedbackList, setFeedbackList] = useState([])
  const [filter,       setFilter]       = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [businessId,   setBusinessId]   = useState(null)

  // Fetch business id first, then feedback
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(false)

    try {
      // Get business
      const { data: biz, error: bizErr } = await supabase
        .from('business')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      if (bizErr) throw bizErr

      const bid = biz.id
      setBusinessId(bid)

      // Get all feedback
      const { data, error: fbErr } = await supabase
        .from('feedback')
        .select('*')
        .eq('business_id', bid)
        .order('submitted_at', { ascending: false })
      if (fbErr) throw fbErr

      setFeedbackList(data ?? [])
    } catch (err) {
      console.error('Inbox fetch error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // Client-side filter
  const filtered = feedbackList.filter((f) => {
    if (filter === 'positive')   return f.rating >= 4
    if (filter === 'complaints') return f.rating <= 3
    return true
  })

  const counts = {
    all:        feedbackList.length,
    positive:   feedbackList.filter((f) => f.rating >= 4).length,
    complaints: feedbackList.filter((f) => f.rating <= 3).length,
  }

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // "Mark Resolved" — collapses card (DB wire-up later)
  const handleResolve = (id) => {
    setExpandedId(null)
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Feedback Inbox</h1>
            {!loading && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {counts.all} total · {counts.complaints} complaint{counts.complaints !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {/* Complaints pill */}
          {!loading && counts.complaints > 0 && (
            <button
              onClick={() => setFilter('complaints')}
              className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-full px-3 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[12px] font-semibold text-red-600">
                {counts.complaints} urgent
              </span>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="pb-3">
          <FilterTabs active={filter} counts={counts} onChange={setFilter} />
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">

        {error && <ErrorState onRetry={fetchData} />}

        {!error && loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <EmptyState filter={filter} onClearFilter={() => setFilter('all')} />
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => handleToggle(item.id)}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}
