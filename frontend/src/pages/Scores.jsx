import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { Plus, Trash2, Info, TrendingUp, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

const MAX_SCORES = 5

function ScoreBar({ score }) {
  const pct = Math.round((score / 45) * 100)
  const color = score >= 36 ? 'bg-forest-500' : score >= 28 ? 'bg-blue-500' : score >= 18 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Scores() {
  const { user } = useAuth()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ score: '', score_date: new Date().toISOString().split('T')[0], course_name: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (user) loadScores() }, [user])

  async function loadScores() {
    const { data } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .limit(MAX_SCORES)
    setScores(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const scoreNum = parseInt(form.score)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be between 1 and 45 (Stableford)')
      return
    }
    setSubmitting(true)
    try {
      if (editId) {
        await supabase.from('golf_scores').update({
          score: scoreNum,
          score_date: form.score_date,
          course_name: form.course_name || null,
        }).eq('id', editId).eq('user_id', user.id)
        toast.success('Score updated!')
        setEditId(null)
      } else {
        // Rolling 5-score logic — if already 5, delete oldest
        if (scores.length >= MAX_SCORES) {
          const oldest = scores[scores.length - 1]
          await supabase.from('golf_scores').delete().eq('id', oldest.id)
        }
        await supabase.from('golf_scores').insert({
          user_id: user.id,
          score: scoreNum,
          score_date: form.score_date,
          course_name: form.course_name || null,
        })
        toast.success('Score added!')
      }
      setForm({ score: '', score_date: new Date().toISOString().split('T')[0], course_name: '' })
      setAddOpen(false)
      loadScores()
    } catch (err) {
      toast.error('Failed to save score')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this score?')) return
    await supabase.from('golf_scores').delete().eq('id', id)
    toast.success('Score removed')
    loadScores()
  }

  function handleEdit(s) {
    setEditId(s.id)
    setForm({ score: s.score.toString(), score_date: s.score_date, course_name: s.course_name || '' })
    setAddOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const avg = scores.length ? (scores.reduce((s, sc) => s + sc.score, 0) / scores.length).toFixed(1) : 0
  const best = scores.length ? Math.max(...scores.map(s => s.score)) : 0
  const trend = scores.length >= 2 ? scores[0].score - scores[1].score : 0

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal">My Golf Scores</h1>
          <p className="text-gray-500 text-sm mt-1">Track your last 5 Stableford scores. New scores auto-replace the oldest.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Average', value: avg || '—', icon: '📊' },
            { label: 'Best Score', value: best || '—', icon: '⭐' },
            { label: 'Trend', value: trend > 0 ? `+${trend}` : trend || '—', icon: trend > 0 ? '📈' : '📉', color: trend > 0 ? 'text-forest-600' : trend < 0 ? 'text-red-500' : '' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card text-center p-4">
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`font-display text-2xl font-bold ${color || 'text-charcoal'}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-forest-50 border border-forest-100 rounded-xl p-4 flex items-start gap-3 mb-6 text-sm">
          <Info size={15} className="text-forest-600 shrink-0 mt-0.5" />
          <div className="text-forest-700">
            <strong>Rolling 5-Score System:</strong> Only your latest 5 scores are stored. Adding a 6th automatically removes the oldest. Scores range from 1–45 (Stableford format).
          </div>
        </div>

        {/* Add Score Form */}
        {addOpen && (
          <div className="card mb-6 border-2 border-forest-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">{editId ? 'Edit Score' : 'Add New Score'}</h2>
              <button onClick={() => { setAddOpen(false); setEditId(null); setForm({ score: '', score_date: new Date().toISOString().split('T')[0], course_name: '' }) }}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Score (Stableford)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    className="input-field"
                    placeholder="e.g. 32"
                    value={form.score}
                    onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1">1 – 45 points</div>
                </div>
                <div>
                  <label className="label">Date Played</label>
                  <input
                    type="date"
                    className="input-field"
                    max={new Date().toISOString().split('T')[0]}
                    value={form.score_date}
                    onChange={e => setForm(f => ({ ...f, score_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Course Name <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. St Andrews Links"
                  value={form.course_name}
                  onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 py-2.5">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
                  {editId ? 'Update Score' : 'Add Score'}
                </button>
                <button type="button" onClick={() => { setAddOpen(false); setEditId(null) }} className="btn-outline py-2.5">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scores List */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold">
              Scores ({scores.length}/{MAX_SCORES})
            </h2>
            {!addOpen && (
              <button
                onClick={() => setAddOpen(true)}
                disabled={loading}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
              >
                <Plus size={15} /> Add Score
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⛳</div>
              <h3 className="font-display text-xl font-bold mb-2">No scores yet</h3>
              <p className="text-gray-500 text-sm mb-4">Add your first Stableford score to enter monthly draws</p>
              <button onClick={() => setAddOpen(true)} className="btn-primary">Add Your First Score</button>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((s, i) => (
                <div key={s.id} className={`p-4 rounded-xl border-2 transition-all ${
                  i === 0 ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-transparent hover:border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        i === 0 ? 'bg-forest-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {i === 0 ? '★' : i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-charcoal text-sm">
                          {new Date(s.score_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {s.course_name && <div className="text-xs text-gray-500">{s.course_name}</div>}
                        {i === 0 && <div className="text-xs text-forest-600 font-medium mt-0.5">Most recent • counts in draw</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-2xl ${
                        s.score >= 36 ? 'text-forest-600' : s.score >= 28 ? 'text-blue-600' : s.score >= 18 ? 'text-yellow-500' : 'text-red-400'
                      }`}>{s.score}</span>
                      <span className="text-xs text-gray-400">pts</span>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          <Edit2 size={13} className="text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ScoreBar score={s.score} />
                </div>
              ))}
            </div>
          )}

          {scores.length === MAX_SCORES && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
              <Info size={13} />
              You have {MAX_SCORES} scores saved. Adding a new one will remove your oldest score.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
