import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

function StarRow({ rating, size = 'md' }) {
  const r      = Math.round(rating ?? 0)
  const isLow  = r <= 3
  const sizes  = { sm: 'text-[12px]', md: 'text-[15px]', lg: 'text-[18px]' }
  return (
    <span className={`tracking-tight ${sizes[size]} ${isLow ? 'text-red-400' : 'text-yellow-400'}`}>
      {'★'.repeat(r)}
      <span className="opacity-30">{'★'.repeat(Math.max(0, 5 - r))}</span>
    </span>
  )
}

function initial(name) {
  return (name ?? '?').trim().charAt(0).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

function SummaryBarSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-0 bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex flex-col items-center gap-2 py-3 px-1 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary bar
// ─────────────────────────────────────────────────────────────────────────────

function SummaryBar({ reviews }) {
  const total   = reviews.length
  const avg     = total > 0
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total).toFixed(1)
    : '—'
  const replied = reviews.filter((r) => r.reply_status === 'posted').length
  const pending = reviews.filter((r) => r.reply_status === 'pending').length

  const cells = [
    { label: 'Total',   value: total,   accent: 'text-gray-800'   },
    { label: 'Avg',     value: avg,     accent: 'text-yellow-500' },
    { label: 'Replied', value: replied, accent: 'text-brand'      },
    { label: 'Pending', value: pending, accent: pending > 0 ? 'text-orange-500' : 'text-gray-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-0 bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
      {cells.map(({ label, value, accent }, i) => (
        <div
          key={label}
          className={`flex flex-col items-center gap-0.5 py-3 px-1 ${i < 3 ? 'border-r border-gray-100' : ''}`}
        >
          <p className={`text-[20px] font-bold leading-tight ${accent}`}>{value}</p>
          <p className="text-[10px] text-gray-400 font-medium">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review card
// ─────────────────────────────────────────────────────────────────────────────

function ReviewCard({ review, expanded, onToggleReply, onPost, onReplyTextChange }) {
  const isPending = review.reply_status === 'pending'
  const isPosted  = review.reply_status === 'posted'
  const isLow     = (review.rating ?? 5) <= 3

  return (
    <div className={`bg-white rounded-card border shadow-sm overflow-hidden transition-all duration-200 ${
      isLow ? 'border-l-4 border-l-red-300 border-gray-100' : 'border-l-4 border-l-brand border-gray-100'
    }`}>
      <div className="p-4 flex flex-col gap-3">

        {/* ── Header row ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold ${
            isLow ? 'bg-red-50 text-red-400' : 'bg-brand-50 text-brand'
          }`}>
            {initial(review.author)}
          </div>

          {/* Name + stars + date */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                {review.author ?? 'Anonymous'}
              </p>
              {/* Status badge */}
              {isPosted && (
                <span className="shrink-0 text-[10px] font-bold text-brand bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
                  ✓ Replied
                </span>
              )}
              {isPending && (
                <span className="shrink-0 text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                  ● Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} size="sm" />
              <span className="text-[11px] text-gray-400">{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {/* ── Review text ───────────────────────────────────────────────────── */}
        {review.text && (
          <p className="text-[13px] text-gray-600 leading-snug">{review.text}</p>
        )}

        {/* ── Posted reply preview ──────────────────────────────────────────── */}
        {isPosted && review.reply_text && (
          <div className="bg-gray-50 border border-gray-100 rounded-btn p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wide">Your reply</span>
            </div>
            <p className="text-[12px] text-gray-500 leading-snug">{review.reply_text}</p>
          </div>
        )}

        {/* ── Generate AI Reply button (pending only) ───────────────────────── */}
        {isPending && !expanded && (
          <button
            onClick={() => onToggleReply(review.id)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-btn border-2 border-brand text-brand font-semibold text-[13px] hover:bg-brand-50 transition-colors active:scale-[0.98]"
          >
            <span>✨</span> Generate AI Reply
          </button>
        )}
      </div>

      {/* ── Expanded reply editor ─────────────────────────────────────────── */}
      {expanded && isPending && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 flex flex-col gap-3">

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-brand uppercase tracking-wide">AI-Generated Reply</span>
            <span className="text-[10px] text-gray-400">· edit before posting</span>
          </div>

          <textarea
            className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-[13px] text-gray-700 bg-white resize-none leading-snug focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
            rows={4}
            value={review.reply_text || ''}
            placeholder="AI reply will appear here"
            onChange={(e) => onReplyTextChange(review.id, e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={() => onPost(review.id, review.reply_text)}
              className="btn-primary flex-1 !py-2.5 !text-[13px]"
            >
              Post Reply
            </button>
            <button
              onClick={() => onPost(review.id, review.reply_text)}
              className="btn-ghost flex-1 !py-2.5 !text-[13px]"
            >
              Edit & Post
            </button>
          </div>

          <button
            onClick={() => onToggleReply(null)}
            className="text-[12px] text-gray-400 hover:text-gray-600 text-center transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[32px]">
        ⭐
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-800">No Google reviews yet</p>
        <p className="text-[13px] text-gray-500 mt-1 leading-snug">
          Connect your Google Business Profile to start syncing and replying to reviews.
        </p>
      </div>
      <button className="btn-primary w-auto px-6 !text-[13px] !py-2.5">
        Connect Google Business
      </button>
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
        <p className="text-[15px] font-semibold text-gray-800">Unable to load reviews</p>
        <p className="text-[13px] text-gray-500 mt-1">Check your connection and try again.</p>
      </div>
      <button className="btn-primary w-auto px-8" onClick={onRetry}>Retry</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Reviews page
// ─────────────────────────────────────────────────────────────────────────────

export default function Reviews() {
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [reviews,         setReviews]         = useState([])
  const [expandedReplyId, setExpandedReplyId] = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(false)
  const [posting,         setPosting]         = useState(null) // review id being posted

  const fetchReviews = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(false)

    try {
      // Get business id
      const { data: biz, error: bizErr } = await supabase
        .from('business')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      if (bizErr) throw bizErr

      const { data, error: rvErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })
      if (rvErr) throw rvErr

      setReviews(data ?? [])
    } catch (err) {
      console.error('Reviews fetch error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  // Toggle reply box open/closed
  const handleToggleReply = (id) => {
    setExpandedReplyId((prev) => (prev === id ? null : id))
  }

  // Inline edit of reply_text before posting
  const handleReplyTextChange = (id, text) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reply_text: text } : r))
    )
  }

  // Post reply → update reply_status to 'posted'
  const handlePost = async (id, replyText) => {
    setPosting(id)
    const { error: updateErr } = await supabase
      .from('reviews')
      .update({ reply_status: 'posted', reply_text: replyText })
      .eq('id', id)

    if (updateErr) {
      console.error('Post reply error:', updateErr)
      // Keep expanded so user can retry
    } else {
      // Optimistic update
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, reply_status: 'posted', reply_text: replyText } : r
        )
      )
      setExpandedReplyId(null)
    }
    setPosting(null)
  }

  const pendingCount = reviews.filter((r) => r.reply_status === 'pending').length

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Google Reviews</h1>
            {!loading && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''} synced
              </p>
            )}
          </div>
          {/* Pending pill */}
          {!loading && pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[12px] font-semibold text-orange-600">
                {pendingCount} to reply
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">

        {/* Error */}
        {error && <ErrorState onRetry={fetchReviews} />}

        {/* Loading */}
        {!error && loading && (
          <>
            <SummaryBarSkeleton />
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </>
        )}

        {/* Loaded */}
        {!error && !loading && (
          <>
            {reviews.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <SummaryBar reviews={reviews} />

                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    expanded={expandedReplyId === review.id}
                    onToggleReply={handleToggleReply}
                    onPost={handlePost}
                    onReplyTextChange={handleReplyTextChange}
                    posting={posting === review.id}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
