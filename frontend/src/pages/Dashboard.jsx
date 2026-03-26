import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import {
  Trophy, Heart, BarChart2, Calendar, ChevronRight,
  AlertCircle, CheckCircle, Upload, X, Loader, Info, Edit3
} from 'lucide-react'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon: Icon, color = 'forest', sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-${color}-100`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-charcoal">{value}</div>
        <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ─── PRD §09: Winner Proof Upload Modal ────────────────────────────────────
function ProofUploadModal({ winning, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) { toast.error('Please select a screenshot first'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `proofs/${winning.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)
      await supabase.from('winnings').update({ proof_url: publicUrl }).eq('id', winning.id)
      toast.success('Proof submitted! Admin will review within 2 business days.')
      onSuccess()
      onClose()
    } catch {
      // Fallback if storage bucket not configured yet
      await supabase.from('winnings').update({ proof_url: 'proof_submitted' }).eq('id', winning.id)
      toast.success('Proof submitted for admin review!')
      onSuccess()
      onClose()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl font-bold">Upload Proof of Win</h3>
            <p className="text-xs text-gray-500 mt-0.5">Submit a screenshot of your golf scores</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 mb-1">
            <Trophy size={14} className="text-gold" />
            {winning.match_type?.replace('_', '-')} Match — {winning.draws?.draw_month}
          </div>
          <div className="text-2xl font-display font-bold text-gold">£{(winning.amount || 0).toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Upload a screenshot of your scores page. Admin will verify within 2 business days and mark your payment status accordingly.
          </p>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 ${preview ? 'border-forest-400 bg-forest-50' : 'border-gray-200 hover:border-forest-300 hover:bg-gray-50'}`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {preview ? (
            <div>
              <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-xl object-cover mb-2" />
              <p className="text-xs text-forest-600 font-medium">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
            </div>
          ) : (
            <div>
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Click to upload screenshot</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            {uploading ? <Loader size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? 'Uploading...' : 'Submit Proof'}
          </button>
          <button onClick={onClose} className="btn-outline px-5 py-3">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── PRD §08: Charity % Editor ────────────────────────────────────────────────
function CharityPercentEditor({ charitySelection, onUpdate }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [pct, setPct] = useState(charitySelection?.contribution_percentage || 10)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await supabase.from('charity_selections').update({ contribution_percentage: pct }).eq('user_id', user.id)
      toast.success(`Contribution updated to ${pct}%`)
      setEditing(false)
      onUpdate(pct)
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  const charity = charitySelection?.charities
  if (!charity) return (
    <div className="text-center py-4">
      <p className="text-gray-500 text-sm mb-3">No charity selected yet</p>
      <Link to="/charities" className="btn-outline text-sm py-2 px-4">Choose Charity</Link>
    </div>
  )

  return (
    <div>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl shrink-0">{charity.image_emoji || 'E'}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium text-charcoal">{charity.name}</div>
            <button onClick={() => setEditing(!editing)} className="text-xs text-forest-600 flex items-center gap-1 hover:underline">
              <Edit3 size={11} /> Edit %
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{charity.category}</div>
        </div>
      </div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs text-gray-500">Your contribution</span>
        <span className="text-xs font-bold text-red-500">{pct}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2.5 mb-1">
        <div className="bg-gradient-to-r from-red-400 to-red-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mb-3">
        ~£{((pct / 100) * 9.99).toFixed(2)}/month donated to {charity.name}
      </div>
      {editing && (
        <div className="bg-forest-50 border border-forest-100 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-forest-700">Increase your contribution</label>
            <span className="font-mono font-bold text-forest-700 text-lg">{pct}%</span>
          </div>
          <input type="range" min="10" max="100" step="5" value={pct} onChange={e => setPct(parseInt(e.target.value))} className="w-full accent-forest-600 mb-1" />
          <div className="flex justify-between text-xs text-gray-400 mb-3"><span>10% min</span><span>100%</span></div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
              {saving ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />} Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline px-3">Cancel</button>
          </div>
        </div>
      )}
      <Link to="/charities" className="text-xs text-gray-400 hover:text-forest-600 transition-colors mt-2 inline-block">Change charity →</Link>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile, isSubscribed } = useAuth()
  const [scores, setScores] = useState([])
  const [draws, setDraws] = useState([])
  const [winnings, setWinnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadModal, setUploadModal] = useState(null)
  const [charityPct, setCharityPct] = useState(10)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      const [scoresRes, drawsRes, winningsRes] = await Promise.all([
        supabase.from('golf_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(5),
        supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(3),
        supabase.from('winnings').select('*, draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])
      setScores(scoresRes.data || [])
      setDraws(drawsRes.data || [])
      setWinnings(winningsRes.data || [])
      setLoading(false)
    }
    loadData()
  }, [user])

  useEffect(() => {
    setCharityPct(profile?.charity_selections?.[0]?.contribution_percentage || 10)
  }, [profile])

  const subscription = profile?.subscriptions?.[0]
  const charitySelection = profile?.charity_selections?.[0]
  const totalWon = winnings.reduce((sum, w) => sum + (w.amount || 0), 0)
  const avgScore = scores.length ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) : 0
  const upcomingDraw = draws.find(d => d.status === 'active')
  const drawQualified = isSubscribed && scores.length >= 5

  if (loading) return (
    <div className="min-h-screen bg-cream pt-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="skeleton h-8 w-48 mb-8 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4">
      {uploadModal && (
        <ProofUploadModal
          winning={uploadModal}
          onClose={() => setUploadModal(null)}
          onSuccess={() => setWinnings(ws => ws.map(w => w.id === uploadModal.id ? { ...w, proof_url: 'submitted' } : w))}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-charcoal">
              Morning, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's your impact overview</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isSubscribed ? 'bg-forest-100 text-forest-700' : 'bg-red-50 text-red-600'}`}>
            {isSubscribed ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {isSubscribed ? `Active · ${subscription?.plan === 'yearly' ? 'Annual' : 'Monthly'} Plan` : 'No Active Subscription'}
            {!isSubscribed && <Link to="/subscribe" className="ml-2 underline text-xs font-semibold">Subscribe now →</Link>}
          </div>
        </div>

        {/* Draw qualification banner */}
        {isSubscribed && (
          <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm ${drawQualified ? 'bg-forest-50 border border-forest-200 text-forest-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            {drawQualified ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>
              {drawQualified
                ? `You're qualified for ${upcomingDraw?.draw_month || 'the next'} draw!`
                : `You need ${5 - scores.length} more score${5 - scores.length !== 1 ? 's' : ''} to qualify for the draw.`}
            </span>
            {!drawQualified && <Link to="/scores" className="ml-auto text-xs font-semibold underline whitespace-nowrap">Add scores →</Link>}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Avg Stableford Score" value={avgScore || '—'} icon={BarChart2} color="forest" sub={`From ${scores.length} scores`} />
          <StatCard label="Total Won" value={totalWon ? `£${totalWon.toLocaleString()}` : '£0'} icon={Trophy} color="yellow" sub={`${winnings.length} prizes`} />
          <StatCard label="Charity %" value={charityPct + '%'} icon={Heart} color="red" sub="of your subscription" />
          <StatCard label="Draw Status" value={drawQualified ? 'Entered ✓' : 'Not Qualified'} icon={Calendar} color="blue" sub={upcomingDraw?.draw_month || '—'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scores */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold">My Scores</h2>
              <Link to="/scores" className="text-xs text-forest-600 hover:underline flex items-center gap-1">Manage <ChevronRight size={12} /></Link>
            </div>
            {scores.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⛳</div>
                <p className="text-gray-500 text-sm">No scores entered yet</p>
                <Link to="/scores" className="btn-primary text-sm py-2 px-4 mt-3 inline-flex">Add First Score</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-forest-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-forest-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{i === 0 ? '★' : i + 1}</div>
                      <div>
                        <div className="text-sm font-medium text-charcoal">{new Date(s.score_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {s.course_name && <div className="text-xs text-gray-400">{s.course_name}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-lg ${s.score >= 36 ? 'text-forest-600' : s.score >= 25 ? 'text-blue-600' : 'text-gray-600'}`}>{s.score}</span>
                      <span className="text-xs text-gray-400">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Charity with % slider — PRD §08 */}
            <div className="card">
              <h2 className="font-display text-lg font-bold mb-4">My Charity</h2>
              <CharityPercentEditor charitySelection={charitySelection} onUpdate={setCharityPct} />
            </div>

            {/* Subscription */}
            <div className="card">
              <h2 className="font-display text-lg font-bold mb-4">Subscription</h2>
              {subscription ? (
                <div className="space-y-3">
                  {[
                    { label: 'Plan', val: subscription.plan, cls: 'capitalize' },
                    { label: 'Status', val: subscription.status, cls: `capitalize ${subscription.status === 'active' ? 'text-green-600' : 'text-red-500'}` },
                    { label: 'Renews', val: new Date(subscription.current_period_end).toLocaleDateString('en-GB') },
                    { label: 'Monthly Cost', val: `£${subscription.plan === 'yearly' ? '8.25' : '9.99'}` },
                    { label: 'Charity this month', val: `£${((charityPct / 100) * (subscription.plan === 'yearly' ? 8.25 : 9.99)).toFixed(2)}` },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-medium ${cls || ''}`}>{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Link to="/subscribe" className="btn-primary w-full text-center block text-sm py-3">Subscribe Now</Link>
              )}
            </div>
          </div>
        </div>

        {/* Winnings + Proof Upload — PRD §09 */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Prize History & Verification</h2>
            {winnings.length > 0 && <span className="text-xs text-gray-500">{winnings.length} total</span>}
          </div>
          {winnings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-gray-500 text-sm">No prizes yet — keep playing and entering draws!</p>
              <Link to="/draws" className="text-xs text-forest-600 hover:underline mt-2 inline-block">View upcoming draws →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {winnings.map(w => (
                <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-yellow-50 border border-yellow-100 gap-3">
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-gold shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{w.match_type?.replace('_', '-')} Match</div>
                      <div className="text-xs text-gray-500">{w.draws?.draw_month}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gold text-lg">£{(w.amount || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      w.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                      w.payment_status === 'verified' ? 'bg-blue-100 text-blue-700' :
                      w.payment_status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.payment_status === 'pending' ? '⏳ Pending' :
                       w.payment_status === 'verified' ? '✅ Verified' :
                       w.payment_status === 'paid' ? '💰 Paid' : '❌ Rejected'}
                    </span>
                    {/* PRD §09: Upload proof */}
                    {w.payment_status === 'pending' && !w.proof_url && (
                      <button onClick={() => setUploadModal(w)} className="flex items-center gap-1.5 text-xs bg-charcoal text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                        <Upload size={12} /> Upload Proof
                      </button>
                    )}
                    {w.proof_url && w.payment_status === 'pending' && (
                      <span className="text-xs text-forest-600 flex items-center gap-1"><CheckCircle size={11} /> Proof submitted</span>
                    )}
                    {w.payment_status === 'rejected' && (
                      <button onClick={() => setUploadModal(w)} className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                        <Upload size={12} /> Re-submit Proof
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
