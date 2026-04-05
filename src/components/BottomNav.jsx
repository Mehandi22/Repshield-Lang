import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

export default function BottomNav() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { t }        = useLang()

  const NAV_ITEMS = [
    { id: 'dashboard', label: t.dashboard, icon: '📊', path: '/dashboard' },
    { id: 'inbox',     label: t.inbox,     icon: '💬', path: '/inbox'     },
    { id: 'reviews',   label: t.reviews,   icon: '⭐', path: '/reviews'   },
    { id: 'qr',        label: t.qr,        icon: '📱', path: '/qr'        },
    { id: 'settings',  label: t.settings,  icon: '⚙️', path: '/settings'  },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-white border-t border-gray-100 z-20">
      <div className="flex">
        {NAV_ITEMS.map(({ id, label, icon, path }) => {
          const active = pathname === path
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-colors ${
                active ? 'text-brand' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <span className="text-[20px] leading-none">{icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-brand' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-brand" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
