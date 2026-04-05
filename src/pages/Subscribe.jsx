import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PLANS, openRazorpayCheckout } from '../lib/razorpay'
import Logo from '../components/Logo'

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-btn px-4 py-3">
      <span className="text-red-400 shrink-0">⚠</span>
      <p className="text-[13px] text-red-600 leading-snug">{message}</p>
    </div>
  )
}

function PlanCard({ plan, selected, onSelect }) {
  const isGrowth = plan.id === 'growth'
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={`relative rounded-card p-4 cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-2 border-brand shadow-[0_0_0_4px_rgba(29,158,117,0.1)]'
          : 'border-2 border-gray-100 hover:border-gray-200'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-4">
          <span className="bg-brand text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            {plan.badge}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[14px] font-bold ${selected ? 'text-brand' : 'text-gray-900'}`}>
            {plan.name}
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-[22px] font-bold ${selected ? 'text-brand' : 'text-gray-800'}`}>
              {plan.display}
            </span>
            <span className="text-[12px] text-gray-400">{plan.period}</span>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
          selected ? 'border-brand bg-brand' : 'border-gray-200'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px]">
            <span className={`shrink-0 mt-0.5 ${selected ? 'text-brand' : 'text-gray-400'}`}>✓</span>
            <span className="text-gray-600">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Subscribe() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Pre-select plan if coming from landing page
  const preSelected = location.state?.plan?.id ?? 'starter'

  const [selectedPlan, setSelectedPlan] = useState(preSelected)
  const [step,         setStep]         = useState(1) // 1=plan, 2=account details
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const [form, setForm] = useState({
    email:    '',
    password: '',
    name:     '',
    phone:    '',
  })

  const update = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError('') }

  const plan = PLANS.find((p) => p.id === selectedPlan)

  const handleContinue = () => {
    if (!form.name.trim())     { setError('Enter your full name.'); return }
    if (!form.email.trim())    { setError('Enter your email address.'); return }
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    handlePayAndSignUp()
  }

  const handlePayAndSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Open Razorpay
      const payment = await openRazorpayCheckout({
        plan,
        prefill: { name: form.name, email: form.email, phone: form.phone },
      })

      // 2. Create Supabase auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { full_name: form.name } },
      })
      if (authErr) throw new Error(authErr.message)

      const userId = authData.user?.id
      if (!userId) throw new Error('Account creation failed. Please try again.')

      // 3. Insert business row
      const { error: bizErr } = await supabase.from('business').insert({
        owner_id:            userId,
        owner_name:          form.name,
        owner_phone:         form.phone,
        subscription_status: payment.plan_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        selected_plan:       payment.plan_id,
      })
      if (bizErr) throw new Error(bizErr.message)

      // 4. Go to onboarding to fill business details
      navigate('/onboarding', { replace: true })

    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="h-1 bg-brand w-full" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <Logo size="sm" />
        <button
          onClick={() => navigate('/login')}
          className="text-[13px] text-gray-400 hover:text-gray-600"
        >
          Sign in instead
        </button>
      </div>

      {/* Progress */}
      <div className="flex px-5 pt-5 pb-1 gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-brand' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-5 pb-12">

        {/* Step 1 — Plan selection */}
        {step === 1 && (
          <>
            <div>
              <p className="text-[18px] font-bold text-gray-900">Choose your plan</p>
              <p className="text-[13px] text-gray-500 mt-1">All plans include a 14-day free trial.</p>
            </div>
            <div className="flex flex-col gap-4">
              {PLANS.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={selectedPlan === p.id}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center">GST inclusive · Cancel anytime</p>
            <button className="btn-primary" onClick={() => setStep(2)}>
              Continue with {plan.name} →
            </button>
          </>
        )}

        {/* Step 2 — Account details + payment */}
        {step === 2 && (
          <>
            <div>
              <p className="text-[18px] font-bold text-gray-900">Create your account</p>
              <p className="text-[13px] text-gray-500 mt-1">
                You'll be charged{' '}
                <span className="font-semibold text-brand">{plan.display}/month</span>{' '}
                after your free trial.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="field-label">Full name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Suresh Reddy"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Email address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@business.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Password <span className="text-red-400">*</span></label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Phone number (optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="input-field pl-12"
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            </div>

            {/* Plan summary */}
            <div className="bg-brand-50 border border-brand-100 rounded-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-800">{plan.name} Plan</p>
                <p className="text-[12px] text-gray-500">Billed monthly after trial</p>
              </div>
              <p className="text-[16px] font-bold text-brand">{plan.display}<span className="text-[12px] font-normal text-gray-400">/mo</span></p>
            </div>

            <ErrorBox message={error} />

            <div className="flex flex-col gap-3">
              <button
                className="btn-primary"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  `Pay ${plan.display} & Create Account`
                )}
              </button>
              <button className="btn-ghost" onClick={() => setStep(1)} disabled={loading}>
                ← Change plan
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-snug">
              By continuing you agree to our Terms of Service. Payment secured by Razorpay.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
