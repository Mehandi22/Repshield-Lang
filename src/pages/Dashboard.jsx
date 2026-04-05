import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import Logo from '../components/Logo'
import BottomNav from '../components/BottomNav'
import LanguageSwitcher from '../components/LanguageSwitcher'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (secs < 60)                       return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60)                       return `${mins}m ago`
  const hrs  = Math.floor(mins / 60)
  if (hrs  < 24)                       return `${hrs}h ago`
  const days = Math.floor(hrs  / 24)
  return `${days}d ago`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon, accent, loading }) {
  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-sm p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-gray-400 font-medium leading-tight">{label}</p>
        <span className="text-[16px]">{icon}</span>
      </div>
      {loading
        ? <Skeleton className="h-7 w-10 mt-1" />
        : <p className={`text-[26px] font-bold leading-none ${accent}`}>{value}</p>
      }
    </div>
  )
}

// ─── Feedback row ─────────────────────────────────────────────────────────────
function FeedbackRow({ item }) {
  const isLow = item.rating <= 3
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold ${
        isLow ? 'bg-red-50 text-red-400' : 'bg-brand-50 text-brand'
      }`}>
        {item.rating}★
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] tracking-tight ${isLow ? 'text-red-400' : 'text-yellow-400'}`}>
            {'★'.repeat(item.rating)}
            <span className="opacity-30">{'★'.repeat(5 - item.rating)}</span>
          </span>
          <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.submitted_at)}</span>
        </div>
        {item.comment
          ? <p className="text-[13px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
              {item.comment.length > 70 ? item.comment.slice(0, 70) + '…' : item.comment}
            </p>
          : <p className="text-[12px] text-gray-400 italic mt-0.5">No comment</p>
        }
        {item.customer_name && (
          <p className="text-[11px] text-gray-400 mt-0.5">— {item.customer_name}</p>
        )}
      </div>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[28px]">⚠️</div>
      <p className="text-[15px] font-semibold text-gray-800">Unable to load dashboard</p>
      <p className="text-[13px] text-gray-500">Check your connection and try again.</p>
      <button className="btn-primary w-auto px-8" onClick={onRetry}>Retry</button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const { t }             = useLang()

  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(false)
  const [business,        setBusiness]        = useState(null)
  const [totalFeedback,   setTotalFeedback]   = useState(null)
  const [avgRating,       setAvgRating]       = useState(null)
  const [complaintsCount, setComplaintsCount] = useState(null)
  const [recentFeedback,  setRecentFeedback]  = useState([])
  const [showSignOut,     setShowSignOut]     = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(false)
    try {
      const { data: biz, error: bizErr } = await supabase
        .from('business')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (bizErr) throw bizErr
      setBusiness(biz)

      const bid = biz.id

      const [totalRes, ratingsRes, compRes, recentRes] = await Promise.all([
        supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', bid),
        supabase.from('feedback').select('rating').eq('business_id', bid),
        supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('business_id', bid).lte('rating', 3),
        supabase.from('feedback').select('*').eq('business_id', bid).order('submitted_at', { ascending: false }).limit(5),
      ])

      if (totalRes.error)   throw totalRes.error
      if (ratingsRes.error) throw ratingsRes.error
      if (compRes.error)    throw compRes.error
      if (recentRes.error)  throw recentRes.error

      setTotalFeedback(totalRes.count ?? 0)
      setComplaintsCount(compRes.count ?? 0)
      setRecentFeedback(recentRes.data ?? [])

      const ratings = ratingsRes.data ?? []
      setAvgRating(
        ratings.length > 0
          ? ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length
          : null
      )
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Real-time subscription — auto-update when new feedback arrives
  useEffect(() => {
    if (!business?.id) return
    const channel = supabase
      .channel('feedback-changes')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'feedback',
        filter: `business_id=eq.${business.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [business?.id, fetchAll])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const ownerName  = business?.owner_name ?? ''
  const bizName    = business?.business_name ?? '—'
  const initials   = bizName.slice(0, 2).toUpperCase()
  const displayAvg = avgRating !== null ? avgRating.toFixed(1) : '—'

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gray-50">

      {/* Sign-out sheet */}
      {showSignOut && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowSignOut(false)}>
          <div className="bg-white w-full max-w-app rounded-t-[20px] p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold text-gray-900">{t.signOut}?</p>
            <p className="text-[13px] text-gray-500 mt-1 mb-5">You'll be redirected to the login screen.</p>
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 rounded-btn bg-red-500 text-white font-semibold" onClick={handleSignOut}>
                {t.signOut}
              </button>
              <button className="btn-ghost" onClick={() => setShowSignOut(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-2">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={() => setShowSignOut(true)} className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-24">
        {error && !loading ? (
          <ErrorState onRetry={fetchAll} />
        ) : (
          <div className="flex flex-col gap-5">

            {/* Greeting */}
            <div>
              {loading
                ? <Skeleton className="h-6 w-52 rounded" />
                : <h1 className="text-[19px] font-bold text-gray-900">{t.greeting(ownerName)}</h1>
              }
              {loading
                ? <Skeleton className="h-3.5 w-36 rounded mt-2" />
                : <p className="text-[13px] text-gray-400 mt-0.5">Here's how {bizName} is doing today</p>
              }
            </div>

            {/* Hero rating card */}
            {loading ? (
              <Skeleton className="h-24 w-full rounded-card" />
            ) : avgRating !== null ? (
              <div className="bg-brand rounded-card p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Reputation Score</p>
                <div className="flex items-end gap-3 mt-1">
                  <p className="text-[52px] font-bold leading-none">{displayAvg}</p>
                  <div className="mb-1.5">
                    <div className="text-yellow-300 text-[18px] leading-tight">
                      {'★'.repeat(Math.round(avgRating))}
                      <span className="opacity-30">{'★'.repeat(5 - Math.round(avgRating))}</span>
                    </div>
                    <p className="text-[11px] opacity-60 mt-0.5">{totalFeedback} total responses</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-brand-50 border border-brand-100 rounded-card p-5 flex items-center gap-3">
                <span className="text-[28px]">📊</span>
                <div>
                  <p className="text-[14px] font-semibold text-brand">No ratings yet</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Share your QR code to start collecting feedback.</p>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="flex gap-3">
              <MetricCard label={t.totalFeedback} value={totalFeedback ?? '—'} icon="📬" accent="text-brand"                                              loading={loading} />
              <MetricCard label={t.avgRating}     value={displayAvg}           icon="⭐" accent="text-yellow-500"                                         loading={loading} />
              <MetricCard label={t.complaints}    value={complaintsCount ?? '—'} icon="⚠️" accent={complaintsCount > 0 ? 'text-red-500' : 'text-gray-400'} loading={loading} />
            </div>

            {/* Quick actions */}
            <div className="flex gap-3">
              <button className="btn-primary flex-1 !py-2.5 !text-[13px]" onClick={() => navigate('/qr')}>
                <span>📱</span> {t.downloadQR}
              </button>
              <button className="btn-ghost flex-1 !py-2.5 !text-[13px]" onClick={() => navigate('/reviews')}>
                <span>⭐</span> {t.viewReviews}
              </button>
            </div>

            {/* Complaints alert */}
            {!loading && complaintsCount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-card p-4 flex items-start gap-3">
                <span className="text-[20px] shrink-0">🚨</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-700">
                    {complaintsCount} complaint{complaintsCount !== 1 ? 's' : ''} need attention
                  </p>
                  <p className="text-[12px] text-red-500 mt-0.5">Respond privately to resolve before they escalate.</p>
                  <button className="text-[12px] font-semibold text-red-600 mt-2 underline underline-offset-2" onClick={() => navigate('/inbox')}>
                    View complaints →
                  </button>
                </div>
              </div>
            )}

            {/* Recent feedback */}
            <div className="bg-white rounded-card border border-gray-100 shadow-sm px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[14px] font-semibold text-gray-900">{t.recentFeedback}</p>
                {!loading && recentFeedback.length > 0 && (
                  <button onClick={() => navigate('/inbox')} className="text-[12px] text-brand font-medium hover:underline">
                    See all →
                  </button>
                )}
              </div>

              {loading ? (
                [1,2,3].map((i) => (
                  <div key={i} className="flex gap-3 py-3.5 border-b border-gray-50 last:border-0">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : recentFeedback.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="text-[36px]">📭</span>
                  <p className="text-[13px] text-gray-500 leading-snug">
                    {t.noFeedback.split('Share')[0]}
                    <button onClick={() => navigate('/qr')} className="text-brand font-medium hover:underline">
                      Share your QR code
                    </button>
                    {' '}to get started.
                  </p>
                </div>
              ) : (
                recentFeedback.map((item) => <FeedbackRow key={item.id} item={item} />)
              )}
            </div>

          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
