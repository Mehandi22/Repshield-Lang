import { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang, LANGUAGES } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LANGUAGES.find((l) => l.code === lang)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 hover:border-gray-300 transition-colors"
      >
        <span>{current.label}</span>
        <span className="text-[9px] text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-card shadow-lg overflow-hidden z-50 min-w-[120px]">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors text-left ${
                l.code === lang
                  ? 'bg-brand-50 text-brand font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-bold text-[14px] w-5 text-center">{l.label}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
