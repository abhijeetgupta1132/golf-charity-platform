import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Search, Edit2, Check, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*, subscriptions(*), charity_selections(*, charities(name)), golf_scores(id)')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(user) {
    setEditUser(user.id)
    setEditForm({ full_name: user.full_name, role: user.role })
  }

  async function saveEdit(userId) {
    const { error } = await supabase.from('profiles').update(editForm).eq('id', userId)
    if (error) { toast.error('Failed to update'); return }
    toast.success('User updated')
    setEditUser(null)
    loadUsers()
  }

  async function toggleSubStatus(sub) {
    const newStatus = sub.status === 'active' ? 'cancelled' : 'active'
    await supabase.from('subscriptions').update({ status: newStatus }).eq('id', sub.id)
    toast.success(`Subscription ${newStatus}`)
    loadUsers()
  }

  return (
    <AdminLayout title="Users">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-9 text-sm py-2"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center">{filtered.length} users</div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Role', 'Subscription', 'Charity', 'Scores', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const sub = u.subscriptions?.[0]
                  const charity = u.charity_selections?.[0]?.charities
                  const scoreCount = u.golf_scores?.length || 0
                  const isEditing = editUser === u.id

                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="input-field text-xs py-1.5 w-32"
                            value={editForm.full_name}
                            onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-charcoal">{u.full_name}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="input-field text-xs py-1.5 w-24"
                            value={editForm.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                          >
                            <option value="subscriber">subscriber</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {sub.status}
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5 capitalize">{sub.plan} · £{sub.amount}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{charity?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-bold ${scoreCount === 5 ? 'text-forest-600' : 'text-gray-500'}`}>
                          {scoreCount}/5
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(u.id)} className="p-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditUser(null)} className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit2 size={13} className="text-gray-500" />
                            </button>
                            {sub && (
                              <button
                                onClick={() => toggleSubStatus(sub)}
                                className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                              >
                                {sub.status === 'active' ? 'Cancel Sub' : 'Reinstate'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
