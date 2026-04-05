import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Subscribe    from './pages/Subscribe'
import Onboarding   from './pages/Onboarding'
import Dashboard    from './pages/Dashboard'
import Inbox        from './pages/Inbox'
import Reviews      from './pages/Reviews'
import QRPage       from './pages/QRPage'
import Settings     from './pages/Settings'
import FeedbackForm from './pages/FeedbackForm'

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"            element={<Landing />}      />
            <Route path="/login"       element={<Login />}        />
            <Route path="/subscribe"   element={<Subscribe />}    />
            <Route path="/r/:businessId" element={<FeedbackForm />} />

            {/* Post-payment onboarding (needs session, not subscription check) */}
            <Route path="/onboarding"  element={<Onboarding />}   />

            {/* Protected — needs session + subscription */}
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/inbox"     element={<Protected><Inbox /></Protected>}     />
            <Route path="/reviews"   element={<Protected><Reviews /></Protected>}   />
            <Route path="/qr"        element={<Protected><QRPage /></Protected>}    />
            <Route path="/settings"  element={<Protected><Settings /></Protected>}  />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
