import { useState, useEffect, useCallback, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

function QRSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5">
      <Skeleton className="w-[240px] h-[240px] rounded-card" />
      <Skeleton className="h-4 w-52" />
      <div className="flex gap-3 w-full">
        <Skeleton className="h-11 flex-1 rounded-btn" />
        <Skeleton className="h-11 flex-1 rounded-btn" />
      </div>
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
        <p className="text-[15px] font-semibold text-gray-800">Unable to load QR code</p>
        <p className="text-[13px] text-gray-500 mt-1">Check your connection and try again.</p>
      </div>
      <button className="btn-primary w-auto px-8" onClick={onRetry}>Retry</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main QR Page
// ─────────────────────────────────────────────────────────────────────────────

export default function QRPage() {
  const { user }  = useAuth()
  const qrWrapRef = useRef(null)

  const [business, setBusiness] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [copied,   setCopied]   = useState(false)

  const fetchBusiness = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(false)
    try {
      const { data, error: err } = await supabase
        .from('business')
        .select('id, business_name')
        .eq('owner_id', user.id)
        .single()
      if (err) throw err
      setBusiness(data)
    } catch (e) {
      console.error('QR fetch error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  const qrUrl = business ? `https://repshield.netlify.app/r/${business.id}` : ''

  // ── Download PNG ────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) return

    // Create a padded canvas for nicer download
    const pad    = 24
    const size   = canvas.width
    const out    = document.createElement('canvas')
    out.width    = size + pad * 2
    out.height   = size + pad * 2
    const ctx    = out.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, pad, pad)

    const link    = document.createElement('a')
    link.download = `repshield-qr-${business?.id ?? 'code'}.png`
    link.href     = out.toDataURL('image/png')
    link.click()
  }

  // ── Copy link ───────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = qrUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <h1 className="text-[18px] font-semibold text-gray-900">Your QR Code</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">
          Share with customers to collect feedback
        </p>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 flex flex-col gap-5">

        {error   && <ErrorState onRetry={fetchBusiness} />}
        {loading && !error && <QRSkeleton />}

        {!loading && !error && business && (
          <>
            {/* ── QR card ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-card border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-5">

              {/* QR code */}
              <div
                ref={qrWrapRef}
                className="p-4 bg-white rounded-card border-2 border-gray-100 shadow-inner"
              >
                <QRCodeCanvas
                  value={qrUrl}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Caption */}
              <div className="text-center">
                <p className="text-[13px] text-gray-500 leading-snug">
                  Scan to leave feedback at
                </p>
                <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
                  {business.business_name}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 font-mono break-all">
                  {qrUrl}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <button
                  className="btn-primary flex-1 !py-2.5 !text-[13px]"
                  onClick={handleDownload}
                >
                  <span>⬇</span> Download PNG
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 !py-2.5 !text-[13px] font-semibold rounded-btn border transition-all duration-200 ${
                    copied
                      ? 'bg-brand-50 border-brand text-brand'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{copied ? '✓' : '🔗'}</span>
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* ── Tip card ─────────────────────────────────────────────────── */}
            <div className="bg-brand-50 border border-brand-100 rounded-card p-4 flex items-start gap-3">
              <span className="text-[22px] shrink-0">💡</span>
              <div>
                <p className="text-[13px] font-semibold text-brand">Pro tip</p>
                <p className="text-[13px] text-gray-600 mt-0.5 leading-snug">
                  Print this and place it at your counter, table, or billing desk — customers scan it right after paying when the experience is still fresh.
                </p>
              </div>
            </div>

            {/* ── How it works ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-card border border-gray-100 shadow-sm p-4">
              <p className="text-[13px] font-semibold text-gray-800 mb-3">How it works</p>
              <div className="flex flex-col gap-2">
                {[
                  { icon: '📱', step: 'Customer scans the QR code'                            },
                  { icon: '⭐', step: 'They rate their experience (1–5 stars)'                },
                  { icon: '🌐', step: '4–5★ → redirected to leave a Google review'            },
                  { icon: '📝', step: '1–3★ → private complaint form (never goes public)'     },
                ].map(({ icon, step }) => (
                  <div key={step} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[18px] shrink-0 leading-none mt-0.5">{icon}</span>
                    <p className="text-[13px] text-gray-600 leading-snug">{step}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                Both options shown simultaneously · Compliant with Google's review policies
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
