import { useNavigate } from 'react-router-dom'
import { PLANS } from '../lib/razorpay'
import Logo from '../components/Logo'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLang } from '../context/LanguageContext'

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-card border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-[10px] bg-brand-50 flex items-center justify-center text-[22px]">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-gray-900">{title}</p>
        <p className="text-[13px] text-gray-500 mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onSelect }) {
  const isGrowth = plan.id === 'growth'
  return (
    <div className={`relative rounded-card p-5 flex flex-col gap-4 ${
      isGrowth
        ? 'bg-brand text-white shadow-lg shadow-brand/20'
        : 'bg-white border border-gray-100 shadow-sm'
    }`}>
      {plan.badge && (
        <div className="absolute -top-3 left-5">
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            {plan.badge}
          </span>
        </div>
      )}
      <div>
        <p className={`text-[15px] font-bold ${isGrowth ? 'text-white' : 'text-gray-900'}`}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-[28px] font-bold ${isGrowth ? 'text-white' : 'text-brand'}`}>
            {plan.display}
          </span>
          <span className={`text-[12px] ${isGrowth ? 'text-white/70' : 'text-gray-400'}`}>
            {plan.period}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px]">
            <span className={`shrink-0 mt-0.5 ${isGrowth ? 'text-yellow-300' : 'text-brand'}`}>✓</span>
            <span className={isGrowth ? 'text-white/90' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(plan)}
        className={`w-full py-3 rounded-btn font-semibold text-[14px] transition-all active:scale-[0.98] ${
          isGrowth
            ? 'bg-white text-brand hover:bg-gray-50'
            : 'bg-brand text-white hover:bg-brand-600'
        }`}
      >
        Get Started
      </button>
      <p className={`text-[11px] text-center ${isGrowth ? 'text-white/50' : 'text-gray-400'}`}>
        No contracts · Cancel anytime
      </p>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[24px] font-bold text-brand">{value}</p>
      <p className="text-[11px] text-gray-500 text-center leading-tight">{label}</p>
    </div>
  )
}

// ─── Main Landing ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate  = useNavigate()
  const { t }     = useLang()

  const handlePlanSelect = (plan) => {
    navigate('/subscribe', { state: { plan } })
  }

  const FEATURES = [
    {
      icon:  '📱',
      title: 'Smart QR Feedback',
      desc:  'Customers scan, rate, and respond in seconds. Every response is captured privately and securely.',
    },
    {
      icon:  '⭐',
      title: 'Review Management',
      desc:  'See all your Google reviews in one place. Respond faster with AI-assisted reply suggestions.',
    },
    {
      icon:  '📊',
      title: 'Real-time Dashboard',
      desc:  'Track ratings, feedback trends, and complaint patterns — updated instantly after every scan.',
    },
    {
      icon:  '📲',
      title: 'WhatsApp Alerts',
      desc:  'Get notified immediately when a customer leaves a complaint. Resolve it before it escalates.',
    },
    {
      icon:  '🤖',
      title: 'AI Reply Assistant',
      desc:  'Generate professional, personalised replies to reviews in seconds. Sounds human, never robotic.',
    },
    {
      icon:  '🔒',
      title: 'Private Complaint Inbox',
      desc:  'Unhappy customers reach you directly — not the internet. Resolve issues before they go public.',
    },
  ]

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/login')}
            className="text-[13px] font-semibold text-brand px-3 py-2 rounded-btn hover:bg-brand-50 transition-colors"
          >
            {t.signIn}
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-5 pt-12 pb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 self-start">
            <span className="text-[11px] font-bold text-brand bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
              Built for India
            </span>
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 leading-tight tracking-tight">
            Your reputation,{' '}
            <span className="text-brand">managed automatically</span>
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            RepShield AI helps restaurants, clinics, salons, and local businesses collect feedback, manage Google reviews, and protect their reputation — all from one simple dashboard.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary"
          >
            {t.getStarted} →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost"
          >
            {t.signIn}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          <Stat value="500+"  label="Businesses protected"    />
          <Stat value="4.7★"  label="Avg rating improvement"  />
          <Stat value="3 min" label="Setup time"              />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-5 py-10 bg-gray-50">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">How it works</p>
        <h2 className="text-[20px] font-bold text-gray-900 mb-6 leading-tight">
          From QR scan to resolved — in minutes
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { n: '01', title: 'Place your QR code',     desc: 'Print and display at your counter, table, or billing desk.' },
            { n: '02', title: 'Customer scans & rates', desc: 'They share their experience in under 30 seconds. No app needed.' },
            { n: '03', title: 'You get notified',       desc: 'Complaints reach your private inbox instantly via WhatsApp.' },
            { n: '04', title: 'Resolve & respond',      desc: 'Address issues privately. Happy customers can share publicly.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-4 bg-white rounded-card border border-gray-100 p-4 shadow-sm">
              <span className="text-[13px] font-bold text-brand bg-brand-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                {n}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{title}</p>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-5 py-10">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">Features</p>
        <h2 className="text-[20px] font-bold text-gray-900 mb-6 leading-tight">
          Everything your business needs
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-5 py-10 bg-gray-50">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">Pricing</p>
        <h2 className="text-[20px] font-bold text-gray-900 mb-2 leading-tight">
          Simple, transparent pricing
        </h2>
        <p className="text-[13px] text-gray-500 mb-6">
          GST inclusive · No setup fees · Cancel anytime
        </p>
        <div className="flex flex-col gap-5">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="px-5 py-10">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">Testimonials</p>
        <h2 className="text-[20px] font-bold text-gray-900 mb-6 leading-tight">
          Trusted by local businesses
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              name:  'Ravi Kumar',
              biz:   'Mango Dine, Hyderabad',
              text:  'Our Google rating went from 3.9 to 4.4 in 2 months. The WhatsApp alerts help us fix issues before customers leave bad reviews online.',
              stars: 5,
            },
            {
              name:  'Dr. Priya Sharma',
              biz:   'Sharma Clinic, Vijayawada',
              text:  'Patients love how easy the feedback form is. We resolved 3 complaints privately that would have hurt our reputation otherwise.',
              stars: 5,
            },
            {
              name:  'Suresh Babu',
              biz:   'Style Studio, Warangal',
              text:  'Setup took 5 minutes. The QR code at our counter gets scanned every day. Dashboard is clean and simple — exactly what I needed.',
              stars: 5,
            },
          ].map(({ name, biz, text, stars }) => (
            <div key={name} className="bg-white rounded-card border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
              <p className="text-yellow-400 text-[14px]">{'★'.repeat(stars)}</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">"{text}"</p>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{name}</p>
                <p className="text-[12px] text-gray-400">{biz}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="mx-4 mb-10 bg-brand rounded-card p-6 flex flex-col gap-4 text-white">
        <h2 className="text-[20px] font-bold leading-tight">
          Ready to protect your reputation?
        </h2>
        <p className="text-[13px] text-white/75 leading-snug">
          Join 500+ local businesses across Telangana, Andhra Pradesh, and Karnataka who use RepShield AI every day.
        </p>
        <button
          onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
          className="w-full bg-white text-brand font-bold py-3 rounded-btn text-[14px] hover:bg-gray-50 transition-colors active:scale-[0.98]"
        >
          See Plans & Pricing
        </button>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-5 py-6 border-t border-gray-100 flex flex-col gap-3">
        <Logo size="sm" />
        <p className="text-[12px] text-gray-400 leading-snug">
          Reputation management built for local businesses in India. Serving Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, and more.
        </p>
        <div className="flex flex-wrap gap-3 text-[12px] text-gray-400">
          <span>© {new Date().getFullYear()} RepShield AI</span>
          <span>·</span>
          <button className="hover:text-brand transition-colors">Privacy Policy</button>
          <span>·</span>
          <button className="hover:text-brand transition-colors">Terms of Service</button>
          <span>·</span>
          <button className="hover:text-brand transition-colors">Contact</button>
        </div>
      </footer>

    </div>
  )
}
