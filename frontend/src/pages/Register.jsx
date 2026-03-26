import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = form.password.length >= 8 ? (
    /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 'strong' : 'medium'
  ) : form.password.length > 0 ? 'weak' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name)
      toast.success('Account created! Please check your email to verify.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-16 pb-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🌱</div>
          <h1 className="font-display text-3xl font-bold text-charcoal">Create your account</h1>
          <p className="text-gray-500 text-sm mt-2">Start your Fairway For Good journey</p>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-6">
            {['Subscribe', 'Choose Charity', 'Score & Win'].map((step, i) => (
              <div key={step} className="flex-1 text-center">
                <div className="w-6 h-6 bg-forest-600 rounded-full flex items-center justify-center mx-auto mb-1">
                  {i === 0 ? <span className="text-white text-xs font-bold">1</span> : <span className="text-white text-xs">{i + 1}</span>}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">{step}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="John Smith"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="flex gap-1 mt-2">
                  {['weak', 'medium', 'strong'].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${
                      strength === 'strong' ? 'bg-green-500' :
                      strength === 'medium' && s !== 'strong' ? 'bg-yellow-400' :
                      strength === 'weak' && s === 'weak' ? 'bg-red-400' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
              {form.confirm && form.confirm === form.password && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
                  <Check size={12} /> Passwords match
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input type="checkbox" required id="terms" className="mt-0.5 accent-forest-600" />
              <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                I agree to the Terms of Service and Privacy Policy. I understand that 10% of my subscription supports my chosen charity.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-forest-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
