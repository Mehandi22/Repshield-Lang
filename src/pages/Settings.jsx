import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import BottomNav from '../components/BottomNav'
import LanguageSwitcher from '../components/LanguageSwitcher'

const CATEGORIES = ['Restaurant', 'Clinic', 'Salon', 'Pharmacy', 'Gym', 'Other']

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="px-1 mb-2">
      <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-gray-800">{label}</p>
        {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          checked ? 'bg-brand' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', visible }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 max-w-[360px] w-[calc(100%-32px)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-card shadow-lg text-[13px] font-medium ${
          type === 'success'
            ? 'bg-gray-900 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        <span>{type === 'success' ? '✓' : '⚠'}</span>
        {message}
      </div>
    </div>
  )
}

// ── Plan badge ────────────────────────────────────────────────────────────────
function PlanBadge({ status }) {
  const map = {
    trial:   { label: 'Free Trial',       sub: 'Upgrade to continue after 7 days', bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  icon: '⏳' },
    starter: { label: 'Starter Plan',     sub: '₹699/month',                       bg: 'bg-brand-50 border-brand-100',   text: 'text-brand',      icon: '✦'  },
    growth:  { label: 'Growth Plan',      sub: '₹1,199/month',                     bg: 'bg-brand-50 border-brand-100',   text: 'text-brand',      icon: '🚀' },
  }
  const plan = map[status] ?? map['trial']

  return (
    <div className={`flex items-start gap-3 border rounded-card px-4 py-3.5 ${plan.bg}`}>
      <span className="text-[20px] shrink-0 leading-none mt-0.5">{plan.icon}</span>
      <div className="flex-1">
        <p className={`text-[14px] font-semibold ${plan.text}`}>{plan.label}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{plan.sub}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings page skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex flex-col gap-3">
          <Skeleton className="h-3.5 w-28" />
          <div className="bg-white rounded-card border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <Skeleton className="h-9 w-full rounded-btn" />
            <Skeleton className="h-9 w-full rounded-btn" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Settings page
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const { t }             = useLang()

  const [businessData, setBusinessData] = useState(null)
  const [formData,     setFormData]     = useState({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [toast,        setToast]        = useState({ visible: false, message: '', type: 'success' })
  const [whatsappAlerts, setWhatsappAlerts] = useState(true)
  const [weeklyDigest,   setWeeklyDigest]   = useState(true)
  const [showSignOut, setShowSignOut] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  const fetchBusiness = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(false)
    try {
      const { data, error: err } = await supabase
        .from('business')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (err) throw err
      setBusinessData(data)
      setFormData({
        business_name: data.business_name ?? '',
        category:      data.category      ?? '',
        city:          data.city          ?? '',
        state:         data.state         ?? '',
      })
      setWhatsappAlerts(data.whatsapp_alerts !== false)
      setWeeklyDigest(data.weekly_digest   !== false)
    } catch (e) {
      console.error('Settings fetch error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!businessData) return
    setSaving(true)
    const { error: updateErr } = await supabase
      .from('business')
      .update(formData)
      .eq('id', businessData.id)
    setSaving(false)
    if (updateErr) {
      showToast('Failed to save changes.', 'error')
    } else {
      setBusinessData((prev) => ({ ...prev, ...formData }))
      showToast('Changes saved successfully.')
    }
  }

  const handleToggle = async (field, value) => {
    if (field === 'whatsapp_alerts') setWhatsappAlerts(value)
    else setWeeklyDigest(value)
    if (!businessData?.id) return
    await supabase.from('business').update({ [field]: value }).eq('id', businessData.id)
  }

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const isDirty = businessData && (
    formData.business_name !== (businessData.business_name ?? '') ||
    formData.category      !== (businessData.category      ?? '') ||
    formData.city          !== (businessData.city          ?? '') ||
    formData.state         !== (businessData.state         ?? '')
  )

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gray-50">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      {showSignOut && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowSignOut(false)}>
          <div className="bg-white w-full max-w-app rounded-t-[20px] p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold text-gray-900">{t.signOut}?</p>
            <p className="text-[13px] text-gray-500 mt-1 mb-5">You'll be redirected to the login screen.</p>
            <div className="flex flex-col gap-3">
              <button className="w-full flex items-center justify-center py-3 rounded-btn bg-red-500 hover:bg-red-600 text-white font-semibold text-[15px] transition-colors" onClick={handleSignOut}>
                {t.signOut}
              </button>
              <button className="btn-ghost" onClick={() => setShowSignOut(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-3 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{t.settings}</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">{user?.email}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 flex flex-col gap-6">

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[28px]">⚠️</div>
            <p className="text-[15px] font-semibold text-gray-800">Unable to load settings</p>
            <button className="btn-primary w-auto px-8" onClick={fetchBusiness}>Retry</button>
          </div>
        )}

        {loading && !error && <SettingsSkeleton />}

        {!loading && !error && (
          <>
            {/* ══ Business Info ════════════════════════════════════════════════ */}
            <div>
              <SectionHeader title="Business Info" />
              <div className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">

                <div className="p-4 flex flex-col gap-4">
                  <div>
                    <label className="field-label">Business name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.business_name ?? ''}
                      onChange={(e) => updateField('business_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="field-label">Category</label>
                    <div className="relative">
                      <select
                        className="input-field appearance-none pr-10 bg-white cursor-pointer"
                        value={formData.category ?? ''}
                        onChange={(e) => updateField('category', e.target.value)}
                      >
                        <option value="" disabled>Select category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">▼</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="field-label">City</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.city ?? ''}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="field-label">State</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.state ?? ''}
                        onChange={(e) => updateField('state', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Save footer */}
                <div className="px-4 pb-4">
                  <button
                    className="btn-primary !py-2.5 !text-[13px]"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                  >
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ══ Notifications ════════════════════════════════════════════════ */}
            <div>
              <SectionHeader title={t.notifications} />
              <div className="bg-white rounded-card border border-gray-100 shadow-sm divide-y divide-gray-50">
                <Toggle
                  checked={whatsappAlerts}
                  onChange={(v) => handleToggle('whatsapp_alerts', v)}
                  label="WhatsApp alerts for complaints"
                  sub="Get notified when a low-rating response arrives"
                />
                <Toggle
                  checked={weeklyDigest}
                  onChange={(v) => handleToggle('weekly_digest', v)}
                  label="Weekly digest email"
                  sub="Summary of reviews and feedback every Monday"
                />
              </div>
            </div>

            {/* ══ Subscription ═════════════════════════════════════════════════ */}
            <div>
              <SectionHeader title={t.subscription} />
              <div className="flex flex-col gap-3">
                <PlanBadge status={businessData?.subscription_status ?? 'trial'} />
                <button
                  className="btn-ghost !text-[13px] !py-2.5"
                  onClick={() => navigate('/subscribe')}
                >
                  Manage Plan
                </button>
              </div>
            </div>

            {/* ══ Account ══════════════════════════════════════════════════════ */}
            <div>
              <SectionHeader title={t.account} />
              <div className="bg-white rounded-card border border-gray-100 shadow-sm divide-y divide-gray-50">

                {/* Change password */}
                <button
                  onClick={() => navigate('/change-password')}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[18px]">🔒</span>
                    <div>
                      <p className="text-[14px] font-medium text-gray-800">Change Password</p>
                      <p className="text-[12px] text-gray-400">Update your login password</p>
                    </div>
                  </div>
                  <span className="text-gray-300 text-[16px]">›</span>
                </button>

                {/* Connected email (read-only display) */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="text-[18px]">✉️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-800">Email</p>
                    <p className="text-[12px] text-gray-400 truncate">{user?.email ?? '—'}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    Verified
                  </span>
                </div>
              </div>

              {/* Sign out */}
              <button
                className="w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-btn border-2 border-red-100 text-red-500 font-semibold text-[14px] bg-white hover:bg-red-50 transition-colors active:scale-[0.98]"
                onClick={() => setShowSignOut(true)}
              >
                <span>→</span> Sign Out
              </button>
            </div>

            {/* App version */}
            <p className="text-center text-[11px] text-gray-300 pb-2">
              RepShield AI · v0.1.0
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
