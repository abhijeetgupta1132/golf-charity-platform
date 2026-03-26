import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, Heart, Award, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/draws', label: 'Draw Management', icon: Trophy },
  { to: '/admin/charities', label: 'Charities', icon: Heart },
  { to: '/admin/winners', label: 'Winners', icon: Award },
]

export default function AdminLayout({ children, title }) {
  const loc = useLocation()
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sticky top-20">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 px-3 py-2 mb-1">Admin Panel</div>
              {NAV.map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? loc.pathname === to : loc.pathname.startsWith(to) && to !== '/admin' || loc.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                      active ? 'bg-forest-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Link to="/admin" className="hover:text-gray-600">Admin</Link>
                {title && <><ChevronRight size={12} /><span className="text-gray-600">{title}</span></>}
              </div>
              <h1 className="font-display text-2xl font-bold text-charcoal">{title || 'Admin Dashboard'}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
