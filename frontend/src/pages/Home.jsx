import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trophy, ArrowRight, Star, Users, DollarSign, TrendingUp, ChevronRight, Play } from 'lucide-react'
import { supabase } from '../utils/supabase'

const CHARITIES = [
  { name: 'Children\'s Cancer Fund', cause: 'Health', raised: '£12,400', icon: '🏥' },
  { name: 'Ocean Cleanup Project', cause: 'Environment', raised: '£8,200', icon: '🌊' },
  { name: 'Food Banks UK', cause: 'Hunger', raised: '£15,800', icon: '🥗' },
  { name: 'Mental Health UK', cause: 'Wellness', raised: '£6,100', icon: '💚' },
  { name: 'Shelter Housing', cause: 'Community', raised: '£9,300', icon: '🏠' },
  { name: 'Age UK', cause: 'Elderly Care', raised: '£7,600', icon: '❤️' },
]

const STATS = [
  { value: '2,400+', label: 'Active Members', icon: Users },
  { value: '£62,000', label: 'Raised for Charity', icon: Heart },
  { value: '£48,000', label: 'Prize Pool Total', icon: Trophy },
  { value: '94%', label: 'Member Satisfaction', icon: Star },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Subscribe', desc: 'Choose monthly or yearly. A portion goes straight to your chosen charity.', color: 'bg-forest-50 border-forest-200' },
  { step: '02', title: 'Enter Scores', desc: 'Log your last 5 Stableford scores. Your game, your data, your draw ticket.', color: 'bg-gold/10 border-yellow-200' },
  { step: '03', title: 'Enter the Draw', desc: 'Monthly prize draws with 3, 4, and 5-number match tiers. Jackpot rolls over!', color: 'bg-blue-50 border-blue-200' },
  { step: '04', title: 'Impact + Win', desc: 'Track your charity impact and winnings from one beautiful dashboard.', color: 'bg-purple-50 border-purple-200' },
]

function useIntersection(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return visible
}

function AnimatedSection({ children, className = '' }) {
  const ref = useRef()
  const visible = useIntersection(ref)
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

export default function Home() {
  const [currentPrize, setCurrentPrize] = useState(48250)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrize(p => p + Math.floor(Math.random() * 3))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-charcoal text-white overflow-hidden pt-16">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-forest-800/30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-forest-600/20 rounded-full blur-3xl animate-pulse-slow delay-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-forest-900/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#27a061 1px, transparent 1px), linear-gradient(90deg, #27a061 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-forest-900/60 border border-forest-700 rounded-full px-4 py-2 text-xs font-mono text-forest-300 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Monthly Draw Now Live — £{currentPrize.toLocaleString()} Pool
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Golf that{' '}
                <span className="relative">
                  <span className="text-forest-400">gives</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0,4 Q50,0 100,4 Q150,8 200,4" stroke="#27a061" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
                {' '}back.
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
                Subscribe. Track your Stableford scores. Enter monthly prize draws. And support a charity that matters to you — automatically, every month.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary bg-forest-500 hover:bg-forest-400 flex items-center justify-center gap-2 text-base py-4 px-8">
                  Start Your Journey <ArrowRight size={18} />
                </Link>
                <Link to="/draws" className="flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors py-4 px-6 border border-gray-700 rounded-full hover:border-gray-500">
                  <Play size={14} fill="currentColor" /> How draws work
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-800">
                <div className="flex -space-x-2">
                  {['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦳'].map((e, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-forest-800 border-2 border-charcoal flex items-center justify-center text-sm">{e}</div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium">2,400+ golfers</div>
                  <div className="text-xs text-gray-500">already making an impact</div>
                </div>
              </div>
            </div>

            {/* Hero card */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Live Draw Pool</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div className="font-display text-5xl font-bold text-white mb-1">
                  £{currentPrize.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Growing every 2 seconds</div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: '5-Number Match (Jackpot)', pct: 40, color: 'bg-gold' },
                    { label: '4-Number Match', pct: 35, color: 'bg-forest-500' },
                    { label: '3-Number Match', pct: 25, color: 'bg-blue-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-forest-900/60 border border-forest-800 rounded-2xl p-4">
                  <Heart size={18} className="text-red-400 mb-2" />
                  <div className="font-display text-2xl font-bold">£62k</div>
                  <div className="text-xs text-gray-400 mt-1">Given to charity</div>
                </div>
                <div className="bg-gold/10 border border-yellow-800 rounded-2xl p-4">
                  <Trophy size={18} className="text-gold mb-2" />
                  <div className="font-display text-2xl font-bold">147</div>
                  <div className="text-xs text-gray-400 mt-1">Winners this year</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-forest-600 text-white py-3 overflow-hidden">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) =>
            CHARITIES.map((c, j) => (
              <span key={`${i}-${j}`} className="inline-flex items-center gap-2 mx-8 text-sm font-medium whitespace-nowrap">
                <span>{c.icon}</span>
                <span>{c.name}</span>
                <span className="text-forest-200">·</span>
                <span className="text-forest-200">{c.raised} raised</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* STATS */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="card text-center group hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-forest-600 transition-colors">
                    <Icon size={18} className="text-forest-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-display text-3xl font-bold text-charcoal mb-1">{value}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <div className="section-tag">How It Works</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-charcoal">
              Simple. Purposeful. <span className="gradient-text">Rewarding.</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Four steps to transform your love of golf into real-world charity impact — and a chance to win.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, color }, i) => (
              <AnimatedSection key={step} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`rounded-2xl border-2 p-6 h-full ${color}`}>
                  <div className="font-mono text-4xl font-bold text-gray-200 mb-4">{step}</div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITIES */}
      <section className="py-24 bg-forest-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-forest-400 bg-forest-900 px-3 py-1.5 rounded-full border border-forest-800 mb-4 uppercase tracking-widest">
                Featured Charities
              </div>
              <h2 className="font-display text-4xl font-bold">
                Your subscription,<br />
                <span className="text-forest-400">their impact.</span>
              </h2>
            </div>
            <Link to="/charities" className="btn-outline border-forest-600 text-forest-400 hover:bg-forest-600 hover:text-white flex items-center gap-2">
              All Charities <ChevronRight size={16} />
            </Link>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHARITIES.map(({ name, cause, raised, icon }) => (
              <AnimatedSection key={name}>
                <div className="bg-forest-900/50 border border-forest-800 rounded-2xl p-5 hover:border-forest-600 transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{icon}</div>
                    <span className="text-xs bg-forest-800 text-forest-300 px-2.5 py-1 rounded-full">{cause}</span>
                  </div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-forest-300 transition-colors">{name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-forest-400">
                    <TrendingUp size={13} />
                    <span>{raised} raised this year</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE TIERS */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <div className="section-tag">Prize Structure</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold">
              Three ways to <span className="gradient-text">win monthly.</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { match: '5-Number Match', share: '40%', label: 'Jackpot', emoji: '🏆', rollover: true, color: 'bg-gold text-white border-yellow-400', textColor: 'text-yellow-100' },
              { match: '4-Number Match', share: '35%', label: 'Major Prize', emoji: '🥈', rollover: false, color: 'bg-forest-600 text-white border-forest-500', textColor: 'text-forest-100' },
              { match: '3-Number Match', share: '25%', label: 'Standard Prize', emoji: '🥉', rollover: false, color: 'bg-white border-gray-200', textColor: 'text-gray-500' },
            ].map(({ match, share, label, emoji, rollover, color, textColor }) => (
              <AnimatedSection key={match}>
                <div className={`rounded-3xl border-2 p-8 text-center ${color}`}>
                  <div className="text-4xl mb-4">{emoji}</div>
                  <div className="text-xs font-mono uppercase tracking-widest opacity-70 mb-2">{label}</div>
                  <h3 className="font-display text-2xl font-bold mb-1">{match}</h3>
                  <div className="text-5xl font-display font-bold my-4">{share}</div>
                  <p className={`text-sm ${textColor}`}>of the monthly prize pool</p>
                  {rollover && (
                    <div className={`mt-4 text-xs font-medium px-3 py-1.5 rounded-full inline-block bg-black/20`}>
                      🔁 Jackpot rolls over if unclaimed
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-forest-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <AnimatedSection>
            <div className="text-5xl mb-6">⛳</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Ready to play with purpose?
            </h2>
            <p className="text-forest-100 text-lg mb-10 max-w-lg mx-auto">
              Join 2,400+ golfers who score, compete, and give — all in one place. Your first month starts today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-white text-forest-700 hover:bg-cream px-8 py-4 rounded-full font-semibold text-base transition-all hover:shadow-lg flex items-center justify-center gap-2">
                Join Now — Free to Start <ArrowRight size={18} />
              </Link>
              <Link to="/charities" className="border-2 border-white/40 text-white hover:border-white px-8 py-4 rounded-full font-medium text-base transition-all flex items-center justify-center gap-2">
                <Heart size={16} /> Browse Charities
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
