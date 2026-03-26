import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Plus, Edit2, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', category: 'Health', description: '', image_emoji: '💚', website_url: '', active: true }

export default function AdminCharities() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('charities').select('*, charity_selections(count)').order('name')
    setCharities(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    try {
      if (editId) {
        await supabase.from('charities').update(form).eq('id', editId)
        toast.success('Charity updated')
      } else {
        await supabase.from('charities').insert({ ...form, raised_total: 0 })
        toast.success('Charity added')
      }
      setForm(EMPTY); setEditId(null); setShowForm(false); load()
    } catch { toast.error('Save failed') }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this charity? Users with this selected will need to choose again.')) return
    await supabase.from('charities').delete().eq('id', id)
    toast.success('Deleted')
    load()
  }

  async function toggleActive(charity) {
    await supabase.from('charities').update({ active: !charity.active }).eq('id', charity.id)
    load()
  }

  function startEdit(c) {
    setEditId(c.id)
    setForm({ name: c.name, category: c.category, description: c.description || '', image_emoji: c.image_emoji || '💚', website_url: c.website_url || '', active: c.active })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const CATEGORIES = ['Health', 'Environment', 'Hunger', 'Wellness', 'Community', 'Elderly Care', 'Emergency', 'Education', 'Animals', 'Other']

  return (
    <AdminLayout title="Charities">
      <div className="space-y-5">

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-forest-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">{editId ? 'Edit Charity' : 'Add New Charity'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY) }}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Charity Name</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cancer Research UK" />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Emoji Icon</label>
                <input className="input-field" value={form.image_emoji} onChange={e => setForm(f => ({ ...f, image_emoji: e.target.value }))} placeholder="💚" />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input className="input-field" type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this charity's mission..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-forest-600" />
                <label htmlFor="active" className="text-sm text-gray-600">Active (visible to users)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary flex items-center gap-1.5">
                <Check size={14} /> {editId ? 'Save Changes' : 'Add Charity'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY) }} className="btn-outline">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">All Charities</h2>
              <p className="text-xs text-gray-400">{charities.length} total</p>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                <Plus size={14} /> Add Charity
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : charities.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No charities yet. Add your first one!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {charities.map(c => (
                <div key={c.id} className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${!c.active ? 'opacity-50' : ''}`}>
                  <div className="text-2xl shrink-0">{c.image_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.name}</span>
                      {!c.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.category} · £{(c.raised_total || 0).toLocaleString()} raised · {c.charity_selections?.[0]?.count || 0} subscribers</div>
                    {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleActive(c)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={c.active ? 'Hide' : 'Show'}>
                      {c.active ? <Eye size={13} className="text-gray-500" /> : <EyeOff size={13} className="text-gray-400" />}
                    </button>
                    <button onClick={() => startEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Edit2 size={13} className="text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
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
