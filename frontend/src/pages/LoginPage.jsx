import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, LogIn, Users, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const DEMO_CREDS = [
  { username: 'admin', password: 'admin123', role: 'Admin', color: 'blue' },
  { username: 'peneliti', password: 'peneliti123', role: 'Peneliti', color: 'purple' },
  { username: 'viewer', password: 'viewer123', role: 'Penonton', color: 'gray' }
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  const fillCred = (cred) => {
    setUsername(cred.username)
    setPassword(cred.password)
    setError('')
  }

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    gray: 'bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-gray-100'
  }

  const badgeMap = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
                    flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-900/30 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center">
            {/* Logo */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center
                              backdrop-blur-sm border border-white/20">
                <GraduationCap size={40} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-400 rounded-full
                              flex items-center justify-center text-white font-bold text-xs shadow-lg">
                ✓
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">MBG Dashboard</h1>
            <p className="text-blue-100 text-sm font-medium">Analisis Dampak Akademik</p>
            <p className="text-blue-200 text-xs mt-1">Program Makan Bergizi Gratis</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5 text-center">
              Masuk ke Sistem
            </h2>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200
                              text-rose-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder:text-slate-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder:text-slate-400 transition-all bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400
                               hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4
                           bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold
                           rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all
                           disabled:opacity-60 disabled:cursor-not-allowed shadow-sm
                           hover:shadow-blue-200 hover:shadow-md mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Akun Demo
                </p>
              </div>
              <div className="space-y-2">
                {DEMO_CREDS.map((cred) => (
                  <button
                    key={cred.username}
                    onClick={() => fillCred(cred)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border
                                text-left transition-all duration-150 group ${colorMap[cred.color]}`}
                  >
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-md ${badgeMap[cred.color]}`}>
                      {cred.role}
                    </div>
                    <code className="text-xs text-slate-600 flex-1">
                      {cred.username} / {cred.password}
                    </code>
                    <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Gunakan
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              MBG Academic Impact Dashboard &copy; 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
