import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Users, Heart, Trophy, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

function StatCard({ label, value, icon: Icon, trend, color = 'forest' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon size={18} className={`text-${color}-600`} />
        </div>
        {trend && <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>}
      </div>
      <div className="font-display text-3xl font-bold text-charcoal">{value}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, active_subs: 0, total_pool: 0, charity_total: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, subsRes, scoresRes, drawsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at, role').order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('id, status, plan, amount').eq('status', 'active'),
        supabase.from('golf_scores').select('id'),
        supabase.from('draws').select('prize_pool').order('draw_date', { ascending: false }).limit(1),
      ])
      const subs = subsRes.data || []
      const totalPool = drawsRes.data?.[0]?.prize_pool || 0
      const charityTotal = subs.reduce((sum, s) => sum + (s.amount || 0) * 0.1, 0)

      setStats({
        users: usersRes.data?.length || 0,
        active_subs: subs.length,
        total_pool: totalPool,
        charity_total: charityTotal,
        scores: scoresRes.data?.length || 0,
      })
      setRecentUsers(usersRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminLayout>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={stats.users.toLocaleString()} icon={Users} trend={12} color="forest" />
            <StatCard label="Active Subscribers" value={stats.active_subs.toLocaleString()} icon={Activity} trend={8} color="blue" />
            <StatCard label="Current Prize Pool" value={`£${stats.total_pool.toLocaleString()}`} icon={Trophy} color="yellow" />
            <StatCard label="Charity Contributions" value={`£${Math.round(stats.charity_total).toLocaleString()}`} icon={Heart} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent users */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Recent Users</h2>
                <Link to="/admin/users" className="text-xs text-forest-600 hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center text-sm font-bold text-forest-700 shrink-0">
                      {u.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.full_name}</div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/admin/draws', label: 'Run Draw Simulation', icon: Trophy, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { to: '/admin/winners', label: 'Verify Winners', icon: Activity, color: 'bg-green-50 text-green-700 border-green-200' },
                  { to: '/admin/charities', label: 'Manage Charities', icon: Heart, color: 'bg-red-50 text-red-700 border-red-200' },
                  { to: '/admin/users', label: 'Manage Users', icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                ].map(({ to, label, icon: Icon, color }) => (
                  <Link key={to} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center text-xs font-medium transition-all hover:shadow-sm ${color}`}>
                    <Icon size={20} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
