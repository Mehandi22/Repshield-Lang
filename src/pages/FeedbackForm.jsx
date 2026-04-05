import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= (hover || value)
        return (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)}
            className={`text-[44px] leading-none transition-all duration-100 active:scale-90 ${
              filled ? 'text-yellow-400' : 'text-gray-200'
            }`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

export default function FeedbackForm() {
  const { businessId } = useParams()
  const { t }          = useLang()

  const [business,  setBusiness]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  const [rating,    setRating]    = useState(0)
  const [comment,   setComment]   = useState('')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')

  const [step,      setStep]      = useState('form')   // 'form' | 'google-nudge' | 'done'
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    async function fetchBusiness() {
      const { data, error } = await supabase
        .from('business')
        .select('id, business_name, category, city')
        .eq('id', businessId)
        .single()
      if (error || !data) { setNotFound(true) }
      else { setBusiness(data) }
      setLoading(false)
    }
    if (businessId) fetchBusiness()
  }, [businessId])

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError('')

    const { error: insertErr } = await supabase.from('feedback').insert({
      business_id:    businessId,
      rating,
      comment:        comment.trim() || null,
      customer_name:  name.trim()    || null,
      customer_phone: phone.trim()   || null,
      is_private:     rating <= 3,
      submitted_at:   new Date().toISOString(),
    })

    setSubmitting(false)

    if (insertErr) {
      setError('Could not submit feedback. Please try again.')
      return
    }

    // For high ratings: offer to share on Google
    if (rating >= 4) {
      setStep('google-nudge')
    } else {
      setStep('done')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="app-shell flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center gap-4">
        <span className="text-[48px]">🔍</span>
        <p className="text-[16px] font-semibold text-gray-800">Business not found</p>
        <p className="text-[13px] text-gray-500">This QR code may be invalid or expired.</p>
      </div>
    )
  }

  // ── Google nudge ─────────────────────────────────────────────────────────
  if (step === 'google-nudge') {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-white">
        <div className="h-1 bg-brand" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center text-[40px]">
            🌟
          </div>
          <div>
            <p className="text-[20px] font-bold text-gray-900">{t.thankYou}</p>
            <p className="text-[14px] text-gray-500 mt-2 leading-snug">{t.thankYouSub}</p>
          </div>
          <div className="w-full bg-brand-50 border border-brand-100 rounded-card p-5 flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-gray-800">{t.shareOnGoogle}</p>
            <p className="text-[13px] text-gray-500 leading-snug">
              Your positive experience can help others discover {business.business_name}.
            </p>
            <button
              onClick={() => {
                // Opens Google search for the business — owner can update with actual Place URL in Settings
                window.open(`https://search.google.com/local/writereview?placeid=${businessId}`, '_blank')
                setStep('done')
              }}
              className="btn-primary"
            >
              {t.shareOnGoogleBtn} ↗
            </button>
            <button
              onClick={() => setStep('done')}
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.maybeNext}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-300 pb-6">Powered by RepShield AI</p>
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="app-shell flex flex-col min-h-screen bg-white">
        <div className="h-1 bg-brand" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center text-[40px]">
            🙏
          </div>
          <div>
            <p className="text-[22px] font-bold text-gray-900">{t.thankYou}</p>
            <p className="text-[14px] text-gray-500 mt-2 leading-snug">{t.thankYouSub}</p>
          </div>
          <div className="flex gap-1 text-[28px] text-yellow-400">
            {'★'.repeat(rating)}
            <span className="text-gray-200">{'★'.repeat(5 - rating)}</span>
          </div>
          <p className="text-[13px] text-gray-400">
            — {business.business_name}
          </p>
        </div>
        <p className="text-center text-[11px] text-gray-300 pb-6">Powered by RepShield AI</p>
      </div>
    )
  }

  // ── Feedback form ────────────────────────────────────────────────────────
  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="h-1 bg-brand" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
        <Logo size="sm" />
        <LanguageSwitcher />
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 pb-12">

        {/* Business identity */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-[22px] font-bold text-white">
            {business.business_name.charAt(0).toUpperCase()}
          </div>
          <p className="text-[17px] font-bold text-gray-900">{business.business_name}</p>
          {business.city && (
            <p className="text-[12px] text-gray-400">{business.category} · {business.city}</p>
          )}
        </div>

        {/* Star rating */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[15px] font-semibold text-gray-800">{t.rateExperience}</p>
          <StarPicker value={rating} onChange={(r) => { setRating(r); setError('') }} />
          {rating > 0 && (
            <p className={`text-[13px] font-medium transition-colors ${
              rating >= 4 ? 'text-brand' : rating === 3 ? 'text-yellow-500' : 'text-red-400'
            }`}>
              {RATING_LABELS[rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="field-label">{t.shareThoughts}</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Tell us about your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Optional fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="field-label">{t.yourName}</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ravi Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t.yourPhone}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                className="input-field pl-12"
                placeholder="98XXXXXXXX"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-btn px-4 py-3">
            <span className="text-red-400 text-[14px]">⚠</span>
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitting || !rating}
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            t.submitFeedback
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center">
          Your feedback is shared directly with the business and helps them improve.
        </p>
      </div>

      <p className="text-center text-[11px] text-gray-300 pb-6">Powered by RepShield AI</p>
    </div>
  )
}
