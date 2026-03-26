import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { Search, Heart, Check, ExternalLink, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_CHARITIES = [
  { id: 1, name: "Children's Cancer Fund UK", category: "Health", description: "Supporting children and families affected by cancer across the UK with research funding and direct support services.", raised_total: 124000, image_emoji: "🏥", active: true },
  { id: 2, name: "Ocean Cleanup Project", category: "Environment", description: "Removing plastic pollution from our oceans and rivers to protect marine life and coastal communities.", raised_total: 82000, image_emoji: "🌊", active: true },
  { id: 3, name: "Food Banks UK", category: "Hunger", description: "Providing emergency food and support to people in crisis across the UK's network of food banks.", raised_total: 158000, image_emoji: "🥗", active: true },
  { id: 4, name: "Mental Health UK", category: "Wellness", description: "Championing positive mental health and supporting those affected by mental illness.", raised_total: 61000, image_emoji: "💚", active: true },
  { id: 5, name: "Shelter Housing Charity", category: "Community", description: "Fighting for people's rights and wellbeing, providing advice and support to those without safe homes.", raised_total: 93000, image_emoji: "🏠", active: true },
  { id: 6, name: "Age UK", category: "Elderly Care", description: "Working to make later life the best it can be for everyone by providing services and support.", raised_total: 76000, image_emoji: "❤️", active: true },
  { id: 7, name: "RNLI Lifeboats", category: "Emergency", description: "Saving lives at sea through skilled lifeboat crews, lifeguards, and water safety education.", raised_total: 45000, image_emoji: "🚤", active: true },
  { id: 8, name: "Woodland Trust", category: "Environment", description: "Protecting and restoring ancient woodland and planting trees to create new habitats.", raised_total: 38000, image_emoji: "🌳", active: true },
]

export default function Charities() {
  const { user, profile, refreshProfile } = useAuth()
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(null)

  const selectedCharityId = profile?.charity_selections?.[0]?.charity_id

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('charities').select('*').eq('active', true).order('name')
      setCharities(data?.length ? data : DEMO_CHARITIES)
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['All', ...new Set(charities.map(c => c.category))]
  const filtered = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCat = category === 'All' || c.category === category
    return matchesSearch && matchesCat
  })

  async function handleSelect(charityId) {
    if (!user) { toast.error('Please sign in to select a charity'); return }
    setSelecting(charityId)
    try {
      const existing = profile?.charity_selections?.[0]
      if (existing) {
        await supabase.from('charity_selections').update({ charity_id: charityId }).eq('user_id', user.id)
      } else {
        await supabase.from('charity_selections').insert({ user_id: user.id, charity_id: charityId, contribution_percentage: 10 })
      }
      await refreshProfile()
      toast.success('Charity selected! 10% of your subscription will go here.')
    } catch (err) {
      toast.error('Failed to update charity selection')
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="section-tag mx-auto">Supporting Good Causes</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-charcoal">
            Choose your <span className="gradient-text">charity</span>
          </h1>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            At least 10% of every subscription goes directly to your chosen charity. Increase it any time.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search charities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">No charities found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(charity => {
              const isSelected = selectedCharityId === charity.id
              const isSelecting = selecting === charity.id
              return (
                <div key={charity.id} className={`card hover:shadow-md transition-all cursor-pointer group relative ${
                  isSelected ? 'ring-2 ring-forest-500 border-forest-300' : ''
                }`}>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-forest-600 rounded-full flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="text-4xl mb-3">{charity.image_emoji || '💚'}</div>
                  <div className="inline-block text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full mb-2">{charity.category}</div>
                  <h3 className="font-display font-bold text-charcoal text-base leading-tight mb-2 group-hover:text-forest-700 transition-colors">
                    {charity.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{charity.description}</p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>Total raised</span>
                      <span className="font-mono font-semibold text-forest-600">
                        £{(charity.raised_total || 0).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSelect(charity.id)}
                      disabled={isSelecting || isSelected}
                      className={`w-full py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-forest-100 text-forest-700 cursor-default'
                          : 'bg-forest-600 text-white hover:bg-forest-700 active:scale-95'
                      }`}
                    >
                      {isSelecting ? (
                        <Loader size={14} className="animate-spin" />
                      ) : isSelected ? (
                        <><Check size={14} /> Your Charity</>
                      ) : (
                        <><Heart size={14} /> Select</>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
