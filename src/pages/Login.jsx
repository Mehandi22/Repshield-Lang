import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLang } from '../context/LanguageContext'

export default function Login() {
  const navigate      = useNavigate()
  const { t }         = useLang()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setLoading(false)
      // No account found → send to subscribe
      if (authErr.message?.toLowerCase().includes('invalid login')) {
        setError('No account found with these details. Please subscribe to get started.')
      } else {
        setError(authErr.message)
      }
      return
    }

    // Check subscription status
    const userId = data.user?.id
    const { data: biz } = await supabase
      .from('business')
      .select('subscription_status, owner_name')
      .eq('owner_id', userId)
      .single()

    setLoading(false)

    if (!biz || !biz.subscription_status || biz.subscription_status === 'inactive') {
      // No valid subscription → redirect to subscribe
      navigate('/subscribe')
      return
    }

    navigate('/dashboard')
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSignIn() }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="h-1 bg-brand" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <Logo size="sm" />
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col px-6 pt-10 pb-10">
        {/* Logo + tagline */}
        <div className="mb-8">
          <Logo size="lg" />
          <p className="mt-2 text-[14px] text-gray-500 leading-snug">{t.tagline}</p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="field-label" htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-btn px-4 py-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                <p className="text-[13px] text-red-600 leading-snug">{error}</p>
              </div>
              {error.includes('subscribe') && (
                <Link
                  to="/subscribe"
                  className="text-[13px] font-semibold text-brand hover:underline"
                >
                  View plans & subscribe →
                </Link>
              )}
            </div>
          )}

          <button
            className="btn-primary mt-1"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              t.signIn
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 my-7">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[12px] text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <p className="text-center text-[14px] text-gray-500">
          {t.noAccount}{' '}
          <Link to="/subscribe" className="text-brand font-semibold hover:underline">
            {t.subscribe} →
          </Link>
        </p>
      </div>

      <p className="text-center text-[11px] text-gray-300 pb-6">
        © {new Date().getFullYear()} RepShield AI
      </p>
    </div>
  )
}
