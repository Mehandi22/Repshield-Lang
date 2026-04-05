import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const CATEGORIES = ['Restaurant', 'Clinic', 'Salon', 'Pharmacy', 'Gym', 'Other']

const STEP_META = [
  { number: 1, label: 'Business' },
  { number: 2, label: 'Contact'  },
]

function Skeleton({ className = '' }) {
  return null // not needed here
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-btn px-4 py-3">
      <span className="text-red-400 shrink-0 mt-px">⚠</span>
      <p className="text-[13px] text-red-600 leading-snug">{message}</p>
    </div>
  )
}

function ProgressBar({ step }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="relative flex items-center mb-5">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand transition-all duration-500"
          style={{ width: `${((step - 1) / (STEP_META.length - 1)) * 100}%` }}
        />
        <div className="relative flex w-full justify-between">
          {STEP_META.map(({ number }) => (
            <div
              key={number}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all duration-300 ${
                number < step  ? 'bg-brand border-brand text-white'
                : number === step ? 'bg-white border-brand text-brand ring-4 ring-brand/15'
                : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {number < step ? '✓' : number}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        {STEP_META.map(({ number, label }) => (
          <span key={number} className={`text-[11px] font-medium w-14 text-center ${number <= step ? 'text-brand' : 'text-gray-300'}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Onboarding() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState({
    business_name:   '',
    category:        '',
    city:            '',
    state:           'Telangana',
    owner_name:      '',
    owner_phone:     '',
    whatsapp_number: '',
    sameAsMobile:    false,
  })

  const update = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError('') }

  const validateStep1 = () => {
    if (!form.business_name.trim()) return 'Enter your business name.'
    if (!form.category)             return 'Select a business category.'
    if (!form.city.trim())          return 'Enter your city.'
    return null
  }

  const validateStep2 = () => {
    if (!form.owner_name.trim())  return "Enter the owner's full name."
    if (!/^[6-9]\d{9}$/.test(form.owner_phone)) return 'Enter a valid 10-digit mobile number.'
    return null
  }

  const goNext = () => {
    const err = step === 1 ? validateStep1() : null
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  const handleSubmit = async () => {
    const err = validateStep2()
    if (err) { setError(err); return }
    if (!user) return

    setLoading(true)
    setError('')

    const { error: updateErr } = await supabase
      .from('business')
      .update({
        business_name:   form.business_name,
        category:        form.category,
        city:            form.city,
        state:           form.state,
        owner_name:      form.owner_name,
        owner_phone:     form.owner_phone,
        whatsapp_number: form.whatsapp_number || form.owner_phone,
      })
      .eq('owner_id', user.id)

    setLoading(false)

    if (updateErr) {
      setError(updateErr.message || 'Failed to save. Please try again.')
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="h-1 bg-brand" />

      <div className="flex items-center px-5 py-4 border-b border-gray-50">
        <Logo size="sm" />
      </div>

      <ProgressBar step={step} />

      <div className="flex-1 px-6 pb-12 flex flex-col gap-5">

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div>
              <p className="text-[18px] font-semibold text-gray-900">Tell us about your business</p>
              <p className="text-[13px] text-gray-500 mt-1">This sets up your RepShield dashboard.</p>
            </div>

            <div>
              <label className="field-label">Business name <span className="text-red-400">*</span></label>
              <input type="text" className="input-field" placeholder="e.g. Mango Dine Restaurant"
                value={form.business_name} onChange={(e) => update('business_name', e.target.value)} />
            </div>

            <div>
              <label className="field-label">Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select className="input-field appearance-none pr-10 bg-white cursor-pointer"
                  value={form.category} onChange={(e) => update('category', e.target.value)}>
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">▼</span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <label className="field-label">City <span className="text-red-400">*</span></label>
                <input type="text" className="input-field" placeholder="Hyderabad"
                  value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="field-label">State</label>
                <input type="text" className="input-field"
                  value={form.state} onChange={(e) => update('state', e.target.value)} />
              </div>
            </div>

            <ErrorBox message={error} />
            <button className="btn-primary mt-1" onClick={goNext}>Continue →</button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div>
              <p className="text-[18px] font-semibold text-gray-900">Owner details</p>
              <p className="text-[13px] text-gray-500 mt-1">We'll send alerts and reports here.</p>
            </div>

            <div>
              <label className="field-label">Full name <span className="text-red-400">*</span></label>
              <input type="text" className="input-field" placeholder="e.g. Suresh Reddy"
                value={form.owner_name} onChange={(e) => update('owner_name', e.target.value)} />
            </div>

            <div>
              <label className="field-label">Mobile number <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">+91</span>
                <input type="tel" inputMode="numeric" className="input-field pl-12" placeholder="98XXXXXXXX" maxLength={10}
                  value={form.owner_phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    update('owner_phone', v)
                    if (form.sameAsMobile) update('whatsapp_number', v)
                  }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="field-label mb-0">WhatsApp number</label>
                <button type="button" onClick={() => {
                  const newVal = !form.sameAsMobile
                  update('sameAsMobile', newVal)
                  if (newVal) update('whatsapp_number', form.owner_phone)
                  else update('whatsapp_number', '')
                }} className="flex items-center gap-1.5">
                  <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${form.sameAsMobile ? 'bg-brand' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.sameAsMobile ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <span className="text-[12px] text-gray-500">Same as mobile</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">+91</span>
                <input type="tel" inputMode="numeric" className={`input-field pl-12 ${form.sameAsMobile ? 'bg-gray-50 text-gray-400' : ''}`}
                  placeholder="98XXXXXXXX" maxLength={10} readOnly={form.sameAsMobile}
                  value={form.whatsapp_number}
                  onChange={(e) => !form.sameAsMobile && update('whatsapp_number', e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>

            <ErrorBox message={error} />

            <div className="flex flex-col gap-3 mt-1">
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up…</>
                ) : '🚀 Go to Dashboard'}
              </button>
              <button className="btn-ghost" onClick={() => { setStep(1); setError('') }}>← Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
