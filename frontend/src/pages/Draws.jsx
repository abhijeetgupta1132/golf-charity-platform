import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { Trophy, Calendar, Users, ChevronDown, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const DEMO_DRAWS = [
  { id: 1, draw_month: 'March 2026', status: 'active', prize_pool: 48250, jackpot_pool: 19300, major_pool: 16887, standard_pool: 12063, participants: 2413, winning_numbers: null, jackpot_rolled_over: false, jackpot_carry: 0 },
  { id: 2, draw_month: 'February 2026', status: 'completed', prize_pool: 44100, jackpot_pool: 0, major_pool: 15435, standard_pool: 11025, participants: 2205, winning_numbers: [7, 14, 22, 31, 38], jackpot_rolled_over: true, jackpot_carry: 17640 },
  { id: 3, draw_month: 'January 2026', status: 'completed', prize_pool: 41800, jackpot_pool: 16720, major_pool: 14630, standard_pool: 10450, participants: 2090, winning_numbers: [3, 18, 27, 33, 41], jackpot_rolled_over: false, jackpot_carry: 0 },
]

const DEMO_WINNERS = [
  { id: 1, draw_id: 3, user_name: 'J. Harrison', match_type: '5_match', amount: 16720, payment_status: 'paid' },
  { id: 2, draw_id: 3, user_name: 'S. Patel', match_type: '4_match', amount: 7315, payment_status: 'paid' },
  { id: 3, draw_id: 3, user_name: 'R. Sharma', match_type: '4_match', amount: 7315, payment_status: 'paid' },
  { id: 4, draw_id: 3, user_name: 'K. Williams', match_type: '3_match', amount: 3483, payment_status: 'paid' },
]

function DrawCard({ draw, winners }) {
  const [expanded, setExpanded] = useState(false)
  const drawWinners = winners.filter(w => w.draw_id === draw.id)
  const isActive = draw.status === 'active'

  return (
    <div className={`card border-2 transition-all ${isActive ? 'border-forest-300 bg-forest-50/50' : 'border-gray-100'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full font-semibold ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isActive && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
              {isActive ? 'LIVE' : 'COMPLETED'}
            </span>
            {draw.jackpot_rolled_over && (
              <span className="text-xs bg-gold/20 text-yellow-700 px-2.5 py-1 rounded-full font-medium">🔁 Jackpot Rolled</span>
            )}
          </div>
          <h3 className="font-display text-xl font-bold">{draw.draw_month}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Users size={11} /> {draw.participants?.toLocaleString()} participants</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold text-charcoal">
            £{draw.prize_pool?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Prize Pool</div>
        </div>
      </div>

      {/* Pool breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Jackpot (5-match)', value: draw.jackpot_pool + (draw.jackpot_carry || 0), color: 'bg-gold/20 text-yellow-800 border-yellow-200', emoji: '🏆' },
          { label: '4-Number Match', value: draw.major_pool, color: 'bg-forest-50 text-forest-800 border-forest-200', emoji: '🥈' },
          { label: '3-Number Match', value: draw.standard_pool, color: 'bg-blue-50 text-blue-800 border-blue-200', emoji: '🥉' },
        ].map(({ label, value, color, emoji }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <div className="text-base mb-1">{emoji}</div>
            <div className="font-bold font-mono text-sm">£{(value || 0).toLocaleString()}</div>
            <div className="text-xs mt-0.5 opacity-70 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Winning numbers (if draw completed) */}
      {draw.winning_numbers && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Winning Numbers</div>
          <div className="flex gap-2">
            {draw.winning_numbers.map((n, i) => (
              <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                i === 4 ? 'bg-gold text-white' : 'bg-charcoal text-white'
              }`}>{n}</div>
            ))}
          </div>
        </div>
      )}

      {/* Winners toggle */}
      {drawWinners.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-forest-600 font-medium hover:underline"
          >
            View winners ({drawWinners.length})
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {drawWinners.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy size={13} className="text-gold" />
                    <span className="font-medium">{w.user_name}</span>
                    <span className="text-gray-500">— {w.match_type?.replace('_', '-')} match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest-700">£{w.amount?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {w.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isActive && (
        <div className="mt-4 pt-4 border-t border-forest-200">
          <div className="flex items-center gap-2 text-sm text-forest-700">
            <Lock size={13} />
            <span>Draw runs at end of month. Must be subscribed & have 5 scores entered to qualify.</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Draws() {
  const { user, isSubscribed } = useAuth()
  const [draws, setDraws] = useState([])
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [drawsRes, winnersRes] = await Promise.all([
        supabase.from('draws').select('*').order('draw_date', { ascending: false }),
        supabase.from('winnings').select('id, draw_id, user_id, match_type, amount, payment_status, profiles(full_name)'),
      ])
      const drawData = drawsRes.data?.length ? drawsRes.data : DEMO_DRAWS
      const winData = (winnersRes.data || DEMO_WINNERS).map(w => ({
        ...w,
        user_name: w.profiles?.full_name ? w.profiles.full_name[0] + '. ' + w.profiles.full_name.split(' ')[1] : w.user_name,
      }))
      setDraws(drawData)
      setWinners(winData)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-12">
          <div className="section-tag mx-auto">Prize Draws</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-charcoal">
            Monthly <span className="gradient-text">Prize Draws</span>
          </h1>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Three match tiers every month. Jackpot rolls over when unclaimed. Your scores are your draw tickets.
          </p>
        </div>

        {/* How it qualifies */}
        <div className="card mb-8 border-2 border-forest-100">
          <h2 className="font-display text-lg font-bold mb-4">How to Qualify</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
            {[
              { step: '1', label: 'Active subscription', desc: 'Monthly or annual plan' },
              { step: '2', label: '5 scores entered', desc: 'Any Stableford scores 1–45' },
              { step: '3', label: 'Auto-entered', desc: 'No action needed each month' },
            ].map(({ step, label, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-9 h-9 bg-forest-600 text-white rounded-full flex items-center justify-center font-bold mb-2">{step}</div>
                <div className="font-medium text-charcoal">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
          {!user && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link to="/register" className="btn-primary text-sm py-2.5 px-6">Join & Enter Draws</Link>
            </div>
          )}
          {user && !isSubscribed && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link to="/subscribe" className="btn-primary text-sm py-2.5 px-6">Subscribe to Enter</Link>
            </div>
          )}
        </div>

        {/* Draws list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {draws.map(draw => <DrawCard key={draw.id} draw={draw} winners={winners} />)}
          </div>
        )}
      </div>
    </div>
  )
}
