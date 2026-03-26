import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Play, Shuffle, Trophy, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

function runDrawSimulation(mode, scores) {
  if (mode === 'random') {
    // Random: 5 unique numbers from 1-45
    const nums = new Set()
    while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1)
    return Array.from(nums).sort((a, b) => a - b)
  } else {
    // Algorithmic: weighted by frequency of user scores
    const freq = {}
    scores.forEach(s => { freq[s.score] = (freq[s.score] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    // Pick top 3 most frequent + 2 least frequent
    const top = sorted.slice(0, 3).map(([n]) => parseInt(n))
    const bottom = sorted.slice(-2).map(([n]) => parseInt(n))
    const combined = [...new Set([...top, ...bottom])].slice(0, 5)
    // Fill up if needed
    while (combined.length < 5) {
      const r = Math.floor(Math.random() * 45) + 1
      if (!combined.includes(r)) combined.push(r)
    }
    return combined.sort((a, b) => a - b)
  }
}

function checkMatch(userScores, winningNums) {
  const matchCount = userScores.filter(s => winningNums.includes(s)).length
  if (matchCount >= 5) return '5_match'
  if (matchCount >= 4) return '4_match'
  if (matchCount >= 3) return '3_match'
  return null
}

export default function AdminDraws() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('random')
  const [simResult, setSimResult] = useState(null)
  const [simRunning, setSimRunning] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [allScores, setAllScores] = useState([])
  const [activeDraw, setActiveDraw] = useState(null)
  const [prizePool, setPrizePool] = useState(10000)
  const [drawMonth, setDrawMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }))

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [drawsRes, scoresRes] = await Promise.all([
      supabase.from('draws').select('*').order('draw_date', { ascending: false }),
      supabase.from('golf_scores').select('user_id, score'),
    ])
    setDraws(drawsRes.data || [])
    setAllScores(scoresRes.data || [])
    const active = drawsRes.data?.find(d => d.status === 'active')
    setActiveDraw(active || null)
    if (active) setPrizePool(active.prize_pool || 10000)
    setLoading(false)
  }

  async function handleSimulate() {
    setSimRunning(true)
    setSimResult(null)
    await new Promise(r => setTimeout(r, 800))
    const winningNums = runDrawSimulation(mode, allScores)

    // Group scores by user
    const byUser = {}
    allScores.forEach(({ user_id, score }) => {
      if (!byUser[user_id]) byUser[user_id] = []
      byUser[user_id].push(score)
    })

    const results = { '5_match': [], '4_match': [], '3_match': [] }
    Object.entries(byUser).forEach(([uid, scores]) => {
      if (scores.length < 5) return
      const match = checkMatch(scores, winningNums)
      if (match) results[match].push(uid)
    })

    // Calculate prizes
    const jackpotRollover = activeDraw?.jackpot_carry || 0
    const prizes = {
      '5_match': {
        pool: Math.round((prizePool * 0.4) + jackpotRollover),
        winners: results['5_match'],
        perWinner: results['5_match'].length ? Math.round(((prizePool * 0.4) + jackpotRollover) / results['5_match'].length) : 0
      },
      '4_match': {
        pool: Math.round(prizePool * 0.35),
        winners: results['4_match'],
        perWinner: results['4_match'].length ? Math.round((prizePool * 0.35) / results['4_match'].length) : 0
      },
      '3_match': {
        pool: Math.round(prizePool * 0.25),
        winners: results['3_match'],
        perWinner: results['3_match'].length ? Math.round((prizePool * 0.25) / results['3_match'].length) : 0
      },
    }

    setSimResult({ winningNums, prizes, jackpotRolls: results['5_match'].length === 0 })
    setSimRunning(false)
  }

  async function handlePublish() {
    if (!simResult) { toast.error('Run simulation first'); return }
    if (!confirm(`Publish draw results for ${drawMonth}? This is permanent.`)) return
    setPublishing(true)
    try {
      // Create or update draw
      const drawData = {
        draw_month: drawMonth,
        status: 'completed',
        prize_pool: prizePool,
        jackpot_pool: simResult.prizes['5_match'].winners.length > 0 ? simResult.prizes['5_match'].pool : 0,
        major_pool: simResult.prizes['4_match'].pool,
        standard_pool: simResult.prizes['3_match'].pool,
        winning_numbers: simResult.winningNums,
        jackpot_rolled_over: simResult.jackpotRolls,
        jackpot_carry: simResult.jackpotRolls ? simResult.prizes['5_match'].pool : 0,
        draw_date: new Date().toISOString(),
        draw_logic: mode,
        participants: Object.keys(
          allScores.reduce((acc, s) => { acc[s.user_id] = true; return acc }, {})
        ).length,
      }

      let drawId
      if (activeDraw) {
        await supabase.from('draws').update(drawData).eq('id', activeDraw.id)
        drawId = activeDraw.id
      } else {
        const { data } = await supabase.from('draws').insert(drawData).select().single()
        drawId = data.id
      }

      // Insert winners
      for (const [matchType, { winners, perWinner }] of Object.entries(simResult.prizes)) {
        for (const userId of winners) {
          await supabase.from('winnings').insert({
            user_id: userId,
            draw_id: drawId,
            match_type: matchType,
            amount: perWinner,
            payment_status: 'pending',
          })
        }
      }

      // Create next month's draw
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      await supabase.from('draws').insert({
        draw_month: nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: 'active',
        prize_pool: 0,
        jackpot_pool: 0,
        jackpot_carry: simResult.jackpotRolls ? simResult.prizes['5_match'].pool : 0,
        draw_date: nextMonth.toISOString(),
      })

      toast.success('Draw published successfully!')
      setSimResult(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to publish draw')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <AdminLayout title="Draw Management">
      <div className="space-y-5">

        {/* Draw Config */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold mb-4">Configure Draw</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="label">Draw Month</label>
              <input
                type="text"
                className="input-field"
                value={drawMonth}
                onChange={e => setDrawMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Prize Pool (£)</label>
              <input
                type="number"
                className="input-field"
                value={prizePool}
                onChange={e => setPrizePool(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">Draw Logic</label>
              <div className="flex gap-2">
                {[
                  { value: 'random', label: 'Random', icon: Shuffle },
                  { value: 'algorithmic', label: 'Algorithmic', icon: Zap },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      mode === value ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-200 text-gray-600 hover:border-forest-300'
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              disabled={simRunning}
              className="btn-primary flex items-center gap-2"
            >
              {simRunning ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Play size={15} />}
              {simRunning ? 'Running...' : 'Run Simulation'}
            </button>
            {simResult && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="btn-gold flex items-center gap-2"
              >
                {publishing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={15} />}
                Publish Results
              </button>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>{mode === 'algorithmic' ? 'Algorithmic mode weights numbers by most/least frequent user scores.' : 'Random mode uses standard lottery-style number generation.'}</span>
          </div>
        </div>

        {/* Simulation Result */}
        {simResult && (
          <div className="bg-charcoal text-white rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-gold" />
              <h2 className="font-display text-lg font-bold">Simulation Result</h2>
              <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">Preview Only</span>
            </div>

            <div className="mb-5">
              <div className="text-xs text-gray-400 mb-2">Winning Numbers</div>
              <div className="flex gap-2">
                {simResult.winningNums.map((n, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold ${i === 4 ? 'bg-gold text-white' : 'bg-gray-700 text-white'}`}>{n}</div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(simResult.prizes).map(([type, { pool, winners, perWinner }]) => (
                <div key={type} className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-2">{type.replace('_', '-')} Match</div>
                  <div className="font-bold text-xl text-white">£{pool.toLocaleString()}</div>
                  <div className="text-xs text-gray-300 mt-1">{winners.length} winner{winners.length !== 1 ? 's' : ''}</div>
                  {winners.length > 1 && <div className="text-xs text-green-400">£{perWinner.toLocaleString()} each</div>}
                </div>
              ))}
            </div>

            {simResult.jackpotRolls && (
              <div className="mt-4 flex items-center gap-2 text-sm text-yellow-300 bg-yellow-900/30 rounded-xl px-4 py-3">
                <AlertTriangle size={14} />
                No 5-match winner — Jackpot of £{simResult.prizes['5_match'].pool.toLocaleString()} rolls over to next month!
              </div>
            )}
          </div>
        )}

        {/* Past Draws */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold mb-4">Draw History</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : draws.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No draws yet. Run your first simulation above.</p>
          ) : (
            <div className="space-y-2">
              {draws.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                  <div>
                    <div className="font-medium text-sm">{d.draw_month}</div>
                    <div className="text-xs text-gray-500">{d.participants?.toLocaleString() || 0} participants · {d.draw_logic || 'random'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">£{(d.prize_pool || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
