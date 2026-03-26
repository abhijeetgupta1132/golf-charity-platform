import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/AdminLayout'
import { CheckCircle, XCircle, Clock, Trophy, Eye, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const MATCH_LABELS = {
  '5_match': '5-Number (Jackpot)',
  '4_match': '4-Number Match',
  '3_match': '3-Number Match',
}

export default function AdminWinners() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('winnings')
      .select('*, profiles(full_name, email), draws(draw_month, winning_numbers)')
      .order('created_at', { ascending: false })
    setWinners(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    setUpdating(id)
    await supabase.from('winnings').update({ payment_status: status }).eq('id', id)
    toast.success(`Marked as ${status}`)
    setUpdating(null)
    load()
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.payment_status === filter)

  const totals = {
    pending: winners.filter(w => w.payment_status === 'pending').length,
    verified: winners.filter(w => w.payment_status === 'verified').length,
    paid: winners.filter(w => ['paid'].includes(w.payment_status)).length,
    total_payout: winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.amount || 0), 0),
  }

  return (
    <AdminLayout title="Winners">
      <div className="space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending Verification', value: totals.pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Verified (awaiting pay)', value: totals.verified, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Paid Out', value: totals.paid, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Total Paid', value: `£${totals.total_payout.toLocaleString()}`, color: 'bg-forest-50 border-forest-200 text-forest-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl border-2 p-4 ${color}`}>
              <div className="font-display text-2xl font-bold">{value}</div>
              <div className="text-xs mt-1 opacity-80">{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
            {['all', 'pending', 'verified', 'paid', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all ${
                  filter === s ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No winners found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Winner', 'Draw', 'Match', 'Prize', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{w.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{w.profiles?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{w.draws?.draw_month}</div>
                        {w.draws?.winning_numbers && (
                          <div className="flex gap-1 mt-1">
                            {w.draws.winning_numbers.map((n, i) => (
                              <span key={i} className="w-5 h-5 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center justify-center font-mono">{n}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          w.match_type === '5_match' ? 'bg-gold/20 text-yellow-800' :
                          w.match_type === '4_match' ? 'bg-forest-100 text-forest-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {MATCH_LABELS[w.match_type] || w.match_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-forest-700">£{(w.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[w.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                          {w.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {w.payment_status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(w.id, 'verified')}
                                disabled={updating === w.id}
                                className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                                title="Verify"
                              >
                                <CheckCircle size={12} /> Verify
                              </button>
                              <button
                                onClick={() => updateStatus(w.id, 'rejected')}
                                disabled={updating === w.id}
                                className="p-1.5 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle size={14} className="text-red-400" />
                              </button>
                            </>
                          )}
                          {w.payment_status === 'verified' && (
                            <button
                              onClick={() => updateStatus(w.id, 'paid')}
                              disabled={updating === w.id}
                              className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Trophy size={12} /> Mark Paid
                            </button>
                          )}
                          {w.payment_status === 'rejected' && (
                            <button
                              onClick={() => updateStatus(w.id, 'pending')}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Re-review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
