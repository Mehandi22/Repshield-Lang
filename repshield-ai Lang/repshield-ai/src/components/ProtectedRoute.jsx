import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const { session, loading: authLoading } = useAuth()
  const [checking,     setChecking]    = useState(true)
  const [hasSubscription, setHasSub]  = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session) { setChecking(false); return }

    supabase
      .from('business')
      .select('subscription_status')
      .eq('owner_id', session.user.id)
      .single()
      .then(({ data }) => {
        const status = data?.subscription_status
        setHasSub(!!status && status !== 'inactive')
        setChecking(false)
      })
  }, [session, authLoading])

  if (authLoading || checking) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session)         return <Navigate to="/login"     replace />
  if (!hasSubscription) return <Navigate to="/subscribe" replace />

  return children
}
