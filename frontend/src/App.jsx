import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Scores from './pages/Scores'
import Charities from './pages/Charities'
import Subscribe from './pages/Subscribe'
import Draws from './pages/Draws'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDraws from './pages/admin/AdminDraws'
import AdminCharities from './pages/admin/AdminCharities'
import AdminWinners from './pages/admin/AdminWinners'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="skeleton w-16 h-16 rounded-full"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { isAdmin } = useAuth()
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/draws" element={<Draws />} />
          <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/draws" element={<ProtectedRoute adminOnly><AdminDraws /></ProtectedRoute>} />
          <Route path="/admin/charities" element={<ProtectedRoute adminOnly><AdminCharities /></ProtectedRoute>} />
          <Route path="/admin/winners" element={<ProtectedRoute adminOnly><AdminWinners /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#27a061', secondary: '#fff' } }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
